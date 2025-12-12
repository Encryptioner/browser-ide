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

    // Start new boot process
    this.bootPromise = (async () => {
      try {
        this.instance = await WebContainer.boot();
        console.log('✅ WebContainer booted successfully');

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

    try {
      const process = await this.instance!.spawn(command, args, options);

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

export const webContainer = new WebContainerService();
