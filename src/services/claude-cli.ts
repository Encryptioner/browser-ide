/**
 * Browser IDE Pro - Claude CLI Service
 *
 * WebContainer-based implementation of Claude Code CLI
 * Provides terminal-like experience in browser environment
 */

import { WebContainer } from '@webcontainer/api';
import { fileSystem } from './filesystem';
import { gitService } from './git';
import { ClaudeCodeAgent, createGLMAgent, createAnthropicAgent } from './claude-agent';

export interface CLIOptions {
  provider: 'anthropic' | 'glm';
  apiKey?: string;
  model?: string;
  workingDirectory?: string;
}

export interface CLICommand {
  command: string;
  args: string[];
  options: Record<string, any>;
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
  };
}

/**
 * Browser-based Claude CLI Service
 * Simulates Claude Code CLI using WebContainers and browser APIs
 */
export class ClaudeCLIService {
  private webContainer: WebContainer | null = null;
  private agent: ClaudeCodeAgent | null = null;
  private workingDirectory: string = '/workspace';
  private environment: Record<string, string> = {};
  private history: string[] = [];
  private isInitialized = false;

  constructor(private options: CLIOptions = { provider: 'anthropic' }) {
    this.workingDirectory = options.workingDirectory || '/workspace';
  }

  /**
   * Initialize WebContainer and CLI environment
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing WebContainer environment...');

      // Initialize WebContainer
      this.webContainer = await WebContainer.boot();

      // Setup environment
      this.environment = {
        SHELL: '/bin/bash',
        TERM: 'xterm-256color',
        HOME: '/workspace',
        USER: 'browser-ide',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        ...this.getProviderEnvironment()
      };

      // Set working directory
      await this.webContainer!.fs.writeFile('/workspace/.gitignore', `node_modules/
dist/
.env
*.log`);

      // Initialize git repository
      try {
        await this.webContainer!.spawn('git', ['init', '-q']);
        await this.webContainer!.spawn('git', ['config', 'user.name', 'Browser IDE User']);
        await this.webContainer!.spawn('git', ['config', 'user.email', 'user@browser-ide.local']);
        await this.webContainer!.spawn('git', ['add', '.']);
        await this.webContainer!.spawn('git', ['commit', '-m', 'Initial commit', '--quiet']);
      } catch (error) {
        // Git initialization might fail if git is not available
        console.log('⚠️ Git initialization failed, continuing without git');
      }

      // Initialize Claude agent
      await this.initializeAgent();

      this.isInitialized = true;
      console.log('✅ WebContainer environment initialized');

    } catch (error) {
      console.error('❌ Failed to initialize WebContainer:', error);
      throw error;
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
          ANTHROPIC_BASE_URL: 'https://api.anthropic.com',
          CLAUDE_PROVIDER: 'anthropic'
        };
      case 'glm':
        return {
          GLM_API_KEY: this.options.apiKey || '',
          GLM_BASE_URL: 'https://api.z.ai/api/anthropic',
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
      console.log('⚠️ No API key provided, some features may be limited');
      return;
    }

    try {
      if (this.options.provider === 'anthropic') {
        this.agent = createAnthropicAgent(this.options.apiKey);
      } else if (this.options.provider === 'glm') {
        this.agent = createGLMAgent(this.options.apiKey);
      }

      if (this.agent) {
        this.agent.setWorkingDirectory(this.workingDirectory);
        console.log(`✅ Claude agent initialized with ${this.options.provider} provider`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Claude agent:', error);
    }
  }

  /**
   * Execute a command in the WebContainer
   */
  async executeCommand(command: string, args: string[] = []): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.history.push(`${command} ${args.join(' ')}`);

    try {
      console.log(`$ ${command} ${args.join(' ')}`);

      const process = await this.webContainer!.spawn(command, args);
      const output: string[] = [];

      process.output.subscribe({
        onOutput: (data) => {
          const text = new TextDecoder().decode(data);
          output.push(text);
          process.stdout?.write(text);
        },
        onError: (error) => {
          console.error('Command error:', error);
        }
      });

      const exitCode = await process.exit;
      const duration = Date.now() - startTime;
      const result = output.join('');

      return {
        success: exitCode === 0,
        output: result,
        exitCode,
        artifacts: {
          commandsExecuted: [`${command} ${args.join(' ')}`]
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        exitCode: 1
      };
    }
  }

