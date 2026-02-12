# Test Plan: E2E Tests

**Plan ID:** P2-007
**Type:** Playwright E2E Tests
**Created:** February 2026
**Status:** Ready for Implementation

---

## Overview

End-to-end (E2E) tests verify the Browser IDE application works as expected from a user's perspective by simulating real browser interactions across the entire application stack.

### Test Framework
- **Tool:** Playwright
- **Test Location:** `tests/e2e/`
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Dev Server:** Vite dev server on `localhost:5173`

---

## E2E Test Flows

| Flow ID | Flow Name | Priority | Description |
|---------|-----------|----------|-------------|
| E2E-001 | File Operations | P0 | Create, edit, save, delete files |
| E2E-002 | Git Workflow | P0 | Clone, commit, push, branch |
| E2E-003 | Terminal | P0 | Run commands, see output |
| E2E-004 | AI Chat | P1 | Send message, receive streaming response |
| E2E-005 | Editor | P0 | Open file, edit content, syntax highlighting |
| E2E-006 | Navigation | P1 | Navigate file tree, tabs |
| E2E-007 | Settings | P1 | Configure settings, API keys |

---

## Test Flows

### E2E-001: File Operations Flow

```typescript
import { test, expect } from '@playwright/test';

test.describe('File Operations', () => {
  test('should create new file', async ({ page }) => {
    await page.goto('/');

    // Click new file button in FileExplorer
    await page.click('[data-testid="new-file-button"]');

    // Enter filename
    await page.fill('[data-testid="new-file-input"]', 'test.ts');
    await page.keyboard.press('Enter');

    // Verify file appears in tree
    await expect(page.locator('[data-testid="file-tree"]')).toContainText('test.ts');
  });

  test('should edit file content', async ({ page }) => {
    await page.goto('/');

    // Open file (assuming it exists or was created)
    await page.click('[data-testid="file-tree"] >> text=test.ts');

    // Wait for Monaco editor to load
    await page.waitForSelector('.monaco-editor');

    // Type content in Monaco
    await page.keyboard.type('console.log("Hello World");');

    // Verify unsaved indicator
    await expect(page.locator('[data-testid="unsaved-indicator"]')).toBeVisible();
  });

  test('should save file with keyboard shortcut', async ({ page }) => {
    await page.goto('/');

    // Open and edit file
    await page.click('[data-testid="file-tree"] >> text=test.ts');
    await page.keyboard.type('const x = 1;');

    // Press Cmd+S / Ctrl+S
    if (process.platform === 'darwin') {
      await page.keyboard.press('Meta+s');
    } else {
      await page.keyboard.press('Control+s');
    }

    // Verify unsaved indicator disappears
    await expect(page.locator('[data-testid="unsaved-indicator"]')).not.toBeVisible();
  });

  test('should delete file', async ({ page }) => {
    await page.goto('/');

    // Right-click on file
    const fileElement = page.locator('[data-testid="file-tree"] >> text=test.ts');
    await fileElement.click({ button: 'right' });

    // Click delete from context menu
    await page.click('[data-testid="context-menu"] >> text=Delete');

    // Confirm deletion
    await page.click('[data-testid="confirm-dialog"] >> text=Delete');

    // Verify file removed from tree
    await expect(page.locator('[data-testid="file-tree"]')).not.toContainText('test.ts');
  });

  test('should create nested directory structure', async ({ page }) => {
    await page.goto('/');

    // Create new folder
    await page.click('[data-testid="new-folder-button"]');
    await page.fill('[data-testid="new-folder-input"]', 'src/components');
    await page.keyboard.press('Enter');

    // Navigate into folder
    await page.click('[data-testid="file-tree"] >> text=src"]');
    await page.click('[data-testid="file-tree"] >> text=components"]');

    // Create file in nested folder
    await page.click('[data-testid="new-file-button"]');
    await page.fill('[data-testid="new-file-input"]', 'Button.tsx');
    await page.keyboard.press('Enter');

    // Verify file path
    await expect(page.locator('[data-testid="current-path"]')).toHaveText('/src/components');
  });
});
```

