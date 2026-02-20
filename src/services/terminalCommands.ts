/**
 * Terminal Command Dispatcher Service
 *
 * Handles all command execution for the terminal component.
 * Commands are dispatched to the appropriate handler based on the command name.
 * Output is written via a callback interface, keeping this service decoupled from xterm.
 *
 * Supported command groups:
 * - Shell commands: ls, cd, pwd, mkdir, rm, mv, cp, cat, touch, clear, help, echo, which, env, export, history
 * - Git commands: status, branch, checkout, add, commit, log, push, pull, reset, diff, remote, config
 * - Claude AI commands: claude <task>
 * - Background process management: jobs, fg
 * - WebContainer passthrough for node/npm/pnpm and other commands
 */

import { fileSystem } from '@/services/filesystem';
import { gitService } from '@/services/git';
import { webContainer } from '@/services/webcontainer';
import { useIDEStore } from '@/store/useIDEStore';
import { createGLMAgent, createAnthropicAgent } from '@/services/claude-agent';
import type { ClaudeCodeAgent } from '@/services/claude-agent';
import type { Settings } from '@/store/useIDEStore';
import { terminalSessionService } from '@/services/terminalSession';
import { logger } from '@/utils/logger';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

/** Callback interface for writing output to the terminal. */
export interface TerminalWriter {
  /** Write a line (appends \r\n). */
  writeln(text: string): void;
  /** Write raw text (no newline appended). */
  write(text: string): void;
  /** Clear the terminal screen. */
  clear(): void;
}

/** Tracks a background process. */
export interface BackgroundJob {
  processId: string;
  command: string;
  startTime: number;
  exit: Promise<number>;
}

/** Callbacks the component must supply so the service can trigger UI-only actions. */
export interface TerminalCallbacks {
  /** Open the nano editor with the given file path and content. */
  openNano: (filePath: string, content: string) => void;
}

/** Result of a command dispatch. If `handled` is false the caller should run it via WebContainer. */
interface DispatchResult {
  handled: boolean;
}

/** Ref-like mutable container (compatible with React's MutableRefObject). */
interface MutableRef<T> {
  current: T;
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getSettings(): Settings {
  return useIDEStore.getState().settings;
}

/**
 * Parse stderr redirection (2> / 2>>) from a command string.
 */
export function parseStderrRedirection(command: string): {
  cleanedCommand: string;
  stderrRedirect: string | null;
  append: boolean;
} {
  const stderrMatch = command.match(/(.+?)\s*2(>>?)\s*(\S+)$/);
  if (stderrMatch) {
    const [, cmdPart, operator, filePath] = stderrMatch;
    return {
      cleanedCommand: cmdPart.trim(),
      stderrRedirect: filePath,
      append: operator === '>>',
    };
  }
  return { cleanedCommand: command, stderrRedirect: null, append: false };
}

/**
 * Parse the background operator (&) from the end of a command.
 */
export function parseBackgroundOperator(command: string): {
  cleanedCommand: string;
  isBackground: boolean;
} {
  const trimmed = command.trim();
  if (trimmed.endsWith('&')) {
    return { cleanedCommand: trimmed.slice(0, -1).trim(), isBackground: true };
  }
  return { cleanedCommand: command, isBackground: false };
}

/**
 * Write content to a file, optionally appending.
 */
async function writeStderrToFile(
  filePath: string,
  content: string,
  append: boolean,
): Promise<boolean> {
  try {
    let finalContent = content;
    if (append) {
      const readResult = await fileSystem.readFile(filePath);
      if (readResult.success && readResult.data) {
        finalContent = readResult.data + content;
      }
    }
    const result = await fileSystem.writeFile(filePath, finalContent);
    return result.success;
  } catch (error) {
    logger.error('Failed to write stderr to file:', error);
    return false;
  }
}

// --------------------------------------------------------------------------
// Shell command handlers
// --------------------------------------------------------------------------

async function handleLs(args: string[], w: TerminalWriter): Promise<void> {
  void args; // reserved for future path arg
  const result = await fileSystem.listCurrentDirectory();
  if (result.success && result.data) {
    for (const item of result.data) {
      const icon = item.type === 'directory' ? '\u{1F4C1}' : '\u{1F4C4}';
      const name = item.type === 'directory' ? `${item.name}/` : item.name;
      w.writeln(`${icon} ${name}`);
    }
  } else {
    w.writeln(`ls: ${result.error || 'failed to list directory'}`);
  }
}

async function handlePwd(_args: string[], w: TerminalWriter): Promise<void> {
  w.writeln(fileSystem.getCurrentWorkingDirectory());
}

async function handleCd(args: string[], w: TerminalWriter): Promise<void> {
  const path = args.length === 0 ? '/' : args[0];
  const result = await fileSystem.changeDirectory(path);
  if (result.success) {
    w.writeln(`Changed to directory: ${result.data}`);
  } else {
    w.writeln(`cd: ${result.error}`);
  }
}

async function handleMkdir(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length === 0) {
    w.writeln('mkdir: missing operand');
    return;
  }
  const result = await fileSystem.createDirectory(args[0]);
  if (result.success) {
    w.writeln(`Created directory: ${args[0]}`);
  } else {
    w.writeln(`mkdir: ${result.error}`);
  }
}

