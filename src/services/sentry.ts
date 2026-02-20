/**
 * Sentry Error Tracking Service
 *
 * Integrates Sentry for production error monitoring and tracking.
 * Requires a DSN (Data Source Name) from Sentry.io to be configured in settings.
 */

import * as Sentry from '@sentry/react';
import { logger } from '@/utils/logger';

interface SentryConfig {
  dsn: string;
  environment: 'production' | 'development' | 'test';
  tracesSampleRate: number;
  enabled: boolean;
}

/**
 * Initialize Sentry with the given configuration
 */
export function initSentry(config: SentryConfig): void {
  if (!config.enabled || !config.dsn) {
    logger.info('Sentry is disabled or no DSN configured');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: config.tracesSampleRate,

      // Filter out sensitive data
      beforeSend(event: Sentry.Event) {
        // Don't send events in development
        if (config.environment === 'development') {
          return null;
        }

        // Sanitize event to remove sensitive data
        return sanitizeEvent(event) as Sentry.ErrorEvent | null;
      },

      // Context filters
      beforeBreadcrumb(breadcrumb, _hint) {
        // Filter out breadcrumbs that might contain sensitive data
        return sanitizeBreadcrumb(breadcrumb);
      },
    });

    logger.info('Sentry initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Sanitize event to remove sensitive data like API keys, tokens, passwords
 */
function sanitizeEvent(event: Sentry.Event): Sentry.Event | null {
  if (!event.request) return event;

  // Sanitize URL parameters
  if (event.request.url) {
    event.request.url = sanitizeUrl(event.request.url);
  }

  // Sanitize headers
  if (event.request?.headers) {
    event.request.headers = sanitizeHeaders(event.request.headers);
  }

  // Sanitize cookies
  if (event.request?.cookies) {
    // Type assertion needed as Sentry expects string | Record<string, string> | undefined
    (event.request as { cookies?: string }).cookies = '[FILTERED]';
  }

  // Sanitize extra data
  if (event.extra) {
    (event as { extra: Record<string, unknown> }).extra = sanitizeObject(event.extra) as Record<string, unknown>;
  }

  // Sanitize user context but keep identifying info
  if (event.user) {
    event.user = {
      id: event.user.id,
      email: event.user.email ? '[FILTERED]' : undefined,
      username: event.user.username ? '[FILTERED]' : undefined,
      ip_address: '[FILTERED]',
    };
  }

  // Sanitize contexts
  if (event.contexts) {
    (event as { contexts: Record<string, unknown> }).contexts = sanitizeObject(event.contexts) as Record<string, unknown>;
  }

  // Sanitize tags
  if (event.tags) {
    (event as { tags: Record<string, unknown> }).tags = sanitizeObject(event.tags) as Record<string, unknown>;
  }

  return event;
}

/**
 * Sanitize URL to remove sensitive query parameters
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const sensitiveParams = ['token', 'key', 'password', 'secret', 'auth', 'api_key', 'apikey', 'access_token'];

    sensitiveParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original but with query params removed
    return url.split('?')[0];
  }
}

/**
 * Sanitize headers to remove sensitive values
 */
function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token'];

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveHeaders.includes(lowerKey)) {
      sanitized[key] = '[FILTERED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize object recursively to remove sensitive values
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sensitiveKeys = ['token', 'key', 'password', 'secret', 'auth', 'apiKey', 'api_key', 'apikey', 'accessToken', 'accessToken', 'privateKey', 'githubToken', 'glmKey', 'anthropicKey', 'openaiKey'];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(k => lowerKey.includes(k.toLowerCase()))) {
      sanitized[key] = '[FILTERED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      // Check if string value looks like a sensitive value
      if (value.length > 20 && (value.includes('Bearer ') || value.includes('sk-') || value.includes('ghp_') || value.includes('gho_') || value.includes('ghu_') || value.includes('ghs_'))) {
        sanitized[key] = '[FILTERED]';
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize breadcrumb to filter sensitive data
 */
function sanitizeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  // Filter out breadcrumbs that might contain sensitive data in URLs
  if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
    if (breadcrumb.data?.url) {
      breadcrumb.data.url = sanitizeUrl(breadcrumb.data.url);
    }
  }

  // Filter out console breadcrumbs that might log sensitive data
  if (breadcrumb.category === 'console') {
    if (breadcrumb.data?.args) {
      breadcrumb.data.args = sanitizeObject(breadcrumb.data.args);
    }
  }

  return breadcrumb;
}

/**
 * Report an error to Sentry
 */
export function reportError(error: Error, context?: Record<string, unknown>): void {
  Sentry.withScope(scope => {
    if (context) {
      const sanitized = sanitizeObject(context) as Record<string, unknown>;
      scope.setExtras(sanitized);
    }

    Sentry.captureException(error);
  });
}

/**
 * Report a message to Sentry
 */
export function reportMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>): void {
  Sentry.withScope(scope => {
    if (context) {
      const sanitized = sanitizeObject(context) as Record<string, unknown>;
      scope.setExtras(sanitized);
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id?: string; email?: string; username?: string }): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb to Sentry
 */
export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    category,
    message,
    data: data ? (sanitizeObject(data) as Record<string, unknown>) : undefined,
  });
}

/**
 * Check if Sentry is enabled and configured
 */
export function isSentryEnabled(): boolean {
  try {
    const client = Sentry.getClient();
    return client !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get the Sentry SDK instance for advanced usage
 */
export { Sentry };

/**
 * Export sanitizeObject for testing purposes
 * This function ensures sensitive data is not sent to error tracking
 */
export { sanitizeObject };