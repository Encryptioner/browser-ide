// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { FileSystemService } from '@/services/filesystem';

/**
 * Integration tests for the LightningFS-backed FileSystemService.
 *
 * LightningFS works in Node.js environments (backed by an in-memory
 * IndexedDB shim provided by happy-dom/jsdom). Each test creates a
 * fresh FileSystemService instance with a unique filesystem name so
 * tests do not interfere with each other.
 */

let fs: FileSystemService;

beforeEach(() => {
  // FileSystemService constructor creates a LightningFS with a fixed name.
  // We create a new instance each time; the underlying LightningFS uses
  // IndexedDB under the hood. We rely on test isolation from fresh instances.
  fs = new FileSystemService();
});

// --------------- File CRUD ---------------

describe('FileSystem Integration: File CRUD', () => {
  it('should write a file and read it back', async () => {
    const writeResult = await fs.writeFile('/test.txt', 'hello world');
    expect(writeResult.success).toBe(true);

    const readResult = await fs.readFile('/test.txt');
    expect(readResult.success).toBe(true);
    expect(readResult.data).toBe('hello world');
  });

  it('should overwrite an existing file', async () => {
    await fs.writeFile('/overwrite.txt', 'version 1');
    await fs.writeFile('/overwrite.txt', 'version 2');

    const result = await fs.readFile('/overwrite.txt');
    expect(result.success).toBe(true);
    expect(result.data).toBe('version 2');
  });

  it('should check if a file exists', async () => {
    await fs.writeFile('/exists.txt', 'content');

    expect(await fs.exists('/exists.txt')).toBe(true);
    expect(await fs.exists('/nonexistent.txt')).toBe(false);
  });

  it('should delete a file', async () => {
    await fs.writeFile('/deleteme.txt', 'bye');
    expect(await fs.exists('/deleteme.txt')).toBe(true);

    const result = await fs.deletePath('/deleteme.txt');
    expect(result.success).toBe(true);
    expect(await fs.exists('/deleteme.txt')).toBe(false);
  });

  it('should get file stats', async () => {
    await fs.writeFile('/stats.txt', 'some content');

    const result = await fs.stats('/stats.txt');
    expect(result.success).toBe(true);
    expect(result.data!.type).toBe('file');
    expect(result.data!.name).toBe('stats.txt');
    expect(result.data!.path).toBe('/stats.txt');
  });

  it('should rename a file', async () => {
    await fs.writeFile('/old-name.txt', 'data');

    const result = await fs.rename('/old-name.txt', '/new-name.txt');
    expect(result.success).toBe(true);

    expect(await fs.exists('/old-name.txt')).toBe(false);
    expect(await fs.exists('/new-name.txt')).toBe(true);

    const content = await fs.readFile('/new-name.txt');
    expect(content.data).toBe('data');
  });
});

// --------------- Directory Operations ---------------

describe('FileSystem Integration: Directory Operations', () => {
  it('should create a directory', async () => {
    const result = await fs.createDirectory('/mydir');
    expect(result.success).toBe(true);
    expect(await fs.exists('/mydir')).toBe(true);
  });

  it('should list directory contents', async () => {
    await fs.createDirectory('/listdir');
    await fs.writeFile('/listdir/a.txt', 'aaa');
    await fs.writeFile('/listdir/b.txt', 'bbb');

    await fs.changeDirectory('/listdir');
    const result = await fs.listCurrentDirectory();
    expect(result.success).toBe(true);
    expect(result.data!.length).toBe(2);

    const names = result.data!.map(f => f.name);
    expect(names).toContain('a.txt');
    expect(names).toContain('b.txt');
  });

  it('should delete an empty directory', async () => {
    await fs.createDirectory('/emptydir');
    expect(await fs.exists('/emptydir')).toBe(true);

    const result = await fs.deletePath('/emptydir');
    expect(result.success).toBe(true);
    expect(await fs.exists('/emptydir')).toBe(false);
  });

  it('should get directory stats', async () => {
    await fs.createDirectory('/dirstat');

    const result = await fs.stats('/dirstat');
    expect(result.success).toBe(true);
    expect(result.data!.type).toBe('directory');
    expect(result.data!.name).toBe('dirstat');
  });

  it('should sort directory listing: directories first, then files', async () => {
    await fs.createDirectory('/sorted');
    await fs.writeFile('/sorted/zebra.txt', 'z');
    await fs.createDirectory('/sorted/alpha-dir');
    await fs.writeFile('/sorted/apple.txt', 'a');

    await fs.changeDirectory('/sorted');
    const result = await fs.listCurrentDirectory();
    expect(result.success).toBe(true);

    const items = result.data!;
    // Directories should come first
    expect(items[0].type).toBe('directory');
    expect(items[0].name).toBe('alpha-dir');
    // Then files alphabetically
    expect(items[1].name).toBe('apple.txt');
    expect(items[2].name).toBe('zebra.txt');
  });
});

