/**
 * BranchesView - displays branches with checkout, create, delete, and merge actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { sourceControlService } from '@/services/sourceControlService';
import type { BranchInfo } from '@/services/sourceControlService';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface BranchesViewProps {
  currentBranch: string;
  onRefresh: () => void;
}

export function BranchesView({ currentBranch, onRefresh }: BranchesViewProps) {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const loadBranchList = async () => {
    setIsLoading(true);
    const result = await sourceControlService.loadBranches();
    if (result.success && result.data) {
      setBranches(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBranchList();
  }, [currentBranch]);

  const handleCheckout = async (branchName: string) => {
    if (branchName === currentBranch) return;
    setIsLoading(true);
    const result = await sourceControlService.checkoutBranch(branchName);
    if (result.success) {
      onRefresh();
      toast.success(`Switched to ${branchName}`);
    } else {
      toast.error('Failed to switch branch: ' + result.error);
    }
    setIsLoading(false);
  };

  const handleCreateBranch = async () => {
    setIsCreating(true);
    const result = await sourceControlService.createBranch(newBranchName);
    if (result.success) {
      setNewBranchName('');
      setShowCreateBranch(false);
      await loadBranchList();
      toast.success(`Created branch ${newBranchName}`);
    } else {
      toast.error('Failed to create branch: ' + (result.error ?? ''));
    }
    setIsCreating(false);
  };

  const handleDeleteBranch = useCallback((branchName: string) => {
    if (branchName === currentBranch) {
      toast.error('Cannot delete the current branch');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Branch',
      message: `Are you sure you want to delete branch "${branchName}"?`,
      onConfirm: async () => {
        const result = await sourceControlService.deleteBranch(branchName, currentBranch);
        if (result.success) {
          await loadBranchList();
          toast.success(`Deleted branch ${branchName}`);
        } else {
          toast.error('Failed to delete branch: ' + result.error);
        }
        setConfirmDialog(null);
      },
    });
  }, [currentBranch]);

  const handleMergeBranch = useCallback((branchName: string) => {
    if (branchName === currentBranch) {
      toast.error('Cannot merge current branch into itself');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Merge Branch',
      message: `Merge "${branchName}" into "${currentBranch}"?`,
      onConfirm: async () => {
        setIsLoading(true);
        const result = await sourceControlService.mergeBranch(branchName, currentBranch);
        if (result.success) {
          toast.success(`${result.data?.mergeType} merge completed: ${branchName} -> ${currentBranch}`);
          onRefresh();
        } else {
          toast.error('Merge failed: ' + result.error);
        }
        setIsLoading(false);
        setConfirmDialog(null);
      },
    });
  }, [currentBranch, onRefresh]);

  return (
    <div className="branches-view p-4 space-y-4">
      <div className="create-branch">
        {!showCreateBranch ? (
          <button onClick={() => setShowCreateBranch(true)} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors">
            + New Branch
          </button>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <input type="text" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Branch name" className="w-full bg-gray-900 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBranch(); else if (e.key === 'Escape') { setShowCreateBranch(false); setNewBranchName(''); } }} autoFocus />
            <div className="flex gap-2">
              <button onClick={handleCreateBranch} disabled={isCreating || !newBranchName.trim()} className="flex-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors">
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => { setShowCreateBranch(false); setNewBranchName(''); }} className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="branches-list space-y-1">
        {isLoading && branches.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">Loading branches...</div>
        )}

        {branches.map((branch) => (
          <div key={branch.name} className={`branch-item flex items-center gap-2 px-3 py-2 rounded cursor-pointer group ${branch.current ? 'bg-blue-900 text-white' : 'bg-gray-800 hover:bg-gray-750 text-gray-200'}`} onClick={() => handleCheckout(branch.name)}>
            {branch.current && (
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            <span className="flex-1 text-sm font-medium">{branch.name}</span>
            {!branch.current && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={(e) => { e.stopPropagation(); handleMergeBranch(branch.name); }} className="p-1 hover:bg-green-600 rounded text-gray-400 hover:text-white transition-colors" title="Merge into current branch">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.name); }} className="p-1 hover:bg-red-600 rounded text-gray-400 hover:text-white transition-colors" title="Delete branch">
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

      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        onClose={() => setConfirmDialog(null)}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        onConfirm={confirmDialog?.onConfirm ?? (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}
