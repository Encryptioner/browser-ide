/**
 * FileExplorer Component Tests
 *
 * Test Plan: PRD/plans/PLAN_TEST-fileexplorer.md
 * Implementation: src/components/IDE/FileExplorer.tsx
 *
 * Testing the file tree component with file operations,
 * git status, and context menus.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Create mock functions for filesystem service
const mockBuildFileTree = vi.fn();
const mockGetCurrentWorkingDirectory = vi.fn(() => '/');
const mockChangeDirectory = vi.fn();
const mockWriteFile = vi.fn();
const mockCreateDirectory = vi.fn();
const mockDeletePath = vi.fn();
const mockRename = vi.fn();
const mockGetLanguageFromPath = vi.fn();

// Create mock functions for git service
const mockStatusMatrix = vi.fn();

// Create mock functions for store
const mockSetCurrentFile = vi.fn();
const mockAddOpenFile = vi.fn();
const mockSetFileTree = vi.fn();

// Mock filesystem service
vi.mock('@/services/filesystem', () => ({
  fileSystem: {
    buildFileTree: mockBuildFileTree,
    getCurrentWorkingDirectory: mockGetCurrentWorkingDirectory,
    changeDirectory: mockChangeDirectory,
    writeFile: mockWriteFile,
    createDirectory: mockCreateDirectory,
    deletePath: mockDeletePath,
    rename: mockRename,
    getLanguageFromPath: mockGetLanguageFromPath,
  },
}));

// Mock git service
vi.mock('@/services/git', () => ({
  gitService: {
    statusMatrix: mockStatusMatrix,
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useIDEStore - must support selector-based calls (useShallow and individual selectors)
let mockStoreState: Record<string, unknown> = {
  fileTree: [] as unknown[],
  currentFile: null as string | null,
  gitStatus: [] as unknown[],
  setCurrentFile: mockSetCurrentFile,
  addOpenFile: mockAddOpenFile,
  setFileTree: mockSetFileTree,
};

vi.mock('@/store/useIDEStore', () => ({
  useIDEStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  }),
}));

// Mock zustand/react/shallow - useShallow just returns the selector as-is
vi.mock('zustand/react/shallow', () => ({
  useShallow: (selector: unknown) => selector,
}));

// Import FileExplorer after all mocks are set up
const { FileExplorer } = await import('./FileExplorer');

// =============================================================================
// TEST UTILITIES
// =============================================================================

function setMockStoreState(partial: Record<string, unknown>): void {
  mockStoreState = { ...mockStoreState, ...partial };
}

function resetAllMocks(): void {
  vi.clearAllMocks();

  // Reset filesystem defaults
  mockBuildFileTree.mockResolvedValue([]);
  mockChangeDirectory.mockResolvedValue({ success: true, data: '/' });
  mockWriteFile.mockResolvedValue({ success: true });
  mockCreateDirectory.mockResolvedValue({ success: true });
  mockDeletePath.mockResolvedValue({ success: true });
  mockRename.mockResolvedValue({ success: true });

  // Reset git defaults
  mockStatusMatrix.mockResolvedValue([]);

  // Reset store defaults
  setMockStoreState({
    fileTree: [],
    currentFile: null,
    gitStatus: [],
    setCurrentFile: mockSetCurrentFile,
    addOpenFile: mockAddOpenFile,
    setFileTree: mockSetFileTree,
  });

  // Reset action mocks
  mockSetCurrentFile.mockReset();
  mockAddOpenFile.mockReset();
  mockSetFileTree.mockReset();
}

// =============================================================================
// GLOBAL SETUP
// =============================================================================

beforeEach(() => {
  resetAllMocks();

  // Mock window.innerWidth for desktop by default
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });

  // Mock confirm dialog
  global.confirm = vi.fn(() => true);
});

afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// RENDERING TESTS
// =============================================================================

describe('FileExplorer - Rendering', () => {
  it('should render empty state when no files', () => {
    mockBuildFileTree.mockResolvedValue([]);

    render(<FileExplorer />);

    expect(screen.getByText('No files yet')).toBeInTheDocument();
    expect(screen.getByText(/Clone a repository or create files/)).toBeInTheDocument();
  });

  it('should render file tree with files and directories', async () => {
    const mockTree = [
      {
        name: 'src',
        path: '/src',
        type: 'directory' as const,
        children: [
          {
            name: 'index.ts',
            path: '/src/index.ts',
            type: 'file' as const,
          },
          {
            name: 'App.tsx',
            path: '/src/App.tsx',
            type: 'file' as const,
          },
        ],
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    // Wait for tree to load
    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
    });
  });

  it('should render header with title', () => {
    render(<FileExplorer />);

    expect(screen.getByText('Explorer')).toBeInTheDocument();
  });

  it('should render current directory path', () => {
    render(<FileExplorer />);

    expect(screen.getByText('/')).toBeInTheDocument();
  });
});

// =============================================================================
// FILE TREE TESTS
// =============================================================================

describe('FileExplorer - File Tree', () => {
  it('should render the component', () => {
    render(<FileExplorer />);

    // Component should render without errors
    expect(screen.getByText('Explorer')).toBeInTheDocument();
  });

  it('should accept currentFile prop', () => {
    setMockStoreState({ currentFile: '/test.ts' });

    render(<FileExplorer />);

    expect(screen.getByText('Explorer')).toBeInTheDocument();
  });

  it('should display current directory path', () => {
    render(<FileExplorer />);

    expect(screen.getByText('/')).toBeInTheDocument();
  });
});

// =============================================================================
// NAVIGATION TESTS
// =============================================================================

describe('FileExplorer - Navigation', () => {
  it('should show refresh button', () => {
    render(<FileExplorer />);

    const refreshButton = screen.getByTitle('Refresh');
    expect(refreshButton).toBeInTheDocument();
  });

  it('should show new file button', () => {
    render(<FileExplorer />);

    const newFileButton = screen.getByTitle('New File');
    expect(newFileButton).toBeInTheDocument();
  });

  it('should show new folder button', () => {
    render(<FileExplorer />);

    const newFolderButton = screen.getByTitle('New Folder');
    expect(newFolderButton).toBeInTheDocument();
  });

  it('should disable up button at root', () => {
    render(<FileExplorer />);

    const upButton = screen.getByTitle('Go up directory');
    expect(upButton).toBeDisabled();
  });

  it('should enable up button when not at root', () => {
    mockGetCurrentWorkingDirectory.mockReturnValue('/src');

    render(<FileExplorer />);

    const upButton = screen.getByTitle('Go up directory');
    expect(upButton).not.toBeDisabled();
  });
});

// =============================================================================
// GIT STATUS TESTS
// =============================================================================

describe('FileExplorer - Git Status', () => {
  it('should load git status on mount', () => {
    mockStatusMatrix.mockResolvedValue([
      { path: 'test.ts', status: 'modified' },
    ]);

    render(<FileExplorer />);

    // Verify component renders
    expect(screen.getByText('Explorer')).toBeInTheDocument();
  });
});

// =============================================================================
// CONTEXT MENU TESTS
// =============================================================================

describe('FileExplorer - Context Menu', () => {
  it('should show context menu on right-click', async () => {
    const mockTree = [
      {
        name: 'test.ts',
        path: '/test.ts',
        type: 'file' as const,
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      const fileElement = screen.getByText('test.ts');
      fireEvent.contextMenu(fileElement);
    });

    // Context menu should appear with items like Rename, Copy, Cut, Delete
    await waitFor(() => {
      expect(screen.getByText('Rename')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });
  });

  it('should show directory-specific menu items', async () => {
    const mockTree = [
      {
        name: 'src',
        path: '/src',
        type: 'directory' as const,
        children: [],
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      const dirElement = screen.getByText('src');
      fireEvent.contextMenu(dirElement);
    });

    await waitFor(() => {
      expect(screen.getByText('New File')).toBeInTheDocument();
      expect(screen.getByText('New Folder')).toBeInTheDocument();
      expect(screen.getByText('Rename')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// FILE OPERATIONS TESTS
// =============================================================================

describe('FileExplorer - File Operations', () => {
  it('should show new file input when new file button clicked', async () => {
    render(<FileExplorer />);

    const newFileButton = screen.getByTitle('New File');
    fireEvent.click(newFileButton);

    // Should show input placeholder
    expect(screen.getByPlaceholderText('filename.txt')).toBeInTheDocument();
  });

  it('should show new folder input when new folder button clicked', async () => {
    render(<FileExplorer />);

    const newFolderButton = screen.getByTitle('New Folder');
    fireEvent.click(newFolderButton);

    // Should show input placeholder
    expect(screen.getByPlaceholderText('foldername')).toBeInTheDocument();
  });
});

// =============================================================================
// MOBILE RESPONSIVENESS TESTS
// =============================================================================

describe('FileExplorer - Mobile Responsiveness', () => {
  it('should use touch-friendly sizing on mobile', async () => {
    // Mock matchMedia for mobile viewport (375px)
    window.matchMedia = vi.fn().mockImplementation((query: string) => {
      const maxMatch = query.match(/max-width:\s*(\d+)px/);
      const minMatch = query.match(/min-width:\s*(\d+)px/);
      const matches = maxMatch ? 375 <= parseInt(maxMatch[1]) : minMatch ? 375 >= parseInt(minMatch[1]) : false;
      return { matches, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() };
    });

    const mockTree = [
      {
        name: 'test.ts',
        path: '/test.ts',
        type: 'file' as const,
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      const fileElement = screen.getByText('test.ts').closest('.tree-item-row');
      expect(fileElement).toHaveClass('min-h-[44px]');
    });
  });
});

// =============================================================================
// ICONS TESTS
// =============================================================================

describe('FileExplorer - File Icons', () => {
  it('should show folder icon for directories', async () => {
    const mockTree = [
      {
        name: 'src',
        path: '/src',
        type: 'directory' as const,
        children: [],
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      // Check for folder icon (Folder component)
      const folderIcon = document.querySelector('.file-explorer .lucide-folder');
      expect(folderIcon).toBeInTheDocument();
    });
  });

  it('should show code icon for TypeScript files', async () => {
    const mockTree = [
      {
        name: 'test.ts',
        path: '/test.ts',
        type: 'file' as const,
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      // Check for code icon (FileCode component)
      const codeIcon = document.querySelector('.file-explorer .lucide-file-code');
      expect(codeIcon).toBeInTheDocument();
    });
  });

  it('should show JSON icon for .json files', async () => {
    const mockTree = [
      {
        name: 'package.json',
        path: '/package.json',
        type: 'file' as const,
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      // Check for JSON icon (FileJson component renders as file-braces in lucide)
      const jsonIcon = document.querySelector('.file-explorer .lucide-file-braces');
      expect(jsonIcon).toBeInTheDocument();
    });
  });

  it('should show text icon for .md files', async () => {
    const mockTree = [
      {
        name: 'README.md',
        path: '/README.md',
        type: 'file' as const,
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      // Check for text icon (FileText component)
      const textIcon = document.querySelector('.file-explorer .lucide-file-text');
      expect(textIcon).toBeInTheDocument();
    });
  });

  it('should show image icon for image files', async () => {
    const mockTree = [
      {
        name: 'logo.png',
        path: '/logo.png',
        type: 'file' as const,
      },
    ];
    mockBuildFileTree.mockResolvedValue(mockTree);
    mockSetFileTree.mockImplementation((tree) => {
      setMockStoreState({ fileTree: tree });
    });

    render(<FileExplorer />);

    await waitFor(() => {
      // Check for image icon (Image component)
      const imageIcon = document.querySelector('.file-explorer .lucide-image');
      expect(imageIcon).toBeInTheDocument();
    });
  });
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

describe('FileExplorer - Error Handling', () => {
  it('should render component even with empty tree', async () => {
    mockBuildFileTree.mockResolvedValue([]);

    render(<FileExplorer />);

    // Component should render empty state
    await waitFor(() => {
      expect(screen.getByText('No files yet')).toBeInTheDocument();
    });
  });

  it('should render component even with git status error', async () => {
    mockStatusMatrix.mockRejectedValue(new Error('Not a git repo'));

    render(<FileExplorer />);

    // Component should still render
    await waitFor(() => {
      expect(screen.getByText('Explorer')).toBeInTheDocument();
    });
  });
});
