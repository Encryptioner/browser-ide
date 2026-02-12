/**
 * Vitest Test Setup
 *
 * Browser IDE Pro v2.0 - Test Environment Configuration
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
