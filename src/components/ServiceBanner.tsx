import { useState } from 'react';
import type { ServiceReadiness } from '@/hooks/useServiceReadiness';
import { features } from '@/config/features';

interface ServiceBannerProps {
  services: ServiceReadiness;
}

/**
 * Dismissible banner shown when non-critical services fail.
 * Shows after the app has rendered (critical services are ready).
 */
export function ServiceBanner({ services }: ServiceBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const banners: { key: string; message: string; service: 'webcontainer' | 'git' }[] = [];

  // Only show WebContainer banner if the feature is enabled but failed to boot.
  // When the feature is intentionally disabled (e.g. GitHub Pages), don't nag the user.
  if (
    features.webContainer &&
    services.webcontainer.status === 'error' &&
    !dismissed.has('webcontainer')
  ) {
    banners.push({
      key: 'webcontainer',
      message: 'WebContainer unavailable. Terminal commands limited to file browsing. Requires Chrome, Edge, or Brave.',
      service: 'webcontainer',
    });
  }

  if (services.git.status === 'error' && !dismissed.has('git')) {
    banners.push({
      key: 'git',
      message: `Git service failed: ${services.git.error}`,
      service: 'git',
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="space-y-0">
      {banners.map(({ key, message, service }) => (
        <div
          key={key}
          className="flex items-center justify-between px-3 py-1.5 bg-yellow-900/50 text-yellow-200 text-xs border-b border-yellow-800/50"
        >
          <span>{message}</span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={() => services.retry(service)}
              className="px-2 py-0.5 bg-yellow-700 hover:bg-yellow-600 rounded text-xs"
            >
              Retry
            </button>
            <button
              onClick={() => setDismissed(prev => new Set(prev).add(key))}
              className="px-1 hover:bg-yellow-700 rounded"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
