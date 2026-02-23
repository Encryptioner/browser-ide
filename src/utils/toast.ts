import { toast } from 'sonner';
import type { ToastT } from 'sonner';

/**
 * Show a toast notification with undo action
 */
export function showToastWithUndo(
  message: string,
  options?: {
    duration?: number;
    onUndo?: () => void;
    undoLabel?: string;
  } & ToastT
): string | number {
  return toast(message, {
    duration: options?.duration || 10000,
    action: options?.onUndo
      ? {
          label: options?.undoLabel || 'Undo',
          onClick: options.onUndo,
        }
      : undefined,
    ...options,
  });
}
