/**
 * StashView - displays stash list with create, apply, pop, and drop actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { sourceControlService } from '@/services/sourceControlService';
import type { StashEntry } from '@/services/sourceControlService';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface StashViewProps {
  onRefresh: () => void;
}

export function StashView({ onRefresh }: StashViewProps) {
  const [stashes, setStashes] = useState<StashEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stashMessage, setStashMessage] = useState('');
  const [isCreatingStash, setIsCreatingStash] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const loadStashList = async () => {
    setIsLoading(true);
    const result = await sourceControlService.loadStashes();
    if (result.success && result.data) {
      setStashes(result.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadStashList();
  }, []);

  const handleCreateStash = async () => {
    setIsCreatingStash(true);
    const result = await sourceControlService.createStash(stashMessage || undefined);
    if (result.success) {
      setStashMessage('');
      toast.success('Stash created successfully');
      await loadStashList();
      onRefresh();
    } else {
      toast.error('Failed to create stash: ' + result.error);
    }
    setIsCreatingStash(false);
  };

  const handleApplyStash = async (index: number) => {
    const result = await sourceControlService.applyStash(index);
    if (result.success) {
      toast.success('Stash applied successfully');
      onRefresh();
    } else {
      toast.error('Failed to apply stash: ' + result.error);
    }
  };

  const handlePopStash = async (index: number) => {
    const result = await sourceControlService.popStash(index);
    if (result.success) {
      toast.success('Stash popped successfully');
      await loadStashList();
      onRefresh();
    } else {
      toast.error('Failed to pop stash: ' + result.error);
    }
  };

  const handleDropStash = useCallback((index: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Drop Stash',
      message: `Drop stash "${stashes[index].message}"?`,
      onConfirm: async () => {
        const result = await sourceControlService.dropStash(index);
        if (result.success) {
          toast.success('Stash dropped');
          await loadStashList();
        } else {
          toast.error('Failed to drop stash: ' + result.error);
        }
        setConfirmDialog(null);
      },
    });
  }, [stashes]);

  return (
    <div className="stash-view p-4 space-y-4">
      <div className="create-stash bg-gray-800 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Create New Stash</h3>
        <input type="text" value={stashMessage} onChange={(e) => setStashMessage(e.target.value)} placeholder="Stash message (optional)" className="w-full bg-gray-900 text-gray-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={handleCreateStash} disabled={isCreatingStash} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors">
          {isCreatingStash ? 'Stashing...' : 'Stash Changes'}
        </button>
      </div>

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
          <div key={stash.index} className="stash-item bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                {stash.index}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-100 truncate">{stash.message}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{sourceControlService.formatStashTimestamp(stash.timestamp)}</span>
                  <span>-</span>
                  <span className="font-mono">{stash.oid.slice(0, 7)}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => handleApplyStash(stash.index)} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-medium transition-colors" title="Apply stash (keep in list)">Apply</button>
                <button onClick={() => handlePopStash(stash.index)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors" title="Apply and remove stash">Pop</button>
                <button onClick={() => handleDropStash(stash.index)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-medium transition-colors" title="Delete stash">Drop</button>
              </div>
            </div>
          </div>
        ))}
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
