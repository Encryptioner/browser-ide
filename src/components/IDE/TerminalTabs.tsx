import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Terminal, ChevronDown, Settings, Copy, Trash2, SplitSquareVertical, Monitor, Cpu, Package, FolderOpen, GitBranch, AlertCircle, CheckCircle, Play, Square, RotateCcw } from 'lucide-react';
import { useIDEStore } from '@/store/useIDEStore';
import { WebContainerProcess, WebContainerServer } from '@/types';
import { clsx } from 'clsx';
import { nanoid } from 'nanoid';

interface TerminalProfile {
  id: string;
  name: string;
  command: string;
  args?: string[];
  icon: React.ReactNode;
  description: string;
  env?: Record<string, string>;
  cwd?: string;
}

interface TerminalTab {
  id: string;
  title: string;
  process?: WebContainerProcess;
  profile: TerminalProfile;
  history: string[];
  historyIndex: number;
  active: boolean;
  createdAt: number;
  lastUsed: number;
  status: 'running' | 'stopped' | 'error' | 'pending';
  exitCode?: number;
}

interface TerminalTabsProps {
  className?: string;
}

const DEFAULT_PROFILES: TerminalProfile[] = [
  {
    id: 'bash',
    name: 'Bash',
    command: '/bin/bash',
    icon: <Terminal className="w-4 h-4" />,
    description: 'Default bash shell',
  },
  {
    id: 'node',
    name: 'Node.js',
    command: 'node',
    icon: <Cpu className="w-4 h-4 text-green-400" />,
    description: 'Node.js REPL',
  },
  {
    id: 'npm',
    name: 'NPM',
    command: 'npm',
    args: [],
    icon: <Package className="w-4 h-4 text-red-400" />,
    description: 'Node Package Manager',
  },
  {
    id: 'pnpm',
    name: 'PNPM',
    command: 'pnpm',
    args: [],
    icon: <Package className="w-4 h-4 text-orange-400" />,
    description: 'Fast, disk space efficient package manager',
  },
  {
    id: 'yarn',
    name: 'Yarn',
    command: 'yarn',
    args: [],
    icon: <Package className="w-4 h-4 text-blue-400" />,
    description: 'Fast, reliable, and secure dependency management',
  },
  {
    id: 'git',
    name: 'Git',
    command: 'git',
    args: ['status'],
    icon: <GitBranch className="w-4 h-4 text-orange-500" />,
    description: 'Git version control',
  },
  {
    id: 'server',
    name: 'Development Server',
    command: 'npm',
    args: ['run', 'dev'],
    icon: <Monitor className="w-4 h-4 text-blue-500" />,
    description: 'Start development server',
  },
  {
    id: 'workspace',
    name: 'Workspace Terminal',
    command: '/bin/bash',
    icon: <FolderOpen className="w-4 h-4 text-purple-400" />,
    description: 'Terminal at workspace root',
  },
];

