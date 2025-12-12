import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, StepForward, ArrowRight, SkipForward, Bug, X, Plus, Settings, ChevronDown, ChevronRight, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useIDEStore } from '@/store/useIDEStore';
import { DebugSession, DebugBreakpoint, DebugThread, DebugStackFrame, DebugVariable, DebugConfiguration, DebugConsoleMessage, DebugScope } from '@/types';
import { clsx } from 'clsx';
import { nanoid } from 'nanoid';

interface DebuggerProps {
  className?: string;
}

export function Debugger({ className }: DebuggerProps) {
  const {
    activeProjectId,
    openFiles,
    setActiveDebugSession,
    addBreakpoint,
    removeBreakpoint,
    updateBreakpoint,
    debugSessions,
    activeDebugSessionId,
  } = useIDEStore();

  const [sessions, setSessions] = useState<DebugSession[]>([]);
  const [activeSession, setActiveSession] = useState<DebugSession | null>(null);
  const [selectedThread, setSelectedThread] = useState<DebugThread | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<DebugStackFrame | null>(null);
  const [expandedScopes, setExpandedScopes] = useState<Set<number>>(new Set());
  const [expandedVariables, setExpandedVariables] = useState<Set<number>>(new Set());
  const [consoleMessages, setConsoleMessages] = useState<DebugConsoleMessage[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [newBreakpoint, setNewBreakpoint] = useState<Partial<DebugBreakpoint> | null>(null);
  const [debugConfig, setDebugConfig] = useState<DebugConfiguration>({
    type: 'node',
    name: 'Debug Current File',
    request: 'launch',
    program: '',
    cwd: '/repo',
    stopOnEntry: false,
    console: 'integratedTerminal',
  });

  const consoleRef = useRef<HTMLDivElement>(null);

  // Load existing sessions
  useEffect(() => {
    if (activeProjectId && debugSessions) {
      const projectSessions = Object.values(debugSessions).flat();
      setSessions(projectSessions);

      const active = projectSessions.find(s => s.id === activeDebugSessionId);
      if (active) {
        setActiveSession(active);
        if (active.threads.length > 0) {
          setSelectedThread(active.threads[0]);
        }
      }
    }
  }, [activeProjectId, debugSessions, activeDebugSessionId]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleMessages]);

  const startDebugSession = useCallback(async () => {
    if (!activeProjectId) return;

    const newSession: DebugSession = {
      id: nanoid(),
      name: debugConfig.name,
      type: debugConfig.type,
      request: debugConfig.request,
      configuration: debugConfig,
      workspaceFolder: '/repo',
      running: true,
      threads: [],
      breakpoints: [],
      watchExpressions: [],
    };

    try {
      setActiveDebugSession?.(activeProjectId, newSession.id);
      setActiveSession(newSession);
      setSessions(prev => [...prev, newSession]);

      // Simulate debug session initialization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add a mock thread for demonstration
      const mockThread: DebugThread = {
        id: 1,
        name: 'Main Thread',
        state: 'stopped',
        stoppedReason: 'breakpoint',
      };

      newSession.threads.push(mockThread);
      setSelectedThread(mockThread);

      // Add console message
      const message: DebugConsoleMessage = {
        id: nanoid(),
        type: 'info',
        message: `Debug session started: ${debugConfig.name}`,
        timestamp: Date.now(),
      };

      setConsoleMessages(prev => [...prev, message]);

    } catch (error) {
      console.error('Failed to start debug session:', error);

      const errorMessage: DebugConsoleMessage = {
        id: nanoid(),
        type: 'error',
        message: `Failed to start debug session: ${error}`,
        timestamp: Date.now(),
      };

      setConsoleMessages(prev => [...prev, errorMessage]);
    }
  }, [activeProjectId, debugConfig, setActiveDebugSession]);

  const stopDebugSession = useCallback(async () => {
    if (!activeSession) return;

    try {
      activeSession.running = false;

      const message: DebugConsoleMessage = {
        id: nanoid(),
        type: 'info',
        message: `Debug session stopped: ${activeSession.name}`,
        timestamp: Date.now(),
      };

      setConsoleMessages(prev => [...prev, message]);
      setActiveSession(null);
      setSelectedThread(null);
      setSelectedFrame(null);

    } catch (error) {
      console.error('Failed to stop debug session:', error);
    }
  }, [activeSession]);

  const restartDebugSession = useCallback(async () => {
    await stopDebugSession();
    await startDebugSession();
  }, [stopDebugSession, startDebugSession]);

  const addBreakpointAction = useCallback(() => {
    if (!newBreakpoint || !newBreakpoint.path || !newBreakpoint.line) return;

    const breakpoint: DebugBreakpoint = {
      id: nanoid(),
      path: newBreakpoint.path,
      line: newBreakpoint.line,
      column: newBreakpoint.column || 0,
      enabled: true,
      condition: newBreakpoint.condition,
      hitCount: newBreakpoint.hitCount,
      logMessage: newBreakpoint.logMessage,
    };

    addBreakpoint?.(breakpoint);

    if (activeSession) {
      activeSession.breakpoints.push(breakpoint);
    }

    setNewBreakpoint(null);

    const message: DebugConsoleMessage = {
      id: nanoid(),
      type: 'info',
      message: `Breakpoint added at ${newBreakpoint.path}:${newBreakpoint.line}`,
      timestamp: Date.now(),
    };

    setConsoleMessages(prev => [...prev, message]);
  }, [newBreakpoint, activeSession, addBreakpoint]);

  const toggleBreakpoint = useCallback((breakpoint: DebugBreakpoint) => {
    const updatedBreakpoint = { ...breakpoint, enabled: !breakpoint.enabled };
    updateBreakpoint?.(updatedBreakpoint);

    if (activeSession) {
      const index = activeSession.breakpoints.findIndex(bp => bp.id === breakpoint.id);
      if (index !== -1) {
        activeSession.breakpoints[index] = updatedBreakpoint;
      }
    }
  }, [activeSession, updateBreakpoint]);

  const removeBreakpointAction = useCallback((breakpointId: string) => {
    removeBreakpoint?.(breakpointId);

    if (activeSession) {
      activeSession.breakpoints = activeSession.breakpoints.filter(bp => bp.id !== breakpointId);
    }

    const message: DebugConsoleMessage = {
      id: nanoid(),
      type: 'info',
      message: 'Breakpoint removed',
      timestamp: Date.now(),
    };

    setConsoleMessages(prev => [...prev, message]);
  }, [activeSession, removeBreakpoint]);

  const continueDebug = useCallback(async () => {
    if (!selectedThread || !activeSession) return;

    // Mock continue action
    selectedThread.state = 'running';

    const message: DebugConsoleMessage = {
      id: nanoid(),
      type: 'info',
      message: `Continuing thread ${selectedThread.name}`,
      timestamp: Date.now(),
    };

    setConsoleMessages(prev => [...prev, message]);

    // Simulate execution
    setTimeout(() => {
      selectedThread.state = 'stopped';
      selectedThread.stoppedReason = 'pause';
    }, 2000);
  }, [selectedThread, activeSession]);

  const stepOverAction = useCallback(async () => {
    if (!selectedThread) return;

    // Mock step over
    const message: DebugConsoleMessage = {
      id: nanoid(),
      type: 'info',
      message: `Step over in ${selectedThread.name}`,
      timestamp: Date.now(),
    };

    setConsoleMessages(prev => [...prev, message]);
  }, [selectedThread]);

  const stepIntoAction = useCallback(async () => {
    if (!selectedThread) return;

    // Mock step into
    const message: DebugConsoleMessage = {
      id: nanoid(),
      type: 'info',
      message: `Step into in ${selectedThread.name}`,
      timestamp: Date.now(),
    };

    setConsoleMessages(prev => [...prev, message]);
  }, [selectedThread]);

  const stepOutAction = useCallback(async () => {
    if (!selectedThread) return;

    // Mock step out
    const message: DebugConsoleMessage = {
      id: nanoid(),
      type: 'info',
      message: `Step out from ${selectedThread.name}`,
      timestamp: Date.now(),
    };

    setConsoleMessages(prev => [...prev, message]);
  }, [selectedThread]);

  const mockVariables: DebugVariable[] = [
    {
      name: 'console',
      value: 'Object',
      type: 'Object',
      variablesReference: 1,
    },
    {
      name: 'process',
      value: 'Object',
      type: 'Object',
      variablesReference: 2,
    },
    {
      name: 'module',
      value: 'Object',
      type: 'Object',
      variablesReference: 3,
    },
    {
      name: 'require',
      value: 'function require()',
      type: 'Function',
    },
    {
      name: '__filename',
      value: '/repo/index.js',
      type: 'string',
    },
    {
      name: '__dirname',
      value: '/repo',
      type: 'string',
    },
  ];

  const mockScopes: DebugScope[] = [
    {
      name: 'Locals',
      presentationHint: 'locals',
      variablesReference: 1,
      expensive: false,
    },
    {
      name: 'Globals',
      presentationHint: 'globals',
      variablesReference: 2,
      expensive: false,
    },
    {
      name: 'Closure',
      variablesReference: 3,
      expensive: false,
    },
  ];

  const mockBreakpoints: DebugBreakpoint[] = activeSession?.breakpoints || [];

  return (
    <div className={clsx('debugger flex flex-col h-full bg-gray-900 text-gray-100', className)}>
      {/* Debug Toolbar */}
      <div className="debug-toolbar flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        {!activeSession ? (
          <>
            <button
              onClick={startDebugSession}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              title="Start Debugging"
            >
              <Play className="w-4 h-4" />
              Start
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 hover:bg-gray-700 rounded"
              title="Debug Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={continueDebug}
              className="p-2 hover:bg-gray-700 rounded"
              title="Continue (F5)"
              disabled={selectedThread?.state !== 'stopped'}
            >
              <Play className="w-4 h-4" />
            </button>

            <button
              onClick={stepOverAction}
              className="p-2 hover:bg-gray-700 rounded"
              title="Step Over (F10)"
              disabled={selectedThread?.state !== 'stopped'}
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={stepIntoAction}
              className="p-2 hover:bg-gray-700 rounded"
              title="Step Into (F11)"
              disabled={selectedThread?.state !== 'stopped'}
            >
              <StepForward className="w-4 h-4" />
            </button>

            <button
              onClick={stepOutAction}
              className="p-2 hover:bg-gray-700 rounded"
              title="Step Out (Shift+F11)"
              disabled={selectedThread?.state !== 'stopped'}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={restartDebugSession}
              className="p-2 hover:bg-gray-700 rounded"
              title="Restart (Ctrl+Shift+F5)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={stopDebugSession}
              className="p-2 hover:bg-gray-700 rounded text-red-400"
              title="Stop (Shift+F5)"
            >
              <Square className="w-4 h-4" />
            </button>

            <div className="flex-1 flex items-center justify-end gap-2">
              <span className="text-xs text-gray-400">Debugging:</span>
              <span className="text-xs font-medium">{activeSession.name}</span>
              {selectedThread && (
                <>
                  <span className="text-xs text-gray-400">Thread:</span>
                  <span className="text-xs font-medium">{selectedThread.name}</span>
                  <span className={clsx(
                    'text-xs px-2 py-1 rounded',
                    selectedThread.state === 'running' ? 'bg-green-900 text-green-300' :
                    selectedThread.state === 'stopped' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  )}>
                    {selectedThread.state}
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Debug Configuration Panel */}
      {showConfig && (
        <div className="debug-config p-4 bg-gray-800 border-b border-gray-700">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select
                  value={debugConfig.type}
                  onChange={(e) => setDebugConfig(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-2 py-1 bg-gray-700 text-sm rounded"
                >
                  <option value="node">Node.js</option>
                  <option value="chrome">Chrome</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Request</label>
                <select
                  value={debugConfig.request}
                  onChange={(e) => setDebugConfig(prev => ({ ...prev, request: e.target.value as 'launch' | 'attach' }))}
                  className="w-full px-2 py-1 bg-gray-700 text-sm rounded"
                >
                  <option value="launch">Launch</option>
                  <option value="attach">Attach</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Program</label>
              <input
                type="text"
                value={debugConfig.program}
                onChange={(e) => setDebugConfig(prev => ({ ...prev, program: e.target.value }))}
                placeholder="Path to program"
                className="w-full px-2 py-1 bg-gray-700 text-sm rounded"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Working Directory</label>
              <input
                type="text"
                value={debugConfig.cwd}
                onChange={(e) => setDebugConfig(prev => ({ ...prev, cwd: e.target.value }))}
                placeholder="Working directory"
                className="w-full px-2 py-1 bg-gray-700 text-sm rounded"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={debugConfig.stopOnEntry}
                  onChange={(e) => setDebugConfig(prev => ({ ...prev, stopOnEntry: e.target.checked }))}
                  className="rounded"
                />
                Stop on entry
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Debug Content */}
      <div className="debug-content flex-1 overflow-hidden">
        {activeSession ? (
          <div className="flex h-full">
            {/* Left Panel - Variables and Watch */}
            <div className="w-80 border-r border-gray-700 flex flex-col">
              {/* Variables */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                  <span className="text-sm font-medium">Variables</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {mockScopes.map((scope) => (
                    <div key={scope.name} className="mb-2">
                      <button
                        onClick={() => {
                          setExpandedScopes(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(scope.variablesReference)) {
                              newSet.delete(scope.variablesReference);
                            } else {
                              newSet.add(scope.variablesReference);
                            }
                            return newSet;
                          });
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1 hover:bg-gray-800 rounded text-left"
                      >
                        {expandedScopes.has(scope.variablesReference) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span className="text-sm">{scope.name}</span>
                      </button>

                      {expandedScopes.has(scope.variablesReference) && (
                        <div className="ml-4 space-y-1">
                          {mockVariables.map((variable) => (
                            <div
                              key={variable.name}
                              className={clsx(
                                'flex items-start gap-2 px-2 py-1 hover:bg-gray-800 rounded',
                                variable.variablesReference && 'cursor-pointer'
                              )}
                              onClick={() => {
                                if (variable.variablesReference) {
                                  setExpandedVariables(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(variable.variablesReference!)) {
                                      newSet.delete(variable.variablesReference!);
                                    } else {
                                      newSet.add(variable.variablesReference!);
                                    }
                                    return newSet;
                                  });
                                }
                              }}
                            >
                              {variable.variablesReference && (
                                expandedVariables.has(variable.variablesReference) ? (
                                  <ChevronDown className="w-3 h-3 mt-0.5" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 mt-0.5" />
                                )
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">{variable.type}</span>
                                  <span className="text-sm font-mono truncate">{variable.name}</span>
                                </div>
                                <div className="text-xs text-gray-400 truncate">{variable.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Watch */}
              <div className="border-t border-gray-700">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                  <span className="text-sm font-medium">Watch</span>
                  <button
                    onClick={() => {
                      // Add watch expression
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-2">
                  <div className="text-xs text-gray-500">Add expressions to watch</div>
                </div>
              </div>

              {/* Breakpoints */}
              <div className="border-t border-gray-700">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
                  <span className="text-sm font-medium">Breakpoints</span>
                  <button
                    onClick={() => setNewBreakpoint({ path: '', line: 1 })}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-y-auto max-h-40">
                  {mockBreakpoints.map((breakpoint) => (
                    <div
                      key={breakpoint.id}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800"
                    >
                      <button
                        onClick={() => toggleBreakpoint(breakpoint)}
                        className="p-1 hover:bg-gray-700 rounded"
                      >
                        {breakpoint.enabled ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono truncate">
                          {breakpoint.path.split('/').pop()}:{breakpoint.line}
                        </div>
                        {breakpoint.condition && (
                          <div className="text-xs text-yellow-400">
                            Condition: {breakpoint.condition}
                          </div>
                        )}
                        {breakpoint.logMessage && (
                          <div className="text-xs text-blue-400">
                            Log: {breakpoint.logMessage}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => removeBreakpointAction(breakpoint.id)}
                        className="p-1 hover:bg-gray-700 rounded text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {newBreakpoint && (
                    <div className="p-2 border-t border-gray-700">
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="File path"
                          value={newBreakpoint.path || ''}
                          onChange={(e) => setNewBreakpoint(prev => ({ ...prev, path: e.target.value }))}
                          className="w-full px-2 py-1 bg-gray-700 text-sm rounded"
                        />

                        <input
                          type="number"
                          placeholder="Line number"
                          value={newBreakpoint.line || ''}
                          onChange={(e) => setNewBreakpoint(prev => ({ ...prev, line: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 bg-gray-700 text-sm rounded"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={addBreakpointAction}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setNewBreakpoint(null)}
                            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Panel - Call Stack */}
            <div className="w-64 border-r border-gray-700 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm font-medium">Call Stack</span>
                <Bug className="w-4 h-4" />
              </div>

              <div className="flex-1 overflow-y-auto">
                {selectedThread && (
                  <div className="space-y-1 p-2">
                    <div className="text-xs text-gray-500 mb-2">Active Thread: {selectedThread.name}</div>

                    <div className="space-y-1">
                      <div className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-sm">
                        main (index.js:1)
                      </div>

                      <div className="px-2 py-1 hover:bg-gray-800 rounded text-sm cursor-pointer">
                        app.listen (app.js:42)
                      </div>

                      <div className="px-2 py-1 hover:bg-gray-800 rounded text-sm cursor-pointer">
                        setupServer (server.js:15)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Console */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-sm font-medium">Debug Console</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConsoleMessages([])}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Clear Console"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div
                ref={consoleRef}
                className="flex-1 overflow-y-auto p-3 font-mono text-sm"
                style={{ fontFamily: 'Consolas, Monaco, monospace' }}
              >
                {consoleMessages.length === 0 ? (
                  <div className="text-gray-500 text-xs">Debug console output will appear here...</div>
                ) : (
                  <div className="space-y-1">
                    {consoleMessages.map((message) => (
                      <div
                        key={message.id}
                        className={clsx(
                          'flex items-start gap-2',
                          message.type === 'error' && 'text-red-400',
                          message.type === 'warning' && 'text-yellow-400',
                          message.type === 'info' && 'text-blue-400',
                          message.type === 'debug' && 'text-gray-400'
                        )}
                      >
                        <span className="text-gray-500 text-xs">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="flex-1">{message.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Console Input */}
              <div className="border-t border-gray-700 p-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type expression to evaluate..."
                    className="flex-1 px-2 py-1 bg-gray-700 text-sm rounded"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const evaluationMessage: DebugConsoleMessage = {
                          id: nanoid(),
                          type: 'info',
                          message: `> ${e.currentTarget.value}`,
                          timestamp: Date.now(),
                        };

                        setConsoleMessages(prev => [...prev, evaluationMessage]);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm">
                    Evaluate
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bug className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <div className="text-gray-400 mb-2">No active debug session</div>
              <div className="text-sm text-gray-500">
                Click the "Start" button to begin debugging
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Debugger;