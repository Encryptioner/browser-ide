import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decryptSecrets } from '@/services/crypto';
import { logger } from '@/utils/logger';

import { createEditorSlice } from './slices/editorSlice';
import { createUISlice } from './slices/uiSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createGitSlice } from './slices/gitSlice';
import { createTerminalSlice } from './slices/terminalSlice';
import { createWorkspaceSlice } from './slices/workspaceSlice';
import { createAISlice } from './slices/aiSlice';
import type { IDEStore } from './types';

// Re-export types that consumers previously imported from this file
export type { IDEStore, Settings, RecentProject, BeforeInstallPromptEvent, Diagnostic } from './types';

// Re-export DEFAULT_SETTINGS so consumers can access it
export { DEFAULT_SETTINGS } from './slices/settingsSlice';

export const useIDEStore = create<IDEStore>()(
  persist(
    (...a) => ({
      ...createEditorSlice(...a),
      ...createUISlice(...a),
      ...createSettingsSlice(...a),
      ...createGitSlice(...a),
      ...createTerminalSlice(...a),
      ...createWorkspaceSlice(...a),
      ...createAISlice(...a),
    }),
    {
      name: 'ide-storage',
      version: 1,
      partialize: (state) =>
        ({
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
        }) as IDEStore,
      // Restore sensitive keys from sessionStorage after rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        try {
          const raw = sessionStorage.getItem('ide-secrets');
          if (raw) {
            decryptSecrets(raw)
              .then((secrets) => {
                state.settings = {
                  ...state.settings,
                  ai: {
                    ...state.settings.ai,
                    anthropicKey: secrets.anthropicKey || '',
                    anthropicBaseUrl: secrets.anthropicBaseUrl || 'https://api.anthropic.com',
                    glmKey: secrets.glmKey || '',
                    openaiKey: secrets.openaiKey || '',
                  },
                  githubToken: secrets.githubToken || '',
                };
              })
              .catch((err) => {
                logger.error(
                  'Failed to decrypt secrets on rehydration',
                  err,
                  'IDEStore'
                );
              });
          }
        } catch {
          /* sessionStorage may be unavailable */
        }
      },
    }
  )
);
