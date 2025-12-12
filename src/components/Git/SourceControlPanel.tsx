/**
 * Source Control Panel
 *
 * Complete Git UI with visual staging, diff viewing, and history
 * Tabs: Changes | History | Branches
 */

import { useState, useEffect } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { gitService } from '@/services/git';
import type { GitStatus, GitCommit } from '@/types';
import { DiffViewer } from './DiffViewer';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';

type Tab = 'changes' | 'history' | 'branches' | 'stash';

export function SourceControlPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('changes');
  const { currentBranch, gitStatus, commits } = useIDEStore();
  const { activeWorkspaceId } = useWorkspaceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [diffFilePath, setDiffFilePath] = useState<string | null>(null);

  // Keyboard shortcuts
  // Git panel focus
  useHotkeys('ctrl+shift+g, cmd+shift+g', () => {
    toast.info('Git panel focused');
  }, { enableOnFormTags: true });

  // Quick commit from commit message textarea
  useHotkeys('ctrl+enter, cmd+enter', () => {
    if (activeTab === 'changes' && stagedFiles.length > 0 && commitMessage.trim()) {
      handleCommit();
    }
  }, { enableOnFormTags: true });

  // Refresh git status
  useHotkeys('ctrl+r, cmd+r', (e) => {
    e.preventDefault();
    handleRefresh();
    toast.info('Refreshing git status...');
  });

  // Stage all unstaged files
  useHotkeys('ctrl+shift+a, cmd+shift+a', () => {
    if (activeTab === 'changes' && unstagedFiles.length > 0) {
      handleStageAll();
      toast.success('Staged all files');
    }
  }, { enableOnFormTags: true });

  // Unstage all staged files
  useHotkeys('ctrl+shift+u, cmd+shift+u', () => {
    if (activeTab === 'changes' && stagedFiles.length > 0) {
      handleUnstageAll();
      toast.success('Unstaged all files');
    }
  }, { enableOnFormTags: true });

  // Tab navigation - Changes
  useHotkeys('ctrl+1, cmd+1', (e) => {
    e.preventDefault();
    setActiveTab('changes');
  }, { enableOnFormTags: true });

  // Tab navigation - History
  useHotkeys('ctrl+2, cmd+2', (e) => {
    e.preventDefault();
    setActiveTab('history');
  }, { enableOnFormTags: true });

  // Tab navigation - Branches
  useHotkeys('ctrl+3, cmd+3', (e) => {
    e.preventDefault();
    setActiveTab('branches');
  }, { enableOnFormTags: true });

  // Tab navigation - Stash
  useHotkeys('ctrl+4, cmd+4', (e) => {
    e.preventDefault();
    setActiveTab('stash');
  }, { enableOnFormTags: true });

  // Refresh git status
  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await gitService.initializeRepository('/repo');
    if (!result.success) {
      toast.error('Failed to refresh: ' + result.error);
    }
    setIsRefreshing(false);
  };

  // Auto-refresh on mount and workspace change
  useEffect(() => {
    handleRefresh();
  }, [activeWorkspaceId]);

  const stagedFiles = gitStatus.filter(f =>
    f.status === 'added' || f.status === 'modified' || f.status === 'deleted'
  );
  const unstagedFiles = gitStatus.filter(f =>
    f.status === 'unstaged' || f.status === 'untracked'
  );

  const handleStage = async (filepath: string) => {
    const result = await gitService.add('/repo', filepath);
    if (result.success) {
      await handleRefresh();
    } else {
      toast.error('Failed to stage: ' + result.error);
    }
  };

  const handleUnstage = async (filepath: string) => {
    const result = await gitService.remove('/repo', filepath);
    if (result.success) {
      await handleRefresh();
    } else {
      toast.error('Failed to unstage: ' + result.error);
    }
  };

  const handleStageAll = async () => {
    for (const file of unstagedFiles) {
      await gitService.add('/repo', file.path);
    }
    await handleRefresh();
  };

  const handleUnstageAll = async () => {
    for (const file of stagedFiles) {
      await gitService.remove('/repo', file.path);
    }
    await handleRefresh();
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    if (stagedFiles.length === 0) {
      toast.error('No staged changes to commit');
      return;
    }

    setIsCommitting(true);

    // Get author info from git config
    const author = {
      name: 'Browser IDE User',
      email: 'user@browser-ide.dev',
    };

    const result = await gitService.commit(commitMessage.trim(), author, '/repo');

    if (result.success) {
      setCommitMessage('');
      await handleRefresh();
      toast.success('Committed successfully!');
    } else {
      toast.error('Commit failed: ' + result.error);
    }
    setIsCommitting(false);
  };

  const handlePush = async () => {
    setIsPushing(true);
    const result = await gitService.push('', '/repo');

    if (result.success) {
      await handleRefresh();
      toast.success('Pushed successfully!');
    } else {
      toast.error('Push failed: ' + result.error);
    }
    setIsPushing(false);
  };

  const handlePull = async () => {
    setIsPulling(true);
    const result = await gitService.pull('', '/repo');

    if (result.success) {
      await handleRefresh();
      toast.success('Pulled successfully!');
    } else {
      toast.error('Pull failed: ' + result.error);
    }
    setIsPulling(false);
  };

  return (
    <div className="source-control-panel flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="panel-header px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-sm font-semibold">Source Control</span>
          <span className="text-xs text-gray-500">({gitStatus.length} changes)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePull}
            disabled={isPulling}
            className="px-2 py-1 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Pull from remote"
          >
            {isPulling ? '↓...' : '↓ Pull'}
          </button>
          <button
            onClick={handlePush}
            disabled={isPushing}
            className="px-2 py-1 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Push to remote"
          >
            {isPushing ? '↑...' : '↑ Push'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('changes')}
          className={`tab px-4 py-2 text-sm transition-colors ${
            activeTab === 'changes'
              ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          Changes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab px-4 py-2 text-sm transition-colors ${
            activeTab === 'history'
              ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={`tab px-4 py-2 text-sm transition-colors ${
            activeTab === 'branches'
              ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          Branches
        </button>
        <button
          onClick={() => setActiveTab('stash')}
          className={`tab px-4 py-2 text-sm transition-colors ${
            activeTab === 'stash'
              ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          Stash
        </button>
      </div>

      {/* Content */}
      <div className="panel-content flex-1 overflow-y-auto">
        {activeTab === 'changes' && (
          <ChangesView
            stagedFiles={stagedFiles}
            unstagedFiles={unstagedFiles}
            commitMessage={commitMessage}
            setCommitMessage={setCommitMessage}
            isCommitting={isCommitting}
            onStage={handleStage}
            onUnstage={handleUnstage}
            onStageAll={handleStageAll}
            onUnstageAll={handleUnstageAll}
            onCommit={handleCommit}
            onShowDiff={setDiffFilePath}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView commits={commits} currentBranch={currentBranch} />
        )}
        {activeTab === 'branches' && (
          <BranchesView currentBranch={currentBranch} onRefresh={handleRefresh} />
        )}
        {activeTab === 'stash' && (
          <StashView onRefresh={handleRefresh} />
        )}
      </div>

      {/* Diff Viewer */}
      {diffFilePath && (
        <DiffViewer filepath={diffFilePath} onClose={() => setDiffFilePath(null)} />
      )}
    </div>
  );
}

// Changes View Component
interface ChangesViewProps {
  stagedFiles: GitStatus[];
  unstagedFiles: GitStatus[];
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  isCommitting: boolean;
  onStage: (path: string) => void;
  onUnstage: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onCommit: () => void;
  onShowDiff: (path: string) => void;
}

function ChangesView({
  stagedFiles,
  unstagedFiles,
  commitMessage,
  setCommitMessage,
  isCommitting,
  onStage,
  onUnstage,
  onStageAll,
  onUnstageAll,
  onCommit,
  onShowDiff,
}: ChangesViewProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'modified':
      case 'unstaged':
        return <span className="text-yellow-400">M</span>;
      case 'added':
      case 'untracked':
        return <span className="text-green-400">A</span>;
      case 'deleted':
        return <span className="text-red-400">D</span>;
      default:
        return <span className="text-gray-400">?</span>;
    }
  };

  return (
    <div className="changes-view p-4 space-y-4">
      {/* Commit Box */}
      {stagedFiles.length > 0 && (
        <div className="commit-box bg-gray-800 rounded-lg p-4 space-y-2">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message (press Ctrl+Enter to commit)"
            className="w-full bg-gray-900 text-gray-100 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onCommit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {stagedFiles.length} {stagedFiles.length === 1 ? 'file' : 'files'} staged
            </span>
            <button
              onClick={onCommit}
              disabled={isCommitting || !commitMessage.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
            >
              {isCommitting ? 'Committing...' : 'Commit'}
            </button>
          </div>
        </div>
      )}

      {/* Staged Changes */}
      {stagedFiles.length > 0 && (
        <div className="staged-section">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">
              Staged Changes ({stagedFiles.length})
            </h3>
            <button
              onClick={onUnstageAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Unstage All
            </button>
          </div>
          <div className="space-y-1">
            {stagedFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => onShowDiff(file.path)}
                className="file-item flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 rounded cursor-pointer group"
              >
                <span className="w-5 text-center font-mono text-xs">
                  {getStatusIcon(file.status)}
                </span>
                <span className="flex-1 text-sm text-gray-200 truncate">
                  {file.path}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnstage(file.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-white"
                >
                  −
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unstaged Changes */}
      {unstagedFiles.length > 0 && (
        <div className="unstaged-section">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-300">
              Changes ({unstagedFiles.length})
            </h3>
            <button
              onClick={onStageAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Stage All
            </button>
          </div>
          <div className="space-y-1">
            {unstagedFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => onShowDiff(file.path)}
                className="file-item flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 rounded cursor-pointer group"
              >
                <span className="w-5 text-center font-mono text-xs">
                  {getStatusIcon(file.status)}
                </span>
                <span className="flex-1 text-sm text-gray-200 truncate">
                  {file.path}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStage(file.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-white"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Changes */}
      {stagedFiles.length === 0 && unstagedFiles.length === 0 && (
        <div className="no-changes text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No changes detected</p>
          <p className="text-xs mt-2">Your working tree is clean</p>
        </div>
      )}
    </div>
  );
}

// History View Component
interface HistoryViewProps {
  commits: GitCommit[];
  currentBranch: string;
}

function HistoryView({ commits, currentBranch }: HistoryViewProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = Date.now();
    const diff = now - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="history-view p-4">
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-gray-400">Branch:</span>
        <span className="text-blue-400 font-medium">{currentBranch}</span>
      </div>

      {commits.length === 0 && (
        <div className="no-commits text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No commits yet</p>
        </div>
      )}

      <div className="commits-list space-y-3">
        {commits.map((commit, index) => (
          <div
            key={commit.oid}
            className="commit-item bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {commit.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-100 truncate">
                    {commit.message.split('\n')[0]}
                  </span>
                  {index === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded">HEAD</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{commit.author.name}</span>
                  <span>•</span>
                  <span>{formatDate(commit.author.timestamp)}</span>
                  <span>•</span>
                  <span className="font-mono">{commit.oid.slice(0, 7)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Branches View Component
interface BranchesViewProps {
  currentBranch: string;
  onRefresh: () => void;
}

function BranchesView({ currentBranch, onRefresh }: BranchesViewProps) {
  const [branches, setBranches] = useState<Array<{ name: string; current: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load branches
  const loadBranches = async () => {
    setIsLoading(true);
    const result = await gitService.listBranches('/repo');
    if (result.success && result.data) {
      setBranches(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBranches();
  }, [currentBranch]);

  const handleCheckout = async (branchName: string) => {
    if (branchName === currentBranch) return;

    setIsLoading(true);
    const result = await gitService.checkout(branchName);

    if (result.success) {
      await gitService.initializeRepository('/repo');
      onRefresh();
      toast.success(`Switched to ${branchName}`);
    } else {
      toast.error('Failed to switch branch: ' + result.error);
    }
    setIsLoading(false);
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast.error('Please enter a branch name');
      return;
    }

    setIsCreating(true);
    const result = await gitService.createBranch('/repo', newBranchName.trim());

    if (result.success) {
      setNewBranchName('');
      setShowCreateBranch(false);
      await loadBranches();
      toast.success(`Created branch ${newBranchName}`);
    } else {
      toast.error('Failed to create branch: ' + result.error);
    }
    setIsCreating(false);
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      toast.error('Cannot delete the current branch');
      return;
    }

    if (!confirm(`Delete branch "${branchName}"?`)) {
      return;
    }

    const result = await gitService.deleteBranch('/repo', branchName);

    if (result.success) {
      await loadBranches();
      toast.success(`Deleted branch ${branchName}`);
    } else {
      toast.error('Failed to delete branch: ' + result.error);
    }
  };

  const handleMergeBranch = async (branchName: string) => {
    if (branchName === currentBranch) {
      toast.error('Cannot merge current branch into itself');
      return;
    }

    if (!confirm(`Merge "${branchName}" into "${currentBranch}"?`)) {
      return;
    }

    setIsLoading(true);
    const result = await gitService.merge(branchName, '/repo');

    if (result.success) {
      const mergeType = result.data?.fastForward ? 'Fast-forward' : 'Merge';
      toast.success(`${mergeType} merge completed: ${branchName} → ${currentBranch}`);
      await gitService.initializeRepository('/repo');
      onRefresh();
    } else {
      toast.error('Merge failed: ' + result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="branches-view p-4 space-y-4">
      {/* Create Branch */}
      <div className="create-branch">
        {!showCreateBranch ? (
          <button
            onClick={() => setShowCreateBranch(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            + New Branch
          </button>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="Branch name"
              className="w-full bg-gray-900 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateBranch();
                } else if (e.key === 'Escape') {
                  setShowCreateBranch(false);
                  setNewBranchName('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateBranch}
                disabled={isCreating || !newBranchName.trim()}
                className="flex-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateBranch(false);
                  setNewBranchName('');
                }}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Branches List */}
      <div className="branches-list space-y-1">
        {isLoading && branches.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">Loading branches...</div>
        )}

        {branches.map((branch) => (
          <div
            key={branch.name}
            className={`branch-item flex items-center gap-2 px-3 py-2 rounded cursor-pointer group ${
              branch.current
                ? 'bg-blue-900 text-white'
                : 'bg-gray-800 hover:bg-gray-750 text-gray-200'
            }`}
            onClick={() => handleCheckout(branch.name)}
          >
            {branch.current && (
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span className="flex-1 text-sm font-medium">{branch.name}</span>
            {!branch.current && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMergeBranch(branch.name);
                  }}
                  className="p-1 hover:bg-green-600 rounded text-gray-400 hover:text-white transition-colors"
                  title="Merge into current branch"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBranch(branch.name);
                  }}
                  className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors"
                  title="Delete branch"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {branches.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500 text-sm">No branches found</div>
        )}
      </div>
    </div>
  );
}

// Stash View Component
interface StashViewProps {
  onRefresh: () => void;
}

function StashView({ onRefresh }: StashViewProps) {
  const [stashes, setStashes] = useState<Array<{
    index: number;
    oid: string;
    message: string;
    timestamp: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stashMessage, setStashMessage] = useState('');
  const [isCreatingStash, setIsCreatingStash] = useState(false);

  // Load stashes
  const loadStashes = async () => {
    setIsLoading(true);
    const result = await gitService.stashList();
    if (result.success && result.data) {
      setStashes(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStashes();
  }, []);

  const handleCreateStash = async () => {
    setIsCreatingStash(true);
    const result = await gitService.stash(stashMessage || undefined, '/repo');

    if (result.success) {
      setStashMessage('');
      toast.success('Stash created successfully');
      await loadStashes();
      onRefresh();
    } else {
      toast.error('Failed to create stash: ' + result.error);
    }
    setIsCreatingStash(false);
  };

  const handleApplyStash = async (index: number) => {
    const result = await gitService.stashApply(index, '/repo');

    if (result.success) {
      toast.success('Stash applied successfully');
      onRefresh();
    } else {
      toast.error('Failed to apply stash: ' + result.error);
    }
  };

  const handlePopStash = async (index: number) => {
    const result = await gitService.stashPop(index, '/repo');

    if (result.success) {
      toast.success('Stash popped successfully');
      await loadStashes();
      onRefresh();
    } else {
      toast.error('Failed to pop stash: ' + result.error);
    }
  };

  const handleDropStash = async (index: number) => {
    if (!confirm(`Drop stash "${stashes[index].message}"?`)) {
      return;
    }

    const result = await gitService.stashDrop(index);

    if (result.success) {
      toast.success('Stash dropped');
      await loadStashes();
    } else {
      toast.error('Failed to drop stash: ' + result.error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="stash-view p-4 space-y-4">
      {/* Create Stash */}
      <div className="create-stash bg-gray-800 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Create New Stash</h3>
        <input
          type="text"
          value={stashMessage}
          onChange={(e) => setStashMessage(e.target.value)}
          placeholder="Stash message (optional)"
          className="w-full bg-gray-900 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleCreateStash}
          disabled={isCreatingStash}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
        >
          {isCreatingStash ? 'Stashing...' : '📦 Stash Changes'}
        </button>
      </div>

      {/* Stash List */}
      <div className="stash-list space-y-2">
        <h3 className="text-sm font-semibold text-gray-300">Stashed Changes ({stashes.length})</h3>

        {isLoading && stashes.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">Loading stashes...</div>
        )}

        {stashes.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm">No stashes yet</p>
            <p className="text-xs mt-2">Create a stash to save your work-in-progress</p>
          </div>
        )}

        {stashes.map((stash) => (
          <div
            key={stash.index}
            className="stash-item bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                {stash.index}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-100 truncate">
                    {stash.message}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{formatTimestamp(stash.timestamp)}</span>
                  <span>•</span>
                  <span className="font-mono">{stash.oid.slice(0, 7)}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleApplyStash(stash.index)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors"
                  title="Apply stash (keep in list)"
                >
                  Apply
                </button>
                <button
                  onClick={() => handlePopStash(stash.index)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
                  title="Apply and remove stash"
                >
                  Pop
                </button>
                <button
                  onClick={() => handleDropStash(stash.index)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors"
                  title="Delete stash"
                >
                  Drop
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
