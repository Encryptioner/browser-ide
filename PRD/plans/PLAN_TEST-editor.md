# Test Plan: Monaco Editor Component

**Plan ID:** P2-003
**Component:** `src/components/IDE/Editor.tsx`
**Created:** February 2026
**Status:** Ready for Implementation

---

## Component Overview

The Editor component wraps Monaco Editor for code editing with syntax highlighting, IntelliSense, and linting. It manages file tabs, content persistence, save shortcuts, and displays a welcome screen when no file is open.

### Key Features
- Monaco Editor integration with `@monaco-editor/react`
- File tabs with mobile-optimized display
- Auto-save on Cmd/Ctrl+S
- Language detection from file extension
- Real-time linting with debouncing
- Mobile-responsive font sizes and settings
- Welcome screen with action buttons
- Content persistence in Zustand store

---

## Test File Location

```
src/components/IDE/Editor.test.tsx
```

---

## Props and Dependencies

| Prop/Dependency | Type | Purpose |
|-----------------|------|---------|
| useIDEStore | Zustand store | currentFile, openFiles, editorContent, settings |
| fileSystem | Service | readFile, writeFile, getLanguageFromPath |
| linterService | Service | updateMarkers |
| MonacoEditor | Component | Editor wrapper |

---

## Test Cases

### 1. Rendering Tests

```typescript
describe('Editor - Rendering', () => {
  it('should render welcome screen when no file is open', () => {
    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: null,
        openFiles: [],
      },
    });

    expect(getByText('Welcome to Browser IDE')).toBeInTheDocument();
  });

  it('should render feature cards on welcome screen', () => {
    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: { currentFile: null },
    });

    expect(getByText('File Management')).toBeInTheDocument();
    expect(getByText('Git Integration')).toBeInTheDocument();
    expect(getByText('Run Code')).toBeInTheDocument();
    expect(getByText('AI Assistant')).toBeInTheDocument();
  });

  it('should render Monaco Editor when file is open', () => {
    const { container } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    // Monaco Editor container should be present
    const editorContainer = container.querySelector('.editor-wrapper');
    expect(editorContainer).toBeInTheDocument();
  });

  it('should render file tabs', () => {
    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts', '/src/app.tsx'],
      },
    });

    expect(getByText('test.ts')).toBeInTheDocument();
    expect(getByText('app.tsx')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts', '/src/app.tsx'],
      },
    });

    const activeTab = getByText('test.ts').closest('.tab');
    expect(activeTab).toHaveClass('active');
  });
});
```

### 2. File Loading Tests

```typescript
describe('Editor - File Loading', () => {
  it('should load file content on mount', async () => {
    const mockContent = 'console.log("hello");';

    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: mockContent,
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    await waitFor(() => {
      expect(fileSystem.readFile).toHaveBeenCalledWith('/src/test.ts');
    });
  });

  it('should use cached content from store if available', async () => {
    const cachedContent = 'cached content';

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        editorContent: {
          '/src/test.ts': cachedContent,
        },
      },
    });

    // Should not call readFile if content is in store
    expect(fileSystem.readFile).not.toHaveBeenCalled();
  });

  it('should detect language from file path', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: 'content',
    });

    vi.mocked(fileSystem.getLanguageFromPath).mockReturnValue('typescript');

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    await waitFor(() => {
      expect(fileSystem.getLanguageFromPath).toHaveBeenCalledWith('/src/test.ts');
    });
  });

  it('should load new file when currentFile changes', async () => {
    const { rerender } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/first.ts',
        openFiles: ['/src/first.ts'],
      },
    });

    // Change to different file
    rerenderWithStore(
      <Editor />,
      { currentFile: '/src/second.ts', openFiles: ['/src/first.ts', '/src/second.ts'] }
    );

    await waitFor(() => {
      expect(fileSystem.readFile).toHaveBeenCalledWith('/src/second.ts');
    });
  });
});
```

### 3. Content Editing Tests