### E2E-002: Git Workflow Flow

```typescript
test.describe('Git Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Configure git token in settings
    await page.goto('/');
    await page.click('[data-testid="settings-button"]');
    await page.fill('[data-testid="github-token-input"]', process.env.GITHUB_TOKEN || 'ghp_test_token');
    await page.click('[data-testid="save-settings"]');
  });

  test('should clone repository', async ({ page }) => {
    await page.goto('/');

    // Click clone button
    await page.click('[data-testid="clone-button"]');

    // Enter repo URL
    await page.fill('[data-testid="clone-url-input"]', 'https://github.com/user/repo.git');
    await page.click('[data-testid="clone-submit"]');

    // Wait for clone to complete
    await page.waitForSelector('[data-testid="clone-progress"]', { state: 'hidden' });

    // Verify repo appears
    await expect(page.locator('[data-testid="file-tree"]')).toContainText('repo');
  });

  test('should show git status badges', async ({ page }) => {
    await page.goto('/');

    // Assuming we have a git repo with changes
    // Create and modify a file
    await page.click('[data-testid="new-file-button"]');
    await page.fill('[data-testid="new-file-input"]', 'modified.ts');
    await page.keyboard.press('Enter');

    // Edit the file
    await page.click('text=modified.ts');
    await page.keyboard.type('const x = 1;');

    // Check for modified badge
    await expect(page.locator('[data-testid="file-tree"] >> text=modified.ts'))
      .locator('[data-testid="git-badge"][data-status="modified"]')
      .toBeVisible();
  });

  test('should commit changes', async ({ page }) => {
    await page.goto('/');

    // Stage and commit via terminal
    await page.click('[data-testid="terminal-tab"]');

    // Type git commands
    const terminal = page.locator('.xterm-screen');
    await terminal.click();
    await page.keyboard.type('git add .');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);
    await page.keyboard.type('git commit -m "Test commit"');
    await page.keyboard.press('Enter');

    // Wait for commit to complete
    await page.waitForTimeout(2000);

    // Verify badge changed
    await expect(page.locator('[data-testid="git-badge"][data-status="staged"]'))
      .toBeVisible();
  });

  test('should push to remote', async ({ page }) => {
    await page.goto('/');

    // Click push in Git panel or use terminal
    await page.click('[data-testid="push-button"]');

    // Wait for push completion
    await page.waitForSelector('[data-testid="push-progress"]', { state: 'hidden' });

    // Verify success message
    await expect(page.locator('[data-testid="toast-message"]')).toContainText('Successfully pushed');
  });

  test('should create and switch branches', async ({ page }) => {
    await page.goto('/');

    // Click branch selector
    await page.click('[data-testid="branch-selector"]');

    // Create new branch
    await page.click('[data-testid="create-branch"]');
    await page.fill('[data-testid="branch-name-input"]', 'feature-test');
    await page.click('[data-testid="create-branch-submit"]');

    // Verify branch changed
    await expect(page.locator('[data-testid="current-branch"]')).toHaveText('feature-test');

    // Switch back to main
    await page.click('[data-testid="branch-selector"]');
    await page.click('text=main');

    await expect(page.locator('[data-testid="current-branch"]')).toHaveText('main');
  });
});
```

### E2E-003: Terminal Flow

