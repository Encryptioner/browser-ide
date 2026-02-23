/**
 * Sentry Error Tracking Service Tests
 *
 * Test Plan: N/A (new service)
 * Implementation: src/services/sentry.ts
 *
 * Testing the Sentry integration service with focus on:
 * - Data sanitization (API keys, tokens, passwords)
 * - Error reporting functionality
 * - User context handling
 * - Breadcrumb filtering
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock Sentry to prevent actual initialization in tests
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((callback) => {
    callback({
      setExtras: vi.fn(),
      setLevel: vi.fn(),
      setUser: vi.fn(),
    });
  }),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  getCurrentHub: vi.fn(() => ({
    getClient: vi.fn(() => ({})),
  })),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

// =============================================================================
// IMPORT AFTER MOCKS
// =============================================================================

import {
  sanitizeObject,
  reportError,
  reportMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  isSentryEnabled,
} from '@/services/sentry';

// =============================================================================
// SANITIZATION TESTS
// =============================================================================

describe('Sentry - Data Sanitization', () => {
  it('should sanitize API keys in object', () => {
    const obj = {
      apiKey: 'sk-1234567890abcdef',
      name: 'test',
      token: 'ghp_1234567890',
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect(sanitized.apiKey).toBe('[FILTERED]');
    expect(sanitized.token).toBe('[FILTERED]');
    expect(sanitized.name).toBe('test');
  });

  it('should sanitize nested objects', () => {
    const obj = {
      user: {
        name: 'John',
        apiKey: 'secret-key',
        settings: {
          password: 'hunter2',
          theme: 'dark',
        },
      },
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect((sanitized.user as Record<string, unknown>).apiKey).toBe('[FILTERED]');
    expect((sanitized.user as Record<string, unknown>).name).toBe('John');
    expect(((sanitized.user as Record<string, unknown>).settings as Record<string, unknown>).password).toBe('[FILTERED]');
  });

  it('should sanitize arrays', () => {
    const obj = {
      items: [
        { name: 'item1', token: 'secret1' },
        { name: 'item2', token: 'secret2' },
      ],
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect(Array.isArray(sanitized.items)).toBe(true);
    expect(((sanitized.items as Record<string, unknown>[])[0]).token).toBe('[FILTERED]');
    expect(((sanitized.items as Record<string, unknown>[])[0]).name).toBe('item1');
  });

  it('should sanitize common token patterns in strings', () => {
    const obj = {
      bearerToken: 'Bearer sk-1234567890',
      githubToken: 'ghp_1234567890',
      normalValue: 'normal-value',
      apiKey: 'sk-1234567890',
      gitHubOAuth: 'gho_1234567890',
      short: 'short', // Too short to be a token
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect(sanitized.bearerToken).toBe('[FILTERED]');
    expect(sanitized.githubToken).toBe('[FILTERED]');
    expect(sanitized.normalValue).toBe('normal-value');
    expect(sanitized.apiKey).toBe('[FILTERED]');
    expect(sanitized.gitHubOAuth).toBe('[FILTERED]');
    expect(sanitized.short).toBe('short');
  });

  it('should preserve numbers and booleans', () => {
    const obj = {
      count: 42,
      enabled: true,
      ratio: 3.14,
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect(sanitized.count).toBe(42);
    expect(sanitized.enabled).toBe(true);
    expect(sanitized.ratio).toBe(3.14);
  });

  it('should handle null and undefined', () => {
    const obj = {
      value: null,
      undefined: undefined,
      empty: '',
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect(sanitized.value).toBeNull();
    expect(sanitized.undefined).toBeUndefined();
    expect(sanitized.empty).toBe('');
  });
});

// =============================================================================
// ERROR REPORTING TESTS
// =============================================================================

describe('Sentry - Error Reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should report error to Sentry', () => {
    const error = new Error('Test error');
    const context = { userId: '123' };

    // This test verifies reportError doesn't throw
    expect(() => reportError(error, context)).not.toThrow();
  });

  it('should report message to Sentry', () => {
    const message = 'Test message';
    const level = 'warning' as const;
    const context = { component: 'TestComponent' };

    // This test verifies reportMessage doesn't throw
    expect(() => reportMessage(message, level, context)).not.toThrow();
  });

  it('should check Sentry enabled status', () => {
    // The isSentryEnabled function checks if Sentry client is available
    // In test environment, it should return a boolean
    const enabled = isSentryEnabled();
    expect(typeof enabled).toBe('boolean');
  });
});

// =============================================================================
// USER CONTEXT TESTS
// =============================================================================

describe('Sentry - User Context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set user context', () => {
    const user = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    // This test verifies setUser doesn't throw
    expect(() => setUser(user)).not.toThrow();
  });

  it('should clear user context', () => {
    // This test verifies clearUser doesn't throw
    expect(() => clearUser()).not.toThrow();
  });

  it('should add breadcrumb', () => {
    const category = 'user';
    const message = 'Clicked button';
    const data = { buttonId: 'submit' };

    // This test verifies addBreadcrumb doesn't throw
    expect(() => addBreadcrumb(category, message, data)).not.toThrow();
  });
});

// =============================================================================
// SANITIZATION REGRESSION TESTS
// These tests ensure sensitive data is not leaked in production
// =============================================================================

describe('Sentry - Sanitization Regression Tests', () => {
  it('should filter all known sensitive key patterns', () => {
    const obj = {
      // Direct key matches
      token: 'secret',
      key: 'secret',
      password: 'secret',
      secret: 'secret',
      auth: 'secret',
      apiKey: 'secret',
      api_key: 'secret',
      apikey: 'secret',
      accessToken: 'secret',
      privateKey: 'secret',
      githubToken: 'secret',
      glmKey: 'secret',
      anthropicKey: 'secret',
      openaiKey: 'secret',

      // Case-insensitive matching
      TOKEN: 'secret',
      Password: 'secret',

      // Substring matching
      userToken: 'secret',
      authToken: 'secret',
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    // All sensitive values should be filtered
    expect(Object.values(sanitized).every(v => v === '[FILTERED]' || typeof v !== 'string')).toBe(true);
  });

  it('should not filter non-sensitive keys', () => {
    const obj = {
      name: 'John Doe',
      email: 'john@example.com',
      id: '12345',
      count: 42,
      message: 'Hello world',
      error: 'Something went wrong',
      status: 'pending',
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;

    expect(sanitized.name).toBe('John Doe');
    expect(sanitized.email).toBe('john@example.com');
    expect(sanitized.message).toBe('Hello world');
  });

  it('should handle deeply nested sensitive data', () => {
    const obj = {
      level1: {
        level2: {
          level3: {
            secret: 'very-secret',
            normal: 'public-info',
          },
        },
      },
    };

    const sanitized = sanitizeObject(obj) as Record<string, unknown>;
    const level1 = sanitized.level1 as Record<string, unknown>;
    const level2 = level1.level2 as Record<string, unknown>;
    const level3 = level2.level3 as Record<string, unknown>;

    expect(level3.secret).toBe('[FILTERED]');
    expect(level3.normal).toBe('public-info');
  });
});
