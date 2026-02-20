import type { StateCreator } from 'zustand';
import type {
  FileNode,
  Project,
  CodeSnippet,
  Problem,
  WebContainerServer,
  DebugSession,
  DebugBreakpoint,
  DebugConfiguration,
  SnippetSession,
  ProblemsFilter,
  AIMessage,
} from '@/types';
import type { IDEStore, BeforeInstallPromptEvent, Diagnostic } from '../types';

export interface WorkspaceSlice {
  // State - Projects
  projects: Project[];
  activeProjectId: string | null;
  recentProjects: import('../types').RecentProject[];
  files: Record<string, string>;
  fileTree: FileNode[];
  currentDirectory: string;

  // State - Debugging
  debugSessions: Record<string, DebugSession[]>;
  activeDebugSessionId: string | null;
  breakpoints: Record<string, DebugBreakpoint[]>;
  debugConfigurations: DebugConfiguration[];

  // State - Code Snippets
  snippets: CodeSnippet[];
  snippetSessions: Record<string, SnippetSession>;
  activeSnippetSessionId: string | null;

  // State - Problems/Diagnostics
  problems: Problem[];
  diagnostics: Record<string, Diagnostic[]>;
  problemFilters: ProblemsFilter;

  // State - AI/Chat
  aiSessions: Record<string, AIMessage[]>;

  // State - PWA
  isInstalled: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;

  // State - Services
  webContainerService: typeof import('@/services/webcontainer').webContainer | null;
  webContainerServer: WebContainerServer | null;

  // Actions - Projects
  setActiveProject: (_id: string | null) => void;
  addRecentProject: (_project: Omit<import('../types').RecentProject, 'lastOpened'>) => void;
  removeRecentProject: (_url: string) => void;
  setFileTree: (_tree: FileNode[]) => void;
  changeDirectory: (_path: string) => void;
  getCurrentDirectory: () => string;

  // Actions - Debugging
  setActiveDebugSession: (_projectId: string, _sessionId: string) => void;
  stopDebugSession: (_sessionId: string) => void;
  addBreakpoint: (_breakpoint: DebugBreakpoint) => void;
  removeBreakpoint: (_breakpointId: string) => void;
  updateBreakpoint: (_breakpoint: DebugBreakpoint) => void;
  setDebugConfigurations: (_configs: DebugConfiguration[]) => void;

  // Actions - Code Snippets
  addSnippet: (_snippet: CodeSnippet) => void;
  removeSnippet: (_snippetId: string) => void;
  updateSnippet: (_snippetId: string, _updates: Partial<CodeSnippet>) => void;
  createSnippetSession: (_editorId: string, _snippet: CodeSnippet) => void;
  finishSnippetSession: (_sessionId: string) => void;

  // Actions - Problems
  setProblems: (_problems: Problem[]) => void;
  addProblem: (_problem: Problem) => void;
  removeProblem: (_problemId: string) => void;
  clearProblems: () => void;
  setProblemFilters: (_filters: ProblemsFilter) => void;
  getDiagnostics: () => Diagnostic[];

  // Actions - PWA
  setInstalled: (_installed: boolean) => void;
  setInstallPrompt: (_event: BeforeInstallPromptEvent | null) => void;
}