```typescript
test.describe('Terminal', () => {
  test('should boot WebContainer', async ({ page }) => {
    await page.goto('/');

    // Click terminal tab
    await page.click('[data-testid="terminal-tab"]');

    // Wait for ready status
    await expect(page.locator('[data-testid="terminal-status"]')).toHaveText(/ready/i, { timeout: 30000 });
  });

  test('should run npm command', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="terminal-tab"]');

    // Type npm command
    const terminal = page.locator('.xterm-screen');
    await terminal.click();
    await page.keyboard.type('npm --version');
    await page.keyboard.press('Enter');

    // Wait for output
    await page.waitForTimeout(3000);

    // Verify output contains npm version
    await expect(terminal).toContainText(/npm/);
  });

  test('should execute node script', async ({ page }) => {
    await page.goto('/');

    // Create a simple script
    await page.click('[data-testid="new-file-button"]');
    await page.fill('[data-testid="new-file-input"]', 'index.js');
    await page.keyboard.press('Enter');
    await page.click('text=index.js');
    await page.keyboard.type('console.log("test");');

    // Save
    if (process.platform === 'darwin') {
      await page.keyboard.press('Meta+s');
    } else {
      await page.keyboard.press('Control+s');
    }

    // Run in terminal
    await page.click('[data-testid="terminal-tab"]');
    const terminal = page.locator('.xterm-screen');
    await terminal.click();
    await page.keyboard.type('node index.js');
    await page.keyboard.press('Enter');

    // Wait for output
    await page.waitForTimeout(2000);

    await expect(terminal).toContainText('test');
  });

  test('should show command history', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="terminal-tab"]');

    const terminal = page.locator('.xterm-screen');
    await terminal.click();

    // Execute some commands
    await page.keyboard.type('echo first');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    await page.keyboard.type('echo second');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Use up arrow
    await page.keyboard.press('ArrowUp');

    // Should show 'echo second'
    await expect(terminal.locator('.xterm-rows')).toContainText('echo second');
  });

  test('should handle file system commands', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="terminal-tab"]');

    const terminal = page.locator('.xterm-screen');
    await terminal.click();

    // Test ls command
    await page.keyboard.type('ls');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Test mkdir
    await page.keyboard.type('mkdir testdir');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Test cd
    await page.keyboard.type('cd testdir');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify pwd
    await page.keyboard.type('pwd');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await expect(terminal).toContainText('testdir');
  });
});
```

### E2E-004: AI Chat Flow

```typescript
test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Configure API key
    await page.goto('/');
    await page.click('[data-testid="settings-button"]');
    await page.fill('[data-testid="anthropic-key-input"]', process.env.ANTHROPIC_API_KEY || 'sk-ant-test');
    await page.click('[data-testid="save-settings"]');
  });

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/');

    // Click AI assistant tab
    await page.click('[data-testid="ai-assistant-tab"]');

    // Type message
    await page.fill('[data-testid="ai-message-input"]', 'What is 2 + 2?');
    await page.click('[data-testid="send-message-button"]');

    // Wait for response
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // Verify response
    await expect(page.locator('[data-testid="ai-response"]')).toContainText(/4/i);
  });

  test('should show streaming response', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="ai-assistant-tab"]');

    await page.fill('[data-testid="ai-message-input"]', 'Count to 5');
    await page.click('[data-testid="send-message-button"]');

    // Watch streaming indicator
    await expect(page.locator('[data-testid="streaming-indicator"]')).toBeVisible();

    // Wait for completion
    await page.waitForSelector('[data-testid="streaming-indicator"]', { state: 'hidden', timeout: 30000 });

    // Verify final response
    await expect(page.locator('[data-testid="ai-response"]')).toContainText(/1.*2.*3.*4.*5/s);
  });

  test('should handle multiple conversation turns', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="ai-assistant-tab"]');

    // First message
    await page.fill('[data-testid="ai-message-input"]', 'My name is Alice');
    await page.click('[data-testid="send-message-button"]');
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // Second message
    await page.fill('[data-testid="ai-message-input"]', 'What is my name?');
    await page.click('[data-testid="send-message-button"]');
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 30000 });

    // Verify remembers name
    await expect(page.locator('[data-testid="ai-response"]').last()).toContainText(/Alice/i);
  });
});
```

### E2E-005: Editor Flow

