/**
 * Diff Viewer Component
 *
 * Displays a rich diff view for file changes using line-by-line comparison
 * Supports additions, deletions, and modifications with syntax highlighting
 */

import { useMemo } from 'react';

export interface DiffLine {
  lineNumber: number;
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
}

export interface DiffViewerProps {
  /** Original file content */
  original: string;
  /** Modified file content */
  modified: string;
  /** Filename to display */
  filename?: string;
  /** Language for syntax highlighting */
  language?: string;
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
}

/**
 * Simple line-by-line diff algorithm
 * Based on the Longest Common Subsequence (LCS) approach
 */
function computeDiff(original: string[], modified: string[]): DiffLine[] {
  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < original.length || j < modified.length) {
    if (i < original.length && j < modified.length && original[i] === modified[j]) {
      // Lines are equal - context
      diff.push({
        lineNumber: i + 1,
        type: 'context',
        content: original[i],
      });
      i++;
      j++;
    } else if (j < modified.length && (i >= original.length || !original.includes(modified[j], i))) {
      // Line was added
      diff.push({
        lineNumber: j + 1,
        type: 'add',
        content: modified[j],
      });
      j++;
    } else if (i < original.length && (j >= modified.length || !modified.includes(original[i], j))) {
      // Line was removed
      diff.push({
        lineNumber: i + 1,
        type: 'remove',
        content: original[i],
      });
      i++;
    } else {
      // Fallback - treat both as context
      if (i < original.length) {
        diff.push({
          lineNumber: i + 1,
          type: 'context',
          content: original[i],
        });
        i++;
      }
      if (j < modified.length) {
        diff.push({
          lineNumber: j + 1,
          type: 'context',
          content: modified[j],
        });
        j++;
      }
    }
  }

  return diff;
}

/**
 * Group consecutive changes into hunks for better readability
 */
function groupHunks(diff: DiffLine[], contextSize = 3): DiffLine[][] {
  const hunks: DiffLine[][] = [];
  let currentHunk: DiffLine[] = [];

  for (const line of diff) {
    if (line.type === 'context') {
      currentHunk.push(line);

      // Check if we should end the hunk
      const trailingContext = currentHunk.filter((l, idx) =>
        idx > currentHunk.length - contextSize - 1 && l.type === 'context'
      ).length;

      if (currentHunk.length > contextSize * 2 && trailingContext > contextSize) {
        // Trim trailing context and end hunk
        const trimmedHunk = currentHunk.slice(0, -contextSize);
        hunks.push(trimmedHunk);
        currentHunk = currentHunk.slice(-contextSize);
      }
    } else {
      currentHunk.push(line);
    }
  }

  if (currentHunk.length > 0) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export function DiffViewer({
  original,
  modified,
  filename = 'file',
  language = 'text',
  showLineNumbers = true,
}: DiffViewerProps) {
  const diffData = useMemo(() => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    return computeDiff(originalLines, modifiedLines);
  }, [original, modified]);

  const hunks = useMemo(() => groupHunks(diffData), [diffData]);

  const stats = useMemo(() => {
    const additions = diffData.filter((l) => l.type === 'add').length;
    const deletions = diffData.filter((l) => l.type === 'remove').length;
    return { additions, deletions };
  }, [diffData]);

  const hasChanges = stats.additions > 0 || stats.deletions > 0;

  const getLineClass = (line: DiffLine): string => {
    switch (line.type) {
      case 'add':
        return 'bg-green-500/10 border-l-2 border-green-500';
      case 'remove':
        return 'bg-red-500/10 border-l-2 border-red-500';
      case 'context':
        return 'bg-gray-800/30';
      case 'header':
        return 'bg-gray-700/50 text-gray-400 italic';
      default:
        return '';
    }
  };

  const getLineNumber = (line: DiffLine, index: number): string => {
    if (!showLineNumbers) return '';
    if (line.type === 'add') return '+';
    if (line.type === 'remove') return '-';
    return String(index + 1);
  };

  if (!hasChanges) {
    return (
      <div className="diff-viewer p-4 bg-gray-900 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400 py-8">
          <span className="text-2xl mb-2 block">✓</span>
          <p>No changes detected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="diff-viewer bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="diff-header bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 font-mono text-sm">{filename}</span>
          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-gray-400">{language}</span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {stats.additions > 0 && (
            <span className="text-green-400">+{stats.additions}</span>
          )}
          {stats.deletions > 0 && (
            <span className="text-red-400">-{stats.deletions}</span>
          )}
        </div>
      </div>

      {/* Diff content */}
      <div className="diff-content overflow-auto max-h-96">
        {hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex} className="diff-hunk">
            {hunkIndex > 0 && (
              <div className="hunk-separator bg-gray-700/50 text-gray-500 text-xs px-4 py-1 text-center">
                ...
              </div>
            )}
            <div className="font-mono text-sm">
              {hunk.map((line, lineIndex) => (
                <div
                  key={`${hunkIndex}-${lineIndex}`}
                  className={`diff-line flex ${getLineClass(line)} px-2`}
                >
                  {showLineNumbers && (
                    <span className={`line-number w-8 flex-shrink-0 text-right pr-3 select-none ${
                      line.type === 'add' ? 'text-green-500' :
                      line.type === 'remove' ? 'text-red-500' :
                      'text-gray-600'
                    }`}>
                      {getLineNumber(line, lineIndex)}
                    </span>
                  )}
                  <span className={`line-content flex-1 py-0.5 ${
                    line.type === 'add' ? 'text-green-300' :
                    line.type === 'remove' ? 'text-red-300' :
                    'text-gray-300'
                  }`}>
                    {line.content || ' '}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="diff-legend bg-gray-800 px-4 py-2 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-500/20 border-l-2 border-green-500 rounded"></span>
          Added
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500/20 border-l-2 border-red-500 rounded"></span>
          Removed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-800/30 rounded"></span>
          Unchanged
        </span>
      </div>
    </div>
  );
}

/**
 * Inline diff viewer for showing changes within a single line
 */
export interface InlineDiffProps {
  /** Original content */
  original: string;
  /** Modified content */
  modified: string;
}

export function InlineDiff({ original, modified }: InlineDiffProps) {
  const changes = useMemo(() => {
    if (original === modified) {
      return [{ type: 'context' as const, content: original }];
    }

    // Simple word-by-word comparison
    const originalWords = original.split(/(\s+)/);
    const modifiedWords = modified.split(/(\s+)/);
    const changes: { type: 'add' | 'remove' | 'context'; content: string }[] = [];

    let i = 0;
    let j = 0;

    while (i < originalWords.length || j < modifiedWords.length) {
      if (i < originalWords.length && j < modifiedWords.length && originalWords[i] === modifiedWords[j]) {
        changes.push({ type: 'context', content: originalWords[i] });
        i++;
        j++;
      } else if (j < modifiedWords.length) {
        changes.push({ type: 'add', content: modifiedWords[j] });
        j++;
      } else if (i < originalWords.length) {
        changes.push({ type: 'remove', content: originalWords[i] });
        i++;
      }
    }

    return changes;
  }, [original, modified]);

  return (
    <span className="inline-diff font-mono">
      {changes.map((change, index) => (
        <span
          key={index}
          className={
            change.type === 'add' ? 'bg-green-500/20 text-green-300' :
            change.type === 'remove' ? 'bg-red-500/20 text-red-300 line-through' :
            ''
          }
        >
          {change.content}
        </span>
      ))}
    </span>
  );
}
