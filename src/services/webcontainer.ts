import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import type { WebContainerProcess as WCProcessType } from '@webcontainer/api';

export interface WebContainerResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ProcessResult {
  success: boolean;
  process?: WCProcessType;
  processId?: string;
  output?: ReadableStream;
  exit?: Promise<number>;
  error?: string;
}

/**
 * Command allowlist for WebContainer spawn
 * These are the only commands allowed to run for security reasons
 */
const ALLOWED_COMMANDS = new Set([
  // Node.js
  'node',
  'npm',
  'npx',
  'pnpm',
  'yarn',
  'bun',

  // Python
  'python',
  'python3',
  'pip',
  'pip3',

  // Git
  'git',

  // Shell built-ins (available in most shells)
  'ls',
  'cd',
  'pwd',
  'cat',
  'echo',
  'mkdir',
  'rm',
  'rmdir',
  'touch',
  'cp',
  'mv',
  'head',
  'tail',
  'grep',
  'find',
  'wc',
  'sort',
  'uniq',
  'xargs',

  // Utilities
  'curl',
  'wget',
  'tar',
  'zip',
  'unzip',
  'chmod',
  'chown',

  // Editors (often needed)
  'nano',
  'vim',
  'vi',

  // Build tools
  'make',
  'cmake',
  'cargo',
  'rustc',
  'go',
  'javac',
  'java',
  'gcc',
  'g++',
  'clang',
  'clang++',
]);

/**
 * Check if a command is in the allowlist
 */
function isCommandAllowed(command: string): boolean {
  // Check base command (without path)
  const baseCommand = command.split('/').pop() || command;
  return ALLOWED_COMMANDS.has(baseCommand);
}

/**
 * Sanitize command arguments to prevent injection
 * Removes dangerous shell operators and characters
 */
function sanitizeArguments(args: string[]): string[] {
  const dangerousPatterns = [
    ';',       // Command separator
    '|',       // Pipe
    '&',       // Background or command chaining
    '&&',      // AND operator
    '||',      // OR operator
    '>',       // Output redirect
    '>>',      // Append redirect
    '<',       // Input redirect
    '`',       // Command substitution
    '$(',      // Command substitution
    '\n',      // Newline (command separator)
    '\r',      // Carriage return
    '\t',      // Tab
    '\\',      // Escape character (can be dangerous in combinations)
  ];

  return args.filter(arg => {
    // Check if argument contains dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (arg.includes(pattern)) {
        return false;
      }
    }
    // Check for environment variable assignment at start
    if (arg.startsWith('=')) {
      return false;
    }
    return true;
  });
}

class WebContainerService {
  private instance: WebContainer | null = null;
  private serverUrl: string | null = null;
  private processes = new Map<string, WCProcessType>();
  private bootPromise: Promise<WebContainerResult<WebContainer>> | null = null;

