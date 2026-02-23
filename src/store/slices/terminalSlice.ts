import type { StateCreator } from 'zustand';
import type { WebContainerProcess } from '@/types';
import type { TerminalTab } from '@/components/IDE/TerminalTabs';
import type { IDEStore } from '../types';

export interface TerminalSlice {
  // State
  terminalTabs: TerminalTab[];
  activeTerminalTabId: string | null;
  terminalProcesses: Record<string, WebContainerProcess>;
  terminalProfiles: TerminalTab['profile'][];

  // Actions
  createTerminalTab: (_profileId: string, _name?: string) => void;
  closeTerminalTab: (_tabId: string) => void;
  setActiveTerminalTab: (_tabId: string) => void;
  updateTerminalTab: (_tabId: string, _updates: Partial<TerminalTab>) => void;
}

export const createTerminalSlice: StateCreator<IDEStore, [], [], TerminalSlice> = (
  set
) => ({
  // Initial state
  terminalTabs: [],
  activeTerminalTabId: null,
  terminalProcesses: {},
  terminalProfiles: [],

  // Actions
  createTerminalTab: (profileId, name) =>
    set((state) => {
      const newTab: TerminalTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: name || `Terminal ${state.terminalTabs.length + 1}`,
        profile: {
          id: profileId,
          name: 'Bash',
          command: '/bin/bash',
          icon: null,
          description: 'Bash shell',
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
          ...state.terminalTabs.map((tab) => ({ ...tab, active: false })),
          newTab,
        ],
        activeTerminalTabId: newTab.id,
      };
    }),
  closeTerminalTab: (tabId) =>
    set((state) => {
      const newTabs = state.terminalTabs.filter((tab) => tab.id !== tabId);
      const newActiveTab =
        state.activeTerminalTabId === tabId
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTerminalTabId;

      return {
        terminalTabs: newTabs,
        activeTerminalTabId: newActiveTab,
      };
    }),
  setActiveTerminalTab: (tabId) =>
    set((state) => ({
      terminalTabs: state.terminalTabs.map((tab) => ({
        ...tab,
        active: tab.id === tabId,
        lastUsed: tab.id === tabId ? Date.now() : tab.lastUsed,
      })),
      activeTerminalTabId: tabId,
    })),
  updateTerminalTab: (tabId, updates) =>
    set((state) => ({
      terminalTabs: state.terminalTabs.map((tab) =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      ),
    })),
});
