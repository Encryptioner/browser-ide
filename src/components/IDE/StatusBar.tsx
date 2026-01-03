import { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { gitService } from '@/services/git';
import type { GitBranch } from '@/types';

export function StatusBar() {
  const { currentFile, currentBranch, gitStatus, setCurrentBranch, currentRepo } = useIDEStore();
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
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
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBranchMenu]);

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const result = await gitService.getBranches();
      if (result.success && result.data) {
        setBranches(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createNewBranch = async () => {
    if (!newBranchName.trim()) return;

    const result = await gitService.createBranch(newBranchName.trim());
    if (result.success) {
      setNewBranchName('');
      setShowCreateBranch(false);
      loadBranches();
      // Switch to the new branch
      await gitService.checkout(newBranchName.trim());
      setCurrentBranch?.(newBranchName.trim());
    }
  };

  const checkoutBranch = async (branchName: string) => {
    const result = await gitService.checkout(branchName);
    if (result.success) {
      setCurrentBranch?.(branchName);
      setShowBranchMenu(false);
    }
  };

  return (
    <div className="status-bar flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs">
      <div className="flex items-center gap-4">
        {/* File path */}
        {currentFile && (
          <div className="flex items-center gap-1 text-gray-400">
            <span className="max-w-xs truncate">{currentFile}</span>
          </div>
        )}

        {/* Git branch */}
        {isGitRepo && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowBranchMenu(!showBranchMenu)}
              className="flex items-center gap-1 text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
            >
              <span className="git-branch-icon">{currentBranch || 'main'}</span>
            </button>

            {showBranchMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-gray-900 border border-gray-700 rounded shadow-lg z-50 min-w-48">
                <div className="p-2 border-b border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Branches</div>
                  {isLoading ? (
                    <div className="text-xs text-gray-500">Loading...</div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      {branches.map(branch => (
                        <button
                          key={branch.name}
                          onClick={() => checkoutBranch(branch.name)}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs rounded ${
                            branch.name === currentBranch
                              ? 'bg-blue-600 text-white'
                              : 'hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          <span className={branch.current ? 'font-bold' : ''}>
                            {branch.name}
                          </span>
                          {branch.current && <span className="text-xs">(current)</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <button
                    onClick={() => setShowCreateBranch(!showCreateBranch)}
                    className="w-full flex items-center gap-2 px-2 py-1 text-left text-xs text-gray-300 hover:bg-gray-700 rounded"
                  >
                    <span>+ New Branch</span>
                  </button>

                  {showCreateBranch && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="branch-name"
                        className="flex-1 px-2 py-1 bg-gray-800 text-xs rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            createNewBranch();
                          }
                        }}
                      />
                      <button
                        onClick={createNewBranch}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                      >
                        Create
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-gray-400">
        {/* Git status */}
        {gitStatus && (
          <div className="flex items-center gap-2">
            {gitStatus.changed > 0 && (
              <span className="text-yellow-400">M {gitStatus.changed}</span>
            )}
            {gitStatus.added > 0 && (
              <span className="text-green-400">A {gitStatus.added}</span>
            )}
            {gitStatus.deleted > 0 && (
              <span className="text-red-400">D {gitStatus.deleted}</span>
            )}
          </div>
        )}

        {/* Position */}
        <div className="flex items-center gap-1">
          <span>Ln 1, Col 1</span>
        </div>

        {/* Encoding */}
        <div>UTF-8</div>

        {/* Language */}
        {currentFile && (
          <div className="uppercase">
            {currentFile.split('.').pop() || 'text'}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusBar;