async function handleRm(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length === 0) {
    w.writeln('rm: missing operand');
    return;
  }
  const result = await fileSystem.deletePath(args[0]);
  if (result.success) {
    w.writeln(`Removed: ${args[0]}`);
  } else {
    w.writeln(`rm: ${result.error}`);
  }
}

async function handleMv(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length < 2) {
    w.writeln('mv: missing file operand');
    w.writeln('usage: mv <source> <destination>');
    return;
  }
  const [source, dest] = args;
  const readResult = await fileSystem.readFile(source);
  if (!readResult.success) {
    w.writeln(`mv: ${readResult.error}`);
    return;
  }
  const writeResult = await fileSystem.writeFile(dest, readResult.data!);
  if (!writeResult.success) {
    w.writeln(`mv: ${writeResult.error}`);
    return;
  }
  const deleteResult = await fileSystem.deletePath(source);
  if (!deleteResult.success) {
    w.writeln(`mv: warning - could not remove source: ${deleteResult.error}`);
  }
  w.writeln(`Moved: ${source} -> ${dest}`);
}

async function handleCp(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length < 2) {
    w.writeln('cp: missing file operand');
    w.writeln('usage: cp <source> <destination>');
    return;
  }
  const [source, dest] = args;
  const readResult = await fileSystem.readFile(source);
  if (!readResult.success) {
    w.writeln(`cp: ${readResult.error}`);
    return;
  }
  const writeResult = await fileSystem.writeFile(dest, readResult.data!);
  if (!writeResult.success) {
    w.writeln(`cp: ${writeResult.error}`);
    return;
  }
  w.writeln(`Copied: ${source} -> ${dest}`);
}

async function handleCat(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length === 0) {
    w.writeln('cat: missing file operand');
    return;
  }
  const result = await fileSystem.readFile(args[0]);
  if (result.success && result.data) {
    const lines = result.data.split('\n');
    for (const line of lines) {
      w.writeln(line);
    }
  } else {
    w.writeln(`cat: ${result.error}`);
  }
}

async function handleTouch(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length === 0) {
    w.writeln('touch: missing file operand');
    return;
  }
  const result = await fileSystem.writeFile(args[0], '');
  if (result.success) {
    w.writeln(`Created file: ${args[0]}`);
  } else {
    w.writeln(`touch: ${result.error}`);
  }
}

async function handleNano(
  args: string[],
  w: TerminalWriter,
  callbacks: TerminalCallbacks,
): Promise<void> {
  if (args.length === 0) {
    w.writeln('nano: missing file operand');
    return;
  }
  const fileName = args[0];
  try {
    const fileResult = await fileSystem.readFile(fileName);
    const content = fileResult.success && fileResult.data ? fileResult.data : '';
    callbacks.openNano(fileName, content);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    w.writeln(`nano: ${msg}`);
  }
}

