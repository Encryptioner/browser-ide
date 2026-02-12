# Test Plan: AI Provider Registry

**Plan ID:** P2-006
**Service:** `src/services/ai-providers.ts`
**Created:** February 2026
**Status:** Ready for Implementation

---

## Service Overview

The AI Provider Registry manages multiple LLM providers (Anthropic Claude, Z.ai GLM, OpenAI) with unified interfaces for chat completion, streaming responses, and configuration validation.

### Key Features
- Multi-provider support (Anthropic, GLM, OpenAI)
- Streaming and non-streaming responses
- SSE (Server-Sent Events) parsing for streaming
- Token usage tracking
- Configuration validation
- Provider registry pattern

---

## Test File Location

```
src/services/ai-providers.test.ts
```

---

## Classes to Test

| Class | Purpose | Test Priority |
|-------|---------|---------------|
| `AnthropicProvider` | Anthropic Claude API | P0 |
| `GLMProvider` | Z.ai GLM API | P0 |
| `OpenAIProvider` | OpenAI API | P0 |
| `AIProviderRegistry` | Provider management | P0 |

---

## Mock Strategy

### Fetch Mock
```typescript
global.fetch = vi.fn();

// Mock streaming response
function createMockStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return {
    body: {
      getReader: () => ({
        read: async () => {
          for (const chunk of chunks) {
            return {
              done: false,
              value: encoder.encode(chunk),
            };
          }
          return { done: true, value: undefined };
        },
      }),
    },
  };
}

// Mock non-streaming response
function createMockResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  };
}
```

---

## Test Cases by Provider

### 1. AnthropicProvider Tests

```typescript
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
    it('should send request to Anthropic API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Hello!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          id: 'msg-123',
        }),
      });

      const messages = [{ role: 'user' as const, content: 'Hi' }];
      const config = { apiKey: 'sk-ant-key', model: 'claude-3-5-sonnet-20241022' };

      const result = await provider.complete(messages, config);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should return successful response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response text' }],
          usage: { input_tokens: 10, output_tokens: 5 },
          id: 'msg-abc',
        }),
      });

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'key', model: 'claude-3' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Response text');
      expect(result.data?.tokens).toBe(15);
    });

    it('should handle API error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'invalid', model: 'claude-3' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should handle network error', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'key', model: 'claude-3' }
      );

      expect(result.success).toBe(false);
    });

    it('should convert system role to user for Anthropic', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
      });

      await provider.complete(
        [
          { role: 'system' as const, content: 'You are helpful' },
          { role: 'user' as const, content: 'Hi' },
        ],
        { apiKey: 'key', model: 'claude-3' }
      );

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body);
      expect(body.messages[0].role).toBe('user');
    });
  });

  describe('complete - streaming', () => {
    it('should handle streaming response', async () => {
      const streamChunks = [
        'data: {"type":"message_start","message":{"usage":{"input_tokens":10}}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":" World"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":5}}\n\n',
        'data: [DONE]\n\n',
      ];

      const mockStream = createMockStream(streamChunks);
      vi.mocked(fetch).mockResolvedValue(mockStream as Response);

      const chunks: StreamChunk[] = [];
      const onChunk = vi.fn((chunk) => chunks.push(chunk));

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hi' }],
        { apiKey: 'key', model: 'claude-3' },
        onChunk
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hello World');
      expect(chunks).toHaveLength(4); // 2 content + 1 done + 1 with usage
    });

    it('should handle streaming error gracefully', async () => {
      const streamChunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Partial"}}\n\n',
        // Incomplete data that causes parse error
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hi' }],
        { apiKey: 'key', model: 'claude-3' },
        (c) => chunks.push(c)
      );

      // Should handle parse error but still return partial result
      expect(chunks).toContainEqual({ type: 'error', error: expect.any(String) });
    });

    it('should track token usage in streaming', async () => {
      const streamChunks = [
        'data: {"type":"message_start","message":{"usage":{"input_tokens":20}}}\n\n',
        'data: {"type":"content_block_delta","delta":{"text":"Response"}}\n\n',
        'data: {"type":"message_delta","usage":{"output_tokens":10}}\n\n',
        'data: [DONE]\n\n',
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Test' }],
        { apiKey: 'key', model: 'claude-3' },
        (c) => chunks.push(c)
      );

      expect(result.data?.tokens).toBe(30); // 20 input + 10 output

      const doneChunk = chunks.find(c => c.type === 'done');
      expect(doneChunk).toEqual({
        type: 'done',
        usage: { inputTokens: 20, outputTokens: 10 },
      });
    });
  });

  describe('validateConfig', () => {
    it('should return true for valid config', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'sk-ant-valid-key',
        model: 'claude-3',
      });

      expect(valid).toBe(true);
    });

    it('should return false for invalid config', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false });

      const valid = await provider.validateConfig({
        apiKey: 'invalid',
        model: 'claude-3',
      });

      expect(valid).toBe(false);
    });

    it('should handle network error during validation', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const valid = await provider.validateConfig({
        apiKey: 'key',
        model: 'claude-3',
      });

      expect(valid).toBe(false);
    });
  });
});
```

