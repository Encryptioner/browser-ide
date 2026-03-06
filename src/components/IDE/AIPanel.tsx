import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { useShallow } from 'zustand/react/shallow';
import { aiRegistry } from '@/services/ai-providers';
import { ClaudeCodeAgent } from '@/services/claude-agent';
import type { AgentExecutionResult } from '@/services/claude-agent';
import type { AIMessage, StreamChunk, AIProviderConfig } from '@/types';
import type { AgentMode, ToolCallState } from '@/store/slices/aiSlice';
import { FileEditCard, CommandCard, SearchCard } from './ToolCards';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getApiKey(
  provider: string,
  settings: { ai: { anthropicKey: string; glmKey: string; openaiKey: string } }
): string {
  if (provider === 'anthropic') return settings.ai.anthropicKey;
  if (provider === 'glm') return settings.ai.glmKey;
  return settings.ai.openaiKey;
}

function getBaseUrl(
  provider: string,
  settings: { ai: { anthropicBaseUrl: string } }
): string | undefined {
  if (provider === 'anthropic') {
    return settings.ai.anthropicBaseUrl || 'https://api.anthropic.com';
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: AIMessage;
  toolCalls?: ToolCallState[];
}

function MessageBubble({ message, toolCalls }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={clsx('flex mb-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-800 text-gray-200 border border-gray-700'
        )}
      >
        <pre className="whitespace-pre-wrap break-words font-sans">{message.content}</pre>

        {/* Tool call cards (agent mode) */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {toolCalls.map((tc) => {
              if (tc.name === 'read_file' || tc.name === 'write_file' || tc.name === 'edit_file') {
                const op = tc.name === 'read_file' ? 'read' : tc.name === 'write_file' ? 'write' : 'edit';
                return (
                  <FileEditCard
                    key={tc.id}
                    fileName={String(tc.input.file_path || '')}
                    operation={op}
                    status={tc.status}
                    timestamp={tc.timestamp}
                    detail={tc.output}
                  />
                );
              }
              if (tc.name === 'search_code' || tc.name === 'list_files') {
                return (
                  <SearchCard
                    key={tc.id}
                    query={String(tc.input.pattern || tc.input.directory || '')}
                    status={tc.status}
                    timestamp={tc.timestamp}
                  />
                );
              }
              // Default: command card
              return (
                <CommandCard
                  key={tc.id}
                  command={`${tc.name}(${JSON.stringify(tc.input).slice(0, 60)}...)`}
                  status={tc.status}
                  timestamp={tc.timestamp}
                  output={tc.output}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Panel Component
// ---------------------------------------------------------------------------

export function AIPanel() {
  const {
    settings,
    activeAISessionId,
    aiSessionList,
    isStreaming,
    agentMode,
    pendingToolCalls,
    createAISession,
    addAIMessage,
    updateAIMessage,
    setStreaming,
    setAgentMode,
    addToolCall,
    updateToolCall,
    clearToolCalls,
    addClaudeTerminalEntry,
    setAgentRunning,
  } = useIDEStore(
    useShallow((state) => ({
      settings: state.settings,
      activeAISessionId: state.activeAISessionId,
      aiSessionList: state.aiSessionList,
      isStreaming: state.isStreaming,
      agentMode: state.agentMode,
      pendingToolCalls: state.pendingToolCalls,
      createAISession: state.createAISession,
      addAIMessage: state.addAIMessage,
      updateAIMessage: state.updateAIMessage,
      setStreaming: state.setStreaming,
      setAgentMode: state.setAgentMode,
      addToolCall: state.addToolCall,
      updateToolCall: state.updateToolCall,
      clearToolCalls: state.clearToolCalls,
      addClaudeTerminalEntry: state.addClaudeTerminalEntry,
      setAgentRunning: state.setAgentRunning,
    }))
  );

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Get current session messages (memoized to stabilize references)
  const messages = useMemo(() => {
    const session = aiSessionList.find((s) => s.id === activeAISessionId);
    return session?.messages ?? [];
  }, [aiSessionList, activeAISessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingToolCalls]);

  // Ensure a session exists
  const ensureSession = useCallback((): string => {
    if (activeAISessionId) return activeAISessionId;
    return createAISession('default', 'New Chat');
  }, [activeAISessionId, createAISession]);

  // ---------------------------------------------------------------------------
  // Chat Mode: streaming LLM call
  // ---------------------------------------------------------------------------
  const sendChatMessage = useCallback(
    async (text: string) => {
      const provider = settings.ai.defaultProvider;
      const apiKey = getApiKey(provider, settings);

      if (!apiKey) {
        toast.error(`Set your ${provider} API key in Settings first`);
        return;
      }

      const sessionId = ensureSession();
      const userMsg: AIMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      addAIMessage(sessionId, userMsg);

      // Create placeholder assistant message for streaming
      const assistantId = generateId();
      const assistantMsg: AIMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: provider,
      };
      addAIMessage(sessionId, assistantMsg);

      setStreaming(true);
      let fullContent = '';

      try {
        const baseUrl = getBaseUrl(provider, settings);
        const config: AIProviderConfig = {
          id: provider,
          name: provider,
          provider: provider as 'anthropic' | 'glm' | 'openai',
          apiKey,
          baseUrl,
          model: provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'glm-4-plus',
          enabled: true,
        };

        // Get recent messages for context
        const recentMessages = [
          ...messages.slice(-10),
          userMsg,
        ];

        await aiRegistry.complete(provider as 'anthropic' | 'glm' | 'openai', recentMessages, config, (chunk: StreamChunk) => {
          if (chunk.type === 'content' && chunk.content) {
            fullContent += chunk.content;
            updateAIMessage(sessionId, assistantId, fullContent);
          }
        });

        // Final update with complete content
        if (fullContent) {
          updateAIMessage(sessionId, assistantId, fullContent);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        updateAIMessage(sessionId, assistantId, `Error: ${errorMsg}`);
        logger.error('Chat message failed', err, 'AIPanel');
      } finally {
        setStreaming(false);
      }
    },
    [settings, messages, ensureSession, addAIMessage, updateAIMessage, setStreaming]
  );

  // ---------------------------------------------------------------------------
  // Agent Mode: agentic tool-calling loop
  // ---------------------------------------------------------------------------
  const sendAgentMessage = useCallback(
    async (text: string) => {
      const provider = settings.ai.defaultProvider;
      const apiKey = getApiKey(provider, settings);

      if (!apiKey) {
        toast.error(`Set your ${provider} API key in Settings first`);
        return;
      }

      const sessionId = ensureSession();
      const userMsg: AIMessage = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      addAIMessage(sessionId, userMsg);

      setStreaming(true);
      setAgentRunning(true);
      clearToolCalls();

      addClaudeTerminalEntry({
        timestamp: Date.now(),
        type: 'info',
        title: `Agent task started: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
        status: 'running',
      });

      try {
        // Determine baseUrl: for GLM use z.ai anthropic proxy; for anthropic use settings
        let agentBaseUrl: string | undefined;
        if (provider === 'glm') {
          agentBaseUrl = 'https://api.z.ai/api/anthropic';
        } else if (provider === 'anthropic') {
          agentBaseUrl = settings.ai.anthropicBaseUrl || 'https://api.anthropic.com';
        }

        const agent = new ClaudeCodeAgent({
          apiKey,
          model: provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'glm-4-plus',
          baseUrl: agentBaseUrl,
        });

        // Connect abort controller so Cancel button works
        abortRef.current = new AbortController();
        const currentAbort = abortRef.current;
        currentAbort.signal.addEventListener('abort', () => agent.abort());

        // Create a streaming assistant message so user sees text in real-time
        const streamingMsgId = generateId();
        const streamingMsg: AIMessage = {
          id: streamingMsgId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          model: provider,
        };
        addAIMessage(sessionId, streamingMsg);
        let streamedText = '';

        const result: AgentExecutionResult = await agent.executeTask(text, {
          onText: (textChunk: string) => {
            // Stream text into the assistant message bubble
            streamedText += textChunk;
            updateAIMessage(sessionId, streamingMsgId, streamedText);
            // Also log to terminal
            addClaudeTerminalEntry({
              timestamp: Date.now(),
              type: 'info',
              title: textChunk,
              status: 'running',
            });
          },
          onToolUse: (toolName: string, toolInput: Record<string, unknown>) => {
            const tcId = `tc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
            addToolCall({
              id: tcId,
              name: toolName,
              input: toolInput,
              status: 'running',
              timestamp: Date.now(),
            });
            addClaudeTerminalEntry({
              timestamp: Date.now(),
              type: 'info',
              title: `🔧 ${toolName}: ${JSON.stringify(toolInput).slice(0, 100)}...`,
              status: 'running',
            });
          },
          onToolResult: (toolName: string, _result: string) => {
            addClaudeTerminalEntry({
              timestamp: Date.now(),
              type: 'command',
              title: `✅ ${toolName} completed`,
              status: 'running',
            });
          },
          onProgress: (progress: string) => {
            addClaudeTerminalEntry({
              timestamp: Date.now(),
              type: 'info',
              title: progress,
              status: 'running',
            });
          },
          onError: (error: string) => {
            addClaudeTerminalEntry({
              timestamp: Date.now(),
              type: 'error',
              title: `❌ ${error}`,
              status: 'error',
            });
          }
        });


        // Update the streaming message with the final result
        const finalContent = streamedText || (result.success
          ? result.output || 'Task completed successfully.'
          : `Error: ${result.error || 'Task failed.'}`);
        updateAIMessage(sessionId, streamingMsgId, finalContent);

        addClaudeTerminalEntry({
          timestamp: Date.now(),
          type: result.success ? 'info' : 'error',
          title: result.success ? 'Agent task completed' : `Agent task failed: ${result.error}`,
          status: result.success ? 'success' : 'error',
        });

        if (result.artifacts) {
          const { filesCreated, filesModified, commandsExecuted } = result.artifacts;
          if (filesCreated?.length) {
            toast.success(`Created ${filesCreated.length} file(s)`);
          }
          if (filesModified?.length) {
            toast.success(`Modified ${filesModified.length} file(s)`);
          }
          if (commandsExecuted?.length) {
            toast.info(`Executed ${commandsExecuted.length} command(s)`);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const assistantMsg: AIMessage = {
          id: generateId(),
          role: 'assistant',
          content: `Agent error: ${errorMsg}`,
          timestamp: Date.now(),
        };
        addAIMessage(sessionId, assistantMsg);
        logger.error('Agent task failed', err, 'AIPanel');
      } finally {
        setStreaming(false);
        setAgentRunning(false);
      }
    },
    [
      settings,
      ensureSession,
      addAIMessage,
      setStreaming,
      setAgentRunning,
      clearToolCalls,
      addClaudeTerminalEntry,
      addToolCall,
      updateToolCall,
    ]
  );

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------
  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');

    if (agentMode === 'chat') {
      sendChatMessage(text);
    } else {
      sendAgentMessage(text);
    }
  }, [input, isStreaming, agentMode, sendChatMessage, sendAgentMessage]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setAgentRunning(false);
  }, [setStreaming, setAgentRunning]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex h-full flex-col bg-gray-900" data-testid="ai-panel">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-200">AI Assistant</h3>
          {/* Mode toggle */}
          <div className="flex rounded-md bg-gray-800 p-0.5" role="radiogroup" aria-label="AI mode">
            {(['chat', 'agent'] as AgentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={agentMode === mode}
                className={clsx(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                  agentMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
                onClick={() => setAgentMode(mode)}
                disabled={isStreaming}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {settings.ai.defaultProvider}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3" data-testid="ai-messages">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-gray-500">
            <div>
              <p className="mb-2 font-medium">
                {agentMode === 'chat' ? 'Ask a question' : 'Describe a task'}
              </p>
              <p className="text-xs text-gray-600">
                {agentMode === 'chat'
                  ? 'Chat mode for questions and discussions'
                  : 'Agent mode can read, write, and search files'}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              toolCalls={
                msg.role === 'assistant' ? pendingToolCalls : undefined
              }
            />
          ))
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            {agentMode === 'agent' ? 'Agent working...' : 'Thinking...'}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-700 p-2 sm:p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
              // On mobile, Enter without modifier also sends
              if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && 'ontouchstart' in window) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              agentMode === 'chat'
                ? 'Ask a question...'
                : 'Describe a task...'
            }
            className="flex-1 resize-none rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:outline-none min-h-[40px]"
            rows={2}
            disabled={isStreaming}
            aria-label="AI message input"
            data-testid="ai-input"
          />
          <div className="flex flex-col gap-1 justify-end">
            {isStreaming ? (
              <button
                type="button"
                onClick={handleCancel}
                className="rounded bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 min-w-[60px] min-h-[40px] touch-manipulation"
                aria-label="Cancel"
                data-testid="ai-cancel"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 min-w-[60px] min-h-[40px] touch-manipulation"
                aria-label="Send message"
                data-testid="ai-send"
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