```typescript
describe('Editor - Content Editing', () => {
  it('should update content on change', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: 'initial content',
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    // Simulate Monaco editor onChange
    const editorComponent = screen.getByTestId('monaco-editor');
    // Trigger change event with new content

    // Verify store update was called
    const store = useIDEStore.getState();
    expect(store.editorContent['/src/test.ts']).toBe('new content');
  });

  it('should mark file as unsaved on edit', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: 'initial',
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    // Trigger edit

    // Verify unsavedFiles was updated
    const store = useIDEStore.getState();
    expect(store.unsavedFiles.has('/src/test.ts')).toBe(true);
  });

  it('should debounce linting updates', async () => {
    vi.mocked(linterService.updateMarkers).mockResolvedValue();

    const { user } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    // Trigger multiple rapid edits
    // Wait for debounce (500ms)

    await waitFor(
      () => {
        expect(linterService.updateMarkers).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });
});
```

### 4. Save Tests

```typescript
describe('Editor - Save', () => {
  it('should save file on Cmd+S', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({
      success: true,
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        editorContent: {
          '/src/test.ts': 'saved content',
        },
      },
    });

    // Simulate Cmd+S keydown

    await waitFor(() => {
      expect(fileSystem.writeFile).toHaveBeenCalledWith(
        '/src/test.ts',
        'saved content'
      );
    });
  });

  it('should mark file as saved after successful save', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({
      success: true,
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        unsavedFiles: new Set(['/src/test.ts']),
      },
    });

    // Trigger save

    await waitFor(() => {
      const store = useIDEStore.getState();
      expect(store.unsavedFiles.has('/src/test.ts')).toBe(false);
    });
  });

  it('should update linting after save', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({ success: true });
    vi.mocked(linterService.updateMarkers).mockResolvedValue();

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    // Trigger save

    await waitFor(() => {
      expect(linterService.updateMarkers).toHaveBeenCalled();
    });
  });
});
```

### 5. Tab Management Tests

```typescript
describe('Editor - Tab Management', () => {
  it('should render all open files as tabs', () => {
    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: [
          '/src/test.ts',
          '/src/app.tsx',
          '/src/components/Button.tsx',
          '/package.json',
        ],
      },
    });

    expect(getByText('test.ts')).toBeInTheDocument();
    expect(getByText('app.tsx')).toBeInTheDocument();
    expect(getByText('Button.tsx')).toBeInTheDocument();
    expect(getByText('package.json')).toBeInTheDocument();
  });

  it('should switch to clicked tab', async () => {
    const mockSetCurrentFile = vi.fn();

    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts', '/src/app.tsx'],
      },
      storeActions: {
        setCurrentFile: mockSetCurrentFile,
      },
    });

    await userEvent.click(getByText('app.tsx'));

    expect(mockSetCurrentFile).toHaveBeenCalledWith('/src/app.tsx');
  });

  it('should close tab on close button click', async () => {
    const mockCloseFile = vi.fn();

    const { container } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts', '/src/app.tsx'],
      },
      storeActions: {
        closeFile: mockCloseFile,
      },
    });

    const closeButtons = container.querySelectorAll('.tab-close');
    await userEvent.click(closeButtons[0]);

    expect(mockCloseFile).toHaveBeenCalled();
  });

  it('should stop propagation on close button click', async () => {
    const mockSetCurrentFile = vi.fn();
    const mockCloseFile = vi.fn();

    const { container } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
      storeActions: {
        setCurrentFile: mockSetCurrentFile,
        closeFile: mockCloseFile,
      },
    });

    const closeButton = container.querySelector('.tab-close');
    await userEvent.click(closeButton!);

    expect(mockCloseFile).toHaveBeenCalled();
    expect(mockSetCurrentFile).not.toHaveBeenCalled();
  });
});
```

### 6. Welcome Screen Tests

