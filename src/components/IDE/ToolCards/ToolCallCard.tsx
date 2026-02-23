import { useState, type ReactNode } from 'react';
import clsx from 'clsx';

export interface ToolCallCardProps {
  title: string;
  icon: ReactNode;
  status: 'running' | 'success' | 'error';
  timestamp: number;
  children?: ReactNode;
  defaultExpanded?: boolean;
}

const statusColors = {
  running: 'text-blue-400',
  success: 'text-green-400',
  error: 'text-red-400',
} as const;

const statusLabels = {
  running: 'Running...',
  success: 'Done',
  error: 'Failed',
} as const;

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export function ToolCallCard({
  title,
  icon,
  status,
  timestamp,
  children,
  defaultExpanded = false,
}: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className={clsx(
        'rounded border bg-gray-900/50 my-1 overflow-hidden transition-colors',
        status === 'error' ? 'border-red-800/50' : 'border-gray-700/50'
      )}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="flex-shrink-0 text-sm">{icon}</span>
        <span className="flex-1 text-sm text-gray-300 truncate font-mono">
          {title}
        </span>
        <span className={clsx('text-xs flex-shrink-0', statusColors[status])}>
          {status === 'running' && (
            <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-1" />
          )}
          {statusLabels[status]}
        </span>
        <span className="text-xs text-gray-600 flex-shrink-0 tabular-nums">
          {formatTime(timestamp)}
        </span>
        <span
          className={clsx(
            'text-gray-500 text-xs transition-transform flex-shrink-0',
            expanded && 'rotate-90'
          )}
        >
          &#9654;
        </span>
      </button>

      {expanded && children && (
        <div className="px-3 pb-2 border-t border-gray-800/50">
          {children}
        </div>
      )}
    </div>
  );
}
