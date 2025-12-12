import { useState, useEffect, useRef } from 'react';
import { fileSystem } from '@/services/filesystem';
import { gitService } from '@/services/git';
import { useIDEStore } from '@/store/useIDEStore';
import { toast } from 'sonner';
import {
  File,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Home,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  FilePlus,
  FolderPlus,
  Edit2,
  Trash2,
  Copy,
  Scissors,
} from 'lucide-react';
import type { FileNode } from '@/types';

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  onClose: () => void;
  onAction: (action: string, node: FileNode) => void;
}

function ContextMenu({ x, y, node, onClose, onAction }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const menuItems = node.type === 'directory'
    ? [
        { icon: FilePlus, label: 'New File', action: 'new-file' },
        { icon: FolderPlus, label: 'New Folder', action: 'new-folder' },
        { icon: Edit2, label: 'Rename', action: 'rename' },
        { icon: Copy, label: 'Copy', action: 'copy' },
        { icon: Scissors, label: 'Cut', action: 'cut' },
        { icon: Trash2, label: 'Delete', action: 'delete', danger: true },
      ]
    : [
        { icon: Edit2, label: 'Rename', action: 'rename' },
        { icon: Copy, label: 'Copy', action: 'copy' },
        { icon: Scissors, label: 'Cut', action: 'cut' },
        { icon: Trash2, label: 'Delete', action: 'delete', danger: true },
      ];

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item) => (
        <button
          key={item.action}
          onClick={() => {
            onAction(item.action, node);
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
            item.danger ? 'text-red-400 hover:text-red-300' : 'text-gray-200'
          }`}
        >
          <item.icon className="w-4 h-4" />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function FileExplorer() {
  const [expandedDirs, setExpandedDirs] = useState(new Set<string>(['/']));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [newItemParent, setNewItemParent] = useState<{ path: string; type: 'file' | 'folder' } | null>(null);
  const [gitStatusMap, setGitStatusMap] = useState<Map<string, string>>(new Map());
  const {
    fileTree,
    currentFile,
    setCurrentFile,
    addOpenFile,
    setFileTree,
    gitStatus,
  } = useIDEStore();

  const currentDirectory = fileSystem.getCurrentWorkingDirectory();

  useEffect(() => {
    loadFileTree();
    loadGitStatus();
  }, []);

  useEffect(() => {
    // Update git status map whenever gitStatus changes
    const statusMap = new Map<string, string>();
    gitStatus.forEach((item) => {
      statusMap.set(item.path, item.status);
    });
    setGitStatusMap(statusMap);
  }, [gitStatus]);

  async function loadFileTree() {
    const currentDir = fileSystem.getCurrentWorkingDirectory();
    const tree = await fileSystem.buildFileTree(currentDir, 5);
    setFileTree(tree);
  }

  async function loadGitStatus() {
    try {
      const result = await gitService.statusMatrix('/repo');
      const statusMap = new Map<string, string>();
      result.forEach((item) => {
        statusMap.set(item.path, item.status);
      });
      setGitStatusMap(statusMap);
    } catch (error) {
      console.error('Failed to load git status:', error);
    }
  }

  function toggleDir(path: string) {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }

  function handleFileClick(file: FileNode) {
    if (file.type === 'file') {
      setCurrentFile(file.path);
      addOpenFile(file.path);
    }
  }

  function handleDirectoryUp() {
    const currentPath = fileSystem.getCurrentWorkingDirectory();
    if (currentPath !== '/') {
      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
      fileSystem.changeDirectory(parentPath);
      setExpandedDirs(new Set([parentPath]));
      loadFileTree();
    }
  }

  function handleContextMenu(e: React.MouseEvent, node: FileNode) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }

  async function handleContextAction(action: string, node: FileNode) {
    switch (action) {
      case 'new-file':
        setNewItemParent({ path: node.path, type: 'file' });
        break;

      case 'new-folder':
        setNewItemParent({ path: node.path, type: 'folder' });
        break;

      case 'rename':
        setRenaming(node.path);
        break;

      case 'delete':
        await handleDelete(node);
        break;

      case 'copy':
        toast.info('Copy functionality coming soon');
        break;

      case 'cut':
        toast.info('Cut functionality coming soon');
        break;
    }
  }

  async function handleDelete(node: FileNode) {
    const confirmed = confirm(`Delete ${node.name}?`);
    if (!confirmed) return;

    const result = await fileSystem.deletePath(node.path);
    if (result.success) {
      toast.success(`Deleted ${node.name}`);
      await loadFileTree();
      await loadGitStatus();
    } else {
      toast.error(`Failed to delete: ${result.error}`);
    }
  }

  async function handleRename(oldPath: string, newName: string) {
    if (!newName.trim() || newName === oldPath.split('/').pop()) {
      setRenaming(null);
      return;
    }

    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${parentPath}/${newName}`;

    const result = await fileSystem.rename(oldPath, newPath);
    if (result.success) {
      toast.success(`Renamed to ${newName}`);
      setRenaming(null);
      await loadFileTree();
      await loadGitStatus();
    } else {
      toast.error(`Failed to rename: ${result.error}`);
    }
  }

  async function handleCreateNew(parentPath: string, name: string, type: 'file' | 'folder') {
    if (!name.trim()) {
      setNewItemParent(null);
      return;
    }

    const newPath = `${parentPath}/${name}`;

    if (type === 'file') {
      const result = await fileSystem.writeFile(newPath, '');
      if (result.success) {
        toast.success(`Created ${name}`);
        setNewItemParent(null);
        await loadFileTree();
        await loadGitStatus();
        // Expand parent directory
        setExpandedDirs((prev) => new Set(prev).add(parentPath));
      } else {
        toast.error(`Failed to create file: ${result.error}`);
      }
    } else {
      const result = await fileSystem.createDirectory(newPath);
      if (result.success) {
        toast.success(`Created folder ${name}`);
        setNewItemParent(null);
        await loadFileTree();
        await loadGitStatus();
        // Expand parent directory
        setExpandedDirs((prev) => new Set(prev).add(parentPath));
      } else {
        toast.error(`Failed to create folder: ${result.error}`);
      }
    }
  }

  function getFileIcon(filename: string, isDirectory: boolean, isOpen: boolean): JSX.Element {
    if (isDirectory) {
      return isOpen ? (
        <FolderOpen className="w-4 h-4 text-blue-400" />
      ) : (
        <Folder className="w-4 h-4 text-blue-400" />
      );
    }

    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-yellow-400" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-green-400" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  }

  function getGitStatusBadge(path: string): JSX.Element | null {
    const status = gitStatusMap.get(path);
    if (!status || status === 'unmodified') return null;

    const statusConfig = {
      modified: { label: 'M', className: 'bg-yellow-600 text-yellow-100' },
      added: { label: 'A', className: 'bg-green-600 text-green-100' },
      deleted: { label: 'D', className: 'bg-red-600 text-red-100' },
      untracked: { label: 'U', className: 'bg-blue-600 text-blue-100' },
      staged: { label: 'S', className: 'bg-purple-600 text-purple-100' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span
        className={`inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded ${config.className}`}
        title={`Git: ${status}`}
      >
        {config.label}
      </span>
    );
  }

  function renderTree(items: FileNode[], level = 0): React.ReactNode {
    return items.map((item) => {
      const isExpanded = expandedDirs.has(item.path);
      const isRenaming = renaming === item.path;
      const isCreatingNew = newItemParent?.path === item.path;

      return (
        <div key={item.path} className="tree-item">
          {item.type === 'directory' ? (
            <>
              <div
                className={`tree-item-row directory flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition-colors ${
                  window.innerWidth < 768 ? 'py-3 px-2 min-h-[44px]' : 'py-1.5 px-2'
                }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => toggleDir(item.path)}
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                {/* Chevron */}
                <span className="chevron flex-shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </span>

                {/* Icon */}
                {getFileIcon(item.name, true, isExpanded)}

                {/* Name or Rename Input */}
                {isRenaming ? (
                  <input
                    type="text"
                    defaultValue={item.name}
                    autoFocus
                    className="flex-1 bg-gray-900 text-gray-100 px-2 py-1 rounded text-sm border border-blue-500 focus:outline-none"
                    onBlur={(e) => handleRename(item.path, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRename(item.path, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setRenaming(null);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 text-sm text-gray-200 truncate">{item.name}</span>
                )}

                {/* Git Status Badge */}
                {getGitStatusBadge(item.path)}

                {/* More Options */}
                <button
                  className="more-button opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleContextMenu(e, item);
                  }}
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Expanded Children */}
              {isExpanded && (
                <div className="children">
                  {/* New Item Input */}
                  {isCreatingNew && (
                    <div
                      className="tree-item-row flex items-center gap-2 py-1.5 px-2"
                      style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                    >
                      {newItemParent.type === 'file' ? (
                        <File className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Folder className="w-4 h-4 text-blue-400" />
                      )}
                      <input
                        type="text"
                        placeholder={newItemParent.type === 'file' ? 'filename.txt' : 'foldername'}
                        autoFocus
                        className="flex-1 bg-gray-900 text-gray-100 px-2 py-1 rounded text-sm border border-blue-500 focus:outline-none"
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleCreateNew(item.path, e.target.value, newItemParent.type);
                          } else {
                            setNewItemParent(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateNew(item.path, e.currentTarget.value, newItemParent.type);
                          } else if (e.key === 'Escape') {
                            setNewItemParent(null);
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Render children */}
                  {item.children && renderTree(item.children, level + 1)}
                </div>
              )}
            </>
          ) : (
            <div
              className={`tree-item-row file group flex items-center gap-2 cursor-pointer hover:bg-gray-700 transition-colors ${
                currentFile === item.path ? 'bg-blue-600 text-white' : ''
              } ${window.innerWidth < 768 ? 'py-3 px-2 min-h-[44px]' : 'py-1.5 px-2'}`}
              style={{ paddingLeft: `${level * 16 + 24}px` }}
              onClick={() => handleFileClick(item)}
              onContextMenu={(e) => handleContextMenu(e, item)}
            >
              {/* Icon */}
              {getFileIcon(item.name, false, false)}

              {/* Name or Rename Input */}
              {isRenaming ? (
                <input
                  type="text"
                  defaultValue={item.name}
                  autoFocus
                  className="flex-1 bg-gray-900 text-gray-100 px-2 py-1 rounded text-sm border border-blue-500 focus:outline-none"
                  onBlur={(e) => handleRename(item.path, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRename(item.path, e.currentTarget.value);
                    } else if (e.key === 'Escape') {
                      setRenaming(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-sm truncate">{item.name}</span>
              )}

              {/* Git Status Badge */}
              {getGitStatusBadge(item.path)}

              {/* More Options */}
              <button
                className="more-button opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, item);
                }}
              >
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      );
    });
  }

  return (
    <div className="file-explorer flex flex-col h-full bg-gray-800 text-gray-100">
      {/* Header */}
      <div className="panel-header flex flex-col gap-2 px-4 py-3 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase">Explorer</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                loadFileTree();
                loadGitStatus();
              }}
              title="Refresh"
              className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNewItemParent({ path: currentDirectory, type: 'file' })}
              title="New File"
              className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setNewItemParent({ path: currentDirectory, type: 'folder' })}
              title="New Folder"
              className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDirectoryUp}
            disabled={currentDirectory === '/'}
            className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            title="Go up directory"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex-1 px-2 py-1 text-xs bg-gray-800 rounded text-gray-100 font-mono truncate">
            {currentDirectory === '/' ? '/' : currentDirectory}
          </div>
          <button
            onClick={() => {
              fileSystem.changeDirectory('/');
              loadFileTree();
            }}
            className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-700 rounded transition-colors"
            title="Go to root"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File Tree */}
      <div className="tree flex-1 overflow-auto">
        {fileTree.length > 0 ? (
          <>
            {/* New Item Input at Root Level */}
            {newItemParent?.path === currentDirectory && !fileTree.some(item => item.path === newItemParent.path) && (
              <div
                className="tree-item-row flex items-center gap-2 py-1.5 px-2"
                style={{ paddingLeft: '8px' }}
              >
                {newItemParent.type === 'file' ? (
                  <File className="w-4 h-4 text-gray-400" />
                ) : (
                  <Folder className="w-4 h-4 text-blue-400" />
                )}
                <input
                  type="text"
                  placeholder={newItemParent.type === 'file' ? 'filename.txt' : 'foldername'}
                  autoFocus
                  className="flex-1 bg-gray-900 text-gray-100 px-2 py-1 rounded text-sm border border-blue-500 focus:outline-none"
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      handleCreateNew(currentDirectory, e.target.value, newItemParent.type);
                    } else {
                      setNewItemParent(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNew(currentDirectory, e.currentTarget.value, newItemParent.type);
                    } else if (e.key === 'Escape') {
                      setNewItemParent(null);
                    }
                  }}
                />
              </div>
            )}
            {renderTree(fileTree)}
          </>
        ) : (
          <div className="empty-state flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <Folder className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm text-center">No files yet</p>
            <p className="text-xs text-center mt-2 text-gray-600">
              Clone a repository or create files to get started
            </p>
            {/* New Item Input in Empty State */}
            {newItemParent && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-4">
                  {newItemParent.type === 'file' ? (
                    <File className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Folder className="w-4 h-4 text-blue-400" />
                  )}
                  <input
                    type="text"
                    placeholder={newItemParent.type === 'file' ? 'filename.txt' : 'foldername'}
                    autoFocus
                    className="flex-1 bg-gray-900 text-gray-100 px-2 py-1 rounded text-sm border border-blue-500 focus:outline-none"
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        handleCreateNew(currentDirectory, e.target.value, newItemParent.type);
                      } else {
                        setNewItemParent(null);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateNew(currentDirectory, e.currentTarget.value, newItemParent.type);
                      } else if (e.key === 'Escape') {
                        setNewItemParent(null);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}
