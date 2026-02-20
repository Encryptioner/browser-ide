import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCallCard } from './ToolCallCard';
import { FileEditCard } from './FileEditCard';
import { CommandCard } from './CommandCard';
import { SearchCard } from './SearchCard';

const NOW = 1708444800000; // Fixed timestamp for testing

describe('ToolCallCard', () => {
  it('renders title and status', () => {
    render(
      <ToolCallCard title="Test action" icon="T" status="success" timestamp={NOW}>
        <p>Detail content</p>
      </ToolCallCard>
    );
    expect(screen.getByText('Test action')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows running spinner for running status', () => {
    render(
      <ToolCallCard title="Running action" icon="R" status="running" timestamp={NOW} />
    );
    expect(screen.getByText('Running...')).toBeInTheDocument();
  });

  it('shows error status', () => {
    render(
      <ToolCallCard title="Failed action" icon="E" status="error" timestamp={NOW} />
    );
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('expands and collapses on click', () => {
    render(
      <ToolCallCard title="Expandable" icon="X" status="success" timestamp={NOW}>
        <p>Hidden detail</p>
      </ToolCallCard>
    );
    // Initially collapsed - detail not visible
    expect(screen.queryByText('Hidden detail')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Hidden detail')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText('Hidden detail')).not.toBeInTheDocument();
  });

  it('renders expanded by default when defaultExpanded is true', () => {
    render(
      <ToolCallCard
        title="Pre-expanded"
        icon="P"
        status="success"
        timestamp={NOW}
        defaultExpanded
      >
        <p>Visible detail</p>
      </ToolCallCard>
    );
    expect(screen.getByText('Visible detail')).toBeInTheDocument();
  });
});

describe('FileEditCard', () => {
  it('renders file name and operation', () => {
    render(
      <FileEditCard
        fileName="src/App.tsx"
        operation="write"
        status="success"
        timestamp={NOW}
      />
    );
    expect(screen.getByText('Write: src/App.tsx')).toBeInTheDocument();
  });

  it('shows view diff button for write operations', () => {
    const onOpenDiff = vi.fn();
    render(
      <FileEditCard
        fileName="src/App.tsx"
        operation="write"
        status="success"
        timestamp={NOW}
        onOpenDiff={onOpenDiff}
      />
    );
    // Expand first
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByText('View diff'));
    expect(onOpenDiff).toHaveBeenCalled();
  });

  it('does not show view diff for read operations', () => {
    render(
      <FileEditCard
        fileName="src/App.tsx"
        operation="read"
        status="success"
        timestamp={NOW}
        onOpenDiff={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.queryByText('View diff')).not.toBeInTheDocument();
  });

  it('shows detail content when expanded', () => {
    render(
      <FileEditCard
        fileName="test.ts"
        operation="read"
        status="success"
        timestamp={NOW}
        detail="file contents here"
      />
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('file contents here')).toBeInTheDocument();
  });
});

describe('CommandCard', () => {
  it('renders command with dollar prefix', () => {
    render(
      <CommandCard command="npm install" status="success" timestamp={NOW} />
    );
    expect(screen.getByText('$ npm install')).toBeInTheDocument();
  });

  it('shows exit code when complete', () => {
    render(
      <CommandCard
        command="npm test"
        status="success"
        timestamp={NOW}
        output="All tests passed"
        exitCode={0}
      />
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('All tests passed')).toBeInTheDocument();
    expect(screen.getByText('exit 0')).toBeInTheDocument();
  });

  it('shows red exit code for non-zero', () => {
    render(
      <CommandCard
        command="npm test"
        status="error"
        timestamp={NOW}
        exitCode={1}
      />
    );
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const exitBadge = screen.getByText('exit 1');
    expect(exitBadge).toBeInTheDocument();
    expect(exitBadge.className).toContain('text-red-400');
  });
});

describe('SearchCard', () => {
  it('renders search query', () => {
    render(
      <SearchCard query="useState" status="success" timestamp={NOW} results={[]} />
    );
    expect(screen.getByText('Search: "useState"')).toBeInTheDocument();
  });

  it('shows no results message when expanded', () => {
    render(
      <SearchCard query="nonexistent" status="success" timestamp={NOW} results={[]} />
    );
    // Expand the card first
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('renders clickable results', () => {
    const onOpenFile = vi.fn();
    const results = [
      { file: 'src/App.tsx', line: 10, match: 'useState(' },
      { file: 'src/utils.ts', line: 5 },
    ];
    render(
      <SearchCard
        query="useState"
        status="success"
        timestamp={NOW}
        results={results}
        onOpenFile={onOpenFile}
      />
    );
    fireEvent.click(screen.getByText(/src\/App\.tsx/));
    expect(onOpenFile).toHaveBeenCalledWith('src/App.tsx', 10);
  });
});
