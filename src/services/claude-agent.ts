/**
 * Claude Code Agent Service
 *
 * Integrates @anthropic-ai/claude-code SDK with GLM-4.6 and browser environment
 * Provides agentic coding capabilities similar to Claude Code CLI
 */

import Anthropic from '@anthropic-ai/sdk';
import { fileSystem } from './filesystem';
import { gitService } from './git';

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
  input_schema: Record<string, any>;
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

/**
 * Claude Code Agent
 * Implements agentic coding workflow with tool calling
 */
export class ClaudeCodeAgent {
  private client: Anthropic;
  private config: ClaudeAgentConfig;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private workingDirectory: string = '/repo';

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
    toolInput: Record<string, any>
  ): Promise<string> {
    try {
      switch (toolName) {
        case 'read_file': {
          const result = await fileSystem.readFile(toolInput.file_path);
          if (!result.success) {
            return `Error reading file: ${result.error}`;
          }
          return result.data || '';
        }

        case 'write_file': {
          const result = await fileSystem.writeFile(
            toolInput.file_path,
            toolInput.content
          );
          if (!result.success) {
            return `Error writing file: ${result.error}`;
          }
          return `Successfully wrote ${toolInput.content.length} bytes to ${toolInput.file_path}`;
        }

        case 'edit_file': {
          // Read file first
          const readResult = await fileSystem.readFile(toolInput.file_path);
          if (!readResult.success) {
            return `Error reading file: ${readResult.error}`;
          }

          // Replace text
          const content = readResult.data || '';
          const newContent = content.replace(
            toolInput.old_text,
            toolInput.new_text
          );

          // Write back
          const writeResult = await fileSystem.writeFile(
            toolInput.file_path,
            newContent
          );
          if (!writeResult.success) {
            return `Error writing file: ${writeResult.error}`;
          }

          return `Successfully edited ${toolInput.file_path}`;
        }

        case 'list_files': {
          const tree = await fileSystem.buildFileTree(toolInput.path || '/repo');
          return JSON.stringify(tree, null, 2);
        }

        case 'search_code': {
          // Simplified search - in production would use proper grep
          const files = await fileSystem.buildFileTree(
            toolInput.path || '/repo'
          );
          const results: string[] = [];

          const searchFiles = async (nodes: any[]) => {
            for (const node of nodes) {
              if (node.type === 'file') {
                const result = await fileSystem.readFile(node.path);
                if (result.success && result.data) {
                  const regex = new RegExp(toolInput.pattern, 'gi');
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
          return `Found in ${results.length} files:\n${results.join('\n')}`;
        }

        case 'git_status': {
          const status = await gitService.status(this.workingDirectory);
          return JSON.stringify(status, null, 2);
        }

        case 'git_commit': {
          const result = await gitService.commit(toolInput.message, {
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
    } catch (error: any) {
      return `Error executing ${toolName}: ${error.message}`;
    }
  }

  /**
   * Execute an agentic coding task
   * This is the main entry point for Claude Code-style interactions
   */
  async executeTask(
    userMessage: string,
    onProgress?: (message: string) => void
  ): Promise<AgentExecutionResult> {
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

      let continueLoop = true;
      let iterations = 0;
      const maxIterations = 10; // Prevent infinite loops

      while (continueLoop && iterations < maxIterations) {
        iterations++;

        // Call Claude with tools
        const response = await this.client.messages.create({
          model: this.config.model!,
          max_tokens: this.config.maxTokens!,
          temperature: this.config.temperature,
          messages: this.conversationHistory,
          tools: this.getTools() as any,
        });

        // Check stop reason
        if (response.stop_reason === 'end_turn') {
          // Agent is done
          const textContent = response.content.find((c) => c.type === 'text');
          if (textContent && 'text' in textContent) {
            return {
              success: true,
              output: textContent.text,
              artifacts,
            };
          }
          continueLoop = false;
        } else if (response.stop_reason === 'tool_use') {
          // Agent wants to use tools
          const toolResults: any[] = [];

          for (const content of response.content) {
            if (content.type === 'tool_use') {
              const toolInput = content.input as Record<string, any>;

              onProgress?.(
                `🔧 Using tool: ${content.name} with input: ${JSON.stringify(toolInput)}`
              );

              const result = await this.executeTool(content.name, toolInput);

              toolResults.push({
                type: 'tool_result',
                tool_use_id: content.id,
                content: result,
              });

              // Track artifacts
              if (content.name === 'write_file' && toolInput.file_path) {
                artifacts.filesCreated?.push(toolInput.file_path);
              } else if (content.name === 'edit_file' && toolInput.file_path) {
                artifacts.filesModified?.push(toolInput.file_path);
              }

              onProgress?.(`✅ Tool result: ${result.slice(0, 100)}...`);
            }
          }

          // Add assistant response and tool results to conversation
          this.conversationHistory.push({
            role: 'assistant',
            content: response.content,
          });

          this.conversationHistory.push({
            role: 'user',
            content: toolResults,
          });
        } else {
          // Unknown stop reason
          continueLoop = false;
        }
      }

      if (iterations >= maxIterations) {
        return {
          success: false,
          error: 'Maximum iterations reached',
          artifacts,
        };
      }

      return {
        success: true,
        output: 'Task completed',
        artifacts,
      };
    } catch (error: any) {
      console.error('Agent execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
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
export function createGLMAgent(apiKey: string): ClaudeCodeAgent {
  return new ClaudeCodeAgent({
    apiKey,
    baseUrl: 'https://api.z.ai/api/anthropic',
    model: 'claude-sonnet-4-20250514', // Maps to GLM-4.6
  });
}

/**
 * Create a Claude Code agent instance configured for Anthropic
 */
export function createAnthropicAgent(apiKey: string): ClaudeCodeAgent {
  return new ClaudeCodeAgent({
    apiKey,
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-sonnet-4-20250514',
  });
}
