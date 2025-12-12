import { useState, useEffect } from 'react';
import { useKeyboardConfig, useKeyboardTestingControls } from '@/hooks/useMobileConfig';
import { useKeyboardDetection, useIsMobile } from '@/hooks/useKeyboardDetection';
import { useVirtualKeyboardControls } from '@/hooks/useKeyboardDetection';

/**
 * Mobile Keyboard Testing Component
 * Provides testing controls and UI for Virtual Keyboard API functionality
 * Only visible on mobile devices in development mode or when explicitly enabled
 */
export function MobileKeyboardTest() {
  const keyboardConfig = useKeyboardConfig();
  const { showControls, enableDebugLogs } = useKeyboardTestingControls();
  const keyboardState = useKeyboardDetection();
  const isMobile = useIsMobile();
  const { showKeyboard, hideKeyboard, isVirtualKeyboardEnabled } = useVirtualKeyboardControls();

  const [testText, setTestText] = useState('');
  const [isMinimized, setIsMinimized] = useState(true);
  type TestResult = {
  feature: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
  };

  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Only show on mobile devices and when testing is enabled in development
  if (!keyboardConfig.testing.showKeyboardControls || !isMobile) {
    return null;
  }

  const runTests = async () => {
    const results = [...testResults];

    // Test 1: Virtual Keyboard API Availability
    const vkTest: TestResult = {
      feature: 'Virtual Keyboard API',
      status: ('virtualKeyboard' in navigator ? 'pass' : 'fail') as 'pass' | 'fail' | 'pending',
      message: 'virtualKeyboard' in navigator ? 'API available' : 'API not available',
    };
    results[0] = vkTest;

    // Test 2: Touch Device Detection
    const touchTest: TestResult = {
      feature: 'Touch Detection',
      status: ('ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'pass' : 'fail') as 'pass' | 'fail' | 'pending',
      message: 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Touch interface detected' : 'No touch interface',
    };
    results[1] = touchTest;

    // Test 3: Visual Viewport API
    const viewportTest: TestResult = {
      feature: 'Visual Viewport API',
      status: ('visualViewport' in window ? 'pass' : 'fail') as 'pass' | 'fail' | 'pending',
      message: 'visualViewport' in window ? 'Visual viewport API available' : 'Visual viewport API not available',
    };
    results[2] = viewportTest;

    // Test 4: Virtual Keyboard Control
    if ('virtualKeyboard' in navigator && keyboardConfig.virtualKeyboardAPI.enabled) {
      try {
        (navigator.virtualKeyboard as any).overlaysContent = keyboardConfig.virtualKeyboardAPI.overlaysContent;
        results[3] = {
          feature: 'Virtual Keyboard Control',
          status: 'pass' as const,
          message: ` overlaysContent set to ${keyboardConfig.virtualKeyboardAPI.overlaysContent}`,
        };
      } catch (error) {
        results[3] = {
          feature: 'Virtual Keyboard Control',
          status: 'fail' as const,
          message: `Failed to set overlaysContent: ${error}`,
        };
      }
    } else {
      results[3] = {
        feature: 'Virtual Keyboard Control',
        status: 'pending' as const,
        message: 'Virtual Keyboard API not available for testing',
      };
    }

    setTestResults(results);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const showTestKeyboard = () => {
    const input = document.getElementById('mobile-keyboard-test-input') as HTMLInputElement;
    if (input) {
      showKeyboard(input);
    }
  };

  const hideTestKeyboard = () => {
    hideKeyboard();
  };

  if (enableDebugLogs) {
    console.log('📱 Mobile Keyboard Test State:', {
      keyboardState,
      keyboardConfig,
      isMobile,
      isVirtualKeyboardEnabled,
      showControls,
    });
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white rounded-lg shadow-xl z-50">
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold">📱 Keyboard Test</h3>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${keyboardState.isVisible ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-400">
              {keyboardState.isVisible ? `${Math.round(keyboardState.height)}px` : 'Hidden'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearResults}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            title="Clear Results"
          >
            Clear
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isMinimized && (
        <div className="p-3 space-y-3 max-w-xs sm:max-w-sm">
          {/* Device Info - Compact */}
          <div className="text-xs space-y-1 p-2 bg-gray-700 rounded">
            <div>📱 Mobile: {isMobile ? 'Yes' : 'No'}</div>
            <div>🔄 VK API: {isVirtualKeyboardEnabled ? 'Yes' : 'No'}</div>
            <div>📐 Screen: {window.innerWidth}x{window.innerHeight}</div>
          </div>

          {/* Test Input - Compact */}
          <div>
            <label className="block text-xs font-medium mb-1">Test Input</label>
            <input
              id="mobile-keyboard-test-input"
              type="text"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Test keyboard..."
              style={{ fontSize: '16px' }} // Prevent zoom
            />
          </div>

          {/* Test Controls - Compact */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={showTestKeyboard}
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
              disabled={!isVirtualKeyboardEnabled}
              title="Show Keyboard"
            >
              ⌨️
            </button>
            <button
              onClick={hideTestKeyboard}
              className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
              disabled={!isVirtualKeyboardEnabled}
              title="Hide Keyboard"
            >
              ⌨️
            </button>
            <button
              onClick={runTests}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
              title="Run Tests"
            >
              🧪
            </button>
          </div>

          {/* Test Results - Compact */}
          {testResults.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold">Results</h4>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`text-xs p-1 rounded ${
                      result.status === 'pass'
                        ? 'bg-green-900 text-green-100'
                        : result.status === 'fail'
                        ? 'bg-red-900 text-red-100'
                        : 'bg-yellow-900 text-yellow-100'
                    }`}
                  >
                    <div className="font-medium">{result.feature}</div>
                    <div className="text-xs opacity-75 truncate">{result.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info - Compact */}
          {enableDebugLogs && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">🔍 Debug</summary>
              <div className="mt-2 p-2 bg-gray-700 rounded text-xs space-y-1">
                <div>UA: {navigator.userAgent.slice(0, 30)}...</div>
                <div>Touch: {navigator.maxTouchPoints}</div>
                <div>CSS vh: {getComputedStyle(document.documentElement).getPropertyValue('--vh')?.slice(0, 10)}</div>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}