import type { EditorSettings, GitSettings } from '@/types';
import type { EditorSlice } from './slices/editorSlice';
import type { UISlice } from './slices/uiSlice';
import type { SettingsSlice } from './slices/settingsSlice';
import type { GitSlice } from './slices/gitSlice';
import type { TerminalSlice } from './slices/terminalSlice';
import type { WorkspaceSlice } from './slices/workspaceSlice';
import type { AISlice } from './slices/aiSlice';

export type IDEStore = EditorSlice &
  UISlice &
  SettingsSlice &
  GitSlice &
  TerminalSlice &
  WorkspaceSlice &
  AISlice;

/** Browser BeforeInstallPrompt event for PWA install */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Diagnostic entry from various sources (matches Monaco/LSP shape) */
export interface Diagnostic {
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

export interface RecentProject {
  name: string;
  url: string;
  path: string;
  lastOpened: number;
}

// Settings interface combines editor, git, and AI settings
export interface Settings extends EditorSettings, GitSettings {
  ai: {
    anthropicKey: string;
    anthropicBaseUrl: string;
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
