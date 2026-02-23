# Test Plan: FileExplorer Component

**Plan ID:** P2-004
**Component:** `src/components/IDE/FileExplorer.tsx`
**Created:** February 2026
**Status:** Ready for Implementation

---

## Component Overview

The FileExplorer component displays a tree view of files and directories with Git status badges, context menus, drag-and-drop support, and inline renaming. It integrates with both the file system service and Git service.

### Key Features
- Recursive file tree display with expand/collapse
- File type icons with semantic colors
- Git status badges (modified, added, deleted, untracked, staged)
- Context menu for file operations (rename, delete, new file/folder)
- Inline editing for rename and create
- Navigation bar with current directory display
- Refresh functionality
- Mobile-optimized touch targets

---

## Test File Location

```
src/components/IDE/FileExplorer.test.tsx
```

---

## Props and Dependencies

| Prop/Dependency | Type | Purpose |
|-----------------|------|---------|
| useIDEStore | Zustand store | fileTree, currentFile, gitStatus, etc. |
| fileSystem | Service | File operations |
| gitService | Service | Git status operations |
| toast | sonner | User notifications |

---

## Test Cases

### 1. Rendering Tests

```typescript
describe('FileExplorer - Rendering', () => {
  it('should render header with title and action buttons', () => {
    const { getByText, getByTitle } = renderWithProviders(<FileExplorer />);

    expect(getByText('Explorer')).toBeInTheDocument();
    expect(getByTitle('Refresh')).toBeInTheDocument();
    expect(getByTitle('New File')).toBeInTheDocument();
    expect(getByTitle('New Folder')).toBeInTheDocument();
  });

  it('should render navigation bar with current directory', () => {
    vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/src/components');

    const { getByText } = renderWithProviders(<FileExplorer />);

    expect(getByText('/src/components')).toBeInTheDocument();
  });

  it('should render file tree when files exist', () => {
    const mockTree = [
      { name: 'src', path: '/src', type: 'directory' as const, children: [
        { name: 'index.ts', path: '/src/index.ts', type: 'file' as const },
      ]},
      { name: 'package.json', path: '/package.json', type: 'file' as const },
    ];

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    expect(getByText('src')).toBeInTheDocument();
    expect(getByText('index.ts')).toBeInTheDocument();
    expect(getByText('package.json')).toBeInTheDocument();
  });

  it('should render empty state when no files', () => {
    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: [] },
    });

    expect(getByText('No files yet')).toBeInTheDocument();
    expect(getByText(/clone a repository/i)).toBeInTheDocument();
  });
});
```

### 2. File Tree Display Tests

```typescript
describe('FileExplorer - File Tree Display', () => {
  it('should show folder icon for directories', () => {
    const mockTree = [
      { name: 'src', path: '/src', type: 'directory' as const, children: [] },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const folderIcon = container.querySelector('.text-blue-400');
    expect(folderIcon).toBeInTheDocument();
  });

  it('should show correct icons for different file types', () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
      { name: 'app.tsx', path: '/app.tsx', type: 'file' as const },
      { name: 'data.json', path: '/data.json', type: 'file' as const },
      { name: 'readme.md', path: '/readme.md', type: 'file' as const },
      { name: 'logo.png', path: '/logo.png', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // TypeScript files should have yellow icons
    expect(container.querySelectorAll('.text-yellow-400')).toHaveLength(2);
    // JSON should have green icon
    expect(container.querySelector('.text-green-400')).toBeInTheDocument();
    // Markdown should have gray icon
    expect(container.querySelector('.text-gray-400')).toBeInTheDocument();
    // Image should have purple icon
    expect(container.querySelector('.text-purple-400')).toBeInTheDocument();
  });

  it('should sort directories before files', () => {
    const mockTree = [
      { name: 'z_file.ts', path: '/z_file.ts', type: 'file' as const },
      { name: 'a_folder', path: '/a_folder', type: 'directory' as const, children: [] },
      { name: 'm_file.ts', path: '/m_file.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const items = container.querySelectorAll('.tree-item-row');
    // First item should be directory (a_folder)
    expect(items[0]).toHaveTextContent('a_folder');
    expect(items[1]).toHaveTextContent('m_file.ts');
    expect(items[2]).toHaveTextContent('z_file.ts');
  });

  it('should highlight currently open file', () => {
    const mockTree = [
      { name: 'test.ts', path: '/src/test.ts', type: 'file' as const },
      { name: 'other.ts', path: '/src/other.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        currentFile: '/src/test.ts',
      },
    });

    const testRow = Array.from(container.querySelectorAll('.tree-item-row.file'))
      .find(row => row.textContent?.includes('test.ts'));

    expect(testRow).toHaveClass('bg-blue-600');
  });
});
```

