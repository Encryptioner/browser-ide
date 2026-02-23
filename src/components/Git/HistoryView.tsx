/**
 * HistoryView - displays commit history for the current branch.
 */

import { sourceControlService } from '@/services/sourceControlService';
import type { GitCommit } from '@/types';

interface HistoryViewProps {
  commits: GitCommit[];
  currentBranch: string;
}

export function HistoryView({ commits, currentBranch }: HistoryViewProps) {
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
          <div key={commit.oid} className="commit-item bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {commit.author.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-100 truncate">{commit.message.split('\n')[0]}</span>
                  {index === 0 && <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded">HEAD</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{commit.author.name}</span>
                  <span>-</span>
                  <span>{sourceControlService.formatCommitDate(commit.author.timestamp)}</span>
                  <span>-</span>
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
