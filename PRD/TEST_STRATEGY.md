# Test Strategy

## Browser IDE - Comprehensive Testing Approach

**Document Version:** 1.0
**Created:** February 2026
**Purpose:** Define testing strategy for TDD workflow with MCP integration

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Test Pyramid](#2-test-pyramid)
3. [Testing by Component Type](#3-testing-by-component-type)
4. [E2E Testing with Playwright MCP](#4-e2e-testing-with-playwright-mcp)
5. [Integration Testing](#5-integration-testing)
6. [Performance Testing](#6-performance-testing)
7. [Accessibility Testing](#7-accessibility-testing)
8. [Mobile Testing](#8-mobile-testing)
9. [Test Data Management](#9-test-data-management)
10. [CI/CD Integration](#10-cicd-integration)
11. [Coverage Requirements](#11-coverage-requirements)
12. [Test Maintenance](#12-test-maintenance)

---

## 1. Testing Philosophy

### 1.1 Core Principles

| Principle | Description |
|-----------|-------------|
| **Test First** | Write tests before implementation (Red-Green-Refactor) |
| **Requirement Driven** | Every test traces to a requirement (FR-*) |
| **Fast Feedback** | Tests run quickly, failures identified immediately |
| **Deterministic** | Same input always produces same output |
| **Independent** | Tests don't depend on other tests' state |
| **Readable** | Tests serve as documentation |

### 1.2 What to Test

| Always Test | Skip Testing |
|-------------|--------------|
| Business logic | Third-party library internals |
| User interactions | Trivial getters/setters |
| Error scenarios | Implementation details |
| Edge cases | Framework behavior |
| Integration points | Pure presentational components |

### 1.3 Test Naming Convention

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return file content when file exists', async () => {});
it('should throw error when path is invalid', async () => {});
it('should display loading spinner when fetching data', async () => {});
```

---

## 2. Test Pyramid

### 2.1 Distribution

```
                    ┌───────────┐
                    │    E2E    │  10%
                    │  (Slow)   │
                   ┌┴───────────┴┐
                   │ Integration │  20%
                   │  (Medium)   │
                  ┌┴─────────────┴┐
                  │     Unit      │  70%
                  │    (Fast)     │
                  └───────────────┘
```

### 2.2 Test Types

| Type | Tools | Speed | Scope | Count |
|------|-------|-------|-------|-------|
| **Unit** | Vitest | < 5ms | Single function/component | ~500 |
| **Integration** | Vitest | < 100ms | Multiple services | ~100 |
| **E2E** | Playwright | < 30s | Full user flow | ~50 |
| **Performance** | Playwright | < 60s | Performance metrics | ~20 |
| **Visual** | Playwright | < 10s | Screenshot comparison | ~30 |

### 2.3 When to Use Each Type

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TEST TYPE DECISION TREE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Q: Does it involve the DOM?                                         │
│      NO  → Unit Test (Vitest)                                        │
│      YES → Continue                                                  │
│                                                                      │
│  Q: Does it need multiple services to interact?                      │
│      YES → Integration Test (Vitest + Testing Library)               │
│      NO  → Continue                                                  │
│                                                                      │
│  Q: Is it a user-facing workflow?                                    │
│      YES → E2E Test (Playwright)                                     │
│      NO  → Component Test (Vitest + Testing Library)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Testing by Component Type

### 3.1 Service Layer Testing

**Location:** `src/services/*.test.ts`

```typescript
// src/services/filesystem.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fileSystem } from './filesystem';

describe('FileSystemService', () => {
  beforeEach(async () => {
    // Initialize with test database
    await fileSystem.init('test-project');
  });

  afterEach(async () => {
    // Cleanup test data
    await fileSystem.cleanup();
  });

  describe('readFile', () => {
    it('should return file content when file exists', async () => {
      // Arrange
      await fileSystem.writeFile('/test.txt', 'Hello, World!');

      // Act
      const result = await fileSystem.readFile('/test.txt');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello, World!');
    });

    it('should return error when file does not exist', async () => {
      // Act
      const result = await fileSystem.readFile('/nonexistent.txt');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle binary files', async () => {
      // Arrange
      const binaryData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      await fileSystem.writeFile('/image.png', binaryData);

      // Act
      const result = await fileSystem.readFile('/image.png', { encoding: 'binary' });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(binaryData);
    });
  });

  describe('writeFile', () => {
    it('should create file if not exists', async () => {
      // Act
      const result = await fileSystem.writeFile('/new-file.txt', 'content');

      // Assert
      expect(result.success).toBe(true);
      const exists = await fileSystem.exists('/new-file.txt');
      expect(exists).toBe(true);
    });

    it('should overwrite existing file', async () => {
      // Arrange
      await fileSystem.writeFile('/file.txt', 'original');

      // Act
      await fileSystem.writeFile('/file.txt', 'updated');

      // Assert
      const result = await fileSystem.readFile('/file.txt');
      expect(result.data).toBe('updated');
    });

    it('should create parent directories if needed', async () => {
      // Act
      await fileSystem.writeFile('/deep/nested/path/file.txt', 'content');

      // Assert
      const exists = await fileSystem.exists('/deep/nested/path');
      expect(exists).toBe(true);
    });
  });
});
```

### 3.2 React Component Testing

**Location:** `src/components/**/*.test.tsx`

```typescript
// src/components/FileExplorer/FileExplorer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileExplorer } from './FileExplorer';

// Mock services
vi.mock('@/services/filesystem', () => ({
  fileSystem: {
    readDirectory: vi.fn(),
  },
}));

import { fileSystem } from '@/services/filesystem';

describe('FileExplorer', () => {
  const mockFiles = [
    { name: 'src', type: 'directory' },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fileSystem.readDirectory).mockResolvedValue({
      success: true,
      data: mockFiles,
    });
  });

  it('should render file tree', async () => {
    // Arrange & Act
    render(<FileExplorer projectId="test" onFileSelect={vi.fn()} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('package.json')).toBeInTheDocument();
    });
  });

  it('should show folder icon for directories', async () => {
    // Arrange & Act
    render(<FileExplorer projectId="test" onFileSelect={vi.fn()} />);

    // Assert
    await waitFor(() => {
      const srcElement = screen.getByText('src').closest('[data-testid="tree-item"]');
      expect(srcElement).toHaveAttribute('data-type', 'directory');
    });
  });

  it('should call onFileSelect when file is clicked', async () => {
    // Arrange
    const onFileSelect = vi.fn();
    render(<FileExplorer projectId="test" onFileSelect={onFileSelect} />);

    // Act
    await waitFor(() => screen.getByText('package.json'));
    await userEvent.click(screen.getByText('package.json'));

    // Assert
    expect(onFileSelect).toHaveBeenCalledWith('/package.json');
  });

  it('should expand folder when clicked', async () => {
    // Arrange
    vi.mocked(fileSystem.readDirectory)
      .mockResolvedValueOnce({ success: true, data: mockFiles })
      .mockResolvedValueOnce({
        success: true,
        data: [{ name: 'index.ts', type: 'file' }],
      });

    render(<FileExplorer projectId="test" onFileSelect={vi.fn()} />);

    // Act
    await waitFor(() => screen.getByText('src'));
    await userEvent.click(screen.getByText('src'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('index.ts')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Arrange
    vi.mocked(fileSystem.readDirectory).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Act
    render(<FileExplorer projectId="test" onFileSelect={vi.fn()} />);

    // Assert
    expect(screen.getByTestId('file-explorer-loading')).toBeInTheDocument();
  });

  it('should show error state when load fails', async () => {
    // Arrange
    vi.mocked(fileSystem.readDirectory).mockResolvedValue({
      success: false,
      error: 'Failed to read directory',
    });

    // Act
    render(<FileExplorer projectId="test" onFileSelect={vi.fn()} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/failed to read/i)).toBeInTheDocument();
    });
  });
});
```

### 3.3 Custom Hook Testing

**Location:** `src/hooks/*.test.ts`

```typescript
// src/hooks/useFileSystem.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileSystem } from './useFileSystem';

vi.mock('@/services/filesystem', () => ({
  fileSystem: {
    readDirectory: vi.fn(),
  },
}));

import { fileSystem } from '@/services/filesystem';

describe('useFileSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load files on mount', async () => {
    // Arrange
    const mockFiles = [{ name: 'file.txt', type: 'file' }];
    vi.mocked(fileSystem.readDirectory).mockResolvedValue({
      success: true,
      data: mockFiles,
    });

    // Act
    const { result } = renderHook(() => useFileSystem('test-project'));

    // Assert
    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.files).toEqual(mockFiles);
    });
  });

  it('should set error when load fails', async () => {
    // Arrange
    vi.mocked(fileSystem.readDirectory).mockResolvedValue({
      success: false,
      error: 'Network error',
    });

    // Act
    const { result } = renderHook(() => useFileSystem('test-project'));

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('should refresh files when refresh is called', async () => {
    // Arrange
    vi.mocked(fileSystem.readDirectory).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useFileSystem('test-project'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Act
    vi.mocked(fileSystem.readDirectory).mockResolvedValue({
      success: true,
      data: [{ name: 'new-file.txt', type: 'file' }],
    });

    await act(async () => {
      await result.current.refresh();
    });

    // Assert
    expect(result.current.files).toHaveLength(1);
    expect(fileSystem.readDirectory).toHaveBeenCalledTimes(2);
  });
});
```

### 3.4 Zustand Store Testing

**Location:** `src/store/*.test.ts`

```typescript
// src/store/useIDEStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useIDEStore } from './useIDEStore';

describe('useIDEStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useIDEStore.setState({
      currentProject: null,
      openFiles: [],
      activeFile: null,
    });
  });

  describe('setCurrentProject', () => {
    it('should set current project', () => {
      // Act
      useIDEStore.getState().setCurrentProject('project-1');

      // Assert
      expect(useIDEStore.getState().currentProject).toBe('project-1');
    });
  });

  describe('openFile', () => {
    it('should add file to openFiles and set as active', () => {
      // Act
      useIDEStore.getState().openFile('/src/index.ts');

      // Assert
      const state = useIDEStore.getState();
      expect(state.openFiles).toContain('/src/index.ts');
      expect(state.activeFile).toBe('/src/index.ts');
    });

    it('should not duplicate file if already open', () => {
      // Arrange
      useIDEStore.getState().openFile('/src/index.ts');

      // Act
      useIDEStore.getState().openFile('/src/index.ts');

      // Assert
      const state = useIDEStore.getState();
      expect(state.openFiles.filter((f) => f === '/src/index.ts')).toHaveLength(1);
    });
  });

  describe('closeFile', () => {
    it('should remove file from openFiles', () => {
      // Arrange
      useIDEStore.getState().openFile('/src/index.ts');
      useIDEStore.getState().openFile('/src/app.ts');

      // Act
      useIDEStore.getState().closeFile('/src/index.ts');

      // Assert
      expect(useIDEStore.getState().openFiles).not.toContain('/src/index.ts');
    });

    it('should set next file as active when closing active file', () => {
      // Arrange
      useIDEStore.getState().openFile('/src/index.ts');
      useIDEStore.getState().openFile('/src/app.ts');
      useIDEStore.getState().setActiveFile('/src/index.ts');

      // Act
      useIDEStore.getState().closeFile('/src/index.ts');

      // Assert
      expect(useIDEStore.getState().activeFile).toBe('/src/app.ts');
    });
  });
});
```

---

## 4. E2E Testing with Playwright MCP

### 4.1 Test Structure

**Location:** `tests/e2e/*.spec.ts`

```typescript
// tests/e2e/file-explorer.spec.ts
import { test, expect } from '@playwright/test';

/**
 * @requirement FR-FS-010 - File tree navigation with expand/collapse
 */
test.describe('File Explorer - FR-FS-010', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to IDE
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('[data-testid="ide-container"]');

    // Create test project
    await page.evaluate(() => {
      // Setup test data in IndexedDB
      window.__testHelpers?.createProject('test-project', {
        '/src/index.ts': 'export const hello = "world";',
        '/src/components/App.tsx': 'function App() { return <div /> }',
        '/package.json': '{"name": "test"}',
      });
    });
  });

  test('should display file tree on load', async ({ page }) => {
    const fileExplorer = page.locator('[data-testid="file-explorer"]');
    await expect(fileExplorer).toBeVisible();

    // Root items should be visible
    await expect(page.locator('[data-testid="tree-item-src"]')).toBeVisible();
    await expect(page.locator('[data-testid="tree-item-package.json"]')).toBeVisible();
  });

  test('should expand folder when clicked', async ({ page }) => {
    // Click on src folder
    await page.click('[data-testid="tree-item-src"]');

    // Children should become visible
    await expect(page.locator('[data-testid="tree-item-index.ts"]')).toBeVisible();
    await expect(page.locator('[data-testid="tree-item-components"]')).toBeVisible();
  });

  test('should collapse folder when clicked again', async ({ page }) => {
    // Expand
    await page.click('[data-testid="tree-item-src"]');
    await expect(page.locator('[data-testid="tree-item-index.ts"]')).toBeVisible();

    // Collapse
    await page.click('[data-testid="tree-item-src"]');
    await expect(page.locator('[data-testid="tree-item-index.ts"]')).not.toBeVisible();
  });

  test('should open file in editor when clicked', async ({ page }) => {
    // Click on file
    await page.click('[data-testid="tree-item-package.json"]');

    // Editor should show file content
    const editor = page.locator('[data-testid="monaco-editor"]');
    await expect(editor).toContainText('"name": "test"');

    // Tab should appear
    const tab = page.locator('[data-testid="editor-tab-package.json"]');
    await expect(tab).toBeVisible();
    await expect(tab).toHaveClass(/active/);
  });

  test('should navigate with keyboard', async ({ page }) => {
    // Focus file explorer
    await page.click('[data-testid="file-explorer"]');

    // Navigate down
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-testid="tree-item-src"]')).toHaveClass(/focused/);

    // Navigate down again
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-testid="tree-item-package.json"]')).toHaveClass(/focused/);

    // Open with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="monaco-editor"]')).toContainText('"name"');
  });
});
```

### 4.2 MCP-Driven Test Exploration

AI uses MCP to discover UI elements and generate tests:

```typescript
// MCP exploration workflow
async function exploreFileExplorer(mcp: MCPClient): Promise<TestPlan> {
  // Navigate to page
  await mcp.navigate('http://localhost:5173');

  // Wait for app to load
  await mcp.waitForSelector('[data-testid="ide-container"]');

  // Discover interactive elements
  const elements = await mcp.evaluate(`
    Array.from(document.querySelectorAll('[data-testid]'))
      .map(el => ({
        testId: el.getAttribute('data-testid'),
        tag: el.tagName,
        role: el.getAttribute('role'),
        text: el.textContent?.slice(0, 50)
      }))
  `);

  // Generate test plan based on discovered elements
  return {
    component: 'FileExplorer',
    elements,
    suggestedTests: [
      'should render all discovered elements',
      'should handle click on folders',
      'should handle click on files',
      // ... more based on elements
    ],
  };
}
```

### 4.3 Page Objects Pattern

```typescript
// tests/e2e/pages/FileExplorerPage.ts
import { Page, Locator } from '@playwright/test';

export class FileExplorerPage {
  readonly page: Page;
  readonly container: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.locator('[data-testid="file-explorer"]');
    this.loadingIndicator = page.locator('[data-testid="file-explorer-loading"]');
    this.errorMessage = page.locator('[data-testid="file-explorer-error"]');
  }

  async waitForLoad(): Promise<void> {
    await this.container.waitFor({ state: 'visible' });
    await this.loadingIndicator.waitFor({ state: 'hidden' });
  }

  getTreeItem(name: string): Locator {
    return this.page.locator(`[data-testid="tree-item-${name}"]`);
  }

  async expandFolder(name: string): Promise<void> {
    const folder = this.getTreeItem(name);
    const isExpanded = await folder.getAttribute('data-expanded');
    if (isExpanded !== 'true') {
      await folder.click();
    }
  }

  async collapseFolder(name: string): Promise<void> {
    const folder = this.getTreeItem(name);
    const isExpanded = await folder.getAttribute('data-expanded');
    if (isExpanded === 'true') {
      await folder.click();
    }
  }

  async openFile(name: string): Promise<void> {
    await this.getTreeItem(name).click();
  }
}

