import { useEffect, useRef } from 'react';
import React from 'react';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmDialogProps extends ConfirmDialogOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  const variantStyles = {
    danger: {
      confirmBg: 'bg-red-600 hover:bg-red-700',
      confirmText: 'text-white',
      icon: '⚠️',
    },
    warning: {
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      confirmText: 'text-white',
      icon: '⚡',
    },
    info: {
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      confirmText: 'text-white',
      icon: 'ℹ️',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <span className="text-2xl" role="img" aria-label="warning icon">
            {styles.icon}
          </span>
          <div className="flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-semibold text-gray-100 mb-2"
            >
              {title}
            </h3>
            <p id="confirm-dialog-message" className="text-gray-300 text-sm mb-6">
              {message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded text-sm font-medium transition-colors"
              >
                {cancelText}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 ${styles.confirmBg} ${styles.confirmText} rounded text-sm font-medium transition-colors`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage confirm dialog state
 */
export function useConfirmDialog() {
  const [state, setState] = React.useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options: {
          ...options,
          onConfirm: async () => {
            await options.onConfirm();
            resolve(true);
          },
          onCancel: () => {
            options.onCancel?.();
            resolve(false);
          },
        },
      });
    });
  };

  const close = () => {
    setState({ isOpen: false, options: null });
  };

  return {
    isOpen: state.isOpen as boolean,
    options: state.options as ConfirmDialogOptions | null,
    confirm,
    close,
  };
}
