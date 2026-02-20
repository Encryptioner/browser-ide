import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EditorSettings,
  GitSettings,
  FileNode,
  Project,
  CodeSnippet,
  Problem,
  WebContainerServer,
  DebugSession,
  DebugBreakpoint,
  DebugConfiguration,
  SplitEditorState,
  SnippetSession,
  ProblemsFilter,
  WebContainerProcess,
  GitStatus,
  GitCommit,
  AIMessage,
} from '@/types';
import { TerminalTab } from '@/components/IDE/TerminalTabs';
import { encryptSecrets, decryptSecrets } from '@/services/crypto';
import { logger } from '@/utils/logger';

// RecentProject is defined here since it doesn't exist in types
export interface RecentProject {
  name: string;
  url: string;
  path: string;
  lastOpened: number;
}

/** Browser BeforeInstallPrompt event for PWA install */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Diagnostic entry from various sources (matches Monaco/LSP shape) */
interface Diagnostic {
  severity: 'error' | 'warning' | 'info' | number;
  message: string;
  source?: string;
  code?: string | { value: string; target: string };
  tags?: number[];
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  resource?: string;
}

// Settings interface combines editor, git, and AI settings
export interface Settings extends EditorSettings, GitSettings {
  ai: {
    anthropicKey: string;
    glmKey: string;
    openaiKey: string;
    defaultProvider: 'anthropic' | 'glm' | 'openai';
  };
  monitoring?: {
    sentryDsn: string;
    sentryEnvironment: 'production' | 'development' | 'test';
    sentryEnabled: boolean;
    tracesSampleRate: number;
  };
}

// RecentProject and FileNode are imported from types

interface IDEState {
  // Project Management
  projects: Project[];
  activeProjectId: string | null;
  recentProjects: RecentProject[];

  // File System
  files: Record<string, string>;
  currentFile: string | null;
  openFiles: string[];
  fileTree: FileNode[];
  currentDirectory: string;
  fileLastSavedTime: Record<string, number>;

  // Git
  currentRepo: string | null;
  currentBranch: string;
  gitStatus: GitStatus[];
  commits: GitCommit[];

  // Editor
  editorContent: Record<string, string>;
  unsavedChanges: Set<string>;
  activeTabId: string | null;
  splitEditorState: SplitEditorState | null;
  searchHighlight: { file: string; line: number; column: number; text: string } | null;

  // Debugging
  debugSessions: Record<string, DebugSession[]>;
  activeDebugSessionId: string | null;
  breakpoints: Record<string, DebugBreakpoint[]>;
  debugConfigurations: DebugConfiguration[];

  // Code Snippets
  snippets: CodeSnippet[];
  snippetSessions: Record<string, SnippetSession>;
  activeSnippetSessionId: string | null;

  // Terminal
  terminalTabs: TerminalTab[];
  activeTerminalTabId: string | null;
  terminalProcesses: Record<string, WebContainerProcess>;
  terminalProfiles: TerminalTab['profile'][];

  // Problems/Diagnostics
  problems: Problem[];
  diagnostics: Record<string, Diagnostic[]>;
  problemFilters: ProblemsFilter;

  // AI/Chat
  aiOpen: boolean;
  aiSessions: Record<string, AIMessage[]>;

  // UI State
  sidebarOpen: boolean;
  terminalOpen: boolean;
  previewOpen: boolean;
  commandPaletteOpen: boolean;
  helpOpen: boolean;
  activeBottomPanel: 'terminal' | 'preview' | 'claude-code' | 'extensions' | 'git' | 'debugger' | 'split-editor' | 'terminal-tabs' | 'problems' | 'help';

  // Panel Sizing
  terminalMaximized: boolean;
  bottomPanelSize: number; // Percentage (0-100)

  // Settings
  settings: Settings;

  // PWA
  isInstalled: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;

  // Services
  webContainerService: typeof import('@/services/webcontainer').webContainer | null;
  webContainerServer: WebContainerServer | null;
}

interface IDEActions {
  // Project Management
  setActiveProject: (_id: string | null) => void;
  addRecentProject: (_project: Omit<RecentProject, 'lastOpened'>) => void;
  removeRecentProject: (_url: string) => void;

  // File System
  setCurrentFile: (_file: string | null) => void;
  addOpenFile: (_file: string) => void;
  closeFile: (_file: string) => void;
  closeAllFiles: () => void;
  updateEditorContent: (_file: string, _content: string) => void;
  markFileUnsaved: (_file: string) => void;
  markFileSaved: (_file: string) => void;
  setFileTree: (_tree: FileNode[]) => void;
  setSearchHighlight: (_highlight: { file: string; line: number; column: number; text: string } | null) => void;
  clearSearchHighlight: () => void;

