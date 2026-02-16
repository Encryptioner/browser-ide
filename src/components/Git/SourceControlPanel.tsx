/**
 * Source Control Panel
 *
 * Complete Git UI with visual staging, diff viewing, and history.
 * Tabs: Changes | History | Branches | Stash
 *
 * Business logic is delegated to sourceControlService.
 * Sub-views are extracted into separate component files.
 */

import { useState, useEffect } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { useShallow } from 'zustand/react/shallow';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { sourceControlService } from '@/services/sourceControlService';
import { DiffViewer } from './DiffViewer';
import { ChangesView } from './ChangesView';
import { HistoryView } from './HistoryView';
import { BranchesView } from './BranchesView';
import { StashView } from './StashView';
import { toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';

type Tab = 'changes' | 'history' | 'branches' | 'stash';

export function SourceControlPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('changes');

  const { currentBranch, gitStatus, commits } = useIDEStore(
    useShallow(state => ({
      currentBranch: state.currentBranch,
      gitStatus: state.gitStatus,
      commits: state.commits,
    }))
  );

  const { activeWorkspaceId } = useWorkspaceStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [diffFilePath, setDiffFilePath] = useState<string | null>(null);

  const stagedFiles = sourceControlService.getStagedFiles(gitStatus);
  const unstagedFiles = sourceControlService.getUnstagedFiles(gitStatus);

  // --- Handlers ---

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const result = await sourceControlService.refreshRepository();
    if (!result.success) {
      toast.error('Failed to refresh: ' + result.error);
    }
    setIsRefreshing(false);
  };

  const handleStage = async (filepath: string) => {
    const result = await sourceControlService.stageFile(filepath);
    if (result.success) {
      await handleRefresh();
    } else {
      toast.error('Failed to stage: ' + result.error);
    }
  };

  const handleUnstage = async (filepath: string) => {
    const result = await sourceControlService.unstageFile(filepath);
    if (result.success) {
      await handleRefresh();
    } else {
      toast.error('Failed to unstage: ' + result.error);
    }
  };

  const handleStageAll = async () => {
    await sourceControlService.stageAllFiles(unstagedFiles);
    await handleRefresh();
  };

  const handleUnstageAll = async () => {
    await sourceControlService.unstageAllFiles(stagedFiles);
    await handleRefresh();
  };

  const handleCommit = async () => {
    const result = await sourceControlService.commitChanges(commitMessage, stagedFiles.length);
    if (!result.success) {
      toast.error(result.error ?? 'Commit failed');
      return;
    }
    setCommitMessage('');
    setIsCommitting(true);
    await handleRefresh();
    toast.success('Committed successfully!');
    setIsCommitting(false);
  };

  const handlePush = async () => {
    setIsPushing(true);
    const result = await sourceControlService.pushToRemote();
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
    const result = await sourceControlService.pullFromRemote();
    if (result.success) {
      await handleRefresh();
      toast.success('Pulled successfully!');
    } else {
      toast.error('Pull failed: ' + result.error);
    }
    setIsPulling(false);
  };

  // --- Keyboard shortcuts ---

  useHotkeys('ctrl+shift+g, cmd+shift+g', () => {
    toast.info('Git panel focused');
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+enter, cmd+enter', () => {
    if (activeTab === 'changes' && stagedFiles.length > 0 && commitMessage.trim()) {
      handleCommit();
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+r, cmd+r', (e) => {
    e.preventDefault();
    handleRefresh();
    toast.info('Refreshing git status...');
  });

  useHotkeys('ctrl+shift+a, cmd+shift+a', () => {
    if (activeTab === 'changes' && unstagedFiles.length > 0) {
      handleStageAll();
      toast.success('Staged all files');
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+shift+u, cmd+shift+u', () => {
    if (activeTab === 'changes' && stagedFiles.length > 0) {
      handleUnstageAll();
      toast.success('Unstaged all files');
    }
  }, { enableOnFormTags: true });

  useHotkeys('ctrl+1, cmd+1', (e) => { e.preventDefault(); setActiveTab('changes'); }, { enableOnFormTags: true });
  useHotkeys('ctrl+2, cmd+2', (e) => { e.preventDefault(); setActiveTab('history'); }, { enableOnFormTags: true });
  useHotkeys('ctrl+3, cmd+3', (e) => { e.preventDefault(); setActiveTab('branches'); }, { enableOnFormTags: true });
  useHotkeys('ctrl+4, cmd+4', (e) => { e.preventDefault(); setActiveTab('stash'); }, { enableOnFormTags: true });

  // Auto-refresh on mount and workspace change
  useEffect(() => {
    handleRefresh();
  }, [activeWorkspaceId]);

  return (
    <div className="source-control-panel flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="panel-header px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-sm font-semibold">Source Control</span>
          <span className="text-xs text-gray-500">({gitStatus.length} changes)</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePull} disabled={isPulling} className="px-2 py-1 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Pull from remote">
            {isPulling ? '...' : 'Pull'}
          </button>
          <button onClick={handlePush} disabled={isPushing} className="px-2 py-1 hover:bg-gray-700 rounded text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Push to remote">
            {isPushing ? '...' : 'Push'}
          </button>
          <button onClick={handleRefresh} disabled={isRefreshing} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors disabled:opacity-50" title="Refresh">
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex bg-gray-800 border-b border-gray-700">
        {(['changes', 'history', 'branches', 'stash'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab px-4 py-2 text-sm transition-colors ${
              activeTab === tab
                ? 'bg-gray-900 text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
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

      {diffFilePath && (
        <DiffViewer filepath={diffFilePath} onClose={() => setDiffFilePath(null)} />
      )}
    </div>
  );
}
