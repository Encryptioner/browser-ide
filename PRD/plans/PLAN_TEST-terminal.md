# Test Plan: Terminal Component

**Plan ID:** P2-005
**Component:** `src/components/IDE/Terminal.tsx`
**Created:** February 2026
**Status:** Ready for Implementation

---

## Component Overview

The Terminal component integrates xterm.js for a browser-based terminal with WebContainer backend for code execution. It handles file system commands, git commands, AI agent commands, and provides shell-like functionality with command history.

### Key Features
- xterm.js integration with fit and web-links addons
- WebContainer initialization and boot status
- File system commands (ls, pwd, cd, mkdir, rm, mv, cp, cat, touch, nano)
- Git commands (status, branch, checkout, add, commit, log, push, pull, etc.)
- Claude AI agent commands via terminal
- Command history with arrow key navigation
- Nano editor integration
- Mobile-optimized terminal sizing
- Maximize/restore functionality with keyboard shortcuts

---

## Test File Location

```
src/components/IDE/Terminal.test.tsx
```

---

## Props and Dependencies

| Prop/Dependency | Type | Purpose |
|-----------------|------|---------|
| useIDEStore | Zustand store | terminalMaximized, toggleTerminalMaximized, settings |
| webContainer | Service | Code execution via WebContainer |
| fileSystem | Service | File operations |
| gitService | Service | Git operations |
| XTerm | Component | Terminal display |
| NanoEditor | Component | Simple text editor |
| MobileInputWrapper | Component | Mobile touch handling |

---

## Test Cases

### 1. Rendering Tests

```typescript
describe('Terminal - Rendering', () => {
  it('should render terminal container', () => {
    const { container } = renderWithProviders(<Terminal />);

    const terminal = container.querySelector('.terminal');
    expect(terminal).toBeInTheDocument();
  });

  it('should render terminal header', () => {
    const { getByText } = renderWithProviders(<Terminal />);

    expect(getByText('Terminal')).toBeInTheDocument();
  });

  it('should render booting status initially', () => {
    const { getByText } = renderWithProviders(<Terminal />);

    expect(getByText(/booting/i)).toBeInTheDocument();
  });

  it('should render ready status after boot', async () => {
    // Mock WebContainer boot completion
    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    const { getByText } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      expect(getByText(/ready/i)).toBeInTheDocument();
    });
  });

  it('should render error status on boot failure', async () => {
    vi.mocked(webContainer.boot).mockResolvedValue({
      success: false,
      error: 'Boot failed',
    });

    const { getByText } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      expect(getByText(/boot failed/i)).toBeInTheDocument();
    });
  });
});
```

### 2. WebContainer Boot Tests

```typescript
describe('Terminal - WebContainer Boot', () => {
  it('should boot WebContainer on mount', async () => {
    renderWithProviders(<Terminal />);

    await waitFor(() => {
      expect(webContainer.boot).toHaveBeenCalled();
    });
  });

  it('should not boot if already booted', async () => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    renderWithProviders(<Terminal />);

    expect(webContainer.boot).not.toHaveBeenCalled();
  });

  it('should handle boot failure gracefully', async () => {
    vi.mocked(webContainer.boot).mockResolvedValue({
      success: false,
      error: 'CORS headers not set',
    });

    const { getByText } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      expect(getByText(/boot failed/i)).toBeInTheDocument();
      expect(getByText('Boot Failed')).toBeInTheDocument();
    });
  });

  it('should cleanup processes on unmount', () => {
    const { unmount } = renderWithProviders(<Terminal />);

    unmount();

    // Should kill running process if any
    // Verify cleanup
  });
});
```

### 3. Terminal Display Tests

```typescript
describe('Terminal - Terminal Display', () => {
  it('should show welcome message on mount', async () => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      // Terminal should show welcome message
      const terminalContent = container.querySelector('.terminal-content');
      expect(terminalContent).toBeInTheDocument();
    });
  });

  it('should display command prompt', async () => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      // Should show "$ " prompt
    });
  });

  it('should fit terminal to container', async () => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      // FitAddon should be called
    });
  });

  it('should handle window resize', async () => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    renderWithProviders(<Terminal />);

    // Trigger resize
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // FitAddon should be called again
  });
});
```