```typescript
test.describe('Editor', () => {
  test('should open file in editor', async ({ page }) => {
    await page.goto('/');

    // Click file in tree
    await page.click('[data-testid="file-tree"] >> text=index.html');

    // Wait for Monaco to load
    await page.waitForSelector('.monaco-editor textarea', { timeout: 5000 });

    // Verify file content is shown (if file exists)
    // Or verify editor is ready
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should show syntax highlighting', async ({ page }) => {
    await page.goto('/');

    // Create TypeScript file
    await page.click('[data-testid="new-file-button"]');
    await page.fill('[data-testid="new-file-input"]', 'test.ts');
    await page.keyboard.press('Enter');

    await page.click('text=test.ts');

    // Type some code
    await page.keyboard.type('const x: number = 42;');

    // Verify syntax highlighting (check for colored spans)
    const editor = page.locator('.monaco-editor');
    // Monaco adds .mtk classes for syntax tokens
    await expect(editor.locator('.mtk1')).toHaveCount(/[^0]/); // At least some tokens
  });

  test('should support multiple file tabs', async ({ page }) => {
    await page.goto('/');

    // Open multiple files
    await page.click('[data-testid="file-tree"] >> text=file1.ts');
    await page.click('[data-testid="file-tree"] >> text=file2.ts');

    // Verify both tabs are visible
    await expect(page.locator('[data-testid="file-tab"]')).toHaveCount(2);
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');

    // Open files
    await page.click('[data-testid="file-tree"] >> text=file1.ts');
    await page.keyboard.type('content1');
    if (process.platform === 'darwin') {
      await page.keyboard.press('Meta+s');
    } else {
      await page.keyboard.press('Control+s');
    }

    await page.click('[data-testid="file-tree"] >> text=file2.ts');
    await page.keyboard.type('content2');
    if (process.platform === 'darwin') {
      await page.keyboard.press('Meta+s');
    } else {
      await page.keyboard.press('Control+s');
    }

    // Switch back to first
    await page.click('[data-testid="file-tab"] >> text=file1.ts');

    // Verify editor shows first file content
    const editor = page.locator('.monaco-editor');
    await expect(editor).toContainText('content1');
  });

  test('should close tab', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="file-tree"] >> text=test.ts');

    // Click close button on tab
    await page.click('[data-testid="file-tab"] >> text=test.ts] >> [data-testid="close-tab"]');

    // Verify tab is removed
    await expect(page.locator('[data-testid="file-tab"] >> text=test.ts')).not.toBeVisible();
  });
});
```

### E2E-006: Navigation Flow

```typescript
test.describe('Navigation', () => {
  test('should expand directory in file tree', async ({ page }) => {
    await page.goto('/');

    // Assuming we have a directory
    const dir = page.locator('[data-testid="file-tree"] >> text=src');

    // Click chevron or directory name
    await dir.click();

    // Verify children are visible
    await expect(page.locator('[data-testid="file-tree"]')).toContainText('components');
  });

  test('should navigate to parent directory', async ({ page }) => {
    await page.goto('/');

    // Assuming we're in a subdirectory
    const currentPath = page.locator('[data-testid="current-path"]');
    await page.click('[data-testid="navigate-up"]');

    // Verify path changed
    const newPath = await currentPath.textContent();
    expect(newPath).not.toBe('/src/components');
  });

  test('should navigate to root', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="navigate-root"]');

    await expect(page.locator('[data-testid="current-path"]')).toHaveText('/');
  });

  test('should refresh file tree', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="refresh-button"]');

    // Verify refresh indicator (loading spinner)
    await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="refresh-indicator"]')).not.toBeVisible();
  });
});
```

### E2E-007: Settings Flow

