import { useState } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { toast } from 'sonner';

interface AIAssistantProps {
  onClose: () => void;
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Granular selector - individual selector for single state value
  const settings = useIDEStore(state => state.settings);

  async function handleSend() {
    if (!message.trim()) return;

    const provider = settings.ai.defaultProvider;
    const apiKey =
      provider === 'anthropic'
        ? settings.ai.anthropicKey
        : provider === 'glm'
        ? settings.ai.glmKey
        : settings.ai.openaiKey;

    if (!apiKey) {
      toast.error(`Please set ${provider} API key in settings`);
      return;
    }

    setIsLoading(true);

    try {
      // Basic implementation - will be enhanced with actual AI service integration
      // For now, just show a placeholder
      setResponse(
        `AI Response would appear here using ${provider}.\n\nYour question: ${message}\n\nNote: Full AI integration is available in the production version.`
      );
    } catch (error) {
      setResponse('Error: ' + String(error));
    }

    setIsLoading(false);
  }

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-title"
    >
      <div
        className="modal large bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <h2 id="ai-assistant-title" className="text-xl font-bold text-gray-100 mb-4">🤖 AI Assistant</h2>

        <div className="ai-chat flex-1 flex flex-col gap-4 overflow-hidden" role="presentation">
          <div
            className="ai-response flex-1 overflow-y-auto p-4 bg-gray-900 rounded border border-gray-700 text-gray-300 whitespace-pre-wrap"
            role="region"
            aria-label="AI response area"
            aria-live="polite"
          >
            {response || 'Ask me anything about your code...'}
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your question..."
            rows={4}
            className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
            aria-label="AI message input"
            id="ai-message-input"
          />
        </div>

        <div className="modal-actions flex gap-2 justify-end mt-4" role="presentation">
          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium"
            aria-label="Send message to AI"
            aria-describedby="ai-send-hint"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded font-medium"
            aria-label="Close AI assistant"
          >
            Close
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Tip: Press Cmd/Ctrl + Enter to send
        </p>
      </div>
    </div>
  );
}
