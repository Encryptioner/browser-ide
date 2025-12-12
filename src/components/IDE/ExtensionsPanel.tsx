/**
 * Extensions Panel
 *
 * VS Code extensions marketplace and management UI
 */

import { useState, useEffect } from 'react';
import { extensionManager, VSCodeExtension, POPULAR_EXTENSIONS } from '@/services/vscode-extensions';

export function ExtensionsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [extensions, setExtensions] = useState<VSCodeExtension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<VSCodeExtension[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('marketplace');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = [
    'Programming Languages',
    'Formatters',
    'Linters',
    'Themes',
    'Snippets',
    'Debuggers',
    'Testing',
    'SCM Providers',
  ];

  // Load installed extensions on mount
  useEffect(() => {
    async function loadInstalled() {
      await extensionManager.loadInstalledExtensions();
      setInstalledExtensions(extensionManager.getInstalledExtensions());
    }
    loadInstalled();
  }, []);

  // Load popular extensions by default
  useEffect(() => {
    if (activeTab === 'marketplace' && extensions.length === 0) {
      loadPopularExtensions();
    }
  }, [activeTab]);

  const loadPopularExtensions = async () => {
    setLoading(true);
    try {
      const popular = await extensionManager.getPopularExtensions(20);
      setExtensions(popular);
    } catch (error) {
      console.error('Failed to load popular extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !selectedCategory) {
      loadPopularExtensions();
      return;
    }

    setLoading(true);
    try {
      const results = await extensionManager.searchExtensions({
        query: searchQuery,
        category: selectedCategory,
        limit: 50,
      });
      setExtensions(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (extensionId: string) => {
    const success = await extensionManager.installExtension(extensionId);
    if (success) {
      // Update installed list
      setInstalledExtensions(extensionManager.getInstalledExtensions());
      // Update marketplace list
      setExtensions((prev) =>
        prev.map((ext) =>
          ext.id === extensionId ? { ...ext, installed: true } : ext
        )
      );
    }
  };

  const handleUninstall = async (extensionId: string) => {
    const success = await extensionManager.uninstallExtension(extensionId);
    if (success) {
      setInstalledExtensions(extensionManager.getInstalledExtensions());
      setExtensions((prev) =>
        prev.map((ext) =>
          ext.id === extensionId ? { ...ext, installed: false } : ext
        )
      );
    }
  };

  const renderExtensionCard = (extension: VSCodeExtension, showUninstall: boolean = false) => (
    <div
      key={extension.id}
      className="extension-card p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-colors"
    >
      <div className="flex gap-3">
        {extension.icon && (
          <img
            src={extension.icon}
            alt={extension.name}
            className="w-12 h-12 rounded"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-100 truncate">
            {extension.name}
          </h3>
          <p className="text-xs text-gray-400 truncate">
            {extension.publisher}
          </p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {extension.description}
          </p>
          {extension.categories.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {extension.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          {showUninstall ? (
            <button
              onClick={() => handleUninstall(extension.id)}
              className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Uninstall
            </button>
          ) : extension.installed ? (
            <button
              disabled
              className="px-3 py-1.5 text-xs bg-gray-700 text-gray-400 rounded cursor-not-allowed"
            >
              Installed
            </button>
          ) : (
            <button
              onClick={() => handleInstall(extension.id)}
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="extensions-panel flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="panel-header px-4 py-3 bg-gray-800 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-100">🧩 Extensions</h2>
        <p className="text-xs text-gray-400 mt-1">
          Browse and install VS Code extensions from Open-VSX
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs flex bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'marketplace'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'installed'
              ? 'text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Installed ({installedExtensions.length})
        </button>
      </div>

      {/* Search (Marketplace only) */}
      {activeTab === 'marketplace' && (
        <div className="search-section p-4 bg-gray-800 border-b border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extensions..."
              className="flex-1 px-3 py-2 text-sm bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Search
            </button>
          </form>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              // Trigger search with new category
              handleSearch(new Event('submit') as any);
            }}
            className="w-full px-3 py-2 text-sm bg-gray-700 text-gray-100 border border-gray-600 rounded"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Extensions List */}
      <div className="extensions-list flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p className="text-gray-400">Loading extensions...</p>
            </div>
          </div>
        ) : activeTab === 'marketplace' ? (
          <div className="space-y-3">
            {extensions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-gray-400">No extensions found</p>
                <button
                  onClick={loadPopularExtensions}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Show Popular Extensions
                </button>
              </div>
            ) : (
              extensions.map((ext) => renderExtensionCard(ext, false))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-gray-400">No extensions installed</p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="mt-4 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              installedExtensions.map((ext) => renderExtensionCard(ext, true))
            )}
          </div>
        )}
      </div>

      {/* Quick Install (Popular Extensions) */}
      {activeTab === 'marketplace' && !loading && extensions.length === 0 && (
        <div className="popular-extensions p-4 bg-gray-800 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-100 mb-3">
            🌟 Popular Extensions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {POPULAR_EXTENSIONS.slice(0, 6).map((ext) => (
              <button
                key={ext.id}
                onClick={async () => {
                  await handleInstall(ext.id);
                }}
                className="px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-gray-100 rounded text-left"
              >
                {ext.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
