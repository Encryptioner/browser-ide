import LightningFS from '@isomorphic-git/lightning-fs';
import type { FileNode } from '@/types';

export interface FileStats {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: number;
}

export interface FileSystemResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class FileSystemService {
  private fs: LightningFS;
  private pfs: LightningFS['promises'];
  private initialized: boolean;
  private initPromise: Promise<void>;
  private currentWorkingDirectory: string;

  constructor() {
    this.fs = new LightningFS('browser-ide-fs-v2');
    this.pfs = this.fs.promises;
    this.initialized = false;
    this.currentWorkingDirectory = '/';
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Ensure root structure exists
      await this.ensureDir('/');
      console.log('✅ FileSystem initialized with root directory support');
      this.initialized = true;
    } catch (error) {
      console.error('❌ Error initializing filesystem:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }

  // Directory navigation
  getCurrentWorkingDirectory(): string {
    return this.currentWorkingDirectory;
  }

  async changeDirectory(path: string): Promise<FileSystemResult<string>> {
    await this.ensureInitialized();

    try {
      // Resolve path (handle ., .., absolute paths)
      const resolvedPath = this.resolvePath(path);

      // Check if directory exists
      const stats = await this.pfs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return {
          success: false,
          error: `Not a directory: ${resolvedPath}`
        };
      }

      this.currentWorkingDirectory = resolvedPath;
      console.log(`📁 Changed directory to: ${resolvedPath}`);

      return {
        success: true,
        data: resolvedPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change directory'
      };
    }
  }

  private resolvePath(path: string): string {
    if (path.startsWith('/')) {
      // Absolute path
      return this.normalizePath(path);
    }

    // Relative path - resolve against current directory
    const currentPath = this.currentWorkingDirectory === '/' ? '' : this.currentWorkingDirectory;
    const combinedPath = `${currentPath}/${path}`;
    return this.normalizePath(combinedPath);
  }

  private normalizePath(path: string): string {
    // Remove duplicate slashes, resolve . and ..
    const parts = path.split('/').filter(part => part !== '' && part !== '.');
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '..') {
        if (resolved.length > 0) {
          resolved.pop();
        }
      } else {
        resolved.push(part);
      }
    }

