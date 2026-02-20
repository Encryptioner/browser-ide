import { useEffect, useRef, useState, useCallback, memo } from 'react';
import type { ElementType } from 'react';
import {
  Eye,
  Pencil,
  FileEdit,
  TerminalSquare,
  Search,
  GitBranch,
  Info,
  AlertCircle,
  Check,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaudeTerminalEntry {
  id: string;
  timestamp: number;
  type:
    | 'file_read'
    | 'file_write'
    | 'file_edit'
    | 'command'
    | 'search'
    | 'git'
    | 'info'
    | 'error';
  title: string;
  detail?: string;
  status: 'running' | 'success' | 'error';
}

interface ClaudeTerminalProps {
  entries: ClaudeTerminalEntry[];
  isAgentRunning: boolean;
  onClear?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENTRY_TYPE_CONFIG: Record<
  ClaudeTerminalEntry['type'],
  { icon: ElementType; colorClass: string; label: string }
> = {
  file_read: { icon: Eye, colorClass: 'text-blue-400', label: 'READ' },
  file_write: { icon: Pencil, colorClass: 'text-green-400', label: 'WRITE' },
  file_edit: { icon: FileEdit, colorClass: 'text-yellow-400', label: 'EDIT' },
  command: { icon: TerminalSquare, colorClass: 'text-purple-400', label: 'CMD' },
  search: { icon: Search, colorClass: 'text-cyan-400', label: 'SEARCH' },
  git: { icon: GitBranch, colorClass: 'text-orange-400', label: 'GIT' },
  info: { icon: Info, colorClass: 'text-gray-400', label: 'INFO' },
  error: { icon: AlertCircle, colorClass: 'text-red-400', label: 'ERR' },
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

// ---------------------------------------------------------------------------
// Entry row (memoized)
// ---------------------------------------------------------------------------

interface EntryRowProps {
  entry: ClaudeTerminalEntry;
}

const EntryRow = memo(function EntryRow({ entry }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const config = ENTRY_TYPE_CONFIG[entry.type];
  const IconComponent = config.icon;

  const toggle = useCallback(() => {
    if (!entry.detail) return;
    setExpanded(prev => !prev);
  }, [entry.detail]);

  return (
    <div
      className="claude-terminal-entry group"
      data-testid="claude-terminal-entry"
    >
      {/* Main row */}
      <button
        type="button"
        className={clsx(
          'flex w-full items-center gap-2 px-3 py-1 text-left',
          'hover:bg-white/5 transition-colors',
          entry.detail && 'cursor-pointer',
          !entry.detail && 'cursor-default',
        )}
        onClick={toggle}
        aria-expanded={entry.detail ? expanded : undefined}
      >
        {/* Timestamp */}
        <span className="shrink-0 text-gray-500 select-none" data-testid="entry-timestamp">
          [{formatTimestamp(entry.timestamp)}]
        </span>

        {/* Type icon */}
        <span className={clsx('shrink-0', config.colorClass)} data-testid="entry-icon">
          <IconComponent size={14} aria-hidden="true" />
        </span>

        {/* Title */}
        <span className="min-w-0 flex-1 truncate text-gray-200">{entry.title}</span>

        {/* Status indicator */}
        <span className="shrink-0" data-testid="entry-status">
          {entry.status === 'running' && (
            <Loader2 size={14} className="animate-spin text-blue-400" aria-label="running" />
          )}
          {entry.status === 'success' && (
            <Check size={14} className="text-green-400" aria-label="success" />
          )}
          {entry.status === 'error' && (
            <X size={14} className="text-red-400" aria-label="error" />
          )}
        </span>
      </button>

      {/* Expandable detail */}
      {expanded && entry.detail && (
        <div className="border-l-2 border-gray-700 mx-3 mb-1 ml-6">
          <pre
            className={clsx(
              'overflow-x-auto whitespace-pre-wrap break-words p-2 text-xs',
              'bg-gray-900/60 text-gray-300 rounded',
            )}
            data-testid="entry-detail"
          >
            <code>{entry.detail}</code>
          </pre>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ClaudeTerminal({ entries, isAgentRunning, onClear }: ClaudeTerminalProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    logger.debug('ClaudeTerminal entries updated', { count: entries.length }, 'ClaudeTerminal');
  }, [entries]);

  return (
    <div
      className="claude-terminal flex h-full flex-col bg-gray-950 font-mono text-[13px]"
      data-testid="claude-terminal"
    >
      {/* Header */}
      <div className="claude-terminal-header flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Claude Activity</span>
          {isAgentRunning && (
            <span
              className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"
              data-testid="agent-running-indicator"
              aria-label="Agent is running"
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500" data-testid="entry-count">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
          {onClear && (
            <button
              type="button"
              className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              onClick={onClear}
              title="Clear activity log"
              aria-label="Clear activity log"
              data-testid="clear-button"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        data-testid="claude-terminal-scroll"
      >
        {entries.length === 0 ? (
          <div
            className="flex h-full items-center justify-center p-4 text-center text-sm text-gray-600"
            data-testid="empty-state"
          >
            No agent activity yet. Start a task in agent mode.
          </div>
        ) : (
          entries.map(entry => <EntryRow key={entry.id} entry={entry} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ClaudeTerminal;
