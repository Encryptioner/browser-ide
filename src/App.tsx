import { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  FileExplorer,
  Editor,
  Terminal,
  Preview,
  StatusBar,
  CloneDialog,
  SettingsDialog,
  AIAssistant,
  ClaudeCodePanel,
  ExtensionsPanel,
  WorkspaceSwitcher,
  CommandPalette,
  HelpPanel,
} from '@/components/IDE';
import { SourceControlPanel } from '@/components/Git';
import { MobileOptimizedLayout, MobileBottomPanel } from '@/components/MobileOptimizedLayout';
import { MobileKeyboardTest } from '@/components/IDE/MobileKeyboardTest';
import { useIDEStore } from '@/store/useIDEStore';
import { gitService } from '@/services/git';
import { fileSystem } from '@/services/filesystem';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { Toaster } from 'sonner';

function App() {
  useKeyboardDetection();
  const {
    sidebarOpen,
    terminalOpen,
    previewOpen,
    isInstalled,
    installPromptEvent,
    setInstallPrompt,
    setInstalled,
    toggleSidebar,
    toggleTerminal,
    togglePreview,
    toggleHelp,
    helpOpen,
    activeBottomPanel,
    setActiveBottomPanel,
    terminalMaximized,
    bottomPanelSize,
  } = useIDEStore();

  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showClaudeCode, setShowClaudeCode] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [showGit, setShowGit] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [showSplitEditor, setShowSplitEditor] = useState(false);
  const [showTerminalTabs, setShowTerminalTabs] = useState(false);
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);

  useEffect(() => {
    logger.info(`Browser IDE Pro v${config.APP_VERSION} - Starting...`);

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    // Initialize git repository if it exists
    async function initGitIfExists() {
      try {
        // Check if current directory has a git repository
        const currentDir = fileSystem.getCurrentWorkingDirectory();
        const fs = fileSystem.getFS();
        const stats = await fs.promises.stat(currentDir).catch(() => null);

        if (stats && stats.isDirectory()) {
          console.log('📂 Found existing repository, initializing git state...');
          const result = await gitService.initializeRepository(currentDir);

          if (result.success && result.data) {
            console.log(`✅ Git initialized: branch=${result.data.currentBranch}, files=${result.data.gitStatus.length}, commits=${result.data.commits.length}`);
          } else {
            console.warn('⚠️ Git initialization failed:', result.error);
          }
        } else {
          console.log('ℹ️ No repository found at /repo');
        }
      } catch (error) {
        console.error('❌ Error checking for repository:', error);
      }
    }

    initGitIfExists();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      if (!isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for custom events from welcome screen
    const handleOpenCloneDialog = () => {
      setShowCloneDialog(true);
    };

    const handleOpenSettingsDialog = () => {
      setShowSettingsDialog(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowInstallPrompt(false);
    });
    window.addEventListener('show-clone-dialog', handleOpenCloneDialog);
    window.addEventListener('open-settings-dialog', handleOpenSettingsDialog);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-clone-dialog', handleOpenCloneDialog);
      window.removeEventListener('open-settings-dialog', handleOpenSettingsDialog);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      const promptEvent = installPromptEvent as any;
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowInstallPrompt(false);
      }
      setInstallPrompt(null);
    }
  };

  const bottomPanelVisible = terminalOpen || previewOpen || showClaudeCode || showExtensions || showGit;

  return (
    <>
      <MobileOptimizedLayout className="app flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Title Bar */}
      <div className="titlebar flex items-center justify-between px-2 sm:px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="titlebar-drag flex items-center gap-2 sm:gap-4 overflow-hidden flex-1 min-w-0">
          <span className="title font-semibold text-xs sm:text-sm truncate">🚀 IDE v{config.APP_VERSION}</span>
          <WorkspaceSwitcher />
        </div>

        {/* Mobile-optimized action buttons */}
        <div className="titlebar-actions flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Mobile: Essential actions first */}
          <button
            onClick={toggleSidebar}
            className="p-2 sm:px-2 sm:py-1 hover:bg-gray-700 rounded text-xs sm:text-sm touch-manipulation"
            title="Toggle Files"
            aria-label="Toggle Files"
          >
            <span className="text-lg sm:text-sm">📁</span>
          </button>

          {/* Mobile: Terminal button */}
          <button
            onClick={toggleTerminal}
            className="md:hidden p-2 hover:bg-gray-700 rounded text-xs touch-manipulation"
            title="Toggle Terminal"
            aria-label="Toggle Terminal"
          >
            <span className="text-base">💻</span>
          </button>

          {/* Mobile: Compact menu for more actions */}
          <div className="hidden sm:flex gap-1 sm:gap-2">
            <button
              onClick={toggleTerminal}
              className="text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Toggle Terminal"
            >
              💻
            </button>
            <button
              onClick={togglePreview}
              className="text-xs px-2 py-1 hover:bg-gray-700 rounded"
              title="Toggle Preview"
            >
              👁️
            </button>
            <button
              onClick={() => {
                setShowClaudeCode(!showClaudeCode);
                if (!showClaudeCode) setActiveBottomPanel('claude-code');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showClaudeCode ? 'bg-gray-700' : ''}`}
              title="Toggle Claude Code Agent"
            >
              🧠
            </button>

            <button
              onClick={() => {
                setShowDebugger(!showDebugger);
                if (!showDebugger) setActiveBottomPanel('debugger');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showDebugger ? 'bg-gray-700' : ''}`}
              title="Toggle Debugger"
            >
              🐛
            </button>

            <button
              onClick={() => {
                setShowSplitEditor(!showSplitEditor);
                if (!showSplitEditor) setActiveBottomPanel('split-editor');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showSplitEditor ? 'bg-gray-700' : ''}`}
              title="Toggle Split Editor"
            >
              📄
            </button>

            <button
              onClick={() => {
                setShowTerminalTabs(!showTerminalTabs);
                if (!showTerminalTabs) setActiveBottomPanel('terminal-tabs');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showTerminalTabs ? 'bg-gray-700' : ''}`}
              title="Toggle Terminal Tabs"
            >
              💻
            </button>

            <button
              onClick={() => {
                setShowProblemsPanel(!showProblemsPanel);
                if (!showProblemsPanel) setActiveBottomPanel('problems');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showProblemsPanel ? 'bg-gray-700' : ''}`}
              title="Toggle Problems Panel"
            >
              ⚠️
            </button>
            <button
              onClick={() => {
                setShowExtensions(!showExtensions);
                if (!showExtensions) setActiveBottomPanel('extensions');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showExtensions ? 'bg-gray-700' : ''}`}
              title="Toggle Extensions"
            >
              🧩
            </button>
            <button
              onClick={() => {
                setShowGit(!showGit);
                if (!showGit) setActiveBottomPanel('git');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${showGit ? 'bg-gray-700' : ''}`}
              title="Toggle Source Control"
            >
              🔀
            </button>
            <button
              onClick={() => {
                toggleHelp();
                if (!helpOpen) setActiveBottomPanel('help');
              }}
              className={`text-xs px-2 py-1 hover:bg-gray-700 rounded ${helpOpen ? 'bg-gray-700' : ''}`}
              title="Toggle Help"
            >
              📚
            </button>
          </div>

          {/* Mobile: Primary action buttons */}
          <button
            onClick={() => setShowCloneDialog(true)}
            title="Clone Repository"
            className="px-2 sm:px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          >
            <span className="hidden sm:inline">📥 Clone</span>
            <span className="sm:hidden text-base">📥</span>
          </button>

          {/* Mobile: More menu button */}
          <button
            onClick={() => setShowAIAssistant(true)}
            title="AI Assistant"
            className="p-2 sm:px-3 sm:py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs sm:text-sm font-medium whitespace-nowrap touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          >
            <span className="text-base sm:text-sm">🤖</span>
          </button>

          <button
            onClick={() => setShowCommandPalette(true)}
            title="Commands"
            className="p-2 sm:px-3 sm:py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs sm:text-sm touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          >
            <span className="text-base sm:text-sm">⚡</span>
          </button>

          <button
            onClick={() => setShowSettingsDialog(true)}
            title="Settings"
            className="p-2 sm:px-3 sm:py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs sm:text-sm touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          >
            <span className="text-base sm:text-sm">⚙️</span>
          </button>
        </div>
      </div>

      {/* PWA Install Prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="install-prompt flex items-center justify-between px-4 py-2 bg-blue-600 text-white">
          <span className="text-sm">📱 Install Browser IDE for offline access</span>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="px-2 py-1 hover:bg-blue-700 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="main-content flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" id="main-horizontal">
          {/* Sidebar - auto-hide on mobile */}
          {sidebarOpen && (
            <>
              <Panel
                id="sidebar"
                order={1}
                defaultSize={20}
                minSize={10}
                maxSize={40}
                className="hidden md:block"
              >
                <FileExplorer />
              </Panel>
              <PanelResizeHandle className="hidden md:block w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
            </>
          )}

          {/* Editor + Bottom Panel */}
          <Panel id="main-editor" order={2}>
            <PanelGroup direction="vertical" id="main-vertical">
              {/* Editor */}
              <Panel
                id="editor"
                order={1}
                defaultSize={bottomPanelVisible ? (100 - bottomPanelSize) : 100}
                minSize={terminalMaximized ? 0 : 30}
                maxSize={terminalMaximized ? (100 - bottomPanelSize) : 100}
              >
                <Editor />
              </Panel>

              {/* Bottom Panel */}
              {bottomPanelVisible && (
                <>
                  <PanelResizeHandle
                    className={`h-1 bg-gray-700 hover:bg-blue-500 transition-colors ${terminalMaximized ? 'hidden' : ''}`}
                  />
                  <Panel
                    id="bottom-panel"
                    order={2}
                    defaultSize={bottomPanelSize}
                    minSize={terminalMaximized ? 100 : 15}
                    maxSize={terminalMaximized ? 100 : 100}
                  >
                    <MobileBottomPanel isOpen={bottomPanelVisible} className="bottom-panel flex flex-col h-full bg-gray-900">
                      <div className="bottom-panel-tabs flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
                        {terminalOpen && (
                          <div
                            className={`tab px-2 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm touch-manipulation min-w-[60px] sm:min-w-0 flex flex-col items-center justify-center whitespace-nowrap ${
                              activeBottomPanel === 'terminal-tabs'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('terminal-tabs')}
                          >
                            <span className="text-lg sm:text-base mb-1">💻</span>
                            <span className="hidden sm:inline">Terminal</span>
                            <span className="sm:hidden text-xs">Term</span>
                          </div>
                        )}
                        {previewOpen && (
                          <div
                            className={`tab px-2 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm touch-manipulation min-w-[60px] sm:min-w-0 flex flex-col items-center justify-center whitespace-nowrap ${
                              activeBottomPanel === 'preview'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('preview')}
                          >
                            <span className="text-lg sm:text-base mb-1">👁️</span>
                            <span className="hidden sm:inline">Preview</span>
                            <span className="sm:hidden text-xs">View</span>
                          </div>
                        )}
                        {showClaudeCode && (
                          <div
                            className={`tab px-2 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm touch-manipulation min-w-[60px] sm:min-w-0 flex flex-col items-center justify-center whitespace-nowrap ${
                              activeBottomPanel === 'claude-code'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('claude-code')}
                          >
                            <span className="text-lg sm:text-base mb-1">🧠</span>
                            <span className="hidden sm:inline">Claude</span>
                            <span className="sm:hidden text-xs">AI</span>
                          </div>
                        )}
                        {showExtensions && (
                          <div
                            className={`tab px-2 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm touch-manipulation min-w-[60px] sm:min-w-0 flex flex-col items-center justify-center whitespace-nowrap ${
                              activeBottomPanel === 'extensions'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('extensions')}
                          >
                            <span className="text-lg sm:text-base mb-1">🧩</span>
                            <span className="hidden sm:inline">Extensions</span>
                            <span className="sm:hidden text-xs">Ext</span>
                          </div>
                        )}
                        {showGit && (
                          <div
                            className={`tab px-2 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm touch-manipulation min-w-[60px] sm:min-w-0 flex flex-col items-center justify-center whitespace-nowrap ${
                              activeBottomPanel === 'git'
                                ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                                : 'hover:bg-gray-700 text-gray-300'
                            }`}
                            onClick={() => setActiveBottomPanel('git')}
                          >
                            <span className="text-lg sm:text-base mb-1">🔀</span>
                            <span className="hidden sm:inline">Git</span>
                            <span className="sm:hidden text-xs">Git</span>
                          </div>
                        )}
                        <div
                          className={`tab px-2 sm:px-4 py-2 cursor-pointer text-xs sm:text-sm touch-manipulation min-w-[60px] sm:min-w-0 flex flex-col items-center justify-center whitespace-nowrap ${
                            activeBottomPanel === 'help'
                              ? 'active bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                          onClick={() => setActiveBottomPanel('help')}
                        >
                          <span className="text-lg sm:text-base mb-1">📚</span>
                          <span className="hidden sm:inline">Help</span>
                          <span className="sm:hidden text-xs">Help</span>
                        </div>
                      </div>
                      <div className="bottom-panel-content flex-1 overflow-hidden">
                        {activeBottomPanel === 'terminal-tabs' && terminalOpen && <Terminal />}
                        {activeBottomPanel === 'terminal' && terminalOpen && <Terminal />}
                        {activeBottomPanel === 'preview' && previewOpen && <Preview />}
                        {activeBottomPanel === 'claude-code' && showClaudeCode && <ClaudeCodePanel />}
                        {activeBottomPanel === 'extensions' && showExtensions && <ExtensionsPanel />}
                        {activeBottomPanel === 'git' && showGit && <SourceControlPanel />}
                        {activeBottomPanel === 'help' && helpOpen && <HelpPanel />}
                      </div>
                    </MobileBottomPanel>
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Dialogs */}
      {showCloneDialog && <CloneDialog onClose={() => setShowCloneDialog(false)} />}

      {showSettingsDialog && <SettingsDialog onClose={() => setShowSettingsDialog(false)} />}

      {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}

      {/* Overlays */}
      {showCommandPalette && <CommandPalette />}

      {/* Mobile File Explorer Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <h2 className="text-sm font-semibold">Files</h2>
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-700 rounded touch-manipulation min-w-[44px] min-h-[44px]"
                aria-label="Close file explorer"
              >
                ✕
              </button>
            </div>
            <div className="h-full overflow-y-auto pb-20"> {/* Add padding for mobile navigation */}
              <FileExplorer />
            </div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 left-4/5 touch-manipulation" onClick={toggleSidebar} />
        </div>
      )}
    </MobileOptimizedLayout>

    {/* Mobile Keyboard Test - only visible in development */}
      <MobileKeyboardTest />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default App;