### 3. Expand/Collapse Tests

```typescript
describe('FileExplorer - Expand/Collapse', () => {
  it('should expand directory on click', async () => {
    const mockTree = [
      {
        name: 'src',
        path: '/src',
        type: 'directory' as const,
        children: [
          { name: 'index.ts', path: '/src/index.ts', type: 'file' as const },
        ],
      },
    ];

    const { container, getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        expandedDirs: new Set(['/src']),
      },
    });

    // Initially collapsed
    const chevron = container.querySelector('.chevron');
    expect(chevron).toBeInTheDocument();

    // Click to expand
    const dirRow = getByText('src').closest('.tree-item-row');
    await userEvent.click(dirRow!);

    // Child should be visible
    expect(getByText('index.ts')).toBeInTheDocument();
  });

  it('should collapse directory when clicking expanded', async () => {
    const { container, getByText, queryByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: [
          {
            name: 'src',
            path: '/src',
            type: 'directory' as const,
            children: [
              { name: 'index.ts', path: '/src/index.ts', type: 'file' as const },
            ],
          },
        ],
        expandedDirs: new Set(['/src']),
      },
    });

    // Should show child initially
    expect(getByText('index.ts')).toBeInTheDocument();

    // Click to collapse
    const dirRow = getByText('src').closest('.tree-item-row');
    await userEvent.click(dirRow!);

    // Child should be hidden
    expect(queryByText('index.ts')).not.toBeInTheDocument();
  });

  it('should persist expanded directories in state', () => {
    // Root should be expanded by default
    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: [
          {
            name: 'src',
            path: '/src',
            type: 'directory' as const,
            children: [],
          },
        ],
        expandedDirs: new Set(['/']),
      },
    });

    // Root directory should be in expanded state
    // Store should contain '/' in expandedDirs
  });
});
```

### 4. Git Status Badge Tests

```typescript
describe('FileExplorer - Git Status Badges', () => {
  it('should show modified badge', () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        gitStatus: [
          { path: 'test.ts', status: 'modified' as const },
        ],
      },
    });

    const badge = container.querySelector('.bg-yellow-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('M');
  });

  it('should show added badge', () => {
    const mockTree = [
      { name: 'new.ts', path: '/new.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        gitStatus: [
          { path: 'new.ts', status: 'added' as const },
        ],
      },
    });

    const badge = container.querySelector('.bg-green-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('A');
  });

  it('should show deleted badge', () => {
    const mockTree = [
      { name: 'removed.ts', path: '/removed.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        gitStatus: [
          { path: 'removed.ts', status: 'deleted' as const },
        ],
      },
    });

    const badge = container.querySelector('.bg-red-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('D');
  });

  it('should show untracked badge', () => {
    const mockTree = [
      { name: 'untracked.ts', path: '/untracked.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        gitStatus: [
          { path: 'untracked.ts', status: 'untracked' as const },
        ],
      },
    });

    const badge = container.querySelector('.bg-blue-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('U');
  });

  it('should show staged badge', () => {
    const mockTree = [
      { name: 'staged.ts', path: '/staged.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        gitStatus: [
          { path: 'staged.ts', status: 'staged' as const },
        ],
      },
    });

    const badge = container.querySelector('.bg-purple-600');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('S');
  });

  it('should not show badge for unmodified files', () => {
    const mockTree = [
      { name: 'clean.ts', path: '/clean.ts', type: 'file' as const },
    ];

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: mockTree,
        gitStatus: [
          { path: 'clean.ts', status: 'unmodified' as const },
        ],
      },
    });

    const badges = container.querySelectorAll('[class*="bg-"][class*="text-"]');
    expect(badges.length).toBe(0);
  });
});
```

