/**
 * Browser IDE - Claude CLI Service
 *
 * WebContainer-based implementation of Claude Code CLI
 * Provides terminal-like experience in browser environment
 *
 * SECURITY: All command execution goes through the webContainer singleton
 * which enforces command allowlists and argument sanitization.
 */

import { webContainer } from '@/services/webcontainer';
import { fileSystem } from '@/services/filesystem';
import { ClaudeCodeAgent, createGLMAgent, createAnthropicAgent } from '@/services/claude-agent';
import { logger } from '@/utils/logger';

export interface CLIOptions {
  provider: 'anthropic' | 'glm';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  workingDirectory?: string;
  /** Callback for confirming dangerous operations */
  onConfirmDangerous?: (operation: string, details: string) => Promise<boolean>;
  /** Callback for continuing after errors */
  onContinueAfterError?: (error: string) => Promise<boolean>;
}

/**
 * Dangerous operations that require confirmation
 */
const DANGEROUS_OPERATIONS = {
  // File operations
  'rm': 'Delete files or directories',
  'rm -rf': 'Force delete directories and all contents',
  'rmdir': 'Remove empty directory',

  // Git operations
  'git push --force': 'Force push to remote (may overwrite history)',
  'git push -f': 'Force push to remote (may overwrite history)',
  'git reset --hard': 'Reset working directory (discard all changes)',
  'git clean -fd': 'Delete all untracked files and directories',
  'git branch -D': 'Force delete branch',
  'git rebase': 'Rebase commits (may rewrite history)',

  // NPM operations
  'npm uninstall': 'Uninstall packages',
  'npm cache clean': 'Clean npm cache',

  // System operations
  'kill': 'Terminate processes',
  'pkill': 'Terminate processes by name',
  'killall': 'Terminate all processes with given name',

  // Build/Dist operations
  'rm -rf node_modules': 'Delete node_modules directory',
  'rm -rf dist': 'Delete dist directory',
};

export interface CLICommand {
  command: string;
  args: string[];
  options: Record<string, string>;
}

export interface CLIResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  artifacts?: {
    filesCreated?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
    commandsExecuted?: string[];
  };
}

/**
 * Browser-based Claude CLI Service
 * Uses the shared webContainer singleton for all process execution,
 * ensuring all commands go through the security layer.
 */
export class ClaudeCLIService {
  private agent: ClaudeCodeAgent | null = null;
  private workingDirectory: string = '/workspace';
  private environment: Record<string, string> = {};
  private history: string[] = [];
  private isInitialized = false;

  constructor(private options: CLIOptions = { provider: 'anthropic' }) {
    this.workingDirectory = options.workingDirectory || '/workspace';
  }

  /**
   * Initialize CLI environment using the shared WebContainer singleton
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing CLI environment via shared WebContainer...');

      // Boot the shared WebContainer singleton (no-op if already booted)
      const bootResult = await webContainer.boot();
      if (!bootResult.success) {
        throw new Error(`WebContainer boot failed: ${bootResult.error}`);
      }

      // Setup environment
      this.environment = {
        SHELL: '/bin/bash',
        TERM: 'xterm-256color',
        HOME: '/workspace',
        USER: 'browser-ide',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        ...this.getProviderEnvironment()
      };

      // Write initial workspace files through the secure singleton
      try {
        await webContainer.writeFile('/workspace/.gitignore', `node_modules/
dist/
.env
*.log`);
      } catch (writeError) {
        // Directory might not exist yet, will be created when needed
        logger.info('Could not write .gitignore during init, will create when needed');
      }

      // Initialize git repository through the secure spawn
      try {
        await this.runAndWait('git', ['init', '-q']);
        await this.runAndWait('git', ['config', 'user.name', 'Browser IDE User']);
        await this.runAndWait('git', ['config', 'user.email', 'user@browser-ide.local']);
        await this.runAndWait('git', ['add', '.']);
        await this.runAndWait('git', ['commit', '-m', 'Initial commit', '--quiet']);
      } catch {
        // Git initialization might fail if git is not available
        logger.info('Git initialization failed, continuing without git');
      }

      // Initialize Claude agent
      await this.initializeAgent();

      this.isInitialized = true;
      logger.info('CLI environment initialized');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize CLI environment:', message);
      throw new Error(`CLI initialization failed: ${message}`);
    }
  }

  /**
   * Get provider-specific environment variables
   */
  private getProviderEnvironment(): Record<string, string> {
    switch (this.options.provider) {
      case 'anthropic':
        return {
          ANTHROPIC_API_KEY: this.options.apiKey || '',
          ANTHROPIC_BASE_URL: this.options.baseUrl || 'https://api.anthropic.com',
          CLAUDE_PROVIDER: 'anthropic'
        };
      case 'glm':
        return {
          GLM_API_KEY: this.options.apiKey || '',
          GLM_BASE_URL: this.options.baseUrl || 'https://api.z.ai/api/anthropic',
          CLAUDE_PROVIDER: 'glm'
        };
      default:
        return {};
    }
  }

