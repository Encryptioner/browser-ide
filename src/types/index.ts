// Core Type Definitions for Browser IDE

// ============= AI Provider Types =============
export type AIProvider = 'anthropic' | 'glm' | 'openai' | 'custom';

export interface AIProviderConfig {
  id: string;
  name: string;
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  enabled: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  model?: string;
  parentId?: string | null; // For message branching
  children?: string[]; // Child message IDs
}

export interface AISession {
  id: string;
  title: string;
  projectId: string;
  providerId: string;
  model: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
  systemPrompt?: string;
}

// ============= Project Types =============
export interface Project {
  id: string;
  name: string;
  description?: string;
  repoUrl?: string;
  localPath: string;
  gitBranch: string;
  lastOpened: number;
  createdAt: number;
  starred: boolean;
  color?: string;
  tags?: string[];
}

export interface ProjectSettings {
  projectId: string;
  defaultAIProvider?: string;
  defaultModel?: string;
  systemPrompt?: string;
  autoSave: boolean;
  formatOnSave: boolean;
  gitAutoFetch: boolean;
}

// ============= File System Types =============
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: number;
  children?: FileNode[];
}

export interface OpenFile {
  path: string;
  content: string;
  modified: boolean;
  language: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
}

// ============= Git Types =============
export interface GitStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'staged' | 'unmodified';
}

export interface GitCommit {
  oid: string;
  message: string;
  author: {
    name: string;
    email: string;
    timestamp: number;
  };
  committer: {
    name: string;
    email: number;
    timestamp: number;
  };
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

// ============= Settings Types =============
export interface EditorSettings {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  minimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  formatOnSave: boolean;
  bracketPairColorization: boolean;
}

export interface GitSettings {
  username: string;
  email: string;
  githubToken: string;
  defaultBranch: string;
  autoFetch: boolean;
  autoFetchInterval: number;
}

export interface AppSettings {
  editor: EditorSettings;
  git: GitSettings;
  ai: {
    providers: AIProviderConfig[];
    defaultProvider: string;
    defaultModel: string;
    streamResponses: boolean;
  };
  appearance: {
    sidebarPosition: 'left' | 'right';
    panelPosition: 'bottom' | 'right';
    activityBarVisible: boolean;
    statusBarVisible: boolean;
    zoomLevel: number;
  };
  terminal: {
    fontFamily: string;
    fontSize: number;
    cursorStyle: 'block' | 'underline' | 'bar';
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  settings: AppSettings;
  createdAt: number;
  updatedAt: number;
}

// ============= UI State Types =============
export interface EditorTab {
  id: string;
  path: string;
  title: string;
  modified: boolean;
  pinned: boolean;
  preview: boolean;
}

export interface PanelState {
  terminal: boolean;
  output: boolean;
  preview: boolean;
  aiChat: boolean;
}

export interface SidebarState {
  explorer: boolean;
  search: boolean;
  git: boolean;
  extensions: boolean;
}

export interface UIState {
  sidebarOpen: boolean;
  sidebarView: 'explorer' | 'search' | 'git' | 'aiChat' | 'settings';
  panelOpen: boolean;
  panelView: 'terminal' | 'output' | 'preview' | 'problems';
  panelHeight: number;
  sidebarWidth: number;
  editorTabs: EditorTab[];
  activeTabId: string | null;
  commandPaletteOpen: boolean;
  modalOpen: string | null;
}

// ============= Store Types =============
export interface RootStore {
  // Projects
  projects: Project[];
  activeProjectId: string | null;
  projectSettings: Record<string, ProjectSettings>;
  
  // Files
  fileTree: FileNode[];
  openFiles: Record<string, OpenFile>;
  
  // Git
  gitStatus: GitStatus[];
  gitBranches: GitBranch[];
  gitCommits: GitCommit[];
  
  // AI
  aiSessions: Record<string, AISession[]>; // Keyed by projectId
  activeSessions: Record<string, string>; // projectId -> sessionId
  
  // Settings
  settings: AppSettings;
  profile: UserProfile | null;
  
