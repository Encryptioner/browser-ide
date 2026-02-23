import type { ServiceReadiness } from '@/hooks/useServiceReadiness';

interface BootScreenProps {
  services: ServiceReadiness;
}

/**
 * Minimal loading screen shown while critical services boot.
 * Rendered only until filesystem + DB are ready.
 */
export function BootScreen({ services }: BootScreenProps) {
  const { filesystem } = services;

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-300">
      <div className="text-center space-y-4">
        <div className="text-2xl font-bold text-white">Browser IDE</div>

        {filesystem.status === 'booting' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            Initializing...
          </div>
        )}

        {filesystem.status === 'error' && (
          <div className="space-y-2">
            <div className="text-red-400 text-sm">
              Failed to initialize file system: {filesystem.error}
            </div>
            <button
              onClick={() => services.retry('filesystem')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
