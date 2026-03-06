/**
 * Claude Code Agent Service
 *
 * Integrates @anthropic-ai/claude-code SDK with GLM-4.6 and browser environment
 * Provides agentic coding capabilities similar to Claude Code CLI
 *
 * Features:
 * - Streaming responses (token-by-token output)
 * - Bash command execution through WebContainer
 * - Rich progress callbacks
 * - Tool calling with proper error recovery
 */

import Anthropic from '@anthropic-ai/sdk';
import { fileSystem } from './filesystem';
import { gitService } from './git';
import { webContainer } from './webcontainer';
import { logger } from '@/utils/logger';

export interface ClaudeAgentConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface AgentExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  artifacts?: {
    filesCreated?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
    commandsExecuted?: string[];
  };
}

export interface StreamCallbacks {
  /** Called for each token of text content */
  onText?: (text: string) => void;
  /** Called when a tool is being used */
  onToolUse?: (toolName: string, toolInput: Record<string, unknown>) => void;
  /** Called when a tool completes */
  onToolResult?: (toolName: string, result: string) => void;
  /** Called for general progress updates */
  onProgress?: (message: string) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Called when asking user whether to continue after error */
  onContinueAfterError?: (error: string) => Promise<boolean>;
}

interface FileTreeNode {
  type: string;
  path: string;
  children?: FileTreeNode[];
}

/**
 * Claude Code Agent
 * Implements agentic coding workflow with tool calling and streaming
 */
export class ClaudeCodeAgent {
  private client: Anthropic;
  private config: ClaudeAgentConfig;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private workingDirectory: string = '/repo';
  private abortController: AbortController | null = null;

  constructor(config: ClaudeAgentConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.z.ai/api/anthropic',
      model: config.model || 'claude-sonnet-4-20250514',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 4096,
    };

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: this.config.baseUrl,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Abort any in-progress execution
   */
  abort(): void {
    this.abortController?.abort();
    this.abortController = new AbortController();
  }