### 2. GLMProvider Tests

```typescript
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
    it('should send request to Z.ai API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'GLM response' } }],
          usage: { prompt_tokens: 5, completion_tokens: 3 },
          id: 'glm-123',
        }),
      });

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'glm-key', model: 'glm-4' }
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('chat/completions'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer glm-key',
          }),
        })
      );
    });

    it('should use custom baseUrl if provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OK' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      });

      await provider.complete(
        [{ role: 'user' as const, content: 'Hi' }],
        {
          apiKey: 'key',
          model: 'glm-4',
          baseUrl: 'https://custom.api.com/v1',
        }
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://custom.api.com/v1/chat/completions',
        expect.anything()
      );
    });

    it('should return successful response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
          id: 'glm-id',
        }),
      });

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Test' }],
        { apiKey: 'key', model: 'glm-4' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Test response');
      expect(result.data?.tokens).toBe(15);
    });
  });

  describe('complete - streaming', () => {
    it('should handle streaming response', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: {"usage":{"prompt_tokens":5,"completion_tokens":5}}\n\n',
        'data: [DONE]\n\n',
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const chunks: StreamChunk[] = [];
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hi' }],
        { apiKey: 'key', model: 'glm-4' },
        (c) => chunks.push(c)
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hello World');
    });

    it('should track usage in streaming', async () => {
      const streamChunks = [
        'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\n',
        'data: {"usage":{"prompt_tokens":8,"completion_tokens":2}}\n\n',
        'data: [DONE]\n\n',
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const chunks: StreamChunk[] = [];
      await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'key', model: 'glm-4' },
        (c) => chunks.push(c)
      );

      const doneChunk = chunks.find(c => c.type === 'done');
      expect(doneChunk?.usage).toEqual({ inputTokens: 8, outputTokens: 2 });
    });
  });

  describe('validateConfig', () => {
    it('should validate config', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true });

      const valid = await provider.validateConfig({
        apiKey: 'valid-key',
        model: 'glm-4',
      });

      expect(valid).toBe(true);
    });
  });
});
```

### 3. OpenAIProvider Tests

```typescript
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
    it('should send request to OpenAI API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
          id: 'openai-123',
        }),
      });

      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'sk-openai', model: 'gpt-4' }
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-openai',
          }),
        })
      );
    });

    it('should use custom baseUrl', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OK' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      });

      await provider.complete(
        [{ role: 'user' as const, content: 'Hi' }],
        {
          apiKey: 'key',
          model: 'gpt-4',
          baseUrl: 'https://custom.openai.com/v1',
        }
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://custom.openai.com/v1/chat/completions',
        expect.anything()
      );
    });
  });

  describe('complete - streaming', () => {
    it('should use GLM streaming implementation', async () => {
      // OpenAI reuses GLM's handleStreamLikeGLM
      // Test that delegation works correctly
    });
  });
});
```

### 4. AIProviderRegistry Tests

