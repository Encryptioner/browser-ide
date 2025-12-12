/**
 * Workspace Switcher Component
 *
 * Displays open workspaces and allows switching between them
 * Shows active workspace with indicator
 */

import { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';

export function WorkspaceSwitcher() {
  const {
    activeWorkspaceId,
    workspaces,
    switchWorkspace,
    closeWorkspace,
    getAllWorkspaces,
  } = useWorkspaceStore();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const allWorkspaces = getAllWorkspaces();
  const activeWorkspace = activeWorkspaceId ? workspaces[activeWorkspaceId] : null;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleClose = (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    closeWorkspace(workspaceId);
  };

  if (!activeWorkspace) {
    return null;
  }

  return (
    <div className="workspace-switcher relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700 rounded text-sm transition-colors"
        title="Switch workspace"
      >
        <span className="text-blue-400">📂</span>
        <span className="hidden sm:inline font-medium truncate max-w-[150px]">
          {activeWorkspace.name}
        </span>
        {allWorkspaces.length > 1 && (
          <span className="text-xs text-gray-400">({allWorkspaces.length})</span>
        )}
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Workspace Menu */}
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-700 bg-gray-750">
            <div className="text-xs font-semibold text-gray-300">
              Open Workspaces ({allWorkspaces.length})
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {allWorkspaces.map((workspace) => {
              const isActive = workspace.id === activeWorkspaceId;
              const changedFiles = workspace.data.gitStatus.filter(
                (f) => f.status !== 'unmodified'
              ).length;

              return (
                <div
                  key={workspace.id}
                  onClick={() => {
                    switchWorkspace(workspace.id);
                    setShowMenu(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-900 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <svg
                          className="w-3 h-3 text-blue-400 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className="font-medium truncate">{workspace.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-gray-400">
                        🔗 {workspace.data.currentBranch}
                      </span>
                      {changedFiles > 0 && (
                        <span className="text-yellow-400">
                          • {changedFiles} {changedFiles === 1 ? 'change' : 'changes'}
                        </span>
                      )}
                      {workspace.data.openFiles.length > 0 && (
                        <span className="text-gray-500">
                          • {workspace.data.openFiles.length}{' '}
                          {workspace.data.openFiles.length === 1 ? 'file' : 'files'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Close button */}
                  {allWorkspaces.length > 1 && (
                    <button
                      onClick={(e) => handleClose(e, workspace.id)}
                      className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Close workspace"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {allWorkspaces.length === 0 && (
            <div className="px-3 py-4 text-center text-gray-500 text-xs">
              No workspaces open
            </div>
          )}
        </div>
      )}
    </div>
  );
}