### 5. File Selection Tests

```typescript
describe('FileExplorer - File Selection', () => {
  it('should open file on click', async () => {
    const mockSetCurrentFile = vi.fn();
    const mockAddOpenFile = vi.fn();

    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
      storeActions: {
        setCurrentFile: mockSetCurrentFile,
        addOpenFile: mockAddOpenFile,
      },
    });

    const fileRow = getByText('test.ts').closest('.tree-item-row.file');
    await userEvent.click(fileRow!);

    expect(mockSetCurrentFile).toHaveBeenCalledWith('/test.ts');
    expect(mockAddOpenFile).toHaveBeenCalledWith('/test.ts');
  });

  it('should not open directory on click', async () => {
    const mockSetCurrentFile = vi.fn();

    const mockTree = [
      { name: 'src', path: '/src', type: 'directory' as const, children: [] },
    ];

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
      storeActions: {
        setCurrentFile: mockSetCurrentFile,
      },
    });

    const dirRow = getByText('src').closest('.tree-item-row');
    await userEvent.click(dirRow!);

    expect(mockSetCurrentFile).not.toHaveBeenCalled();
  });
});
```

### 6. Context Menu Tests

```typescript
describe('FileExplorer - Context Menu', () => {
  it('should show context menu on right-click', async () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByText, getByRole, container } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);

    const menu = getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(getByText('Rename')).toBeInTheDocument();
    expect(getByText('Copy')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
  });

  it('should show additional options for directories', async () => {
    const mockTree = [
      { name: 'src', path: '/src', type: 'directory' as const, children: [] },
    ];

    const { getByText, getByRole } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const dirRow = getByText('src').closest('.tree-item-row');
    fireEvent.contextMenu(dirRow!);

    expect(getByText('New File')).toBeInTheDocument();
    expect(getByText('New Folder')).toBeInTheDocument();
  });

  it('should close context menu on outside click', async () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByRole, queryByRole } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Open menu
    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    expect(getByRole('menu')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should close context menu on Escape key', async () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByRole, queryByRole } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(queryByRole('menu')).not.toBeInTheDocument();
  });
});
```

### 7. Rename Tests

```typescript
describe('FileExplorer - Rename', () => {
  it('should show rename input on rename action', async () => {
    const mockTree = [
      { name: 'old.ts', path: '/old.ts', type: 'file' as const },
    ];

    const { getByPlaceholderText, getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Trigger rename via context menu
    const fileRow = getByText('old.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await userEvent.click(getByText('Rename'));

    const input = getByPlaceholderText(/filename/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('old.ts');
  });

  it('should rename file on successful input', async () => {
    vi.mocked(fileSystem.rename).mockResolvedValue({ success: true });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);

    const mockTree = [
      { name: 'old.ts', path: '/old.ts', type: 'file' as const },
    ];

    const { getByDisplayValue, user } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Start rename
    const fileRow = getByText('old.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await user.click(getByText('Rename'));

    // Change name and blur
    const input = getByDisplayValue('old.ts');
    await user.clear(input);
    await user.type(input, 'new.ts');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fileSystem.rename).toHaveBeenCalledWith('/old.ts', '/new.ts');
    });
  });

  it('should cancel rename on Escape key', async () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByDisplayValue } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Start rename
    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await userEvent.click(getByText('Rename'));

    const input = getByDisplayValue('test.ts');
    fireEvent.keyDown(input, { key: 'Escape' });

    // Input should be removed
    expect(queryByDisplayValue('test.ts')).not.toBeInTheDocument();
  });

  it('should cancel rename on empty input', async () => {
    vi.mocked(fileSystem.rename).mockResolvedValue({ success: true });

    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByDisplayValue } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Start rename
    fireEvent.contextMenu(getByText('test.ts').closest('.tree-item-row')!);
    await userEvent.click(getByText('Rename'));

    // Clear input and blur
    const input = getByDisplayValue('test.ts');
    await userEvent.clear(input);
    fireEvent.blur(input);

    // Should not call rename
    expect(fileSystem.rename).not.toHaveBeenCalled();
  });

  it('should show error toast on rename failure', async () => {
    vi.mocked(fileSystem.rename).mockResolvedValue({
      success: false,
      error: 'File already exists',
    });

    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByDisplayValue } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Start and complete rename
    fireEvent.contextMenu(getByText('test.ts').closest('.tree-item-row')!);
    await userEvent.click(getByText('Rename'));

    const input = getByDisplayValue('test.ts');
    await userEvent.clear(input);
    await userEvent.type(input, 'exists.ts');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to rename')
      );
    });
  });
});
```

