import type { StateCreator } from 'zustand';
import type { IDEStore, Settings } from '../types';
import { encryptSecrets } from '@/services/crypto';
import { logger } from '@/utils/logger';

export interface SettingsSlice {
  // State
  settings: Settings;

  // Actions
  updateSettings: (_newSettings: Partial<Settings>) => void;
}

export const DEFAULT_SETTINGS: Settings = {
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
    anthropicBaseUrl: 'https://api.anthropic.com',
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

export const createSettingsSlice: StateCreator<IDEStore, [], [], SettingsSlice> = (
  set,
  get
) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,

  // Actions
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
        anthropicBaseUrl: merged.ai?.anthropicBaseUrl || '',
        glmKey: merged.ai?.glmKey || '',
        openaiKey: merged.ai?.openaiKey || '',
        githubToken: merged.githubToken || '',
      };
      encryptSecrets(secrets)
        .then((encrypted) => {
          sessionStorage.setItem('ide-secrets', encrypted);
        })
        .catch((err) => {
          logger.error('Failed to encrypt and store secrets', err, 'IDEStore');
        });
    } catch {
      /* sessionStorage may be unavailable */
    }
  },
});
