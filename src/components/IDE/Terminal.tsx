import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { webContainer } from '@/services/webcontainer';
import { useIDEStore } from '@/store/useIDEStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MobileInputWrapper } from '@/components/MobileOptimizedLayout';
import { Maximize2, Minimize2 } from 'lucide-react';
import { NanoEditor } from './NanoEditor';
import {
  executeCommand,
  type BackgroundJob,
  type ExecuteCommandOptions,
  type TerminalWriter,
} from '@/services/terminalCommands';
import '@xterm/xterm/css/xterm.css';
import { logger } from '@/utils/logger';

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
  const backgroundProcessesRef = useRef<Map<number, BackgroundJob>>(new Map());
  const nextJobIdRef = useRef(1);

  // Nano editor state
  const [nanoActive, setNanoActive] = useState(false);
  const nanoActiveRef = useRef(false);
  const [nanoFilePath, setNanoFilePath] = useState('');
  const [nanoContent, setNanoContent] = useState('');

  // Granular selectors - individual selectors for each property
  const terminalMaximized = useIDEStore(state => state.terminalMaximized);
  const toggleTerminalMaximized = useIDEStore(state => state.toggleTerminalMaximized);
  const setTerminalMaximized = useIDEStore(state => state.setTerminalMaximized);

  // Stable callback for opening nano from the command service
  const openNano = useCallback((filePath: string, content: string) => {
    setNanoFilePath(filePath);
    setNanoContent(content);
    setNanoActive(true);
  }, []);

  // Handle keyboard shortcuts for terminal maximize
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        toggleTerminalMaximized();
      }
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
      if (webContainer.isBooted()) {
        logger.info('WebContainer already booted, setting ready state');
        if (!cancelled) setBootStatus('ready');
        return;
      }

      logger.info('Booting WebContainer...');
      setBootStatus('booting');
      const result = await webContainer.boot();

      if (!cancelled) {
        if (result.success) {
          logger.info('WebContainer boot complete, setting ready state');
          setBootStatus('ready');
        } else {
          setBootStatus('error');
          logger.error('WebContainer failed to boot:', result.error);
        }
      }
    }

    initWebContainer();

    return () => {
      cancelled = true;
      if (currentProcessRef.current) {
        webContainer.killProcess(currentProcessRef.current);
      }
    };
  }, []);

  // Initialize xterm and wire up input handling
  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

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
      cols: isMobile ? Math.min(80, Math.floor((typeof window !== 'undefined' ? window.innerWidth : 800) / 8)) : 80,
      rows: isMobile ? 15 : 24,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);
    xterm.open(terminalRef.current);
    xterm.focus();

    setTimeout(() => {
      try {
        fitAddon.fit();
        xterm.focus();
      } catch (err) {
        logger.warn('Terminal fit failed, will retry on resize:', err);
      }
    }, 100);

    // Welcome message
    xterm.writeln('Browser IDE Terminal');
    xterm.writeln('');
    xterm.writeln('WebContainer VM Ready');
    xterm.writeln('Supports: npm, pnpm, node, git, and bash commands');
    xterm.writeln('Type "help" for available commands');
    xterm.writeln('');
    xterm.write('$ ');

    let currentLine = '';

    // Build the TerminalWriter adapter that bridges xterm to the service
    const writer: TerminalWriter = {
      writeln: (text: string) => xterm.writeln(text),
      write: (text: string) => xterm.write(text),
      clear: () => xterm.clear(),
    };

    // Run a command through the service
    function runCommand(command: string) {
      const opts: ExecuteCommandOptions = {
        writer,
        callbacks: { openNano },
        commandHistory: commandHistoryRef.current,
        historyIndex: historyIndexRef,
        backgroundProcesses: backgroundProcessesRef.current,
        nextJobId: nextJobIdRef,
        currentProcess: currentProcessRef,
        sessionId: 'default',
      };
      executeCommand(command, opts);
    }

    // Handle keyboard input
    xterm.onData((data) => {
      if (nanoActiveRef.current) return;

      const code = data.charCodeAt(0);

      // Enter
      if (code === 13) {
        runCommand(currentLine);
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

      // Ctrl+C
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

      // Up arrow
      if (data === '\x1b[A') {
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];
          xterm.write('\r\x1b[K$ ');
          currentLine = historyCommand;
          xterm.write(historyCommand);
        }
        return;
      }

      // Down arrow
      if (data === '\x1b[B') {
        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current++;
          const historyCommand = commandHistoryRef.current[historyIndexRef.current];
          xterm.write('\r\x1b[K$ ');
          currentLine = historyCommand;
          xterm.write(historyCommand);
        } else if (historyIndexRef.current === commandHistoryRef.current.length - 1) {
          historyIndexRef.current = commandHistoryRef.current.length;
          xterm.write('\r\x1b[K$ ');
          currentLine = '';
        }
        return;
      }

      // Regular printable character
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
          const rect = terminalRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            fitAddonRef.current.fit();
            if (isMobile && xterm) {
              const maxCols = Math.min(80, Math.floor(rect.width / 8));
              const maxRows = Math.max(10, Math.floor(rect.height / 16));
              if (xterm.cols > maxCols) xterm.resize(maxCols, xterm.rows);
              if (xterm.rows > maxRows) xterm.resize(xterm.cols, maxRows);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync nano active state to ref for input handler
  useEffect(() => {
    nanoActiveRef.current = nanoActive;
  }, [nanoActive]);

  return (
    <MobileInputWrapper shouldPreventZoom={true}>
      <div
        className={`
          terminal flex flex-col h-full bg-gray-900
          ${terminalMaximized ? 'terminal-maximized terminal-maximize-transition' : ''}
        `}
        role="region"
        aria-label="Integrated terminal"
        aria-live="polite"
      >
        <div
          className="terminal-header px-2 sm:px-4 py-1 sm:py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0 min-h-[32px] sm:min-h-[40px]"
          role="presentation"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-xs sm:text-sm" id="terminal-title">
              Terminal
              {terminalMaximized && <span className="ml-2 text-xs text-blue-400">(Maximized)</span>}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {bootStatus === 'booting' && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-yellow-400" role="status" aria-live="polite">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" aria-hidden="true" />
                <span className="hidden sm:inline">Booting WebContainer...</span>
                <span className="sm:hidden">Booting...</span>
              </div>
            )}
            {bootStatus === 'ready' && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-green-400" role="status" aria-live="polite">
                <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true" />
                <span className="hidden sm:inline">Ready</span>
                <span className="sm:hidden">Ready</span>
              </div>
            )}
            {bootStatus === 'error' && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-red-400" role="alert" aria-live="assertive">
                <div className="w-2 h-2 bg-red-400 rounded-full" aria-hidden="true" />
                <span className="hidden sm:inline">Boot Failed</span>
                <span className="sm:hidden">Error</span>
              </div>
            )}

            <button
              onClick={toggleTerminalMaximized}
              className={`
                maximize-button p-1 sm:p-2 rounded hover:bg-gray-700 transition-colors
                touch-manipulation min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0
                ${terminalMaximized ? 'text-blue-400' : 'text-gray-400'}
              `}
              title={`${terminalMaximized ? 'Restore Terminal' : 'Maximize Terminal'} (Ctrl+Shift+M)`}
              aria-label={`${terminalMaximized ? 'Restore Terminal' : 'Maximize Terminal'}`}
              aria-pressed={terminalMaximized}
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
          role="textbox"
          aria-label="Terminal input/output"
          aria-multiline="true"
          aria-readonly="true"
          tabIndex={0}
          onClick={() => xtermRef.current?.focus()}
          onTouchEnd={(e) => {
            e.preventDefault();
            setTimeout(() => xtermRef.current?.focus(), 50);
          }}
          style={{
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            WebkitTouchCallout: 'none',
          }}
        />

        {nanoActive && xtermRef.current && (
          <NanoEditor
            xterm={xtermRef.current}
            filePath={nanoFilePath}
            initialContent={nanoContent}
            onExit={() => {
              setNanoActive(false);
              setNanoFilePath('');
              setNanoContent('');
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
