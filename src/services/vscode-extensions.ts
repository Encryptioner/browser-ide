/**
 * VS Code Extension Support
 *
 * Integrates Open-VSX registry for VS Code extensions in the browser
 * Provides extension discovery, installation, and management
 */

export interface VSCodeExtension {
  id: string;
  name: string;
  publisher: string;
  version: string;
  description: string;
  icon?: string;
  categories: string[];
  downloadUrl: string;
  installed: boolean;
}

export interface ExtensionSearchOptions {
  query?: string;
  category?: string;
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'name';
  limit?: number;
}

/**
 * VS Code Extension Manager
 * Manages extensions from Open-VSX registry
 */
export class VSCodeExtensionManager {
  private readonly OPEN_VSX_API = 'https://open-vsx.org/api';
  private installedExtensions: Map<string, VSCodeExtension> = new Map();

  /**
   * Search for extensions in Open-VSX registry
   */
  async searchExtensions(
    options: ExtensionSearchOptions = {}
  ): Promise<VSCodeExtension[]> {
    try {
      const {
        query = '',
        category,
        sortBy = 'downloads',
        limit = 20,
      } = options;

      // Build params only with values that exist
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      params.append('size', limit.toString());
      params.append('sortOrder', sortBy);
      if (category) params.append('category', category);

      const response = await fetch(
        `${this.OPEN_VSX_API}/-/search?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();

      return data.extensions?.map((ext: any) => ({
        id: `${ext.namespace}.${ext.name}`,
        name: ext.displayName || ext.name,
        publisher: ext.namespace,
        version: ext.version,
        description: ext.description || '',
        icon: ext.files?.icon,
        categories: ext.categories || [],
        downloadUrl: ext.files?.download || '',
        installed: this.installedExtensions.has(`${ext.namespace}.${ext.name}`),
      })) || [];
    } catch (error) {
      console.error('Extension search error:', error);
      return [];
    }
  }

  /**
   * Get extension details by ID
   */
  async getExtension(extensionId: string): Promise<VSCodeExtension | null> {
    try {
      const [namespace, name] = extensionId.split('.');
      const response = await fetch(
        `${this.OPEN_VSX_API}/${namespace}/${name}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch extension: ${response.statusText}`);
      }

      const ext = await response.json();

      return {
        id: extensionId,
        name: ext.displayName || ext.name,
        publisher: ext.namespace,
        version: ext.version,
        description: ext.description || '',
        icon: ext.files?.icon,
        categories: ext.categories || [],
        downloadUrl: ext.files?.download || '',
        installed: this.installedExtensions.has(extensionId),
      };
    } catch (error) {
      console.error('Failed to get extension:', error);
      return null;
    }
  }

  /**
   * Install an extension
   * Note: In a browser environment, this simulates installation
   * Full extension execution would require Monaco Editor extension API
   */
  async installExtension(extensionId: string): Promise<boolean> {
    try {
      const extension = await this.getExtension(extensionId);
      if (!extension) {
        throw new Error('Extension not found');
      }

      // Download extension package (VSIX file)
      const response = await fetch(extension.downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download extension');
      }

      const blob = await response.blob();

      // Store extension metadata
      this.installedExtensions.set(extensionId, extension);

      // Persist to IndexedDB for offline access
      await this.saveToIndexedDB(extensionId, blob);

      console.log(`✅ Installed extension: ${extension.name}`);
      return true;
    } catch (error) {
      console.error('Extension installation error:', error);
      return false;
    }
  }

  /**
   * Uninstall an extension
   */
  async uninstallExtension(extensionId: string): Promise<boolean> {
    try {
      this.installedExtensions.delete(extensionId);
      await this.removeFromIndexedDB(extensionId);
      console.log(`✅ Uninstalled extension: ${extensionId}`);
      return true;
    } catch (error) {
      console.error('Extension uninstallation error:', error);
      return false;
    }
  }

  /**
   * Get list of installed extensions
   */
  getInstalledExtensions(): VSCodeExtension[] {
    return Array.from(this.installedExtensions.values());
  }

  /**
   * Get popular extensions
   */
  async getPopularExtensions(limit: number = 10): Promise<VSCodeExtension[]> {
    return this.searchExtensions({
      sortBy: 'downloads',
      limit,
    });
  }

  /**
   * Get recommended extensions for web development
   */
  async getRecommendedExtensions(): Promise<VSCodeExtension[]> {
    const categories = [
      'Programming Languages',
      'Formatters',
      'Linters',
      'Snippets',
    ];

    const extensions: VSCodeExtension[] = [];

    for (const category of categories) {
      const results = await this.searchExtensions({
        category,
        limit: 5,
      });
      extensions.push(...results);
    }

    // Remove duplicates
    const uniqueExtensions = Array.from(
      new Map(extensions.map((ext) => [ext.id, ext])).values()
    );

    return uniqueExtensions.slice(0, 20);
  }

  /**
   * Save extension to IndexedDB
   */
  private async saveToIndexedDB(
    extensionId: string,
    blob: Blob
  ): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('extensions', 'readwrite');
    const store = tx.objectStore('extensions');

    await store.put({
      id: extensionId,
      blob,
      installedAt: Date.now(),
    });

    await tx.done;
  }

  /**
   * Remove extension from IndexedDB
   */
  private async removeFromIndexedDB(extensionId: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction('extensions', 'readwrite');
    const store = tx.objectStore('extensions');

    await store.delete(extensionId);
    await tx.done;
  }

  /**
   * Open IndexedDB for extension storage
   */
  private async openDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VSCodeExtensions', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('extensions')) {
          db.createObjectStore('extensions', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Load installed extensions from IndexedDB on initialization
   */
  async loadInstalledExtensions(): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('extensions', 'readonly');
      const store = tx.objectStore('extensions');

      // Use getAllKeys instead of getAll to avoid iteration issues
      const keys = await store.getAllKeys();

      if (!keys || !Array.isArray(keys)) {
        console.log('No installed extensions found');
        return;
      }

      for (const key of keys) {
        const ext = await store.get(key);
        if (ext && ext.id) {
          const metadata = await this.getExtension(ext.id);
          if (metadata) {
            this.installedExtensions.set(ext.id, metadata);
          }
        }
      }

      console.log(
        `✅ Loaded ${this.installedExtensions.size} installed extensions`
      );
    } catch (error) {
      console.error('Failed to load installed extensions:', error);
      // Don't throw - just log and continue
    }
  }
}

// Singleton instance
export const extensionManager = new VSCodeExtensionManager();

/**
 * Popular extensions curated list for quick access
 */
export const POPULAR_EXTENSIONS = [
  {
    id: 'esbenp.prettier-vscode',
    name: 'Prettier - Code formatter',
    category: 'Formatters',
  },
  {
    id: 'dbaeumer.vscode-eslint',
    name: 'ESLint',
    category: 'Linters',
  },
  {
    id: 'ms-python.python',
    name: 'Python',
    category: 'Programming Languages',
  },
  {
    id: 'golang.go',
    name: 'Go',
    category: 'Programming Languages',
  },
  {
    id: 'rust-lang.rust-analyzer',
    name: 'rust-analyzer',
    category: 'Programming Languages',
  },
  {
    id: 'vscodevim.vim',
    name: 'Vim',
    category: 'Keymaps',
  },
  {
    id: 'eamodio.gitlens',
    name: 'GitLens',
    category: 'SCM Providers',
  },
  {
    id: 'bradlc.vscode-tailwindcss',
    name: 'Tailwind CSS IntelliSense',
    category: 'Formatters',
  },
];
