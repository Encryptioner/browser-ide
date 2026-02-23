import { useEffect, useCallback } from 'react';
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { logger } from '@/utils/logger';
import clsx from 'clsx';

export interface DiffEditorProps {
  originalContent: string;
  modifiedContent: string;
  fileName: string;
  language: string;
  onAccept: () => void;
  onReject: () => void;
}

export function DiffEditor({
  originalContent,
  modifiedContent,
  fileName,
  language,
  onAccept,
  onReject,
}: DiffEditorProps) {
  const isWide = useMediaQuery('(min-width: 800px)');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
    },
    [onAccept, onReject]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  function handleDiffEditorMount() {
    logger.info('DiffEditor mounted for file', fileName, 'DiffEditor');
  }

  const displayName = fileName.split('/').pop() || fileName;

  return (
    <div
      className="flex flex-col h-full bg-gray-900"
      role="region"
      aria-label="Diff editor"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-200" data-testid="diff-filename">
            {displayName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-700 text-purple-100">
            Claude&apos;s Changes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            className={clsx(
              'px-3 py-1.5 text-sm font-medium rounded',
              'bg-red-700 hover:bg-red-600 text-white',
              'transition-colors min-h-[32px]'
            )}
            aria-label="Reject changes"
            title="Reject changes (Escape)"
          >
            Reject Changes
          </button>
          <button
            onClick={onAccept}
            className={clsx(
              'px-3 py-1.5 text-sm font-medium rounded',
              'bg-green-700 hover:bg-green-600 text-white',
              'transition-colors min-h-[32px]'
            )}
            aria-label="Accept changes"
            title="Accept changes (Cmd/Ctrl+Enter)"
          >
            Accept Changes
          </button>
        </div>
      </div>

      {/* Diff Editor */}
      <div className="flex-1 min-h-0">
        <MonacoDiffEditor
          height="100%"
          language={language}
          original={originalContent}
          modified={modifiedContent}
          theme="vs-dark"
          onMount={handleDiffEditorMount}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
              <div className="text-center">
                <div className="animate-pulse mb-2">Loading diff editor...</div>
                <div className="w-48 h-1 bg-gray-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-purple-600 rounded animate-[loading_1.5s_ease-in-out_infinite]"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            </div>
          }
          options={{
            readOnly: true,
            originalEditable: false,
            renderSideBySide: isWide,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            renderOverviewRuler: true,
            diffWordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}
