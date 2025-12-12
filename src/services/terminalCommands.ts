/**
 * Terminal Shell Commands
 *
 * Implements bash-like shell commands including:
 * - which: Locate commands
 * - env: Display environment variables
 * - export: Set environment variables
 * - echo: Print text (with redirection support)
 * - history: Show command history
 * - Pipe and redirection operators
 */

import { Terminal as XTerm } from '@xterm/xterm';
import { terminalSessionService } from './terminalSession';
import { fileSystem } from './filesystem';

export class TerminalCommands {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * which - Locate a command
   * Usage: which <command>
   */
  async handleWhichCommand(args: string[], xterm: XTerm): Promise<void> {
    if (args.length === 0) {
      xterm.writeln('which: missing command name');
      xterm.writeln('usage: which <command>');
      return;
    }

    const command = args[0];

    // Check if it's a built-in command
    const builtins = [
      'ls', 'pwd', 'cd', 'mkdir', 'rm', 'mv', 'cp', 'cat', 'touch', 'nano',
      'vi', 'vim', 'echo', 'clear', 'help', 'which', 'env', 'export', 'history',
      'git', 'claude'
    ];

    if (builtins.includes(command)) {
      xterm.writeln(`${command}: shell built-in command`);
      return;
    }

    // Check WebContainer commands
    const webContainerCommands = ['node', 'npm', 'pnpm', 'yarn'];
    if (webContainerCommands.includes(command)) {
      xterm.writeln(`/usr/local/bin/${command}`);
      return;
    }

    xterm.writeln(`${command}: command not found`);
  }

  /**
   * env - Display environment variables
   * Usage: env [VAR=value] [command]
   */
  async handleEnvCommand(args: string[], xterm: XTerm): Promise<void> {
    if (args.length === 0) {
      // Display all environment variables
      const env = terminalSessionService.getAllEnv(this.sessionId);
      const sorted = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));