### 4. Command Input Tests

```typescript
describe('Terminal - Command Input', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  it('should handle character input', async () => {
    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      const xterm = getXtermInstance();
      // Simulate character input
      xterm.onData('a');

      // Terminal should display character
    });
  });

  it('should handle backspace', async () => {
    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      const xterm = getXtermInstance();
      // Type 'abc', then backspace
      xterm.onData('a');
      xterm.onData('b');
      xterm.onData('c');
      xterm.onData(String.fromCharCode(127)); // Backspace

      // Should remove last character
    });
  });

  it('should handle Enter key to execute command', async () => {
    vi.mocked(webContainer.spawn).mockResolvedValue({
      success: true,
      process: { output: new ReadableStream(), exit: Promise.resolve(0) },
      processId: 'proc-1',
    });

    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      const xterm = getXtermInstance();
      // Type command and press Enter
      xterm.onData('echo hello');
      xterm.onData(String.fromCharCode(13)); // Enter

      // Command should be executed
    });

    await waitFor(() => {
      expect(webContainer.spawn).toHaveBeenCalledWith('echo', ['hello']);
    });
  });

  it('should clear command on empty input', async () => {
    const { container } = renderWithProviders(<Terminal />);

    await waitFor(() => {
      const xterm = getXtermInstance();
      xterm.onData(String.fromCharCode(13)); // Enter with no input

      // Should just show new prompt
    });
  });
});
```

### 5. File System Commands Tests

```typescript
describe('Terminal - File System Commands', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  describe('ls command', () => {
    it('should list directory contents', async () => {
      vi.mocked(fileSystem.listCurrentDirectory).mockResolvedValue({
        success: true,
        data: [
          { name: 'file1.ts', path: '/file1.ts', type: 'file' as const, size: 100, modified: 123 },
          { name: 'src', path: '/src', type: 'directory' as const, size: 0, modified: 123 },
        ],
      });

      await executeCommand('ls');

      expect(fileSystem.listCurrentDirectory).toHaveBeenCalled();
      // Terminal should show file listing
    });

    it('should handle empty directory', async () => {
      vi.mocked(fileSystem.listCurrentDirectory).mockResolvedValue({
        success: true,
        data: [],
      });

      await executeCommand('ls');

      // Should show nothing or empty message
    });

    it('should handle ls error', async () => {
      vi.mocked(fileSystem.listCurrentDirectory).mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      await executeCommand('ls');

      // Should show error message
    });
  });

  describe('pwd command', () => {
    it('should show current directory', async () => {
      vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/src/components');

      await executeCommand('pwd');

      // Terminal should display /src/components
    });
  });

  describe('cd command', () => {
    it('should change to directory', async () => {
      vi.mocked(fileSystem.changeDirectory).mockResolvedValue({
        success: true,
        data: '/src',
      });

      await executeCommand('cd /src');

      expect(fileSystem.changeDirectory).toHaveBeenCalledWith('/src');
    });

    it('should change to home on no argument', async () => {
      vi.mocked(fileSystem.changeDirectory).mockResolvedValue({
        success: true,
        data: '/',
      });

      await executeCommand('cd');

      expect(fileSystem.changeDirectory).toHaveBeenCalledWith('/');
    });

    it('should handle directory not found', async () => {
      vi.mocked(fileSystem.changeDirectory).mockResolvedValue({
        success: false,
        error: 'Directory not found',
      });

      await executeCommand('cd /nonexistent');

      // Should show error
    });
  });

  describe('mkdir command', () => {
    it('should create directory', async () => {
      vi.mocked(fileSystem.createDirectory).mockResolvedValue({ success: true });

      await executeCommand('mkdir new-folder');

      expect(fileSystem.createDirectory).toHaveBeenCalledWith('new-folder');
    });

    it('should show error on missing argument', async () => {
      await executeCommand('mkdir');

      // Should show "mkdir: missing operand"
    });
  });

  describe('rm command', () => {
    it('should delete file', async () => {
      vi.mocked(fileSystem.deletePath).mockResolvedValue({ success: true });

      await executeCommand('rm test.txt');

      expect(fileSystem.deletePath).toHaveBeenCalledWith('test.txt');
    });

    it('should show error on missing argument', async () => {
      await executeCommand('rm');

      // Should show "rm: missing operand"
    });
  });

  describe('cat command', () => {
    it('should display file contents', async () => {
      vi.mocked(fileSystem.readFile).mockResolvedValue({
        success: true,
        data: 'file content here',
      });

      await executeCommand('cat test.txt');

      expect(fileSystem.readFile).toHaveBeenCalledWith('test.txt');
      // Terminal should show file contents
    });

    it('should handle multi-line files', async () => {
      vi.mocked(fileSystem.readFile).mockResolvedValue({
        success: true,
        data: 'line1\nline2\nline3',
      });

      await executeCommand('cat test.txt');

      // Should show each line on separate terminal line
    });
  });

  describe('touch command', () => {
    it('should create empty file', async () => {
      vi.mocked(fileSystem.writeFile).mockResolvedValue({ success: true });

      await executeCommand('touch newfile.txt');

      expect(fileSystem.writeFile).toHaveBeenCalledWith('newfile.txt', '');
    });
  });
});
```

