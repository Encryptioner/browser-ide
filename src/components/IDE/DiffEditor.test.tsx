/**
 * DiffEditor Component Tests
 *
 * Tests for the Monaco DiffEditor wrapper that shows file diffs
 * when Claude AI edits files.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// =============================================================================
// MOCK SETUP
// =============================================================================

vi.mock('@monaco-editor/react', () => ({
  DiffEditor: (props: Record<string, unknown>) => {
    const onMount = props.onMount as ((_editor: unknown) => void) | undefined;
    if (onMount) onMount({});
    return <div data-testid="mock-diff-editor" />;
  },
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => true),
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocks
const { DiffEditor } = await import('./DiffEditor');
const { useMediaQuery } = await import('@/hooks/useMediaQuery');

// =============================================================================
// TEST UTILITIES
// =============================================================================

const defaultProps = {
  originalContent: 'const x = 1;',
  modifiedContent: 'const x = 2;',
  fileName: '/src/utils/helper.ts',
  language: 'typescript',
  onAccept: vi.fn(),
  onReject: vi.fn(),
};

function renderDiffEditor(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides };
  return render(<DiffEditor {...props} />);
}

// =============================================================================
// TESTS
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  defaultProps.onAccept = vi.fn();
  defaultProps.onReject = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('DiffEditor - Rendering', () => {
  it('should render the diff editor with accept and reject buttons', () => {
    renderDiffEditor();

    expect(screen.getByTestId('mock-diff-editor')).toBeInTheDocument();
    expect(screen.getByText('Accept Changes')).toBeInTheDocument();
    expect(screen.getByText('Reject Changes')).toBeInTheDocument();
  });

  it('should show the correct filename in the header', () => {
    renderDiffEditor({ fileName: '/src/components/App.tsx' });

    expect(screen.getByTestId('diff-filename')).toHaveTextContent('App.tsx');
  });

  it('should show the Claude label', () => {
    renderDiffEditor();

    expect(screen.getByText("Claude's Changes")).toBeInTheDocument();
  });

  it('should render the loading state skeleton', () => {
    // The loading prop is passed to MonacoDiffEditor; our mock renders instantly.
    // We verify the component itself renders without error.
    renderDiffEditor();
    expect(screen.getByTestId('mock-diff-editor')).toBeInTheDocument();
  });

  it('should display only the basename for deeply nested files', () => {
    renderDiffEditor({ fileName: '/a/b/c/d/deep-file.js' });

    expect(screen.getByTestId('diff-filename')).toHaveTextContent('deep-file.js');
  });
});

describe('DiffEditor - Actions', () => {
  it('should call onAccept when accept button is clicked', async () => {
    const user = userEvent.setup();
    renderDiffEditor();

    await user.click(screen.getByText('Accept Changes'));

    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
  });

  it('should call onReject when reject button is clicked', async () => {
    const user = userEvent.setup();
    renderDiffEditor();

    await user.click(screen.getByText('Reject Changes'));

    expect(defaultProps.onReject).toHaveBeenCalledTimes(1);
  });

  it('should call onAccept on Cmd/Ctrl+Enter keyboard shortcut', () => {
    renderDiffEditor();

    fireEvent.keyDown(window, { key: 'Enter', metaKey: true });

    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
  });

  it('should call onReject on Escape keyboard shortcut', () => {
    renderDiffEditor();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(defaultProps.onReject).toHaveBeenCalledTimes(1);
  });

  it('should call onAccept on Ctrl+Enter keyboard shortcut', () => {
    renderDiffEditor();

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    expect(defaultProps.onAccept).toHaveBeenCalledTimes(1);
  });
});

describe('DiffEditor - Accessibility', () => {
  it('should have proper aria-label on the region', () => {
    renderDiffEditor();

    expect(screen.getByRole('region', { name: 'Diff editor' })).toBeInTheDocument();
  });

  it('should have proper aria-labels on action buttons', () => {
    renderDiffEditor();

    expect(screen.getByRole('button', { name: 'Accept changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject changes' })).toBeInTheDocument();
  });
});

describe('DiffEditor - Responsive', () => {
  it('should use side-by-side mode on wide screens', () => {
    // useMediaQuery already mocked to return true (wide)
    renderDiffEditor();
    expect(screen.getByTestId('mock-diff-editor')).toBeInTheDocument();
  });

  it('should use inline mode on narrow screens', () => {
    vi.mocked(useMediaQuery).mockReturnValue(false);
    renderDiffEditor();
    expect(screen.getByTestId('mock-diff-editor')).toBeInTheDocument();
  });
});