  // Directory Navigation
  changeDirectory: (_path: string) => void;
  getCurrentDirectory: () => string;

  // Git
  setCurrentRepo: (_repo: string | null) => void;
  setCurrentBranch: (_branch: string) => void;
  setGitStatus: (_status: GitStatus[]) => void;
  setCommits: (_commits: GitCommit[]) => void;

  // Debugging
  setActiveDebugSession: (_projectId: string, _sessionId: string) => void;
  stopDebugSession: (_sessionId: string) => void;
  addBreakpoint: (_breakpoint: DebugBreakpoint) => void;
  removeBreakpoint: (_breakpointId: string) => void;
  updateBreakpoint: (_breakpoint: DebugBreakpoint) => void;
  setDebugConfigurations: (_configs: DebugConfiguration[]) => void;

  // Split Editor
  setSplitEditorState: (_state: SplitEditorState) => void;

  // Code Snippets
  addSnippet: (_snippet: CodeSnippet) => void;
  removeSnippet: (_snippetId: string) => void;
  updateSnippet: (_snippetId: string, _updates: Partial<CodeSnippet>) => void;
  createSnippetSession: (_editorId: string, _snippet: CodeSnippet) => void;
  finishSnippetSession: (_sessionId: string) => void;

  // Terminal
  createTerminalTab: (_profileId: string, _name?: string) => void;
  closeTerminalTab: (_tabId: string) => void;
  setActiveTerminalTab: (_tabId: string) => void;
  updateTerminalTab: (_tabId: string, _updates: Partial<TerminalTab>) => void;

  // Problems
  setProblems: (_problems: Problem[]) => void;
  addProblem: (_problem: Problem) => void;
  removeProblem: (_problemId: string) => void;
  clearProblems: () => void;
  setProblemFilters: (_filters: ProblemsFilter) => void;

  // UI Actions
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  togglePreview: () => void;
  toggleAI: () => void;
  toggleCommandPalette: () => void;
  toggleHelp: () => void;
  setSidebarOpen: (_open: boolean) => void;
  setTerminalOpen: (_open: boolean) => void;
  setPreviewOpen: (_open: boolean) => void;
  setAIOpen: (_open: boolean) => void;
  setCommandPaletteOpen: (_open: boolean) => void;
  setHelpOpen: (_open: boolean) => void;
  setActiveBottomPanel: (_panel: 'terminal' | 'preview' | 'claude-code' | 'extensions' | 'git' | 'debugger' | 'split-editor' | 'terminal-tabs' | 'problems' | 'help') => void;

  // Panel Sizing
  toggleTerminalMaximized: () => void;
  setTerminalMaximized: (_maximized: boolean) => void;
  setBottomPanelSize: (_size: number) => void;

  // Settings
  updateSettings: (_newSettings: Partial<Settings>) => void;

  // PWA
  setInstalled: (_installed: boolean) => void;
  setInstallPrompt: (_event: BeforeInstallPromptEvent | null) => void;

  // Tab Management
  setActiveTab: (_tabId: string) => void;
  duplicateTab: (_tabId: string) => void;
  closeTab: (_tabId: string) => void;

  // Actions from various components
  getDiagnostics: () => Diagnostic[];
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
  tabSize: 2,
  wordWrap: 'on',
  autoSave: true,
  autoSaveDelay: 1000,
  lineNumbers: 'on',
  minimap: true,
  formatOnSave: true,
  bracketPairColorization: true,
  username: '',
  email: '',
  githubUsername: '',
  githubEmail: '',
  githubToken: '',
  defaultBranch: 'main',
  autoFetch: true,
  autoFetchInterval: 60000,
  ai: {
    anthropicKey: '',
    glmKey: '',
    openaiKey: '',
    defaultProvider: 'glm',
  },
  monitoring: {
    sentryDsn: '',
    sentryEnvironment: 'development',
    sentryEnabled: false,
    tracesSampleRate: 0.1,
  },
};