### 6. Git Commands Tests

```typescript
describe('Terminal - Git Commands', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  describe('git status', () => {
    it('should show working tree status', async () => {
      vi.mocked(gitService.statusMatrix).mockResolvedValue([
        { path: 'test.ts', status: 'modified' as const },
        { path: 'new.ts', status: 'added' as const },
      ]);

      await executeCommand('git status');

      expect(gitService.statusMatrix).toHaveBeenCalled();
      // Should display file statuses
    });

    it('should show clean working tree', async () => {
      vi.mocked(gitService.statusMatrix).mockResolvedValue([]);

      await executeCommand('git status');

      // Should show "nothing to commit, working tree clean"
    });
  });

  describe('git branch', () => {
    it('should list branches', async () => {
      vi.mocked(gitService.listBranches).mockResolvedValue({
        success: true,
        data: [
          { name: 'main', current: true },
          { name: 'develop', current: false },
        ],
      });

      await executeCommand('git branch');

      expect(gitService.listBranches).toHaveBeenCalled();
      // Should show * main
      // Should show   develop
    });

    it('should create new branch', async () => {
      vi.mocked(gitService.createBranch).mockResolvedValue({ success: true });

      await executeCommand('git branch feature-new');

      expect(gitService.createBranch).toHaveBeenCalledWith('feature-new', expect.any(String));
    });
  });

  describe('git checkout', () => {
    it('should switch branch', async () => {
      vi.mocked(gitService.checkout).mockResolvedValue({ success: true });

      await executeCommand('git checkout develop');

      expect(gitService.checkout).toHaveBeenCalledWith('develop', expect.any(String));
    });
  });

  describe('git add', () => {
    it('should stage file', async () => {
      vi.mocked(gitService.add).mockResolvedValue({ success: true });

      await executeCommand('git add test.ts');

      expect(gitService.add).toHaveBeenCalledWith('test.ts', expect.any(String));
    });

    it('should stage all files with dot', async () => {
      vi.mocked(gitService.addAll).mockResolvedValue({ success: true });

      await executeCommand('git add .');

      expect(gitService.addAll).toHaveBeenCalled();
    });
  });

  describe('git commit', () => {
    it('should commit with message', async () => {
      vi.mocked(gitService.commit).mockResolvedValue({
        success: true,
        data: 'abc123',
      });

      // Mock settings for author
      vi.mocked(useIDEStore.getState).mockReturnValue({
        settings: {
          githubUsername: 'Test User',
          githubEmail: 'test@test.com',
        },
      } as any);

      await executeCommand('git commit -m "Test commit"');

      expect(gitService.commit).toHaveBeenCalledWith(
        'Test commit',
        { name: 'Test User', email: 'test@test.com' },
        expect.any(String)
      );
    });

    it('should show error for missing message', async () => {
      await executeCommand('git commit');

      // Should show "error: missing commit message"
    });
  });

  describe('git log', () => {
    it('should show commit history', async () => {
      vi.mocked(gitService.log).mockResolvedValue([
        {
          oid: 'abc123',
          message: 'First commit',
          author: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
        },
      ]);

      await executeCommand('git log');

      expect(gitService.log).toHaveBeenCalledWith(expect.any(String), 10);
      // Should display commit info
    });
  });

  describe('git push', () => {
    it('should push to remote with token', async () => {
      vi.mocked(gitService.push).mockResolvedValue({
        success: true,
        data: 'main',
      });

      // Mock settings with token
      vi.mocked(useIDEStore.getState).mockReturnValue({
        settings: { githubToken: 'ghp_token123' },
      } as any);

      await executeCommand('git push');

      expect(gitService.push).toHaveBeenCalledWith(
        'ghp_token123',
        'origin',
        undefined,
        expect.any(String)
      );
    });

    it('should show error for missing token', async () => {
      vi.mocked(useIDEStore.getState).mockReturnValue({
        settings: { githubToken: '' },
      } as any);

      await executeCommand('git push');

      // Should show "error: No GitHub token configured"
    });
  });

  describe('git pull', () => {
    it('should pull from remote', async () => {
      vi.mocked(gitService.pull).mockResolvedValue({
        success: true,
        data: 'main',
      });

      vi.mocked(useIDEStore.getState).mockReturnValue({
        settings: { githubToken: 'ghp_token123' },
      } as any);

      await executeCommand('git pull');

      expect(gitService.pull).toHaveBeenCalled();
    });
  });
});
```

