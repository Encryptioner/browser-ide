import { ToolCallCard } from './ToolCallCard';

interface CommandCardProps {
  command: string;
  status: 'running' | 'success' | 'error';
  timestamp: number;
  output?: string;
  exitCode?: number;
}

export function CommandCard({
  command,
  status,
  timestamp,
  output,
  exitCode,
}: CommandCardProps) {
  return (
    <ToolCallCard
      title={`$ ${command}`}
      icon={<span className="text-purple-400">&#9654;</span>}
      status={status}
      timestamp={timestamp}
    >
      {output && (
        <pre className="mt-2 text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-gray-950 rounded p-2">
          {output}
        </pre>
      )}
      {exitCode !== undefined && status !== 'running' && (
        <span
          className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded ${
            exitCode === 0
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          exit {exitCode}
        </span>
      )}
    </ToolCallCard>
  );
}