      for (const [key, value] of sorted) {
        xterm.writeln(`${key}=${value}`);
      }
      return;
    }

    // Parse VAR=value assignments and command
    const assignments: Record<string, string> = {};
    let commandIndex = 0;

    for (let i = 0; i < args.length; i++) {
      if (args[i].includes('=')) {
        const [key, ...valueParts] = args[i].split('=');
        assignments[key] = valueParts.join('=');
        commandIndex = i + 1;
      } else {
        break;
      }
    }

    if (Object.keys(assignments).length > 0 && commandIndex < args.length) {
      // Run command with temporary environment variables
      xterm.writeln('env: temporary environment variables not yet implemented');
      xterm.writeln('Use export to set permanent variables');
    } else if (Object.keys(assignments).length > 0) {
      // Just set the variables
      for (const [key, value] of Object.entries(assignments)) {
        terminalSessionService.setEnv(this.sessionId, key, value);
        xterm.writeln(`${key}=${value}`);
      }
    }
  }

  /**
   * export - Set environment variable
   * Usage: export VAR=value
   */
  async handleExportCommand(args: string[], xterm: XTerm): Promise<void> {
    if (args.length === 0) {
      // Display all exported variables (same as env)
      const env = terminalSessionService.getAllEnv(this.sessionId);
      const sorted = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));

      for (const [key, value] of sorted) {
        xterm.writeln(`export ${key}="${value}"`);
      }
      return;
    }

    // Parse VAR=value
    for (const arg of args) {
      if (arg.includes('=')) {
        const [key, ...valueParts] = arg.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes

        terminalSessionService.setEnv(this.sessionId, key, value);
        xterm.writeln(`Exported ${key}=${value}`);
      } else {
        // Export existing variable (mark for export)
        const value = terminalSessionService.getEnv(this.sessionId, arg);
        if (value !== undefined) {
          xterm.writeln(`export ${arg}="${value}"`);
        } else {
          xterm.writeln(`export: ${arg}: not found`);
        }
      }
    }
  }

  /**
   * echo - Print text
   * Usage: echo [text...]
   * Supports: echo "text" > file.txt
   *          echo "text" >> file.txt
   */
  async handleEchoCommand(args: string[], xterm: XTerm): Promise<void> {
    let text = args.join(' ');

    // Replace environment variables
    text = this.expandEnvironmentVariables(text);

    // Check for redirection
    const redirectionMatch = text.match(/(.*?)\s*(>>?)\s*(.+)$/);

    if (redirectionMatch) {
      const [, content, operator, filePath] = redirectionMatch;
      const cleanContent = content.trim().replace(/^["']|["']$/g, '');
      const cleanPath = filePath.trim();

      try {
        if (operator === '>') {
          // Overwrite file
          const result = await fileSystem.writeFile(cleanPath, cleanContent + '\n');
          if (!result.success) {
            xterm.writeln(`echo: ${result.error}`);
          }
        } else if (operator === '>>') {
          // Append to file
          const readResult = await fileSystem.readFile(cleanPath);
          const existingContent = readResult.success ? readResult.data : '';
          const newContent = existingContent + cleanContent + '\n';

          const result = await fileSystem.writeFile(cleanPath, newContent);
          if (!result.success) {
            xterm.writeln(`echo: ${result.error}`);
          }
        }
      } catch (error: any) {
        xterm.writeln(`echo: ${error.message}`);
      }
    } else {
      // Just print to terminal
      const cleanText = text.replace(/^["']|["']$/g, '');
      xterm.writeln(cleanText);
    }
  }

  /**
   * history - Show command history
   * Usage: history [n]
   */
  async handleHistoryCommand(args: string[], xterm: XTerm): Promise<void> {
    const session = terminalSessionService.getCurrentSession();
    const history = session.commandHistory;

    const count = args.length > 0 ? parseInt(args[0], 10) : history.length;
    const start = Math.max(0, history.length - count);

    for (let i = start; i < history.length; i++) {
      xterm.writeln(`  ${i + 1}  ${history[i]}`);
    }
  }

  /**
   * Expand environment variables in text
   * Replaces $VAR and ${VAR} with their values
   */
  private expandEnvironmentVariables(text: string): string {
    return text.replace(/\$\{?([A-Z_][A-Z0-9_]*)\}?/g, (match, varName) => {
      const value = terminalSessionService.getEnv(this.sessionId, varName);
      return value !== undefined ? value : match;
    });
  }

  /**
   * Parse command with pipes and redirection
   * Returns array of commands to execute in sequence
   */
  parsePipeline(commandLine: string): {
    commands: Array<{
      command: string;
      args: string[];
      stdin?: string;
      stdout?: { type: 'file' | 'pipe'; target: string; append?: boolean };
      stderr?: { type: 'file'; target: string; append?: boolean };
      background?: boolean;
    }>;
  } {
    const commands: any[] = [];

    // Check for background process (&)
    const background = commandLine.trim().endsWith('&');
    if (background) {
      commandLine = commandLine.trim().slice(0, -1).trim();
    }

    // Split by pipe (|)
    const pipeline = commandLine.split('|').map(s => s.trim());

    for (let i = 0; i < pipeline.length; i++) {
      const segment = pipeline[i];
      const cmd: any = {
        background: background && i === pipeline.length - 1, // Only last command can be background
      };

      // Parse redirections
      let workingSegment = segment;

      // Output redirection (> or >>)
      const stdoutMatch = workingSegment.match(/(.+?)\s*(>>?)\s*(.+)$/);
      if (stdoutMatch) {
        const [, cmdPart, operator, filePath] = stdoutMatch;
        workingSegment = cmdPart.trim();
        cmd.stdout = {
          type: 'file' as const,
          target: filePath.trim(),
          append: operator === '>>',
        };
      }

      // Input redirection (<)
      const stdinMatch = workingSegment.match(/(.+?)\s*<\s*(.+)$/);
      if (stdinMatch) {
        const [, cmdPart, filePath] = stdinMatch;
        workingSegment = cmdPart.trim();
        cmd.stdin = filePath.trim();
      }

      // Error redirection (2> or 2>>)
      const stderrMatch = workingSegment.match(/(.+?)\s*2(>>?)\s*(.+)$/);
      if (stderrMatch) {
        const [, cmdPart, operator, filePath] = stderrMatch;
        workingSegment = cmdPart.trim();
        cmd.stderr = {
          type: 'file' as const,
          target: filePath.trim(),
          append: operator === '>>',
        };
      }

      // Parse command and arguments
      const parts = workingSegment.trim().split(/\s+/);
      cmd.command = parts[0];
      cmd.args = parts.slice(1);

      // Pipe to next command
      if (i < pipeline.length - 1) {
        cmd.stdout = { type: 'pipe' as const, target: 'next' };
      }

      commands.push(cmd);
    }

    return { commands };
  }

  /**
   * Execute a pipeline of commands
   */
  async executePipeline(
    commandLine: string,
    xterm: XTerm,
    executeSimpleCommand: (cmd: string, args: string[], xterm: XTerm) => Promise<string | void>
  ): Promise<void> {
    const { commands } = this.parsePipeline(commandLine);

    if (commands.length === 0) return;

    // For now, implement simple pipe support (command1 | command2)
    if (commands.length === 1) {
      // Single command with possible redirection
      const cmd = commands[0];

      // Handle input redirection
      if (cmd.stdin) {
        const result = await fileSystem.readFile(cmd.stdin);
        if (!result.success || !result.data) {
          xterm.writeln(`${cmd.command}: ${cmd.stdin}: ${result.error || 'cannot open file'}`);
          return;
        }
        // Input data would be passed to command execution
        // For now, this is a placeholder for future stdin pipe implementation
      }

      // Execute command (this would need to pass inputData somehow)
      const output = await executeSimpleCommand(cmd.command, cmd.args, xterm);

      // Handle output redirection
      if (cmd.stdout && cmd.stdout.type === 'file' && typeof output === 'string') {
        const result = await this.writeToFile(cmd.stdout.target, output, cmd.stdout.append);
        if (!result.success) {
          xterm.writeln(`${cmd.command}: ${result.error}`);
        }
      }

      // Handle error redirection (would need separate stderr handling)
      // TODO: Implement stderr redirection

      // Handle background process
      if (cmd.background) {
        xterm.writeln(`[1] ${Date.now()} (running in background)`);
        // TODO: Actually run in background
      }
    } else {
      // Multiple commands in pipeline
      xterm.writeln('Pipe operator (|) not fully implemented yet');
      xterm.writeln('Basic command execution only for now');
    }
  }

  /**
   * Write content to file (with append option)
   */
  private async writeToFile(
    filePath: string,
    content: string,
    append: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let finalContent = content;

      if (append) {
        const readResult = await fileSystem.readFile(filePath);
        if (readResult.success && readResult.data) {
          finalContent = readResult.data + content;
        }
      }

      return await fileSystem.writeFile(filePath, finalContent);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
