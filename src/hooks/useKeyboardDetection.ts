import { useState, useEffect, useCallback } from 'react';
import { config } from '@/config/environment';

interface KeyboardState {
  isVisible: boolean;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  hasVirtualKeyboardAPI: boolean;
  isVirtualKeyboardEnabled: boolean;
}

interface VirtualKeyboardAPI {
  overlaysContent: boolean;
  show: () => void;
  hide: () => void;
}

// Extend Navigator interface for Virtual Keyboard API
declare global {
  interface Navigator {
    virtualKeyboard?: VirtualKeyboardAPI;
  }
}

/**
 * Hook to detect virtual keyboard visibility and viewport changes on mobile devices
 * Helps optimize UI for better mobile typing experience
 * Includes Virtual Keyboard API support for enhanced control
 */
export function useKeyboardDetection(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    isPortrait: false,
    isLandscape: false,
    hasVirtualKeyboardAPI: false,
    isVirtualKeyboardEnabled: false,
  });

  // Initialize Virtual Keyboard API if available
  const initializeVirtualKeyboardAPI = useCallback((): boolean => {
    if (!config.MOBILE_KEYBOARD.ENABLE_VIRTUAL_KEYBOARD_API) {
      console.log('📱 Virtual Keyboard API disabled in config');
      return false;
    }

    if (!('virtualKeyboard' in navigator)) {
      console.log('📱 Virtual Keyboard API not available');
      return false;
    }

    const vk = navigator.virtualKeyboard;

    try {
      // Set overlaysContent mode if configured
      if (config.MOBILE_KEYBOARD.OVERLAYS_CONTENT) {
        (vk as any).overlaysContent = true;
        console.log('📱 Virtual Keyboard API enabled with overlaysContent');
      }

      console.log('📱 Virtual Keyboard API initialized successfully');
      return true;
    } catch (error) {
      console.warn('📱 Failed to initialize Virtual Keyboard API:', error);
      return false;
    }
  }, []);

  // Show keyboard using Virtual Keyboard API
  const showVirtualKeyboard = useCallback((element?: HTMLElement): boolean => {
    if (!config.MOBILE_KEYBOARD.ENABLE_VIRTUAL_KEYBOARD_API ||
        !('virtualKeyboard' in navigator)) {
      return false;
    }

    try {
      if (element) {
        element.focus();
      }

      if (navigator.virtualKeyboard?.show) {
        navigator.virtualKeyboard.show();
        console.log('📱 Virtual Keyboard shown programmatically');
        return true;
      }

      return false;
    } catch (error) {
      console.warn('📱 Failed to show virtual keyboard:', error);
      return false;
    }
  }, []);

  // Hide keyboard using Virtual Keyboard API
  const hideVirtualKeyboard = useCallback((): boolean => {
    if (!config.MOBILE_KEYBOARD.ENABLE_VIRTUAL_KEYBOARD_API ||
        !('virtualKeyboard' in navigator)) {
      return false;
    }

    try {
      if (navigator.virtualKeyboard?.hide) {
        navigator.virtualKeyboard.hide();
        console.log('📱 Virtual Keyboard hidden programmatically');
        return true;
      }

      return false;
    } catch (error) {
      console.warn('📱 Failed to hide virtual keyboard:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialViewportHeight = (window as any).innerHeight;

    // Check if device is likely mobile - more comprehensive detection
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || (
      // Additional mobile detection
      navigator.maxTouchPoints > 0 &&
      window.innerWidth <= 768
    ) || (
      // Touch-only device detection
      'ontouchstart' in window &&
      navigator.maxTouchPoints > 0 &&
      /Mobile|Tablet|iPad|Android/i.test(navigator.userAgent)
    );

    // Update orientation
    const updateOrientation = () => {
      const isPortrait = (window as any).innerHeight > (window as any).innerWidth;
      const isLandscape = !isPortrait;

      setKeyboardState(prev => ({
        ...prev,
        isPortrait,
        isLandscape,
      }));
    };

    // Visual viewport API for accurate keyboard detection (supported by modern browsers)
    const checkVisualViewport = () => {
      if ('visualViewport' in window) {
        const viewport = (window as any).visualViewport;
        if (viewport) {
          const keyboardHeight = (window as any).innerHeight - viewport.height;
          const isKeyboardVisible = keyboardHeight > config.MOBILE_KEYBOARD.KEYBOARD_HEIGHT_THRESHOLD;

          setKeyboardState(prev => ({
            ...prev,
            isVisible: isKeyboardVisible && isMobileDevice,
            height: isKeyboardVisible && isMobileDevice ? keyboardHeight : 0,
          }));
        }
      } else {
        // Fallback for browsers without visual viewport support
        const currentHeight = (window as any).innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        const isKeyboardVisible = heightDifference > config.MOBILE_KEYBOARD.KEYBOARD_HEIGHT_THRESHOLD;

        setKeyboardState(prev => ({
          ...prev,
          isVisible: isKeyboardVisible && isMobileDevice,
          height: isKeyboardVisible && isMobileDevice ? heightDifference : 0,
        }));
      }
    };

    // Handle window resize events (including keyboard show/hide)
    const handleResize = () => {
      checkVisualViewport();
      updateOrientation();
    };

    // Handle focus events on input elements (keyboard might appear)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.getAttribute('contenteditable') === 'true'
      )) {
        // Show keyboard programmatically if configured
        if (config.MOBILE_KEYBOARD.EXPERIMENTAL_FEATURES) {
          setTimeout(() => showVirtualKeyboard(target), 100);
        }

        // Small delay to let keyboard appear
        setTimeout(checkVisualViewport, config.MOBILE_KEYBOARD.DEBOUNCE_DELAY);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.getAttribute('contenteditable') === 'true'
      )) {
        // Hide keyboard programmatically if configured
        if (config.MOBILE_KEYBOARD.AUTO_HIDE_ON_BLUR &&
            config.MOBILE_KEYBOARD.EXPERIMENTAL_FEATURES) {
          setTimeout(() => hideVirtualKeyboard(), 100);
        }

        // Small delay to let keyboard disappear
        setTimeout(checkVisualViewport, config.MOBILE_KEYBOARD.DEBOUNCE_DELAY);
      }
    };

    // Initialize
    const hasVirtualAPI = initializeVirtualKeyboardAPI();
    updateOrientation();
    checkVisualViewport();

    // Update keyboard state with Virtual Keyboard API status
    setKeyboardState(prev => ({
      ...prev,
      hasVirtualKeyboardAPI: hasVirtualAPI,
      isVirtualKeyboardEnabled: hasVirtualAPI && config.MOBILE_KEYBOARD.ENABLE_VIRTUAL_KEYBOARD_API,
    }));

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Visual viewport API events
    if ('visualViewport' in window) {
      const viewport = (window as any).visualViewport;
      viewport?.addEventListener('resize', checkVisualViewport);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);

      if ('visualViewport' in window) {
        const viewport = (window as any).visualViewport;
        viewport?.removeEventListener('resize', checkVisualViewport);
      }
    };
  }, [initializeVirtualKeyboardAPI, showVirtualKeyboard, hideVirtualKeyboard]);

  return keyboardState;
}