  // UI
  ui: UIState;
}

// ============= API Response Types =============
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error';
  content?: string;
  error?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ============= Debugger Types =============
export interface DebugBreakpoint {
  id: string;
  path: string;
  line: number;
  column?: number;
  enabled: boolean;
  condition?: string;
  hitCount?: number;
  logMessage?: string;
}

export interface DebugStackFrame {
  id: number;
  name: string;
  source: {
    path: string;
    name: string;
  };
  line: number;
  column: number;
  presentationHint?: 'normal' | 'label' | 'subtle';
}

export interface DebugVariable {
  name: string;
  value: string;
  type?: string;
  presentationHint?: 'normal' | 'property' | 'method' | 'class' | 'data';
  variablesReference?: number;
  indexedVariables?: number;
  namedVariables?: number;
  evaluateName?: string;
  memoryReference?: string;
}

export interface DebugThread {
  id: number;
  name: string;
  state: 'stopped' | 'running' | 'starting' | 'crashed';
  stoppedReason?: string;
  stackFrames?: DebugStackFrame[];
}

export interface DebugSession {
  id: string;
  name: string;
  type: string;
  request: 'launch' | 'attach';
  configuration: any;
  workspaceFolder?: string;
  running: boolean;
  threads: DebugThread[];
  breakpoints: DebugBreakpoint[];
  watchExpressions: string[];
  exceptionFilters?: string[];
}

export interface DebugConfiguration {
  type: string;
  name: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  runtimeExecutable?: string;
  runtimeArgs?: string[];
  console?: 'internalConsole' | 'integratedTerminal' | 'externalTerminal';
  stopOnEntry?: boolean;
  sourceMaps?: boolean;
  outFiles?: string[];
  skipFiles?: string[];
  port?: number;
  host?: string;
  timeout?: number;
}

export interface DebugAdapter {
  type: string;
  start: (session: DebugSession) => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  setBreakpoints: (breakpoints: DebugBreakpoint[]) => Promise<void>;
  setExceptionBreakpoints: (filters: string[]) => Promise<void>;
  configurationDone: () => Promise<void>;
  continue: (threadId: number) => Promise<void>;
  next: (threadId: number) => Promise<void>;
  stepIn: (threadId: number) => Promise<void>;
  stepOut: (threadId: number) => Promise<void>;
  pause: (threadId: number) => Promise<void>;
  stackTrace: (threadId: number) => Promise<DebugStackFrame[]>;
  scopes: (frameId: number) => Promise<DebugScope[]>;
  variables: (variablesReference: number) => Promise<DebugVariable[]>;
  evaluate: (expression: string, frameId?: number) => Promise<DebugVariable>;
}

export interface DebugScope {
  name: string;
  presentationHint?: 'arguments' | 'locals' | 'registers' | 'static' | 'constants';
  variablesReference: number;
  namedVariables?: number;
  indexedVariables?: number;
  expensive: boolean;
}

export interface DebugConsoleMessage {
  id: string;
  type: 'log' | 'error' | 'warning' | 'info' | 'debug';
  message: string;
  timestamp: number;
  source?: {
    path: string;
    line: number;
    column: number;
  };
}

// ============= Split Editor Types =============
export interface EditorGroup {
  id: string;
  orientation: 'horizontal' | 'vertical';
  size: number;
  editors: EditorInstance[];
  groups?: EditorGroup[];
}

export interface EditorInstance {
  id: string;
  path: string;
  title: string;
  content: string;
  language: string;
  modified: boolean;
  viewState?: {
    cursorPosition: { line: number; column: number };
    scrollPosition: { scrollTop: number; scrollLeft: number };
    viewZones?: any[];
    decorations?: any[];
  };
}

export interface SplitEditorState {
  groups: EditorGroup[];
  activeGroup: string;
  activeEditor: string;
  orientation: 'horizontal' | 'vertical';
  sizes: number[];
}

// ============= Code Snippets Types =============
export interface CodeSnippet {
  id: string;
  name: string;
  prefix: string;
  body: string[];
  description?: string;
  scope?: string;
  author?: string;
  isBuiltin?: boolean;
  language?: string;
  priority?: number;
}

export interface SnippetPlaceholder {
  index: number;
  text: string;
  transform?: string;
  choices?: string[];
  default?: string;
}

export interface SnippetSession {
  id: string;
  snippet: CodeSnippet;
  placeholders: SnippetPlaceholder[];
  activePlaceholder: number;
  isActive: boolean;
  editorId: string;
}

// ============= Problems Panel Types =============
export interface Problem {
  id: string;
  resource: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  code?: string | { value: string; target: string };
  source?: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  related?: ProblemRelatedInformation[];
  tags?: ProblemTag[];
}

export interface ProblemRelatedInformation {
  message: string;
  resource: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export enum ProblemTag {
  Unnecessary = 1,
  Deprecated = 2,
}

export interface ProblemsCollection {
  resource: string;
  problems: Problem[];
}

export interface ProblemsFilter {
  type?: 'all' | 'errors' | 'warnings' | 'info';
  resource?: string;
  source?: string;
  tag?: ProblemTag;
}

// ============= WebContainer Types =============
export interface WebContainerProcess {
  id: string;
  command: string;
  args: string[];
  running: boolean;
  exitCode?: number;
  output: string[];
}

export interface WebContainerServer {
  port: number;
  url: string;
  ready: boolean;
}

// ============= Database Types (IndexedDB) =============
export interface DBProject extends Project {
  // Additional DB fields if needed
}

export interface DBSession extends AISession {
  // Additional DB fields if needed
}

export interface DBMessage extends AIMessage {
  sessionId: string;
}

export interface DBSettings {
  id: 'app-settings';
  settings: AppSettings;
  updatedAt: number;
}

// ============= Utility Types =============
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<APIResponse<T>>;
export type VoidAsync = Promise<void>;

// ============= Component Props Types =============
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export interface ButtonProps extends BaseComponentProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// ============= Event Types =============
export interface FileChangeEvent {
  path: string;
  content: string;
  modified: boolean;
}

export interface GitChangeEvent {
  type: 'commit' | 'branch' | 'status';
  data: unknown;
}

export interface AIMessageEvent {
  sessionId: string;
  message: AIMessage;
}

// ============= Constants =============
export const AI_PROVIDERS = {
  anthropic: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20250514'],
  },
  glm: {
    name: 'Z.ai GLM',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    models: ['glm-4.6', 'glm-4-plus', 'glm-4-air'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
} as const;

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: 'Consolas, Monaco, monospace',
  tabSize: 2,
  wordWrap: 'on',
  lineNumbers: 'on',
  minimap: true,
  autoSave: true,
  autoSaveDelay: 1000,
  formatOnSave: false,
  bracketPairColorization: true,
};

export const DEFAULT_GIT_SETTINGS: GitSettings = {
  username: '',
  email: '',
  githubToken: '',
  defaultBranch: 'main',
  autoFetch: false,
  autoFetchInterval: 300000, // 5 minutes
};
