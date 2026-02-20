import { useState, useMemo, type ReactNode } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  BookOpen, Code, Terminal, GitBranch, Zap, Layers, X, ChevronLeft, Menu,
  Keyboard, Command, Rocket, FolderTree, Bot, FolderKanban, Wifi, Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocSection {
  id: string;
  title: string;
  description: string;
  searchText: string;
  icon: ReactNode;
  content: ReactNode;
}

interface DocCategory {
  id: string;
  name: string;
  icon: ReactNode;
  sections: DocSection[];
}

// ---------------------------------------------------------------------------
// Reusable doc primitives
// ---------------------------------------------------------------------------

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 text-xs font-mono bg-gray-700 border border-gray-600 rounded">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <tr className="border-b border-gray-800">
      <td className="py-2 pr-4"><Kbd>{keys}</Kbd></td>
      <td className="py-2 text-gray-300">{desc}</td>
    </tr>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-blue-400 mt-6 mb-2">{children}</h3>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>;
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-900/30 border border-blue-800 rounded p-3 mb-3 text-sm text-blue-200">
      <span className="shrink-0">Tip:</span>
      <span>{children}</span>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-800 rounded p-3 mb-3 text-sm overflow-x-auto font-mono text-gray-200">
      {children}
    </pre>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 mb-3 text-gray-300 text-sm">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Section content
// ---------------------------------------------------------------------------