function printHelp(w: TerminalWriter): void {
  w.writeln('Available commands:');
  w.writeln('');
  w.writeln('File System:');
  w.writeln('  ls [path]              - List directory contents');
  w.writeln('  pwd                     - Show current directory');
  w.writeln('  cd [path]              - Change directory');
  w.writeln('  mkdir <dir>             - Create directory');
  w.writeln('  rm <path>               - Remove file or directory');
  w.writeln('  mv <src> <dest>         - Move/rename file');
  w.writeln('  cp <src> <dest>         - Copy file');
  w.writeln('  cat <file>              - Display file contents');
  w.writeln('  touch <file>             - Create empty file');
  w.writeln('  nano <file>             - Simple text editor');
  w.writeln('');
  w.writeln('Claude Code:');
  w.writeln('  claude <task>          - AI-powered coding assistant');
  w.writeln('                          Examples:');
  w.writeln('                            claude "Create React component"');
  w.writeln('                            claude "Fix TypeScript errors"');
  w.writeln('                            claude "Refactor this function"');
  w.writeln('                          Configure API key in Settings > AI Provider');
  w.writeln('');
  w.writeln('Git:');
  w.writeln('  git status              - Show working tree status');
  w.writeln('  git branch              - List branches');
  w.writeln('  git branch <name>       - Create new branch');
  w.writeln('  git checkout <name>     - Switch branches');
  w.writeln('  git add <file>          - Stage file');
  w.writeln('  git add .               - Stage all files');
  w.writeln('  git commit -m "msg"     - Commit changes');
  w.writeln('  git log                 - Show commit history');
  w.writeln('  git push                - Push to remote');
  w.writeln('  git pull                - Pull from remote');
  w.writeln('  git reset [<file>]      - Unstage file(s)');
  w.writeln('  git diff <file>         - Show file changes');
  w.writeln('  git remote [-v]         - List remotes');
  w.writeln('  git config <key> [val]  - Get/set config');
  w.writeln('');
  w.writeln('WebContainer:');
  w.writeln('  clear    - Clear terminal');
  w.writeln('  help     - Show this help');
  w.writeln('  node     - Run Node.js');
  w.writeln('  npm      - Node package manager');
  w.writeln('  pnpm     - Fast npm alternative');
  w.writeln('');
  w.writeln('Use \u2191/\u2193 arrows to navigate command history');
  w.writeln('Use Ctrl+C to cancel running command');
}

// --------------------------------------------------------------------------
// Git command handler
// --------------------------------------------------------------------------