export const createWorkspaceSlice: StateCreator<IDEStore, [], [], WorkspaceSlice> = (
  set,
  get
) => ({
  // Initial state - Projects
  projects: [],
  activeProjectId: null,
  recentProjects: [],
  files: {},
  fileTree: [],
  currentDirectory: '/repo',

  // Initial state - Debugging
  debugSessions: {},
  activeDebugSessionId: null,
  breakpoints: {},
  debugConfigurations: [],

  // Initial state - Code Snippets
  snippets: [],
  snippetSessions: {},
  activeSnippetSessionId: null,

  // Initial state - Problems/Diagnostics
  problems: [],
  diagnostics: {},
  problemFilters: { type: 'all' },

  // Initial state - AI/Chat
  aiSessions: {},

  // Initial state - PWA
  isInstalled: false,
  installPromptEvent: null,

  // Initial state - Services
  webContainerService: null,
  webContainerServer: null,

  // Actions - Projects
  setActiveProject: (id) => set({ activeProjectId: id }),
  addRecentProject: (project) =>
    set((state) => ({
      recentProjects: [
        { ...project, lastOpened: Date.now() },
        ...state.recentProjects.filter((p) => p.url !== project.url),
      ].slice(0, 10),
    })),
  removeRecentProject: (url) =>
    set((state) => ({
      recentProjects: state.recentProjects.filter((p) => p.url !== url),
    })),
  setFileTree: (tree) => set({ fileTree: tree }),
  changeDirectory: (path) => set({ currentDirectory: path }),
  getCurrentDirectory: () => get().currentDirectory,

  // Actions - Debugging
  setActiveDebugSession: (projectId, sessionId) =>
    set((state) => ({
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
          },
        ],
      },
    })),
  stopDebugSession: (sessionId) =>
    set((state) => {
      const newSessions = { ...state.debugSessions };
      Object.keys(newSessions).forEach((projectId) => {
        newSessions[projectId] = newSessions[projectId].filter(
          (s) => s.id !== sessionId
        );
      });

      return {
        debugSessions: newSessions,
        activeDebugSessionId:
          state.activeDebugSessionId === sessionId
            ? null
            : state.activeDebugSessionId,
      };
    }),
  addBreakpoint: (breakpoint) =>
    set((state) => ({
      breakpoints: {
        ...state.breakpoints,
        [breakpoint.path]: [
          ...(state.breakpoints[breakpoint.path] || []),
          breakpoint,
        ],
      },
    })),
  removeBreakpoint: (breakpointId) =>
    set((state) => {
      const newBreakpoints = { ...state.breakpoints };
      Object.keys(newBreakpoints).forEach((path) => {
        newBreakpoints[path] = newBreakpoints[path].filter(
          (bp) => bp.id !== breakpointId
        );
      });
      return { breakpoints: newBreakpoints };
    }),
  updateBreakpoint: (breakpoint) =>
    set((state) => ({
      breakpoints: {
        ...state.breakpoints,
        [breakpoint.path]: (state.breakpoints[breakpoint.path] || []).map((bp) =>
          bp.id === breakpoint.id ? breakpoint : bp
        ),
      },
    })),
  setDebugConfigurations: (configs) => set({ debugConfigurations: configs }),

  // Actions - Code Snippets
  addSnippet: (snippet) =>
    set((state) => ({
      snippets: [...state.snippets, snippet],
    })),
  removeSnippet: (snippetId) =>
    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== snippetId),
    })),
  updateSnippet: (snippetId, updates) =>
    set((state) => ({
      snippets: state.snippets.map((s) =>
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
  finishSnippetSession: (sessionId) =>
    set((state) => {
      const newSessions = { ...state.snippetSessions };
      Object.keys(newSessions).forEach((editorId) => {
        if (newSessions[editorId]?.id === sessionId) {
          delete newSessions[editorId];
        }
      });

      return {
        snippetSessions: newSessions,
        activeSnippetSessionId:
          state.activeSnippetSessionId === sessionId
            ? null
            : state.activeSnippetSessionId,
      };
    }),

  // Actions - Problems
  setProblems: (problems) => set({ problems }),
  addProblem: (problem) =>
    set((state) => ({
      problems: [...state.problems, problem],
    })),
  removeProblem: (problemId) =>
    set((state) => ({
      problems: state.problems.filter((p) => p.id !== problemId),
    })),
  clearProblems: () => set({ problems: [] }),
  setProblemFilters: (filters) => set({ problemFilters: filters }),
  getDiagnostics: () => {
    const allDiagnostics: Diagnostic[] = [];
    Object.values(get().diagnostics).forEach((fileDiagnostics) => {
      allDiagnostics.push(...fileDiagnostics);
    });
    return allDiagnostics;
  },

  // Actions - PWA
  setInstalled: (installed) => set({ isInstalled: installed }),
  setInstallPrompt: (event) => set({ installPromptEvent: event }),
});
