/**
 * ChangesView - displays staged and unstaged file changes with commit box.
 */

import type { GitStatus } from '@/types';

interface ChangesViewProps {
  stagedFiles: GitStatus[];
  unstagedFiles: GitStatus[];
  commitMessage: string;
  setCommitMessage: (_value: string) => void;
  isCommitting: boolean;
  onStage: (_filepath: string) => void;
  onUnstage: (_filepath: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  onCommit: () => void;
  onShowDiff: (_filepath: string) => void;
}

function getStatusIcon(status: string) {
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
}

interface FileSectionProps {
  title: string;
  files: GitStatus[];
  actionLabel: string;
  onActionAll: () => void;
  onFileAction: (_filepath: string) => void;
  onShowDiff: (_filepath: string) => void;
  actionSymbol: string;
}

function FileSection({ title, files, actionLabel, onActionAll, onFileAction, onShowDiff, actionSymbol }: FileSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">{title} ({files.length})</h3>
        <button onClick={onActionAll} className="text-xs text-blue-400 hover:text-blue-300">{actionLabel}</button>
      </div>
      <div className="space-y-1">
        {files.map((file) => (
          <div key={file.path} onClick={() => onShowDiff(file.path)} className="file-item flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-750 rounded cursor-pointer group">
            <span className="w-5 text-center font-mono text-xs">{getStatusIcon(file.status)}</span>
            <span className="flex-1 text-sm text-gray-200 truncate">{file.path}</span>
            <button onClick={(e) => { e.stopPropagation(); onFileAction(file.path); }} className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-white">
              {actionSymbol}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChangesView({ stagedFiles, unstagedFiles, commitMessage, setCommitMessage, isCommitting, onStage, onUnstage, onStageAll, onUnstageAll, onCommit, onShowDiff }: ChangesViewProps) {
  return (
    <div className="changes-view p-4 space-y-4">
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
            <button onClick={onCommit} disabled={isCommitting || !commitMessage.trim()} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors">
              {isCommitting ? 'Committing...' : 'Commit'}
            </button>
          </div>
        </div>
      )}

      {stagedFiles.length > 0 && (
        <FileSection title="Staged Changes" files={stagedFiles} actionLabel="Unstage All" onActionAll={onUnstageAll} onFileAction={onUnstage} onShowDiff={onShowDiff} actionSymbol="-" />
      )}

      {unstagedFiles.length > 0 && (
        <FileSection title="Changes" files={unstagedFiles} actionLabel="Stage All" onActionAll={onStageAll} onFileAction={onStage} onShowDiff={onShowDiff} actionSymbol="+" />
      )}

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
