# Test Plan: FileSystemService

**Plan ID:** P2-001
**Service:** `src/services/filesystem.ts`
**Created:** February 2026
**Status:** Ready for Implementation

---

## Service Overview

The FileSystemService is a singleton service that wraps LightningFS for browser-based file operations using IndexedDB. It provides a virtual file system with directory navigation, file CRUD operations, and path resolution.

### Key Features
- LightningFS wrapper with IndexedDB persistence
- Current working directory management
- Path resolution (relative/absolute paths)
- Directory operations: `createDirectory`, `changeDirectory`, `listCurrentDirectory`
- File operations: `readFile`, `writeFile`, `deletePath`, `rename`
- Utility operations: `exists`, `stats`, `buildFileTree`, `getLanguageFromPath`

---

## Test File Location

```
src/services/filesystem.test.ts
```

**Rationale:** Co-located test file for easier maintenance and better IDE navigation.

---

## Methods to Test

| Method | Purpose | Test Priority |
|--------|---------|---------------|
| `init()` / `initialize()` | LightningFS initialization | P0 |
| `getCurrentWorkingDirectory()` | Get current directory path | P0 |
| `changeDirectory(path)` | Change current directory | P0 |
| `readFile(path)` | Read file contents | P0 |
| `writeFile(path, content)` | Write/create file | P0 |
| `deletePath(path)` | Delete file or directory | P0 |
| `rename(oldPath, newPath)` | Rename file or directory | P1 |
| `createDirectory(path)` | Create directory | P0 |
| `exists(path)` | Check if path exists | P1 |
| `stats(path)` | Get file metadata | P1 |
| `listCurrentDirectory()` | List files in current dir | P0 |
| `buildFileTree(path, maxDepth)` | Build recursive file tree | P1 |
| `getLanguageFromPath(path)` | Detect language from extension | P2 |
| `resolvePath(path)` | Resolve relative/absolute paths | P1 |
| `normalizePath(path)` | Clean up path (.., ., //) | P1 |

---

## Mock Strategy

### LightningFS Mock
```typescript
vi.mock('@isomorphic-git/lightning-fs', () => ({
  default: vi.fn().mockImplementation(() => ({
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      unlink: vi.fn(),
      rmdir: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
      rename: vi.fn(),
    }
  }))
}));
```

### Test Fixtures
```typescript
// Mock file system state
const mockFSState = new Map<string, string>();

function setupMockFS() {
  mockFSState.set('/test.txt', 'Hello World');
  mockFSState.set('/src/index.ts', 'console.log("hello");');
}

function resetMockFS() {
  mockFSState.clear();
}
```

---

## Test Cases by Method

### 1. Initialization Tests

```typescript
describe('FileSystemService - Initialization', () => {
  it('should initialize LightningFS on construction', async () => {
    const fs = new FileSystemService();
    await fs.init();
    expect(fs.getFS()).toBeDefined();
  });

  it('should set root as default working directory', () => {
    const fs = new FileSystemService();
    expect(fs.getCurrentWorkingDirectory()).toBe('/');
  });

  it('should handle multiple initialization calls gracefully', async () => {
    const fs = new FileSystemService();
    await fs.init();
    await fs.init();
    expect(fs.getFS()).toBeDefined();
  });
});
```

### 2. Directory Navigation Tests

```typescript
describe('FileSystemService - Directory Navigation', () => {
  it('should change to absolute directory', async () => {
    const result = await fileSystem.changeDirectory('/src');
    expect(result.success).toBe(true);
    expect(result.data).toBe('/src');
  });

  it('should change to relative directory', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.changeDirectory('components');
    expect(result.success).toBe(true);
    expect(result.data).toBe('/src/components');
  });

  it('should handle .. in relative paths', async () => {
    await fileSystem.changeDirectory('/src/components');
    const result = await fileSystem.changeDirectory('..');
    expect(result.success).toBe(true);
    expect(result.data).toBe('/src');
  });

  it('should return error when changing to non-directory', async () => {
    await fileSystem.writeFile('/test.txt', 'content');
    const result = await fileSystem.changeDirectory('/test.txt');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not a directory');
  });

  it('should return error when directory does not exist', async () => {
    const result = await fileSystem.changeDirectory('/nonexistent');
    expect(result.success).toBe(false);
  });
});
```

### 3. File Read Tests

```typescript
describe('FileSystemService - Read File', () => {
  it('should read file content successfully', async () => {
    await fileSystem.writeFile('/test.txt', 'Hello World');
    const result = await fileSystem.readFile('/test.txt');
    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello World');
  });

  it('should resolve relative paths for reading', async () => {
    await fileSystem.changeDirectory('/src');
    await fileSystem.writeFile('/src/test.txt', 'content');
    const result = await fileSystem.readFile('test.txt');
    expect(result.success).toBe(true);
  });

  it('should return error when file does not exist', async () => {
    const result = await fileSystem.readFile('/nonexistent.txt');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle empty files', async () => {
    await fileSystem.writeFile('/empty.txt', '');
    const result = await fileSystem.readFile('/empty.txt');
    expect(result.success).toBe(true);
    expect(result.data).toBe('');
  });

  it('should handle special characters in file content', async () => {
    const content = 'Hello\nWorld\t!🎉';
    await fileSystem.writeFile('/special.txt', content);
    const result = await fileSystem.readFile('/special.txt');
    expect(result.data).toBe(content);
  });
});
```

### 4. File Write Tests

```typescript
describe('FileSystemService - Write File', () => {
  it('should create new file with content', async () => {
    const result = await fileSystem.writeFile('/new.txt', 'content');
    expect(result.success).toBe(true);

    const readResult = await fileSystem.readFile('/new.txt');
    expect(readResult.data).toBe('content');
  });

  it('should overwrite existing file', async () => {
    await fileSystem.writeFile('/test.txt', 'old');
    const result = await fileSystem.writeFile('/test.txt', 'new');
    expect(result.success).toBe(true);

    const readResult = await fileSystem.readFile('/test.txt');
    expect(readResult.data).toBe('new');
  });

  it('should create parent directories automatically', async () => {
    const result = await fileSystem.writeFile('/deep/nested/file.txt', 'content');
    expect(result.success).toBe(true);
  });

  it('should handle relative paths for writing', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.writeFile('test.txt', 'content');
    expect(result.success).toBe(true);
  });

  it('should handle empty content', async () => {
    const result = await fileSystem.writeFile('/empty.txt', '');
    expect(result.success).toBe(true);
  });
});
```

### 5. Delete Tests

```typescript
describe('FileSystemService - Delete', () => {
  it('should delete file successfully', async () => {
    await fileSystem.writeFile('/test.txt', 'content');
    const result = await fileSystem.deletePath('/test.txt');
    expect(result.success).toBe(true);

    const exists = await fileSystem.exists('/test.txt');
    expect(exists).toBe(false);
  });

  it('should delete empty directory', async () => {
    await fileSystem.createDirectory('/empty-dir');
    const result = await fileSystem.deletePath('/empty-dir');
    expect(result.success).toBe(true);
  });

  it('should return error when deleting non-existent path', async () => {
    const result = await fileSystem.deletePath('/nonexistent');
    expect(result.success).toBe(false);
  });

  it('should handle relative paths for deletion', async () => {
    await fileSystem.changeDirectory('/src');
    await fileSystem.writeFile('/src/test.txt', 'content');
    const result = await fileSystem.deletePath('test.txt');
    expect(result.success).toBe(true);
  });
});
```

### 6. Rename Tests

```typescript
describe('FileSystemService - Rename', () => {
  it('should rename file successfully', async () => {
    await fileSystem.writeFile('/old.txt', 'content');
    const result = await fileSystem.rename('/old.txt', '/new.txt');
    expect(result.success).toBe(true);

    const existsOld = await fileSystem.exists('/old.txt');
    const existsNew = await fileSystem.exists('/new.txt');
    expect(existsOld).toBe(false);
    expect(existsNew).toBe(true);
  });

  it('should rename directory successfully', async () => {
    await fileSystem.createDirectory('/old-dir');
    const result = await fileSystem.rename('/old-dir', '/new-dir');
    expect(result.success).toBe(true);
  });

  it('should handle relative paths', async () => {
    await fileSystem.changeDirectory('/src');
    await fileSystem.writeFile('/src/old.txt', 'content');
    const result = await fileSystem.rename('old.txt', 'new.txt');
    expect(result.success).toBe(true);
  });

  it('should return error when source does not exist', async () => {
    const result = await fileSystem.rename('/nonexistent', '/new');
    expect(result.success).toBe(false);
  });
});
```

### 7. Directory Operations Tests

```typescript
describe('FileSystemService - Directory Operations', () => {
  it('should create directory successfully', async () => {
    const result = await fileSystem.createDirectory('/new-dir');
    expect(result.success).toBe(true);

    const stats = await fileSystem.stats('/new-dir');
    expect(stats.success).toBe(true);
    expect(stats.data?.type).toBe('directory');
  });

  it('should create nested directories', async () => {
    const result = await fileSystem.createDirectory('/a/b/c');
    expect(result.success).toBe(true);
  });

  it('should handle existing directory gracefully', async () => {
    await fileSystem.createDirectory('/existing');
    const result = await fileSystem.createDirectory('/existing');
    expect(result.success).toBe(true);
  });

  it('should list directory contents', async () => {
    await fileSystem.writeFile('/file1.txt', 'a');
    await fileSystem.writeFile('/file2.txt', 'b');
    await fileSystem.createDirectory('/dir1');

    const result = await fileSystem.listCurrentDirectory();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('should sort directories before files', async () => {
    await fileSystem.createDirectory('/z-dir');
    await fileSystem.writeFile('/a-file.txt', 'a');

    const result = await fileSystem.listCurrentDirectory();
    expect(result.data?.[0].type).toBe('directory');
  });
});
```

### 8. Path Resolution Tests

```typescript
describe('FileSystemService - Path Resolution', () => {
  it('should resolve absolute paths', async () => {
    await fileSystem.changeDirectory('/src');
    // Absolute path should ignore current directory
    const result = await fileSystem.readFile('/test.txt');
    // Should attempt to read from /test.txt, not /src/test.txt
  });

  it('should resolve relative paths', async () => {
    await fileSystem.changeDirectory('/src');
    // Relative path should be resolved against current directory
    const result = await fileSystem.readFile('test.txt');
    // Should attempt to read from /src/test.txt
  });

  it('should handle . in paths', async () => {
    await fileSystem.changeDirectory('/src');
    const result = await fileSystem.readFile('./test.txt');
    // Should resolve to /src/test.txt
  });

  it('should handle .. in paths', async () => {
    await fileSystem.changeDirectory('/src/components');
    const result = await fileSystem.readFile('../test.txt');
    // Should resolve to /src/test.txt
  });

  it('should normalize duplicate slashes', () => {
    // Test internal normalizePath function
  });

  it('should normalize .. and . components', () => {
    // Test path like /a/b/../c -> /a/c
  });
});
```

### 9. File Tree Tests

```typescript
describe('FileSystemService - File Tree', () => {
  it('should build flat file tree', async () => {
    await fileSystem.writeFile('/a.txt', 'a');
    await fileSystem.writeFile('/b.txt', 'b');

    const tree = await fileSystem.buildFileTree('/', 1);
    expect(tree).toHaveLength(2);
  });

  it('should build nested file tree', async () => {
    await fileSystem.writeFile('/src/index.ts', '');
    await fileSystem.writeFile('/src/app.tsx', '');
    await fileSystem.writeFile('/public/index.html', '');

    const tree = await fileSystem.buildFileTree('/', 3);
    const srcNode = tree.find(n => n.name === 'src');
    expect(srcNode?.children).toHaveLength(2);
  });

  it('should respect maxDepth parameter', async () => {
    await fileSystem.writeFile('/a/b/c/d.txt', '');

    const tree = await fileSystem.buildFileTree('/', 2);
    // Should not go deeper than 2 levels
  });

  it('should detect circular references', async () => {
    // Should use visited set to prevent infinite loops
  });
});
```

### 10. Utility Tests

```typescript
describe('FileSystemService - Utilities', () => {
  it('should check file existence correctly', async () => {
    await fileSystem.writeFile('/exists.txt', 'content');

    const exists = await fileSystem.exists('/exists.txt');
    const notExists = await fileSystem.exists('/nonexistent.txt');

    expect(exists).toBe(true);
    expect(notExists).toBe(false);
  });

  it('should get file stats', async () => {
    await fileSystem.writeFile('/test.txt', 'content');

    const result = await fileSystem.stats('/test.txt');
    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('file');
    expect(result.data?.size).toBeGreaterThan(0);
  });

  it('should detect language from file extension', () => {
    expect(fileSystem.getLanguageFromPath('test.ts')).toBe('typescript');
    expect(fileSystem.getLanguageFromPath('test.js')).toBe('javascript');
    expect(fileSystem.getLanguageFromPath('test.json')).toBe('json');
    expect(fileSystem.getLanguageFromPath('test.md')).toBe('markdown');
    expect(fileSystem.getLanguageFromPath('test.unknown')).toBe('plaintext');
  });

  it('should get legacy readDir for compatibility', async () => {
    await fileSystem.writeFile('/test.txt', 'content');

    const files = await fileSystem.readDir('/');
    expect(files.length).toBeGreaterThan(0);
  });
});
```

---

## Edge Cases to Cover

1. **IndexedDB Quota Exceeded**
   - Mock quota exceeded error
   - Verify proper error message

2. **Concurrent Operations**
   - Multiple simultaneous read/write operations
   - Race condition handling

3. **Invalid Paths**
   - Empty string paths
   - Paths with invalid characters
   - Extremely long paths

4. **Special File Names**
   - Files with spaces
   - Files with special characters (., -, _)
   - Unicode file names

5. **Large Files**
   - Files larger than typical browser limits
   - Chunked reading/writing

6. **Root Directory Operations**
   - Deleting root (should fail)
   - Renaming root (should fail)
   - Parent of root (should stay at root)

---

## Error Handling Tests

```typescript
describe('FileSystemService - Error Handling', () => {
  it('should handle LightningFS errors gracefully', async () => {
    // Mock LightningFS to throw error
    const result = await fileSystem.readFile('/error');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return proper Result<T> pattern', async () => {
    const successResult = await fileSystem.readFile('/test.txt');
    expect(successResult).toHaveProperty('success');

    if (successResult.success) {
      expect(successResult).toHaveProperty('data');
    } else {
      expect(successResult).toHaveProperty('error');
    }
  });

  it('should handle uninitialized state', async () => {
    // Create new instance without initialization
    const fs = new FileSystemService();
    // Operations should wait for initialization
  });
});
```

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 90% |
| Branches | 85% |
| Functions | 90% |
| Lines | 90% |

---

## Test Execution Order

1. Setup mocks and fixtures
2. Initialization tests
3. Basic CRUD tests (read, write, delete)
4. Directory navigation tests
5. Path resolution tests
6. File tree tests
7. Utility function tests
8. Edge case tests
9. Error handling tests

---

## Notes

- **Singleton Pattern**: The service is exported as a singleton. Tests should reset state between test runs.
- **Async Operations**: All file operations are async. Use `async/await` in tests.
- **Result Pattern**: Verify both success and error cases for each method.
- **Path Handling**: Pay special attention to path resolution edge cases.
- **IndexedDB**: Consider that IndexedDB operations may be slow; use appropriate timeouts.

---

## Related Documents

- [CODING_STANDARDS.md](../CODING_STANDARDS.md) - Testing standards and AAA pattern
- [AGENT_SPEC.md](../AGENT_SPEC.md) - Testing guidelines
- [tests/mocks.ts](../../tests/mocks.ts) - Mock factory for fileSystem