  /**
   * Initialize Claude agent with appropriate provider
   */
  private async initializeAgent(): Promise<void> {
    if (!this.options.apiKey) {
      logger.info('No API key provided, some features may be limited');
      return;
    }

    try {
      if (this.options.provider === 'anthropic') {
        this.agent = createAnthropicAgent(this.options.apiKey, this.options.baseUrl);
      } else if (this.options.provider === 'glm') {
        this.agent = createGLMAgent(this.options.apiKey, this.options.baseUrl);
      }

      if (this.agent) {
        this.agent.setWorkingDirectory(this.workingDirectory);
        logger.info(`Claude agent initialized with ${this.options.provider} provider`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize Claude agent:', message);
    }
  }

  /**
   * Helper: spawn a command through the secure singleton and wait for exit
   */
  private async runAndWait(command: string, args: string[] = []): Promise<{ output: string; exitCode: number }> {
    const result = await webContainer.spawn(command, args, { cwd: this.workingDirectory });
    if (!result.success || !result.process) {
      throw new Error(result.error || `Failed to spawn ${command}`);
    }

    const output = await this.collectProcessOutput(result.process);
    const exitCode = await result.exit!;
    return { output, exitCode };
  }

  /**
   * Check if a command is dangerous and requires confirmation
   */
  private isDangerousOperation(command: string, args: string[]): { dangerous: boolean; description?: string } {
    const fullCommand = `${command} ${args.slice(0, 2).join(' ')}`.trim();

    // Check exact matches first
    if (DANGEROUS_OPERATIONS[fullCommand as keyof typeof DANGEROUS_OPERATIONS]) {
      return {
        dangerous: true,
        description: DANGEROUS_OPERATIONS[fullCommand as keyof typeof DANGEROUS_OPERATIONS]
      };
    }

    // Check if command starts with a dangerous pattern
    for (const [pattern, description] of Object.entries(DANGEROUS_OPERATIONS)) {
      if (fullCommand.startsWith(pattern) || pattern.startsWith(fullCommand)) {
        return { dangerous: true, description };
      }
    }

    // Special checks for rm with specific targets
    if (command === 'rm' && args.some(arg => arg.startsWith('-') && arg.includes('f'))) {
      return { dangerous: true, description: 'Force delete files (cannot be undone)' };
    }

    // Special checks for git reset/rebase
    if (command === 'git' && args.includes('reset') && args.includes('--hard')) {
      return { dangerous: true, description: 'Reset working directory (discard all changes)' };
    }
    if (command === 'git' && args.includes('clean') && args.includes('-fd')) {
      return { dangerous: true, description: 'Delete all untracked files' };
    }

    return { dangerous: false };
  }

  /**
   * Execute a command in the WebContainer through the security layer
   */
  async executeCommand(command: string, args: string[] = []): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check for dangerous operations
    const { dangerous, description } = this.isDangerousOperation(command, args);
    if (dangerous && this.options.onConfirmDangerous) {
      const fullCommand = `${command} ${args.join(' ')}`;
      const confirmed = await this.options.onConfirmDangerous(fullCommand, description || 'Dangerous operation');
      if (!confirmed) {
        return {
          success: false,
          error: 'Operation cancelled by user',
          exitCode: 130 // Standard exit code for Ctrl+C
        };
      }
    }

    this.history.push(`${command} ${args.join(' ')}`);

    try {
      logger.info(`$ ${command} ${args.join(' ')}`);

      const { output, exitCode } = await this.runAndWait(command, args);

      return {
        success: exitCode === 0,
        output,
        exitCode
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message,
        exitCode: 1
      };
    }
  }

  /**
   * Execute a task using Claude agent with streaming support
   */
  async executeTask(task: string, options: {
    onText?: (text: string) => void;
    onToolUse?: (toolName: string, toolInput: Record<string, unknown>) => void;
    onToolResult?: (toolName: string, result: string) => void;
    onProgress?: (message: string) => void;
    onError?: (error: string) => void;
    onOutput?: (output: string) => void;
  } = {}): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    logger.info(`Executing task: ${task}`);

    if (!this.agent) {
      return {
        success: false,
        error: 'Claude agent not initialized. Please provide API key.'
      };
    }

    try {
      const result = await this.agent.executeTask(task, {
        onText: (text: string) => {
          options.onText?.(text);
          options.onOutput?.(text);
        },
        onToolUse: (toolName: string, toolInput: Record<string, unknown>) => {
          options.onToolUse?.(toolName, toolInput);
          options.onProgress?.(`Using ${toolName}`);
        },
        onToolResult: (toolName: string, result: string) => {
          options.onToolResult?.(toolName, result);
          options.onProgress?.(`${toolName} completed`);
        },
        onProgress: (message: string) => {
          options.onProgress?.(message);
          logger.info(`Task progress: ${message}`);
        },
        onError: (error: string) => {
          options.onError?.(error);
          logger.warn(`Task error: ${error}`);
        }
      });

      // Sync file changes through the secure webContainer singleton
      if (result.artifacts) {
        await this.syncArtifacts(result.artifacts);
      }

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        artifacts: result.artifacts
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Sync artifacts from LightningFS to the shared WebContainer filesystem
   */
  private async syncArtifacts(artifacts: {
    filesCreated?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
  }): Promise<void> {
    const { filesCreated, filesModified } = artifacts;

    try {
      // Sync created files
      if (filesCreated?.length) {
        for (const filePath of filesCreated) {
          const result = await fileSystem.readFile(filePath);
          if (result.success && result.data) {
            await webContainer.writeFile(filePath, result.data);
          }
        }
      }

      // Sync modified files
      if (filesModified?.length) {
        for (const filePath of filesModified) {
          const result = await fileSystem.readFile(filePath);
          if (result.success && result.data) {
            await webContainer.writeFile(filePath, result.data);
          }
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to sync artifacts to WebContainer:', message);
    }
  }

  /**
   * Get current workspace status
   */
  async getStatus(): Promise<{
    workingDirectory: string;
    gitStatus?: { isRepo: boolean; branch?: string; clean?: boolean; files?: { status: string; path: string }[]; error?: string };
    files: { name: string; path: string; type: string; size?: number; children?: unknown[] }[];
    environment: Record<string, string>;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get file listing via fileSystem service
      const files = await this.getWorkspaceFiles();

      // Get git status through the secure spawn
      let gitStatus: { isRepo: boolean; branch?: string; clean?: boolean; files?: { status: string; path: string }[]; error?: string } | undefined;
      try {
        const statusResult = await this.runAndWait('git', ['status', '--porcelain']);

        if (statusResult.exitCode === 0) {
          const branchResult = await this.runAndWait('git', ['branch', '--show-current']);

          gitStatus = {
            isRepo: true,
            branch: branchResult.output.trim(),
            clean: statusResult.output.trim().length === 0,
            files: statusResult.output.trim().split('\n').filter(line => line.trim()).map(line => ({
              status: line.substring(0, 2),
              path: line.substring(3)
            }))
          };
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        gitStatus = { isRepo: false, error: message };
      }

      return {
        workingDirectory: this.workingDirectory,
        gitStatus,
        files,
        environment: this.environment
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get status: ${message}`);
    }
  }

  /**
   * Get workspace files using the fileSystem service
   */
  private async getWorkspaceFiles(): Promise<{ name: string; path: string; type: string; size?: number; children?: unknown[] }[]> {
    try {
      const entries = await fileSystem.readDir(this.workingDirectory);

      return entries
        .filter(entry => !entry.name.startsWith('.'))
        .map(entry => ({
          name: entry.name,
          path: entry.path,
          type: entry.type,
          size: entry.size,
          ...(entry.type === 'directory' ? { children: [] } : {})
        }));
    } catch {
      return [];
    }
  }

  /**
   * Collect all output from a WebContainer process
   */
  private async collectProcessOutput(process: { output: ReadableStream<string> }): Promise<string> {
    const output: string[] = [];
    const reader = process.output.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    return output.join('');
  }

  /**
   * Initialize a new project
   */
  async initProject(projectType: string = 'basic'): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info(`Initializing ${projectType} project...`);

      let commands: string[][] = [];

      switch (projectType) {
        case 'react':
          commands = [
            ['npm', 'init', '-y'],
            ['npm', 'install', 'react', 'react-dom'],
            ['mkdir', '-p', 'src'],
            ['touch', 'src/App.jsx', 'src/index.js', 'public/index.html']
          ];
          break;
        case 'node':
          commands = [
            ['npm', 'init', '-y'],
            ['touch', 'index.js', 'README.md']
          ];
          break;
        default:
          commands = [
            ['touch', 'README.md', '.gitignore']
          ];
          break;
      }

      for (const [command, ...args] of commands) {
        const result = await this.executeCommand(command, args);
        if (!result.success) {
          return {
            success: false,
            error: `Failed to execute: ${command} ${args.join(' ')} - ${result.error}`
          };
        }
      }

      return {
        success: true,
        output: `${projectType} project initialized successfully`,
        artifacts: {
          filesCreated: commands.map(([, ...args]) => args[0]).filter(Boolean)
        }
      };

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Get command history
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Set environment variable
   */
  setEnvironment(key: string, value: string): void {
    this.environment[key] = value;
  }

  /**
   * Get environment variable
   */
  getEnvironment(key?: string): string | Record<string, string> {
    if (key) {
      return this.environment[key] || '';
    }
    return { ...this.environment };
  }

  /**
   * Change working directory (validated via fileSystem service)
   */
  async changeDirectory(path: string): Promise<void> {
    try {
      const statResult = await fileSystem.stats(path);
      if (!statResult.success || !statResult.data || statResult.data.type !== 'directory') {
        throw new Error(`${path} is not a valid directory`);
      }

      this.workingDirectory = path;
      this.environment.PWD = path;

      if (this.agent) {
        this.agent.setWorkingDirectory(path);
      }

      logger.info(`Changed to directory: ${path}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to change directory: ${message}`);
    }
  }

  /**
   * Clean up resources
   * Note: We do NOT teardown the shared webContainer singleton here,
   * as other parts of the application may still be using it.
   */
  async cleanup(): Promise<void> {
    this.agent = null;
    this.isInitialized = false;
    logger.info('CLI service cleaned up');
  }

  /**
   * Get available shell commands (mirrors the webContainer allowlist)
   */
  getAvailableCommands(): string[] {
    return [
      'ls', 'cat', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv',
      'echo', 'grep', 'find', 'wc', 'head', 'tail', 'sort', 'uniq',
      'git', 'npm', 'npx', 'pnpm', 'node', 'python', 'python3',
      'curl', 'wget', 'tar', 'zip', 'unzip', 'chmod',
      'make', 'cargo', 'go', 'javac', 'java', 'gcc', 'g++'
    ];
  }
}

/**
 * Create a new CLI service instance
 */
export function createCLIService(options: CLIOptions = { provider: 'anthropic' }): ClaudeCLIService {
  return new ClaudeCLIService(options);
}