```typescript
describe('AIProviderRegistry', () => {
  let registry: AIProviderRegistry;

  beforeEach(() => {
    registry = new AIProviderRegistry();
  });

  describe('initialization', () => {
    it('should register built-in providers', () => {
      const providers = registry.getAll();
      const ids = providers.map(p => p.id);

      expect(ids).toContain('anthropic');
      expect(ids).toContain('glm');
      expect(ids).toContain('openai');
    });

    it('should have exactly 3 built-in providers', () => {
      const providers = registry.getAll();
      expect(providers).toHaveLength(3);
    });
  });

  describe('register', () => {
    it('should register custom provider', () => {
      const customProvider = {
        id: 'custom',
        name: 'Custom Provider',
        complete: vi.fn(),
        validateConfig: vi.fn(),
      } as unknown as LLMProvider;

      registry.register('custom', customProvider);

      const providers = registry.getAll();
      expect(providers.map(p => p.id)).toContain('custom');
    });

    it('should allow overriding existing provider', () => {
      const newProvider = {
        id: 'anthropic',
        name: 'New Anthropic',
        complete: vi.fn(),
        validateConfig: vi.fn(),
      } as unknown as LLMProvider;

      registry.register('anthropic', newProvider);

      const provider = registry.get('anthropic');
      expect(provider?.name).toBe('New Anthropic');
    });
  });

  describe('get', () => {
    it('should return registered provider', () => {
      const provider = registry.get('anthropic');

      expect(provider).toBeDefined();
      expect(provider?.id).toBe('anthropic');
    });

    it('should return undefined for unknown provider', () => {
      const provider = registry.get('unknown');

      expect(provider).toBeUndefined();
    });
  });

  describe('complete', () => {
    it('should delegate to correct provider', async () => {
      const anthropicProvider = registry.get('anthropic');
      vi.mocked(anthropicProvider?.complete).mockResolvedValue({
        success: true,
        data: {
          id: 'msg-1',
          role: 'assistant' as const,
          content: 'Response',
          timestamp: Date.now(),
          tokens: 10,
          model: 'claude-3',
          parentId: null,
        },
      });

      const result = await registry.complete(
        'anthropic',
        [{ role: 'user' as const, content: 'Hi' }],
        { apiKey: 'key', model: 'claude-3' }
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Response');
    });

    it('should return error for unknown provider', async () => {
      const result = await registry.complete(
        'unknown',
        [{ role: 'user' as const, content: 'Hi' }],
        { apiKey: 'key', model: 'model' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('getAll', () => {
    it('should return all registered providers', () => {
      const providers = registry.getAll();

      expect(providers).toHaveLength(3);
      expect(providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'anthropic' }),
          expect.objectContaining({ id: 'glm' }),
          expect.objectContaining({ id: 'openai' }),
        ])
      );
    });
  });
});
```

### 5. Streaming Edge Cases

