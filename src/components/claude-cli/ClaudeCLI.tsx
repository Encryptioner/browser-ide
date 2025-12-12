import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ClaudeCLIService, createCLIService, type CLIOptions, type CLIResult } from '../services/claude-cli';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useIDEStore } from '../store/useIDEStore';

interface ClaudeCLIProps {
  className?: string;
  options?: CLIOptions;
  onCommand?: (command: string, result: CLIResult) => void;
}

export function ClaudeCLI({ className, options, onCommand }: ClaudeCLIProps) {
  const [cliService, setCliService] = useState<ClaudeCLIService | null>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState<any>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputBuffer = useRef('');
  const cursorPosition = useRef(0);

  const { activeProject, currentDirectory } = useWorkspaceStore();
  const { addNotification } = useIDEStore();

  // Initialize CLI service
  useEffect(() => {
    const service = createCLIService({
      provider: options?.provider || 'anthropic',
      apiKey: options?.apiKey,
      workingDirectory: activeProject?.path || currentDirectory || '/workspace'
    });

    service.initialize()
      .then(() => {
        setCliService(service);
        setIsInitialized(true);

        // Get initial status
        service.getStatus().then(setWorkspaceStatus);
      })
      .catch(error => {
        addNotification({
          type: 'error',
          message: `Failed to initialize CLI: ${error.message}`
        });
      });

    return () => {
      service.cleanup();
    };
  }, [activeProject?.path, currentDirectory]);

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
        cursor: '#00ff00',
        selection: '#444444'
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
    term.writeln(`🚀 Browser IDE Pro - Claude CLI v2.0.0`);
    term.writeln(`🔧 WebContainer environment ready`);
    term.writeln(`📁 Working directory: ${activeProject?.path || '/workspace'}`);
    term.writeln('');
    term.write('claude> ');

    // Handle terminal input
    term.onData((data) => {
      handleTerminalInput(data, term);
    });

    setTerminal(term);
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

    function handleResize() {
      setTimeout(() => {
        try {
          fitAddon.fit();
        } catch (error) {
          // Ignore resize errors
        }
      }, 100);
    }
  }, [isInitialized, activeProject?.path]);

  const handleTerminalInput = useCallback((data: string, term: Terminal) => {
    if (isExecuting) return;

    switch (data) {
      case '\r': // Enter
        const command = inputBuffer.current.trim();
        if (command) {
          executeCommand(command, term);
        } else {
          term.write('\r\nclaude> ');
        }
        inputBuffer.current = '';
        cursorPosition.current = 0;
        break;

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
    } catch (error: any) {
      term.writeln(`❌ Error: ${error.message}`);
    } finally {
      setIsExecuting(false);
      term.write('claude> ');
    }

    onCommand?.(command, { success: true });
  }, [cliService, workspaceStatus, onCommand]);

  const showHelpCommand = (term: Terminal) => {
    term.writeln(`🤖 Browser IDE Pro - Claude CLI Commands:

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

        if (status.gitStatus.files?.length > 0) {
          term.writeln('📝 Modified files:');
          status.gitStatus.files.slice(0, 10).forEach((file: any) => {
            term.writeln(`   ${file.status} ${file.path}`);
          });

          if (status.gitStatus.files.length > 10) {
            term.writeln(`   ... and ${status.gitStatus.files.length - 10} more`);
          }
        }
      } else {
        term.writeln('🔧 Git: Not a repository');
      }

      term.writeln(`📄 Files: ${status.files?.length || 0} in current directory`);
    } catch (error: any) {
      term.writeln(`❌ Failed to get status: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ ls failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ cat failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ mkdir failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ touch failed: ${error.message}`);
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
      term.writeln(`🎯 Executing task: ${task}`);
      const result = await cliService.executeTask(task, {
        onProgress: (message) => {
          term.writeln(`🔧 ${message}`);
        },
        onOutput: (output) => {
          term.writeln(output);
        }
      });

      if (result.success) {
        term.writeln('✅ Task completed successfully');

        if (result.artifacts?.filesCreated?.length) {
          term.writeln('📝 Files created:');
          result.artifacts.filesCreated.forEach((file: string) => {
            term.writeln(`   + ${file}`);
          });
        }
      } else {
        term.writeln(`❌ Task failed: ${result.error}`);
      }
    } catch (error: any) {
      term.writeln(`❌ exec failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ init failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ git failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ npm failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ node failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ python failed: ${error.message}`);
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
    } catch (error: any) {
      term.writeln(`❌ Command failed: ${error.message}`);
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
    <div className={`claude-cli ${className || ''}`}>
      <div className="terminal-container bg-gray-900 rounded-lg overflow-hidden">
        <div className="terminal-header bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-gray-400 text-sm">
            Browser IDE Pro - Claude CLI v2.0.0
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
          className="terminal-output"
          style={{ height: '400px' }}
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
    </div>
  );
}