```typescript
describe('Editor - Welcome Screen', () => {
  it('should show clone button that dispatches event', () => {
    const showCloneSpy = vi.fn();
    window.addEventListener('show-clone-dialog', showCloneSpy);

    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: { currentFile: null },
    });

    const cloneButton = getByText('Clone Repository');
    fireEvent.click(cloneButton);

    expect(showCloneSpy).toHaveBeenCalled();
    window.removeEventListener('show-clone-dialog', showCloneSpy);
  });

  it('should show settings button that dispatches event', () => {
    const showSettingsSpy = vi.fn();
    window.addEventListener('show-settings-dialog', showSettingsSpy);

    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: { currentFile: null },
    });

    const settingsButton = getByText('Open Settings');
    fireEvent.click(settingsButton);

    expect(showSettingsSpy).toHaveBeenCalled();
    window.removeEventListener('show-settings-dialog', showSettingsSpy);
  });

  it('should display all feature descriptions', () => {
    const { getByText } = renderWithProviders(<Editor />, {
      preloadedState: { currentFile: null },
    });

    expect(getByText(/browse and edit files/i)).toBeInTheDocument();
    expect(getByText(/clone, commit, and push/i)).toBeInTheDocument();
    expect(getByText(/execute node\.js apps/i)).toBeInTheDocument();
    expect(getByText(/get coding help/i)).toBeInTheDocument();
  });
});
```

### 7. Mobile Responsiveness Tests

```typescript
describe('Editor - Mobile Responsiveness', () => {
  it('should use smaller font size on mobile', () => {
    // Mock window.innerWidth < 768
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const { container } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        settings: { fontSize: 14 },
      },
    });

    // Editor should have mobile-adjusted font size
    // Monaco component fontSize prop should be 12 (14 - 2)
  });

  it('should enable word wrap on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        settings: { wordWrap: 'off' },
      },
    });

    // Monaco wordWrap should be 'on' on mobile regardless of setting
  });

  it('should disable minimap on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        settings: { minimap: true },
      },
    });

    // Monaco minimap should be disabled on mobile
  });

  it('should truncate long file names on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    const { container } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/VeryLongFileNameThatExceedsTwelveCharacters.ts',
        openFiles: ['/src/VeryLongFileNameThatExceedsTwelveCharacters.ts'],
      },
    });

    // Tab name should be truncated with ...
    const tabName = container.querySelector('.tab-name');
    expect(tabName?.textContent).toMatch(/.*\.\.\./);
  });
});
```

### 8. Monaco Editor Options Tests

```typescript
describe('Editor - Monaco Options', () => {
  it('should apply user settings to Monaco', () => {
    const userSettings = {
      fontSize: 16,
      tabSize: 4,
      wordWrap: 'on',
      minimap: true,
      lineNumbers: 'on' as const,
      theme: 'vs-dark',
    };

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        settings: userSettings,
      },
    });

    // Verify Monaco props match settings
    const monacoProps = getMonacoEditorProps();
    expect(monacoProps.options.fontSize).toBe(16);
    expect(monacoProps.options.tabSize).toBe(4);
    expect(monacoProps.options.wordWrap).toBe('on');
  });

  it('should set theme from settings', () => {
    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
        settings: { theme: 'vs-light' },
      },
    });

    const monacoProps = getMonacoEditorProps();
    expect(monacoProps.theme).toBe('vs-light');
  });

  it('should configure IntelliSense options', () => {
    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    const monacoProps = getMonacoEditorProps();
    expect(monacoProps.options.suggestOnTriggerCharacters).toBe(true);
    expect(monacoProps.options.quickSuggestions).toEqual({
      other: true,
      comments: true,
      strings: true,
    });
  });

  it('should enable automaticLayout', () => {
    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    const monacoProps = getMonacoEditorProps();
    expect(monacoProps.options.automaticLayout).toBe(true);
  });
});
```

### 9. Error Handling Tests

