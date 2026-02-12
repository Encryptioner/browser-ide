/**
 * React Test Utilities
 *
 * Browser IDE Pro v2.0 - Component Testing Helpers
 *
 * This file provides utility functions for testing React components
 * with proper providers and context.
 */
import { render, RenderOptions, renderHook } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function that wraps components with necessary providers
 *
 * This includes:
 * - Zustand store providers
 * - Router (if needed)
 * - Theme providers
 *
 * @param ui - React element to render
 * @param options - Render options (excluding wrapper)
 * @returns Render result with queries
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // For now, just use standard render
  // TODO: Add providers as needed (Zustand, Router, etc.)
  return render(ui, options);
}

/**
 * Render a hook with providers
 *
 * @param hook - Hook to render
 * @param options - Render options
 * @returns Render result with hook result
 */
export function renderHookWithProviders<Result>(
  hook: () => Result,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return renderHook(hook, options);
}

/**
 * Create a mock store state for testing Zustand stores
 *
 * @param initialState - Partial store state to use as initial state
 * @returns Mock store with state and actions
 *
 * @example
 * ```typescript
 * const mockStore = createMockStore({
 *   currentProject: 'project-1',
 *   openFiles: ['file1.ts', 'file2.ts'],
 * });
 * ```
 */
export function createMockStore<T extends Record<string, unknown>>(initialState: T): T {
  return {
    ...initialState,
    // Add mock actions as needed
  } as T;
}

/**
 * Wait for async operations to complete
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after timeout
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock file tree for testing
 *
 * @param tree - File tree structure
 * @returns Flattened file nodes
 *
 * @example
 * ```typescript
 * const fileTree = createMockFileTree({
 *   'src': {
 *     type: 'directory',
 *     children: {
 *       'index.ts': { type: 'file' },
 *       'App.tsx': { type: 'file' },
 *     },
 *   },
 * });
 * ```
 */
export function createMockFileTree(tree: Record<string, unknown>): Array<{
  path: string;
  name: string;
  type: 'file' | 'directory';
}> {
  const result: Array<{ path: string; name: string; type: 'file' | 'directory' }> = [];

  function traverse(obj: Record<string, unknown>, parentPath = ''): void {
    for (const [name, value] of Object.entries(obj)) {
      const path = parentPath ? `${parentPath}/${name}` : name;

      if (value && typeof value === 'object' && 'type' in value) {
        // It's a file or directory node
        const node = value as { type?: string; children?: Record<string, unknown> };
        result.push({ path, name, type: node.type || 'file' });

        if (node.children) {
          traverse(node.children, path);
        }
      } else if (value && typeof value === 'object' && 'children' in value) {
        // It's a directory with children
        result.push({ path, name, type: 'directory' });
        traverse((value as { children: Record<string, unknown> }).children, path);
      } else {
        // It's a file
        result.push({ path, name, type: 'file' });
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Mock console methods to avoid cluttering test output
 *
 * Call this in tests if you need to verify console calls
 *
 * @returns Mock console object with spy functions
 */
export function mockConsole(): {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };

  afterEach(() => {
    consoleSpy.log.mockReset();
    consoleSpy.warn.mockReset();
    consoleSpy.error.mockReset();
    consoleSpy.info.mockReset();
  });

  return consoleSpy;
}

/**
 * Create a mock event for testing
 *
 * @param type - Event type
 * @param data - Event data
 * @returns Mock event object
 */
export function createMockEvent<T extends string>(
  type: T,
  data: Record<string, unknown> = {}
): Event & { data: Record<string, unknown> } {
  return {
    type,
    bubbles: false,
    cancelable: false,
    ...data,
  } as Event & { data: Record<string, unknown> };
}
