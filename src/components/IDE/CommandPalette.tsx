import { useState, useEffect, useCallback, useRef } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { importExportService } from '@/services/importExport';

interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeSettings: true,
    includeGitHistory: true,
    includeNodeModules: false,
    includeIDEState: true,
  });
  const [importOptions, setImportOptions] = useState({
    importSettings: true,
    importIDEState: true,
    importGitInfo: false,
    clearCurrentWorkspace: false,
  });
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('my-project');
  const [projectDescription, setProjectDescription] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    toggleSidebar,
    toggleTerminal,
    togglePreview,
    settings,
    openFiles,
    closeFile,
    currentRepo
  } = useIDEStore();

  // Import/Export handlers
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await importExportService.exportProject(
        projectName,
        exportOptions,
        projectDescription
      );

      if (result.success && result.data) {
        importExportService.downloadExport(result.data, projectName);
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed - please check console for details');
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  }, [projectName, projectDescription, exportOptions]);

  const handleImport = useCallback(async (file: File) => {
    // Validate file first
    if (!file.name.endsWith('.zip')) {
      alert('Please select a valid ZIP export file');
      return;
    }

    // Set pending file for confirmation dialog
    setPendingImportFile(file);

    // Show warning dialog if there's existing data or workspace isn't being cleared
    const store = useIDEStore.getState();
    const hasExistingData = store.openFiles.length > 0 || Object.keys(store.files).length > 0;

    if (hasExistingData && !importOptions.clearCurrentWorkspace) {
      setShowImportWarning(true);
      setShowImportDialog(false);
    } else {
      // Proceed directly with import
      await executeImport(file);
    }
  }, [importOptions]);

  const executeImport = useCallback(async (file: File) => {
    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await importExportService.importProject(arrayBuffer, importOptions);

      if (result.success) {
        alert(`✅ Import successful: ${result.importedFiles} files imported from "${result.projectName}"`);
      } else {
        alert(`❌ Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('❌ Import failed - please check console for details');
    } finally {
      setIsImporting(false);
      setShowImportDialog(false);
      setPendingImportFile(null);
    }
  }, [importOptions]);

  const confirmImportWithOverride = useCallback(async () => {
    if (pendingImportFile) {
      await executeImport(pendingImportFile);
    }
  }, [pendingImportFile, executeImport]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  }, [handleImport]);

  const commands: Command[] = [
    // File operations
    {
      id: 'new-file',
      name: 'New File',
      description: 'Create a new file',
      shortcut: 'Ctrl+N',
      category: 'File',
      action: () => console.log('New file')
    },
    {
      id: 'save-file',
      name: 'Save File',
      description: 'Save current file',
      shortcut: 'Ctrl+S',
      category: 'File',
      action: () => console.log('Save file')
    },
    {
      id: 'close-file',
      name: 'Close File',
      description: 'Close current file',
      shortcut: 'Ctrl+W',
      category: 'File',
      action: () => {
        if (openFiles.length > 0) {
          closeFile(openFiles[openFiles.length - 1]);
        }
      }
    },
    {
      id: 'export-project',
      name: 'Export Project',
      description: 'Export entire project with settings',
      category: 'File',
      action: () => {
        // Set project name from current repo or default
        setProjectName(currentRepo ? currentRepo.split('/').pop() || 'my-project' : 'my-project');
        setShowExportDialog(true);
      }
    },
    {
      id: 'import-project',
      name: 'Import Project',
      description: 'Import project from export file',
      category: 'File',
      action: () => {
        fileInputRef.current?.click();
      }
    },

    // View operations
    {
      id: 'toggle-sidebar',
      name: 'Toggle Sidebar',
      description: 'Show/hide file explorer',
      shortcut: 'Ctrl+B',
      category: 'View',
      action: toggleSidebar
    },
    {
      id: 'toggle-terminal',
      name: 'Toggle Terminal',
      description: 'Show/hide terminal',
      shortcut: 'Ctrl+`',
      category: 'View',
      action: toggleTerminal
    },
    {
      id: 'toggle-preview',
      name: 'Toggle Preview',
      description: 'Show/hide preview panel',
      shortcut: 'Ctrl+P',
      category: 'View',
      action: togglePreview
    },

    // Editor operations
    {
      id: 'find-in-file',
      name: 'Find in File',
      description: 'Search within current file',
      shortcut: 'Ctrl+F',
      category: 'Editor',
      action: () => console.log('Find in file')
    },
    {
      id: 'replace-in-file',
      name: 'Replace in File',
      description: 'Find and replace within current file',
      shortcut: 'Ctrl+H',
      category: 'Editor',
      action: () => console.log('Replace in file')
    },
    {
      id: 'format-document',
      name: 'Format Document',
      description: 'Format current file',
      shortcut: 'Shift+Alt+F',
      category: 'Editor',
      action: () => console.log('Format document')
    },

    // Git operations
    {
      id: 'git-status',
      name: 'Git Status',
      description: 'Show git status',
      shortcut: 'Ctrl+Shift+G',
      category: 'Git',
      action: () => console.log('Git status')
    },
    {
      id: 'git-commit',
      name: 'Git Commit',
      description: 'Commit changes',
      shortcut: 'Ctrl+K Ctrl+S',
      category: 'Git',
      action: () => console.log('Git commit')
    },
    {
      id: 'git-push',
      name: 'Git Push',
      description: 'Push to remote',
      shortcut: 'Ctrl+K Ctrl+P',
      category: 'Git',
      action: () => console.log('Git push')
    }
  ];

  // Filter commands based on search term
  const filteredCommands = commands.filter(command =>
    command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    command.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    command.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = [];
    }
    groups[command.category].push(command);
    return groups;
  }, {} as Record<string, Command[]>);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P or Cmd+Shift+P to open command palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
        setSelectedIndex(0);
      }

      // Arrow keys to navigate
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev === 0 ? filteredCommands.length - 1 : prev - 1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setIsOpen(false);
            setSearchTerm('');
            setSelectedIndex(0);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('command-palette-input');
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  const executeCommand = useCallback((command: Command) => {
    command.action();
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(0);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Main command palette */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
          {/* Search input */}
          <div className="p-4 border-b border-gray-700">
            <input
              id="command-palette-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="w-full bg-gray-800 text-gray-100 px-4 py-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Command list */}
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="mb-4">
                {/* Category header */}
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </div>

                {/* Commands in category */}
                {commands.map((command) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <div
                      key={command.id}
                      className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-gray-800 ${
                        isSelected ? 'bg-blue-600 bg-opacity-20' : ''
                      }`}
                      onClick={() => executeCommand(command)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">
                          {isSelected ? '▶' : ''}
                        </span>
                        <div>
                          <div className="text-gray-100 font-medium">
                            {command.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {command.description}
                          </div>
                        </div>
                      </div>
                      {command.shortcut && (
                        <div className="text-gray-500 text-xs font-mono">
                          {command.shortcut.replace('Ctrl', settings.theme === 'dark' ? '⌃' : 'Ctrl')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer with hints */}
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>↑↓ Navigate • Enter Execute</span>
              <span>Escape Close</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Export Project
              </h2>

              <div className="space-y-4">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    placeholder="my-project"
                  />
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows={3}
                    placeholder="Project description..."
                  />
                </div>

                {/* Export Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Export Options
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeSettings}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Include IDE Settings
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeIDEState}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeIDEState: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Include Editor State (open files, layout)
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeGitHistory}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeGitHistory: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Include Git History
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeNodeModules}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeNodeModules: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Include node_modules (not recommended)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowExportDialog(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting || !projectName.trim()}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? 'Exporting...' : 'Export Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Warning Dialog */}
      {showImportWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-600 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-red-500 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.181V8.019c0-1.514-.962-3.181-2.502-3.181H6.856c-1.54 0-2.502 1.667-2.502 3.181v4.8c0 1.514.962 3.181 2.502 3.181z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-100">
                    ⚠️ Import Warning
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    You have existing data that will be affected
                  </p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-red-900 bg-opacity-20 border border-red-700 rounded">
                <p className="text-red-300 text-sm">
                  <strong>Importing without clearing workspace will:</strong>
                </p>
                <ul className="list-disc list-inside text-red-300 text-sm mt-2 space-y-1">
                  <li>Override existing files with the same names</li>
                  <li>Add new files to your current workspace</li>
                  <li>Potentially merge settings if selected</li>
                  <li>Keep your current open tabs and layout</li>
                </ul>
              </div>

              <div className="mb-6 p-4 bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded">
                <p className="text-yellow-300 text-sm">
                  <strong>Recommended options:</strong>
                </p>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2 text-yellow-100 cursor-pointer">
                    <input
                      type="radio"
                      checked={importOptions.clearCurrentWorkspace}
                      onChange={() => setImportOptions(prev => ({ ...prev, clearCurrentWorkspace: true }))}
                      className="rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
                    />
                    <div>
                      <div className="font-medium">🧹 Clear workspace first</div>
                      <div className="text-xs text-yellow-400">Start fresh with imported project</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 text-yellow-100 cursor-pointer">
                    <input
                      type="radio"
                      checked={!importOptions.clearCurrentWorkspace}
                      onChange={() => setImportOptions(prev => ({ ...prev, clearCurrentWorkspace: false }))}
                      className="rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
                    />
                    <div>
                      <div className="font-medium">🔄 Merge with current workspace</div>
                      <div className="text-xs text-yellow-400">Override conflicting files, keep others</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <button
                  onClick={() => {
                    setShowImportWarning(false);
                    setPendingImportFile(null);
                  }}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmImportWithOverride}
                  disabled={isImporting || !pendingImportFile}
                  className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : '⚠️ Import Anyway'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Import Project
              </h2>

              <div className="space-y-4">
                {/* File input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Export File
                  </label>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    disabled={isImporting}
                    className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
                  />
                </div>

                {/* Import Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Import Options
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.clearCurrentWorkspace}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, clearCurrentWorkspace: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Clear current workspace before import
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.importSettings}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, importSettings: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Import IDE Settings
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.importIDEState}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, importIDEState: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Import Editor State
                  </label>

                  <label className="flex items-center gap-2 text-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.importGitInfo}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, importGitInfo: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    Import Git Information (reference only)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-gray-300 bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}