### 7. AI Agent Commands Tests

```typescript
describe('Terminal - AI Agent Commands', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  it('should show help for claude command', async () => {
    await executeCommand('claude');

    // Should show usage and examples
  });

  it('should show error when no API key configured', async () => {
    vi.mocked(useIDEStore.getState).mockReturnValue({
      settings: {
        glmKey: '',
        anthropicKey: '',
      },
    } as any);

    await executeCommand('claude "Create a component"');

    // Should show "error: No AI API key configured"
  });

  it('should execute claude task', async () => {
    const mockAgent = {
      setWorkingDirectory: vi.fn(),
      executeTask: vi.fn().mockResolvedValue({
        success: true,
        output: 'Task completed',
        artifacts: {
          filesCreated: ['test.ts'],
        },
      }),
    };

    vi.mocked(createAnthropicAgent).mockReturnValue(mockAgent);
    vi.mocked(useIDEStore.getState).mockReturnValue({
      settings: { anthropicKey: 'sk-ant-key' },
    } as any);

    await executeCommand('claude "Create a React component"');

    await waitFor(() => {
      expect(mockAgent.executeTask).toHaveBeenCalled();
    });
  });

  it('should show task output', async () => {
    const mockAgent = {
      setWorkingDirectory: vi.fn(),
      executeTask: vi.fn().mockResolvedValue({
        success: true,
        output: 'Generated code successfully',
      }),
    };

    vi.mocked(createAnthropicAgent).mockReturnValue(mockAgent);
    vi.mocked(useIDEStore.getState).mockReturnValue({
      settings: { anthropicKey: 'sk-ant-key' },
    } as any);

    await executeCommand('claude "Fix bug"');

    await waitFor(() => {
      // Should show output in terminal
    });
  });
});
```

### 8. WebContainer Commands Tests

