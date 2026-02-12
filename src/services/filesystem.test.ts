/**
 * FileSystemService Unit Tests
 *
 * Test Plan: PRD/plans/PLAN_TEST-filesystem.md
 * Implementation: src/services/filesystem.ts
 *
 * Testing the LightningFS wrapper service with comprehensive coverage
 * of all file and directory operations.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock file system state - shared across all tests
const mockFSState = new Map<string, { content: string; type: 'file' | 'directory'; mtime?: number }>();

// Create mock functions for the promises API - defined outside so they can be referenced
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockUnlink = vi.fn();
const mockRmdir = vi.fn();
const mockMkdir = vi.fn();
const mockReaddir = vi.fn();
const mockStat = vi.fn();
const mockRename = vi.fn();

// Setup the module mock before any imports
vi.mock('@isomorphic-git/lightning-fs', () => {
  // Create a mock class that can be used with `new`
  class MockLightningFS {
    promises = {
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      unlink: mockUnlink,
      rmdir: mockRmdir,
      mkdir: mockMkdir,
      readdir: mockReaddir,
      stat: mockStat,
      rename: mockRename,
    };
  }

  return {
    default: MockLightningFS,
  };
});

// Import FileSystemService after mocking - use require to avoid ESModule interop issues
const { FileSystemService } = await import('./filesystem');

// =============================================================================
// TEST UTILITIES
// =============================================================================

let fileSystem: FileSystemService;

function resetMockFS(): void {
  mockFSState.clear();
  // Always have root directory
  mockFSState.set('/', { content: '', type: 'directory', mtime: Date.now() });
}

function setupMockBehaviors(): void {
  mockReadFile.mockImplementation((path: string) => {
    const file = mockFSState.get(path);
    if (!file || file.type !== 'file') {
      return Promise.reject(new Error(`ENOENT: no such file or directory, open '${path}'`));
    }
    return Promise.resolve(file.content);
  });

  mockWriteFile.mockImplementation((path: string, content: string) => {
    mockFSState.set(path, { content, type: 'file', mtime: Date.now() });
    return Promise.resolve();
  });

  mockUnlink.mockImplementation((path: string) => {
    if (!mockFSState.has(path)) {
      return Promise.reject(new Error(`ENOENT: no such file or directory, unlink '${path}'`));
    }
    mockFSState.delete(path);
    return Promise.resolve();
  });

  mockRmdir.mockImplementation((path: string) => {
    const file = mockFSState.get(path);
    if (!file) {
      return Promise.reject(new Error(`ENOENT: no such file or directory, rmdir '${path}'`));
    }
    if (file.type !== 'directory') {
      return Promise.reject(new Error(`ENOTDIR: not a directory, rmdir '${path}'`));
    }
    mockFSState.delete(path);
    return Promise.resolve();
  });

  mockMkdir.mockImplementation((path: string) => {
    if (mockFSState.has(path)) {
      const error: any = new Error(`EEXIST: file already exists, mkdir '${path}'`);
      error.code = 'EEXIST';
      return Promise.reject(error);
    }
    mockFSState.set(path, { content: '', type: 'directory', mtime: Date.now() });
    return Promise.resolve();
  });

  mockReaddir.mockImplementation((path: string) => {
    const entries: string[] = [];
    for (const [filePath] of mockFSState.entries()) {
      if (filePath !== path) {
        const relativePath = filePath.startsWith(path + '/')
          ? filePath.slice(path.length + 1)
          : null;

        if (relativePath && !relativePath.includes('/')) {
          entries.push(relativePath);
        }
      }
    }
    return Promise.resolve(entries);
  });

  mockStat.mockImplementation((path: string) => {
    const file = mockFSState.get(path);
    if (!file) {
      return Promise.reject(new Error(`ENOENT: no such file or directory, stat '${path}'`));
    }
    const size = file.type === 'file' ? file.content.length : 0;
    return Promise.resolve({
      isFile: () => file.type === 'file',
      isDirectory: () => file.type === 'directory',
      size,
      mtimeMs: file.mtime || Date.now(),
      mtime: file.mtime || Date.now(),
      mode: 0,
      nlink: 0,
      uid: 0,
      gid: 0,
      ino: 0,
      dev: 0,
      rdev: 0,
      blksize: 0,
      blocks: 0,
      atimeMs: file.mtime || Date.now(),
      ctimeMs: file.mtime || Date.now(),
      birthtimeMs: file.mtime || Date.now(),
      atime: new Date(file.mtime || Date.now()),
      ctime: new Date(file.mtime || Date.now()),
      birthtime: new Date(file.mtime || Date.now()),
    });
  });

  mockRename.mockImplementation((oldPath: string, newPath: string) => {
    if (!mockFSState.has(oldPath)) {
      return Promise.reject(new Error(`ENOENT: no such file or directory, rename '${oldPath}'`));
    }
    const file = mockFSState.get(oldPath)!;
    mockFSState.set(newPath, file);
    mockFSState.delete(oldPath);
    return Promise.resolve();
  });
}

function setupTestFile(path: string, content: string): void {
  // Ensure parent directories exist
  const parts = path.split('/').filter(p => p);
  let currentPath = '';
  for (let i = 0; i < parts.length - 1; i++) {
    currentPath += '/' + parts[i];
    if (!mockFSState.has(currentPath)) {
      mockFSState.set(currentPath, { content: '', type: 'directory', mtime: Date.now() });
    }
  }
  // Normalize to start with /
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  mockFSState.set(normalizedPath, { content, type: 'file', mtime: Date.now() });
}

function setupTestDirectory(path: string): void {
  mockFSState.set(path, { content: '', type: 'directory', mtime: Date.now() });
}

// =============================================================================
// GLOBAL SETUP
// =============================================================================

beforeAll(() => {
  setupMockBehaviors();
});

beforeEach(() => {
  resetMockFS();
  fileSystem = new FileSystemService();
});

afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// INITIALIZATION TESTS
// =============================================================================

describe('FileSystemService - Initialization', () => {
  it('should create FileSystemService instance', () => {
    expect(fileSystem).toBeDefined();
    expect(fileSystem).toBeInstanceOf(FileSystemService);
  });

  it('should have root as default working directory', () => {
    expect(fileSystem.getCurrentWorkingDirectory()).toBe('/');
  });

  it('should get the LightningFS instance', () => {
    const fs = fileSystem.getFS();
    expect(fs).toBeDefined();
    expect(fs.promises).toBeDefined();
  });

  it('should handle multiple initialization calls gracefully', async () => {
    await fileSystem.readFile('/test.txt');
  });
});

// =============================================================================
// DIRECTORY NAVIGATION TESTS
// =============================================================================

describe('FileSystemService - Directory Navigation', () => {
  beforeEach(async () => {
    setupTestDirectory('/src');
    setupTestDirectory('/src/components');
    setupTestFile('/src/test.txt', 'content');
  });

  it('should change to absolute directory', async () => {
    const result = await fileSystem.changeDirectory('/src');

    expect(result.success).toBe(true);
    expect(result.data).toBe('/src');
    expect(fileSystem.getCurrentWorkingDirectory()).toBe('/src');
  });

  it('should change to relative directory', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.changeDirectory('components');

    expect(result.success).toBe(true);
    expect(result.data).toBe('/src/components');
  });

  it('should handle .. in relative paths to go up', async () => {
    await fileSystem.changeDirectory('/src/components');
    const result = await fileSystem.changeDirectory('..');

    expect(result.success).toBe(true);
    expect(result.data).toBe('/src');
  });

  it('should handle multiple .. to go up multiple levels', async () => {
    await fileSystem.changeDirectory('/src/components');
    const result = await fileSystem.changeDirectory('../../');

    expect(result.success).toBe(true);
    expect(result.data).toBe('/');
  });

  it('should handle . in relative paths', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.changeDirectory('./components');

    expect(result.success).toBe(true);
    expect(result.data).toBe('/src/components');
  });

  it('should return error when changing to non-existent directory', async () => {
    const result = await fileSystem.changeDirectory('/nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ENOENT');
  });

  it('should return error when changing to a file (not directory)', async () => {
    setupTestFile('/not-a-dir.txt', 'content');
    const result = await fileSystem.changeDirectory('/not-a-dir.txt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not a directory');
  });

  it('should not allow going above root directory', async () => {
    const result = await fileSystem.changeDirectory('..');

    expect(result.success).toBe(true);
    expect(result.data).toBe('/');
  });
});

// =============================================================================
// FILE READ TESTS
// =============================================================================

describe('FileSystemService - Read File', () => {
  beforeEach(async () => {
    // Reset working directory to root for this test suite
    while (fileSystem.getCurrentWorkingDirectory() !== '/') {
      await fileSystem.changeDirectory('..');
    }
    setupTestFile('/test.txt', 'Hello World');
    setupTestFile('/src/code.ts', 'console.log("hello");');
    setupTestFile('/empty.txt', '');
    setupTestFile('/special.txt', 'Hello\nWorld\t!🎉');
  });

  it('should read file content successfully', async () => {
    const result = await fileSystem.readFile('/test.txt');

    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello World');
  });

  it('should read TypeScript file content', async () => {
    const result = await fileSystem.readFile('/src/code.ts');

    expect(result.success).toBe(true);
    expect(result.data).toBe('console.log("hello");');
  });

  it('should resolve relative paths from current directory', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.readFile('code.ts');

    expect(result.success).toBe(true);
    expect(result.data).toBe('console.log("hello");');
  });

  it('should resolve relative path with ./', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.readFile('./code.ts');

    expect(result.success).toBe(true);
    expect(result.data).toBe('console.log("hello");');
  });

  it('should resolve relative path with ../', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.readFile('../test.txt');

    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello World');
  });

  it('should return error when file does not exist', async () => {
    const result = await fileSystem.readFile('/nonexistent.txt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ENOENT');
  });

  it('should read empty file', async () => {
    const result = await fileSystem.readFile('/empty.txt');

    expect(result.success).toBe(true);
    expect(result.data).toBe('');
  });

  it('should read file with special characters', async () => {
    const result = await fileSystem.readFile('/special.txt');

    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello\nWorld\t!🎉');
  });
});

// =============================================================================
// FILE WRITE TESTS
// =============================================================================

describe('FileSystemService - Write File', () => {
  it('should create new file with content', async () => {
    const result = await fileSystem.writeFile('/new.txt', 'Hello World');

    expect(result.success).toBe(true);
    expect(mockFSState.has('/new.txt')).toBe(true);
  });

  it('should overwrite existing file', async () => {
    setupTestFile('/test.txt', 'old content');

    const result = await fileSystem.writeFile('/test.txt', 'new content');

    expect(result.success).toBe(true);
  });

  it('should create parent directories automatically', async () => {
    const result = await fileSystem.writeFile('/deep/nested/path/file.txt', 'content');

    expect(result.success).toBe(true);
  });

  it('should write to relative path', async () => {
    await fileSystem.changeDirectory('/src');
    setupTestDirectory('/src');
    const result = await fileSystem.writeFile('test.txt', 'content');

    expect(result.success).toBe(true);
  });

  it('should write empty content', async () => {
    const result = await fileSystem.writeFile('/empty.txt', '');

    expect(result.success).toBe(true);
  });

  it('should write special characters', async () => {
    const content = 'Line 1\nLine 2\tTabbed!🎉';
    const result = await fileSystem.writeFile('/special.txt', content);

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// DELETE TESTS
// =============================================================================

describe('FileSystemService - Delete', () => {
  beforeEach(async () => {
    setupTestFile('/file.txt', 'content');
    setupTestDirectory('/empty-dir');
  });

  it('should delete file successfully', async () => {
    const result = await fileSystem.deletePath('/file.txt');

    expect(result.success).toBe(true);
  });

  it('should delete empty directory', async () => {
    const result = await fileSystem.deletePath('/empty-dir');

    expect(result.success).toBe(true);
  });

  it('should return error when deleting non-existent path', async () => {
    const result = await fileSystem.deletePath('/nonexistent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ENOENT');
  });
});

// =============================================================================
// RENAME TESTS
// =============================================================================

describe('FileSystemService - Rename', () => {
  beforeEach(async () => {
    setupTestFile('/old.txt', 'content');
    setupTestDirectory('/old-dir');
  });

  it('should rename file successfully', async () => {
    const result = await fileSystem.rename('/old.txt', '/new.txt');

    expect(result.success).toBe(true);
  });

  it('should rename directory successfully', async () => {
    const result = await fileSystem.rename('/old-dir', '/new-dir');

    expect(result.success).toBe(true);
  });

  it('should return error when source does not exist', async () => {
    const result = await fileSystem.rename('/nonexistent', '/new');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ENOENT');
  });
});

// =============================================================================
// DIRECTORY OPERATIONS TESTS
// =============================================================================

describe('FileSystemService - Directory Operations', () => {
  it('should create single directory', async () => {
    const result = await fileSystem.createDirectory('/new-dir');

    expect(result.success).toBe(true);
  });

  it('should create nested directories', async () => {
    const result = await fileSystem.createDirectory('/a/b/c');

    expect(result.success).toBe(true);
  });

  it('should handle existing directory gracefully', async () => {
    setupTestDirectory('/existing');
    const result = await fileSystem.createDirectory('/existing');

    expect(result.success).toBe(true);
  });

  it('should list directory contents', async () => {
    setupTestFile('/file1.txt', 'a');
    setupTestFile('/file2.txt', 'b');
    setupTestDirectory('/dir1');

    const result = await fileSystem.listCurrentDirectory();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});

// =============================================================================
// UTILITY TESTS
// =============================================================================

describe('FileSystemService - Utilities', () => {
  beforeEach(async () => {
    setupTestFile('/exists.txt', 'content');
  });

  it('should return true for existing file', async () => {
    const exists = await fileSystem.exists('/exists.txt');

    expect(exists).toBe(true);
  });

  it('should return false for non-existent file', async () => {
    const exists = await fileSystem.exists('/nonexistent.txt');

    expect(exists).toBe(false);
  });

  it('should get file stats', async () => {
    setupTestFile('/stats.txt', 'Hello World');
    const result = await fileSystem.stats('/stats.txt');

    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('file');
    expect(result.data?.size).toBeGreaterThan(0);
  });
});

// =============================================================================
// LANGUAGE DETECTION TESTS
// =============================================================================

describe('FileSystemService - Language Detection', () => {
  let fileSystemService: FileSystemService;

  beforeEach(() => {
    fileSystemService = new FileSystemService();
  });

  it('should detect TypeScript from .ts extension', () => {
    expect(fileSystemService.getLanguageFromPath('test.ts')).toBe('typescript');
  });

  it('should detect TypeScript from .tsx extension', () => {
    expect(fileSystemService.getLanguageFromPath('component.tsx')).toBe('typescript');
  });

  it('should detect JavaScript from .js extension', () => {
    expect(fileSystemService.getLanguageFromPath('test.js')).toBe('javascript');
  });

  it('should detect JSON from .json extension', () => {
    expect(fileSystemService.getLanguageFromPath('package.json')).toBe('json');
  });

  it('should detect Markdown from .md extension', () => {
    expect(fileSystemService.getLanguageFromPath('README.md')).toBe('markdown');
  });

  it('should detect CSS from .css extension', () => {
    expect(fileSystemService.getLanguageFromPath('styles.css')).toBe('css');
  });

  it('should detect HTML from .html extension', () => {
    expect(fileSystemService.getLanguageFromPath('index.html')).toBe('html');
  });

  it('should detect Python from .py extension', () => {
    expect(fileSystemService.getLanguageFromPath('script.py')).toBe('python');
  });

  it('should detect Rust from .rs extension', () => {
    expect(fileSystemService.getLanguageFromPath('main.rs')).toBe('rust');
  });

  it('should detect Go from .go extension', () => {
    expect(fileSystemService.getLanguageFromPath('main.go')).toBe('go');
  });

  it('should detect Shell from .sh extension', () => {
    expect(fileSystemService.getLanguageFromPath('script.sh')).toBe('shell');
  });

  it('should detect YAML from .yaml extension', () => {
    expect(fileSystemService.getLanguageFromPath('config.yaml')).toBe('yaml');
  });

  it('should detect YAML from .yml extension', () => {
    expect(fileSystemService.getLanguageFromPath('config.yml')).toBe('yaml');
  });

  it('should return plaintext for unknown extension', () => {
    expect(fileSystemService.getLanguageFromPath('file.unknown')).toBe('plaintext');
  });

  it('should return plaintext for file without extension', () => {
    expect(fileSystemService.getLanguageFromPath('Makefile')).toBe('plaintext');
  });

  it('should detect language from nested path', () => {
    expect(fileSystemService.getLanguageFromPath('/src/components/Button.tsx')).toBe('typescript');
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('FileSystemService - Error Handling', () => {
  it('should return Result<T> pattern for successful operations', async () => {
    setupTestFile('/test.txt', 'content');
    const result = await fileSystem.readFile('/test.txt');

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
  });

  it('should return Result<T> pattern for failed operations', async () => {
    const result = await fileSystem.readFile('/nonexistent.txt');

    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('error');
    expect(result.error).toBeDefined();
  });

  it('should handle file read errors gracefully', async () => {
    const result = await fileSystem.readFile('/does-not-exist.txt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('ENOENT');
  });
});
