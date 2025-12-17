/**
 * Claude Code Panel
 *
 * Command-based AI coding interface (like official Claude Code CLI)
 * Direct file manipulation without chat - real-time codebase updates
 */

import { ClaudeCLI } from '@/components/claude-cli';
import { useIDEStore } from '@/store/useIDEStore';
import { Info } from 'lucide-react';

export function ClaudeCodePanel() {
  const { settings } = useIDEStore();

  // Get API key from settings
  const provider = settings?.ai?.defaultProvider === 'glm' ? 'glm' : 'anthropic';
  const apiKey = provider === 'glm'
    ? settings?.ai?.glmKey
    : settings?.ai?.anthropicKey;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold">Claude Code CLI</h3>
            <span className="text-xs text-gray-400">Command-based AI coding</span>
          </div>
          {!apiKey && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <Info className="w-4 h-4" />
              <span>Configure API key in settings</span>
            </div>
          )}
        </div>
      </div>

      {/* CLI Terminal */}
      <div className="flex-1 overflow-hidden">
        <ClaudeCLI
          className="h-full"
          options={{
            provider,
            apiKey,
          }}
        />
      </div>

      {/* Quick Help */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400">
        <div className="flex gap-4">
          <span>
            <span className="text-green-400">exec "task"</span> - AI-powered task execution
          </span>
          <span>
            <span className="text-green-400">help</span> - Show all commands
          </span>
          <span>
            <span className="text-green-400">/clear</span> - Clear terminal
          </span>
        </div>
      </div>
    </div>
  );
}
