/**
 * Build-time feature flags resolved from environment variables.
 *
 * All features default to enabled (true) unless explicitly set to 'false'.
 * This allows the full build to work with zero configuration while
 * GitHub Pages and other restricted environments can selectively disable features.
 *
 * Usage:
 *   import { features } from '@/config/features';
 *   if (features.webContainer) { ... }
 */
export const features = {
  /** WebContainer support (requires COOP/COEP headers from the hosting server) */
  webContainer: import.meta.env.VITE_FEATURE_WEBCONTAINER !== 'false',
  /** AI provider integrations */
  aiProviders: import.meta.env.VITE_FEATURE_AI !== 'false',
  /** Git remote operations (CORS proxy needed) */
  gitRemote: import.meta.env.VITE_FEATURE_GIT_REMOTE !== 'false',
} as const;

export type FeatureFlags = typeof features;
