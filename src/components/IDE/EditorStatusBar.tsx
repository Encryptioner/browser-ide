import { useIDEStore } from '@/store/useIDEStore';
import { Save, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface EditorStatusBarProps {
  className?: string;
}

export function EditorStatusBar({ className }: EditorStatusBarProps) {
  const { currentFile, unsavedChanges, settings } = useIDEStore();
  const isUnsaved = currentFile && unsavedChanges.has(currentFile);
  const hasAutoSave = settings.autoSave;

  const getStatusText = () => {
    if (!currentFile) return '';
    if (isUnsaved && !hasAutoSave) return 'Unsaved changes';
    if (isUnsaved && hasAutoSave) return 'Saving...';
    return 'Saved';
  };

  const getStatusIcon = () => {
    if (!currentFile) return null;
    if (isUnsaved && !hasAutoSave) return <AlertCircle className="w-3 h-3 text-yellow-400" />;
    if (isUnsaved && hasAutoSave) return <Clock className="w-3 h-3 text-blue-400 animate-pulse" />;
    return <Save className="w-3 h-3 text-green-400" />;
  };

  return (
    <div
      className={clsx(
        'editor-status-bar flex items-center gap-2 px-3 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {currentFile && (
        <>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
          {isUnsaved && hasAutoSave && (
            <span className="text-xs text-gray-500">
              (autosave in {settings.autoSaveDelay}ms)
            </span>
          )}
        </>
      )}
      {!currentFile && <span>No file open</span>}
    </div>
  );
}
