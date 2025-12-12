import { useEffect, useState } from 'react';
import { webContainer } from '@/services/webcontainer';

export function Preview() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check for server URL
    const checkUrl = setInterval(() => {
      const serverUrl = webContainer.getServerUrl();
      if (serverUrl) {
        setUrl(serverUrl);
        clearInterval(checkUrl);
      }
    }, 1000);

    return () => clearInterval(checkUrl);
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
