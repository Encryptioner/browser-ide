/**
 * Diff Viewer Component
 *
 * Side-by-side or unified diff view for file changes
 * Supports syntax highlighting and inline change indicators
 * Uses character-level diff highlighting for precise change visualization
 */

import { useState, useEffect } from 'react';
import { gitService } from '@/services/git';
import * as Diff from 'diff';

interface DiffViewerProps {
  filepath: string;
  onClose: () => void;
}

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  // Character-level changes for improved visualization
  changes?: Array<{ added?: boolean; removed?: boolean; value: string }>;
}

export function DiffViewer({ filepath, onClose }: DiffViewerProps) {
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDiff();
  }, [filepath]);

  const loadDiff = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get file diff from git
      const result = await gitService.diff('/repo', filepath);

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to load diff');
        setIsLoading(false);
        return;
      }

      // Parse diff into lines
      const lines = parseDiff(result.data);
      setDiffLines(lines);
    } catch (err: any) {
      setError(err.message);
    }

    setIsLoading(false);
  };

  /**
   * Compute character-level differences between two lines
   * Used to highlight specific changes within modified lines
   */
  const computeIntraLineDiff = (oldLine: string, newLine: string) => {
    const changes = Diff.diffChars(oldLine, newLine);
    return changes;
  };

  const parseDiff = (diffText: string): DiffLine[] => {
    const lines: DiffLine[] = [];
    const diffLines = diffText.split('\n');

    let oldLineNum = 0;
    let newLineNum = 0;

    // Track consecutive removed/added lines for character-level diff
    const pendingRemoved: Array<{ content: string; lineNum: number }> = [];
    const pendingAdded: Array<{ content: string; lineNum: number }> = [];

    const flushPending = () => {
      // If we have matching removed/added pairs, compute character-level diffs
      if (pendingRemoved.length > 0 && pendingAdded.length > 0) {
        const minLength = Math.min(pendingRemoved.length, pendingAdded.length);

        for (let i = 0; i < minLength; i++) {
          const removed = pendingRemoved[i];
          const added = pendingAdded[i];
          const changes = computeIntraLineDiff(removed.content, added.content);

          lines.push({
            type: 'remove',
            oldLineNumber: removed.lineNum,
            content: removed.content,
            changes: changes,
          });

          lines.push({
            type: 'add',
            newLineNumber: added.lineNum,
            content: added.content,
            changes: changes,
          });
        }

        // Add remaining removed lines without character diff
        for (let i = minLength; i < pendingRemoved.length; i++) {
          lines.push({
            type: 'remove',
            oldLineNumber: pendingRemoved[i].lineNum,
            content: pendingRemoved[i].content,
          });
        }

        // Add remaining added lines without character diff
        for (let i = minLength; i < pendingAdded.length; i++) {
          lines.push({
            type: 'add',
            newLineNumber: pendingAdded[i].lineNum,
            content: pendingAdded[i].content,
          });
        }
      } else {
        // No matching pairs, add as-is
        pendingRemoved.forEach(({ content, lineNum }) => {
          lines.push({
            type: 'remove',
            oldLineNumber: lineNum,
            content,
          });
        });

        pendingAdded.forEach(({ content, lineNum }) => {
          lines.push({
            type: 'add',
            newLineNumber: lineNum,
            content,
          });
        });
      }

      pendingRemoved.length = 0;
      pendingAdded.length = 0;
    };

    for (const line of diffLines) {
      if (line.startsWith('@@')) {
        flushPending();

        // Parse hunk header: @@ -oldStart,oldCount +newStart,newCount @@
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLineNum = parseInt(match[1]);
          newLineNum = parseInt(match[2]);
        }
        lines.push({
          type: 'header',
          content: line,
        });
      } else if (line.startsWith('+')) {
        pendingAdded.push({
          content: line.slice(1),
          lineNum: newLineNum++,
        });
      } else if (line.startsWith('-')) {
        pendingRemoved.push({
          content: line.slice(1),
          lineNum: oldLineNum++,
        });
      } else if (!line.startsWith('\\')) {
        flushPending();

        // Context line
        lines.push({
          type: 'context',
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
          content: line.slice(1) || line,
        });
      }
    }

    // Flush any remaining pending lines
    flushPending();

    return lines;
  };

  return (
    <div className="diff-viewer fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="diff-container bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="diff-header px-6 py-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-100">Diff: {filepath}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'unified'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Unified
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'split'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Split
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="diff-content flex-1 overflow-hidden">
          {isLoading && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm">Loading diff...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full text-red-400">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="h-full overflow-auto">
              {viewMode === 'unified' ? (
                <UnifiedDiffView lines={diffLines} />
              ) : (
                <SplitDiffView lines={diffLines} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Unified Diff View with character-level highlighting
function UnifiedDiffView({ lines }: { lines: DiffLine[] }) {
  const renderLineContent = (line: DiffLine) => {
    // If we have character-level changes, render them with highlighting
    if (line.changes && line.changes.length > 0) {
      return (
        <>
          {line.changes.map((change, idx) => {
            if (change.added && line.type === 'add') {
              return (
                <span key={idx} className="bg-green-500 bg-opacity-40">
                  {change.value}
                </span>
              );
            } else if (change.removed && line.type === 'remove') {
              return (
                <span key={idx} className="bg-red-500 bg-opacity-40">
                  {change.value}
                </span>
              );
            } else {
              return <span key={idx}>{change.value}</span>;
            }
          })}
        </>
      );
    }

    // Otherwise, render plain content
    return line.content;
  };

  return (
    <div className="unified-diff font-mono text-sm">
      {lines.map((line, index) => {
        let bgColor = '';
        let textColor = 'text-gray-300';
        let borderColor = '';

        if (line.type === 'add') {
          bgColor = 'bg-green-900 bg-opacity-30';
          textColor = 'text-green-300';
          borderColor = 'border-l-4 border-green-500';
        } else if (line.type === 'remove') {
          bgColor = 'bg-red-900 bg-opacity-30';
          textColor = 'text-red-300';
          borderColor = 'border-l-4 border-red-500';
        } else if (line.type === 'header') {
          bgColor = 'bg-blue-900 bg-opacity-30';
          textColor = 'text-blue-300';
        }

        return (
          <div
            key={index}
            className={`diff-line flex ${bgColor} ${borderColor} hover:bg-opacity-50`}
          >
            <div className="line-numbers flex gap-2 px-4 py-1 bg-gray-800 bg-opacity-50 text-gray-500 select-none">
              <span className="w-12 text-right">
                {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
              </span>
              <span className="w-12 text-right">
                {line.newLineNumber !== undefined ? line.newLineNumber : ''}
              </span>
            </div>
            <pre className={`flex-1 px-4 py-1 ${textColor} whitespace-pre-wrap break-all`}>
              {renderLineContent(line)}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

// Split Diff View with character-level highlighting
function SplitDiffView({ lines }: { lines: DiffLine[] }) {
  const renderLineContent = (line: DiffLine) => {
    // If we have character-level changes, render them with highlighting
    if (line.changes && line.changes.length > 0) {
      return (
        <>
          {line.changes.map((change, idx) => {
            if (change.added && line.type === 'add') {
              return (
                <span key={idx} className="bg-green-500 bg-opacity-40">
                  {change.value}
                </span>
              );
            } else if (change.removed && line.type === 'remove') {
              return (
                <span key={idx} className="bg-red-500 bg-opacity-40">
                  {change.value}
                </span>
              );
            } else {
              return <span key={idx}>{change.value}</span>;
            }
          })}
        </>
      );
    }

    // Otherwise, render plain content
    return line.content;
  };

  // Group lines into pairs for side-by-side view
  const pairs: Array<{ old?: DiffLine; new?: DiffLine }> = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'header') {
      pairs.push({ old: line, new: line });
      i++;
    } else if (line.type === 'context') {
      pairs.push({ old: line, new: line });
      i++;
    } else if (line.type === 'remove') {
      // Look ahead for matching add
      let j = i + 1;
      while (j < lines.length && lines[j].type === 'remove') j++;

      const addLine = lines[j]?.type === 'add' ? lines[j] : undefined;
      pairs.push({ old: line, new: addLine });

      i++;
      if (addLine) i++;
    } else if (line.type === 'add') {
      pairs.push({ new: line });
      i++;
    } else {
      i++;
    }
  }

  return (
    <div className="split-diff grid grid-cols-2 gap-px bg-gray-700 font-mono text-sm">
      {pairs.map((pair, index) => (
        <div key={index} className="contents">
          {/* Old/Left Side */}
          <div
            className={`diff-line flex ${
              pair.old?.type === 'remove'
                ? 'bg-red-900 bg-opacity-30 border-l-4 border-red-500'
                : pair.old?.type === 'header'
                ? 'bg-blue-900 bg-opacity-30'
                : 'bg-gray-900'
            }`}
          >
            {pair.old && (
              <>
                <div className="line-number w-12 px-2 py-1 bg-gray-800 bg-opacity-50 text-gray-500 text-right select-none">
                  {pair.old.oldLineNumber}
                </div>
                <pre
                  className={`flex-1 px-4 py-1 whitespace-pre-wrap break-all ${
                    pair.old.type === 'remove'
                      ? 'text-red-300'
                      : pair.old.type === 'header'
                      ? 'text-blue-300'
                      : 'text-gray-300'
                  }`}
                >
                  {renderLineContent(pair.old)}
                </pre>
              </>
            )}
          </div>

          {/* New/Right Side */}
          <div
            className={`diff-line flex ${
              pair.new?.type === 'add'
                ? 'bg-green-900 bg-opacity-30 border-l-4 border-green-500'
                : pair.new?.type === 'header'
                ? 'bg-blue-900 bg-opacity-30'
                : 'bg-gray-900'
            }`}
          >
            {pair.new && (
              <>
                <div className="line-number w-12 px-2 py-1 bg-gray-800 bg-opacity-50 text-gray-500 text-right select-none">
                  {pair.new.newLineNumber}
                </div>
                <pre
                  className={`flex-1 px-4 py-1 whitespace-pre-wrap break-all ${
                    pair.new.type === 'add'
                      ? 'text-green-300'
                      : pair.new.type === 'header'
                      ? 'text-blue-300'
                      : 'text-gray-300'
                  }`}
                >
                  {renderLineContent(pair.new)}
                </pre>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
