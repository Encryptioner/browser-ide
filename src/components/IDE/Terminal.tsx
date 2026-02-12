import { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { webContainer } from '@/services/webcontainer';
import { gitService } from '@/services/git';
import { useIDEStore } from '@/store/useIDEStore';
import { fileSystem } from '@/services/filesystem';
import { createGLMAgent, createAnthropicAgent, type ClaudeCodeAgent } from '@/services/claude-agent';
import { useIsMobile } from '@/hooks/useKeyboardDetection';
import { MobileInputWrapper } from '@/components/MobileOptimizedLayout';
import { Maximize2, Minimize2 } from 'lucide-react';
import { NanoEditor } from './NanoEditor';
import '@xterm/xterm/css/xterm.css';

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [bootStatus, setBootStatus] = useState<'booting' | 'ready' | 'error'>('booting');
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentProcessRef = useRef<string | null>(null);
  const isMobile = useIsMobile();

  // Background process tracking
  const backgroundProcessesRef = useRef<Map<number, {
    processId: string;
    command: string;
    startTime: number;
    exit: Promise<number>;
  }>>(new Map());
  const nextJobIdRef = useRef(1);

  // Nano editor state
  const [nanoActive, setNanoActive] = useState(false);
  const nanoActiveRef = useRef(false);
  const [nanoFilePath, setNanoFilePath] = useState('');
  const [nanoContent, setNanoContent] = useState('');

  const {
    terminalMaximized,
    toggleTerminalMaximized,
    setTerminalMaximized
  } = useIDEStore();

  // Handle keyboard shortcuts for terminal maximize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + M to toggle terminal maximize (like VS Code)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        toggleTerminalMaximized();
      }
      // Escape to unmaximize (convenient exit)
      if (e.key === 'Escape' && terminalMaximized) {
        e.preventDefault();
        setTerminalMaximized(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [terminalMaximized, toggleTerminalMaximized, setTerminalMaximized]);

  // Initialize WebContainer
  useEffect(() => {
    let cancelled = false;

    async function initWebContainer() {
      // Check if already booted (prevents React 18 StrictMode double-boot)
      if (webContainer.isBooted()) {
        console.log('✅ WebContainer already booted, setting ready state');
        if (!cancelled) {
          setBootStatus('ready');
        }
        return;
      }

      console.log('🔄 Booting WebContainer...');
      setBootStatus('booting');
      const result = await webContainer.boot();

      if (!cancelled) {
        if (result.success) {
          console.log('✅ WebContainer boot complete, setting ready state');
          setBootStatus('ready');
        } else {
          setBootStatus('error');
          console.error('❌ WebContainer failed to boot:', result.error);
        }
      }
    }

    initWebContainer();

    return () => {
      cancelled = true;
      // Cleanup any running processes
      if (currentProcessRef.current) {
        webContainer.killProcess(currentProcessRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Skip if terminal already created (shouldn't happen now that we clear refs in cleanup)
    if (xtermRef.current) {
      console.warn('Terminal already exists, skipping creation');
      return;
    }

    // Create terminal instance with mobile-optimized settings
    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: isMobile ? 12 : 14,
      fontFamily: 'Consolas, Monaco, monospace',
      scrollback: 1000,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
      // Mobile-specific options
      cols: isMobile ? Math.min(80, Math.floor(window.innerWidth / 8)) : 80,
      rows: isMobile ? 15 : 24,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // Open terminal
    xterm.open(terminalRef.current);

    // Focus terminal to enable input
    xterm.focus();

    // Fit after a short delay to ensure DOM is ready
    setTimeout(() => {
      try {
        fitAddon.fit();
        xterm.focus(); // Focus again after fit
      } catch (err) {
        console.warn('Terminal fit failed, will retry on resize:', err);
      }
    }, 100);

  
    // Write welcome message
    xterm.writeln('Browser IDE Terminal');
    xterm.writeln('');
    xterm.writeln('WebContainer VM Ready');
    xterm.writeln('Supports: npm, pnpm, node, git, and bash commands');
    xterm.writeln('Type "help" for available commands');
    xterm.writeln('');
    xterm.write('$ ');

    console.log('✅ Terminal initialized with input handler');

    let currentLine = '';

    // Get latest settings from store
    const getSettings = () => {
      return useIDEStore.getState().settings;
    };

    // Handle file system commands
    async function handleLsCommand(_args: string[], xterm: XTerm) {
      const result = await fileSystem.listCurrentDirectory();

      if (result.success && result.data) {
        for (const item of result.data) {
          const icon = item.type === 'directory' ? '📁' : '📄';
          const name = item.type === 'directory' ? `${item.name}/` : item.name;
          xterm.writeln(`${icon} ${name}`);
        }
      } else {
        xterm.writeln(`ls: ${result.error || 'failed to list directory'}`);
      }
    }

    async function handlePwdCommand(_args: string[], xterm: XTerm) {
      const currentDir = fileSystem.getCurrentWorkingDirectory();
      xterm.writeln(currentDir);
    }

    async function handleCdCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        // cd to home directory (/)
        const result = await fileSystem.changeDirectory('/');
        if (result.success) {
          xterm.writeln(`Changed to directory: ${result.data}`);
        } else {
          xterm.writeln(`cd: ${result.error}`);
        }
      } else {
        const path = args[0];
        const result = await fileSystem.changeDirectory(path);
        if (result.success) {
          xterm.writeln(`Changed to directory: ${result.data}`);
        } else {
          xterm.writeln(`cd: ${result.error}`);
        }
      }
    }

    async function handleMkdirCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        xterm.writeln('mkdir: missing operand');
        return;
      }

      const dirName = args[0];
      const result = await fileSystem.createDirectory(dirName);
      if (result.success) {
        xterm.writeln(`Created directory: ${dirName}`);
      } else {
        xterm.writeln(`mkdir: ${result.error}`);
      }
    }

    async function handleRmCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        xterm.writeln('rm: missing operand');
        return;
      }

      const path = args[0];
      const result = await fileSystem.deletePath(path);
      if (result.success) {
        xterm.writeln(`Removed: ${path}`);
      } else {
        xterm.writeln(`rm: ${result.error}`);
      }
    }

    async function handleMvCommand(args: string[], xterm: XTerm) {
      if (args.length < 2) {
        xterm.writeln('mv: missing file operand');
        xterm.writeln('usage: mv <source> <destination>');
        return;
      }

      const source = args[0];
      const dest = args[1];

      // Read source file
      const readResult = await fileSystem.readFile(source);
      if (!readResult.success) {
        xterm.writeln(`mv: ${readResult.error}`);
        return;
      }

      // Write to destination
      const writeResult = await fileSystem.writeFile(dest, readResult.data!);
      if (!writeResult.success) {
        xterm.writeln(`mv: ${writeResult.error}`);
        return;
      }

      // Remove source
      const deleteResult = await fileSystem.deletePath(source);
      if (!deleteResult.success) {
        xterm.writeln(`mv: warning - could not remove source: ${deleteResult.error}`);
      }

      xterm.writeln(`Moved: ${source} -> ${dest}`);
    }

    async function handleCpCommand(args: string[], xterm: XTerm) {
      if (args.length < 2) {
        xterm.writeln('cp: missing file operand');
        xterm.writeln('usage: cp <source> <destination>');
        return;
      }

      const source = args[0];
      const dest = args[1];

      // Read source file
      const readResult = await fileSystem.readFile(source);
      if (!readResult.success) {
        xterm.writeln(`cp: ${readResult.error}`);
        return;
      }

      // Write to destination
      const writeResult = await fileSystem.writeFile(dest, readResult.data!);
      if (!writeResult.success) {
        xterm.writeln(`cp: ${writeResult.error}`);
        return;
      }

      xterm.writeln(`Copied: ${source} -> ${dest}`);
    }

    async function handleCatCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        xterm.writeln('cat: missing file operand');
        return;
      }

      const path = args[0];
      const result = await fileSystem.readFile(path);
      if (result.success && result.data) {
        // Split content into lines and write each line
        const lines = result.data.split('\n');
        for (const line of lines) {
          xterm.writeln(line);
        }
      } else {
        xterm.writeln(`cat: ${result.error}`);
      }
    }

    async function handleTouchCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        xterm.writeln('touch: missing file operand');
        return;
      }

      const fileName = args[0];
      const result = await fileSystem.writeFile(fileName, '');
      if (result.success) {
        xterm.writeln(`Created file: ${fileName}`);
      } else {
        xterm.writeln(`touch: ${result.error}`);
      }
    }

    async function handleNanoCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        xterm.writeln('nano: missing file operand');
        return;
      }

      const fileName = args[0];

      try {
        // Check if file exists and read content
        const fileResult = await fileSystem.readFile(fileName);
        let content = '';

        if (fileResult.success && fileResult.data) {
          content = fileResult.data;
        } else {
          // File doesn't exist - will be created on save
          content = '';
        }

        // Launch nano editor
        setNanoFilePath(fileName);
        setNanoContent(content);
        setNanoActive(true);
      } catch (error: any) {
        xterm.writeln(`nano: ${error.message}`);
      }
    }

    // Handle claude commands through Claude Code agent
    async function handleClaudeCommand(args: string[], xterm: XTerm) {
      const getSettings = () => {
        return useIDEStore.getState().settings;
      };

      const settings = getSettings();
      const apiKey = settings.ai.glmKey || settings.ai.anthropicKey;

      if (!apiKey) {
        xterm.writeln('error: No AI API key configured');
        xterm.writeln('Please set API key in Settings > AI Provider Settings');
        return;
      }

      if (args.length === 0) {
        xterm.writeln('usage: claude <task-description>');
        xterm.writeln('');
        xterm.writeln('Examples:');
        xterm.writeln('  claude "Create a React component for user login"');
        xterm.writeln('  claude "Fix the TypeScript errors in src/main.ts"');
        xterm.writeln('  claude "Add error handling to the fetch function"');
        xterm.writeln('  claude "Refactor this code to use modern JavaScript"');
        return;
      }

      const task = args.join(' ');

      try {
        xterm.writeln('🤖 Claude Code Agent starting...');
        xterm.writeln(`Task: ${task}`);
        xterm.writeln('');

        // Initialize agent
        const agent: ClaudeCodeAgent = settings.ai.glmKey
          ? createGLMAgent(apiKey)
          : createAnthropicAgent(apiKey);

        // Set working directory to current
        agent.setWorkingDirectory(fileSystem.getCurrentWorkingDirectory());

        // Execute task
        const result = await agent.executeTask(task, (progress) => {
          xterm.writeln(`📋 ${progress}`);
        });

        if (result.success) {
          xterm.writeln('');
          xterm.writeln('✅ Task completed successfully!');

          if (result.output) {
            xterm.writeln('');
            xterm.writeln('Output:');
            xterm.writeln(result.output);
          }

          if (result.artifacts) {
            if (result.artifacts.filesCreated?.length) {
              xterm.writeln('');
              xterm.writeln(`📁 Files created: ${result.artifacts.filesCreated.join(', ')}`);
            }
            if (result.artifacts.filesModified?.length) {
              xterm.writeln('');
              xterm.writeln(`📝 Files modified: ${result.artifacts.filesModified.join(', ')}`);
            }
            if (result.artifacts.commandsExecuted?.length) {
              xterm.writeln('');
              xterm.writeln(`⚡ Commands executed: ${result.artifacts.commandsExecuted.join(', ')}`);
            }
          }
        } else {
          xterm.writeln('');
          xterm.writeln('❌ Task failed:');
          xterm.writeln(result.error || 'Unknown error');
        }
      } catch (error: any) {
        xterm.writeln('');
        xterm.writeln(`❌ Claude agent error: ${error.message}`);
      }
    }

    // Handle git commands through isomorphic-git
    async function handleGitCommand(args: string[], xterm: XTerm) {
      if (args.length === 0) {
        xterm.writeln('usage: git <command> [<args>]');
        xterm.writeln('');
        xterm.writeln('Common git commands:');
        xterm.writeln('   status       Show working tree status');
        xterm.writeln('   branch       List, create branches');
        xterm.writeln('   checkout     Switch branches');
        xterm.writeln('   add          Add file contents to staging');
        xterm.writeln('   commit       Record changes to repository');
        xterm.writeln('   log          Show commit logs');
        xterm.writeln('   push         Push to remote');
        xterm.writeln('   pull         Pull from remote');
        xterm.writeln('   reset        Unstage changes');
        xterm.writeln('   diff         Show file changes');
        xterm.writeln('   remote       Manage remotes');
        xterm.writeln('   config       Get/set configuration');
        return;
      }

      const subcommand = args[0];
      const subargs = args.slice(1);

      try {
        switch (subcommand) {
          case 'status': {
            const status = await gitService.statusMatrix(fileSystem.getCurrentWorkingDirectory());
            if (status.length === 0) {
              xterm.writeln('nothing to commit, working tree clean');
            } else {
              xterm.writeln('Changes:');
              for (const file of status) {
                const statusChar =
                  file.status === 'added' ? 'A' :
                  file.status === 'modified' ? 'M' :
                  file.status === 'deleted' ? 'D' :
                  file.status === 'unmodified' ? ' ' : '?';
                xterm.writeln(`  ${statusChar}  ${file.path}`);
              }
            }
            break;
          }

          case 'branch': {
            if (subargs.length === 0) {
              // List branches
              const result = await gitService.listBranches(fileSystem.getCurrentWorkingDirectory());
              if (result.success && result.data) {
                for (const branch of result.data) {
                  const marker = branch.current ? '* ' : '  ';
                  xterm.writeln(`${marker}${branch.name}`);
                }
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            } else {
              // Create branch
              const branchName = subargs[0];
              const result = await gitService.createBranch(branchName, fileSystem.getCurrentWorkingDirectory());
              if (result.success) {
                xterm.writeln(`Created branch '${branchName}'`);
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            }
            break;
          }

          case 'checkout': {
            if (subargs.length === 0) {
              xterm.writeln('error: missing branch name');
            } else {
              const branchName = subargs[0];
              const result = await gitService.checkout(branchName, fileSystem.getCurrentWorkingDirectory());
              if (result.success) {
                xterm.writeln(`Switched to branch '${branchName}'`);
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            }
            break;
          }

          case 'add': {
            if (subargs.length === 0) {
              xterm.writeln('error: missing file path');
            } else if (subargs[0] === '.') {
              const result = await gitService.addAll(fileSystem.getCurrentWorkingDirectory());
              if (result.success) {
                xterm.writeln('Added all changes');
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            } else {
              const filepath = subargs[0];
              const result = await gitService.add(filepath, fileSystem.getCurrentWorkingDirectory());
              if (result.success) {
                xterm.writeln(`Added '${filepath}'`);
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            }
            break;
          }

          case 'commit': {
            // Parse commit message from -m flag
            const mIndex = subargs.indexOf('-m');
            if (mIndex === -1 || mIndex === subargs.length - 1) {
              xterm.writeln('error: missing commit message (use -m "message")');
            } else {
              const message = subargs[mIndex + 1];
              const currentSettings = getSettings();
              const author = {
                name: currentSettings.githubUsername || 'Browser IDE User',
                email: currentSettings.githubEmail || 'user@browser-ide.dev',
              };
              const result = await gitService.commit(message, author, fileSystem.getCurrentWorkingDirectory());
              if (result.success && result.data) {
                xterm.writeln(`[${result.data.substring(0, 7)}] ${message}`);
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            }
            break;
          }

          case 'log': {
            const commits = await gitService.log(fileSystem.getCurrentWorkingDirectory(), 10);
            if (commits.length === 0) {
              xterm.writeln('No commits yet');
            } else {
              for (const commit of commits) {
                xterm.writeln(`commit ${commit.oid}`);
                xterm.writeln(`Author: ${commit.author.name} <${commit.author.email}>`);
                const date = new Date(commit.author.timestamp * 1000);
                xterm.writeln(`Date:   ${date.toISOString()}`);
                xterm.writeln('');
                xterm.writeln(`    ${commit.message}`);
                xterm.writeln('');
              }
            }
            break;
          }

          case 'push': {
            const currentSettings = getSettings();
            const token = currentSettings.githubToken;

            console.log('🔍 Push - Token check:', {
              hasToken: !!token,
              tokenLength: token?.length,
              tokenPrefix: token?.substring(0, 7)
            });

            if (!token) {
              xterm.writeln('error: No GitHub token configured');
              xterm.writeln('Please set token in Settings > Git Settings');
            } else {
              xterm.writeln('Pushing to remote...');
              const result = await gitService.push(token, 'origin', undefined, fileSystem.getCurrentWorkingDirectory());
              if (result.success && result.data) {
                xterm.writeln(`✅ Successfully pushed branch '${result.data}' to origin`);
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            }
            break;
          }

          case 'pull': {
            const currentSettings = getSettings();
            const token = currentSettings.githubToken;

            console.log('🔍 Pull - Token check:', {
              hasToken: !!token,
              tokenLength: token?.length,
              tokenPrefix: token?.substring(0, 7)
            });

            if (!token) {
              xterm.writeln('error: No GitHub token configured');
              xterm.writeln('Please set token in Settings > Git Settings');
            } else {
              xterm.writeln('Pulling from remote...');
              const result = await gitService.pull(token, 'origin', undefined, fileSystem.getCurrentWorkingDirectory());
              if (result.success && result.data) {
                xterm.writeln(`✅ Successfully pulled branch '${result.data}' from origin`);
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            }
            break;
          }

          case 'reset': {
            // git reset [<file>] - Unstage file(s)
            if (subargs.length === 0) {
              // Reset all staged files
              const result = await gitService.resetFiles(fileSystem.getCurrentWorkingDirectory());
              if (result.success) {
                xterm.writeln('Unstaged all changes');
              } else {
                xterm.writeln(`error: ${result.error}`);
              }
            } else {
              // Reset specific file
              const filepath = subargs[0] === 'HEAD' ? subargs[1] : subargs[0];
              if (!filepath) {
                xterm.writeln('error: missing file path');
              } else {
                const result = await gitService.resetFiles(fileSystem.getCurrentWorkingDirectory(), [filepath]);
                if (result.success) {
                  xterm.writeln(`Unstaged '${filepath}'`);
                } else {
                  xterm.writeln(`error: ${result.error}`);
                }
              }
            }
            break;
          }

          case 'diff': {
            // git diff [<file>] - Show changes
            if (subargs.length === 0) {
              xterm.writeln('usage: git diff <file>');
            } else {
              const filepath = subargs[0];
              const result = await gitService.diff(fileSystem.getCurrentWorkingDirectory(), filepath);
              if (result.success && result.data) {
                xterm.writeln(result.data);
              } else {
                xterm.writeln(`error: ${result.error || 'No changes'}`);
              }
            }
            break;
          }

          case 'remote': {
            // git remote [-v]
            const remotes = await gitService.listRemotes(fileSystem.getCurrentWorkingDirectory());
            if (remotes.length === 0) {
              xterm.writeln('No remotes configured');
            } else {
              const verbose = subargs.includes('-v');
              for (const { remote, url } of remotes) {
                if (verbose) {
                  xterm.writeln(`${remote}\t${url} (fetch)`);
                  xterm.writeln(`${remote}\t${url} (push)`);
                } else {
                  xterm.writeln(remote);
                }
              }
            }
            break;
          }

          case 'config': {
            // git config <key> [<value>]
            if (subargs.length === 0) {
              xterm.writeln('usage: git config <key> [<value>]');
            } else {
              const key = subargs[0];
              if (subargs.length === 1) {
                // Get config
                const value = await gitService.getConfig(key, fileSystem.getCurrentWorkingDirectory());
                if (value) {
                  xterm.writeln(value);
                } else {
                  xterm.writeln(`No value set for '${key}'`);
                }
              } else {
                // Set config
                const value = subargs.slice(1).join(' ');
                const result = await gitService.setConfig(key, value, fileSystem.getCurrentWorkingDirectory());
                if (result.success) {
                  xterm.writeln(`Set ${key} = ${value}`);
                } else {
                  xterm.writeln(`error: ${result.error}`);
                }
              }
            }
            break;
          }

          default:
            xterm.writeln(`git: '${subcommand}' is not a git command. See 'git --help'.`);
            xterm.writeln('');
            xterm.writeln('Supported commands:');
            xterm.writeln('  status, branch, checkout, add, commit, log');
            xterm.writeln('  push, pull, reset, diff, remote, config');
            break;
        }
      } catch (error: any) {
        xterm.writeln(`error: ${error.message}`);
      }
    }

    /**
     * Parse stderr redirection from command line
     * Returns { cleanedCommand, stderrRedirect, append }
     * Examples:
     *   "npm install 2>errors.txt" -> { cleanedCommand: "npm install", stderrRedirect: "errors.txt", append: false }
     *   "npm run build 2>>errors.txt" -> { cleanedCommand: "npm run build", stderrRedirect: "errors.txt", append: true }
     *   "npm install" -> { cleanedCommand: "npm install", stderrRedirect: null, append: false }
     */
    function parseStderrRedirection(command: string): {
      cleanedCommand: string;
      stderrRedirect: string | null;
      append: boolean;
    } {
      // Match 2>> or 2> followed by filename
      // Handles spaces around the operator
      const stderrMatch = command.match(/(.+?)\s*2(>>?)\s*(\S+)$/);

      if (stderrMatch) {
        const [, cmdPart, operator, filePath] = stderrMatch;
        return {
          cleanedCommand: cmdPart.trim(),
          stderrRedirect: filePath,
          append: operator === '>>',
        };
      }

      return {
        cleanedCommand: command,
        stderrRedirect: null,
        append: false,
      };
    }

    /**
     * Write error output to file
     */
    async function writeStderrToFile(
      filePath: string,
      content: string,
      append: boolean
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
        console.error('Failed to write stderr to file:', error);
        return false;
      }
    }

    /**
     * Parse background operator (&) from command
     * Returns { cleanedCommand, isBackground }
     */
    function parseBackgroundOperator(command: string): {
      cleanedCommand: string;
      isBackground: boolean;
    } {
      const trimmed = command.trim();
      if (trimmed.endsWith('&')) {
        return {
          cleanedCommand: trimmed.slice(0, -1).trim(),
          isBackground: true,
        };
      }
      return {
        cleanedCommand: command,
        isBackground: false,
      };
    }

    /**
     * Handle 'jobs' command - list background processes
     */
    async function handleJobsCommand(): Promise<void> {
      const jobs = Array.from(backgroundProcessesRef.current.entries());
      if (jobs.length === 0) {
        xterm.writeln('No background jobs running.');
        return;
      }

      xterm.writeln(`[1] ${jobs.length} job${jobs.length > 1 ? 's' : ''}:`);
      for (const [jobId, job] of jobs) {
        const runtime = Date.now() - job.startTime;
        xterm.writeln(`[${jobId}] ${job.command} (running, ${Math.round(runtime / 1000)}s)`);
      }
    }

    /**
     * Handle 'fg' command - bring background job to foreground
     */
    async function handleFgCommand(args: string[]): Promise<void> {
      const jobId = args.length > 0 ? parseInt(args[0].replace(/^\%/, ''), 10) : 1;

      const job = backgroundProcessesRef.current.get(jobId);
      if (!job) {
        xterm.writeln(`fg: no such job ${jobId}`);
        xterm.write('\r\n$ ');
        return;
      }

      // Remove from background
      backgroundProcessesRef.current.delete(jobId);

      xterm.writeln(`[${jobId}] ${job.command} - continuing in foreground...`);

      // Bring to foreground - this is a simplified version
      // In a real implementation, we'd need to reattach to the process output
      // For now, just notify that it's running
      currentProcessRef.current = job.processId;

      try {
        // Wait for the process to complete
        const exitCode = await job.exit;
        currentProcessRef.current = null;

        if (exitCode !== 0) {
          xterm.writeln(`\r\n[${jobId}] Exited with code ${exitCode}`);
        } else {
          xterm.writeln(`\r\n[${jobId}] Completed successfully`);
        }
      } catch (error: any) {
        currentProcessRef.current = null;
        xterm.writeln(`\r\n[${jobId}] Error: ${error.message}`);
      }
    }

    // Execute command
    async function executeCommand(command: string) {
      if (!command.trim()) {
        xterm.write('\r\n$ ');
        return;
      }

      // Check for jobs command
      if (command.trim() === 'jobs') {
        await handleJobsCommand();
        xterm.write('\r\n$ ');
        return;
      }

      // Check for fg command
      if (command.trim().startsWith('fg')) {
        const args = command.trim().split(/\s+/).slice(1);
        await handleFgCommand(args);
        xterm.write('\r\n$ ');
        return;
      }

      // Parse background operator
      const { cleanedCommand: bgCleanedCommand, isBackground } = parseBackgroundOperator(command);

      // Parse stderr redirection (use background-cleaned command)
      const { cleanedCommand, stderrRedirect, append } = parseStderrRedirection(bgCleanedCommand);
      const stderrBuffer: string[] = [];

      // Helper to write error (either to buffer or terminal)
      const writeError = (error: string) => {
        if (stderrRedirect) {
          stderrBuffer.push(error);
        } else {
          xterm.writeln(error);
        }
      };

      // Add to command history (use cleaned command)
      commandHistoryRef.current.push(cleanedCommand.trim());
      historyIndexRef.current = commandHistoryRef.current.length;

      xterm.write('\r\n');

      // Parse command (use cleaned command without redirection)
      const parts = cleanedCommand.trim().split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);

      try {
        // Special handling for 'clear'
        if (cmd === 'clear') {
          xterm.clear();
          xterm.write('$ ');
          return;
        }

        // Special handling for 'help'
        if (cmd === 'help') {
          xterm.writeln('Available commands:');
          xterm.writeln('');
          xterm.writeln('File System:');
          xterm.writeln('  ls [path]              - List directory contents');
          xterm.writeln('  pwd                     - Show current directory');
          xterm.writeln('  cd [path]              - Change directory');
          xterm.writeln('  mkdir <dir>             - Create directory');
          xterm.writeln('  rm <path>               - Remove file or directory');
          xterm.writeln('  mv <src> <dest>         - Move/rename file');
          xterm.writeln('  cp <src> <dest>         - Copy file');
          xterm.writeln('  cat <file>              - Display file contents');
          xterm.writeln('  touch <file>             - Create empty file');
          xterm.writeln('  nano <file>             - Simple text editor');
          xterm.writeln('');
          xterm.writeln('Claude Code:');
          xterm.writeln('  claude <task>          - AI-powered coding assistant');
          xterm.writeln('                          Examples:');
          xterm.writeln('                            claude "Create React component"');
          xterm.writeln('                            claude "Fix TypeScript errors"');
          xterm.writeln('                            claude "Refactor this function"');
          xterm.writeln('                          Configure API key in Settings > AI Provider');
          xterm.writeln('');
          xterm.writeln('Git:');
          xterm.writeln('  git status              - Show working tree status');
          xterm.writeln('  git branch              - List branches');
          xterm.writeln('  git branch <name>       - Create new branch');
          xterm.writeln('  git checkout <name>     - Switch branches');
          xterm.writeln('  git add <file>          - Stage file');
          xterm.writeln('  git add .               - Stage all files');
          xterm.writeln('  git commit -m "msg"     - Commit changes');
          xterm.writeln('  git log                 - Show commit history');
          xterm.writeln('  git push                - Push to remote');
          xterm.writeln('  git pull                - Pull from remote');
          xterm.writeln('  git reset [<file>]      - Unstage file(s)');
          xterm.writeln('  git diff <file>         - Show file changes');
          xterm.writeln('  git remote [-v]         - List remotes');
          xterm.writeln('  git config <key> [val]  - Get/set config');
          xterm.writeln('');
          xterm.writeln('WebContainer:');
          xterm.writeln('  clear    - Clear terminal');
          xterm.writeln('  help     - Show this help');
          xterm.writeln('  node     - Run Node.js');
          xterm.writeln('  npm      - Node package manager');
          xterm.writeln('  pnpm     - Fast npm alternative');
          xterm.writeln('');
          xterm.writeln('Use ↑/↓ arrows to navigate command history');
          xterm.writeln('Use Ctrl+C to cancel running command');
          xterm.write('\r\n$ ');
          return;
        }

        // Special handling for 'claude' commands
        if (cmd === 'claude') {
          await handleClaudeCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        // Special handling for 'git' commands
        if (cmd === 'git') {
          await handleGitCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        // File system commands
        if (cmd === 'ls') {
          await handleLsCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'pwd') {
          await handlePwdCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'cd') {
          await handleCdCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'mkdir') {
          await handleMkdirCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'rm') {
          await handleRmCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'mv') {
          await handleMvCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'cp') {
          await handleCpCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'cat') {
          await handleCatCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'touch') {
          await handleTouchCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        if (cmd === 'nano') {
          await handleNanoCommand(args, xterm);
          xterm.write('\r\n$ ');
          return;
        }

        // Default case - unknown command
        if (!cmd?.trim()) {
          writeError(`Command not found: ${cmd}. Type 'help' for available commands.`);
          xterm.write('$ ');
          return;
        }

        // Execute via WebContainer - check actual boot status, not local state
        if (!webContainer.isBooted()) {
          console.log('⚠️ Command blocked: WebContainer not booted yet');
          writeError('⚠️  WebContainer is still booting...');
          xterm.write('$ ');
          return;
        }

        console.log('✅ Executing command:', cmd, args);

        const result = await webContainer.spawn(cmd, args);

        if (result.success && result.process && result.processId && result.exit) {
          const process = result.process;

          // Handle background process
          if (isBackground) {
            const jobId = nextJobIdRef.current++;
            const startTime = Date.now();

            // Add to background processes
            backgroundProcessesRef.current.set(jobId, {
              processId: result.processId,
              command: `${cmd} ${args.join(' ')}`,
              startTime,
              exit: result.exit,
            });

            // Notify when background process completes
            result.exit.then((exitCode) => {
              backgroundProcessesRef.current.delete(jobId);
              if (exitCode !== 0) {
                xterm.writeln(`\r\n[${jobId}] ${command} exited with code ${exitCode}`);
              } else {
                xterm.writeln(`\r\n[${jobId}] ${command} completed`);
              }
              xterm.write('$ ');
            }).catch((error) => {
              backgroundProcessesRef.current.delete(jobId);
              xterm.writeln(`\r\n[${jobId}] ${command} error: ${error.message}`);
              xterm.write('$ ');
            });

            xterm.writeln(`[${jobId}] ${Date.now()} (running in background)`);
            xterm.write('$ ');
            return;
          }

          // Foreground process execution
          currentProcessRef.current = result.processId;

          // Create abort controller for timeout
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => {
            abortController.abort();
            writeError('\r\n⚠️  Command timeout after 5 minutes');
            if (currentProcessRef.current) {
              webContainer.killProcess(currentProcessRef.current);
              currentProcessRef.current = null;
            }
          }, 300000); // 5 minute timeout

          try {
            // Stream output with better buffering
            const outputReader = process.output.getReader();
            const decoder = new TextDecoder();

            while (!abortController.signal.aborted) {
              const { done, value } = await outputReader.read();
              if (done) break;

              // value is already a string from WebContainer
              if (typeof value === 'string') {
                xterm.write(value);
              } else {
                // If it's a Uint8Array, decode it
                const text = decoder.decode(value, { stream: true });
                xterm.write(text);
              }
            }

            // Wait for exit
            const exitCode = await process.exit;
            clearTimeout(timeoutId);
            currentProcessRef.current = null;

            if (exitCode !== 0) {
              writeError(`\r\n❌ Process exited with code ${exitCode}`);
            }
          } catch (streamError: any) {
            clearTimeout(timeoutId);
            currentProcessRef.current = null;
            if (streamError.name !== 'AbortError') {
              writeError(`\r\n❌ Stream error: ${streamError.message}`);
            }
          }
        } else {
          writeError(`❌ Error: ${result.error || 'Command failed'}`);
        }
      } catch (error: any) {
        writeError(`❌ Error: ${error.message}`);
        if (currentProcessRef.current) {
          webContainer.killProcess(currentProcessRef.current);
          currentProcessRef.current = null;
        }
      }

      // Write stderr to file if redirection was specified
      if (stderrRedirect && stderrBuffer.length > 0) {
        const stderrContent = stderrBuffer.join('\n') + '\n';
        const success = await writeStderrToFile(stderrRedirect, stderrContent, append);
        if (!success) {
          xterm.writeln(`\r\n❌ Failed to write stderr to ${stderrRedirect}`);
        } else {
          xterm.writeln(`\r\n📝 Stderr written to ${stderrRedirect}`);
        }
      }

      xterm.write('\r\n$ ');
    }

    // Handle input
    xterm.onData((data) => {
      // Ignore input when nano is active
      if (nanoActiveRef.current) {
        return;
      }

      const code = data.charCodeAt(0);
      console.log('Terminal input received:', { data, code });

      // Enter key
      if (code === 13) {
        executeCommand(currentLine);
        currentLine = '';
        return;
      }

      // Backspace
      if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          xterm.write('\b \b');
        }
        return;
      }

      // Ctrl+C - Cancel current command
      if (code === 3) {
        if (currentProcessRef.current) {
          webContainer.killProcess(currentProcessRef.current);
          currentProcessRef.current = null;
          xterm.writeln('^C');
        }
        xterm.write('\r\n$ ');
        currentLine = '';
        return;
      }

      // Ctrl+L (clear)
      if (code === 12) {
        xterm.clear();
        xterm.write('$ ');
        currentLine = '';
        return;
      }

      // Arrow keys (ANSI escape sequences)
      if (data === '\x1b[A') {
        // Up arrow - previous command
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];

          // Clear current line
          xterm.write('\r\x1b[K$ ');
          currentLine = historyCommand;
          xterm.write(historyCommand);
        }
        return;
      }

      if (data === '\x1b[B') {
        // Down arrow - next command
        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];

          // Clear current line
          xterm.write('\r\x1b[K$ ');
          currentLine = historyCommand;
          xterm.write(historyCommand);
        } else if (historyIndexRef.current === commandHistoryRef.current.length - 1) {
          // At end of history, clear line
          historyIndexRef.current = commandHistoryRef.current.length;
          xterm.write('\r\x1b[K$ ');
          currentLine = '';
        }
        return;
      }

      // Regular character
      if (code >= 32) {
        currentLine += data;
        xterm.write(data);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // Fit on resize with mobile optimization
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && terminalRef.current) {
        try {
          // Only fit if terminal has dimensions
          const rect = terminalRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fitAddonRef.current.fit();

            // On mobile, ensure we don't exceed readable columns
            if (isMobile && xterm) {
              const maxCols = Math.min(80, Math.floor(rect.width / 8));
              const maxRows = Math.max(10, Math.floor(rect.height / 16));

              // Apply gentle size constraints for mobile
              if (xterm.cols > maxCols) {
                xterm.resize(maxCols, xterm.rows);
              }
              if (xterm.rows > maxRows) {
                xterm.resize(xterm.cols, maxRows);
              }
            }
          }
        } catch {
          // Ignore fit errors during resize
        }
      }
    });

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      xterm.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Sync nano active state to ref for input handler
  useEffect(() => {
    nanoActiveRef.current = nanoActive;
    if (nanoActive) {
      console.log('🔧 Nano editor active - terminal input disabled');
    } else {
      console.log('🔧 Nano editor inactive - terminal input enabled');
    }
  }, [nanoActive]);

  return (
    <MobileInputWrapper shouldPreventZoom={true}>
      <div className={`
        terminal flex flex-col h-full bg-gray-900
        ${terminalMaximized ? 'terminal-maximized terminal-maximize-transition' : ''}
      `}>
        <div className="terminal-header px-2 sm:px-4 py-1 sm:py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0 min-h-[32px] sm:min-h-[40px]">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-xs sm:text-sm">
              Terminal
              {terminalMaximized && <span className="ml-2 text-xs text-blue-400">(Maximized)</span>}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {bootStatus === 'booting' && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="hidden sm:inline">Booting WebContainer...</span>
                <span className="sm:hidden">Booting...</span>
              </div>
            )}
            {bootStatus === 'ready' && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="hidden sm:inline">Ready</span>
                <span className="sm:hidden">Ready</span>
              </div>
            )}
            {bootStatus === 'error' && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span className="hidden sm:inline">Boot Failed</span>
                <span className="sm:hidden">Error</span>
              </div>
            )}

            {/* Maximize/Restore Button */}
            <button
              onClick={toggleTerminalMaximized}
              className={`
                maximize-button p-1 sm:p-2 rounded hover:bg-gray-700 transition-colors
                touch-manipulation min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0
                ${terminalMaximized ? 'text-blue-400' : 'text-gray-400'}
              `}
              title={`${terminalMaximized ? 'Restore Terminal' : 'Maximize Terminal'} (Ctrl+Shift+M)`}
              aria-label={`${terminalMaximized ? 'Restore Terminal' : 'Maximize Terminal'}`}
            >
              {terminalMaximized ? (
                <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>
        <div
          ref={terminalRef}
          className="terminal-content flex-1 overflow-hidden min-h-0 touch-manipulation"
          onClick={() => {
            // Focus terminal when clicked
            if (xtermRef.current) {
              xtermRef.current.focus();
            }
          }}
          onTouchEnd={(e) => {
            // Ensure terminal gets focus on touch on mobile
            e.preventDefault();
            if (xtermRef.current) {
              // Small delay to ensure proper focus handling
              setTimeout(() => {
                xtermRef.current?.focus();
              }, 50);
            }
          }}
          style={{
            // Ensure proper touch handling on mobile
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
          }}
        />

        {/* Nano Editor - rendered when active */}
        {nanoActive && xtermRef.current && (
          <NanoEditor
            xterm={xtermRef.current}
            filePath={nanoFilePath}
            initialContent={nanoContent}
            onExit={() => {
              setNanoActive(false);
              setNanoFilePath('');
              setNanoContent('');
              // Return to terminal prompt
              if (xtermRef.current) {
                xtermRef.current.write('\r\n$ ');
                xtermRef.current.focus();
              }
            }}
          />
        )}
      </div>
    </MobileInputWrapper>
  );
}
