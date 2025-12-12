import type {
  AIProvider,
  AIProviderConfig,
  AIMessage,
  StreamChunk,
  APIResponse,
} from '@/types';

// ========== Base Provider Interface ==========
export interface LLMProvider {
  id: string;
  name: string;
  complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>>;
  validateConfig(config: AIProviderConfig): Promise<boolean>;
}

// ========== Anthropic Claude Provider ==========
export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';

  async complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens || 4096,
          temperature: config.temperature || 1.0,
          messages: messages.map(m => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.content,
          })),
          stream: !!onChunk,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      if (onChunk) {
        return this.handleStream(response, config, onChunk);
      } else {
        return this.handleNonStream(response, config);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleStream(
    response: Response,
    config: AIProviderConfig,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text || '';
                fullContent += text;
                onChunk({ type: 'content', content: text });
              } else if (parsed.type === 'message_delta') {
                if (parsed.usage) {
                  outputTokens = parsed.usage.output_tokens || 0;
                }
              } else if (parsed.type === 'message_start') {
                if (parsed.message?.usage) {
                  inputTokens = parsed.message.usage.input_tokens || 0;
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      onChunk({ 
        type: 'done', 
        usage: { inputTokens, outputTokens } 
      });

      return {
        success: true,
        data: {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
          tokens: inputTokens + outputTokens,
          model: config.model,
          parentId: null,
        },
      };
    } catch (error) {
      onChunk({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Stream error' 
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stream error',
      };
    }
  }

  private async handleNonStream(
    response: Response,
    config: AIProviderConfig
  ): Promise<APIResponse<AIMessage>> {
    const data = await response.json();
    const content = data.content[0]?.text || '';
    const usage = data.usage || {};

    return {
      success: true,
      data: {
        id: data.id || `msg_${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
        model: config.model,
        parentId: null,
      },
    };
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ========== Z.ai GLM Provider ==========
export class GLMProvider implements LLMProvider {
  id = 'glm';
  name = 'Z.ai GLM';

  async complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    try {
      const baseUrl = config.baseUrl || 'https://api.z.ai/api/paas/v4';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens || 4096,
          temperature: config.temperature || 1.0,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: !!onChunk,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      if (onChunk) {
        return this.handleStream(response, config, onChunk);
      } else {
        return this.handleNonStream(response, config);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleStream(
    response: Response,
    config: AIProviderConfig,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                onChunk({ type: 'content', content });
              }

              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens || 0;
                outputTokens = parsed.usage.completion_tokens || 0;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      onChunk({ 
        type: 'done', 
        usage: { inputTokens, outputTokens } 
      });

      return {
        success: true,
        data: {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
          tokens: inputTokens + outputTokens,
          model: config.model,
          parentId: null,
        },
      };
    } catch (error) {
      onChunk({ 
        type: 'error', 
        error: error instanceof Error ? error.message : 'Stream error' 
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stream error',
      };
    }
  }

  private async handleNonStream(
    response: Response,
    config: AIProviderConfig
  ): Promise<APIResponse<AIMessage>> {
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    const usage = data.usage || {};

    return {
      success: true,
      data: {
        id: data.id || `msg_${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        tokens: (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
        model: config.model,
        parentId: null,
      },
    };
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      const baseUrl = config.baseUrl || 'https://api.z.ai/api/paas/v4';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ========== OpenAI Provider ==========
export class OpenAIProvider implements LLMProvider {
  id = 'openai';
  name = 'OpenAI';

  async complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    // Similar implementation to GLM (OpenAI-compatible API)
    try {
      const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens || 4096,
          temperature: config.temperature || 1.0,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: !!onChunk,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      if (onChunk) {
        return this.handleStreamLikeGLM(response, config, onChunk);
      } else {
        return this.handleNonStreamLikeGLM(response, config);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async handleStreamLikeGLM(
    response: Response,
    config: AIProviderConfig,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    // Same as GLM implementation
    const glmProvider = new GLMProvider();
    return glmProvider['handleStream'](response, config, onChunk);
  }

  private async handleNonStreamLikeGLM(
    response: Response,
    config: AIProviderConfig
  ): Promise<APIResponse<AIMessage>> {
    // Same as GLM implementation
    const glmProvider = new GLMProvider();
    return glmProvider['handleNonStream'](response, config);
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    try {
      const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ========== Provider Registry ==========
export class AIProviderRegistry {
  private providers: Map<AIProvider, LLMProvider> = new Map();

  constructor() {
    // Register built-in providers
    this.register('anthropic', new AnthropicProvider());
    this.register('glm', new GLMProvider());
    this.register('openai', new OpenAIProvider());
  }

  register(type: AIProvider, provider: LLMProvider): void {
    this.providers.set(type, provider);
  }

  get(type: AIProvider): LLMProvider | undefined {
    return this.providers.get(type);
  }

  getAll(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  async complete(
    providerType: AIProvider,
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    const provider = this.get(providerType);
    if (!provider) {
      return {
        success: false,
        error: `Provider ${providerType} not found`,
      };
    }

    return provider.complete(messages, config, onChunk);
  }
}

// Export singleton
export const aiRegistry = new AIProviderRegistry();
