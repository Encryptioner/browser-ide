/**
 * Unified Breakpoint Configuration
 * Single source of truth for all responsive breakpoints.
 * Used by both Tailwind CSS (tailwind.config.js) and JavaScript hooks (useMediaQuery).
 */

export const breakpoints = {
  xsm: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Get a min-width media query string for a breakpoint
 */
export function minWidth(bp: BreakpointKey): string {
  return `(min-width: ${breakpoints[bp]}px)`;
}

/**
 * Get a max-width media query string for a breakpoint
 * Uses bp - 1 to avoid overlap with min-width queries
 */
export function maxWidth(bp: BreakpointKey): string {
  return `(max-width: ${breakpoints[bp] - 1}px)`;
}

/**
 * Get a range media query string between two breakpoints
 */
export function between(minBp: BreakpointKey, maxBp: BreakpointKey): string {
  return `(min-width: ${breakpoints[minBp]}px) and (max-width: ${breakpoints[maxBp] - 1}px)`;
}