  async boot(): Promise<WebContainerResult<WebContainer>> {
    // If already booted, return existing instance
    if (this.instance) {
      return { success: true, data: this.instance };
    }

    // If currently booting, wait for that to complete
    if (this.bootPromise) {
      return this.bootPromise;
    }

    // Check for required COOP/COEP headers
    if (typeof window !== 'undefined' && !window.crossOriginIsolated) {
      const errorMsg = 'WebContainers require COOP/COEP headers (Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp). ' +
        'GitHub Pages does not support these headers. Please use a hosting provider that supports custom headers like Netlify, Vercel, or Cloudflare Pages. ' +
        'See: https://webcontainers.io/guides/coop-coep';

      console.error('❌ WebContainer Error:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }

    // Start new boot process
    this.bootPromise = (async () => {
      try {
        this.instance = await WebContainer.boot({ coep: 'credentialless' });
        console.log('✅ WebContainer booted successfully (credentialless mode)');

        // Listen for server events
        this.instance.on('server-ready', (port, url) => {
          console.log('🚀 Server ready on port', port, ':', url);
          this.serverUrl = url;
        });

        this.instance.on('error', (error) => {
          console.error('❌ WebContainer error:', error);
        });

        return { success: true, data: this.instance };
      } catch (error) {
        console.error('❌ Failed to boot WebContainer:', error);
        this.bootPromise = null; // Reset on error
        return { success: false, error: String(error) };
      } finally {
        this.bootPromise = null; // Clear promise after completion
      }
    })();

    return this.bootPromise;
  }

  async mountFiles(fileTree: FileSystemTree): Promise<WebContainerResult<void>> {
    if (!this.instance) {
      const result = await this.boot();
      if (!result.success) return { success: false, error: result.error };
    }

    try {
      await this.instance!.mount(fileTree);
      console.log('📁 Files mounted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to mount files:', error);
      return { success: false, error: String(error) };
    }
  }

  async writeFile(path: string, content: string): Promise<WebContainerResult<void>> {
    if (!this.instance) {
      const result = await this.boot();
      if (!result.success) return { success: false, error: result.error };
    }

    try {
      await this.instance!.fs.writeFile(path, content);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to write file:', error);
      return { success: false, error: String(error) };
    }
  }

  async readFile(path: string): Promise<WebContainerResult<string>> {
    if (!this.instance) {
      return { success: false, error: 'WebContainer not booted' };
    }

    try {
      const content = await this.instance.fs.readFile(path, 'utf-8');
      return { success: true, data: content };
    } catch (error) {
      console.error('❌ Failed to read file:', error);
      return { success: false, error: String(error) };
    }
  }

  async spawn(
    command: string,
    args: string[] = [],
    options: { cwd?: string; env?: Record<string, string> } = {}
  ): Promise<ProcessResult> {
    if (!this.instance) {
      const result = await this.boot();
      if (!result.success) return { success: false, error: result.error };
    }

    // Security: Check if command is allowed
    if (!isCommandAllowed(command)) {
      const error = `Command "${command}" is not allowed for security reasons. ` +
        `Allowed commands: ${Array.from(ALLOWED_COMMANDS).sort().join(', ')}`;
      console.error(`❌ ${error}`);
      return { success: false, error };
    }

    // Security: Sanitize arguments
    const sanitizedArgs = sanitizeArguments(args);
    if (sanitizedArgs.length !== args.length) {
      const filtered = args.filter((_, i) => !sanitizedArgs.includes(args[i]));
      console.warn(`⚠️ Filtered potentially dangerous arguments:`, filtered);
    }

    try {
      const process = await this.instance!.spawn(command, sanitizedArgs, options);

      const processId = `${command}-${Date.now()}`;
      this.processes.set(processId, process);

      return {
        success: true,
        process,
        processId,
        output: process.output,
        exit: process.exit,
      };
    } catch (error) {
      console.error(`❌ Failed to spawn ${command}:`, error);
      return { success: false, error: String(error) };
    }
  }

  async install(): Promise<ProcessResult> {
    console.log('📦 Installing dependencies...');
    const result = await this.spawn('pnpm', ['install']);

    if (result.success && result.process) {
      // Stream output to console
      result.process.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log(data);
          },
        })
      );

      await result.process.exit;
      console.log('✅ Dependencies installed');
    }

    return result;
  }

  async run(script = 'dev'): Promise<ProcessResult> {
    console.log(`🚀 Running pnpm run ${script}...`);
    const result = await this.spawn('pnpm', ['run', script]);

    if (result.success && result.process) {
      // Stream output
      result.process.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log(data);
          },
        })
      );
    }

    return result;
  }

  async exec(command: string): Promise<ProcessResult> {
    console.log(`⚡ Executing: ${command}`);
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    return this.spawn(cmd, args);
  }

  getServerUrl(): string | null {
    return this.serverUrl;
  }

  getInstance(): WebContainer | null {
    return this.instance;
  }

  // Alias for spawn - for backwards compatibility with terminal tabs
  async spawnProcess(
    command: string,
    args: string[] = [],
    options: { cwd?: string; env?: Record<string, string> } = {}
  ): Promise<ProcessResult> {
    return this.spawn(command, args, options);
  }

  // Send input to a process's stdin
  async sendInput(processId: string, input: string): Promise<boolean> {
    const process = this.processes.get(processId);
    if (process && process.input) {
      const writer = process.input.getWriter();
      await writer.write(input);
      writer.releaseLock();
      return true;
    }
    return false;
  }

  killProcess(processId: string): boolean {
    const process = this.processes.get(processId);
    if (process) {
      process.kill();
      this.processes.delete(processId);
      return true;
    }
    return false;
  }

  killAllProcesses(): void {
    for (const [, process] of this.processes.entries()) {
      process.kill();
    }
    this.processes.clear();
  }

  isBooted(): boolean {
    // Only return true if instance exists AND not currently booting
    return this.instance !== null && this.bootPromise === null;
  }

  async teardown(): Promise<void> {
    if (this.instance) {
      this.killAllProcesses();
      await this.instance.teardown();
      this.instance = null;
      this.serverUrl = null;
      console.log('🛑 WebContainer torn down');
    }
  }
}

// Export singleton instance
export const webContainer = new WebContainerService();

// Export functions for testing
export { isCommandAllowed, sanitizeArguments, ALLOWED_COMMANDS };