    const normalized = resolved.join('/');
    return normalized.startsWith('/') ? normalized : '/' + normalized;
  }

  // Get files in current directory
  async listCurrentDirectory(): Promise<FileSystemResult<FileNode[]>> {
    await this.ensureInitialized();

    try {
      const files = await this.pfs.readdir(this.currentWorkingDirectory);
      const fileNodes: FileNode[] = [];

      for (const fileName of files) {
        const fullPath = this.currentWorkingDirectory === '/'
          ? `/${fileName}`
          : `${this.currentWorkingDirectory}/${fileName}`;

        try {
          const stats = await this.pfs.stat(fullPath);
          fileNodes.push({
            name: fileName,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.isFile() ? stats.size : 0,
            modified: stats.mtimeMs || Date.now()
          });
        } catch (error) {
          console.warn(`⚠️ Could not stat file: ${fullPath}`, error);
          fileNodes.push({
            name: fileName,
            path: fullPath,
            type: 'file',
            size: 0,
            modified: Date.now()
          });
        }
      }

      // Sort: directories first, then files, both alphabetically
      fileNodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return {
        success: true,
        data: fileNodes
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory'
      };
    }
  }

  // Read file content
  async readFile(path: string): Promise<FileSystemResult<string>> {
    await this.ensureInitialized();

    try {
      const fullPath = this.resolvePath(path);
      const content = await this.pfs.readFile(fullPath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file'
      };
    }
  }

  // Write file content
  async writeFile(path: string, content: string): Promise<FileSystemResult<void>> {
    await this.ensureInitialized();

    try {
      const fullPath = this.resolvePath(path);
      const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
      if (dirPath) {
        await this.ensureDir(dirPath);
      }
      await this.pfs.writeFile(fullPath, content, 'utf8');
      console.log(`💾 Saved file: ${fullPath}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file'
      };
    }
  }

  // Delete file or directory
  async deletePath(path: string): Promise<FileSystemResult<void>> {
    await this.ensureInitialized();

    try {
      const fullPath = this.resolvePath(path);
      const stats = await this.pfs.stat(fullPath);

      if (stats.isDirectory()) {
        await this.pfs.rmdir(fullPath);
      } else {
        await this.pfs.unlink(fullPath);
      }

      console.log(`🗑️ Deleted: ${fullPath}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete'
      };
    }
  }

  // Rename file or directory
  async rename(oldPath: string, newPath: string): Promise<FileSystemResult<void>> {
    await this.ensureInitialized();

    try {
      const fullOldPath = this.resolvePath(oldPath);
      const fullNewPath = this.resolvePath(newPath);

      await this.pfs.rename(fullOldPath, fullNewPath);
      console.log(`✏️ Renamed: ${fullOldPath} → ${fullNewPath}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rename'
      };
    }
  }

  // Create directory
  async createDirectory(path: string): Promise<FileSystemResult<void>> {
    await this.ensureInitialized();

    try {
      const fullPath = this.resolvePath(path);
      await this.ensureDir(fullPath);
      console.log(`📁 Created directory: ${fullPath}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory'
      };
    }
  }

  // Ensure directory exists
  private async ensureDir(path: string): Promise<void> {
    try {
      await this.pfs.mkdir(path);
    } catch (error) {
      // Directory might already exist
      const err = error as any;
      if (err.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // Check if path exists
  async exists(path: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const fullPath = this.resolvePath(path);
      await this.pfs.stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  // Get file stats
  async stats(path: string): Promise<FileSystemResult<FileStats>> {
    await this.ensureInitialized();

    try {
      const fullPath = this.resolvePath(path);
      const stats = await this.pfs.stat(fullPath);
      return {
        success: true,
        data: {
          name: fullPath.split('/').pop() || '',
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.isFile() ? stats.size : 0,
          modified: stats.mtimeMs || Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get file stats'
      };
    }
  }

  // Build file tree for FileExplorer
  async buildFileTree(path = '/', maxDepth = 5): Promise<FileNode[]> {
    await this.ensureInitialized();
    const visited = new Set<string>();

    const buildTree = async (currentPath: string, depth: number): Promise<FileNode[]> => {
      if (depth > maxDepth || visited.has(currentPath)) {
        return [];
      }

      visited.add(currentPath);

      try {
        const files = await this.pfs.readdir(currentPath);
        const nodes: FileNode[] = [];

        for (const fileName of files) {
          const fullPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;

          try {
            const stats = await this.pfs.stat(fullPath);
            const isDirectory = stats.isDirectory();

            const node: FileNode = {
              name: fileName,
              path: fullPath,
              type: isDirectory ? 'directory' : 'file',
            };

            if (isDirectory && depth < maxDepth) {
              node.children = await buildTree(fullPath, depth + 1);
            }

            nodes.push(node);
          } catch (error) {
            // Add as file if stat fails
            nodes.push({
              name: fileName,
              path: fullPath,
              type: 'file',
            });
          }
        }

        // Sort: directories first, then files, both alphabetically
        return nodes.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.warn(`Could not read directory ${currentPath}:`, error);
        return [];
      }
    };

    return await buildTree(path, 0);
  }

  // Legacy methods for compatibility
  getFS(): LightningFS {
    return this.fs;
  }

  async readDir(path = '/'): Promise<FileStats[]> {
    const oldDir = this.currentWorkingDirectory;
    await this.changeDirectory(path);
    const result = await this.listCurrentDirectory();
    this.currentWorkingDirectory = oldDir;

    // Convert FileNode[] to FileStats[]
    if (result.success && result.data) {
      return result.data.map(node => ({
        name: node.name,
        path: node.path,
        type: node.type,
        size: node.size || 0,
        modified: node.modified || Date.now()
      }));
    }

    return [];
  }

  // Get language from file path (for editor)
  getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      json: 'json',
      md: 'markdown',
      css: 'css',
      html: 'html',
      py: 'python',
      java: 'java',
      go: 'go',
      rs: 'rust',
      vue: 'html',
      svelte: 'html',
      php: 'php',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      sh: 'shell',
      bash: 'shell',
      zsh: 'shell',
      sql: 'sql',
    };
    return languageMap[ext || ''] || 'plaintext';
  }
}

// Export singleton
export const fileSystem = new FileSystemService();