// Usage in tests
test('should open file', async ({ page }) => {
  const fileExplorer = new FileExplorerPage(page);
  await fileExplorer.waitForLoad();
  await fileExplorer.openFile('package.json');
  // ...
});
```

---

## 5. Integration Testing

### 5.1 Service Integration Tests

**Location:** `tests/integration/*.test.ts`

```typescript
// tests/integration/git-filesystem.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fileSystem } from '@/services/filesystem';
import { gitService } from '@/services/git';

describe('Integration: Git + FileSystem', () => {
  const projectId = 'integration-test-project';

  beforeEach(async () => {
    await fileSystem.init(projectId);
    await gitService.init(projectId);
  });

  afterEach(async () => {
    await fileSystem.cleanup();
    await gitService.cleanup();
  });

  it('should track file changes after git init', async () => {
    // Arrange - Initialize git repo
    await gitService.initRepo();

    // Act - Create a new file
    await fileSystem.writeFile('/test.txt', 'Hello');

    // Assert - Git should see untracked file
    const status = await gitService.status();
    expect(status.success).toBe(true);
    expect(status.data?.untracked).toContain('/test.txt');
  });

  it('should stage and commit files', async () => {
    // Arrange
    await gitService.initRepo();
    await fileSystem.writeFile('/file.txt', 'content');

    // Act
    await gitService.add('/file.txt');
    const commitResult = await gitService.commit('Initial commit');

    // Assert
    expect(commitResult.success).toBe(true);
    expect(commitResult.data).toMatch(/^[a-f0-9]{40}$/); // SHA

    const status = await gitService.status();
    expect(status.data?.staged).toHaveLength(0);
    expect(status.data?.untracked).toHaveLength(0);
  });

  it('should preserve file content through checkout', async () => {
    // Arrange - Create initial commit
    await gitService.initRepo();
    await fileSystem.writeFile('/file.txt', 'version 1');
    await gitService.add('/file.txt');
    await gitService.commit('Version 1');

    // Create branch and modify
    await gitService.createBranch('feature');
    await gitService.checkout('feature');
    await fileSystem.writeFile('/file.txt', 'version 2');
    await gitService.add('/file.txt');
    await gitService.commit('Version 2');

    // Act - Switch back to main
    await gitService.checkout('main');

    // Assert - File should have original content
    const result = await fileSystem.readFile('/file.txt');
    expect(result.data).toBe('version 1');
  });
});
```

### 5.2 AI + Editor Integration

```typescript
// tests/integration/ai-editor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claudeAgent } from '@/services/claude-agent';
import { fileSystem } from '@/services/filesystem';

// Mock AI API
vi.mock('@/services/api', () => ({
  anthropicApi: {
    complete: vi.fn(),
  },
}));

import { anthropicApi } from '@/services/api';

describe('Integration: AI + Editor', () => {
  beforeEach(async () => {
    await fileSystem.init('ai-test');
    vi.clearAllMocks();
  });

  it('should apply AI-generated code changes to file', async () => {
    // Arrange
    await fileSystem.writeFile(
      '/src/utils.ts',
      'export function add(a, b) { return a + b; }'
    );

    vi.mocked(anthropicApi.complete).mockResolvedValue({
      content: `\`\`\`typescript
export function add(a: number, b: number): number {
  return a + b;
}
\`\`\``,
    });

    // Act - Ask AI to add types
    const result = await claudeAgent.applyToFile('/src/utils.ts', 'Add TypeScript types');

    // Assert
    expect(result.success).toBe(true);

    const fileContent = await fileSystem.readFile('/src/utils.ts');
    expect(fileContent.data).toContain('a: number');
    expect(fileContent.data).toContain(': number');
  });

  it('should show diff before applying changes', async () => {
    // Arrange
    await fileSystem.writeFile('/src/index.ts', 'console.log("hello");');

    vi.mocked(anthropicApi.complete).mockResolvedValue({
      content: '```typescript\nlogger.info("hello");\n```',
    });

    // Act
    const diff = await claudeAgent.previewChanges('/src/index.ts', 'Use logger');

    // Assert
    expect(diff.success).toBe(true);
    expect(diff.data?.additions).toContain('logger.info');
    expect(diff.data?.deletions).toContain('console.log');
  });
});
```

---

## 6. Performance Testing

### 6.1 Performance Test Suite

**Location:** `tests/performance/*.spec.ts`

```typescript
// tests/performance/file-operations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance: File Operations', () => {
  test('should load large file within 2 seconds', async ({ page }) => {
    // Arrange - Create large file (1MB)
    await page.evaluate(() => {
      const content = 'x'.repeat(1024 * 1024); // 1MB
      window.__testHelpers?.createFile('/large-file.txt', content);
    });

    // Act - Measure file load time
    const startTime = Date.now();
    await page.click('[data-testid="tree-item-large-file.txt"]');
    await page.waitForSelector('[data-testid="editor-content-loaded"]');
    const loadTime = Date.now() - startTime;

    // Assert
    expect(loadTime).toBeLessThan(2000); // Under 2 seconds
  });

  test('should search 10,000 files within 500ms', async ({ page }) => {
    // Arrange - Create many files
    await page.evaluate(() => {
      for (let i = 0; i < 10000; i++) {
        window.__testHelpers?.createFile(`/files/file-${i}.txt`, `content ${i}`);
      }
    });

    // Act - Perform search
    const startTime = Date.now();
    await page.fill('[data-testid="file-search-input"]', 'file-9999');
    await page.waitForSelector('[data-testid="search-result-file-9999.txt"]');
    const searchTime = Date.now() - startTime;

    // Assert
    expect(searchTime).toBeLessThan(500);
  });

  test('should maintain 60fps while typing', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="tree-item-index.ts"]');
    await page.waitForSelector('[data-testid="monaco-editor"]');

    // Act - Type rapidly and measure FPS
    const fps = await page.evaluate(async () => {
      const frames: number[] = [];
      let lastTime = performance.now();

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const now = entry.startTime;
          frames.push(1000 / (now - lastTime));
          lastTime = now;
        }
      });

      observer.observe({ entryTypes: ['frame'] });

      // Type for 2 seconds
      const editor = document.querySelector('.monaco-editor textarea');
      for (let i = 0; i < 100; i++) {
        editor?.dispatchEvent(new InputEvent('input', { data: 'x' }));
        await new Promise((r) => setTimeout(r, 20));
      }

      observer.disconnect();

      // Calculate average FPS
      return frames.reduce((a, b) => a + b, 0) / frames.length;
    });

    // Assert
    expect(fps).toBeGreaterThan(55); // Allow slight dip from 60
  });
});
```

### 6.2 Memory Testing

```typescript
// tests/performance/memory.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance: Memory', () => {
  test('should not leak memory when opening/closing files', async ({ page }) => {
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize ?? 0;
    });

    // Open and close 100 files
    for (let i = 0; i < 100; i++) {
      await page.click(`[data-testid="tree-item-file-${i % 10}.ts"]`);
      await page.click('[data-testid="close-tab-button"]');
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize ?? 0;
    });

    // Assert - memory should not grow significantly
    const memoryGrowth = finalMemory - initialMemory;
    const maxAllowedGrowth = 10 * 1024 * 1024; // 10MB
    expect(memoryGrowth).toBeLessThan(maxAllowedGrowth);
  });
});
```

---

## 7. Accessibility Testing

### 7.1 Automated A11y Tests

```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should have no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="ide-container"]');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be navigable with keyboard only', async ({ page }) => {
    await page.goto('/');

    // Tab through main elements
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'file-explorer');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'editor-tabs');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'monaco-editor');
  });

  test('should announce status changes to screen readers', async ({ page }) => {
    await page.goto('/');

    // Trigger a status change
    await page.click('[data-testid="save-button"]');

    // Check for live region announcement
    const liveRegion = page.locator('[aria-live="polite"]');
    await expect(liveRegion).toContainText('File saved');
  });
});
```

---

## 8. Mobile Testing

### 8.1 Mobile Viewport Tests

```typescript
// tests/e2e/mobile/navigation.spec.ts
import { test, expect, devices } from '@playwright/test';

const iPhone = devices['iPhone 12'];
const iPad = devices['iPad Pro 11'];

test.describe('Mobile: Navigation', () => {
  test.use({ ...iPhone });

  test('should show mobile navigation on small screens', async ({ page }) => {
    await page.goto('/');

    // Desktop nav should be hidden
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible();

    // Mobile nav should be visible
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
  });

  test('should open file explorer via swipe', async ({ page }) => {
    await page.goto('/');

    // Swipe right to open file explorer
    await page.locator('[data-testid="ide-container"]').dragTo(
      page.locator('[data-testid="ide-container"]'),
      {
        sourcePosition: { x: 10, y: 300 },
        targetPosition: { x: 200, y: 300 },
      }
    );

    await expect(page.locator('[data-testid="mobile-file-explorer"]')).toBeVisible();
  });

  test('should have touch-friendly targets', async ({ page }) => {
    await page.goto('/');

    // Check all interactive elements have minimum 44x44 touch targets
    const buttons = await page.locator('button, [role="button"]').all();

    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('Tablet: Layout', () => {
  test.use({ ...iPad });

  test('should show two-panel layout on tablet', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });
});
```

---

## 9. Test Data Management

### 9.1 Test Fixtures

```typescript
// tests/fixtures/projects.ts
export const testProjects = {
  simple: {
    id: 'simple-project',
    files: {
      '/package.json': '{"name": "simple", "version": "1.0.0"}',
      '/index.ts': 'console.log("Hello");',
    },
  },

  react: {
    id: 'react-project',
    files: {
      '/package.json': '{"name": "react-app", "dependencies": {"react": "^18"}}',
      '/src/App.tsx': 'function App() { return <div>App</div>; }',
      '/src/index.tsx': 'import App from "./App"; render(<App />);',
    },
  },

  large: {
    id: 'large-project',
    fileCount: 1000,
    generateFiles: () => {
      const files: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        files[`/src/file-${i}.ts`] = `export const value${i} = ${i};`;
      }
      return files;
    },
  },
};
```

### 9.2 Test Helpers

```typescript
// tests/helpers/setup.ts
import { Page } from '@playwright/test';

export async function setupTestProject(page: Page, projectData: ProjectFixture): Promise<void> {
  await page.evaluate((data) => {
    window.__testHelpers?.createProject(data.id, data.files);
  }, projectData);
}

export async function cleanupTestData(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__testHelpers?.cleanup();
  });
}
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: npx playwright install --with-deps

      - run: pnpm test:e2e

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 11. Coverage Requirements

### 11.1 Coverage Thresholds

| Component Type | Line Coverage | Branch Coverage | Function Coverage |
|---------------|---------------|-----------------|-------------------|
| Services | 90% | 85% | 90% |
| Hooks | 85% | 80% | 85% |
| Components | 80% | 75% | 80% |
| Store | 85% | 80% | 85% |
| Utils | 95% | 90% | 95% |
| **Overall** | **85%** | **80%** | **85%** |

### 11.2 Critical Path Coverage

The following flows must have 100% E2E coverage:

1. Project creation and opening
2. File creation, editing, saving
3. Git clone, commit, push
4. AI chat interaction
5. Settings import/export

---

## 12. Test Maintenance

### 12.1 Flaky Test Policy

1. Flaky tests are marked with `test.skip()` immediately
2. Issue created to fix flaky test
3. Flaky tests fixed within 1 sprint
4. Three-strike rule: test removed if flaky 3 times

### 12.2 Test Review Checklist

- [ ] Tests cover happy path and error cases
- [ ] Tests are deterministic (no random failures)
- [ ] Tests are independent (no shared state)
- [ ] Tests are fast (unit < 5ms, integration < 100ms)
- [ ] Tests have descriptive names
- [ ] Tests use appropriate assertions

---

**Document Version:** 1.0
**Last Updated:** February 2026
