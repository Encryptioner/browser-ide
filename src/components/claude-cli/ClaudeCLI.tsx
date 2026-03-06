import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { ClaudeCLIService, createCLIService, type CLIOptions, type CLIResult } from '@/services/claude-cli';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { logger } from '@/utils/logger';

interface WorkspaceStatus {
  workingDirectory?: string;
  gitStatus?: {
    isRepo: boolean;
    branch?: string;
    clean?: boolean;
    files?: Array<{ status: string; path: string }>;
  };
  files?: unknown[];
}

interface ClaudeCLIProps {
  className?: string;
  options?: CLIOptions;
  onCommand?: (_command: string, _result: CLIResult) => void;
}

export function ClaudeCLI({ className, options, onCommand }: ClaudeCLIProps) {
  const [cliService, setCliService] = useState<ClaudeCLIService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState<WorkspaceStatus | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    operation: string;
    description: string;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const [pendingContinue, setPendingContinue] = useState<{
    error: string;
    resolve: (shouldContinue: boolean) => void;
  } | null>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputBuffer = useRef('');
  const cursorPosition = useRef(0);

  const { getActiveWorkspace } = useWorkspaceStore();

  // Initialize CLI service
  useEffect(() => {
    const activeWorkspace = getActiveWorkspace();
    const workingDirectory = activeWorkspace?.data?.project?.localPath || '/workspace';

    const service = createCLIService({
      provider: options?.provider || 'anthropic',
      apiKey: options?.apiKey,
      baseUrl: options?.baseUrl,
      workingDirectory,
      onConfirmDangerous: async (operation: string, description: string) => {
        return new Promise<boolean>((resolve) => {
          setPendingConfirmation({ operation, description, resolve });
        });
      },
      onContinueAfterError: async (error: string) => {
        return new Promise<boolean>((resolve) => {
          setPendingContinue({ error, resolve });
        });
      }
    });

    service.initialize()
      .then(() => {
        setCliService(service);
        setIsInitialized(true);

        // Get initial status
        service.getStatus().then(setWorkspaceStatus);
      })
      .catch((error: Error) => {
        logger.error('Failed to initialize CLI:', error.message);
      });

    return () => {
      service.cleanup();
    };
  }, [getActiveWorkspace, options]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !isInitialized) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#00ff00'
      },
      cols: 80,
      rows: 24
    });

    // Add plugins
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Write welcome message
    const activeWorkspace = getActiveWorkspace();
    const workingDir = activeWorkspace?.data?.project?.localPath || '/workspace';

    term.writeln(`🚀 Browser IDE - Claude CLI`);
    term.writeln(`🔧 WebContainer environment ready`);
    term.writeln(`📁 Working directory: ${workingDir}`);
    term.writeln('');
    term.write('claude> ');

    // Handle terminal input
    term.onData((data) => {
      handleTerminalInput(data, term);
    });

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

    function handleResize() {
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch {
          // Ignore resize errors
        }
      }, 100);
    }
    // handleTerminalInput is intentionally omitted - terminal input handler is set up once on initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, getActiveWorkspace]);

  const handleTerminalInput = useCallback((data: string, term: Terminal) => {
    if (isExecuting) return;

    switch (data) {
      case '\r': { // Enter
        const command = inputBuffer.current.trim();
        if (command) {
          executeCommand(command, term);
        } else {
          term.write('\r\nclaude> ');
        }
        inputBuffer.current = '';
        cursorPosition.current = 0;
        break;
      }

      case '\u007F': // Backspace
        if (cursorPosition.current > 0) {
          cursorPosition.current--;
          inputBuffer.current =
            inputBuffer.current.slice(0, cursorPosition.current) +
            inputBuffer.current.slice(cursorPosition.current + 1);
          term.write('\b \b');
        }
        break;

      case '\u001b[A': // Up arrow
        if (commandHistory.length > 0) {
          const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
          setHistoryIndex(newIndex);
          const historyCommand = commandHistory[commandHistory.length - 1 - newIndex];

          // Clear current input
          for (let i = 0; i < inputBuffer.current.length; i++) {
            term.write('\b \b');
          }

          inputBuffer.current = historyCommand;
          cursorPosition.current = historyCommand.length;
          term.write(historyCommand);
        }
        break;

      case '\u001b[B': // Down arrow
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const historyCommand = newIndex >= 0 ?
            commandHistory[commandHistory.length - 1 - newIndex] : '';

          // Clear current input
          for (let i = 0; i < inputBuffer.current.length; i++) {
            term.write('\b \b');
          }

          inputBuffer.current = historyCommand;
          cursorPosition.current = historyCommand.length;
          term.write(historyCommand);
        } else if (historyIndex === 0) {
          // Clear to empty
          for (let i = 0; i < inputBuffer.current.length; i++) {
            term.write('\b \b');
          }
          inputBuffer.current = '';
          cursorPosition.current = 0;
          setHistoryIndex(-1);
        }
        break;

      case '\u001b[C': // Right arrow
        if (cursorPosition.current < inputBuffer.current.length) {
          cursorPosition.current++;
          term.write(data);
        }
        break;

      case '\u001b[D': // Left arrow
        if (cursorPosition.current > 0) {
          cursorPosition.current--;
          term.write(data);
        }
        break;

      case '\t': // Tab - simple completion
        if (inputBuffer.current.length > 0) {
          const completion = getCommandCompletion(inputBuffer.current);
          if (completion) {
            const remaining = completion.slice(inputBuffer.current.length);
            inputBuffer.current = completion;
            cursorPosition.current = completion.length;
            term.write(remaining);
          }
        }
        break;

      default:
        // Regular character
        if (data >= ' ' && data <= '~') {
          inputBuffer.current =
            inputBuffer.current.slice(0, cursorPosition.current) +
            data +
            inputBuffer.current.slice(cursorPosition.current);
          cursorPosition.current++;
          term.write(data);
        }
        break;
    }
    // executeCommand is intentionally omitted to prevent re-creating input handler on every command execution
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExecuting, commandHistory, historyIndex]);

  // Handle Claude Code slash commands
  const handleSlashCommand = useCallback(async (command: string, term: Terminal) => {
    const slashCmd = command.substring(1).toLowerCase(); // Remove '/' and convert to lowercase

    term.writeln(`🔧 Executing slash command: /${slashCmd}`);

    switch (slashCmd) {
      case 'clear':
        term.clear();
        term.writeln('🧹 Terminal cleared');
        break;

      case 'compact':
        // Compact conversation history
        setCommandHistory(prev => prev.length > 10 ? prev.slice(-5) : prev);
        term.writeln('📉 Conversation history compacted');
        break;

      case 'help':
        showHelpCommand(term);
        break;

      case 'status':
        await showStatusCommand(term);
        break;

      case 'reset':
        // Reset the CLI service
        if (cliService) {
          await cliService.cleanup();
          await cliService.initialize();
          term.writeln('🔄 CLI service reset');
        }
        break;

      case 'history':
        term.writeln('📜 Command History:');
        commandHistory.slice(-10).forEach((cmd, index) => {
          term.writeln(`  ${commandHistory.length - 10 + index + 1}: ${cmd}`);
        });
        break;

      case 'env':
        if (cliService) {
          const env = cliService.getEnvironment();
          term.writeln('🌍 Environment Variables:');
          Object.entries(env).forEach(([key, value]) => {
            term.writeln(`  ${key}=${value}`);
          });
        }
        break;

      case 'cd':
        term.writeln('📁 Usage: /cd <path>');
        break;

      case 'pwd':
        term.writeln(`📁 Current directory: ${workspaceStatus?.workingDirectory || '/workspace'}`);
        break;

      case 'ls':
        await executeLsCommand('', term);
        break;

      case 'git':
        term.writeln('🔧 Git commands:');
        term.writeln('  /git status - Show git status');
        term.writeln('  /git add <files> - Add files to staging');
        term.writeln('  /git commit -m "message" - Create commit');
        term.writeln('  /git push - Push to remote');
        term.writeln('  /git pull - Pull from remote');
        break;

      case 'exec':
        term.writeln('🎯 Usage: /exec <task description>');
        break;

      case 'npm':
        term.writeln('📦 Usage: /npm <command> [args]');
        break;

      case 'exit':
      case 'quit':
        term.writeln('👋 Use the IDE interface to exit');
        break;

      default:
        term.writeln(`❌ Unknown slash command: /${slashCmd}`);
        term.writeln('💡 Type /help for available commands');
        break;
    }
    // executeLsCommand and showStatusCommand are stable component-scoped functions, intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliService, commandHistory, workspaceStatus]);

  const executeCommand = useCallback(async (command: string, term: Terminal) => {
    if (!cliService || !command.trim()) return;

    setIsExecuting(true);
    term.writeln('');

    // Add to history
    setCommandHistory(prev => [...prev.slice(-50), command]);
    setHistoryIndex(-1);

    const trimmedCommand = command.trim();

    // Handle Claude Code slash commands
    if (trimmedCommand.startsWith('/')) {
      await handleSlashCommand(trimmedCommand, term);
      setIsExecuting(false);
      term.write('claude> ');
      return;
    }

    // Parse regular command
    const [cmd, ...args] = trimmedCommand.split(' ');
    const fullArgs = args.join(' ');

    try {
      switch (cmd) {
        case 'help':
        case 'h':
          showHelpCommand(term);
          break;

        case 'clear':
        case 'cls':
          term.clear();
          break;

        case 'status':
        case 'st':
          await showStatusCommand(term);
          break;

        case 'ls':
          await executeLsCommand(fullArgs, term);
          break;

        case 'pwd':
          term.writeln(workspaceStatus?.workingDirectory || '/workspace');
          break;

        case 'cd':
          await executeCdCommand(fullArgs, term);
          break;

        case 'cat':
          await executeCatCommand(fullArgs, term);
          break;

        case 'mkdir':
          await executeMkdirCommand(fullArgs, term);
          break;

        case 'touch':
          await executeTouchCommand(fullArgs, term);
          break;

        case 'exec':
          await executeExecCommand(fullArgs, term);
          break;

        case 'init':
          await executeInitCommand(fullArgs, term);
          break;

        case 'git':
          await executeGitCommand(args, term);
          break;

        case 'npm':
          await executeNpmCommand(args, term);
          break;

        case 'node':
          await executeNodeCommand(fullArgs, term);
          break;

        case 'python':
        case 'python3':
          await executePythonCommand(fullArgs, term);
          break;

        case 'exit':
        case 'quit':
          term.writeln('👋 Goodbye! Use the IDE interface to continue.');
          break;

        default:
          // Try to execute as shell command
          await executeShellCommand(command, term);
          break;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ Error: ${message}`);
    } finally {
      setIsExecuting(false);
      term.write('claude> ');
    }

    onCommand?.(command, { success: true });
    // Command handler functions are stable component-scoped functions, intentionally omitted to avoid excessive re-creation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliService, workspaceStatus, onCommand]);

  const showHelpCommand = (term: Terminal) => {
    term.writeln(`🤖 Browser IDE - Claude CLI Commands:

📁 File Operations:
  ls [path]           List directory contents
  cat <file>           Show file contents
  cd <path>            Change directory
  pwd                   Show current directory
  mkdir <dir>          Create directory
  touch <file>          Create empty file

🔧 Development:
  exec <task>           Execute AI-powered task
  init [type]           Initialize project (react, node, basic)
  npm <command>         Run npm commands
  git <command>         Run git commands
  node <file>           Run Node.js script
  python <file>         Run Python script

📊 Information:
  status                Show workspace status
  help, h               Show this help
  clear, cls            Clear terminal

⚡ Claude Code Slash Commands:
  /help                 Show available slash commands
  /clear                Clear terminal and reset state
  /compact              Compact conversation history
  /history              Show command history
  /status               Show detailed workspace status
  /env                  Show environment variables
  /cd <path>            Change working directory
  /pwd                  Show current directory
  /ls [path]            List files in directory
  /git                  Show git command help
  /npm                  Show npm command help
  /reset                Reset CLI environment
  /exit, /quit          Exit CLI

🚀 Navigation:
  exit, quit            Exit CLI

💡 Tips:
  - Use ↑/↓ arrows for command history
  - Use Tab for command completion
  - Use /commands for quick Claude Code actions
  - All commands run in WebContainer environment
  - File operations are synced with IDE workspace`);
  };

  const showStatusCommand = async (term: Terminal) => {
    if (!cliService) return;

    try {
      const status = await cliService.getStatus();
      setWorkspaceStatus(status);

      term.writeln('📊 Workspace Status:');
      term.writeln(`📁 Directory: ${status.workingDirectory}`);

      if (status.gitStatus?.isRepo) {
        term.writeln(`🔧 Git: ${status.gitStatus.branch} (${status.gitStatus.clean ? 'clean' : 'modified'})`);

        const gitFiles = status.gitStatus.files ?? [];
        if (gitFiles.length > 0) {
          term.writeln('📝 Modified files:');
          gitFiles.slice(0, 10).forEach((file: { status: string; path: string }) => {
            term.writeln(`   ${file.status} ${file.path}`);
          });

          if (gitFiles.length > 10) {
            term.writeln(`   ... and ${gitFiles.length - 10} more`);
          }
        }
      } else {
        term.writeln('🔧 Git: Not a repository');
      }

      term.writeln(`📄 Files: ${status.files?.length || 0} in current directory`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ Failed to get status: ${message}`);
    }
  };

  const executeLsCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    try {
      const result = await cliService.executeCommand('ls', args.split(' '));
      if (result.success && result.output) {
        term.writeln(result.output);
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ ls failed: ${message}`);
    }
  };

  const executeCdCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const path = args.trim() || '/';

    try {
      await cliService.changeDirectory(path);
      // Update status after directory change
      const status = await cliService.getStatus();
      setWorkspaceStatus(status);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ ${message}`);
    }
  };

  const executeCatCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const filename = args.trim();
    if (!filename) {
      term.writeln('❌ Usage: cat <filename>');
      return;
    }

    try {
      const result = await cliService.executeCommand('cat', [filename]);
      if (result.success && result.output) {
        term.writeln(result.output);
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ cat failed: ${message}`);
    }
  };

  const executeMkdirCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const dirname = args.trim();
    if (!dirname) {
      term.writeln('❌ Usage: mkdir <dirname>');
      return;
    }

    try {
      const result = await cliService.executeCommand('mkdir', [dirname]);
      if (result.success) {
        term.writeln(`✅ Created directory: ${dirname}`);
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ mkdir failed: ${message}`);
    }
  };

  const executeTouchCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const filename = args.trim();
    if (!filename) {
      term.writeln('❌ Usage: touch <filename>');
      return;
    }

    try {
      const result = await cliService.executeCommand('touch', [filename]);
      if (result.success) {
        term.writeln(`✅ Created file: ${filename}`);
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ touch failed: ${message}`);
    }
  };

  const executeExecCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const task = args.trim();
    if (!task) {
      term.writeln('❌ Usage: exec <task description>');
      return;
    }

    try {
      term.writeln(`🎯 Executing: ${task}`);
      term.writeln(''); // Empty line for readability

      // Use streaming execution for real-time feedback
      const result = await cliService.executeTask(task, {
        onText: (text: string) => {
          // Stream text directly to terminal (character by character)
          term.write(text.replace(/\n/g, '\r\n'));
        },
        onToolUse: (toolName: string, toolInput: Record<string, unknown>) => {
          term.writeln(`\r\n🔧 ${toolName}: ${JSON.stringify(toolInput).slice(0, 100)}...`);
        },
        onToolResult: (toolName: string, result: string) => {
          const preview = result.slice(0, 200);
          term.writeln(`✅ ${toolName} → ${preview}${result.length > 200 ? '...' : ''}`);
        },
        onProgress: (message: string) => {
          // Optional: show progress indicators
        },
        onError: (error: string) => {
          term.writeln(`\r\n❌ Error: ${error}`);
        }
      });

      term.writeln(''); // Empty line before summary

      if (result.success) {
        if (result.artifacts?.filesCreated?.length) {
          term.writeln('📝 Files created:');
          result.artifacts.filesCreated.forEach((file: string) => {
            term.writeln(`   + ${file}`);
          });
        }
        if (result.artifacts?.filesModified?.length) {
          term.writeln('📝 Files modified:');
          result.artifacts.filesModified.forEach((file: string) => {
            term.writeln(`   ~ ${file}`);
          });
        }
        if (result.artifacts?.commandsExecuted?.length) {
          term.writeln('⚡ Commands executed:');
          result.artifacts.commandsExecuted.forEach((cmd: string) => {
            term.writeln(`   $ ${cmd}`);
          });
        }
        term.writeln('✅ Task completed');
      } else {
        term.writeln(`❌ Task failed: ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ exec failed: ${message}`);
    }
  };

  const executeInitCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const projectType = args.trim() || 'basic';

    try {
      term.writeln(`🚀 Initializing ${projectType} project...`);
      const result = await cliService.initProject(projectType);

      if (result.success) {
        term.writeln('✅ Project initialized successfully');

        if (result.artifacts?.filesCreated?.length) {
          term.writeln('📝 Files created:');
          result.artifacts.filesCreated.forEach((file: string) => {
            term.writeln(`   + ${file}`);
          });
        }
      } else {
        term.writeln(`❌ Initialization failed: ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ init failed: ${message}`);
    }
  };

  const executeGitCommand = async (args: string[], term: Terminal) => {
    if (!cliService) return;

    try {
      const result = await cliService.executeCommand('git', args);
      if (result.success) {
        if (result.output) {
          term.writeln(result.output);
        }
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ git failed: ${message}`);
    }
  };

  const executeNpmCommand = async (args: string[], term: Terminal) => {
    if (!cliService) return;

    try {
      const result = await cliService.executeCommand('npm', args);
      if (result.success) {
        if (result.output) {
          term.writeln(result.output);
        }
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ npm failed: ${message}`);
    }
  };

  const executeNodeCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const filename = args.trim();
    if (!filename) {
      term.writeln('❌ Usage: node <filename>');
      return;
    }

    try {
      const result = await cliService.executeCommand('node', [filename]);
      if (result.success) {
        if (result.output) {
          term.writeln(result.output);
        }
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ node failed: ${message}`);
    }
  };

  const executePythonCommand = async (args: string, term: Terminal) => {
    if (!cliService) return;

    const filename = args.trim();
    if (!filename) {
      term.writeln('❌ Usage: python <filename>');
      return;
    }

    try {
      const result = await cliService.executeCommand('python3', [filename]);
      if (result.success) {
        if (result.output) {
          term.writeln(result.output);
        }
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ python failed: ${message}`);
    }
  };

  const executeShellCommand = async (command: string, term: Terminal) => {
    if (!cliService) return;

    try {
      const [cmd, ...args] = command.trim().split(' ');
      const result = await cliService.executeCommand(cmd, args);

      if (result.success) {
        if (result.output) {
          term.writeln(result.output);
        }
      } else if (result.error) {
        term.writeln(`❌ ${result.error}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      term.writeln(`❌ Command failed: ${message}`);
    }
  };

  const getCommandCompletion = (input: string): string | null => {
    const commands = [
      'help', 'status', 'clear', 'ls', 'cat', 'cd', 'pwd',
      'mkdir', 'touch', 'exec', 'init', 'git', 'npm', 'node',
      'python', 'python3', 'exit', 'quit'
    ];

    for (const cmd of commands) {
      if (cmd.startsWith(input)) {
        return cmd;
      }
    }

    return null;
  };

  if (!isInitialized) {
    return (
      <div className={`claude-cli-loading ${className || ''}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Initializing Claude CLI...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`claude-cli h-full flex flex-col ${className || ''}`}>
      <div className="terminal-container bg-gray-900 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="terminal-header bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-gray-400 text-sm">
            Browser IDE - Claude CLI
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-400 hover:text-white text-sm"
          >
            {showHelp ? 'Hide' : 'Help'}
          </button>
        </div>

        {showHelp && (
          <div className="help-panel bg-gray-800 p-4 border-b border-gray-700">
            <h3 className="text-white font-semibold mb-2">Quick Commands:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-300">
                <div><span className="text-green-400">help</span> - Show help</div>
                <div><span className="text-green-400">status</span> - Workspace status</div>
                <div><span className="text-green-400">exec "task"</span> - AI task</div>
                <div><span className="text-green-400">init [type]</span> - New project</div>
              </div>
              <div className="text-gray-300">
                <div><span className="text-green-400">ls</span> - List files</div>
                <div><span className="text-green-400">cd path</span> - Change dir</div>
                <div><span className="text-green-400">cat file</span> - Show file</div>
                <div><span className="text-green-400">clear</span> - Clear terminal</div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={terminalRef}
          className="terminal-output flex-1 min-h-0"
        />

        {workspaceStatus && (
          <div className="status-bar bg-gray-800 px-4 py-2 text-xs text-gray-400 flex items-center justify-between">
            <div>
              📁 {workspaceStatus.workingDirectory}
            </div>
            <div>
              {workspaceStatus.gitStatus?.isRepo ?
                `🔧 ${workspaceStatus.gitStatus.branch} (${workspaceStatus.gitStatus.clean ? 'clean' : 'modified'})` :
                '🔧 Not a git repo'
              }
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-500 text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">Confirm Dangerous Operation</h3>
                  <p className="text-gray-300 text-sm mb-3">{pendingConfirmation.description}</p>
                  <code className="block bg-gray-900 px-3 py-2 rounded text-xs text-yellow-400 mb-4 overflow-x-auto">
                    {pendingConfirmation.operation}
                  </code>
                  <div className="text-gray-400 text-xs mb-4">
                    This action cannot be undone. Are you sure you want to proceed?
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setPendingConfirmation(null);
                        pendingConfirmation.resolve(false);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setPendingConfirmation(null);
                        pendingConfirmation.resolve(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Continue After Error Dialog */}
      {pendingContinue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-500 text-xl">❌</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg mb-1">Tool Execution Failed</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    A tool encountered an error during execution:
                  </p>
                  <code className="block bg-gray-900 px-3 py-2 rounded text-xs text-red-400 mb-4 overflow-x-auto max-h-24 overflow-y-auto">
                    {pendingContinue.error}
                  </code>
                  <div className="text-gray-400 text-xs mb-4">
                    Do you want to continue anyway, or abort the task?
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setPendingContinue(null);
                        pendingContinue.resolve(false);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                    >
                      Abort
                    </button>
                    <button
                      onClick={() => {
                        setPendingContinue(null);
                        pendingContinue.resolve(true);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}