```typescript
describe('Streaming Edge Cases', () => {
  describe('SSE parsing', () => {
    it('should handle empty lines in stream', async () => {
      const streamChunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Hi"}}\n\n',
        '\n\n', // Empty line
        'data: {"type":"content_block_delta","delta":{"text":" there"}}\n\n',
        'data: [DONE]\n\n',
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const provider = new AnthropicProvider();
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hello' }],
        { apiKey: 'key', model: 'claude-3' },
        vi.fn()
      );

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Hi there');
    });

    it('should handle malformed SSE data', async () => {
      const streamChunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Valid"}}\n\n',
        'data: invalid json\n\n', // Invalid JSON
        'data: {"type":"content_block_delta","delta":{"text":" again"}}\n\n',
        'data: [DONE]\n\n',
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const provider = new AnthropicProvider();
      const chunks: StreamChunk[] = [];
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Hi' }],
        { apiKey: 'key', model: 'claude-3' },
        (c) => chunks.push(c)
      );

      // Should continue despite parse error
      expect(result.success).toBe(true);
    });

    it('should handle very large chunks', async () => {
      const largeContent = 'A'.repeat(100000); // 100KB
      const streamChunks = [
        `data: {"type":"content_block_delta","delta":{"text":"${largeContent}"}}\n\n`,
        'data: [DONE]\n\n',
      ];

      vi.mocked(fetch).mockResolvedValue(createMockStream(streamChunks) as Response);

      const provider = new AnthropicProvider();
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Generate large content' }],
        { apiKey: 'key', model: 'claude-3' },
        vi.fn()
      );

      expect(result.data?.content).toBe(largeContent);
    });
  });

  describe('Connection issues', () => {
    it('should handle stream interruption', async () => {
      let controller = new AbortController();

      const streamChunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Partial"}}\n\n',
      ];

      // Mock that aborts after first read
      const mockStream = {
        body: {
          getReader: () => {
            let readCount = 0;
            return {
              read: async () => {
                if (readCount++ === 0) {
                  controller.abort();
                  return {
                    done: false,
                    value: new TextEncoder().encode(streamChunks[0]),
                  };
                }
                throw new DOMException('Aborted', 'AbortError');
              },
            };
          },
        },
      };

      vi.mocked(fetch).mockResolvedValue(mockStream as Response);

      const provider = new AnthropicProvider();
      const chunks: StreamChunk[] = [];
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Test' }],
        { apiKey: 'key', model: 'claude-3' },
        (c) => chunks.push(c)
      );

      // Should have error chunk
      expect(chunks.some(c => c.type === 'error')).toBe(true);
    });

    it('should handle timeout', async () => {
      // Mock stream that never completes
      const mockStream = {
        body: {
          getReader: () => ({
            read: async () => {
              // Never resolve
              await new Promise(() => {});
              return { done: false };
            },
          }),
        },
      };

      vi.mocked(fetch).mockResolvedValue(mockStream as Response);
      vi.spyOn(AbortController.prototype, 'abort').mockImplementation(() => {});

      const provider = new AnthropicProvider();
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const result = Promise.race([
        provider.complete(
          [{ role: 'user' as const, content: 'Test' }],
          { apiKey: 'key', model: 'claude-3' },
          vi.fn()
        ),
        timeoutPromise.then(() => ({ success: false, error: 'Timeout' })),
      ]);

      // Should handle timeout (actual implementation might need timeout logic)
    });
  });
});
```

### 6. Configuration Tests

```typescript
describe('Configuration', () => {
  it('should handle all Anthropic models', async () => {
    const models = [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ];

    for (const model of models) {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'OK' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
      });

      const provider = new AnthropicProvider();
      const result = await provider.complete(
        [{ role: 'user' as const, content: 'Test' }],
        { apiKey: 'key', model }
      );

      expect(result.success).toBe(true);
    }
  });

  it('should handle temperature parameter', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: 'Response' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    });

    const provider = new AnthropicProvider();
    await provider.complete(
      [{ role: 'user' as const, content: 'Test' }],
      { apiKey: 'key', model: 'claude-3', temperature: 0.5 }
    );

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body);
    expect(body.temperature).toBe(0.5);
  });

  it('should handle maxTokens parameter', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: 'Response' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    });

    const provider = new AnthropicProvider();
    await provider.complete(
      [{ role: 'user' as const, content: 'Test' }],
      { apiKey: 'key', model: 'claude-3', maxTokens: 1000 }
    );

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body);
    expect(body.max_tokens).toBe(1000);
  });

  it('should use default values for optional parameters', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ text: 'OK' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }),
    });

    const provider = new AnthropicProvider();
    await provider.complete(
      [{ role: 'user' as const, content: 'Test' }],
      { apiKey: 'key', model: 'claude-3' }
    );

    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1].body);
    expect(body.max_tokens).toBe(4096); // Default
    expect(body.temperature).toBe(1.0); // Default
  });
});
```

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 85% |
| Branches | 80% |
| Functions | 85% |
| Lines | 85% |

---

## Notes

- **Global fetch mock**: AI providers use `fetch`, must mock globally.
- **SSE format**: Different providers use slightly different SSE formats.
- **Streaming complexity**: Streaming tests need careful async handling.
- **Provider registry**: Singleton pattern; reset between tests.
- **API keys**: Use test keys or mock responses to avoid real API calls.
- **OpenAI compatibility**: GLM and OpenAI use compatible APIs; tests may overlap.

---

## Related Documents

- [CODING_STANDARDS.md](../CODING_STANDARDS.md) - Testing standards
- [tests/mocks.ts](../../tests/mocks.ts) - Mock factories
