/**
 * AI Providers Tests
 *
 * Test Plan: PRD/plans/PLAN_TEST-ai-providers.md
 * Implementation: src/services/ai-providers.ts
 *
 * Testing multi-provider LLM integration with Anthropic Claude,
 * Z.ai GLM, and OpenAI APIs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AnthropicProvider,
  GLMProvider,
  OpenAIProvider,
  AIProviderRegistry,
} from './ai-providers';
import type { AIProviderConfig, AIMessage, StreamChunk } from '@/types';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock streaming response
function createMockStream(chunks: string[]): Partial<Response> {
  const encoder = new TextEncoder();
  let chunkIndex = 0;

  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => {
          if (chunkIndex < chunks.length) {
            return {
              done: false,
              value: encoder.encode(chunks[chunkIndex++]),
            };
          }
          return { done: true, value: undefined };
        },
      }),
    },
  };
}

// Helper to create mock non-streaming response
function createMockResponse(data: unknown): Partial<Response> {
  return {
    ok: true,
    json: async () => data,
  };
}

// =============================================================================
// ANTHROPIC PROVIDER TESTS
// =============================================================================

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider();
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct id', () => {
      expect(provider.id).toBe('anthropic');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Anthropic Claude');
    });
  });

  describe('complete - non-streaming', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'sk-ant-test',
      model: 'claude-3-5-sonnet-20241022',
    };

    it('should send request to Anthropic API', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'Hi there!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          id: 'msg-123',
        })
      );

      await provider.complete(mockMessages, mockConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-test',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should return successful response', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'Response text' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          id: 'msg-abc',
        })
      );

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Response text');
      expect(result.data?.tokens).toBe(15);
      expect(result.data?.role).toBe('assistant');
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should include model in response', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.data?.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should use default max_tokens when not provided', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, mockConfig);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(4096);
    });

    it('should use custom max_tokens when provided', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, { ...mockConfig, maxTokens: 1000 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(1000);
    });

    it('should use default temperature when not provided', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, mockConfig);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(1.0);
    });

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, { ...mockConfig, temperature: 0.5 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.5);
    });

    it('should convert system role to user for Anthropic', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 5, output_tokens: 2 },
        })
      );

      const messagesWithSystem: AIMessage[] = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hi' },
      ];

      await provider.complete(messagesWithSystem, mockConfig);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages[0].role).toBe('user');
    });

    it('should set stream to false when onChunk not provided', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, mockConfig);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(false);
    });

    it('should set stream to true when onChunk provided', async () => {
      const onChunk = vi.fn();
      mockFetch.mockResolvedValue(createMockStream(['data: [DONE]\n\n']));

      await provider.complete(mockMessages, mockConfig, onChunk);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(true);
    });
  });

  describe('complete - streaming', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Hi' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'sk-ant-test',
      model: 'claude-3-5-sonnet-20241022',
    };

    it('should handle streaming response', async () => {
      const streamChunks = [
        'data: {"type":"message_start","message":{"usage":{"input_tokens":10}}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":" World"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":5}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      const onChunk = vi.fn((chunk) => chunks.push(chunk));

      const result = await provider.complete(mockMessages, mockConfig, onChunk);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hello World');
      expect(result.data?.tokens).toBe(15); // 10 input + 5 output
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should call onChunk for content blocks', async () => {
      const streamChunks = [
        'data: {"type":"message_start","message":{"usage":{"input_tokens":5}}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":"Test"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      const onChunk = vi.fn((chunk) => chunks.push(chunk));

      await provider.complete(mockMessages, mockConfig, onChunk);

      const contentChunks = chunks.filter((c) => c.type === 'content');
      expect(contentChunks.length).toBeGreaterThan(0);
      expect(contentChunks[0].content).toBe('Test');
    });

    it('should send done chunk with usage', async () => {
      const streamChunks = [
        'data: {"type":"message_start","message":{"usage":{"input_tokens":20}}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":"Response"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":10}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      const doneChunk = chunks.find((c) => c.type === 'done');
      expect(doneChunk).toEqual({
        type: 'done',
        usage: { inputTokens: 20, outputTokens: 10 },
      });
    });

    it('should handle streaming parse error gracefully', async () => {
      const streamChunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Partial"}}\n\n',
        'data: invalid json\n\n', // Invalid JSON
        'data: {"type":"content_block_delta","delta":{"text":" continued"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      // Should continue despite parse error
      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Partial continued');
    });

    it('should handle empty stream', async () => {
      mockFetch.mockResolvedValue(createMockStream(['data: [DONE]\n\n']));

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('');
    });

    it('should handle stream read error', async () => {
      // Mock a stream that throws when trying to read
      const mockStream = {
        body: {
          getReader: () => {
            throw new Error('Stream read failed');
          },
        },
      };

      mockFetch.mockResolvedValue(mockStream as Response);

      const onChunk = vi.fn();
      const result = await provider.complete(mockMessages, mockConfig, onChunk);

      // Should handle the error and return error response
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid config', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'sk-ant-valid',
        model: 'claude-3-5-sonnet-20241022',
      });

      expect(valid).toBe(true);
    });

    it('should return false for invalid config', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const valid = await provider.validateConfig({
        apiKey: 'invalid',
        model: 'claude-3',
      });

      expect(valid).toBe(false);
    });

    it('should handle network error during validation', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const valid = await provider.validateConfig({
        apiKey: 'key',
        model: 'claude-3',
      });

      expect(valid).toBe(false);
    });
  });
});

// =============================================================================
// GLM PROVIDER TESTS
// =============================================================================

describe('GLMProvider', () => {
  let provider: GLMProvider;

  beforeEach(() => {
    provider = new GLMProvider();
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct id', () => {
      expect(provider.id).toBe('glm');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('Z.ai GLM');
    });
  });

  describe('complete - non-streaming', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'glm-key',
      model: 'glm-4',
    };

    it('should send request to default Z.ai API', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'GLM response' } }],
          usage: { prompt_tokens: 5, completion_tokens: 3 },
          id: 'glm-123',
        })
      );

      await provider.complete(mockMessages, mockConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/paas/v4/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer glm-key',
          }),
        })
      );
    });

    it('should use custom baseUrl if provided', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'OK' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, {
        ...mockConfig,
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.api.com/v1/chat/completions',
        expect.anything()
      );
    });

    it('should return successful response', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
          id: 'glm-id',
        })
      );

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Test response');
      expect(result.data?.tokens).toBe(15);
    });

    it('should handle API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Invalid token' } }),
      });

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid token');
    });
  });

  describe('complete - streaming', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Hi' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'glm-key',
      model: 'glm-4',
    };

    it('should handle streaming response', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hello World');
    });

    it('should call onChunk for each content delta', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"C"}}]}\n\n',
        'data: {"usage":{"prompt_tokens":1,"completion_tokens":3}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      const contentChunks = chunks.filter((c) => c.type === 'content');
      expect(contentChunks).toHaveLength(3);
      expect(contentChunks[0].content).toBe('A');
      expect(contentChunks[1].content).toBe('B');
      expect(contentChunks[2].content).toBe('C');
    });

    it('should send done chunk', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      const doneChunk = chunks.find((c) => c.type === 'done');
      expect(doneChunk).toBeDefined();
      expect(doneChunk?.type).toBe('done');
    });

    it('should handle streaming parse error gracefully', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"OK"}}]}\n\n',
        'data: invalid json\n\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
        'data: {"usage":{"prompt_tokens":2,"completion_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('OK!');
    });
  });

  describe('validateConfig', () => {
    it('should validate config with default baseUrl', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'valid-key',
        model: 'glm-4',
      });

      expect(valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.z.ai/api/paas/v4/chat/completions',
        expect.anything()
      );
    });

    it('should validate config with custom baseUrl', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'valid-key',
        model: 'glm-4',
        baseUrl: 'https://custom.com/v1',
      });

      expect(valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.com/v1/chat/completions',
        expect.anything()
      );
    });
  });
});

// =============================================================================
// OPENAI PROVIDER TESTS
// =============================================================================

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider();
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct id', () => {
      expect(provider.id).toBe('openai');
    });

    it('should have correct name', () => {
      expect(provider.name).toBe('OpenAI');
    });
  });

  describe('complete - non-streaming', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Hello' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'sk-openai',
      model: 'gpt-4',
    };

    it('should send request to OpenAI API', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'OpenAI response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
          id: 'openai-123',
        })
      );

      await provider.complete(mockMessages, mockConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk-openai',
          }),
        })
      );
    });

    it('should use custom baseUrl', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'OK' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        })
      );

      await provider.complete(mockMessages, {
        ...mockConfig,
        baseUrl: 'https://custom.openai.com/v1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.openai.com/v1/chat/completions',
        expect.anything()
      );
    });

    it('should return successful response', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 8, completion_tokens: 4 },
          id: 'chatcmpl-123',
        })
      );

      const result = await provider.complete(mockMessages, mockConfig);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Response');
      expect(result.data?.tokens).toBe(12);
    });
  });

  describe('complete - streaming', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Hi' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'sk-openai',
      model: 'gpt-4',
    };

    it('should handle streaming using GLM-style format', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"!"}}]}\n\n',
        'data: {"usage":{"prompt_tokens":3,"completion_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const result = await provider.complete(mockMessages, mockConfig, vi.fn());

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hello!');
    });

    it('should track token usage in streaming', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Test"}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      mockFetch.mockResolvedValue(createMockStream(streamChunks));

      const chunks: StreamChunk[] = [];
      await provider.complete(mockMessages, mockConfig, (c) => chunks.push(c));

      const doneChunk = chunks.find((c) => c.type === 'done');
      expect(doneChunk).toBeDefined();
      expect(doneChunk?.type).toBe('done');
    });
  });

  describe('validateConfig', () => {
    it('should validate config with default baseUrl', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'sk-test',
        model: 'gpt-4',
      });

      expect(valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.anything()
      );
    });

    it('should validate config with custom baseUrl', async () => {
      mockFetch.mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'sk-test',
        model: 'gpt-4',
        baseUrl: 'https://api.custom.com/v1',
      });

      expect(valid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.custom.com/v1/chat/completions',
        expect.anything()
      );
    });
  });
});

// =============================================================================
// PROVIDER REGISTRY TESTS
// =============================================================================

describe('AIProviderRegistry', () => {
  let registry: AIProviderRegistry;

  beforeEach(() => {
    registry = new AIProviderRegistry();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should register built-in providers', () => {
      const providers = registry.getAll();
      const ids = providers.map((p) => p.id);

      expect(ids).toContain('anthropic');
      expect(ids).toContain('glm');
      expect(ids).toContain('openai');
    });

    it('should have exactly 3 built-in providers', () => {
      const providers = registry.getAll();
      expect(providers).toHaveLength(3);
    });

    it('should have provider names', () => {
      const providers = registry.getAll();
      const names = providers.map((p) => p.name);

      expect(names).toContain('Anthropic Claude');
      expect(names).toContain('Z.ai GLM');
      expect(names).toContain('OpenAI');
    });
  });

  describe('get', () => {
    it('should return Anthropic provider', () => {
      const provider = registry.get('anthropic');

      expect(provider).toBeDefined();
      expect(provider?.id).toBe('anthropic');
      expect(provider?.name).toBe('Anthropic Claude');
    });

    it('should return GLM provider', () => {
      const provider = registry.get('glm');

      expect(provider).toBeDefined();
      expect(provider?.id).toBe('glm');
      expect(provider?.name).toBe('Z.ai GLM');
    });

    it('should return OpenAI provider', () => {
      const provider = registry.get('openai');

      expect(provider).toBeDefined();
      expect(provider?.id).toBe('openai');
      expect(provider?.name).toBe('OpenAI');
    });

    it('should return undefined for unknown provider', () => {
      const provider = registry.get('unknown' as unknown as Parameters<typeof registry.get>[0]);

      expect(provider).toBeUndefined();
    });
  });

  describe('register', () => {
    it('should register custom provider', () => {
      const customProvider = {
        id: 'custom',
        name: 'Custom Provider',
        complete: vi.fn(),
        validateConfig: vi.fn(),
      } as unknown as Parameters<typeof registry.register>[1];

      registry.register('custom', customProvider);

      const providers = registry.getAll();
      expect(providers.map((p) => p.id)).toContain('custom');
    });

    it('should allow overriding existing provider', () => {
      const newProvider = {
        id: 'anthropic',
        name: 'New Anthropic',
        complete: vi.fn(),
        validateConfig: vi.fn(),
      } as unknown as Parameters<typeof registry.register>[1];

      registry.register('anthropic', newProvider);

      const provider = registry.get('anthropic');
      expect(provider?.name).toBe('New Anthropic');
    });

    it('should handle multiple custom providers', () => {
      const provider1 = { id: 'p1', name: 'P1', complete: vi.fn(), validateConfig: vi.fn() } as unknown as Parameters<typeof registry.register>[1];
      const provider2 = { id: 'p2', name: 'P2', complete: vi.fn(), validateConfig: vi.fn() } as unknown as Parameters<typeof registry.register>[1];

      registry.register('p1', provider1);
      registry.register('p2', provider2);

      const providers = registry.getAll();
      expect(providers).toHaveLength(5); // 3 built-in + 2 custom
    });
  });

  describe('complete', () => {
    const mockMessages: AIMessage[] = [{ role: 'user', content: 'Test' }];
    const mockConfig: AIProviderConfig = {
      apiKey: 'test-key',
      model: 'test-model',
    };

    it('should delegate to Anthropic provider', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          content: [{ text: 'Claude response' }],
          usage: { input_tokens: 5, output_tokens: 3 },
        })
      );

      const result = await registry.complete('anthropic', mockMessages, mockConfig);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Claude response');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.anything()
      );
    });

    it('should delegate to GLM provider', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'GLM response' } }],
          usage: { prompt_tokens: 5, completion_tokens: 3 },
        })
      );

      const result = await registry.complete('glm', mockMessages, mockConfig);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('GLM response');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('chat/completions'),
        expect.anything()
      );
    });

    it('should delegate to OpenAI provider', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          choices: [{ message: { content: 'OpenAI response' } }],
          usage: { prompt_tokens: 5, completion_tokens: 3 },
        })
      );

      const result = await registry.complete('openai', mockMessages, mockConfig);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('OpenAI response');
    });

    it('should return error for unknown provider', async () => {
      const result = await registry.complete('unknown' as unknown as Parameters<typeof registry.complete>[0], mockMessages, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should pass onChunk to provider', async () => {
      mockFetch.mockResolvedValue(
        createMockStream([
          'data: {"type":"content_block_delta","delta":{"text":"Stream"}}\n\n',
          'data: {"type":"message_delta","usage":{"output_tokens":1}}\n\n',
          'data: [DONE]\n\n',
        ])
      );

      const onChunk = vi.fn();
      const result = await registry.complete('anthropic', mockMessages, mockConfig, onChunk);

      expect(result.success).toBe(true);
      expect(onChunk).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should return all providers as array', () => {
      const providers = registry.getAll();

      expect(Array.isArray(providers)).toBe(true);
      expect(providers).toHaveLength(3);
    });

    it('should include all built-in providers', () => {
      const providers = registry.getAll();
      const ids = providers.map((p) => p.id);

      expect(ids).toEqual(expect.arrayContaining(['anthropic', 'glm', 'openai']));
    });
  });
});
