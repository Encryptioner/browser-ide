import { useState, useEffect } from 'react';

interface MobileKeyboardConfig {
  enabled: boolean;
  virtualKeyboardAPI: {
    enabled: boolean;
    overlaysContent: boolean;
    autoHideOnBlur: boolean;
    experimentalFeatures: boolean;
  };
  detection: {
    heightThreshold: number;
    debounceDelay: number;
    visualViewportAPI: boolean;
  };
  ui: {
    adjustBottomPanel: boolean;
    adjustEditorHeight: boolean;
    preventZoomOnInput: boolean;
    minimumTouchTargetSize: number;
    safeAreaSupport: boolean;
  };
  testing: {
    showKeyboardControls: boolean;
    enableDebugLogs: boolean;
    forceShowKeyboard: boolean;
  };
}

interface MobileConfig {
  keyboard: MobileKeyboardConfig;
}

interface ExperimentalConfig {
  mobileKeyboardEnhancements: boolean;
  advancedViewportHandling: boolean;
  touchOptimizations: boolean;
}

interface AppMobileConfig {
  mobile: MobileConfig;
  experimental: ExperimentalConfig;
}

const DEFAULT_CONFIG: AppMobileConfig = {
  mobile: {
    keyboard: {
      enabled: true,
      virtualKeyboardAPI: {
        enabled: true,
        overlaysContent: true,
        autoHideOnBlur: true,
        experimentalFeatures: false,
      },
      detection: {
        heightThreshold: 100,
        debounceDelay: 150,
        visualViewportAPI: true,
      },
      ui: {
        adjustBottomPanel: true,
        adjustEditorHeight: true,
        preventZoomOnInput: true,
        minimumTouchTargetSize: 44,
        safeAreaSupport: true,
      },
      testing: {
        showKeyboardControls: import.meta.env.DEV,  // Only enable in development
        enableDebugLogs: import.meta.env.DEV,   // Only enable debug logs in development
        forceShowKeyboard: false,
      },
    },
  },
  experimental: {
    mobileKeyboardEnhancements: false,
    advancedViewportHandling: true,
    touchOptimizations: true,
  },
};

/**
 * Hook to load and manage mobile configuration from config.json
 * Allows runtime configuration changes for mobile behavior
 */
export function useMobileConfig(): {
  config: AppMobileConfig;
  updateConfig: (updates: Partial<AppMobileConfig>) => void;
  resetConfig: () => void;
  saveConfig: () => Promise<boolean>;
  loadConfig: () => Promise<boolean>;
} {
  const [config, setConfig] = useState<AppMobileConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(false);

  // Load config from localStorage or fetch from file
  const loadConfig = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Try to load from config.json file (public folder)
      const response = await fetch('/config.json');
      if (response.ok) {
        const fileConfig: AppMobileConfig = await response.json();

        // Merge with localStorage config if it exists
        const localConfigStr = localStorage.getItem('browser-ide-mobile-config');
        const localConfig = localConfigStr ? JSON.parse(localConfigStr) : {};

        const mergedConfig = {
          ...DEFAULT_CONFIG,
          ...fileConfig,
          ...localConfig,
        };

        setConfig(mergedConfig);
        console.log('📱 Mobile config loaded from file and localStorage:', mergedConfig);
        return true;
      }
    } catch (error) {
      console.warn('📱 Failed to load config.json, using defaults:', error);

      // Fallback to localStorage only
      try {
        const localConfigStr = localStorage.getItem('browser-ide-mobile-config');
        if (localConfigStr) {
          const localConfig = JSON.parse(localConfigStr);
          const mergedConfig = { ...DEFAULT_CONFIG, ...localConfig };
          setConfig(mergedConfig);
          console.log('📱 Mobile config loaded from localStorage:', mergedConfig);
          return true;
        }
      } catch (localError) {
        console.warn('📱 Failed to load localStorage config:', localError);
      }

      // Use defaults
      setConfig(DEFAULT_CONFIG);
      console.log('📱 Using default mobile config:', DEFAULT_CONFIG);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Save config to localStorage
  const saveConfig = async (): Promise<boolean> => {
    try {
      localStorage.setItem('browser-ide-mobile-config', JSON.stringify(config));
      console.log('📱 Mobile config saved to localStorage:', config);
      return true;
    } catch (error) {
      console.error('📱 Failed to save mobile config:', error);
      return false;
    }
  };

  // Update config with partial changes
  const updateConfig = (updates: Partial<AppMobileConfig>) => {
    const newConfig = {
      ...config,
      ...updates,
    };
    setConfig(newConfig);

    // Auto-save to localStorage
    try {
      localStorage.setItem('browser-ide-mobile-config', JSON.stringify(newConfig));
    } catch (error) {
      console.warn('📱 Failed to auto-save config:', error);
    }
  };

  // Reset to defaults
  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem('browser-ide-mobile-config');
      console.log('📱 Mobile config reset to defaults');
    } catch (error) {
      console.warn('📱 Failed to clear localStorage config:', error);
    }
  };

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    updateConfig,
    resetConfig,
    saveConfig,
    loadConfig,
  };
}

