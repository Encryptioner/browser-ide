import { useState, useEffect } from 'react';
import { minWidth, maxWidth, between } from '@/config/breakpoints';

/**
 * Custom hook for responsive media queries
 * Returns true if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Breakpoint hooks (using unified config from src/config/breakpoints.ts)
export const useIsXSmall = () => useMediaQuery(maxWidth('xsm'));
export const useIsMobile = () => useMediaQuery(maxWidth('md'));
export const useIsTablet = () => useMediaQuery(between('md', 'lg'));
export const useIsDesktop = () => useMediaQuery(minWidth('lg'));
export const useIsLargeScreen = () => useMediaQuery(minWidth('xl'));
export const useIsXLargeScreen = () => useMediaQuery(minWidth('2xl'));

// Orientation
export const useIsPortrait = () => useMediaQuery('(orientation: portrait)');
export const useIsLandscape = () => useMediaQuery('(orientation: landscape)');

// Accessibility / preferences
export const usePrefersReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');
export const usePrefersDarkMode = () =>
  useMediaQuery('(prefers-color-scheme: dark)');