```typescript
test.describe('Settings', () => {
  test('should open and close settings', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('[data-testid="settings-dialog"]')).toBeVisible();

    // Close settings
    await page.click('[data-testid="close-settings"]');
    await expect(page.locator('[data-testid="settings-dialog"]')).not.toBeVisible();
  });

  test('should configure AI provider', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="settings-button"]');

    // Select provider
    await page.selectOption('[data-testid="ai-provider-select"]', 'anthropic');

    // Enter API key
    await page.fill('[data-testid="api-key-input"]', 'sk-ant-test-key');

    // Save
    await page.click('[data-testid="save-settings"]');

    // Verify success toast
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should configure git credentials', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="settings-tab-git"]');

    // Enter git config
    await page.fill('[data-testid="github-username-input"]', 'TestUser');
    await page.fill('[data-testid="github-email-input"]', 'test@test.com');
    await page.fill('[data-testid="github-token-input"]', 'ghp_test_token');

    await page.click('[data-testid="save-settings"]');

    // Verify saved
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();
  });

  test('should change editor theme', async ({ page }) => {
    await page.goto('/');

    // Need an open file to see theme change
    await page.click('[data-testid="file-tree"] >> text=index.html');

    await page.click('[data-testid="settings-button"]');

    // Select theme
    await page.selectOption('[data-testid="theme-select"]', 'vs-light');

    await page.click('[data-testid="save-settings"]');

    // Verify editor theme changed
    await expect(page.locator('.monaco-editor')).toHaveClass(/vs-light/i);
  });
});
```

---

## Mobile Tests

```typescript
test.describe('Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should work on mobile', async ({ page }) => {
    await page.goto('/');

    // Verify responsive layout
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();
  });

  test('should use touch-friendly file tree', async ({ page }) => {
    await page.goto('/');

    // Touch targets should be large enough (44x44 min)
    const fileItem = page.locator('[data-testid="file-tree-item"]').first();

    const box = await fileItem.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should maximize terminal on mobile', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="terminal-tab"]');

    // Should show maximize button
    await expect(page.locator('[data-testid="maximize-terminal"]')).toBeVisible();

    await page.click('[data-testid="maximize-terminal"]');

    // Terminal should take full screen
    await expect(page.locator('[data-testid="terminal"].terminal-maximized')).toBeVisible();
  });
});
```

---

## Test Utilities

### Page Objects
```typescript
// tests/e2e/helpers.ts
export class FileExplorer {
  constructor(private page: Page) {}

  async createFile(name: string) {
    await this.page.click('[data-testid="new-file-button"]');
    await this.page.fill('[data-testid="new-file-input"]', name);
    await this.page.keyboard.press('Enter');
  }

  async openFile(name: string) {
    await this.page.click(`[data-testid="file-tree"] >> text=${name}`);
  }

  async rightClickFile(name: string) {
    await this.page.click(`[data-testid="file-tree"] >> text=${name}`, {
      button: 'right',
    });
  }
}

export class Terminal {
  constructor(private page: Page) {}

  async typeCommand(command: string) {
    const screen = this.page.locator('.xterm-screen');
    await screen.click();
    await this.page.keyboard.type(command);
    await this.page.keyboard.press('Enter');
  }

  async waitForOutput() {
    await this.page.waitForTimeout(2000);
  }
}
```

### Fixtures
```typescript
// tests/e2e/fixtures.ts
import { test as base } from '@playwright/test';

type TestFixtures = {
  fileExplorer: FileExplorer;
  terminal: Terminal;
};

export const test = base.extend<TestFixtures>({
  fileExplorer: async ({ page }, use) => {
    await use(new FileExplorer(page));
  },
  terminal: async ({ page }, use) => {
    await use(new Terminal(page));
  },
});
```

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Critical User Flows | 100% |
| Key Interactions | 90% |
| Cross-browser Coverage | 3 browsers |

---

## Notes

- **data-testid:** All interactive elements need `data-testid` attributes.
- **Timing:** E2E tests are sensitive to timing. Use proper waits.
- **Cleanup:** Tests should clean up state between runs.
- **Parallel:** E2E tests can run in parallel unless they share state.
- **Screenshots:** Configure Playwright to capture screenshots on failure.
- **Mobile:** Test actual mobile viewports, not just narrow desktop windows.

---

## Related Documents

- [playwright.config.ts](../../playwright.config.ts) - Playwright configuration
- [tests/e2e/](../../tests/e2e/) - E2E test location