```typescript
describe('Terminal - WebContainer Commands', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  it('should execute npm commands', async () => {
    const mockProcess = {
      output: new ReadableStream({
        start(controller) {
          controller.enqueue('Installing packages...\n');
          controller.enqueue('Done\n');
          controller.close();
        },
      }),
      exit: Promise.resolve(0),
    };

    vi.mocked(webContainer.spawn).mockResolvedValue({
      success: true,
      process: mockProcess,
      processId: 'proc-1',
    });

    await executeCommand('npm install');

    expect(webContainer.spawn).toHaveBeenCalledWith('npm', ['install']);
    // Should show output in terminal
  });

  it('should execute node commands', async () => {
    vi.mocked(webContainer.spawn).mockResolvedValue({
      success: true,
      process: {
        output: new ReadableStream(),
        exit: Promise.resolve(0),
      },
      processId: 'proc-2',
    });

    await executeCommand('node script.js');

    expect(webContainer.spawn).toHaveBeenCalledWith('node', ['script.js']);
  });

  it('should handle command timeout', async () => {
    // Mock long-running process
    vi.useFakeTimers();

    await executeCommand('node long-running.js');

    // Advance time past timeout (5 minutes)
    vi.advanceTimersByTime(300000);

    // Should show timeout message
    // Process should be killed

    vi.useRealTimers();
  });

  it('should show error on spawn failure', async () => {
    vi.mocked(webContainer.spawn).mockResolvedValue({
      success: false,
      error: 'Command not found',
    });

    await executeCommand('unknown-command');

    // Should show error message
  });
});
```

### 9. Command History Tests

```typescript
describe('Terminal - Command History', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  it('should navigate up in history with up arrow', async () => {
    // Execute some commands first
    await executeCommand('echo first');
    await executeCommand('echo second');
    await executeCommand('echo third');

    const xterm = getXtermInstance();

    // Press up arrow
    xterm.onData('\x1b[A');

    // Should show 'echo third'
    // Press up again
    xterm.onData('\x1b[A');

    // Should show 'echo second'
  });

  it('should navigate down in history with down arrow', async () => {
    await executeCommand('echo first');
    await executeCommand('echo second');

    const xterm = getXtermInstance();

    // Go up then down
    xterm.onData('\x1b[A'); // up
    xterm.onData('\x1b[B'); // down

    // Should show 'echo second' then empty
  });

  it('should clear to end of history', async () => {
    await executeCommand('echo test');

    const xterm = getXtermInstance();

    // Go up then past end
    xterm.onData('\x1b[A');
    xterm.onData('\x1b[B');
    xterm.onData('\x1b[B');

    // Should show empty line
  });
});
```

### 10. Special Commands Tests

```typescript
describe('Terminal - Special Commands', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  it('should clear terminal with clear command', async () => {
    await executeCommand('clear');

    const xterm = getXtermInstance();
    // xterm.clear should have been called
  });

  it('should show help with help command', async () => {
    await executeCommand('help');

    // Should display all available commands
    // Should show sections for File System, Git, Claude, WebContainer
  });

  it('should handle Ctrl+C to cancel', async () => {
    vi.mocked(webContainer.spawn).mockResolvedValue({
      success: true,
      process: {
        output: new ReadableStream(),
        exit: new Promise(() => {}), // Never resolves
      },
      processId: 'proc-long',
    });

    // Start long-running command
    await executeCommand('node long.js');

    const xterm = getXtermInstance();
    xterm.onData(String.fromCharCode(3)); // Ctrl+C

    // Process should be killed
    // Should show ^C and new prompt
  });

  it('should handle Ctrl+L to clear', async () => {
    const xterm = getXtermInstance();
    xterm.onData(String.fromCharCode(12)); // Ctrl+L

    // Terminal should be cleared
  });
});
```

### 11. Nano Editor Tests

```typescript
describe('Terminal - Nano Editor', () => {
  beforeEach(() => {
    vi.mocked(webContainer.isBooted).mockReturnValue(true);
  });

  it('should launch nano editor', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: 'existing content',
    });

    await executeCommand('nano test.txt');

    // NanoEditor component should be rendered
    // Terminal input should be disabled
  });

  it('should create new file in nano', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: false,
      error: 'File not found',
    });

    await executeCommand('nano new.txt');

    // Nano should open with empty content
  });

  it('should return to terminal on nano exit', async () => {
    await executeCommand('nano test.txt');

    // Get NanoEditor and trigger exit

    // Nano should be unmounted
    // Terminal should get focus
    // Prompt should be shown
  });

  it('should save file from nano', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({ success: true });

    // This is tested more thoroughly in NanoEditor.test.tsx
  });
});
```

