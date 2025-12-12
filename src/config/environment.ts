/**
 * Environment Configuration
 * Centralized configuration management for different environments
 */

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  IS_DEV: boolean;
  IS_PROD: boolean;
  IS_TEST: boolean;
  APP_NAME: string;
  APP_VERSION: string;
  API_TIMEOUT: number;
  MAX_FILE_SIZE: number;
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_TRACKING: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  // Mobile Keyboard Configuration
  MOBILE_KEYBOARD: {
    ENABLE_VIRTUAL_KEYBOARD_API: boolean;
    AUTO_HIDE_ON_BLUR: boolean;
    OVERLAYS_CONTENT: boolean;
    KEYBOARD_HEIGHT_THRESHOLD: number;
    DEBOUNCE_DELAY: number;
    EXPERIMENTAL_FEATURES: boolean;
    SHOW_TEST_CONTROLS: boolean; // Only show test controls in development
  };
}

// Get environment from Vite
const env = import.meta.env.MODE || 'development';

// Environment configuration
export const config: EnvironmentConfig = {
  NODE_ENV: env as 'development' | 'production' | 'test',
  IS_DEV: env === 'development',
  IS_PROD: env === 'production',
  IS_TEST: env === 'test',
  APP_NAME: 'Browser IDE Pro',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',

  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB

  // Feature Flags
  ENABLE_ANALYTICS: env === 'production',
  ENABLE_ERROR_TRACKING: env === 'production',

  // Logging
  LOG_LEVEL: env === 'production' ? 'warn' : 'debug',

  // Mobile Keyboard Configuration
  MOBILE_KEYBOARD: {
    ENABLE_VIRTUAL_KEYBOARD_API: env === 'development', // Enable in dev for testing
    AUTO_HIDE_ON_BLUR: true,
    OVERLAYS_CONTENT: true,
    KEYBOARD_HEIGHT_THRESHOLD: 100, // Minimum height to consider keyboard visible
    DEBOUNCE_DELAY: 150, // Debounce keyboard events
    EXPERIMENTAL_FEATURES: env === 'development', // Enable experimental features in dev
    SHOW_TEST_CONTROLS: env === 'development', // Only show test controls in development
  },
};

// Freeze config to prevent modifications
Object.freeze(config);

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const required: (keyof EnvironmentConfig)[] = [
    'NODE_ENV',
    'APP_NAME',
    'APP_VERSION',
  ];

  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Get environment-specific configuration
 */
export function getConfig<K extends keyof EnvironmentConfig>(
  key: K
): EnvironmentConfig[K] {
  return config[key];
}

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => config.IS_DEV;

/**
 * Check if running in production
 */
export const isProduction = (): boolean => config.IS_PROD;

/**
 * Check if running in test
 */
export const isTest = (): boolean => config.IS_TEST;