async function handleGitCommand(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length === 0) {
    w.writeln('usage: git <command> [<args>]');
    w.writeln('');
    w.writeln('Common git commands:');
    w.writeln('   status       Show working tree status');
    w.writeln('   branch       List, create branches');
    w.writeln('   checkout     Switch branches');
    w.writeln('   add          Add file contents to staging');
    w.writeln('   commit       Record changes to repository');
    w.writeln('   log          Show commit logs');
    w.writeln('   push         Push to remote');
    w.writeln('   pull         Pull from remote');
    w.writeln('   reset        Unstage changes');
    w.writeln('   diff         Show file changes');
    w.writeln('   remote       Manage remotes');
    w.writeln('   config       Get/set configuration');
    return;
  }

  const subcommand = args[0];
  const subargs = args.slice(1);
  const cwd = fileSystem.getCurrentWorkingDirectory();

  try {
    switch (subcommand) {
      case 'status': {
        const status = await gitService.statusMatrix(cwd);
        if (status.length === 0) {
          w.writeln('nothing to commit, working tree clean');
        } else {
          w.writeln('Changes:');
          for (const file of status) {
            const statusChar =
              file.status === 'added' ? 'A' :
              file.status === 'modified' ? 'M' :
              file.status === 'deleted' ? 'D' :
              file.status === 'unmodified' ? ' ' : '?';
            w.writeln(`  ${statusChar}  ${file.path}`);
          }
        }
        break;
      }

      case 'branch': {
        if (subargs.length === 0) {
          const result = await gitService.listBranches(cwd);
          if (result.success && result.data) {
            for (const branch of result.data) {
              const marker = branch.current ? '* ' : '  ';
              w.writeln(`${marker}${branch.name}`);
            }
          } else {
            w.writeln(`error: ${result.error}`);
          }
        } else {
          const branchName = subargs[0];
          const result = await gitService.createBranch(branchName, cwd);
          if (result.success) {
            w.writeln(`Created branch '${branchName}'`);
          } else {
            w.writeln(`error: ${result.error}`);
          }
        }
        break;
      }

      case 'checkout': {
        if (subargs.length === 0) {
          w.writeln('error: missing branch name');
        } else {
          const branchName = subargs[0];
          const result = await gitService.checkout(branchName, cwd);
          if (result.success) {
            w.writeln(`Switched to branch '${branchName}'`);
          } else {
            w.writeln(`error: ${result.error}`);
          }
        }
        break;
      }

      case 'add': {
        if (subargs.length === 0) {
          w.writeln('error: missing file path');
        } else if (subargs[0] === '.') {
          const result = await gitService.addAll(cwd);
          if (result.success) {
            w.writeln('Added all changes');
          } else {
            w.writeln(`error: ${result.error}`);
          }
        } else {
          const filepath = subargs[0];
          const result = await gitService.add(filepath, cwd);
          if (result.success) {
            w.writeln(`Added '${filepath}'`);
          } else {
            w.writeln(`error: ${result.error}`);
          }
        }
        break;
      }

      case 'commit': {
        const mIndex = subargs.indexOf('-m');
        if (mIndex === -1 || mIndex === subargs.length - 1) {
          w.writeln('error: missing commit message (use -m "message")');
        } else {
          const message = subargs[mIndex + 1];
          const currentSettings = getSettings();
          const author = {
            name: currentSettings.githubUsername || 'Browser IDE User',
            email: currentSettings.githubEmail || 'user@browser-ide.dev',
          };
          const result = await gitService.commit(message, author, cwd);
          if (result.success && result.data) {
            w.writeln(`[${result.data.substring(0, 7)}] ${message}`);
          } else {
            w.writeln(`error: ${result.error}`);
          }
        }
        break;
      }

      case 'log': {
        const commits = await gitService.log(cwd, 10);
        if (commits.length === 0) {
          w.writeln('No commits yet');
        } else {
          for (const commit of commits) {
            w.writeln(`commit ${commit.oid}`);
            w.writeln(`Author: ${commit.author.name} <${commit.author.email}>`);
            const date = new Date(commit.author.timestamp * 1000);
            w.writeln(`Date:   ${date.toISOString()}`);
            w.writeln('');
            w.writeln(`    ${commit.message}`);
            w.writeln('');
          }
        }
        break;
      }

      case 'push': {
        const currentSettings = getSettings();
        const token = currentSettings.githubToken;
        logger.info('\u{1F50D} Push - Token check:', {
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPrefix: token?.substring(0, 7),
        });
        if (!token) {
          w.writeln('error: No GitHub token configured');
          w.writeln('Please set token in Settings > Git Settings');
        } else {
          w.writeln('Pushing to remote...');
          const result = await gitService.push(token, 'origin', undefined, cwd);
          if (result.success && result.data) {
            w.writeln(`\u2705 Successfully pushed branch '${result.data}' to origin`);
          } else {
            w.writeln(`error: ${result.error}`);
          }
        }
        break;
      }

      case 'pull': {
        const currentSettings = getSettings();
        const token = currentSettings.githubToken;
        logger.info('\u{1F50D} Pull - Token check:', {
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPrefix: token?.substring(0, 7),
        });
        if (!token) {
          w.writeln('error: No GitHub token configured');
          w.writeln('Please set token in Settings > Git Settings');
        } else {
          w.writeln('Pulling from remote...');
          const result = await gitService.pull(token, 'origin', undefined, cwd);
          if (result.success && result.data) {
            w.writeln(`\u2705 Successfully pulled branch '${result.data}' from origin`);
          } else {
            w.writeln(`error: ${result.error}`);
          }
        }
        break;
      }

      case 'reset': {
        if (subargs.length === 0) {
          const result = await gitService.resetFiles(cwd);
          if (result.success) {
            w.writeln('Unstaged all changes');
          } else {
            w.writeln(`error: ${result.error}`);
          }
        } else {
          const filepath = subargs[0] === 'HEAD' ? subargs[1] : subargs[0];
          if (!filepath) {
            w.writeln('error: missing file path');
          } else {
            const result = await gitService.resetFiles(cwd, [filepath]);
            if (result.success) {
              w.writeln(`Unstaged '${filepath}'`);
            } else {
              w.writeln(`error: ${result.error}`);
            }
          }
        }
        break;
      }

      case 'diff': {
        if (subargs.length === 0) {
          w.writeln('usage: git diff <file>');
        } else {
          const filepath = subargs[0];
          const result = await gitService.diff(cwd, filepath);
          if (result.success && result.data) {
            w.writeln(result.data);
          } else {
            w.writeln(`error: ${result.error || 'No changes'}`);
          }
        }
        break;
      }

      case 'remote': {
        const remotes = await gitService.listRemotes(cwd);
        if (remotes.length === 0) {
          w.writeln('No remotes configured');
        } else {
          const verbose = subargs.includes('-v');
          for (const { remote, url } of remotes) {
            if (verbose) {
              w.writeln(`${remote}\t${url} (fetch)`);
              w.writeln(`${remote}\t${url} (push)`);
            } else {
              w.writeln(remote);
            }
          }
        }
        break;
      }

      case 'config': {
        if (subargs.length === 0) {
          w.writeln('usage: git config <key> [<value>]');
        } else {
          const key = subargs[0];
          if (subargs.length === 1) {
            const value = await gitService.getConfig(key, cwd);
            if (value) {
              w.writeln(value);
            } else {
              w.writeln(`No value set for '${key}'`);
            }
          } else {
            const value = subargs.slice(1).join(' ');
            const result = await gitService.setConfig(key, value, cwd);
            if (result.success) {
              w.writeln(`Set ${key} = ${value}`);
            } else {
              w.writeln(`error: ${result.error}`);
            }
          }
        }
        break;
      }

      default:
        w.writeln(`git: '${subcommand}' is not a git command. See 'git --help'.`);
        w.writeln('');
        w.writeln('Supported commands:');
        w.writeln('  status, branch, checkout, add, commit, log');
        w.writeln('  push, pull, reset, diff, remote, config');
        break;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    w.writeln(`error: ${msg}`);
  }
}

