import type { StateCreator } from 'zustand';
import type { AIMessage, AISession } from '@/types';
import type { IDEStore } from '../types';

export type AgentMode = 'chat' | 'agent';

export interface ToolCallState {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'running' | 'success' | 'error';
  timestamp: number;
}

export interface ClaudeTerminalEntry {
  id: string;
  timestamp: number;
  type: 'file_read' | 'file_write' | 'file_edit' | 'command' | 'search' | 'git' | 'info' | 'error';
  title: string;
  detail?: string;
  status: 'running' | 'success' | 'error';
}

export interface AISlice {
  // State
  activeAISessionId: string | null;
  aiSessionList: AISession[];
  isStreaming: boolean;
  agentMode: AgentMode;
  pendingToolCalls: ToolCallState[];
  claudeTerminalEntries: ClaudeTerminalEntry[];
  isAgentRunning: boolean;

  // Actions
  // eslint-disable-next-line no-unused-vars
  createAISession: (projectId: string, title?: string) => string;
  // eslint-disable-next-line no-unused-vars
  deleteAISession: (sessionId: string) => void;
  // eslint-disable-next-line no-unused-vars
  setActiveAISession: (sessionId: string | null) => void;
  // eslint-disable-next-line no-unused-vars
  addAIMessage: (sessionId: string, message: AIMessage) => void;
  // eslint-disable-next-line no-unused-vars
  updateAIMessage: (sessionId: string, messageId: string, content: string) => void;
  // eslint-disable-next-line no-unused-vars
  setStreaming: (streaming: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  setAgentMode: (mode: AgentMode) => void;
  // eslint-disable-next-line no-unused-vars
  addToolCall: (call: ToolCallState) => void;
  // eslint-disable-next-line no-unused-vars
  updateToolCall: (id: string, update: Partial<ToolCallState>) => void;
  clearToolCalls: () => void;
  // eslint-disable-next-line no-unused-vars
  addClaudeTerminalEntry: (entry: Omit<ClaudeTerminalEntry, 'id'>) => void;
  clearClaudeTerminal: () => void;
  // eslint-disable-next-line no-unused-vars
  setAgentRunning: (running: boolean) => void;
}

export const createAISlice: StateCreator<IDEStore, [], [], AISlice> = (
  set,
  get
) => ({
  // Initial state
  activeAISessionId: null,
  aiSessionList: [],
  isStreaming: false,
  agentMode: 'chat',
  pendingToolCalls: [],
  claudeTerminalEntries: [],
  isAgentRunning: false,

  // Actions
  createAISession: (projectId, title) => {
    const sessionId = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const session: AISession = {
      id: sessionId,
      title: title || `Session ${get().aiSessionList.length + 1}`,
      projectId,
      providerId: get().settings.ai.defaultProvider,
      model: '',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };

    set((state) => ({
      aiSessionList: [...state.aiSessionList, session],
      activeAISessionId: sessionId,
    }));

    return sessionId;
  },

  deleteAISession: (sessionId) =>
    set((state) => ({
      aiSessionList: state.aiSessionList.filter((s) => s.id !== sessionId),
      activeAISessionId:
        state.activeAISessionId === sessionId ? null : state.activeAISessionId,
    })),

  setActiveAISession: (sessionId) => set({ activeAISessionId: sessionId }),

  addAIMessage: (sessionId, message) =>
    set((state) => ({
      aiSessionList: state.aiSessionList.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: Date.now(),
            }
          : s
      ),
    })),

  updateAIMessage: (sessionId, messageId, content) =>
    set((state) => ({
      aiSessionList: state.aiSessionList.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m
              ),
              updatedAt: Date.now(),
            }
          : s
      ),
    })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  setAgentMode: (mode) => set({ agentMode: mode }),

  addToolCall: (call) =>
    set((state) => ({
      pendingToolCalls: [...state.pendingToolCalls, call],
    })),

  updateToolCall: (id, update) =>
    set((state) => ({
      pendingToolCalls: state.pendingToolCalls.map((tc) =>
        tc.id === id ? { ...tc, ...update } : tc
      ),
    })),

  clearToolCalls: () => set({ pendingToolCalls: [] }),

  addClaudeTerminalEntry: (entry) =>
    set((state) => {
      const newEntry: ClaudeTerminalEntry = {
        ...entry,
        id: `cte-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };
      return {
        claudeTerminalEntries: [...state.claudeTerminalEntries, newEntry],
      };
    }),

  clearClaudeTerminal: () => set({ claudeTerminalEntries: [] }),

  setAgentRunning: (running) => set({ isAgentRunning: running }),
});
