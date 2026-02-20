import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface TimeoutOptions {
  warningTime?: number; // Time before showing warning (ms)
  timeoutTime?: number; // Maximum time before forced abort (ms)
  onWarning?: () => void;
  onTimeout?: () => void;
  operationName?: string;
}

/**
 * Manages timeout warnings for long-running operations
 */
class TimeoutManager {
  private activeTimeouts = new Map<string, {
    warningId: number;
    timeoutId: number;
    startTime: number;
    warned: boolean;
  }>();

  /**
   * Start tracking a long-running operation
   * @returns cleanup function to call when operation completes
   */
  startTracking(
    operationId: string,
    options: TimeoutOptions = {}
  ): () => void {
    const {
      warningTime = 30000, // 30 seconds default warning
      timeoutTime = 300000, // 5 minutes default timeout
      onWarning,
      onTimeout,
      operationName = 'Operation'
    } = options;

    const startTime = Date.now();

    logger.info(`Started tracking: ${operationId} (${operationName})`);

    // Warning timeout
    const warningId = window.setTimeout(() => {
      if (this.activeTimeouts.has(operationId)) {
        const elapsed = Date.now() - startTime;

        logger.warn(`Warning: ${operationName} taking longer than expected (${elapsed}ms)`);

        // Show toast notification
        toast.warning(`${operationName} is taking longer than expected...`, {
          description: `Started ${Math.round(elapsed / 1000)}s ago. Please wait.`,
          duration: 5000,
          id: `timeout-warning-${operationId}`,
        });

        // Call custom warning handler
        onWarning?.();
      }
    }, warningTime);

    // Hard timeout
    const timeoutId = window.setTimeout(() => {
      if (this.activeTimeouts.has(operationId)) {
        const elapsed = Date.now() - startTime;

        logger.error(`Timeout: ${operationName} exceeded ${timeoutTime}ms`);

        // Show error toast
        toast.error(`${operationName} timed out`, {
          description: `The operation took too long (${Math.round(elapsed / 1000)}s) and was cancelled.`,
          duration: 8000,
          id: `timeout-error-${operationId}`,
        });

        // Cleanup and call custom timeout handler
        this.stopTracking(operationId);
        onTimeout?.();
      }
    }, timeoutTime);

    // Store the tracking info
    this.activeTimeouts.set(operationId, {
      warningId,
      timeoutId,
      startTime,
      warned: false,
    });

    // Return cleanup function
    return () => this.stopTracking(operationId);
  }

  /**
   * Stop tracking an operation (call when operation completes)
   */
  stopTracking(operationId: string): void {
    const tracking = this.activeTimeouts.get(operationId);
    if (!tracking) return;

    // Clear timeouts
    clearTimeout(tracking.warningId);
    clearTimeout(tracking.timeoutId);

    const elapsed = Date.now() - tracking.startTime;
    logger.info(`Stopped tracking: ${operationId} (${elapsed}ms)`);

    this.activeTimeouts.delete(operationId);
  }

  /**
   * Get all active tracked operations
   */
  getActiveOperations(): Array<{ id: string; elapsed: number; warned: boolean }> {
    return Array.from(this.activeTimeouts.entries()).map(([id, info]) => ({
      id,
      elapsed: Date.now() - info.startTime,
      warned: info.warned,
    }));
  }

  /**
   * Stop all active tracking
   */
  stopAll(): void {
    for (const [id] of this.activeTimeouts) {
      this.stopTracking(id);
    }
  }
}

// Export singleton instance
export const timeoutManager = new TimeoutManager();

/**
 * Convenience function to track an async operation with automatic cleanup
 * @example
 * const result = await withTimeoutTracking('npm-install', async () => {
 *   return await webContainer.spawn('npm', ['install']);
 * }, { operationName: 'Installing packages' });
 */
export async function withTimeoutTracking<T>(
  operationId: string,
  operation: () => Promise<T>,
  options?: TimeoutOptions
): Promise<T> {
  const cleanup = timeoutManager.startTracking(operationId, options);

  try {
    return await operation();
  } finally {
    cleanup();
  }
}