export function TerminalTabs({ className }: TerminalTabsProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showTabMenu, setShowTabMenu] = useState<string | null>(null);
  const [customProfiles, setCustomProfiles] = useState<TerminalProfile[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<Record<string, string[]>>({});
  const [terminalInput, setTerminalInput] = useState<Record<string, string>>({});
  const [serverInfo, setServerInfo] = useState<Record<string, WebContainerServer | null>>({});
  const terminalRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { webContainerService } = useIDEStore();

  // Initialize with one default tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab('bash');
    }
  }, []);

  const createNewTab = useCallback((profileId: string, customName?: string) => {
    const profile = DEFAULT_PROFILES.find(p => p.id === profileId) ||
                   customProfiles.find(p => p.id === profileId);

    if (!profile) return;

    const newTab: TerminalTab = {
      id: nanoid(),
      title: customName || profile.name,
      profile,
      history: [''],
      historyIndex: 0,
      active: true,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      status: 'pending',
    };

    // Set other tabs as inactive
    setTabs(prev => prev.map(tab => ({ ...tab, active: false })));

    // Add new tab and make it active
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setShowProfileSelector(false);

    // Initialize terminal state
    setTerminalOutput(prev => ({ ...prev, [newTab.id]: [] }));
    setTerminalInput(prev => ({ ...prev, [newTab.id]: '' }));

    // Start the terminal process
    setTimeout(() => {
      startTerminalProcess(newTab.id);
    }, 100);
  }, [DEFAULT_PROFILES, customProfiles]);

  const startTerminalProcess = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !webContainerService) return;

    try {
      setTabs(prev => prev.map(t =>
        t.id === tabId ? { ...t, status: 'pending' } : t
      ));

      const process = await webContainerService.spawnProcess(
        tab.profile.command,
        tab.profile.args || []
      );

      // Update tab with process info
      setTabs(prev => prev.map(t =>
        t.id === tabId ? { ...t, process, status: 'running' } : t
      ));

      // Add welcome message
      setTerminalOutput(prev => ({
        ...prev,
        [tabId]: [
          `$ ${tab.profile.command}${tab.profile.args ? ' ' + tab.profile.args.join(' ') : ''}`,
          'Terminal started successfully',
          ''
        ]
      }));

    } catch (error) {
      console.error('Failed to start terminal process:', error);
      setTabs(prev => prev.map(t =>
        t.id === tabId ? {
          ...t,
          status: 'error',
          exitCode: 1
        } : t
      ));

      setTerminalOutput(prev => ({
        ...prev,
        [tabId]: [
          `Failed to start terminal: ${error}`,
          'Please check the profile configuration',
          ''
        ]
      }));
    }
  }, [tabs, webContainerService]);

  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Kill the process if running
    if (tab.process && tab.status === 'running') {
      webContainerService?.killProcess(tab.process.id);
    }

    // Remove tab
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);

      // If closing active tab, activate another one
      if (tabId === activeTabId) {
        const nextTab = newTabs[0];
        if (nextTab) {
          setActiveTabId(nextTab.id);
          setTabs(prev => prev.map(t =>
            t.id === nextTab.id ? { ...t, active: true } : t
          ));
        } else {
          setActiveTabId(null);
        }
      }

      return newTabs;
    });

    // Clean up state
    setTerminalOutput(prev => {
      const newState = { ...prev };
      delete newState[tabId];
      return newState;
    });

    setTerminalInput(prev => {
      const newState = { ...prev };
      delete newState[tabId];
      return newState;
    });

    setShowTabMenu(null);
  }, [tabs, activeTabId, webContainerService]);

  const switchTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    setTabs(prev => prev.map(tab => ({
      ...tab,
      active: tab.id === tabId,
      lastUsed: Date.now(),
    })));

    setShowTabMenu(null);
  }, []);

  const splitTab = useCallback((tabId: string, direction: 'horizontal' | 'vertical' = 'horizontal') => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const newProfile: TerminalProfile = {
      ...tab.profile,
      id: nanoid(),
      name: `${tab.profile.name} (Split)`,
      description: `Split from ${tab.profile.name}`,
    };

    setCustomProfiles(prev => [...prev, newProfile]);
    createNewTab(newProfile.id, `${tab.title} (Split)`);
    setShowTabMenu(null);
  }, [tabs, createNewTab]);

  const duplicateTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    createNewTab(tab.profile.id, `${tab.title} (Copy)`);
    setShowTabMenu(null);
  }, [tabs, createNewTab]);

  const restartTab = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Kill existing process
    if (tab.process) {
      webContainerService?.killProcess(tab.process.id);
    }

    // Clear output
    setTerminalOutput(prev => ({ ...prev, [tabId]: [] }));
    setTerminalInput(prev => ({ ...prev, [tabId]: '' }));

    // Restart process
    await startTerminalProcess(tabId);
    setShowTabMenu(null);
  }, [tabs, startTerminalProcess, webContainerService]);

  const executeCommand = useCallback(async (tabId: string, command: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.process || tab.status !== 'running') return;

    try {
      // Add command to output
      setTerminalOutput(prev => ({
        ...prev,
        [tabId]: [...(prev[tabId] || []), `$ ${command}`]
      }));

      // Clear input
      setTerminalInput(prev => ({ ...prev, [tabId]: '' }));

      // Send command to process
      await webContainerService?.sendInput(tab.process.id, command + '\n');

    } catch (error) {
      console.error('Failed to execute command:', error);
      setTerminalOutput(prev => ({
        ...prev,
        [tabId]: [...(prev[tabId] || []), `Error: ${error}`]
      }));
    }
  }, [tabs, webContainerService]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent, tabId: string) => {
    const input = e.currentTarget;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        const command = input.value.trim();
        if (command) {
          executeCommand(tabId, command);

          // Add to history
          setTabs(prev => prev.map(tab => {
            if (tab.id === tabId) {
              const newHistory = [...tab.history];
              if (newHistory[0] !== command) {
                newHistory.unshift(command);
                if (newHistory.length > 100) {
                  newHistory.pop();
                }
              }
              return { ...tab, history: newHistory, historyIndex: 0 };
            }
            return tab;
          }));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        setTabs(prev => prev.map(tab => {
          if (tab.id === tabId && tab.historyIndex < tab.history.length - 1) {
            const newIndex = tab.historyIndex + 1;
            const historyCommand = tab.history[newIndex];
            setTerminalInput(prev => ({ ...prev, [tabId]: historyCommand || '' }));
            return { ...tab, historyIndex: newIndex };
          }
          return tab;
        }));
        break;

      case 'ArrowDown':
        e.preventDefault();
        setTabs(prev => prev.map(tab => {
          if (tab.id === tabId && tab.historyIndex > 0) {
            const newIndex = tab.historyIndex - 1;
            const historyCommand = newIndex === 0 ? '' : tab.history[newIndex];
            setTerminalInput(prev => ({ ...prev, [tabId]: historyCommand }));
            return { ...tab, historyIndex: newIndex };
          }
          return tab;
        }));
        break;

      case 'Tab':
        e.preventDefault();
        // Basic tab completion could be implemented here
        break;

      case 'Escape':
        // Clear input
        setTerminalInput(prev => ({ ...prev, [tabId]: '' }));
        break;
    }
  }, [executeCommand]);

  const copyOutput = useCallback((tabId: string) => {
    const output = terminalOutput[tabId]?.join('\n') || '';
    navigator.clipboard.writeText(output).then(() => {
      // Show toast notification (would need toast implementation)
      console.log('Terminal output copied to clipboard');
    });
  }, [terminalOutput]);

  const clearOutput = useCallback((tabId: string) => {
    setTerminalOutput(prev => ({ ...prev, [tabId]: [] }));
    setShowTabMenu(null);
  }, []);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const showTabBar = tabs.length > 0;

  return (
    <div className={clsx('terminal-tabs flex flex-col h-full bg-gray-900 text-gray-100', className)}>
      {/* Tab Bar */}
      {showTabBar && (
        <div className="terminal-tab-bar flex items-center bg-gray-800 border-b border-gray-700">
          <div className="flex items-center overflow-x-auto">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="relative">
                <button
                  onClick={() => switchTab(tab.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowTabMenu(tab.id === showTabMenu ? null : tab.id);
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 border-t-2 border-transparent hover:bg-gray-700 transition-colors whitespace-nowrap min-w-0',
                    tab.active
                      ? 'bg-gray-900 border-t-blue-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  )}
                >
                  {tab.profile.icon}
                  <span className="text-sm truncate max-w-32">{tab.title}</span>

                  {/* Status indicator */}
                  <div className={clsx(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    tab.status === 'running' && 'bg-green-400',
                    tab.status === 'stopped' && 'bg-gray-400',
                    tab.status === 'error' && 'bg-red-400',
                    tab.status === 'pending' && 'bg-yellow-400'
                  )}></div>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-1 hover:bg-gray-600 rounded opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>

                {/* Context Menu */}
                {showTabMenu === tab.id && (
                  <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-48">
                    <button
                      onClick={() => duplicateTab(tab.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>

                    <button
                      onClick={() => splitTab(tab.id, 'horizontal')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                    >
                      <SplitSquareVertical className="w-4 h-4" />
                      Split Horizontally
                    </button>

                    <button
                      onClick={() => splitTab(tab.id, 'vertical')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                    >
                      <SplitSquareVertical className="w-4 h-4 rotate-90" />
                      Split Vertically
                    </button>

                    <button
                      onClick={() => restartTab(tab.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restart
                    </button>

                    <div className="border-t border-gray-700 my-1"></div>

                    <button
                      onClick={() => copyOutput(tab.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Output
                    </button>

                    <button
                      onClick={() => clearOutput(tab.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Output
                    </button>

                    <div className="border-t border-gray-700 my-1"></div>

                    <button
                      onClick={() => closeTab(tab.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm text-red-400"
                    >
                      <X className="w-4 h-4" />
                      Close Tab
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* New Tab Button */}
            <div className="relative">
              <button
                onClick={() => setShowProfileSelector(!showProfileSelector)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New Terminal</span>
              </button>

              {/* Profile Selector */}
              {showProfileSelector && (
                <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-64">
                  <div className="p-2">
                    <div className="text-xs text-gray-400 mb-2">Choose Terminal Profile:</div>

                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {/* Built-in profiles */}
                      {DEFAULT_PROFILES.map(profile => (
                        <button
                          key={profile.id}
                          onClick={() => createNewTab(profile.id)}
                          className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                        >
                          {profile.icon}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{profile.name}</div>
                            <div className="text-xs text-gray-400 truncate">{profile.description}</div>
                          </div>
                        </button>
                      ))}

                      {/* Custom profiles */}
                      {customProfiles.length > 0 && (
                        <>
                          <div className="border-t border-gray-700 my-2"></div>
                          {customProfiles.map(profile => (
                            <button
                              key={profile.id}
                              onClick={() => createNewTab(profile.id)}
                              className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                            >
                              {profile.icon}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium">{profile.name}</div>
                                <div className="text-xs text-gray-400 truncate">{profile.description}</div>
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-700 p-2">
                    <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm">
                      <Settings className="w-4 h-4" />
                      Configure Profiles...
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terminal Actions */}
          <div className="flex items-center gap-1 px-2 border-l border-gray-700">
            {activeTab && (
              <>
                <button
                  onClick={() => restartTab(activeTab.id)}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Restart Terminal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => copyOutput(activeTab.id)}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Copy Output"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => clearOutput(activeTab.id)}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Clear Output"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Terminal Content */}
      <div className="terminal-content flex-1 flex flex-col overflow-hidden">
        {activeTab ? (
          <div className="flex-1 flex flex-col">
            {/* Output Area */}
            <div
              ref={el => terminalRefs.current[activeTab.id] = el}
              className="terminal-output flex-1 overflow-y-auto p-4 font-mono text-sm bg-black"
              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
            >
              {terminalOutput[activeTab.id]?.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))}

              {/* Show status indicator for non-running terminals */}
              {activeTab.status !== 'running' && (
                <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    {activeTab.status === 'error' ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-medium">Terminal Error</span>
                      </>
                    ) : activeTab.status === 'stopped' ? (
                      <>
                        <Square className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 font-medium">Terminal Stopped</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent animate-spin"></div>
                        <span className="text-yellow-400 font-medium">Starting Terminal...</span>
                      </>
                    )}
                  </div>

                  {activeTab.status === 'error' && (
                    <div className="text-sm text-gray-300">
                      Exit code: {activeTab.exitCode}
                    </div>
                  )}

                  <button
                    onClick={() => restartTab(activeTab.id)}
                    className="mt-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                  >
                    Restart Terminal
                  </button>
                </div>
              )}
            </div>

            {/* Input Area */}
            {activeTab.status === 'running' && (
              <div className="terminal-input border-t border-gray-700">
                <div className="flex items-center bg-black">
                  <span className="px-3 py-2 text-green-400 font-mono text-sm">
                    $ {activeTab.profile.command}
                  </span>
                  <input
                    type="text"
                    value={terminalInput[activeTab.id] || ''}
                    onChange={(e) => setTerminalInput(prev => ({
                      ...prev,
                      [activeTab.id]: e.target.value
                    }))}
                    onKeyDown={(e) => handleInputKeyDown(e, activeTab.id)}
                    className="flex-1 px-3 py-2 bg-transparent font-mono text-sm text-green-400 outline-none"
                    placeholder="Type command..."
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Terminal className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <div className="text-lg mb-2">No Terminal Open</div>
              <div className="text-sm mb-4">Create a new terminal to get started</div>
              <button
                onClick={() => setShowProfileSelector(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
              >
                New Terminal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Close context menu when clicking outside */}
      {showTabMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowTabMenu(null)}
        />
      )}

      {showProfileSelector && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileSelector(false)}
        />
      )}
    </div>
  );
}

export default TerminalTabs;