### 8. Delete Tests

```typescript
describe('FileExplorer - Delete', () => {
  it('should show confirmation dialog on delete action', async () => {
    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Trigger delete
    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await userEvent.click(getByText('Delete'));

    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('Delete'));

    confirmSpy.mockRestore();
  });

  it('should delete file on confirmation', async () => {
    vi.mocked(fileSystem.deletePath).mockResolvedValue({ success: true });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);
    vi.mocked(gitService.statusMatrix).mockResolvedValue([]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    // Trigger delete
    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await userEvent.click(getByText('Delete'));

    await waitFor(() => {
      expect(fileSystem.deletePath).toHaveBeenCalledWith('/test.ts');
    });

    confirmSpy.mockRestore();
  });

  it('should not delete on cancel', async () => {
    vi.mocked(fileSystem.deletePath).mockResolvedValue({ success: true });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await userEvent.click(getByText('Delete'));

    expect(fileSystem.deletePath).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should show error toast on delete failure', async () => {
    vi.mocked(fileSystem.deletePath).mockResolvedValue({
      success: false,
      error: 'Permission denied',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const mockTree = [
      { name: 'test.ts', path: '/test.ts', type: 'file' as const },
    ];

    const { getByText } = renderWithProviders(<FileExplorer />, {
      preloadedState: { fileTree: mockTree },
    });

    const fileRow = getByText('test.ts').closest('.tree-item-row');
    fireEvent.contextMenu(fileRow!);
    await userEvent.click(getByText('Delete'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete')
      );
    });
  });
});
```

### 9. Create File/Folder Tests

```typescript
describe('FileExplorer - Create File/Folder', () => {
  it('should show new file input on new file action', async () => {
    vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/src');

    const { getByPlaceholderText, getByTitle } = renderWithProviders(<FileExplorer />);

    await userEvent.click(getByTitle('New File'));

    const input = getByPlaceholderText('filename.txt');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it('should create file on input', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({ success: true });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);
    vi.mocked(gitService.statusMatrix).mockResolvedValue([]);

    const { getByPlaceholderText, user } = renderWithProviders(<FileExplorer />);

    await userEvent.click(getByTitle('New File'));

    const input = getByPlaceholderText('filename.txt');
    await user.type(input, 'test.ts');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fileSystem.writeFile).toHaveBeenCalledWith('/test.ts', '');
    });
  });

  it('should create folder on input', async () => {
    vi.mocked(fileSystem.createDirectory).mockResolvedValue({ success: true });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);
    vi.mocked(gitService.statusMatrix).mockResolvedValue([]);

    const { getByPlaceholderText, user } = renderWithProviders(<FileExplorer />);

    await userEvent.click(getByTitle('New Folder'));

    const input = getByPlaceholderText('foldername');
    await user.type(input, 'new-folder');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fileSystem.createDirectory).toHaveBeenCalledWith('/new-folder');
    });
  });

  it('should cancel creation on empty input', async () => {
    const { getByPlaceholderText, queryByPlaceholderText, user } = renderWithProviders(<FileExplorer />);

    await userEvent.click(getByTitle('New File'));
    fireEvent.blur(getByPlaceholderText('filename.txt'));

    expect(queryByPlaceholderText('filename.txt')).not.toBeInTheDocument();
  });

  it('should cancel creation on Escape key', async () => {
    const { getByPlaceholderText, queryByPlaceholderText, user } = renderWithProviders(<FileExplorer />);

    await userEvent.click(getByTitle('New File'));

    const input = getByPlaceholderText('filename.txt');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(queryByPlaceholderText('filename.txt')).not.toBeInTheDocument();
  });

  it('should expand parent after creating new item', async () => {
    vi.mocked(fileSystem.writeFile).mockResolvedValue({ success: true });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([
      {
        name: 'src',
        path: '/src',
        type: 'directory' as const,
        children: [
          { name: 'new.ts', path: '/src/new.ts', type: 'file' as const },
        ],
      },
    ]);

    const { getByPlaceholderText, user } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: [
          { name: 'src', path: '/src', type: 'directory' as const, children: [] },
        ],
        expandedDirs: new Set(),
      },
    });

    // Create file in src directory via context menu
    // Verify src gets expanded
  });
});
```

