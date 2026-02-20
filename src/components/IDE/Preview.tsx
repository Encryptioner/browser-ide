import { useEffect, useState } from 'react';
import { webContainer } from '@/services/webcontainer';

export function Preview() {
  const [url, setUrl] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    // If WebContainer never booted, show degraded state after a short check
    const bootCheck = setTimeout(() => {
      if (!webContainer.isBooted()) {
        setUnavailable(true);
      }
    }, 2000);

    // Poll for server URL once WebContainer is available
    const checkUrl = setInterval(() => {
      if (!webContainer.isBooted()) return;
      const serverUrl = webContainer.getServerUrl();
      if (serverUrl) {
        setUrl(serverUrl);
        clearInterval(checkUrl);
      }
    }, 1000);

    return () => {
      clearTimeout(bootCheck);
      clearInterval(checkUrl);
    };
  }, []);

  return (
    <div className="preview flex flex-col h-full bg-gray-900">
      <div className="preview-header px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-300 text-sm">Preview</span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            Open in new tab ↗
          </a>
        )}
      </div>
      {url ? (
        <iframe
          className="preview-frame flex-1 w-full h-full border-0 bg-white"
          src={url}
          title="Preview"
        />
      ) : unavailable ? (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <p className="text-yellow-400">Preview unavailable</p>
            <p className="text-sm mt-2">WebContainer is not supported in this browser.</p>
            <p className="text-sm mt-1">Use a Chromium-based browser with COOP/COEP headers for live preview.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <p>No preview available</p>
            <p className="text-sm mt-2">Start a development server to see preview</p>
          </div>
        </div>
      )}
    </div>
  );
}
