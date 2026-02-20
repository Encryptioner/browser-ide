import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  /** Timestamp of last confirmed online state */
  lastOnline: number | null;
}

/**
 * Hook for active offline detection.
 * Uses navigator.onLine + periodic heartbeat for reliable detection.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnline, setLastOnline] = useState<number | null>(() =>
    typeof navigator !== 'undefined' && navigator.onLine ? Date.now() : null
  );

  const updateOnline = useCallback((online: boolean) => {
    setIsOnline(online);
    if (online) {
      setLastOnline(Date.now());
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => updateOnline(true);
    const handleOffline = () => updateOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat check (every 30s)
    const interval = setInterval(async () => {
      try {
        // Fetch a tiny resource to verify actual connectivity
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('/icon.svg', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        updateOnline(true);
      } catch {
        // Only mark offline if navigator also says offline
        // (fetch can fail for other reasons like CSP)
        if (!navigator.onLine) {
          updateOnline(false);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateOnline]);

  return { isOnline, lastOnline };
}