### 12. Maximize/Restore Tests

```typescript
describe('Terminal - Maximize/Restore', () => {
  it('should maximize on button click', async () => {
    const mockToggle = vi.fn();

    const { getByTitle } = renderWithProviders(<Terminal />, {
      storeActions: { toggleTerminalMaximized: mockToggle },
    });

    await userEvent.click(getByTitle(/maximize terminal/i));

    expect(mockToggle).toHaveBeenCalled();
  });

  it('should restore on maximize button click when maximized', async () => {
    const mockToggle = vi.fn();

    const { getByTitle } = renderWithProviders(<Terminal />, {
      preloadedState: { terminalMaximized: true },
      storeActions: { toggleTerminalMaximized: mockToggle },
    });

    await userEvent.click(getByTitle(/restore terminal/i));

    expect(mockToggle).toHaveBeenCalled();
  });

  it('should maximize on Ctrl+Shift+M', async () => {
    const mockToggle = vi.fn();

    renderWithProviders(<Terminal />, {
      storeActions: { toggleTerminalMaximized: mockToggle },
    });

    // Simulate Ctrl+Shift+M
    fireEvent.keyDown(document, {
      key: 'M',
      ctrlKey: true,
      shiftKey: true,
    });

    expect(mockToggle).toHaveBeenCalled();
  });

  it('should unmaximize on Escape when maximized', async () => {
    const mockSetMaximized = vi.fn();

    renderWithProviders(<Terminal />, {
      preloadedState: { terminalMaximized: true },
      storeActions: { setTerminalMaximized: mockSetMaximized },
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockSetMaximized).toHaveBeenCalledWith(false);
  });
});
```

### 13. Mobile Responsiveness Tests

```typescript
describe('Terminal - Mobile Responsiveness', () => {
  it('should use smaller font on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    renderWithProviders(<Terminal />);

    await waitFor(() => {
      // XTerm should be created with fontSize: 12
    });
  });

  it('should adjust columns on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    renderWithProviders(<Terminal />);

    await waitFor(() => {
      // XTerm cols should be <= 80
    });
  });

  it('should handle touch events on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    vi.mocked(webContainer.isBooted).mockReturnValue(true);

    const { container } = renderWithProviders(<Terminal />);

    const terminalContent = container.querySelector('.terminal-content');

    // Should have touch-manipulation class
    expect(terminalContent).toHaveClass('touch-manipulation');
  });
});
```

---

## Mock Strategy

### xterm.js Mock
```typescript
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    writeln: vi.fn(),
    clear: vi.fn(),
    focus: vi.fn(),
    onData: vi.fn(),
    loadAddon: vi.fn(),
    dispose: vi.fn(),
    resize: vi.fn(),
    scrollToBottom: vi.fn(),
  })),
}));

vi.mock('@xterm/addon-fit', () => ({
  FitAddon: vi.fn().mockImplementation(() => ({
    fit: vi.fn(),
  })),
}));

vi.mock('@xterm/addon-web-links', () => ({
  WebLinksAddon: vi.fn(),
}));
```

### WebContainer Mock
```typescript
// Already available in tests/mocks.ts
```

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

---

## Notes

- **xterm.js complex**: Terminal interaction requires careful mocking.
- **Async command execution**: Most commands are async; use proper await patterns.
- **Stream handling**: WebContainer output streaming needs special test handling.
- **Keyboard events**: Arrow keys use escape sequences (`\x1b[A`, `\x1b[B`).
- **Cleanup**: Terminal disposal and process cleanup need verification.
- **Nano editor**: NanoEditor component has its own test file.

---

## Related Documents

- [PLAN_TEST-filesystem.md](./PLAN_TEST-filesystem.md) - FileSystemService tests
- [PLAN_TEST-git.md](./PLAN_TEST-git.md) - GitService tests
- [tests/mocks.ts](../../tests/mocks.ts) - Mock factories