### 10. Navigation Tests

```typescript
describe('FileExplorer - Navigation', () => {
  it('should navigate to parent directory on up button click', async () => {
    vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/src/components');
    vi.mocked(fileSystem.changeDirectory).mockResolvedValue({
      success: true,
      data: '/src',
    });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);

    const { getByTitle } = renderWithProviders(<FileExplorer />);

    const upButton = getByTitle(/go up directory/i);
    await userEvent.click(upButton);

    expect(fileSystem.changeDirectory).toHaveBeenCalledWith('/src');
  });

  it('should navigate to root on home button click', async () => {
    vi.mocked(fileSystem.changeDirectory).mockResolvedValue({
      success: true,
      data: '/',
    });
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);

    const { getByTitle } = renderWithProviders(<FileExplorer />);

    const homeButton = getByTitle(/go to root/i);
    await userEvent.click(homeButton);

    expect(fileSystem.changeDirectory).toHaveBeenCalledWith('/');
  });

  it('should disable up button when at root', () => {
    vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/');

    const { getByTitle } = renderWithProviders(<FileExplorer />);

    const upButton = getByTitle(/go up directory/i);
    expect(upButton).toBeDisabled();
  });

  it('should refresh on button click', async () => {
    vi.mocked(fileSystem.buildFileTree).mockResolvedValue([]);
    vi.mocked(gitService.statusMatrix).mockResolvedValue([]);

    const { getByTitle } = renderWithProviders(<FileExplorer />);

    await userEvent.click(getByTitle('Refresh'));

    expect(fileSystem.buildFileTree).toHaveBeenCalled();
    expect(gitService.statusMatrix).toHaveBeenCalled();
  });
});
```

### 11. Mobile Responsiveness Tests

```typescript
describe('FileExplorer - Mobile Responsiveness', () => {
  it('should use larger touch targets on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    const { container } = renderWithProviders(<FileExplorer />, {
      preloadedState: {
        fileTree: [
          { name: 'test.ts', path: '/test.ts', type: 'file' as const },
        ],
      },
    });

    const treeRow = container.querySelector('.tree-item-row');
    expect(treeRow).toHaveClass('min-h-[44px]');
  });

  it('should adapt navigation bar for mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

    const { container } = renderWithProviders(<FileExplorer />);

    const header = container.querySelector('.panel-header');
    expect(header).toBeInTheDocument();
  });
});
```

---

## Mock Strategy

### Icon Components Mock
```typescript
vi.mock('lucide-react', () => ({
  File: vi.fn(() => <div data-testid="file-icon" />),
  Folder: vi.fn(() => <div data-testid="folder-icon" />),
  FolderOpen: vi.fn(() => <div data-testid="folder-open-icon" />),
  // ... other icons
}));
```

### Toast Mock
```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
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

- **Context menu**: Testing context menus requires proper event simulation.
- **Inline editing**: Input focus and blur handling needs careful test setup.
- **Tree state**: Expansion state is in component state, not Zustand.
- **File path handling**: Verify proper path construction for nested items.
- **Git status**: Status badges update from store, not direct Git calls in component.

---

## Related Documents

- [PLAN_TEST-filesystem.md](./PLAN_TEST-filesystem.md) - FileSystemService tests
- [PLAN_TEST-git.md](./PLAN_TEST-git.md) - GitService tests