const GETTING_STARTED_CONTENT = (
  <div>
    <Paragraph>
      Browser IDE is a full-featured code editor that runs entirely in your browser.
      No installation required — everything from file editing to running a terminal
      happens client-side using WebContainers.
    </Paragraph>

    <SectionHeading>First-Time Setup</SectionHeading>
    <BulletList items={[
      'Open the IDE — it loads instantly in any modern browser (Chrome, Edge, Firefox, Safari).',
      'The file explorer appears on the left. Click "Clone Repository" to pull a GitHub repo, or create files directly.',
      'Your files are stored in the browser\'s IndexedDB. They persist across sessions but are local to this browser.',
    ]} />

    <SectionHeading>Creating a Project</SectionHeading>
    <Paragraph>
      Use the file explorer context menu (right-click) to create new files and folders.
      Alternatively, open the Command Palette with <Kbd>Ctrl+Shift+P</Kbd> and type
      &quot;New File&quot;.
    </Paragraph>

    <SectionHeading>Cloning a Repository</SectionHeading>
    <Paragraph>
      Click the &quot;Clone&quot; button in the sidebar or use the Command Palette. Enter a
      GitHub HTTPS URL (e.g. <code className="text-blue-300">https://github.com/user/repo</code>).
      The repository will be cloned into the browser&apos;s virtual file system.
    </Paragraph>
    <Tip>
      For private repos, configure a GitHub token in Settings first.
    </Tip>

    <SectionHeading>Opening Files</SectionHeading>
    <Paragraph>
      Click any file in the explorer to open it in the editor. Multiple files open as tabs.
      Use <Kbd>Ctrl+P</Kbd> to toggle the preview or <Kbd>Ctrl+W</Kbd> to close the current tab.
    </Paragraph>
  </div>
);

const FILE_EXPLORER_CONTENT = (
  <div>
    <Paragraph>
      The file explorer on the left side shows your project&apos;s directory tree. It supports
      all standard file management operations.
    </Paragraph>

    <SectionHeading>Creating Files &amp; Folders</SectionHeading>
    <BulletList items={[
      'Right-click in the explorer to see the context menu.',
      'Select "New File" or "New Folder" and type a name.',
      'Press Enter to confirm or Escape to cancel.',
    ]} />

    <SectionHeading>Renaming &amp; Deleting</SectionHeading>
    <BulletList items={[
      'Right-click a file or folder and choose "Rename" or "Delete".',
      'Renaming is inline — type the new name and press Enter.',
      'Deleting a folder removes all its contents recursively.',
    ]} />

    <SectionHeading>File Icons</SectionHeading>
    <Paragraph>
      Files display language-appropriate icons based on their extension (.ts, .tsx, .json, .md, etc.).
      Folders can be expanded and collapsed by clicking the arrow.
    </Paragraph>

    <SectionHeading>Modified File Indicators</SectionHeading>
    <Paragraph>
      Files with unsaved changes show a dot indicator on their editor tab. Save with <Kbd>Ctrl+S</Kbd>.
    </Paragraph>
  </div>
);

const EDITOR_CONTENT = (
  <div>
    <Paragraph>
      The editor is powered by Monaco (the same engine as VS Code) and supports syntax highlighting
      for 50+ languages, IntelliSense, bracket matching, and more.
    </Paragraph>

    <SectionHeading>Multi-Tab Editing</SectionHeading>
    <BulletList items={[
      'Click files in the explorer to open them as tabs.',
      'Ctrl+W closes the current tab.',
      'Unsaved files show a dot indicator on the tab.',
      'Tabs can be reordered by the order you open them.',
    ]} />

    <SectionHeading>Syntax Highlighting</SectionHeading>
    <Paragraph>
      Monaco auto-detects the language from the file extension. Supported languages include
      TypeScript, JavaScript, HTML, CSS, JSON, Markdown, Python, Rust, Go, and many more.
    </Paragraph>

    <SectionHeading>IntelliSense &amp; Autocomplete</SectionHeading>
    <Paragraph>
      Type to see contextual suggestions. The IDE provides keyword completion, snippet expansion,
      and basic type-aware suggestions for JavaScript and TypeScript files.
    </Paragraph>

    <SectionHeading>Split Editor</SectionHeading>
    <Paragraph>
      Open the same file or different files side-by-side using the split editor feature.
      Access it through the Command Palette.
    </Paragraph>

    <SectionHeading>Editor Shortcuts</SectionHeading>
    <table className="w-full text-sm mb-3">
      <tbody>
        <ShortcutRow keys="Ctrl+S" desc="Save current file" />
        <ShortcutRow keys="Ctrl+F" desc="Find in file" />
        <ShortcutRow keys="Ctrl+H" desc="Find and replace" />
        <ShortcutRow keys="Shift+Alt+F" desc="Format document" />
        <ShortcutRow keys="Ctrl+/" desc="Toggle line comment" />
        <ShortcutRow keys="Alt+Up/Down" desc="Move line up/down" />
        <ShortcutRow keys="Ctrl+D" desc="Select next occurrence" />
        <ShortcutRow keys="Ctrl+Shift+K" desc="Delete line" />
      </tbody>
    </table>
  </div>
);

const TERMINAL_CONTENT = (
  <div>
    <Paragraph>
      The integrated terminal runs inside a WebContainer — a full Node.js environment in
      your browser. No server required.
    </Paragraph>

    <SectionHeading>Opening the Terminal</SectionHeading>
    <Paragraph>
      Toggle the terminal with <Kbd>Ctrl+`</Kbd> or via the Command Palette. The terminal
      panel appears at the bottom of the IDE. You can maximize it with <Kbd>Ctrl+Shift+M</Kbd>.
    </Paragraph>

    <SectionHeading>Available Commands</SectionHeading>
    <Paragraph>
      The following commands are available in the WebContainer environment:
    </Paragraph>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-3 text-sm">
      {[
        'Node.js: node, npm, npx, pnpm, yarn, bun',
        'Python: python, python3, pip, pip3',
        'Git: git (all subcommands)',
        'Shell: ls, cd, pwd, cat, echo, mkdir, rm, touch, cp, mv',
        'Search: grep, find, wc, sort, uniq, xargs',
        'Network: curl, wget',
        'Archives: tar, zip, unzip',
        'Editors: nano, vim',
        'Build: make, cmake, cargo, go, javac',
      ].map((group, i) => (
        <div key={i} className="bg-gray-800 rounded p-2 text-gray-300">{group}</div>
      ))}
    </div>

    <SectionHeading>Terminal Tabs</SectionHeading>
    <Paragraph>
      You can open multiple terminal sessions simultaneously. Each tab runs an independent
      shell process. Use the + button to create a new tab, or the x button to close one.
    </Paragraph>

    <SectionHeading>WebContainer Limitations</SectionHeading>
    <BulletList items={[
      'No native binary execution — only JavaScript/TypeScript runtimes and WASM.',
      'No Docker or containerized environments.',
      'Network requests from the terminal go through a service worker proxy.',
      'File system is in-memory (backed by IndexedDB) — very large repos may hit memory limits.',
    ]} />

    <Tip>
      Use <Kbd>Ctrl+C</Kbd> to interrupt a running process and <Kbd>Ctrl+L</Kbd> to clear the terminal.
    </Tip>
  </div>
);

const GIT_CONTENT = (
  <div>
    <Paragraph>
      Git integration uses <code className="text-blue-300">isomorphic-git</code> — a pure
      JavaScript Git implementation that runs in the browser. All operations happen locally
      unless you push/pull to a remote.
    </Paragraph>

    <SectionHeading>Cloning a Repository</SectionHeading>
    <Paragraph>
      Click &quot;Clone Repository&quot; in the file explorer or use the Command Palette.
      Provide an HTTPS URL. For private repos, set your GitHub token in Settings first.
    </Paragraph>

    <SectionHeading>Staging &amp; Committing</SectionHeading>
    <BulletList items={[
      'Open the Git panel with Ctrl+Shift+G.',
      'Changed files appear in the "Changes" list.',
      'Click the + icon next to a file to stage it, or use Ctrl+Shift+A to stage all.',
      'Type a commit message and press Ctrl+Enter to commit.',
    ]} />

    <SectionHeading>Pushing &amp; Pulling</SectionHeading>
    <Paragraph>
      Push and pull operations require a GitHub personal access token configured in Settings.
      Use <Kbd>Ctrl+K Ctrl+P</Kbd> to push, or find push/pull commands in the Command Palette.
    </Paragraph>
    <Tip>
      A CORS proxy is used for remote Git operations. If you encounter network errors, check your
      browser&apos;s console for CORS-related issues.
    </Tip>

    <SectionHeading>Branch Management</SectionHeading>
    <BulletList items={[
      'View branches in the Git panel\'s "Branches" tab (Ctrl+3 in the Git panel).',
      'Create new branches, switch between them, and delete merged branches.',
      'The current branch name is shown in the status bar at the bottom.',
    ]} />

    <SectionHeading>Viewing History</SectionHeading>
    <Paragraph>
      The &quot;History&quot; tab in the Git panel shows the commit log with messages,
      authors, and timestamps. Click a commit to view its details.
    </Paragraph>

    <SectionHeading>Git Panel Shortcuts</SectionHeading>
    <table className="w-full text-sm mb-3">
      <tbody>
        <ShortcutRow keys="Ctrl+Shift+G" desc="Open Git panel" />
        <ShortcutRow keys="Ctrl+Enter" desc="Commit staged changes" />
        <ShortcutRow keys="Ctrl+Shift+A" desc="Stage all changes" />
        <ShortcutRow keys="Ctrl+Shift+U" desc="Unstage all changes" />
        <ShortcutRow keys="Ctrl+R" desc="Refresh Git status" />
        <ShortcutRow keys="Ctrl+1 / 2 / 3 / 4" desc="Switch Git panel tabs" />
      </tbody>
    </table>
  </div>
);

const AI_ASSISTANT_CONTENT = (
  <div>
    <Paragraph>
      The AI Assistant provides an integrated chat interface and an agentic coding mode
      powered by Claude, OpenAI, or other LLM providers.
    </Paragraph>

    <SectionHeading>Setting Up API Keys</SectionHeading>
    <BulletList items={[
      'Open Settings (gear icon or Command Palette).',
      'Navigate to the AI section.',
      'Enter your API key for your preferred provider (Anthropic, OpenAI, etc.).',
      'Select a default model.',
    ]} />
    <Tip>
      API keys are stored locally in your browser&apos;s IndexedDB, encrypted using the Web Crypto API.
      They are never sent to any server other than the provider&apos;s API endpoint.
    </Tip>

    <SectionHeading>Chat Mode</SectionHeading>
    <Paragraph>
      Open the AI panel from the bottom tab bar (the &quot;Claude&quot; or &quot;AI&quot; tab).
      Type a message and press <Kbd>Ctrl+Enter</Kbd> to send. The assistant can answer questions
      about your code, explain concepts, or help debug issues.
    </Paragraph>

    <SectionHeading>Agent Mode</SectionHeading>
    <Paragraph>
      Agent mode allows the AI to autonomously edit files, run terminal commands, and manage
      your project. The agent has access to 7 tools:
    </Paragraph>
    <BulletList items={[
      'Read File — reads any file in the project',
      'Write File — creates or overwrites files',
      'Edit File — makes targeted edits to existing files',
      'List Directory — explores the file tree',
      'Run Command — executes terminal commands',
      'Search Files — searches across files by content',
      'Git Operations — commits, branches, and status checks',
    ]} />
    <Paragraph>
      Each tool call is displayed as an interactive card. You can review, accept, or reject
      changes before they&apos;re applied.
    </Paragraph>

    <SectionHeading>Claude Terminal</SectionHeading>
    <Paragraph>
      The dedicated Claude terminal tab provides a CLI-style interface for more direct
      interaction with the AI agent. It shows streaming output in real-time.
    </Paragraph>
  </div>
);

const PROJECT_MANAGEMENT_CONTENT = (
  <div>
    <Paragraph>
      Browser IDE supports multiple projects stored locally in your browser.
    </Paragraph>

    <SectionHeading>Creating Projects</SectionHeading>
    <BulletList items={[
      'Clone a repository to start a new project.',
      'Or create files directly — any files in the workspace form a project.',
      'Projects are automatically saved to IndexedDB.',
    ]} />

    <SectionHeading>Switching Projects</SectionHeading>
    <Paragraph>
      Use the Workspace Switcher to browse and switch between your saved projects.
      Each project remembers its open files, active tab, and terminal state.
    </Paragraph>

    <SectionHeading>Project Settings</SectionHeading>
    <Paragraph>
      Open Settings to configure editor preferences (theme, font size, tab size),
      Git settings (username, email, default branch), and AI provider configuration.
      Settings apply globally across all projects.
    </Paragraph>

    <SectionHeading>Export &amp; Import</SectionHeading>
    <BulletList items={[
      'Use "Export Project" from the Command Palette to download your project as a zip file.',
      'Use "Import Project" to restore from a previously exported file.',
      'Exports include all files, settings, and project metadata.',
    ]} />

    <SectionHeading>Storage</SectionHeading>
    <Paragraph>
      All data is stored in IndexedDB via the Dexie library. Storage limits depend on your
      browser (typically 50MB–unlimited). Check the status bar for current storage usage.
    </Paragraph>
  </div>
);

const KEYBOARD_SHORTCUTS_CONTENT = (
  <div>
    <Paragraph>
      All keyboard shortcuts follow VS Code conventions. On macOS, <Kbd>Ctrl</Kbd> is
      replaced by <Kbd>Cmd</Kbd>.
    </Paragraph>

    <SectionHeading>General</SectionHeading>
    <table className="w-full text-sm mb-4">
      <tbody>
        <ShortcutRow keys="Ctrl+Shift+P" desc="Open Command Palette" />
        <ShortcutRow keys="Ctrl+B" desc="Toggle sidebar" />
        <ShortcutRow keys="Ctrl+`" desc="Toggle terminal" />
        <ShortcutRow keys="Ctrl+P" desc="Toggle preview" />
        <ShortcutRow keys="Ctrl+Shift+M" desc="Maximize/restore terminal" />
        <ShortcutRow keys="Escape" desc="Close dialog / restore terminal" />
      </tbody>
    </table>

    <SectionHeading>File Operations</SectionHeading>
    <table className="w-full text-sm mb-4">
      <tbody>
        <ShortcutRow keys="Ctrl+N" desc="New file" />
        <ShortcutRow keys="Ctrl+S" desc="Save file" />
        <ShortcutRow keys="Ctrl+W" desc="Close current tab" />
      </tbody>
    </table>

    <SectionHeading>Editor</SectionHeading>
    <table className="w-full text-sm mb-4">
      <tbody>
        <ShortcutRow keys="Ctrl+F" desc="Find in file" />
        <ShortcutRow keys="Ctrl+H" desc="Find and replace" />
        <ShortcutRow keys="Ctrl+Shift+F" desc="Search across all files" />
        <ShortcutRow keys="Shift+Alt+F" desc="Format document" />
        <ShortcutRow keys="Ctrl+/" desc="Toggle line comment" />
        <ShortcutRow keys="Alt+Up/Down" desc="Move line up/down" />
        <ShortcutRow keys="Ctrl+D" desc="Select next occurrence" />
        <ShortcutRow keys="Ctrl+Shift+K" desc="Delete line" />
      </tbody>
    </table>

    <SectionHeading>Git</SectionHeading>
    <table className="w-full text-sm mb-4">
      <tbody>
        <ShortcutRow keys="Ctrl+Shift+G" desc="Open Git panel" />
        <ShortcutRow keys="Ctrl+Enter" desc="Commit (in Git panel)" />
        <ShortcutRow keys="Ctrl+K Ctrl+S" desc="Git commit (global)" />
        <ShortcutRow keys="Ctrl+K Ctrl+P" desc="Git push" />
        <ShortcutRow keys="Ctrl+Shift+A" desc="Stage all changes" />
        <ShortcutRow keys="Ctrl+Shift+U" desc="Unstage all changes" />
        <ShortcutRow keys="Ctrl+R" desc="Refresh Git status" />
      </tbody>
    </table>

    <SectionHeading>AI Assistant</SectionHeading>
    <table className="w-full text-sm mb-4">
      <tbody>
        <ShortcutRow keys="Ctrl+Enter" desc="Send message" />
        <ShortcutRow keys="Ctrl+Enter (DiffEditor)" desc="Accept changes" />
        <ShortcutRow keys="Escape (DiffEditor)" desc="Reject changes" />
      </tbody>
    </table>

    <SectionHeading>Terminal</SectionHeading>
    <table className="w-full text-sm mb-4">
      <tbody>
        <ShortcutRow keys="Ctrl+C" desc="Interrupt running process" />
        <ShortcutRow keys="Ctrl+L" desc="Clear terminal" />
        <ShortcutRow keys="Ctrl+Shift+M" desc="Maximize/restore terminal" />
      </tbody>
    </table>
  </div>
);

const OFFLINE_MODE_CONTENT = (
  <div>
    <Paragraph>
      Browser IDE is designed to work offline for most tasks. Here&apos;s what works and
      what doesn&apos;t when you lose your internet connection.
    </Paragraph>

    <SectionHeading>Works Offline</SectionHeading>
    <BulletList items={[
      'Editing files — all file operations use the local virtual file system.',
      'Terminal commands — the WebContainer runs Node.js locally in-browser.',
      'Git commits — local commits are stored in the browser\'s IndexedDB.',
      'Git branching — create, switch, and delete branches locally.',
      'Git history — view commit logs from the local repository.',
      'Project export/import — download and upload project snapshots.',
      'All editor features — syntax highlighting, IntelliSense, formatting.',
      'Settings — all preferences are stored locally.',
    ]} />

    <SectionHeading>Requires Internet</SectionHeading>
    <BulletList items={[
      'AI Assistant — chat and agent mode require API calls to LLM providers.',
      'Git clone — fetching a remote repository requires network access.',
      'Git push/pull — syncing with remote repositories needs connectivity.',
      'Installing npm packages — package downloads require network access.',
      'Preview of web apps — if the app fetches external resources.',
    ]} />

    <Tip>
      The IDE itself loads from cache after the first visit (via service worker). You can
      continue working even if the hosting server goes down.
    </Tip>
  </div>
);

const TROUBLESHOOTING_CONTENT = (
  <div>
    <Paragraph>
      Common issues and their solutions.
    </Paragraph>

    <SectionHeading>WebContainer Not Loading</SectionHeading>
    <Paragraph>
      The terminal requires WebContainer support, which needs specific browser headers
      (COOP/COEP). If the terminal shows an error:
    </Paragraph>
    <BulletList items={[
      'Ensure you\'re using a recent version of Chrome, Edge, Firefox, or Safari.',
      'Check that no browser extensions are blocking cross-origin isolation headers.',
      'Try opening the IDE in a private/incognito window.',
      'Clear your browser cache and reload.',
    ]} />

    <SectionHeading>API Key Errors</SectionHeading>
    <BulletList items={[
      'Verify your API key is correct in Settings > AI.',
      'Check that your API key has sufficient credits/quota.',
      'Anthropic keys start with "sk-ant-", OpenAI keys start with "sk-".',
      'If using a proxy, ensure the endpoint URL is correct.',
    ]} />

    <SectionHeading>Git Push/Pull Fails</SectionHeading>
    <BulletList items={[
      'Ensure your GitHub token is configured in Settings > Git.',
      'The token needs "repo" scope for private repositories.',
      'CORS proxy errors may appear — try refreshing the page.',
      'Check that the remote URL uses HTTPS (SSH is not supported in-browser).',
    ]} />

    <SectionHeading>Files Not Saving</SectionHeading>
    <BulletList items={[
      'Check your browser\'s IndexedDB storage quota (usually 50MB+).',
      'If you see "QuotaExceededError", delete unused projects or clear old data.',
      'Try exporting your project, clearing all data, and re-importing.',
    ]} />

    <SectionHeading>Performance Issues</SectionHeading>
    <BulletList items={[
      'Large files (>1MB) may cause the editor to lag — consider splitting them.',
      'Close unused terminal tabs to free memory.',
      'The WebContainer uses significant memory — avoid opening very large repos.',
      'If the IDE feels slow, try closing other browser tabs.',
    ]} />

    <SectionHeading>Browser Compatibility</SectionHeading>
    <Paragraph>Browser IDE works best in:</Paragraph>
    <BulletList items={[
      'Chrome / Edge 90+ (recommended)',
      'Firefox 90+',
      'Safari 16.4+',
      'Mobile browsers have limited support (editor gestures may differ)',
    ]} />

    <SectionHeading>Resetting the IDE</SectionHeading>
    <Paragraph>
      If something is seriously broken, you can clear all data:
    </Paragraph>
    <CodeBlock>
      {`Open DevTools → Application → IndexedDB → Delete "BrowserIDE" database`}
    </CodeBlock>
    <Paragraph>
      This removes all projects, settings, and sessions. There is no undo.
    </Paragraph>
  </div>
);

const COMMAND_PALETTE_CONTENT = (
  <div>
    <Paragraph>
      The Command Palette is the fastest way to access any action in the IDE.
      Open it with <Kbd>Ctrl+Shift+P</Kbd>.
    </Paragraph>

    <SectionHeading>Using the Palette</SectionHeading>
    <BulletList items={[
      'Start typing to filter commands by name.',
      'Use Arrow keys to navigate, Enter to execute.',
      'Press Escape to close without executing.',
    ]} />

    <SectionHeading>Available Commands</SectionHeading>
    <table className="w-full text-sm mb-4">
      <thead>
        <tr className="border-b border-gray-700 text-left">
          <th className="py-2 pr-4 text-gray-400">Command</th>
          <th className="py-2 pr-4 text-gray-400">Shortcut</th>
          <th className="py-2 text-gray-400">Category</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['New File', 'Ctrl+N', 'File'],
          ['Save File', 'Ctrl+S', 'File'],
          ['Close File', 'Ctrl+W', 'File'],
          ['Export Project', '—', 'File'],
          ['Import Project', '—', 'File'],
          ['Toggle Sidebar', 'Ctrl+B', 'View'],
          ['Toggle Terminal', 'Ctrl+`', 'View'],
          ['Toggle Preview', 'Ctrl+P', 'View'],
          ['Find in File', 'Ctrl+F', 'Editor'],
          ['Replace in File', 'Ctrl+H', 'Editor'],
          ['Format Document', 'Shift+Alt+F', 'Editor'],
          ['Git Status', 'Ctrl+Shift+G', 'Git'],
          ['Git Commit', 'Ctrl+K Ctrl+S', 'Git'],
          ['Git Push', 'Ctrl+K Ctrl+P', 'Git'],
        ].map(([cmd, key, cat], i) => (
          <tr key={i} className="border-b border-gray-800">
            <td className="py-1.5 pr-4 text-gray-200">{cmd}</td>
            <td className="py-1.5 pr-4">{key === '—' ? <span className="text-gray-500">—</span> : <Kbd>{key}</Kbd>}</td>
            <td className="py-1.5 text-gray-400">{cat}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <Tip>
      Commands are also accessible from context menus throughout the IDE.
    </Tip>
  </div>
);

// ---------------------------------------------------------------------------
// Category / section structure
// ---------------------------------------------------------------------------

const DOCUMENTATION_CATEGORIES: DocCategory[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: <Rocket className="w-4 h-4" />,
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        description: 'First-time setup, creating a project, opening files',
        searchText: 'getting started setup project clone repository create file open first time browser',
        icon: <Rocket className="w-4 h-4" />,
        content: GETTING_STARTED_CONTENT,
      },
    ],
  },
  {
    id: 'quick',
    name: 'Quick Reference',
    icon: <Zap className="w-4 h-4" />,
    sections: [
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'Complete shortcut reference',
        searchText: 'keyboard shortcuts hotkey ctrl cmd save find replace format comment git commit push terminal',
        icon: <Keyboard className="w-4 h-4" />,
        content: KEYBOARD_SHORTCUTS_CONTENT,
      },
      {
        id: 'command-palette',
        title: 'Command Palette',
        description: 'Access all commands via Ctrl+Shift+P',
        searchText: 'command palette search commands actions ctrl shift p new file save close export import toggle',
        icon: <Command className="w-4 h-4" />,
        content: COMMAND_PALETTE_CONTENT,
      },
    ],
  },
  {
    id: 'features',
    name: 'Features',
    icon: <Layers className="w-4 h-4" />,
    sections: [
      {
        id: 'file-explorer',
        title: 'File Explorer',
        description: 'Creating, renaming, deleting files and folders',
        searchText: 'file explorer create rename delete folder directory tree context menu icons modified unsaved',
        icon: <FolderTree className="w-4 h-4" />,
        content: FILE_EXPLORER_CONTENT,
      },
      {
        id: 'editor',
        title: 'Editor',
        description: 'Multi-tab editing, syntax highlighting, IntelliSense, split view',
        searchText: 'editor monaco tab syntax highlighting intellisense autocomplete split view format save find replace comment',
        icon: <Code className="w-4 h-4" />,
        content: EDITOR_CONTENT,
      },
      {
        id: 'terminal',
        title: 'Terminal',
        description: 'Built-in terminal, available commands, WebContainer',
        searchText: 'terminal webcontainer commands node npm git shell bash ls cd mkdir nano vim python pip curl wget',
        icon: <Terminal className="w-4 h-4" />,
        content: TERMINAL_CONTENT,
      },
      {
        id: 'git',
        title: 'Git Integration',
        description: 'Cloning repos, staging, committing, pushing, branches',
        searchText: 'git clone stage commit push pull branch history stash isomorphic github token remote',
        icon: <GitBranch className="w-4 h-4" />,
        content: GIT_CONTENT,
      },
      {
        id: 'ai-assistant',
        title: 'AI Assistant',
        description: 'Setting up API keys, chat, agent mode, Claude Code',
        searchText: 'ai assistant claude openai api key chat agent mode tools edit file terminal code anthropic llm provider',
        icon: <Bot className="w-4 h-4" />,
        content: AI_ASSISTANT_CONTENT,
      },
      {
        id: 'project-management',
        title: 'Project Management',
        description: 'Multi-project support, switching, import/export',
        searchText: 'project management workspace switch export import settings storage indexeddb dexie',
        icon: <FolderKanban className="w-4 h-4" />,
        content: PROJECT_MANAGEMENT_CONTENT,
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: <Wrench className="w-4 h-4" />,
    sections: [
      {
        id: 'offline-mode',
        title: 'Offline Mode',
        description: 'What works offline vs what requires internet',
        searchText: 'offline mode internet connection network works without online service worker cache',
        icon: <Wifi className="w-4 h-4" />,
        content: OFFLINE_MODE_CONTENT,
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        description: 'Common issues and solutions',
        searchText: 'troubleshooting error fix problem webcontainer api key git push fail save storage browser compatibility reset',
        icon: <Wrench className="w-4 h-4" />,
        content: TROUBLESHOOTING_CONTENT,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HelpPanel({ className }: { className?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useIDEStore((state) => state.helpOpen);
  const toggleHelp = useIDEStore((state) => state.toggleHelp);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return DOCUMENTATION_CATEGORIES;
    const q = searchQuery.toLowerCase();

    return DOCUMENTATION_CATEGORIES.map(category => ({
      ...category,
      sections: category.sections.filter(section =>
        section.title.toLowerCase().includes(q) ||
        section.description.toLowerCase().includes(q) ||
        section.searchText.toLowerCase().includes(q)
      ),
    })).filter(category => category.sections.length > 0);
  }, [searchQuery]);

  const currentSection = useMemo(() => {
    for (const cat of DOCUMENTATION_CATEGORIES) {
      const found = cat.sections.find(sec => sec.id === selectedSection);
      if (found) return found;
    }
    return undefined;
  }, [selectedSection]);

  const handleSectionSelect = (categoryId: string, sectionId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSection(sectionId);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className={clsx('help-panel flex h-full bg-gray-900 text-gray-100', className)}>
      {/* Sidebar */}
      {!sidebarCollapsed && (
        <div className="w-64 shrink-0 border-r border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Help
              </h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 hover:bg-gray-700 rounded md:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-600 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <nav className="p-2" aria-label="Documentation sections">
            {filteredCategories.map((category) => {
              const isExpanded = searchQuery || selectedCategory === category.id;
              return (
                <div key={category.id} className="mb-1">
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id);
                      if (category.sections.length === 1) {
                        handleSectionSelect(category.id, category.sections[0].id);
                      }
                    }}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2 rounded text-left text-sm font-medium',
                      selectedCategory === category.id
                        ? 'bg-blue-600/20 text-blue-300'
                        : 'hover:bg-gray-800 text-gray-300'
                    )}
                  >
                    {category.icon}
                    {category.name}
                  </button>

                  {isExpanded && category.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionSelect(category.id, section.id)}
                      className={clsx(
                        'w-full flex items-center gap-2 pl-8 pr-3 py-1.5 rounded text-left text-sm',
                        selectedSection === section.id
                          ? 'bg-blue-900/40 text-blue-300'
                          : 'hover:bg-gray-800 text-gray-400'
                      )}
                    >
                      {section.icon}
                      {section.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Show sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-lg font-semibold">{currentSection?.title ?? 'Documentation'}</h1>
          </div>
          <button
            onClick={() => toggleHelp?.()}
            className="p-1 hover:bg-gray-700 rounded"
            aria-label="Close help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 max-w-3xl">
          {currentSection?.content ?? (
            <Paragraph>Select a section from the sidebar to view documentation.</Paragraph>
          )}
        </div>
      </div>
    </div>
  );
}

export default HelpPanel;
