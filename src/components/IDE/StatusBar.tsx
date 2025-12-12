import { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { gitService } from '@/services/git';
import { linterService } from '@/services/linter';
import type { GitBranch } from '@/types';

export function StatusBar() {
  const { currentFile, currentBranch, gitStatus, setCurrentBranch, currentRepo } = useIDEStore();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [lintProblems, setLintProblems] = useState({ errors: 0, warnings: 0, info: 0 });
  const [isGitRepo, setIsGitRepo] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if git is initialized
  useEffect(() => {
    const checkGitRepo = async () => {
      if (currentRepo) {
        setIsGitRepo(true);
        // Load branches for the current repository
        loadBranches();
      } else {
        setIsGitRepo(false);
        setBranches([]);
      }
    };

    checkGitRepo();
  }, [currentRepo]);

  // Load branches when menu opens
  useEffect(() => {
    if (showBranchMenu && isGitRepo && branches.length === 0) {
      loadBranches();
    }
  }, [showBranchMenu, isGitRepo]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowBranchMenu(false);
        setShowCreateBranch(false);
      }
    }

    if (showBranchMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBranchMenu]);

  async function loadBranches() {
    setIsLoading(true);
    const result = await gitService.listBranches('/repo');
    if (result.success && result.data) {
      setBranches(result.data);
    }
    setIsLoading(false);
  }

  async function handleBranchSwitch(branchName: string) {
    if (branchName === currentBranch) {
      setShowBranchMenu(false);
      return;
    }

    setIsLoading(true);
    const result = await gitService.checkout(branchName);

    if (result.success) {
      setCurrentBranch(branchName);
      // Reinitialize to get new status
      await gitService.initializeRepository('/repo');
      setShowBranchMenu(false);
    } else {
      alert('Failed to switch branch: ' + result.error);
    }
    setIsLoading(false);
  }

  async function handleCreateBranch() {
    if (!newBranchName.trim()) return;

    setIsLoading(true);
    const result = await gitService.createBranch(newBranchName.trim());

    if (result.success) {
      // Checkout the new branch
      await handleBranchSwitch(newBranchName.trim());
      setNewBranchName('');
      setShowCreateBranch(false);
      await loadBranches();
    } else {
      alert('Failed to create branch: ' + result.error);
    }
    setIsLoading(false);
  }

  const changedFilesCount = gitStatus.filter(f => f.status !== 'unmodified').length;

  return (
    <div className="statusbar flex items-center justify-between px-2 sm:px-4 py-1 bg-blue-600 text-white text-xs">
      <div className="statusbar-left flex items-center gap-2 sm:gap-4">
        {/* Branch Switcher - Only show if git repository is initialized */}
        {isGitRepo && (
          <div className="branch-selector relative" ref={menuRef}>
          <button
            onClick={() => setShowBranchMenu(!showBranchMenu)}
            className="flex items-center gap-1 px-2 py-1 hover:bg-blue-700 rounded transition-colors"
            title="Switch branch"
          >
            <span>🔗</span>
            <span className="hidden sm:inline">{currentBranch || 'No branch'}</span>
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

          {/* Branch Menu */}
          {showBranchMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-700 bg-gray-750">
                <div className="text-xs font-semibold text-gray-300 mb-1">
                  Switch Branch
                </div>
              </div>

              {isLoading ? (
                <div className="p-4 text-center text-gray-400">
                  <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : showCreateBranch ? (
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Branch name"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateBranch();
                      if (e.key === 'Escape') {
                        setShowCreateBranch(false);
                        setNewBranchName('');
                      }
                    }}
                    autoFocus
                    className="w-full px-2 py-1 bg-gray-700 text-gray-100 border border-gray-600 rounded text-xs focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleCreateBranch}
                      disabled={!newBranchName.trim()}
                      className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-xs"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateBranch(false);
                        setNewBranchName('');
                      }}
                      className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto">
                    {/* Current branch */}
                    {branches.filter(b => b.current).map(branch => (
                      <div
                        key={branch.name}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-900 text-white cursor-default"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="flex-1 font-medium">{branch.name}</span>
                        {branch.remote && (
                          <span className="text-xs text-blue-300">↔ {branch.remote}</span>
                        )}
                      </div>
                    ))}

                    {branches.filter(b => b.current).length > 0 && branches.filter(b => !b.current).length > 0 && (
                      <div className="border-t border-gray-700 my-1" />
                    )}

                    {/* Other branches */}
                    {branches.filter(b => !b.current).map(branch => (
                      <button
                        key={branch.name}
                        onClick={() => handleBranchSwitch(branch.name)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        <div className="w-3 h-3" /> {/* Spacer for alignment */}
                        <span className="flex-1">{branch.name}</span>
                        {branch.remote && (
                          <span className="text-xs text-gray-500">↔ {branch.remote}</span>
                        )}
                      </button>
                    ))}

                    {branches.length === 0 && (
                      <div className="px-3 py-4 text-center text-gray-500 text-xs">
                        No branches found
                      </div>
                    )}
                  </div>

                  {/* Create branch button */}
                  <div className="border-t border-gray-700 p-2">
                    <button
                      onClick={() => setShowCreateBranch(true)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-gray-300 hover:bg-gray-700 rounded transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">Create new branch</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        )}

        {/* Current file */}
        {currentFile && (
          <span className="status-item hidden sm:inline">📄 {currentFile.split('/').pop()}</span>
        )}

        {/* Git changes indicator - Only show if git repository is initialized */}
        {isGitRepo && changedFilesCount > 0 && (
          <span className="status-item flex items-center gap-1 bg-yellow-500 bg-opacity-20 px-2 py-0.5 rounded">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="hidden sm:inline">{changedFilesCount} {changedFilesCount === 1 ? 'change' : 'changes'}</span>
            <span className="sm:hidden">{changedFilesCount}</span>
          </span>
        )}
      </div>

      <div className="statusbar-right flex items-center gap-2">
        <span className="status-item hidden sm:inline">Browser IDE v2.0</span>
        <span className="status-item sm:hidden">v2.0</span>
      </div>
    </div>
  );
}