  /**
   * Define tools available to the agent
   * These mirror the Claude Code SDK tools but adapted for browser
   */
  private getTools(): AgentTool[] {
    return [
      {
        name: 'read_file',
        description: 'Read the contents of a file from the workspace',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'The absolute path to the file to read',
            },
          },
          required: ['file_path'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file in the workspace',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'The absolute path to the file to write',
            },
            content: {
              type: 'string',
              description: 'The content to write to the file',
            },
          },
          required: ['file_path', 'content'],
        },
      },
      {
        name: 'edit_file',
        description: 'Edit a file by replacing a specific section',
        input_schema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'The absolute path to the file to edit',
            },
            old_text: {
              type: 'string',
              description: 'The text to replace',
            },
            new_text: {
              type: 'string',
              description: 'The replacement text',
            },
          },
          required: ['file_path', 'old_text', 'new_text'],
        },
      },
      {
        name: 'list_files',
        description: 'List files and directories in a path',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The directory path to list',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'search_code',
        description: 'Search for code patterns using grep-like functionality',
        input_schema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'The search pattern (regex)',
            },
            path: {
              type: 'string',
              description: 'Directory to search in',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'bash',
        description: 'Execute a bash command in the WebContainer. Use this for running build scripts, tests, git commands, etc. Commands are executed with safety constraints.',
        input_schema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The bash command to execute (e.g., "npm test", "ls -la", "git status")',
            },
          },
          required: ['command'],
        },
      },
      {
        name: 'git_status',
        description: 'Get the current git status',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'git_commit',
        description: 'Create a git commit',
        input_schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The commit message',
            },
          },
          required: ['message'],
        },
      },
    ];
  }

  /**
   * Execute a tool call from the agent
   */
  private async executeTool(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<string> {
    try {
      switch (toolName) {
        case 'read_file': {
          const result = await fileSystem.readFile((toolInput.file_path as string));
          if (!result.success) {
            return `Error reading file: ${result.error}`;
          }
          return result.data || '';
        }

        case 'write_file': {
          const result = await fileSystem.writeFile(
            toolInput.file_path as string,
            toolInput.content as string
          );
          if (!result.success) {
            return `Error writing file: ${result.error}`;
          }
          return `Successfully wrote ${(toolInput.content as string).length} bytes to ${toolInput.file_path}`;
        }

        case 'edit_file': {
          const filePath = toolInput.file_path as string;
          const oldText = toolInput.old_text as string;
          const newText = toolInput.new_text as string;

          // Read file first
          const readResult = await fileSystem.readFile(filePath);
          if (!readResult.success) {
            return `Error reading file: ${readResult.error}`;
          }

          // Replace text
          const content = readResult.data || '';
          const newContent = content.replace(oldText, newText);

          // Check if replacement actually happened
          if (content === newContent) {
            return `Warning: Exact text match not found, no changes made to ${filePath}`;
          }

          // Write back
          const writeResult = await fileSystem.writeFile(filePath, newContent);
          if (!writeResult.success) {
            return `Error writing file: ${writeResult.error}`;
          }

          return `Successfully edited ${filePath}`;
        }

        case 'list_files': {
          const tree = await fileSystem.buildFileTree(toolInput.path as string || '/repo');
          return JSON.stringify(tree, null, 2);
        }

        case 'search_code': {
          const files = await fileSystem.buildFileTree(
            toolInput.path as string || '/repo'
          );
          const results: string[] = [];

          const searchFiles = async (nodes: FileTreeNode[]) => {
            for (const node of nodes) {
              if (node.type === 'file') {
                const result = await fileSystem.readFile(node.path);
                if (result.success && result.data) {
                  const regex = new RegExp(toolInput.pattern as string, 'gi');
                  if (regex.test(result.data)) {
                    results.push(node.path);
                  }
                }
              }
              if (node.children) {
                await searchFiles(node.children);
              }
            }
          };

          await searchFiles(files);
          return results.length > 0
            ? `Found in ${results.length} files:\n${results.join('\n')}`
            : `No matches found for pattern: ${toolInput.pattern}`;
        }

        case 'bash': {
          const command = toolInput.command as string;

          // Parse command and args
          const parts = command.split(' ');
          const cmd = parts[0];
          const args = parts.slice(1);

          const result = await webContainer.spawn(cmd, args, {
            cwd: this.workingDirectory
          });

          if (!result.success || !result.process) {
            return `Error executing command: ${result.error}`;
          }

          // Collect all output
          const output = await this.collectProcessOutput(result.process);
          const exitCode = await result.exit!;

          if (exitCode !== 0) {
            return `Command exited with code ${exitCode}\nOutput:\n${output}`;
          }

          return output;
        }

        case 'git_status': {
          const status = await gitService.status(this.workingDirectory);
          return JSON.stringify(status, null, 2);
        }

        case 'git_commit': {
          const result = await gitService.commit(toolInput.message as string, {
            name: 'Browser IDE User',
            email: 'user@browser-ide.local',
          });
          if (!result.success) {
            return `Error creating commit: ${result.error}`;
          }
          return `Created commit: ${result.data}`;
        }

        default:
          return `Unknown tool: ${toolName}`;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `Error executing ${toolName}: ${message}`;
    }
  }

  /**
   * Collect all output from a WebContainer process
   */
  private async collectProcessOutput(process: { output: ReadableStream<string> }): Promise<string> {
    const output: string[] = [];
    const reader = process.output.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    return output.join('');
  }

  /**
   * Execute an agentic coding task with streaming support
   * This is the main entry point for Claude Code-style interactions
   */
  async executeTask(
    userMessage: string,
    callbacks?: StreamCallbacks
  ): Promise<AgentExecutionResult> {
    // Reset abort controller for new task
    this.abortController = new AbortController();

    try {
      // Add user message to conversation
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      const artifacts: AgentExecutionResult['artifacts'] = {
        filesCreated: [],
        filesModified: [],
        filesDeleted: [],
        commandsExecuted: [],
      };

      let iterations = 0;
      const maxIterations = 25; // Higher limit for complex tasks
      let fullOutput = '';

      while (iterations < maxIterations) {
        iterations++;

        // Check for abort
        if (this.abortController.signal.aborted) {
          return {
            success: false,
            error: 'Execution aborted by user',
            artifacts,
          };
        }

        // Call Claude with tools and streaming
        const response = await this.client.messages.create({
          model: this.config.model!,
          max_tokens: this.config.maxTokens!,
          temperature: this.config.temperature,
          system: `You are an expert coding assistant running inside a browser-based IDE. You have access to tools for reading, writing, editing, and searching files in the workspace, running bash commands via WebContainers, and performing git operations. Use these tools to accomplish the user's coding tasks. Be concise and efficient. When modifying code, prefer edit_file over write_file for targeted changes. Always explain what you're doing before using tools.`,
          messages: this.conversationHistory,
          tools: this.getTools() as Anthropic.Messages.Tool[],
          stream: true,
        }, {
          signal: this.abortController.signal,
        }) as unknown as AsyncIterable<Anthropic.Messages.MessageStreamEvent>;

        // Process the stream
        let currentToolUse: { id: string; name: string; inputJson: string } | null = null;
        let currentTextDelta = '';
        let responseContent: Anthropic.MessageParam['content'] = [];

        for await (const event of response) {
          const streamEvent = event as Anthropic.Messages.MessageStreamEvent;

          if (streamEvent.type === 'message_start') {
            continue;
          }

          if (streamEvent.type === 'content_block_start') {
            const block = streamEvent.content_block;
            if (block.type === 'text') {
              currentTextDelta = '';
            } else if (block.type === 'tool_use') {
              currentToolUse = {
                id: block.id,
                name: block.name,
                inputJson: '',
              };
            }
            continue;
          }

          if (streamEvent.type === 'content_block_delta') {
            const delta = streamEvent.delta;
            if (delta.type === 'text_delta') {
              const text = delta.text;
              currentTextDelta += text;
              fullOutput += text;
              callbacks?.onText?.(text);
            } else if (delta.type === 'input_json_delta') {
              // Accumulate raw JSON string — parse at content_block_stop
              if (currentToolUse) {
                currentToolUse.inputJson += delta.partial_json;
              }
            }
            continue;
          }

          if (streamEvent.type === 'content_block_stop') {
            if (currentTextDelta !== '') {
              responseContent.push({
                type: 'text',
                text: currentTextDelta,
              });
              currentTextDelta = '';
            } else if (currentToolUse) {
              // Parse accumulated JSON now that we have the full string
              let parsedInput: Record<string, unknown> = {};
              try {
                parsedInput = JSON.parse(currentToolUse.inputJson || '{}');
              } catch (e) {
                logger.error('Failed to parse tool input JSON:', e);
              }
              responseContent.push({
                type: 'tool_use',
                id: currentToolUse.id,
                name: currentToolUse.name,
                input: parsedInput,
              });
              currentToolUse = null;
            }
            continue;
          }

          if (streamEvent.type === 'message_stop') {
            break;
          }
        }

        // Check if we have tool use blocks to execute
        const toolUseBlocks = responseContent.filter(
          (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
        );

        if (toolUseBlocks.length > 0) {
          // Execute tools and continue
          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const block of toolUseBlocks) {
            callbacks?.onToolUse?.(block.name, block.input as Record<string, unknown>);

            let result = await this.executeTool(block.name, block.input as Record<string, string>);

            // Check if tool execution failed
            const toolFailed = result.startsWith('Error') || result.includes('failed');
            if (toolFailed && callbacks?.onContinueAfterError) {
              const shouldContinue = await callbacks.onContinueAfterError(
                `${block.name} failed: ${result.slice(0, 200)}${result.length > 200 ? '...' : ''}`
              );

              if (!shouldContinue) {
                // User chose to abort
                return {
                  success: false,
                  error: `Execution aborted by user after ${block.name} error`,
                  artifacts,
                };
              }

              // Add a message to conversation about continuing
              result = `${result}\n\n[Continuing despite error...]`;
            }

            callbacks?.onToolResult?.(block.name, result);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: result,
            });

            // Track artifacts
            if (block.name === 'write_file') {
              artifacts.filesCreated?.push((block.input as { file_path: string }).file_path);
            } else if (block.name === 'edit_file') {
              artifacts.filesModified?.push((block.input as { file_path: string }).file_path);
            } else if (block.name === 'bash') {
              artifacts.commandsExecuted?.push((block.input as { command: string }).command);
            }
          }

          // Add assistant response and tool results to conversation
          this.conversationHistory.push({
            role: 'assistant',
            content: responseContent,
          });

          this.conversationHistory.push({
            role: 'user',
            content: toolResults,
          });

          // Clear for next iteration
          responseContent = [];
        } else {
          // Only text response, we're done
          break;
        }
      }

      if (iterations >= maxIterations) {
        callbacks?.onError?.('Maximum iterations reached');
        return {
          success: false,
          error: 'Maximum iterations reached - task may be incomplete',
          artifacts,
        };
      }

      return {
        success: true,
        output: fullOutput || 'Task completed',
        artifacts,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      // Check for abort
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Execution aborted by user',
          artifacts: this.getCurrentArtifacts(),
        };
      }

      logger.error('Agent execution error:', error);
      callbacks?.onError?.(message);

      return {
        success: false,
        error: message,
        artifacts: this.getCurrentArtifacts(),
      };
    }
  }

  /**
   * Get current artifacts from conversation history
   */
  private getCurrentArtifacts(): AgentExecutionResult['artifacts'] {
    // Parse conversation history to extract artifacts
    const artifacts: AgentExecutionResult['artifacts'] = {
      filesCreated: [],
      filesModified: [],
      filesDeleted: [],
      commandsExecuted: [],
    };

    for (const msg of this.conversationHistory) {
      if (msg.role === 'assistant') {
        for (const content of msg.content) {
          if (typeof content === 'object' && content !== null && 'type' in content) {
            const block = content as Anthropic.Messages.ToolUseBlock;
            if (block.type === 'tool_use') {
              if (block.name === 'write_file') {
                artifacts.filesCreated?.push((block.input as { file_path: string }).file_path);
              } else if (block.name === 'edit_file') {
                artifacts.filesModified?.push((block.input as { file_path: string }).file_path);
              } else if (block.name === 'bash') {
                artifacts.commandsExecuted?.push((block.input as { command: string }).command);
              }
            }
          }
        }
      }
    }

    return artifacts;
  }

  /**
   * Execute task with streaming - alias for compatibility
   */
  async executeTaskStreaming(
    userMessage: string,
    callbacks?: StreamCallbacks
  ): Promise<AgentExecutionResult> {
    return this.executeTask(userMessage, callbacks);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get current conversation history
   */
  getHistory(): Anthropic.MessageParam[] {
    return [...this.conversationHistory];
  }

  /**
   * Set working directory
   */
  setWorkingDirectory(dir: string) {
    this.workingDirectory = dir;
  }
}

/**
 * Create a Claude Code agent instance configured for GLM-4.6
 */
export function createGLMAgent(apiKey: string, baseUrl?: string): ClaudeCodeAgent {
  return new ClaudeCodeAgent({
    apiKey,
    baseUrl: baseUrl || 'https://api.z.ai/api/anthropic',
    model: 'claude-sonnet-4-20250514',
  });
}

/**
 * Create a Claude Code agent instance configured for Anthropic
 */
export function createAnthropicAgent(apiKey: string, baseUrl?: string): ClaudeCodeAgent {
  return new ClaudeCodeAgent({
    apiKey,
    baseUrl: baseUrl || 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
  });
}