// --------------------------------------------------------------------------
// Claude AI command handler
// --------------------------------------------------------------------------

async function handleClaudeCommand(args: string[], w: TerminalWriter): Promise<void> {
  const settings = getSettings();
  const apiKey = settings.ai.glmKey || settings.ai.anthropicKey;

  if (!apiKey) {
    w.writeln('error: No AI API key configured');
    w.writeln('Please set API key in Settings > AI Provider Settings');
    return;
  }

  if (args.length === 0) {
    w.writeln('usage: claude <task-description>');
    w.writeln('');
    w.writeln('Examples:');
    w.writeln('  claude "Create a React component for user login"');
    w.writeln('  claude "Fix the TypeScript errors in src/main.ts"');
    w.writeln('  claude "Add error handling to the fetch function"');
    w.writeln('  claude "Refactor this code to use modern JavaScript"');
    return;
  }

  const task = args.join(' ');

  try {
    w.writeln('\u{1F916} Claude Code Agent starting...');
    w.writeln(`Task: ${task}`);
    w.writeln('');

    const agent: ClaudeCodeAgent = settings.ai.glmKey
      ? createGLMAgent(apiKey)
      : createAnthropicAgent(apiKey);

    agent.setWorkingDirectory(fileSystem.getCurrentWorkingDirectory());

    const result = await agent.executeTask(task, (progress) => {
      w.writeln(`\u{1F4CB} ${progress}`);
    });

    if (result.success) {
      w.writeln('');
      w.writeln('\u2705 Task completed successfully!');
      if (result.output) {
        w.writeln('');
        w.writeln('Output:');
        w.writeln(result.output);
      }
      if (result.artifacts) {
        if (result.artifacts.filesCreated?.length) {
          w.writeln('');
          w.writeln(`\u{1F4C1} Files created: ${result.artifacts.filesCreated.join(', ')}`);
        }
        if (result.artifacts.filesModified?.length) {
          w.writeln('');
          w.writeln(`\u{1F4DD} Files modified: ${result.artifacts.filesModified.join(', ')}`);
        }
        if (result.artifacts.commandsExecuted?.length) {
          w.writeln('');
          w.writeln(`\u26A1 Commands executed: ${result.artifacts.commandsExecuted.join(', ')}`);
        }
      }
    } else {
      w.writeln('');
      w.writeln('\u274C Task failed:');
      w.writeln(result.error || 'Unknown error');
    }
  } catch (error: unknown) {
    w.writeln('');
    const msg = error instanceof Error ? error.message : String(error);
    w.writeln(`\u274C Claude agent error: ${msg}`);
  }
}

// --------------------------------------------------------------------------
// Additional shell commands (which, env, export, echo, history)
// --------------------------------------------------------------------------

async function handleWhichCommand(args: string[], w: TerminalWriter): Promise<void> {
  if (args.length === 0) {
    w.writeln('which: missing command name');
    w.writeln('usage: which <command>');
    return;
  }
  const command = args[0];
  const builtins = [
    'ls', 'pwd', 'cd', 'mkdir', 'rm', 'mv', 'cp', 'cat', 'touch', 'nano',
    'vi', 'vim', 'echo', 'clear', 'help', 'which', 'env', 'export', 'history',
    'git', 'claude',
  ];
  if (builtins.includes(command)) {
    w.writeln(`${command}: shell built-in command`);
    return;
  }
  const webContainerCommands = ['node', 'npm', 'pnpm', 'yarn'];
  if (webContainerCommands.includes(command)) {
    w.writeln(`/usr/local/bin/${command}`);
    return;
  }
  w.writeln(`${command}: command not found`);
}

