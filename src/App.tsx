import { useState, useEffect, lazy, Suspense } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  FileExplorer,
  StatusBar,
  WorkspaceSwitcher,
  BottomTabBar,
} from '@/components/IDE';
import type { TabItem } from '@/components/IDE';

// Lazy-load heavy editor & terminal components (Monaco ~2.5MB, xterm ~300KB)
const Editor = lazy(() => import('@/components/IDE/Editor').then(m => ({ default: m.Editor })));
const Terminal = lazy(() => import('@/components/IDE/Terminal').then(m => ({ default: m.Terminal })));
const Preview = lazy(() => import('@/components/IDE/Preview').then(m => ({ default: m.Preview })));
import { MobileOptimizedLayout, MobileBottomPanel } from '@/components/MobileOptimizedLayout';
import { BootScreen } from '@/components/BootScreen';
import { ServiceBanner } from '@/components/ServiceBanner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useServiceReadiness } from '@/hooks/useServiceReadiness';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Lazy-loaded heavy panels & dialogs (only loaded when opened)
const CloneDialog = lazy(() => import('@/components/IDE/CloneDialog').then(m => ({ default: m.CloneDialog })));
const SettingsDialog = lazy(() => import('@/components/IDE/SettingsDialog').then(m => ({ default: m.SettingsDialog })));
const AIAssistant = lazy(() => import('@/components/IDE/AIAssistant').then(m => ({ default: m.AIAssistant })));
const ClaudeCodePanel = lazy(() => import('@/components/IDE/ClaudeCodePanel').then(m => ({ default: m.ClaudeCodePanel })));
const ExtensionsPanel = lazy(() => import('@/components/IDE/ExtensionsPanel').then(m => ({ default: m.ExtensionsPanel })));
const CommandPalette = lazy(() => import('@/components/IDE/CommandPalette').then(m => ({ default: m.CommandPalette })));
const HelpPanel = lazy(() => import('@/components/IDE/HelpPanel').then(m => ({ default: m.HelpPanel })));
const SourceControlPanel = lazy(() => import('@/components/Git/SourceControlPanel').then(m => ({ default: m.SourceControlPanel })));
const MobileKeyboardTest = lazy(() => import('@/components/IDE/MobileKeyboardTest').then(m => ({ default: m.MobileKeyboardTest })));
import { useIDEStore } from '@/store/useIDEStore';
import { useShallow } from 'zustand/react/shallow';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { useKeyboardDetection } from '@/hooks/useKeyboardDetection';
import { Toaster } from 'sonner';
import { initSentry } from '@/services/sentry';

