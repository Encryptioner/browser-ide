/**
 * Test Mocks and Mock Factories
 *
 * Browser IDE Pro v2.0 - Mock Definitions
 *
 * This file provides mock implementations of all services
 * for isolated unit testing.
 */
import { vi } from 'vitest';

// =============================================================================
// FILE SYSTEM MOCKS
// =============================================================================

/**
 * Mock FileSystemService
 *
 * LightningFS wrapper mock for file operations.
 *
 * Usage:
 * ```typescript
 * import { mockFileSystem } from '@/tests/mocks';
 * vi.mock('@/services/filesystem', () => mockFileSystem);
 * ```
 */
export const mockFileSystem = {
  init: vi.fn().mockResolvedValue({ success: true }),
  readFile: vi.fn().mockResolvedValue({ success: true, data: 'file content' }),
  writeFile: vi.fn().mockResolvedValue({ success: true }),
  deleteFile: vi.fn().mockResolvedValue({ success: true }),
  mkdir: vi.fn().mockResolvedValue({ success: true }),
  readdir: vi.fn().mockResolvedValue({ success: true, data: [] }),
  stat: vi.fn().mockResolvedValue({
    success: true,
    data: { type: 'file', size: 100, mtime: Date.now() },
  }),
  exists: vi.fn().mockResolvedValue(true),

  /**
   * Mock successful readFile
   */
  mockReadFileSuccess: (content: string) => {
    mockFileSystem.readFile.mockResolvedValueOnce({ success: true, data: content });
  },

  /**
   * Mock successful writeFile
   */
  mockWriteFileSuccess: () => {
    mockFileSystem.writeFile.mockResolvedValueOnce({ success: true });
  },

  /**
   * Mock file not found error
   */
  mockFileNotFound: () => {
    mockFileSystem.readFile.mockResolvedValueOnce({
      success: false,
      error: 'File not found',
    });
  },

  /**
   * Reset all mocks to default behavior
   */
  reset: () => {
    mockFileSystem.init.mockResolvedValue({ success: true });
    mockFileSystem.readFile.mockResolvedValue({ success: true, data: '' });
    mockFileSystem.writeFile.mockResolvedValue({ success: true });
    mockFileSystem.deleteFile.mockResolvedValue({ success: true });
    mockFileSystem.mkdir.mockResolvedValue({ success: true });
    mockFileSystem.readdir.mockResolvedValue({ success: true, data: [] });
    mockFileSystem.stat.mockResolvedValue({
      success: true,
      data: { type: 'file', size: 0, mtime: 0 },
    });
    mockFileSystem.exists.mockResolvedValue(false);
  },
};

// =============================================================================
// GIT SERVICE MOCKS
// =============================================================================

/**
 * Mock GitService
 *
 * isomorphic-git wrapper mock for Git operations.
 *
 * Usage:
 * ```typescript
 * import { mockGitService } from '@/tests/mocks';
 * vi.mock('@/services/git', () => mockGitService);
 * ```
 */
export const mockGitService = {
  clone: vi.fn().mockResolvedValue({ success: true }),
  status: vi.fn().mockResolvedValue({ success: true, data: [] }),
  add: vi.fn().mockResolvedValue({ success: true }),
  resetStaged: vi.fn().mockResolvedValue({ success: true }),
  commit: vi.fn().mockResolvedValue({ success: true, data: 'abc123' }),
  push: vi.fn().mockResolvedValue({ success: true }),
  pull: vi.fn().mockResolvedValue({ success: true }),
  fetch: vi.fn().mockResolvedValue({ success: true }),
  checkout: vi.fn().mockResolvedValue({ success: true }),
  branch: vi.fn().mockResolvedValue({ success: true, data: [] }),
  createBranch: vi.fn().mockResolvedValue({ success: true }),
  deleteBranch: vi.fn().mockResolvedValue({ success: true }),
  log: vi.fn().mockResolvedValue({ success: true, data: [] }),
  diff: vi.fn().mockResolvedValue({ success: true, data: '' }),

  mockStatusClean: () => {
    mockGitService.status.mockResolvedValueOnce({ success: true, data: [] });
  },

  mockStatusDirty: (files: Array<{ path: string; status: string }>) => {
    mockGitService.status.mockResolvedValueOnce({ success: true, data: files });
  },

  reset: () => {
    mockGitService.clone.mockResolvedValue({ success: true });
    mockGitService.status.mockResolvedValue({ success: true, data: [] });
    mockGitService.add.mockResolvedValue({ success: true });
    mockGitService.resetStaged.mockResolvedValue({ success: true });
    mockGitService.commit.mockResolvedValue({ success: true, data: 'abc123' });
    mockGitService.push.mockResolvedValue({ success: true });
    mockGitService.pull.mockResolvedValue({ success: true });
    mockGitService.checkout.mockResolvedValue({ success: true });
    mockGitService.branch.mockResolvedValue({ success: true, data: [] });
  },
};

