/**
 * Vitest Test Setup
 *
 * Browser IDE - Test Environment Configuration
 *
 * This file runs before each test suite to:
 * - Extend Vitest's expect with jest-dom matchers
 * - Configure test globals
 * - Setup automatic cleanup after each test
 */
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
// This allows using expect(element).toBeInTheDocument() etc.
expect.extend(matchers);

// Automatic cleanup after each test
// Ensures no React components are left mounted between tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Configure global test timeout for async operations
// Some services (IndexedDB, Git) can be slow
vi.setConfig({ testTimeout: 10000 });

// Default matchMedia mock (desktop - all min-width queries match above 1024px)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => {
    // Default: desktop viewport (1024px)
    const matches = (() => {
      // Parse max-width: Npx
      const maxMatch = query.match(/max-width:\s*(\d+)px/);
      if (maxMatch) return 1024 <= parseInt(maxMatch[1]);
      // Parse min-width: Npx
      const minMatch = query.match(/min-width:\s*(\d+)px/);
      if (minMatch) return 1024 >= parseInt(minMatch[1]);
      return false;
    })();
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  }),
});
