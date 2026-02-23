import type { StateCreator } from 'zustand';
import type { IDEStore } from '../types';

export interface UISlice {
  // State
  sidebarOpen: boolean;
  terminalOpen: boolean;
  previewOpen: boolean;
  commandPaletteOpen: boolean;
  helpOpen: boolean;
  aiOpen: boolean;
  activeBottomPanel:
    | 'terminal'
    | 'preview'
    | 'claude-code'
    | 'extensions'
    | 'git'
    | 'debugger'
    | 'split-editor'
    | 'terminal-tabs'
    | 'problems'
    | 'help';
  terminalMaximized: boolean;
  bottomPanelSize: number;

  // Actions
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
  setActiveBottomPanel: (
    _panel:
      | 'terminal'
      | 'preview'
      | 'claude-code'
      | 'extensions'
      | 'git'
      | 'debugger'
      | 'split-editor'
      | 'terminal-tabs'
      | 'problems'
      | 'help'
  ) => void;
  toggleTerminalMaximized: () => void;
  setTerminalMaximized: (_maximized: boolean) => void;
  setBottomPanelSize: (_size: number) => void;
}

export const createUISlice: StateCreator<IDEStore, [], [], UISlice> = (set) => ({
  // Initial state
  sidebarOpen: true,
  terminalOpen: true,
  previewOpen: false,
  commandPaletteOpen: false,
  helpOpen: false,
  aiOpen: false,
  activeBottomPanel: 'terminal' as const,
  terminalMaximized: false,
  bottomPanelSize: 30,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
  togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
  toggleAI: () => set((state) => ({ aiOpen: !state.aiOpen })),
  toggleCommandPalette: () =>
    set((state) => ({
      commandPaletteOpen: !state.commandPaletteOpen,
    })),
  toggleHelp: () => set((state) => ({ helpOpen: !state.helpOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  setPreviewOpen: (open) => set({ previewOpen: open }),
  setAIOpen: (open) => set({ aiOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setHelpOpen: (open) => set({ helpOpen: open }),
  setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel }),
  toggleTerminalMaximized: () =>
    set((state) => {
      const newMaximized = !state.terminalMaximized;
      return {
        terminalMaximized: newMaximized,
        bottomPanelSize: newMaximized
          ? 100
          : Math.max(15, Math.min(70, state.bottomPanelSize)),
      };
    }),
  setTerminalMaximized: (maximized) =>
    set((state) => ({
      terminalMaximized: maximized,
      bottomPanelSize: maximized
        ? 100
        : Math.max(15, Math.min(70, state.bottomPanelSize)),
    })),
  setBottomPanelSize: (size) =>
    set({ bottomPanelSize: Math.max(15, Math.min(100, size)) }),
});
