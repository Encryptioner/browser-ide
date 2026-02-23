import { ToolCallCard } from './ToolCallCard';

interface SearchResult {
  file: string;
  line?: number;
  match?: string;
}

interface SearchCardProps {
  query: string;
  status: 'running' | 'success' | 'error';
  timestamp: number;
  results?: SearchResult[];
  // eslint-disable-next-line no-unused-vars
  onOpenFile?: (file: string, line?: number) => void;
}

export function SearchCard({
  query,
  status,
  timestamp,
  results,
  onOpenFile,
}: SearchCardProps) {
  return (
    <ToolCallCard
      title={`Search: "${query}"`}
      icon={<span className="text-cyan-400">&#128269;</span>}
      status={status}
      timestamp={timestamp}
      defaultExpanded={status === 'success' && (results?.length ?? 0) > 0}
    >
      {results && results.length > 0 ? (
        <ul className="mt-2 space-y-0.5">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline text-left w-full truncate"
                onClick={() => onOpenFile?.(r.file, r.line)}
              >
                {r.file}
                {r.line !== undefined && `:${r.line}`}
                {r.match && (
                  <span className="text-gray-500 ml-2">{r.match}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        status === 'success' && (
          <p className="mt-2 text-xs text-gray-500 italic">No results found</p>
        )
      )}
    </ToolCallCard>
  );
}