// =============================================================================
// WEB CONTAINER MOCKS
// =============================================================================

/**
 * Mock WebContainerService
 *
 * WebContainer API mock for code execution.
 */
export const mockWebContainer = {
  boot: vi.fn().mockResolvedValue({ success: true }),
  spawn: vi.fn().mockResolvedValue({
    success: true,
    data: { exitCode: 0, output: '', stderr: '' },
  }),
  writeFile: vi.fn().mockResolvedValue({ success: true }),
  readFile: vi.fn().mockResolvedValue({ success: true, data: '' }),
  fs: vi.fn().mockReturnValue({
    readFile: vi.fn().mockResolvedValue({ success: true, data: '' }),
    writeFile: vi.fn().mockResolvedValue({ success: true }),
    readdir: vi.fn().mockResolvedValue({ success: true, data: [] }),
  }),

  reset: () => {
    mockWebContainer.boot.mockResolvedValue({ success: true });
    mockWebContainer.spawn.mockResolvedValue({
      success: true,
      data: { exitCode: 0, output: '', stderr: '' },
    });
  },
};

// =============================================================================
// AI PROVIDER MOCKS
// =============================================================================

/**
 * Mock AI Provider Registry
 *
 * Multi-LLM provider registry mock.
 */
export const mockAIRegistry = {
  register: vi.fn(),
  getActive: vi.fn(),
  setActive: vi.fn(),
  getProviders: vi.fn().mockReturnValue([]),

  mockStreamingResponse: (chunks: string[]) => {
    const asyncStream = async function* () {
      for (const chunk of chunks) {
        yield { content: chunk, done: false };
      }
      yield { content: '', done: true };
    };
    return asyncStream();
  },

  reset: () => {
    mockAIRegistry.register.mockClear();
    mockAIRegistry.getActive.mockClear();
    mockAIRegistry.setActive.mockClear();
    mockAIRegistry.getProviders.mockReturnValue([]);
  },
};

// =============================================================================
// TERMINAL SERVICE MOCKS
// =============================================================================

/**
 * Mock TerminalSessionService
 *
 * Terminal session management mock.
 */
export const mockTerminalSessionService = {
  createSession: vi.fn().mockReturnValue('session-id'),
  getSession: vi.fn(),
  getAllSessions: vi.fn().mockReturnValue([]),
  closeSession: vi.fn(),
  writeOutput: vi.fn(),
  addCommand: vi.fn(),

  reset: () => {
    mockTerminalSessionService.createSession.mockReturnValue('session-id');
    mockTerminalSessionService.getAllSessions.mockReturnValue([]);
  },
};

// =============================================================================
// MOCK FACTORY
// =============================================================================

/**
 * Reset all mocks to their default state.
 *
 * Call this in beforeEach() to ensure clean state for each test.
 */
export function resetAllMocks(): void {
  mockFileSystem.reset();
  mockGitService.reset();
  mockWebContainer.reset();
  mockAIRegistry.reset();
  mockTerminalSessionService.reset();
}

/**
 * Setup common vi.mock() calls for all services.
 *
 * Use this in test files to automatically mock all services.
 *
 * @example
 * ```typescript
 * import { setupServiceMocks } from '@/tests/mocks';
 *
 * describe('MyComponent', () => {
 *   beforeEach(() => {
 *     setupServiceMocks();
 *   });
 * });
 * ```
 */
export function setupServiceMocks(): void {
  vi.mock('@/services/filesystem', () => mockFileSystem);
  vi.mock('@/services/git', () => mockGitService);
  vi.mock('@/services/webcontainer', () => mockWebContainer);
  vi.mock('@/services/ai-providers', () => mockAIRegistry);
  vi.mock('@/services/terminalSession', () => mockTerminalSessionService);
}
