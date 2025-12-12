import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EditorSettings,
  GitSettings,
  AppSettings,
  FileNode,
  Project,
  CodeSnippet,
  Problem,
  WebContainerServer,
  EditorTab,
  DebugSession,
  DebugBreakpoint,
  SplitEditorState,
  SnippetSession,
  TerminalTab,
  ProblemsFilter,
  WebContainerProcess,
} from '@/types';

// RecentProject is defined here since it doesn't exist in types
export interface RecentProject {
  name: string;
  url: string;
  path: string;
  lastOpened: number;
}

// Services will be added later when needed
let webContainerServer: WebContainerServer | null = null;

// Settings interface combines editor, git, and AI settings
export interface Settings extends EditorSettings, GitSettings {
  ai: {
    anthropicKey: string;
    glmKey: string;
    openaiKey: string;
    defaultProvider: 'anthropic' | 'glm' | 'openai';
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

  // Git
  currentRepo: string | null;
  currentBranch: string;
  gitStatus: any[];
  commits: any[];

  // Editor
  editorContent: Record<string, string>;
  unsavedChanges: Set<string>;
  activeTabId: string | null;
  splitEditorState: SplitEditorState | null;

  // Debugging
  debugSessions: Record<string, DebugSession[]>;
  activeDebugSessionId: string | null;
  breakpoints: Record<string, DebugBreakpoint[]>;
  debugConfigurations: any[];

  // Code Snippets
  snippets: CodeSnippet[];
  snippetSessions: Record<string, SnippetSession>;
  activeSnippetSessionId: string | null;

  // Terminal
  terminalTabs: TerminalTab[];
  activeTerminalTabId: string | null;
  terminalProcesses: Record<string, WebContainerProcess>;
  terminalProfiles: any[];

  // Problems/Diagnostics
  problems: Problem[];
  diagnostics: Record<string, any[]>;
  problemFilters: ProblemsFilter;

  // AI/Chat
  aiOpen: boolean;
  aiSessions: Record<string, any[]>;

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
  installPromptEvent: any;

  // Services
  webContainerService: WebContainerService | null;
  webContainerServer: WebContainerServer | null;
}

interface IDEActions {
  // Project Management
  setActiveProject: (id: string | null) => void;
  addRecentProject: (project: Omit<RecentProject, 'lastOpened'>) => void;
  removeRecentProject: (url: string) => void;

  // File System
  setCurrentFile: (file: string | null) => void;
  addOpenFile: (file: string) => void;
  closeFile: (file: string) => void;
  closeAllFiles: () => void;
  updateEditorContent: (file: string, content: string) => void;
  markFileUnsaved: (file: string) => void;
  markFileSaved: (file: string) => void;
  setFileTree: (tree: FileNode[]) => void;

  // Directory Navigation
  changeDirectory: (path: string) => void;
  getCurrentDirectory: () => string;

  // Git
  setCurrentRepo: (repo: string | null) => void;
  setCurrentBranch: (branch: string) => void;
  setGitStatus: (status: any[]) => void;
  setCommits: (commits: any[]) => void;

  // Debugging
  setActiveDebugSession: (projectId: string, sessionId: string) => void;
  stopDebugSession: (sessionId: string) => void;
  addBreakpoint: (breakpoint: DebugBreakpoint) => void;
  removeBreakpoint: (breakpointId: string) => void;
  updateBreakpoint: (breakpoint: DebugBreakpoint) => void;
  setDebugConfigurations: (configs: any[]) => void;

  // Split Editor
  setSplitEditorState: (state: SplitEditorState) => void;

  // Code Snippets
  addSnippet: (snippet: CodeSnippet) => void;
  removeSnippet: (snippetId: string) => void;
  updateSnippet: (snippetId: string, updates: Partial<CodeSnippet>) => void;
  createSnippetSession: (editorId: string, snippet: CodeSnippet) => void;
  finishSnippetSession: (sessionId: string) => void;

  // Terminal
  createTerminalTab: (profileId: string, name?: string) => void;
  closeTerminalTab: (tabId: string) => void;
  setActiveTerminalTab: (tabId: string) => void;
  updateTerminalTab: (tabId: string, updates: Partial<TerminalTab>) => void;

  // Problems
  setProblems: (problems: Problem[]) => void;
  addProblem: (problem: Problem) => void;
  removeProblem: (problemId: string) => void;
  clearProblems: () => void;
  setProblemFilters: (filters: ProblemsFilter) => void;

  // UI Actions
  toggleSidebar: () => void;
  toggleTerminal: () => void;
  togglePreview: () => void;
  toggleAI: () => void;
  toggleCommandPalette: () => void;
  toggleHelp: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTerminalOpen: (open: boolean) => void;
  setPreviewOpen: (open: boolean) => void;
  setAIOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setActiveBottomPanel: (panel: 'terminal' | 'preview' | 'claude-code' | 'extensions' | 'git' | 'debugger' | 'split-editor' | 'terminal-tabs' | 'problems' | 'help') => void;

  // Panel Sizing
  toggleTerminalMaximized: () => void;
  setTerminalMaximized: (maximized: boolean) => void;
  setBottomPanelSize: (size: number) => void;

  // Settings
  updateSettings: (newSettings: Partial<Settings>) => void;

  // PWA
  setInstalled: (installed: boolean) => void;
  setInstallPrompt: (event: any) => void;

  // Tab Management
  setActiveTab: (tabId: string) => void;
  duplicateTab: (tabId: string) => void;
  closeTab: (tabId: string) => void;

  // Actions from various components
  getDiagnostics: () => any[];
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: 'on',
  autoSave: true,
  autoSaveDelay: 1000,
  lineNumbers: 'on',
  minimap: true,
  githubToken: '',
  username: '',
  githubEmail: '',
  ai: {
    anthropicKey: '',
    glmKey: '',
    openaiKey: '',
    defaultProvider: 'glm',
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

      currentRepo: null,
      currentBranch: 'main',
      gitStatus: [],
      commits: [],

      editorContent: {},
      unsavedChanges: new Set(),
      activeTabId: null,
      splitEditorState: null,

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
      createSnippetSession: (editorId, snippet) => set((state) => ({
        snippetSessions: {
          ...state.snippetSessions,
          [editorId]: {
            id: `session-${Date.now()}`,
            snippet,
            placeholders: [],
            activePlaceholder: 0,
            isActive: true,
            editorId,
          },
        },
        activeSnippetSessionId: `session-${Date.now()}`,
      })),
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
          id: `tab-${Date.now()}`,
          title: name || `Terminal ${state.terminalTabs.length + 1}`,
          profile: { id: profileId, name: 'Bash', command: '/bin/bash' },
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
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

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
        const allDiagnostics: any[] = [];

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
    }
  )
);