export const useIDEStore = create<IDEState & IDEActions>()(
  persist(
    (set, get) => ({
      // Initial state
      projects: [],
      activeProjectId: null,
      recentProjects: [],

      files: {},
      currentFile: null,
      openFiles: [],
      fileTree: [],
      currentDirectory: '/repo',
      fileLastSavedTime: {},

      currentRepo: null,
      currentBranch: 'main',
      gitStatus: [],
      commits: [],

      editorContent: {},
      unsavedChanges: new Set(),
      activeTabId: null,
      splitEditorState: null,
      searchHighlight: null,

      debugSessions: {},
      activeDebugSessionId: null,
      breakpoints: {},
      debugConfigurations: [],

      snippets: [],
      snippetSessions: {},
      activeSnippetSessionId: null,

      terminalTabs: [],
      activeTerminalTabId: null,
      terminalProcesses: {},
      terminalProfiles: [],

      problems: [],
      diagnostics: {},
      problemFilters: { type: 'all' },

      aiOpen: false,
      aiSessions: {},

      sidebarOpen: true,
      terminalOpen: true,
      previewOpen: false,
      commandPaletteOpen: false,
      helpOpen: false,
      activeBottomPanel: 'terminal' as const,

      // Panel Sizing
      terminalMaximized: false,
      bottomPanelSize: 30, // 30% default height

      settings: DEFAULT_SETTINGS,

      isInstalled: false,
      installPromptEvent: null,

      webContainerService: null,
      webContainerServer: null,

      // Project Management Actions
      setActiveProject: (id) => set({ activeProjectId: id }),
      addRecentProject: (project) => set((state) => ({
        recentProjects: [
          { ...project, lastOpened: Date.now() },
          ...state.recentProjects.filter(p => p.url !== project.url),
        ].slice(0, 10), // Keep only 10 recent
      })),
      removeRecentProject: (url) => set((state) => ({
        recentProjects: state.recentProjects.filter(p => p.url !== url),
      })),

      // File System Actions
      setCurrentFile: (file) => set({ currentFile: file }),
      addOpenFile: (file) => set((state) => {
        if (state.openFiles.includes(file)) return state;
        return { openFiles: [...state.openFiles, file] };
      }),
      closeFile: (fileId) => set((state) => {
        const newOpenFiles = state.openFiles.filter(f => f !== fileId);
        const newCurrentFile = state.currentFile === fileId
          ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null)
          : state.currentFile;

        return {
          openFiles: newOpenFiles,
          currentFile: newCurrentFile,
        };
      }),
      closeAllFiles: () => set({ openFiles: [], currentFile: null }),
      updateEditorContent: (file, content) => set((state) => ({
        editorContent: { ...state.editorContent, [file]: content },
        unsavedChanges: new Set([...state.unsavedChanges, file]),
      })),
      markFileUnsaved: (file) => set((state) => ({
        unsavedChanges: new Set([...state.unsavedChanges, file]),
      })),
      markFileSaved: (file) => set((state) => {
        const newUnsavedChanges = new Set(state.unsavedChanges);
        newUnsavedChanges.delete(file);
        return { unsavedChanges: newUnsavedChanges };
      }),
      setFileTree: (tree) => set({ fileTree: tree }),
      setSearchHighlight: (highlight) => set({ searchHighlight: highlight }),
      clearSearchHighlight: () => set({ searchHighlight: null }),

      // Directory Navigation
      changeDirectory: (path) => set({ currentDirectory: path }),
      getCurrentDirectory: () => get().currentDirectory,

      // Git Actions
      setCurrentRepo: (repo) => set({ currentRepo: repo }),
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      setGitStatus: (status) => set({ gitStatus: status }),
      setCommits: (commits) => set({ commits }),

      // Debugging Actions
      setActiveDebugSession: (projectId, sessionId) => set((state) => ({
        activeProjectId: projectId,
        activeDebugSessionId: sessionId,
        debugSessions: {
          ...state.debugSessions,
          [projectId]: [
            ...(state.debugSessions[projectId] || []),
            {
              id: sessionId,
              name: 'Debug Session',
              type: 'node',
              request: 'launch',
              configuration: {},
              workspaceFolder: state.currentDirectory,
              running: true,
              threads: [],
              breakpoints: [],
              watchExpressions: [],
            }
          ],
        },
      })),
      stopDebugSession: (sessionId) => set((state) => {
        const newSessions = { ...state.debugSessions };
        Object.keys(newSessions).forEach(projectId => {
          newSessions[projectId] = newSessions[projectId].filter(s => s.id !== sessionId);
        });

        return {
          debugSessions: newSessions,
          activeDebugSessionId: state.activeDebugSessionId === sessionId ? null : state.activeDebugSessionId,
        };
      }),
      addBreakpoint: (breakpoint) => set((state) => ({
        breakpoints: {
          ...state.breakpoints,
          [breakpoint.path]: [...(state.breakpoints[breakpoint.path] || []), breakpoint],
        },
      })),
      removeBreakpoint: (breakpointId) => set((state) => {
        const newBreakpoints = { ...state.breakpoints };
        Object.keys(newBreakpoints).forEach(path => {
          newBreakpoints[path] = newBreakpoints[path].filter(bp => bp.id !== breakpointId);
        });
        return { breakpoints: newBreakpoints };
      }),
      updateBreakpoint: (breakpoint) => set((state) => ({
        breakpoints: {
          ...state.breakpoints,
          [breakpoint.path]: (state.breakpoints[breakpoint.path] || []).map(bp =>
            bp.id === breakpoint.id ? breakpoint : bp
          ),
        },
      })),
      setDebugConfigurations: (configs) => set({ debugConfigurations: configs }),

      // Split Editor Actions
      setSplitEditorState: (state) => set({ splitEditorState: state }),

      // Code Snippets Actions
      addSnippet: (snippet) => set((state) => ({
        snippets: [...state.snippets, snippet],
      })),
      removeSnippet: (snippetId) => set((state) => ({
        snippets: state.snippets.filter(s => s.id !== snippetId),
      })),
      updateSnippet: (snippetId, updates) => set((state) => ({
        snippets: state.snippets.map(s =>
          s.id === snippetId ? { ...s, ...updates } : s
        ),
      })),
      createSnippetSession: (editorId, snippet) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
          snippetSessions: {
            ...state.snippetSessions,
            [editorId]: {
              id: sessionId,
              snippet,
              placeholders: [],
              activePlaceholder: 0,
              isActive: true,
              editorId,
            },
          },
          activeSnippetSessionId: sessionId,
        }));
      },
      finishSnippetSession: (sessionId) => set((state) => {
        const newSessions = { ...state.snippetSessions };
        Object.keys(newSessions).forEach(editorId => {
          if (newSessions[editorId]?.id === sessionId) {
            delete newSessions[editorId];
          }
        });

        return {
          snippetSessions: newSessions,
          activeSnippetSessionId: state.activeSnippetSessionId === sessionId ? null : state.activeSnippetSessionId,
        };
      }),

      // Terminal Actions
      createTerminalTab: (profileId, name) => set((state) => {
        const newTab: TerminalTab = {
          id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: name || `Terminal ${state.terminalTabs.length + 1}`,
          profile: {
            id: profileId,
            name: 'Bash',
            command: '/bin/bash',
            icon: null,
            description: 'Bash shell'
          },
          history: [''],
          historyIndex: 0,
          active: true,
          createdAt: Date.now(),
          lastUsed: Date.now(),
          status: 'pending',
        };

        return {
          terminalTabs: [
            ...state.terminalTabs.map(tab => ({ ...tab, active: false })),
            newTab,
          ],
          activeTerminalTabId: newTab.id,
        };
      }),
      closeTerminalTab: (tabId) => set((state) => {
        const newTabs = state.terminalTabs.filter(tab => tab.id !== tabId);
        const newActiveTab = state.activeTerminalTabId === tabId
          ? (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null)
          : state.activeTerminalTabId;

        return {
          terminalTabs: newTabs,
          activeTerminalTabId: newActiveTab,
        };
      }),
      setActiveTerminalTab: (tabId) => set((state) => ({
        terminalTabs: state.terminalTabs.map(tab => ({
          ...tab,
          active: tab.id === tabId,
          lastUsed: tab.id === tabId ? Date.now() : tab.lastUsed,
        })),
        activeTerminalTabId: tabId,
      })),
      updateTerminalTab: (tabId, updates) => set((state) => ({
        terminalTabs: state.terminalTabs.map(tab =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        ),
      })),

      // Problems Actions
      setProblems: (problems) => set({ problems }),
      addProblem: (problem) => set((state) => ({
        problems: [...state.problems, problem],
      })),
      removeProblem: (problemId) => set((state) => ({
        problems: state.problems.filter(p => p.id !== problemId),
      })),
      clearProblems: () => set({ problems: [] }),
      setProblemFilters: (filters) => set({ problemFilters: filters }),

      // UI Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
      togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
      toggleAI: () => set((state) => ({ aiOpen: !state.aiOpen })),
      toggleCommandPalette: () => set((state) => ({
        commandPaletteOpen: !state.commandPaletteOpen
      })),
      toggleHelp: () => set((state) => ({ helpOpen: !state.helpOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTerminalOpen: (open) => set({ terminalOpen: open }),
      setPreviewOpen: (open) => set({ previewOpen: open }),
      setAIOpen: (open) => set({ aiOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setHelpOpen: (open) => set({ helpOpen: open }),
      setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel }),

      // Panel Sizing Actions
      toggleTerminalMaximized: () => set((state) => {
        const newMaximized = !state.terminalMaximized;
        return {
          terminalMaximized: newMaximized,
          bottomPanelSize: newMaximized ? 100 : Math.max(15, Math.min(70, state.bottomPanelSize)),
        };
      }),
      setTerminalMaximized: (maximized) => set((state) => ({
        terminalMaximized: maximized,
        bottomPanelSize: maximized ? 100 : Math.max(15, Math.min(70, state.bottomPanelSize)),
      })),
      setBottomPanelSize: (size) => set({ bottomPanelSize: Math.max(15, Math.min(100, size)) }),

      // Settings Actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
        // Sync sensitive keys to sessionStorage (survives refresh, not browser close)
        // Keys are encrypted with an ephemeral AES-GCM key held in memory
        const merged = { ...get().settings, ...newSettings };
        try {
          const secrets: Record<string, string> = {
            anthropicKey: merged.ai?.anthropicKey || '',
            glmKey: merged.ai?.glmKey || '',
            openaiKey: merged.ai?.openaiKey || '',
            githubToken: merged.githubToken || '',
          };
          encryptSecrets(secrets).then((encrypted) => {
            sessionStorage.setItem('ide-secrets', encrypted);
          }).catch((err) => {
            logger.error('Failed to encrypt and store secrets', err, 'IDEStore');
          });
        } catch { /* sessionStorage may be unavailable */ }
      },

      // Tab Management
      setActiveTab: (tabId) => set({ activeTabId: tabId }),
      duplicateTab: (tabId) => {
        const sourceFile = get().files[tabId];
        if (sourceFile) {
          const newTabId = `tab-${Date.now()}`;
          set((state) => ({
            files: { ...state.files, [newTabId]: sourceFile },
            openFiles: [...state.openFiles, newTabId],
            activeTabId: newTabId,
          }));
        }
      },
      closeTab: (tabId) => set((state) => {
        const newOpenFiles = state.openFiles.filter(f => f !== tabId);
        const newFiles = { ...state.files };
        delete newFiles[tabId];

        return {
          openFiles: newOpenFiles,
          files: newFiles,
          activeTabId: state.activeTabId === tabId
            ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null)
            : state.activeTabId,
        };
      }),

      // Service Actions
      getDiagnostics: () => {
        // Return current diagnostics from various sources
        const allDiagnostics: Diagnostic[] = [];

        // Add file-specific diagnostics
        Object.values(get().diagnostics).forEach(fileDiagnostics => {
          allDiagnostics.push(...fileDiagnostics);
        });

        return allDiagnostics;
      },

      // PWA Actions
      setInstalled: (installed) => set({ isInstalled: installed }),
      setInstallPrompt: (event) => set({ installPromptEvent: event }),
    }),
    {
      name: 'ide-storage',
      version: 1,
      partialize: (state) => ({
        // Only persist these essential fields (excluding runtime state)
        // SECURITY: Strip API keys and tokens before persisting to localStorage
        settings: {
          ...state.settings,
          ai: {
            ...state.settings.ai,
            anthropicKey: '',
            glmKey: '',
            openaiKey: '',
          },
          githubToken: '',
        },
        recentProjects: state.recentProjects,
        sidebarOpen: state.sidebarOpen,
        terminalOpen: state.terminalOpen,
        previewOpen: state.previewOpen,
        activeBottomPanel: state.activeBottomPanel,
        bottomPanelSize: state.bottomPanelSize,
        terminalMaximized: state.terminalMaximized,
      }) as IDEState & IDEActions,
      // Restore sensitive keys from sessionStorage after rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try {
          const raw = sessionStorage.getItem('ide-secrets');
          if (raw) {
            decryptSecrets(raw).then((secrets) => {
              state.settings = {
                ...state.settings,
                ai: {
                  ...state.settings.ai,
                  anthropicKey: secrets.anthropicKey || '',
                  glmKey: secrets.glmKey || '',
                  openaiKey: secrets.openaiKey || '',
                },
                githubToken: secrets.githubToken || '',
              };
            }).catch((err) => {
              logger.error('Failed to decrypt secrets on rehydration', err, 'IDEStore');
            });
          }
        } catch { /* sessionStorage may be unavailable */ }
      },
    }
  )
);
