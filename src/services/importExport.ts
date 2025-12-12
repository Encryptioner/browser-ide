import JSZip from 'jszip';
import { fileSystem } from './filesystem';
import { gitService } from './git';
import { useIDEStore } from '@/store/useIDEStore';

export interface ExportOptions {
  includeSettings: boolean;
  includeGitHistory: boolean;
  includeNodeModules: boolean;
  includeIDEState: boolean;
}

export interface ExportMetadata {
  version: string;
  exportedAt: number;
  projectName: string;
  description?: string;
  options: ExportOptions;
}

export interface FileSystemExport {
  files: Array<{
    path: string;
    content: string;
    type: 'file' | 'directory';
  }>;
}

export interface ProjectExport {
  metadata: ExportMetadata;
  fileSystem: FileSystemExport;
  settings?: any;
  ideState?: any;
  gitInfo?: {
    currentBranch: string;
    remotes: Array<{ remote: string; url: string }>;
    commits: any[];
  };
}

export interface ImportResult {
  success: boolean;
  error?: string;
  importedFiles?: number;
  projectName?: string;
}

class ImportExportService {
  private readonly METADATA_FILE = '_project-export.json';
  private readonly SETTINGS_FILE = '_settings.json';
  private readonly IDE_STATE_FILE = '_ide-state.json';
  private readonly GIT_INFO_FILE = '_git-info.json';

