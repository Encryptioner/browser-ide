/**
 * ClaudeTerminal Component Tests
 *
 * Tests for the read-only terminal-like output panel that displays
 * Claude AI agent activity with timestamped log entries.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

// Mock logger to avoid side effects
vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
const { ClaudeTerminal } = await import('./ClaudeTerminal');
type ClaudeTerminalEntry = import('./ClaudeTerminal').ClaudeTerminalEntry;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<ClaudeTerminalEntry> = {}): ClaudeTerminalEntry {
  return {
    id: 'entry-1',
    timestamp: new Date('2026-02-20T14:30:45').getTime(),
    type: 'info',
    title: 'Test entry',
    status: 'success',
    ...overrides,
  };
}

function makeEntries(count: number): ClaudeTerminalEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `entry-${i}`,
    timestamp: new Date('2026-02-20T14:30:45').getTime() + i * 1000,
    type: 'info' as const,
    title: `Entry ${i}`,
    status: 'success' as const,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ClaudeTerminal - Empty State', () => {
  it('should render empty state when no entries are provided', () => {
    render(<ClaudeTerminal entries={[]} isAgentRunning={false} />);

    expect(
      screen.getByText('No agent activity yet. Start a task in agent mode.'),
    ).toBeInTheDocument();
  });

  it('should show 0 entries count in header', () => {
    render(<ClaudeTerminal entries={[]} isAgentRunning={false} />);

    expect(screen.getByTestId('entry-count')).toHaveTextContent('0 entries');
  });
});

describe('ClaudeTerminal - Entry Rendering', () => {
  it('should render entries with correct HH:MM:SS timestamps', () => {
    const entry = makeEntry({
      timestamp: new Date('2026-02-20T09:05:03').getTime(),
    });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    expect(screen.getByTestId('entry-timestamp')).toHaveTextContent('[09:05:03]');
  });

  it('should render entry title', () => {
    const entry = makeEntry({ title: 'Reading file: src/App.tsx' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    expect(screen.getByText('Reading file: src/App.tsx')).toBeInTheDocument();
  });

  it('should show correct entry count for multiple entries', () => {
    const entries = makeEntries(5);

    render(<ClaudeTerminal entries={entries} isAgentRunning={false} />);

    expect(screen.getByTestId('entry-count')).toHaveTextContent('5 entries');
  });

  it('should show singular "entry" for one entry', () => {
    render(<ClaudeTerminal entries={[makeEntry()]} isAgentRunning={false} />);

    expect(screen.getByTestId('entry-count')).toHaveTextContent('1 entry');
  });
});

describe('ClaudeTerminal - Running Indicator', () => {
  it('should show pulsing dot when isAgentRunning is true', () => {
    render(<ClaudeTerminal entries={[]} isAgentRunning={true} />);

    const indicator = screen.getByTestId('agent-running-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('animate-pulse');
  });

  it('should NOT show pulsing dot when isAgentRunning is false', () => {
    render(<ClaudeTerminal entries={[]} isAgentRunning={false} />);

    expect(screen.queryByTestId('agent-running-indicator')).not.toBeInTheDocument();
  });
});

describe('ClaudeTerminal - Auto-scroll', () => {
  it('should call scrollIntoView when entries change', () => {
    const scrollIntoViewMock = vi.fn();
    // Mock Element.prototype.scrollIntoView since happy-dom may not implement it
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const entries = makeEntries(3);
    const { rerender } = render(
      <ClaudeTerminal entries={entries} isAgentRunning={false} />,
    );

    scrollIntoViewMock.mockClear();

    const moreEntries = [...entries, makeEntry({ id: 'new-entry', title: 'New entry' })];
    rerender(<ClaudeTerminal entries={moreEntries} isAgentRunning={false} />);

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });
});

describe('ClaudeTerminal - Expand / Collapse Detail', () => {
  it('should not show detail by default', () => {
    const entry = makeEntry({ detail: 'Some detail content' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    expect(screen.queryByTestId('entry-detail')).not.toBeInTheDocument();
  });

  it('should expand detail on click', () => {
    const entry = makeEntry({ detail: 'Some detail content' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    const entryRow = screen.getByTestId('claude-terminal-entry');
    const button = within(entryRow).getByRole('button');
    fireEvent.click(button);

    expect(screen.getByTestId('entry-detail')).toHaveTextContent('Some detail content');
  });

  it('should collapse detail on second click', () => {
    const entry = makeEntry({ detail: 'Some detail content' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    const entryRow = screen.getByTestId('claude-terminal-entry');
    const button = within(entryRow).getByRole('button');

    // Expand
    fireEvent.click(button);
    expect(screen.getByTestId('entry-detail')).toBeInTheDocument();

    // Collapse
    fireEvent.click(button);
    expect(screen.queryByTestId('entry-detail')).not.toBeInTheDocument();
  });

  it('should not expand when entry has no detail', () => {
    const entry = makeEntry({ detail: undefined });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    const entryRow = screen.getByTestId('claude-terminal-entry');
    const button = within(entryRow).getByRole('button');
    fireEvent.click(button);

    expect(screen.queryByTestId('entry-detail')).not.toBeInTheDocument();
  });
});

describe('ClaudeTerminal - Clear Button', () => {
  it('should call onClear when clear button is clicked', () => {
    const onClear = vi.fn();

    render(<ClaudeTerminal entries={makeEntries(3)} isAgentRunning={false} onClear={onClear} />);

    const clearBtn = screen.getByTestId('clear-button');
    fireEvent.click(clearBtn);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should not render clear button when onClear is not provided', () => {
    render(<ClaudeTerminal entries={[]} isAgentRunning={false} />);

    expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
  });
});

describe('ClaudeTerminal - Entry Type Icons and Colors', () => {
  const typeCases: Array<{
    type: ClaudeTerminalEntry['type'];
    expectedColor: string;
  }> = [
    { type: 'file_read', expectedColor: 'text-blue-400' },
    { type: 'file_write', expectedColor: 'text-green-400' },
    { type: 'file_edit', expectedColor: 'text-yellow-400' },
    { type: 'command', expectedColor: 'text-purple-400' },
    { type: 'search', expectedColor: 'text-cyan-400' },
    { type: 'git', expectedColor: 'text-orange-400' },
    { type: 'info', expectedColor: 'text-gray-400' },
    { type: 'error', expectedColor: 'text-red-400' },
  ];

  it.each(typeCases)(
    'should render $type entry with $expectedColor color class',
    ({ type, expectedColor }) => {
      const entry = makeEntry({ id: `entry-${type}`, type });

      render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

      const icon = screen.getByTestId('entry-icon');
      expect(icon).toHaveClass(expectedColor);
    },
  );
});

describe('ClaudeTerminal - Status Indicators', () => {
  it('should show spinning loader for running status', () => {
    const entry = makeEntry({ status: 'running' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    const statusEl = screen.getByTestId('entry-status');
    const spinner = within(statusEl).getByLabelText('running');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should show checkmark for success status', () => {
    const entry = makeEntry({ status: 'success' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    const statusEl = screen.getByTestId('entry-status');
    expect(within(statusEl).getByLabelText('success')).toBeInTheDocument();
  });

  it('should show X for error status', () => {
    const entry = makeEntry({ status: 'error' });

    render(<ClaudeTerminal entries={[entry]} isAgentRunning={false} />);

    const statusEl = screen.getByTestId('entry-status');
    expect(within(statusEl).getByLabelText('error')).toBeInTheDocument();
  });
});