/**
 * Hook to get CSS variables for dynamic viewport height
 * Helps with mobile keyboard adaptation
 */
export function useViewportHeight() {
  const [vh, setVh] = useState('1vh');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateVh = () => {
      const height = (window as any).visualViewport?.height || (window as any).innerHeight;
      const calculatedVh = `${height * 0.01}px`;
      setVh(calculatedVh);

      // Set CSS custom property
      document.documentElement.style.setProperty('--vh', calculatedVh);
    };

    updateVh();

    if ('visualViewport' in window) {
      (window as any).visualViewport?.addEventListener('resize', updateVh);
    } else {
      window.addEventListener('resize', updateVh);
    }

    return () => {
      if ('visualViewport' in window) {
        (window as any).visualViewport?.removeEventListener('resize', updateVh);
      } else {
        window.removeEventListener('resize', updateVh);
      }
    };
  }, []);

  return vh;
}

/**
 * Hook to detect if device is mobile
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || (isTouchDevice && window.innerWidth <= 768));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Experimental hook for advanced Virtual Keyboard API features
 */
export function useVirtualKeyboardControls() {
  const [isVirtualKeyboardEnabled, setIsVirtualKeyboardEnabled] = useState(false);

  const enableVirtualKeyboard = useCallback(() => {
    if (!('virtualKeyboard' in navigator)) {
      console.warn('📱 Virtual Keyboard API not supported');
      return false;
    }

    try {
      (navigator.virtualKeyboard as any).overlaysContent = true;
      setIsVirtualKeyboardEnabled(true);
      console.log('📱 Virtual Keyboard API enabled with overlaysContent');
      return true;
    } catch (error) {
      console.error('📱 Failed to enable Virtual Keyboard API:', error);
      return false;
    }
  }, []);

  const disableVirtualKeyboard = useCallback(() => {
    if (!('virtualKeyboard' in navigator)) {
      return false;
    }

    try {
      (navigator.virtualKeyboard as any).overlaysContent = false;
      setIsVirtualKeyboardEnabled(false);
      console.log('📱 Virtual Keyboard API disabled');
      return true;
    } catch (error) {
      console.error('📱 Failed to disable Virtual Keyboard API:', error);
      return false;
    }
  }, []);

  const showKeyboard = useCallback((element?: HTMLElement) => {
    if (!isVirtualKeyboardEnabled || !('virtualKeyboard' in navigator)) {
      return false;
    }

    try {
      if (element) {
        element.focus();
      }
      navigator.virtualKeyboard?.show();
      console.log('📱 Virtual Keyboard shown');
      return true;
    } catch (error) {
      console.error('📱 Failed to show Virtual Keyboard:', error);
      return false;
    }
  }, [isVirtualKeyboardEnabled]);

  const hideKeyboard = useCallback(() => {
    if (!isVirtualKeyboardEnabled || !('virtualKeyboard' in navigator)) {
      return false;
    }

    try {
      navigator.virtualKeyboard?.hide();
      console.log('📱 Virtual Keyboard hidden');
      return true;
    } catch (error) {
      console.error('📱 Failed to hide Virtual Keyboard:', error);
      return false;
    }
  }, [isVirtualKeyboardEnabled]);

  return {
    isVirtualKeyboardEnabled,
    enableVirtualKeyboard,
    disableVirtualKeyboard,
    showKeyboard,
    hideKeyboard,
  };
}