// --------------- Nested Paths ---------------

describe('FileSystem Integration: Nested Paths', () => {
  it('should create nested directories and files', async () => {
    // LightningFS mkdir is not recursive, so we create each level explicitly
    await fs.createDirectory('/deep');
    await fs.createDirectory('/deep/nested');
    await fs.createDirectory('/deep/nested/path');

    const result = await fs.writeFile('/deep/nested/path/file.txt', 'deep content');
    expect(result.success).toBe(true);

    expect(await fs.exists('/deep')).toBe(true);
    expect(await fs.exists('/deep/nested')).toBe(true);
    expect(await fs.exists('/deep/nested/path')).toBe(true);
    expect(await fs.exists('/deep/nested/path/file.txt')).toBe(true);

    const read = await fs.readFile('/deep/nested/path/file.txt');
    expect(read.data).toBe('deep content');
  });

  it('should build a file tree', async () => {
    await fs.createDirectory('/tree');
    await fs.createDirectory('/tree/src');
    await fs.writeFile('/tree/src/index.ts', 'export {}');
    await fs.writeFile('/tree/package.json', '{}');

    const tree = await fs.buildFileTree('/tree');
    expect(tree.length).toBeGreaterThanOrEqual(2);

    const names = tree.map(n => n.name);
    expect(names).toContain('src');
    expect(names).toContain('package.json');

    // src should have children
    const srcNode = tree.find(n => n.name === 'src');
    expect(srcNode!.type).toBe('directory');
    expect(srcNode!.children).toBeDefined();
    expect(srcNode!.children!.length).toBe(1);
    expect(srcNode!.children![0].name).toBe('index.ts');
  });
});

// --------------- Directory Navigation ---------------

describe('FileSystem Integration: Directory Navigation', () => {
  it('should change directory and track cwd', async () => {
    await fs.createDirectory('/navtest');

    const result = await fs.changeDirectory('/navtest');
    expect(result.success).toBe(true);
    expect(result.data).toBe('/navtest');
    expect(fs.getCurrentWorkingDirectory()).toBe('/navtest');
  });

  it('should fail to cd into a nonexistent directory', async () => {
    const result = await fs.changeDirectory('/does-not-exist');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should resolve relative paths based on cwd', async () => {
    await fs.createDirectory('/reltest');
    await fs.changeDirectory('/reltest');

    const writeResult = await fs.writeFile('hello.txt', 'relative write');
    expect(writeResult.success).toBe(true);

    const readResult = await fs.readFile('hello.txt');
    expect(readResult.success).toBe(true);
    expect(readResult.data).toBe('relative write');
  });
});

// --------------- Error Cases ---------------

describe('FileSystem Integration: Error Cases', () => {
  it('should return error when reading a nonexistent file', async () => {
    const result = await fs.readFile('/no-such-file.txt');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error when deleting a nonexistent path', async () => {
    const result = await fs.deletePath('/no-such-path');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error when getting stats of nonexistent path', async () => {
    const result = await fs.stats('/ghost');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// --------------- Utility: getLanguageFromPath ---------------

describe('FileSystem Integration: getLanguageFromPath', () => {
  it('should return correct language for known extensions', () => {
    // This is a pure function, no async needed
    expect(fs.getLanguageFromPath('app.ts')).toBe('typescript');
    expect(fs.getLanguageFromPath('app.tsx')).toBe('typescript');
    expect(fs.getLanguageFromPath('index.js')).toBe('javascript');
    expect(fs.getLanguageFromPath('styles.css')).toBe('css');
    expect(fs.getLanguageFromPath('page.html')).toBe('html');
    expect(fs.getLanguageFromPath('data.json')).toBe('json');
    expect(fs.getLanguageFromPath('README.md')).toBe('markdown');
    expect(fs.getLanguageFromPath('main.py')).toBe('python');
    expect(fs.getLanguageFromPath('main.go')).toBe('go');
    expect(fs.getLanguageFromPath('main.rs')).toBe('rust');
  });

  it('should return plaintext for unknown extensions', () => {
    expect(fs.getLanguageFromPath('file.xyz')).toBe('plaintext');
    expect(fs.getLanguageFromPath('noext')).toBe('plaintext');
  });
});
