import { ToolCallCard } from './ToolCallCard';

interface FileEditCardProps {
  fileName: string;
  operation: 'read' | 'write' | 'edit';
  status: 'running' | 'success' | 'error';
  timestamp: number;
  detail?: string;
  onOpenDiff?: () => void;
}

const operationConfig = {
  read: { icon: '📖', label: 'Read' },
  write: { icon: '✏️', label: 'Write' },
  edit: { icon: '🔧', label: 'Edit' },
} as const;

export function FileEditCard({
  fileName,
  operation,
  status,
  timestamp,
  detail,
  onOpenDiff,
}: FileEditCardProps) {
  const config = operationConfig[operation];

  return (
    <ToolCallCard
      title={`${config.label}: ${fileName}`}
      icon={<span>{config.icon}</span>}
      status={status}
      timestamp={timestamp}
    >
      {detail && (
        <pre className="mt-2 text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-950 rounded p-2">
          {detail}
        </pre>
      )}
      {onOpenDiff && operation !== 'read' && status === 'success' && (
        <button
          type="button"
          className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
          onClick={onOpenDiff}
        >
          View diff
        </button>
      )}
    </ToolCallCard>
  );
}