  async exportProject(
    projectName: string,
    options: ExportOptions,
    description?: string
  ): Promise<{ success: boolean; data?: Uint8Array; error?: string }> {
    try {
      console.log('📦 Starting project export...');

      const zip = new JSZip();
      const metadata: ExportMetadata = {
        version: '2.0.0',
        exportedAt: Date.now(),
        projectName,
        description,
        options,
      };

      // Export file system
      const currentDir = fileSystem.getCurrentWorkingDirectory();
      console.log(`📁 Exporting files from: ${currentDir}`);

      const fileTree = await fileSystem.buildFileTree(currentDir, 10);
      const files: FileSystemExport['files'] = [];

      // Collect all files recursively
      await this.collectFilesRecursive(currentDir, files, options.includeNodeModules);

      // Add files to zip
      for (const file of files) {
        if (file.type === 'file') {
          zip.file(file.path.substring(1), file.content); // Remove leading slash
        }
      }

      // Add settings if requested
      if (options.includeSettings) {
        const store = useIDEStore.getState();
        zip.file(this.SETTINGS_FILE, JSON.stringify(store.settings, null, 2));
      }

      // Add IDE state if requested
      if (options.includeIDEState) {
        const store = useIDEStore.getState();
        const ideState = {
          currentFile: store.currentFile,
          openFiles: store.openFiles,
          sidebarOpen: store.sidebarOpen,
          terminalOpen: store.terminalOpen,
          previewOpen: store.previewOpen,
          aiOpen: store.aiOpen,
        };
        zip.file(this.IDE_STATE_FILE, JSON.stringify(ideState, null, 2));
      }

      // Add git info if requested
      if (options.includeGitHistory) {
        try {
          const gitInfo = {
            currentBranch: await gitService.getCurrentBranch(currentDir),
            remotes: await gitService.listRemotes(currentDir),
            commits: await gitService.log(currentDir, 50), // Last 50 commits
          };
          zip.file(this.GIT_INFO_FILE, JSON.stringify(gitInfo, null, 2));
        } catch (error) {
          console.warn('⚠️ Could not export git information:', error);
        }
      }

      // Add metadata
      zip.file(this.METADATA_FILE, JSON.stringify(metadata));

      // Generate zip file
      const zipData = await zip.generateAsync({ type: 'uint8array' });

      console.log(`✅ Export complete: ${files.length} files, ${zipData.length} bytes`);

      return {
        success: true,
        data: zipData,
      };
    } catch (error) {
      console.error('❌ Export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  private async collectFilesRecursive(
    path: string,
    files: FileSystemExport['files'],
    includeNodeModules: boolean,
    visited = new Set<string>()
  ): Promise<void> {
    if (visited.has(path)) return;
    visited.add(path);

    try {
      const result = await fileSystem.listCurrentDirectory();
      if (!result.success || !result.data) return;

      for (const item of result.data) {
        if (item.type === 'directory') {
          // Skip node_modules unless included
          if (!includeNodeModules && item.name === 'node_modules') {
            continue;
          }

          // Add directory entry
          files.push({
            path: item.path,
            content: '',
            type: 'directory',
          });

          // Recursively collect files
          const oldDir = fileSystem.getCurrentWorkingDirectory();
          await fileSystem.changeDirectory(item.path);
          await this.collectFilesRecursive(item.path, files, includeNodeModules, visited);
          await fileSystem.changeDirectory(oldDir);
        } else {
          // Read file content
          const fileResult = await fileSystem.readFile(item.path);
          files.push({
            path: item.path,
            content: fileResult.success && fileResult.data ? fileResult.data : '',
            type: 'file',
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not collect files from ${path}:`, error);
    }
  }

  async importProject(
    zipData: ArrayBuffer | Uint8Array,
    importOptions: {
      importSettings?: boolean;
      importIDEState?: boolean;
      importGitInfo?: boolean;
      clearCurrentWorkspace?: boolean;
    } = {}
  ): Promise<ImportResult> {
    try {
      console.log('📥 Starting project import...');

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipData);

      // Read metadata
      const metadataFile = zipContent.file(this.METADATA_FILE);
      if (!metadataFile) {
        return {
          success: false,
          error: 'Invalid project export: missing metadata',
        };
      }

      const metadata: ExportMetadata = JSON.parse(await metadataFile.async('text'));
      console.log(`📋 Importing project: ${metadata.projectName} (v${metadata.version})`);

      // Clear current workspace if requested
      if (importOptions.clearCurrentWorkspace) {
        const store = useIDEStore.getState();
        store.closeAllFiles();
        store.updateEditorContent({}, {});
      }

      let importedFiles = 0;

      // Import files
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        if (relativePath.startsWith('_') || zipEntry.dir) {
          continue; // Skip metadata files and directories
        }

        const fullPath = '/' + relativePath;
        const content = await zipEntry.async('text');

        // Create directory structure if needed
        const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
        if (dirPath) {
          await fileSystem.createDirectory(dirPath);
        }

        // Write file
        const writeResult = await fileSystem.writeFile(fullPath, content);
        if (writeResult.success) {
          importedFiles++;
        }
      }

      // Import settings if requested and available
      if (importOptions.importSettings !== false && metadata.options.includeSettings) {
        const settingsFile = zipContent.file(this.SETTINGS_FILE);
        if (settingsFile) {
          try {
            const settings = JSON.parse(await settingsFile.async('text'));
            const store = useIDEStore.getState();
            store.updateSettings(settings);
            console.log('⚙️ Settings imported');
          } catch (error) {
            console.warn('⚠️ Could not import settings:', error);
          }
        }
      }

      // Import IDE state if requested and available
      if (importOptions.importIDEState && metadata.options.includeIDEState) {
        const ideStateFile = zipContent.file(this.IDE_STATE_FILE);
        if (ideStateFile) {
          try {
            const ideState = JSON.parse(await ideStateFile.async('text'));
            const store = useIDEStore.getState();

            if (ideState.openFiles) {
              ideState.openFiles.forEach((file: string) => store.addOpenFile(file));
            }
            if (ideState.currentFile) {
              store.setCurrentFile(ideState.currentFile);
            }
            if (ideState.sidebarOpen !== undefined) store.setSidebarOpen(ideState.sidebarOpen);
            if (ideState.terminalOpen !== undefined) store.setTerminalOpen(ideState.terminalOpen);
            if (ideState.previewOpen !== undefined) store.setPreviewOpen(ideState.previewOpen);
            if (ideState.aiOpen !== undefined) store.setAIOpen(ideState.aiOpen);

            console.log('🖥️ IDE state imported');
          } catch (error) {
            console.warn('⚠️ Could not import IDE state:', error);
          }
        }
      }

      // Import git info if requested and available
      if (importOptions.importGitInfo && metadata.options.includeGitHistory) {
        const gitInfoFile = zipContent.file(this.GIT_INFO_FILE);
        if (gitInfoFile) {
          try {
            const gitInfo = JSON.parse(await gitInfoFile.async('text'));
            console.log('📚 Git info available for reference (manual setup required)');
          } catch (error) {
            console.warn('⚠️ Could not import git info:', error);
          }
        }
      }

      // Refresh file tree
      const store = useIDEStore.getState();
      const currentDir = fileSystem.getCurrentWorkingDirectory();
      const fileTree = await fileSystem.buildFileTree(currentDir);
      store.setFileTree(fileTree);

      console.log(`✅ Import complete: ${importedFiles} files imported`);

      return {
        success: true,
        importedFiles,
        projectName: metadata.projectName,
      };
    } catch (error) {
      console.error('❌ Import failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  downloadExport(data: Uint8Array, projectName: string): void {
    const blob = new Blob([data.buffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-zA-Z0-9-_]/g, '_')}_export.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    console.log(`💾 Download started: ${projectName}_export.zip`);
  }

  async validateExport(zipData: ArrayBuffer | Uint8Array): Promise<{
    valid: boolean;
    metadata?: ExportMetadata;
    error?: string;
  }> {
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipData);

      const metadataFile = zipContent.file(this.METADATA_FILE);
      if (!metadataFile) {
        return {
          valid: false,
          error: 'Missing metadata file - not a valid project export',
        };
      }

      const metadata: ExportMetadata = JSON.parse(await metadataFile.async('text'));

      // Basic validation
      if (!metadata.projectName || !metadata.version || !metadata.exportedAt) {
        return {
          valid: false,
          error: 'Invalid metadata format',
        };
      }

      return {
        valid: true,
        metadata,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid ZIP file',
      };
    }
  }
}

export const importExportService = new ImportExportService();