  /**
   * Execute a task using Claude agent
   */
  async executeTask(task: string, options: {
    onProgress?: (message: string) => void;
    onOutput?: (output: string) => void;
  } = {}): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`🎯 Executing task: ${task}`);

    if (!this.agent) {
      return {
        success: false,
        error: 'Claude agent not initialized. Please provide API key.'
      };
    }

    try {
      const result = await this.agent.executeTask(task, (message) => {
        options.onProgress?.(message);
        console.log(`🔧 ${message}`);
      });

      // Sync file changes to WebContainer if needed
      if (result.artifacts) {
        await this.syncArtifacts(result.artifacts);
      }

      return {
        success: result.success,
        output: result.output,
        error: result.error,
        artifacts: result.artifacts
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync artifacts from filesystem to WebContainer
   */
  private async syncArtifacts(artifacts: any): Promise<void> {
    const { filesCreated, filesModified } = artifacts;

    try {
      // Sync created files
      if (filesCreated?.length) {
        for (const filePath of filesCreated) {
          const result = await fileSystem.readFile(filePath);
          if (result.success && result.data) {
            await this.webContainer!.fs.writeFile(filePath, result.data);
          }
        }
      }

      // Sync modified files
      if (filesModified?.length) {
        for (const filePath of filesModified) {
          const result = await fileSystem.readFile(filePath);
          if (result.success && result.data) {
            await this.webContainer!.fs.writeFile(filePath, result.data);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync artifacts to WebContainer:', error);
    }
  }

  /**
   * Get current workspace status
   */
  async getStatus(): Promise<{
    workingDirectory: string;
    gitStatus?: any;
    files: any[];
    environment: Record<string, string>;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get file listing
      const files = await this.getWorkspaceFiles();

      // Get git status
      let gitStatus;
      try {
        const gitProcess = await this.webContainer!.spawn('git', ['status', '--porcelain']);
        const statusOutput = await this.collectProcessOutput(gitProcess);
        const exitCode = await gitProcess.exit;

        if (exitCode === 0) {
          const branchProcess = await this.webContainer!.spawn('git', ['branch', '--show-current']);
          const branchOutput = await this.collectProcessOutput(branchProcess);
          await branchProcess.exit;

          gitStatus = {
            isRepo: true,
            branch: branchOutput.trim(),
            clean: statusOutput.trim().length === 0,
            files: statusOutput.trim().split('\n').filter(line => line.trim()).map(line => ({
              status: line.substring(0, 2),
              path: line.substring(3)
            }))
          };
        }
      } catch (error) {
        gitStatus = { isRepo: false, error: error.message };
      }

      return {
        workingDirectory: this.workingDirectory,
        gitStatus,
        files,
        environment: this.environment
      };

    } catch (error: any) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  /**
   * Get workspace files
   */
  private async getWorkspaceFiles(): Promise<any[]> {
    try {
      const files: any[] = [];
      await this.buildFileTree('/', files);
      return files;
    } catch (error) {
      return [];
    }
  }

  /**
   * Build file tree recursively
   */
  private async buildFileTree(path: string, files: any[]): Promise<void> {
    try {
      const entries = await this.webContainer!.fs.readdir(path);

      for (const entry of entries) {
        const fullPath = path === '/' ? `/${entry}` : `${path}/${entry}`;

        try {
          const stat = await this.webContainer!.fs.stat(fullPath);

          if (entry !== '.' && entry !== '..' && !entry.startsWith('.')) {
            if (stat.isFile()) {
              files.push({
                name: entry,
                path: fullPath,
                type: 'file',
                size: stat.size
              });
            } else if (stat.isDirectory()) {
              files.push({
                name: entry,
                path: fullPath,
                type: 'directory',
                children: []
              });
              await this.buildFileTree(fullPath, files[files.length - 1].children);
            }
          }
        } catch (error) {
          // Skip files that can't be accessed
        }
      }
    } catch (error) {
      // Directory can't be read
    }
  }

  /**
   * Collect all output from a process
   */
  private async collectProcessOutput(process: any): Promise<string> {
    const output: string[] = [];

    return new Promise((resolve) => {
      process.output.subscribe({
        onOutput: (data: Uint8Array) => {
          output.push(new TextDecoder().decode(data));
        },
        onDone: () => {
          resolve(output.join(''));
        }
      });
    });
  }

  /**
   * Initialize a new project
   */
  async initProject(projectType: string = 'basic'): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🚀 Initializing ${projectType} project...`);

      let commands = [];

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
          filesCreated: commands.map(([cmd, ...args]) => args[0]).filter(Boolean)
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute shell script
   */
  async executeScript(script: string): Promise<CLIResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Write script to file
      const scriptPath = '/tmp/claude-script.sh';
      await this.webContainer!.fs.writeFile(scriptPath, script);
      await this.webContainer!.spawn('chmod', ['+x', scriptPath]);

      // Execute script
      const process = await this.webContainer!.spawn(scriptPath, []);
      const output = await this.collectProcessOutput(process);
      const exitCode = await process.exit;

      // Cleanup
      await this.webContainer!.fs.rm(scriptPath);

      return {
        success: exitCode === 0,
        output,
        exitCode,
        artifacts: {
          commandsExecuted: [`script: ${script.substring(0, 50)}...`]
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message
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
   * Change working directory
   */
  async changeDirectory(path: string): Promise<void> {
    try {
      const stat = await this.webContainer!.fs.stat(path);
      if (stat.isDirectory()) {
        this.workingDirectory = path;
        this.environment.PWD = path;

        if (this.agent) {
          this.agent.setWorkingDirectory(path);
        }

        console.log(`📁 Changed to directory: ${path}`);
      } else {
        throw new Error(`${path} is not a directory`);
      }
    } catch (error: any) {
      throw new Error(`Failed to change directory: ${error.message}`);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.webContainer) {
      try {
        this.webContainer.teardown();
        console.log('🧹 WebContainer cleaned up');
      } catch (error) {
        console.error('❌ Failed to cleanup WebContainer:', error);
      }
    }

    this.webContainer = null;
    this.agent = null;
    this.isInitialized = false;
  }

  /**
   * Get available shell commands
   */
  getAvailableCommands(): string[] {
    return [
      'ls', 'cat', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cp', 'mv',
      'echo', 'grep', 'find', 'wc', 'head', 'tail', 'sort', 'uniq',
      'git', 'npm', 'node', 'python', 'python3', 'java', 'gcc', 'make',
      'curl', 'wget', 'tar', 'gzip', 'zip', 'unzip',
      'ps', 'top', 'kill', 'killall', 'df', 'du', 'free', 'uptime'
    ];
  }
}

/**
 * Create a new CLI service instance
 */
export function createCLIService(options: CLIOptions = { provider: 'anthropic' }): ClaudeCLIService {
  return new ClaudeCLIService(options);
}