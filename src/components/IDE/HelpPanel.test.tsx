import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpPanel } from './HelpPanel';

// Mock the store
vi.mock('@/store/useIDEStore', () => ({
  useIDEStore: (selector: (_s: Record<string, unknown>) => unknown) =>
    selector({ helpOpen: true, toggleHelp: vi.fn() }),
}));

// Mock useMediaQuery
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

describe('HelpPanel - Rendering', () => {
  it('renders the help panel with sidebar and search', () => {
    render(<HelpPanel />);
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search documentation...')).toBeInTheDocument();
  });

  it('renders all four category names in sidebar', () => {
    render(<HelpPanel />);
    const nav = screen.getByRole('navigation', { name: 'Documentation sections' });
    expect(nav).toHaveTextContent('Getting Started');
    expect(nav).toHaveTextContent('Quick Reference');
    expect(nav).toHaveTextContent('Features');
    expect(nav).toHaveTextContent('Advanced');
  });

  it('defaults to Getting Started section content', () => {
    render(<HelpPanel />);
    expect(screen.getByText(/Browser IDE is a full-featured code editor/)).toBeInTheDocument();
    expect(screen.getByText('First-Time Setup')).toBeInTheDocument();
  });
});

describe('HelpPanel - Navigation', () => {
  it('switches to Keyboard Shortcuts section', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Quick Reference'));
    fireEvent.click(screen.getByText('Keyboard Shortcuts'));
    expect(screen.getByRole('heading', { level: 1, name: 'Keyboard Shortcuts' })).toBeInTheDocument();
    // Should show shortcut tables
    expect(screen.getByText('Toggle sidebar')).toBeInTheDocument();
  });

  it('switches to Terminal section', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Features'));
    // Click the Terminal nav button inside the sidebar nav
    const nav = screen.getByRole('navigation');
    const terminalBtn = Array.from(nav.querySelectorAll('button')).find(
      b => b.textContent?.trim() === 'Terminal'
    )!;
    fireEvent.click(terminalBtn);
    expect(screen.getByText('Available Commands')).toBeInTheDocument();
  });

  it('switches to Troubleshooting section', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByText('Troubleshooting'));
    expect(screen.getByText('WebContainer Not Loading')).toBeInTheDocument();
    expect(screen.getByText('API Key Errors')).toBeInTheDocument();
  });

  it('switches to Git Integration section', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Features'));
    fireEvent.click(screen.getByText('Git Integration'));
    expect(screen.getByText('Staging & Committing')).toBeInTheDocument();
    expect(screen.getByText('Branch Management')).toBeInTheDocument();
  });
});

describe('HelpPanel - Search', () => {
  it('filters to show matching sections when searching', () => {
    render(<HelpPanel />);
    const searchInput = screen.getByPlaceholderText('Search documentation...');
    fireEvent.change(searchInput, { target: { value: 'git' } });
    // Features category should be visible with Git Integration section expanded
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Git Integration')).toBeInTheDocument();
  });

  it('hides all categories when no match', () => {
    render(<HelpPanel />);
    const searchInput = screen.getByPlaceholderText('Search documentation...');
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } });
    const nav = screen.getByRole('navigation', { name: 'Documentation sections' });
    expect(nav.children).toHaveLength(0);
  });

  it('searches against searchText field for deep matching', () => {
    render(<HelpPanel />);
    const searchInput = screen.getByPlaceholderText('Search documentation...');
    // "isomorphic" is in Git's searchText but not in the title or description
    fireEvent.change(searchInput, { target: { value: 'isomorphic' } });
    expect(screen.getByText('Git Integration')).toBeInTheDocument();
  });
});

describe('HelpPanel - Content Sections', () => {
  it('renders Editor content with shortcuts table', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Features'));
    // Find the Editor section button inside the nav (not the category)
    const nav = screen.getByRole('navigation');
    const buttons = Array.from(nav.querySelectorAll('button'));
    // The Editor section button is the one with "Editor" that is NOT the "Features" category button
    const editorBtn = buttons.find(
      b => b.textContent?.trim() === 'Editor' && !b.classList.contains('font-medium')
    );
    expect(editorBtn).toBeTruthy();
    fireEvent.click(editorBtn!);
    expect(screen.getByText('Multi-Tab Editing')).toBeInTheDocument();
    expect(screen.getByText('Save current file')).toBeInTheDocument();
  });

  it('renders AI Assistant content with tool descriptions', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Features'));
    fireEvent.click(screen.getByText('AI Assistant'));
    expect(screen.getByText('Setting Up API Keys')).toBeInTheDocument();
    expect(screen.getByText('Agent Mode')).toBeInTheDocument();
    expect(screen.getByText(/Read File/)).toBeInTheDocument();
  });

  it('renders Offline Mode content', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Advanced'));
    fireEvent.click(screen.getByText('Offline Mode'));
    expect(screen.getByText('Works Offline')).toBeInTheDocument();
    expect(screen.getByText('Requires Internet')).toBeInTheDocument();
  });

  it('renders File Explorer content', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Features'));
    fireEvent.click(screen.getByText('File Explorer'));
    expect(screen.getByText(/Creating Files & Folders/)).toBeInTheDocument();
    expect(screen.getByText(/Renaming & Deleting/)).toBeInTheDocument();
  });

  it('renders Project Management content', () => {
    render(<HelpPanel />);
    fireEvent.click(screen.getByText('Features'));
    fireEvent.click(screen.getByText('Project Management'));
    expect(screen.getByText('Switching Projects')).toBeInTheDocument();
    expect(screen.getByText('Export & Import')).toBeInTheDocument();
  });
});

describe('HelpPanel - Close button', () => {
  it('renders close button with accessible label', () => {
    render(<HelpPanel />);
    expect(screen.getByLabelText('Close help')).toBeInTheDocument();
  });
});
