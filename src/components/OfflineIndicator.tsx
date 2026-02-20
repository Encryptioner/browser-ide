import type { OnlineStatus } from '@/hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  status: OnlineStatus;
}

/**
 * Status bar indicator shown when the app is offline.
 * AI features and remote operations are disabled.
 */
export function OfflineIndicator({ status }: OfflineIndicatorProps) {
  if (status.isOnline) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-900/60 text-orange-200 text-xs border-b border-orange-800/40">
      <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
      <span>Offline - AI and remote operations unavailable. Local editing and git commits still work.</span>
    </div>
  );
}
