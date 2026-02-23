import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIPanel } from './AIPanel';
import type { AIMessage, AISession } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreateAISession = vi.fn(() => 'session-1');
const mockAddAIMessage = vi.fn();
const mockUpdateAIMessage = vi.fn();
const mockSetStreaming = vi.fn();
const mockSetAgentMode = vi.fn();
const mockAddToolCall = vi.fn();
const mockUpdateToolCall = vi.fn();
const mockClearToolCalls = vi.fn();
const mockAddClaudeTerminalEntry = vi.fn();
const mockSetAgentRunning = vi.fn();
const mockDeleteAISession = vi.fn();
const mockSetActiveAISession = vi.fn();

const mockMessages: AIMessage[] = [];
const mockSessions: AISession[] = [];

const getMockState = (): Record<string, unknown> => ({
  settings: {
    ai: {
      anthropicKey: 'test-key',
      glmKey: '',
      openaiKey: '',
      defaultProvider: 'anthropic',
    },
  },
  activeAISessionId: null,
  aiSessionList: mockSessions,
  isStreaming: false,
  agentMode: 'chat',
  pendingToolCalls: [],
  createAISession: mockCreateAISession,
  addAIMessage: mockAddAIMessage,
  updateAIMessage: mockUpdateAIMessage,
  setStreaming: mockSetStreaming,
  setAgentMode: mockSetAgentMode,
  addToolCall: mockAddToolCall,
  updateToolCall: mockUpdateToolCall,
  clearToolCalls: mockClearToolCalls,
  addClaudeTerminalEntry: mockAddClaudeTerminalEntry,
  setAgentRunning: mockSetAgentRunning,
  deleteAISession: mockDeleteAISession,
  setActiveAISession: mockSetActiveAISession,
});

vi.mock('@/store/useIDEStore', () => ({
  useIDEStore: vi.fn((selector?: (_state: Record<string, unknown>) => unknown) => {
    const state = getMockState();
    if (typeof selector === 'function') return selector(state);
    return state;
  }),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: unknown) => fn,
}));

vi.mock('@/services/ai-providers', () => ({
  aiRegistry: {
    complete: vi.fn(),
    getProviders: vi.fn(() => []),
    getProvider: vi.fn(),
    register: vi.fn(),
  },
}));

vi.mock('@/services/claude-agent', () => ({
  ClaudeCodeAgent: vi.fn().mockImplementation(() => ({
    executeTask: vi.fn().mockResolvedValue({
      success: true,
      output: 'Task completed',
      artifacts: {},
    }),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockMessages.length = 0;
  mockSessions.length = 0;
});

describe('AIPanel - Rendering', () => {
  it('renders the AI panel with header and input', () => {
    render(<AIPanel />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByTestId('ai-input')).toBeInTheDocument();
    expect(screen.getByTestId('ai-send')).toBeInTheDocument();
  });

  it('shows empty state for chat mode', () => {
    render(<AIPanel />);
    expect(screen.getByText('Ask a question')).toBeInTheDocument();
  });

  it('shows mode toggle buttons', () => {
    render(<AIPanel />);
    expect(screen.getByRole('radio', { name: 'chat' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'agent' })).toBeInTheDocument();
  });

  it('shows provider name', () => {
    render(<AIPanel />);
    expect(screen.getByText('anthropic')).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(<AIPanel />);
    expect(screen.getByTestId('ai-send')).toBeDisabled();
  });
});

describe('AIPanel - Mode Toggle', () => {
  it('calls setAgentMode when clicking agent mode', () => {
    render(<AIPanel />);
    fireEvent.click(screen.getByRole('radio', { name: 'agent' }));
    expect(mockSetAgentMode).toHaveBeenCalledWith('agent');
  });

  it('calls setAgentMode when clicking chat mode', () => {
    render(<AIPanel />);
    fireEvent.click(screen.getByRole('radio', { name: 'chat' }));
    expect(mockSetAgentMode).toHaveBeenCalledWith('chat');
  });
});

describe('AIPanel - Input', () => {
  it('enables send button when text is entered', () => {
    render(<AIPanel />);
    const input = screen.getByTestId('ai-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(screen.getByTestId('ai-send')).not.toBeDisabled();
  });

  it('sends message on Cmd+Enter', () => {
    render(<AIPanel />);
    const input = screen.getByTestId('ai-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true });
    // Should create session and add message
    expect(mockCreateAISession).toHaveBeenCalled();
    expect(mockAddAIMessage).toHaveBeenCalled();
  });

  it('clears input after sending', () => {
    render(<AIPanel />);
    const input = screen.getByTestId('ai-input') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByTestId('ai-send'));
    expect(input.value).toBe('');
  });
});