async function handleEnvCommand(
  args: string[],
  w: TerminalWriter,
  sessionId: string,
): Promise<void> {
  if (args.length === 0) {
    const env = terminalSessionService.getAllEnv(sessionId);
    const sorted = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sorted) {
      w.writeln(`${key}=${value}`);
    }
    return;
  }
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
    w.writeln('env: temporary environment variables not yet implemented');
    w.writeln('Use export to set permanent variables');
  } else if (Object.keys(assignments).length > 0) {
    for (const [key, value] of Object.entries(assignments)) {
      terminalSessionService.setEnv(sessionId, key, value);
      w.writeln(`${key}=${value}`);
    }
  }
}

async function handleExportCommand(
  args: string[],
  w: TerminalWriter,
  sessionId: string,
): Promise<void> {
  if (args.length === 0) {
    const env = terminalSessionService.getAllEnv(sessionId);
    const sorted = Object.entries(env).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of sorted) {
      w.writeln(`export ${key}="${value}"`);
    }
    return;
  }
  for (const arg of args) {
    if (arg.includes('=')) {
      const [key, ...valueParts] = arg.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      terminalSessionService.setEnv(sessionId, key, value);
      w.writeln(`Exported ${key}=${value}`);
    } else {
      const value = terminalSessionService.getEnv(sessionId, arg);
      if (value !== undefined) {
        w.writeln(`export ${arg}="${value}"`);
      } else {
        w.writeln(`export: ${arg}: not found`);
      }
    }
  }
}

function expandEnvironmentVariables(text: string, sessionId: string): string {
  return text.replace(/\$\{?([A-Z_][A-Z0-9_]*)\}?/g, (match, varName) => {
    const value = terminalSessionService.getEnv(sessionId, varName);
    return value !== undefined ? value : match;
  });
}