function App() {
  useKeyboardDetection();
  const services = useServiceReadiness();
  const onlineStatus = useOnlineStatus();

  // UI state group
  const { sidebarOpen, terminalOpen, previewOpen, helpOpen, activeBottomPanel, terminalMaximized, bottomPanelSize } = useIDEStore(
    useShallow(state => ({
      sidebarOpen: state.sidebarOpen,
      terminalOpen: state.terminalOpen,
      previewOpen: state.previewOpen,
      helpOpen: state.helpOpen,
      activeBottomPanel: state.activeBottomPanel,
      terminalMaximized: state.terminalMaximized,
      bottomPanelSize: state.bottomPanelSize,
    }))
  );

  // PWA state group
  const { isInstalled, installPromptEvent } = useIDEStore(
    useShallow(state => ({
      isInstalled: state.isInstalled,
      installPromptEvent: state.installPromptEvent,
    }))
  );

  // Actions (stable references)
  const setInstallPrompt = useIDEStore(state => state.setInstallPrompt);
  const setInstalled = useIDEStore(state => state.setInstalled);
  const toggleSidebar = useIDEStore(state => state.toggleSidebar);
  const toggleTerminal = useIDEStore(state => state.toggleTerminal);
  const togglePreview = useIDEStore(state => state.togglePreview);
  const toggleHelp = useIDEStore(state => state.toggleHelp);
  const setActiveBottomPanel = useIDEStore(state => state.setActiveBottomPanel);
  const settings = useIDEStore(state => state.settings);

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
    logger.info(`Browser IDE v${config.APP_VERSION} - Starting...`);

    // Initialize Sentry if configured
    if (settings.monitoring?.sentryEnabled && settings.monitoring.sentryDsn) {
      initSentry({
        dsn: settings.monitoring.sentryDsn,
        environment: settings.monitoring.sentryEnvironment,
        tracesSampleRate: settings.monitoring.tracesSampleRate,
        enabled: settings.monitoring.sentryEnabled,
      });
    }

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    // Git initialization is handled by useServiceReadiness (lazy, on demand)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as Event & { prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> });
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

    const handleAppInstalled = () => {
      setInstalled(true);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('show-clone-dialog', handleOpenCloneDialog);
    window.addEventListener('open-settings-dialog', handleOpenSettingsDialog);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('show-clone-dialog', handleOpenCloneDialog);
      window.removeEventListener('open-settings-dialog', handleOpenSettingsDialog);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstallClick = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowInstallPrompt(false);
      }
      setInstallPrompt(null);
    }
  };

  const bottomPanelVisible = terminalOpen || previewOpen || showClaudeCode || showExtensions || showGit;

  // Block render until critical services (filesystem + DB) are ready
  if (!services.criticalReady) {
    return <BootScreen services={services} />;
  }

  return (
    <>
      <MobileOptimizedLayout className="app flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Offline + service degradation banners */}
      <OfflineIndicator status={onlineStatus} />
      <ServiceBanner services={services} />

      {/* Title Bar */}
      <div className="titlebar flex items-center justify-between px-2 sm:px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="titlebar-drag flex items-center gap-2 sm:gap-4 overflow-hidden flex-1 min-w-0">
          <span className="title font-semibold text-xs sm:text-sm truncate">🚀 Browser IDE v{config.APP_VERSION}</span>
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
                <Suspense fallback={<div className="flex items-center justify-center h-full bg-gray-900 text-gray-500 text-sm">Loading editor...</div>}>
                  <Editor />
                </Suspense>
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
                      <BottomTabBar
                        tabs={[
                          ...(terminalOpen ? [{ id: 'terminal-tabs', label: 'Terminal', shortLabel: 'Term', icon: '💻' } satisfies TabItem] : []),
                          ...(previewOpen ? [{ id: 'preview', label: 'Preview', shortLabel: 'View', icon: '👁️' } satisfies TabItem] : []),
                          ...(showClaudeCode ? [{ id: 'claude-code', label: 'Claude', shortLabel: 'AI', icon: '🧠' } satisfies TabItem] : []),
                          ...(showExtensions ? [{ id: 'extensions', label: 'Extensions', shortLabel: 'Ext', icon: '🧩' } satisfies TabItem] : []),
                          ...(showGit ? [{ id: 'git', label: 'Git', shortLabel: 'Git', icon: '🔀' } satisfies TabItem] : []),
                          { id: 'help', label: 'Help', shortLabel: 'Help', icon: '📚' },
                        ]}
                        activeTab={activeBottomPanel}
                        onTabChange={(id) => setActiveBottomPanel(id as typeof activeBottomPanel)}
                      />
                      <div className="bottom-panel-content flex-1 overflow-hidden">
                        <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>}>
                          {activeBottomPanel === 'terminal-tabs' && terminalOpen && <Terminal />}
                          {activeBottomPanel === 'terminal' && terminalOpen && <Terminal />}
                          {activeBottomPanel === 'preview' && previewOpen && <Preview />}
                          {activeBottomPanel === 'claude-code' && showClaudeCode && <ClaudeCodePanel />}
                          {activeBottomPanel === 'extensions' && showExtensions && <ExtensionsPanel />}
                          {activeBottomPanel === 'git' && showGit && <SourceControlPanel />}
                          {activeBottomPanel === 'help' && helpOpen && <HelpPanel />}
                        </Suspense>
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

      {/* Dialogs (lazy-loaded) */}
      <Suspense fallback={null}>
        {showCloneDialog && <CloneDialog onClose={() => setShowCloneDialog(false)} />}
        {showSettingsDialog && <SettingsDialog onClose={() => setShowSettingsDialog(false)} />}
        {showAIAssistant && <AIAssistant onClose={() => setShowAIAssistant(false)} />}
        {showCommandPalette && <CommandPalette />}
      </Suspense>

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
      <Suspense fallback={null}>
        <MobileKeyboardTest />
      </Suspense>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default App;