```typescript
describe('Editor - Error Handling', () => {
  it('should handle file read error gracefully', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: false,
      error: 'File not found',
    });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/missing.ts',
        openFiles: ['/src/missing.ts'],
      },
    });

    // Editor should still render with empty content
    const editorContainer = screen.getByTestId('monaco-editor');
    expect(editorContainer).toBeInTheDocument();
  });

  it('should handle save error', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({
      success: false,
      error: 'Write failed',
    });

    // Trigger save

    // File should remain in unsaved state
    const store = useIDEStore.getState();
    expect(store.unsavedFiles.has('/src/test.ts')).toBe(true);
  });

  it('should handle linting error without crashing', async () => {
    vi.mocked(linterService.updateMarkers).mockRejectedValue(
      new Error('Linting failed')
    );

    // Trigger edit that would cause linting

    // Editor should remain functional
    const editorContainer = screen.getByTestId('monaco-editor');
    expect(editorContainer).toBeInTheDocument();
  });
});
```

### 10. Integration Tests

```typescript
describe('Editor - Integration', () => {
  it('should complete full edit-save cycle', async () => {
    const newContent = 'updated content';

    // Setup
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: 'original',
    });
    vi.mocked(fileSystem.writeFile).mockResolvedValue({ success: true });

    renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/test.ts',
        openFiles: ['/src/test.ts'],
      },
    });

    // Edit content
    await editMonacoContent(newContent);

    // Verify unsaved state
    let store = useIDEStore.getState();
    expect(store.unsavedFiles.has('/src/test.ts')).toBe(true);

    // Save
    await saveEditor();

    // Verify saved
    await waitFor(() => {
      store = useIDEStore.getState();
      expect(store.unsavedFiles.has('/src/test.ts')).toBe(false);
    });

    expect(fileSystem.writeFile).toHaveBeenCalledWith('/src/test.ts', newContent);
  });

  it('should switch between files preserving unsaved changes', async () => {
    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: '',
    });

    const { rerender } = renderWithProviders(<Editor />, {
      preloadedState: {
        currentFile: '/src/first.ts',
        openFiles: ['/src/first.ts', '/src/second.ts'],
        editorContent: {
          '/src/first.ts': 'unsaved content in first',
          '/src/second.ts': 'unsaved content in second',
        },
        unsavedFiles: new Set(['/src/first.ts', '/src/second.ts']),
      },
    });

    // Edit first file
    await editMonacoContent('modified first');

    // Switch to second file
    rerenderWithStore(<Editor />, {
      currentFile: '/src/second.ts',
      openFiles: ['/src/first.ts', '/src/second.ts'],
      editorContent: {
        '/src/first.ts': 'modified first',
        '/src/second.ts': 'unsaved content in second',
      },
      unsavedFiles: new Set(['/src/first.ts', '/src/second.ts']),
    });

    // First file should still have unsaved changes
    const store = useIDEStore.getState();
    expect(store.unsavedFiles.has('/src/first.ts')).toBe(true);
  });
});
```

---

## Mock Strategy

### Monaco Editor Mock
```typescript
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ onChange, onMount, value, language, theme, options }) => {
    React.useEffect(() => {
      if (onMount) {
        onMount({
          addCommand: vi.fn(),
          updateOptions: vi.fn(),
          setModel: vi.fn(),
        });
      }
    }, [onMount]);

    return (
      <div data-testid="monaco-editor" data-value={value} data-language={language}>
        Monaco Editor: {language}
      </div>
    );
  }),
}));
```

### Service Mocks
```typescript
// Already available in tests/mocks.ts
import { mockFileSystem, mockLinterService } from '@/tests/mocks';
```

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 85% |
| Branches | 80% |
| Functions | 85% |
| Lines | 85% |

---

## Notes

- **Monaco mocking**: Monaco Editor is complex to mock. Consider using a simplified wrapper for testing.
- **Editor lifecycle**: Monaco editor initialization and disposal need careful test handling.
- **Keyboard shortcuts**: Use `fireEvent.keyDown` with correct key codes for shortcuts.
- **Window resize**: Test responsive behavior by mocking `window.innerWidth`.
- **Custom events**: Clone/settings dialog events should be tested with event listeners.

---

## Related Documents

- [PLAN_TEST-filesystem.md](./PLAN_TEST-filesystem.md) - FileSystemService tests
- [tests/test-utils.tsx](../../tests/test-utils.tsx) - Test utilities