async function handleEchoCommand(
  args: string[],
  w: TerminalWriter,
  sessionId: string,
): Promise<void> {
  let text = args.join(' ');
  text = expandEnvironmentVariables(text, sessionId);

  const redirectionMatch = text.match(/(.*?)\s*(>>?)\s*(.+)$/);
  if (redirectionMatch) {
    const [, content, operator, filePath] = redirectionMatch;
    const cleanContent = content.trim().replace(/^["']|["']$/g, '');
    const cleanPath = filePath.trim();
    try {
      if (operator === '>') {
        const result = await fileSystem.writeFile(cleanPath, cleanContent + '\n');
        if (!result.success) {
          w.writeln(`echo: ${result.error}`);
        }
      } else if (operator === '>>') {
        const readResult = await fileSystem.readFile(cleanPath);
        const existingContent = readResult.success ? readResult.data : '';
        const newContent = existingContent + cleanContent + '\n';
        const result = await fileSystem.writeFile(cleanPath, newContent);
        if (!result.success) {
          w.writeln(`echo: ${result.error}`);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      w.writeln(`echo: ${msg}`);
    }
  } else {
    const cleanText = text.replace(/^["']|["']$/g, '');
    w.writeln(cleanText);
  }
}

async function handleHistoryCommand(
  args: string[],
  w: TerminalWriter,
): Promise<void> {
  const session = terminalSessionService.getCurrentSession();
  const history = session.commandHistory;
  const count = args.length > 0 ? parseInt(args[0], 10) : history.length;
  const start = Math.max(0, history.length - count);
  for (let i = start; i < history.length; i++) {
    w.writeln(`  ${i + 1}  ${history[i]}`);
  }
}

// --------------------------------------------------------------------------
// Background job commands
// --------------------------------------------------------------------------

function handleJobsCommand(
  w: TerminalWriter,
  backgroundProcesses: Map<number, BackgroundJob>,
): void {
  const jobs = Array.from(backgroundProcesses.entries());
  if (jobs.length === 0) {
    w.writeln('No background jobs running.');
    return;
  }
  w.writeln(`[1] ${jobs.length} job${jobs.length > 1 ? 's' : ''}:`);
  for (const [jobId, job] of jobs) {
    const runtime = Date.now() - job.startTime;
    w.writeln(`[${jobId}] ${job.command} (running, ${Math.round(runtime / 1000)}s)`);
  }
}

async function handleFgCommand(
  args: string[],
  w: TerminalWriter,
  backgroundProcesses: Map<number, BackgroundJob>,
  setCurrentProcess: (id: string | null) => void,
): Promise<void> {
  const jobId = args.length > 0 ? parseInt(args[0].replace(/^%/, ''), 10) : 1;
  const job = backgroundProcesses.get(jobId);
  if (!job) {
    w.writeln(`fg: no such job ${jobId}`);
    return;
  }
  backgroundProcesses.delete(jobId);
  w.writeln(`[${jobId}] ${job.command} - continuing in foreground...`);
  setCurrentProcess(job.processId);
  try {
    const exitCode = await job.exit;
    setCurrentProcess(null);
    if (exitCode !== 0) {
      w.writeln(`\r\n[${jobId}] Exited with code ${exitCode}`);
    } else {
      w.writeln(`\r\n[${jobId}] Completed successfully`);
    }
  } catch (error: unknown) {
    setCurrentProcess(null);
    const msg = error instanceof Error ? error.message : String(error);
    w.writeln(`\r\n[${jobId}] Error: ${msg}`);
  }
}

// --------------------------------------------------------------------------
// Main dispatcher
// --------------------------------------------------------------------------

export interface ExecuteCommandOptions {
  writer: TerminalWriter;
  callbacks: TerminalCallbacks;
  commandHistory: string[];
  historyIndex: MutableRef<number>;
  backgroundProcesses: Map<number, BackgroundJob>;
  nextJobId: MutableRef<number>;
  currentProcess: MutableRef<string | null>;
  sessionId: string;
}

/**
 * Execute a terminal command. This is the main entry point called by the Terminal component.
 *
 * Returns a promise that resolves when the command completes.
 */
export async function executeCommand(
  command: string,
  opts: ExecuteCommandOptions,
): Promise<void> {
  const { writer: w, callbacks } = opts;

  if (!command.trim()) {
    w.write('\r\n$ ');
    return;
  }

  // jobs command
  if (command.trim() === 'jobs') {
    handleJobsCommand(w, opts.backgroundProcesses);
    w.write('\r\n$ ');
    return;
  }

  // fg command
  if (command.trim().startsWith('fg')) {
    const fgArgs = command.trim().split(/\s+/).slice(1);
    await handleFgCommand(
      fgArgs,
      w,
      opts.backgroundProcesses,
      (id) => { opts.currentProcess.current = id; },
    );
    w.write('\r\n$ ');
    return;
  }

  // Parse background operator
  const { cleanedCommand: bgCleanedCommand, isBackground } = parseBackgroundOperator(command);

  // Parse stderr redirection
  const { cleanedCommand, stderrRedirect, append } = parseStderrRedirection(bgCleanedCommand);
  const stderrBuffer: string[] = [];

  const writeError = (error: string) => {
    if (stderrRedirect) {
      stderrBuffer.push(error);
    } else {
      w.writeln(error);
    }
  };

  // Add to command history
  opts.commandHistory.push(cleanedCommand.trim());
  opts.historyIndex.current = opts.commandHistory.length;

  w.write('\r\n');

  // Parse command
  const parts = cleanedCommand.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    const result = await dispatchBuiltinCommand(cmd, args, w, writeError, callbacks, opts.sessionId);
    if (result.handled) {
      // Flush stderr if needed
      await flushStderr(stderrRedirect, stderrBuffer, append, w);
      w.write('\r\n$ ');
      return;
    }

    // Not a builtin -- run via WebContainer
    if (!webContainer.isBooted()) {
      writeError(`Command "${cmd}" requires WebContainer which is not available.`);
      writeError('Supported without WebContainer: ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, echo, clear, help, git');
      w.write('$ ');
      await flushStderr(stderrRedirect, stderrBuffer, append, w);
      return;
    }

    logger.info('\u2705 Executing command:', cmd, args);
    const spawnResult = await webContainer.spawn(cmd, args);

    if (spawnResult.success && spawnResult.process && spawnResult.processId && spawnResult.exit) {
      const process = spawnResult.process;

      // Background process
      if (isBackground) {
        const jobId = opts.nextJobId.current++;
        opts.backgroundProcesses.set(jobId, {
          processId: spawnResult.processId,
          command: `${cmd} ${args.join(' ')}`,
          startTime: Date.now(),
          exit: spawnResult.exit,
        });

        spawnResult.exit.then((exitCode) => {
          opts.backgroundProcesses.delete(jobId);
          if (exitCode !== 0) {
            w.writeln(`\r\n[${jobId}] ${command} exited with code ${exitCode}`);
          } else {
            w.writeln(`\r\n[${jobId}] ${command} completed`);
          }
          w.write('$ ');
        }).catch((error: Error) => {
          opts.backgroundProcesses.delete(jobId);
          w.writeln(`\r\n[${jobId}] ${command} error: ${error.message}`);
          w.write('$ ');
        });

        w.writeln(`[${jobId}] ${Date.now()} (running in background)`);
        w.write('$ ');
        return;
      }

      // Foreground process
      opts.currentProcess.current = spawnResult.processId;

      try {
        const outputReader = process.output.getReader();
        const decoder = new TextDecoder();

         
        while (true) {
          const { done, value } = await outputReader.read();
          if (done) break;

          if (typeof value === 'string') {
            w.write(value);
          } else {
            const text = decoder.decode(value, { stream: true });
            w.write(text);
          }
        }

        const exitCode = await process.exit;
        opts.currentProcess.current = null;

        if (exitCode !== 0) {
          writeError(`\r\n\u274C Process exited with code ${exitCode}`);
        }
      } catch (streamError: unknown) {
        opts.currentProcess.current = null;
        if (streamError instanceof Error && streamError.name !== 'AbortError') {
          writeError(`\r\n\u274C Stream error: ${streamError.message}`);
        }
      }
    } else {
      writeError(`\u274C Error: ${spawnResult.error || 'Command failed'}`);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    writeError(`\u274C Error: ${msg}`);
    if (opts.currentProcess.current) {
      webContainer.killProcess(opts.currentProcess.current);
      opts.currentProcess.current = null;
    }
  }

  await flushStderr(stderrRedirect, stderrBuffer, append, w);
  w.write('\r\n$ ');
}

// --------------------------------------------------------------------------
// Internal dispatch
// --------------------------------------------------------------------------

async function dispatchBuiltinCommand(
  cmd: string,
  args: string[],
  w: TerminalWriter,
  writeError: (msg: string) => void,
  callbacks: TerminalCallbacks,
  sessionId: string,
): Promise<DispatchResult> {
  // Suppress unused parameter warning - writeError is available for builtins that need it
  void writeError;

  switch (cmd) {
    case 'clear':
      w.clear();
      w.write('$ ');
      return { handled: true };

    case 'help':
      printHelp(w);
      return { handled: true };

    case 'claude':
      await handleClaudeCommand(args, w);
      return { handled: true };

    case 'git':
      await handleGitCommand(args, w);
      return { handled: true };

    case 'ls':
      await handleLs(args, w);
      return { handled: true };

    case 'pwd':
      await handlePwd(args, w);
      return { handled: true };

    case 'cd':
      await handleCd(args, w);
      return { handled: true };

    case 'mkdir':
      await handleMkdir(args, w);
      return { handled: true };

    case 'rm':
      await handleRm(args, w);
      return { handled: true };

    case 'mv':
      await handleMv(args, w);
      return { handled: true };

    case 'cp':
      await handleCp(args, w);
      return { handled: true };

    case 'cat':
      await handleCat(args, w);
      return { handled: true };

    case 'touch':
      await handleTouch(args, w);
      return { handled: true };

    case 'nano':
      await handleNano(args, w, callbacks);
      return { handled: true };

    case 'which':
      await handleWhichCommand(args, w);
      return { handled: true };

    case 'env':
      await handleEnvCommand(args, w, sessionId);
      return { handled: true };

    case 'export':
      await handleExportCommand(args, w, sessionId);
      return { handled: true };

    case 'echo':
      await handleEchoCommand(args, w, sessionId);
      return { handled: true };

    case 'history':
      await handleHistoryCommand(args, w);
      return { handled: true };

    default:
      // Not an empty command that was somehow missed
      if (!cmd?.trim()) {
        writeError(`Command not found: ${cmd}. Type 'help' for available commands.`);
        w.write('$ ');
        return { handled: true };
      }
      return { handled: false };
  }
}

async function flushStderr(
  stderrRedirect: string | null,
  stderrBuffer: string[],
  append: boolean,
  w: TerminalWriter,
): Promise<void> {
  if (stderrRedirect && stderrBuffer.length > 0) {
    const stderrContent = stderrBuffer.join('\n') + '\n';
    const success = await writeStderrToFile(stderrRedirect, stderrContent, append);
    if (!success) {
      w.writeln(`\r\n\u274C Failed to write stderr to ${stderrRedirect}`);
    } else {
      w.writeln(`\r\n\u{1F4DD} Stderr written to ${stderrRedirect}`);
    }
  }
}
