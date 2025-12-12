import { useState } from 'react';
import { useIDEStore } from '@/store/useIDEStore';

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const { settings, updateSettings } = useIDEStore();
  const [localSettings, setLocalSettings] = useState(settings);

  function handleSave() {
    updateSettings(localSettings);
    alert('Settings saved!');
    onClose();
  }

  function updateAISetting(key: string, value: string) {
    setLocalSettings({
      ...localSettings,
      ai: {
        ...localSettings.ai,
        [key]: value,
      },
    });
  }

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="modal large bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Settings</h2>

        <div className="settings-grid space-y-4">
          {/* Git Settings */}
          <div className="settings-section">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Git Settings</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">GitHub Token:</span>
                <input
                  type="password"
                  value={localSettings.githubToken}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, githubToken: e.target.value })
                  }
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">GitHub Username:</span>
                <input
                  type="text"
                  value={localSettings.githubUsername}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, githubUsername: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">GitHub Email:</span>
                <input
                  type="email"
                  value={localSettings.githubEmail}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, githubEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
            </div>
          </div>

          {/* AI Settings */}
          <div className="settings-section">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">AI Settings</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">Anthropic API Key:</span>
                <input
                  type="password"
                  value={localSettings.ai.anthropicKey}
                  onChange={(e) => updateAISetting('anthropicKey', e.target.value)}
                  placeholder="sk-ant-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">GLM API Key:</span>
                <input
                  type="password"
                  value={localSettings.ai.glmKey}
                  onChange={(e) => updateAISetting('glmKey', e.target.value)}
                  placeholder="glm-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">OpenAI API Key:</span>
                <input
                  type="password"
                  value={localSettings.ai.openaiKey}
                  onChange={(e) => updateAISetting('openaiKey', e.target.value)}
                  placeholder="sk-xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">Default Provider:</span>
                <select
                  value={localSettings.ai.defaultProvider}
                  onChange={(e) =>
                    updateAISetting(
                      'defaultProvider',
                      e.target.value as 'anthropic' | 'glm' | 'openai'
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="glm">Z.ai GLM</option>
                  <option value="openai">OpenAI</option>
                </select>
              </label>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="settings-section">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Editor Settings</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">Font Size:</span>
                <input
                  type="number"
                  value={localSettings.fontSize}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      fontSize: parseInt(e.target.value),
                    })
                  }
                  min="10"
                  max="24"
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 block mb-1">Tab Size:</span>
                <input
                  type="number"
                  value={localSettings.tabSize}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, tabSize: parseInt(e.target.value) })
                  }
                  min="2"
                  max="8"
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.minimap}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, minimap: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">Enable Minimap</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, autoSave: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-300">Auto Save</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions flex gap-2 justify-end mt-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
