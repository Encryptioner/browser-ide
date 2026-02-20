import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomTabBar } from './BottomTabBar';
import type { TabItem } from './BottomTabBar';

const TABS: TabItem[] = [
  { id: 'terminal-tabs', label: 'Terminal', shortLabel: 'Term', icon: '💻' },
  { id: 'preview', label: 'Preview', shortLabel: 'View', icon: '👁️' },
  { id: 'claude-code', label: 'Claude', shortLabel: 'AI', icon: '🧠' },
  { id: 'git', label: 'Git', shortLabel: 'Git', icon: '🔀' },
  { id: 'help', label: 'Help', shortLabel: 'Help', icon: '📚' },
];

describe('BottomTabBar - Rendering', () => {
  it('renders all tabs', () => {
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(5);
  });

  it('marks the active tab as selected', () => {
    render(<BottomTabBar tabs={TABS} activeTab="claude-code" onTabChange={() => {}} />);
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab).toHaveTextContent('Claude');
  });

  it('renders dots indicator', () => {
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={() => {}} />);
    expect(screen.getByTestId('tab-dots')).toBeInTheDocument();
    expect(screen.getByTestId('tab-dots').children).toHaveLength(5);
  });

  it('does not render when tabs array is empty', () => {
    const { container } = render(
      <BottomTabBar tabs={[]} activeTab="" onTabChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render dots for a single tab', () => {
    render(
      <BottomTabBar
        tabs={[TABS[0]]}
        activeTab="terminal-tabs"
        onTabChange={() => {}}
      />,
    );
    expect(screen.queryByTestId('tab-dots')).not.toBeInTheDocument();
  });
});

describe('BottomTabBar - Click', () => {
  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Preview/i }));
    expect(onTabChange).toHaveBeenCalledWith('preview');
  });

  it('does not call onTabChange when disabled', () => {
    const onTabChange = vi.fn();
    render(
      <BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} disabled />,
    );
    fireEvent.click(screen.getByRole('tab', { name: /Preview/i }));
    expect(onTabChange).not.toHaveBeenCalled();
  });
});

describe('BottomTabBar - Keyboard Navigation', () => {
  it('navigates right with ArrowRight', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(onTabChange).toHaveBeenCalledWith('preview');
  });

  it('navigates left with ArrowLeft', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="preview" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(onTabChange).toHaveBeenCalledWith('terminal-tabs');
  });

  it('jumps to first tab with Home', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="help" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'Home' });
    expect(onTabChange).toHaveBeenCalledWith('terminal-tabs');
  });

  it('jumps to last tab with End', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'End' });
    expect(onTabChange).toHaveBeenCalledWith('help');
  });

  it('does not go past the first tab', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('does not go past the last tab', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="help" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });
    expect(onTabChange).not.toHaveBeenCalled();
  });
});

describe('BottomTabBar - Swipe Gestures', () => {
  const swipe = (element: HTMLElement, startX: number, endX: number) => {
    fireEvent.touchStart(element, {
      touches: [{ clientX: startX, clientY: 200 }],
    });
    fireEvent.touchEnd(element, {
      changedTouches: [{ clientX: endX, clientY: 200 }],
    });
  };

  it('swipe left goes to next tab', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    swipe(tablist, 300, 200); // left swipe (dx = -100)
    expect(onTabChange).toHaveBeenCalledWith('preview');
  });

  it('swipe right goes to previous tab', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="preview" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    swipe(tablist, 200, 300); // right swipe (dx = +100)
    expect(onTabChange).toHaveBeenCalledWith('terminal-tabs');
  });

  it('ignores short swipes below threshold', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    swipe(tablist, 300, 280); // only 20px, below 50px threshold
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('ignores vertical swipes', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    fireEvent.touchStart(tablist, {
      touches: [{ clientX: 200, clientY: 200 }],
    });
    fireEvent.touchEnd(tablist, {
      changedTouches: [{ clientX: 200, clientY: 50 }], // vertical swipe
    });
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('does not swipe when disabled', () => {
    const onTabChange = vi.fn();
    render(
      <BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} disabled />,
    );
    const tablist = screen.getByRole('tablist');
    swipe(tablist, 300, 200);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('does not swipe left past last tab', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="help" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    swipe(tablist, 300, 200);
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it('does not swipe right past first tab', () => {
    const onTabChange = vi.fn();
    render(<BottomTabBar tabs={TABS} activeTab="terminal-tabs" onTabChange={onTabChange} />);
    const tablist = screen.getByRole('tablist');
    swipe(tablist, 200, 300);
    expect(onTabChange).not.toHaveBeenCalled();
  });
});