/**
 * Convenience hook to get keyboard-specific config
 */
export function useKeyboardConfig(): MobileKeyboardConfig {
  const { config } = useMobileConfig();
  return config.mobile.keyboard;
}

/**
 * Hook to get experimental features config
 */
export function useExperimentalConfig(): ExperimentalConfig {
  const { config } = useMobileConfig();
  return config.experimental;
}

/**
 * Hook to check if a specific experimental feature is enabled
 */
export function useExperimentalFeature(feature: keyof ExperimentalConfig): boolean {
  const experimental = useExperimentalConfig();
  return experimental[feature];
}

/**
 * Hook for mobile keyboard testing controls
 * Provides UI controls for testing mobile keyboard behavior
 */
export function useKeyboardTestingControls() {
  const keyboardConfig = useKeyboardConfig();
  const [isTestingMode, setIsTestingMode] = useState(false);
  const { config, updateConfig } = useMobileConfig();

  const forceShowKeyboard = () => {
    if (!keyboardConfig.testing.enableDebugLogs) return;

    try {
      // Create a temporary input field to trigger keyboard
      const tempInput = document.createElement('input');
      tempInput.type = 'text';
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      tempInput.style.top = '-9999px';
      tempInput.style.opacity = '0';
      tempInput.setAttribute('aria-hidden', 'true');

      document.body.appendChild(tempInput);
      tempInput.focus();

      // Try to use Virtual Keyboard API if available
      if ('virtualKeyboard' in navigator && keyboardConfig.virtualKeyboardAPI.enabled) {
        (navigator.virtualKeyboard as any).show();
      }

      console.log('📱 Keyboard forced to show for testing');

      // Remove after 5 seconds
      setTimeout(() => {
        document.body.removeChild(tempInput);
      }, 5000);
    } catch (error) {
      console.error('📱 Failed to force show keyboard:', error);
    }
  };

  const forceHideKeyboard = () => {
    if (!keyboardConfig.testing.enableDebugLogs) return;

    try {
      // Try to use Virtual Keyboard API if available
      if ('virtualKeyboard' in navigator && keyboardConfig.virtualKeyboardAPI.enabled) {
        (navigator.virtualKeyboard as any).hide();
      }

      // Blur any active input
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }

      console.log('📱 Keyboard forced to hide for testing');
    } catch (error) {
      console.error('📱 Failed to force hide keyboard:', error);
    }
  };

  const toggleTestingMode = () => {
    const newTestingMode = !isTestingMode;
    setIsTestingMode(newTestingMode);

    updateConfig({
      mobile: {
        ...config.mobile,
        keyboard: {
          ...config.mobile.keyboard,
          testing: {
            ...config.mobile.keyboard.testing,
            showKeyboardControls: newTestingMode,
          },
        },
      },
    });
  };

  return {
    isTestingMode,
    forceShowKeyboard,
    forceHideKeyboard,
    toggleTestingMode,
    showControls: keyboardConfig.testing.showKeyboardControls,
    enableDebugLogs: keyboardConfig.testing.enableDebugLogs,
  };
}