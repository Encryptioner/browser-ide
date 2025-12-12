# Browser IDE Pro v2 - Complete Implementation Plan

## 🎯 Vision

Transform Browser IDE Pro into a **production-ready, secure, full-featured web IDE** that surpasses VS Code Web and Claude Code Web by combining:

- ✅ Complete VS Code-like IDE experience
- ✅ Claude Code agentic capabilities with GLM-4.6
- ✅ Full mobile UI support
- ✅ Advanced Git integration with visual UI
- ✅ AI chat with session management
- ✅ Multi-workspace support
- ✅ Offline-first PWA
- ✅ VS Code extensions
- ✅ Enterprise-grade security

---

## 📋 Implementation Phases

### **Phase 1: Stability & Core Fixes** (Priority: CRITICAL)

Fix immediate issues and ensure rock-solid foundation.

#### 1.1 Terminal Reliability ✅
**Status:** Partially complete, needs fixes

**Issues:**
- WebContainer boot reliability
- Command execution error handling
- Process cleanup on unmount

**Implementation:**
```typescript
// src/components/IDE/Terminal.tsx enhancements

1. Add WebContainer boot status indicator
2. Implement command history (up/down arrows)
3. Add Ctrl+C process termination
4. Fix process cleanup on component unmount
5. Add error recovery for failed commands
6. Improve output buffering for large outputs
```

**Files to Modify:**
- `src/components/IDE/Terminal.tsx` - Enhanced command handling
- `src/services/webcontainer.ts` - Add process management methods

#### 1.2 Git Branch Detection & Switching 🔧
**Status:** Critical bug - shows 'main' instead of actual branch

**Root Cause Analysis:**
```typescript
// Current: src/store/useIDEStore.ts
currentBranch: 'main'  // Hardcoded default!

// Current: src/services/git.ts
getCurrentBranch() {
  // Returns actual branch but store never updates
}
```

**Implementation:**

**Step 1: Fix Branch Detection**
```typescript
// src/services/git.ts - Add auto-detection
export async function initializeRepository(dir: string) {
  const branch = await getCurrentBranch(dir);
  const status = await statusMatrix(dir);
  const commits = await log(dir, 20);

  return {
    currentBranch: branch || 'main',
    gitStatus: status,
    commits: commits,
  };
}
```

**Step 2: Enhanced Status Bar**
```typescript
// src/components/IDE/StatusBar.tsx - NEW

interface StatusBarProps {
  // Current props
}

export function StatusBar() {
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [branches, setBranches] = useState<GitBranch[]>([]);

  // Load branches on mount
  useEffect(() => {
    async function loadBranches() {
      const result = await gitService.listBranches('/repo');
      setBranches(result);
    }
    loadBranches();
  }, [currentBranch]);

  // Branch switcher dropdown
  return (
    <div className="status-bar">
      {/* Existing content */}

      {/* NEW: Branch Switcher */}
      <div className="branch-selector relative">
        <button
          onClick={() => setShowBranchMenu(!showBranchMenu)}
          className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700"
        >
          <GitBranchIcon />
          <span>{currentBranch}</span>
          <ChevronDownIcon />
        </button>

        {showBranchMenu && (
          <div className="absolute bottom-full left-0 bg-gray-800 border">
            <div className="p-2">
              {/* Current branch */}
              {branches.filter(b => b.current).map(branch => (
                <div key={branch.name} className="flex items-center gap-2 px-2 py-1 bg-blue-900">
                  <CheckIcon />
                  <span>{branch.name}</span>
                  {branch.remote && <span className="text-xs text-gray-400">↔ {branch.remote}</span>}
                </div>
              ))}

              <div className="border-t my-1" />

              {/* Other branches */}
              {branches.filter(b => !b.current).map(branch => (
                <button
                  key={branch.name}
                  onClick={() => handleBranchSwitch(branch.name)}
                  className="w-full text-left px-2 py-1 hover:bg-gray-700"
                >
                  {branch.name}
                  {branch.remote && <span className="text-xs text-gray-400 ml-2">↔ {branch.remote}</span>}
                </button>
              ))}

              <div className="border-t my-1" />

              {/* Actions */}
              <button onClick={() => handleCreateBranch()}>
                + Create new branch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Git status indicator */}
      {gitStatus.length > 0 && (
        <div className="git-changes px-2 py-1 text-xs">
          <span className="text-yellow-400">{gitStatus.length} changes</span>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Auto-refresh on Checkout**
```typescript
// src/services/git.ts
export async function checkout(branchName: string): Promise<Result<void>> {
  const result = await git.checkout({ fs, dir: '/repo', ref: branchName });

  // Update store immediately
  const store = useIDEStore.getState();
  store.setCurrentBranch(branchName);

  // Refresh file tree and git status
  await store.refreshFileTree();
  await store.refreshGitStatus();

  return { success: true };
}
```

**Files to Create/Modify:**
- `src/components/IDE/StatusBar.tsx` - Add branch switcher dropdown
- `src/services/git.ts` - Add `initializeRepository()` method
- `src/store/useIDEStore.ts` - Add `refreshGitStatus()`, `refreshFileTree()`
- `src/components/IDE/CloneDialog.tsx` - Call `initializeRepository()` after clone

#### 1.3 Multi-Workspace Foundation 🏗️
**Status:** Not implemented

**Current Limitation:** Only one project open at a time

**Database Schema:** ✅ Already supports it
```typescript
// Projects table exists with full metadata
interface Project {
  id: string;
  name: string;
  repoUrl: string;
  localPath: string;
  gitBranch: string;  // Per-project branch
  lastOpened: number;
  starred: boolean;
}
```

**Implementation:**

**Step 1: Workspace Store**
```typescript
// src/store/useWorkspaceStore.ts - NEW FILE

interface WorkspaceState {
  // Active workspace
  activeWorkspaceId: string | null;

  // Workspace registry
  workspaces: Record<string, Workspace>;

  // Per-workspace state
  workspaceStates: Record<string, {
    currentFile: string | null;
    openFiles: string[];
    editorContent: Record<string, string>;
    unsavedChanges: Set<string>;
    gitBranch: string;
    gitStatus: any[];
    scrollPosition: Record<string, number>;
  }>;

  // Actions
  createWorkspace: (project: Project) => string;
  switchWorkspace: (id: string) => void;
  closeWorkspace: (id: string) => void;
  saveWorkspaceState: (id: string) => void;
  loadWorkspaceState: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: null,
      workspaces: {},
      workspaceStates: {},

      createWorkspace: (project) => {
        const id = nanoid();
        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [id]: {
              id,
              projectId: project.id,
              name: project.name,
              createdAt: Date.now(),
            },
          },
          workspaceStates: {
            ...state.workspaceStates,
            [id]: {
              currentFile: null,
              openFiles: [],
              editorContent: {},
              unsavedChanges: new Set(),
              gitBranch: project.gitBranch,
              gitStatus: [],
              scrollPosition: {},
            },
          },
        }));
        return id;
      },

      switchWorkspace: async (id) => {
        // Save current workspace state
        const current = get().activeWorkspaceId;
        if (current) {
          get().saveWorkspaceState(current);
        }

        // Load new workspace state
        await get().loadWorkspaceState(id);

        set({ activeWorkspaceId: id });
      },

      // ... other actions
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
);
```

**Step 2: Workspace Switcher UI**
```typescript
// src/components/IDE/WorkspaceSwitcher.tsx - NEW

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, switchWorkspace } = useWorkspaceStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="workspace-switcher">
      <button onClick={() => setShowMenu(!showMenu)}>
        <FolderIcon />
        {workspaces[activeWorkspaceId]?.name || 'No workspace'}
        <ChevronDownIcon />
      </button>

      {showMenu && (
        <div className="workspace-menu">
          {Object.values(workspaces).map(ws => (
            <div
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              className={activeWorkspaceId === ws.id ? 'active' : ''}
            >
              {ws.name}
            </div>
          ))}
          <div className="border-t" />
          <button onClick={handleOpenProject}>+ Open Project</button>
        </div>
      )}
    </div>
  );
}
```

**Files to Create:**
- `src/store/useWorkspaceStore.ts` - Workspace state management
- `src/components/IDE/WorkspaceSwitcher.tsx` - Workspace switcher UI
- `src/components/IDE/ProjectPicker.tsx` - Project selection dialog

**Files to Modify:**
- `src/App.tsx` - Integrate WorkspaceSwitcher in title bar
- `src/store/useIDEStore.ts` - Migrate file/editor state to workspace store

---

### **Phase 2: Git Integration (Visual UI)**

Complete Git experience matching VS Code's Source Control panel.

#### 2.1 Source Control Panel 🎨
**Status:** Not implemented

**Implementation:**

**File Structure:**
```
src/components/Git/
├── SourceControlPanel.tsx      # Main panel
├── ChangesView.tsx             # Staged/unstaged files
├── CommitBox.tsx               # Commit message input
├── BranchManager.tsx           # Branch operations
├── DiffViewer.tsx              # Side-by-side diff
├── MergeConflictResolver.tsx   # Conflict resolution
└── GitHistory.tsx              # Commit history
```

**SourceControlPanel Component:**
```typescript
// src/components/Git/SourceControlPanel.tsx

export function SourceControlPanel() {
  const [view, setView] = useState<'changes' | 'history' | 'branches'>('changes');
  const { gitStatus, currentBranch } = useIDEStore();

  const staged = gitStatus.filter(f => f.status === 'staged');
  const unstaged = gitStatus.filter(f => f.status !== 'staged' && f.status !== 'unmodified');

  return (
    <div className="source-control-panel flex flex-col h-full">
      {/* Header with tabs */}
      <div className="panel-header border-b">
        <div className="flex">
          <button
            className={view === 'changes' ? 'active' : ''}
            onClick={() => setView('changes')}
          >
            Changes ({unstaged.length + staged.length})
          </button>
          <button
            className={view === 'history' ? 'active' : ''}
            onClick={() => setView('history')}
          >
            History
          </button>
          <button
            className={view === 'branches' ? 'active' : ''}
            onClick={() => setView('branches')}
          >
            Branches
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {view === 'changes' && <ChangesView staged={staged} unstaged={unstaged} />}
        {view === 'history' && <GitHistory />}
        {view === 'branches' && <BranchManager />}
      </div>
    </div>
  );
}
```

**ChangesView Component:**
```typescript
// src/components/Git/ChangesView.tsx

export function ChangesView({ staged, unstaged }: Props) {
  const [commitMessage, setCommitMessage] = useState('');
  const [commitBody, setCommitBody] = useState('');

  const handleStage = async (filepath: string) => {
    await gitService.add(filepath);
    await refreshGitStatus();
  };

  const handleUnstage = async (filepath: string) => {
    await gitService.restore(filepath, { staged: true });
    await refreshGitStatus();
  };

  const handleCommit = async () => {
    const message = commitBody
      ? `${commitMessage}\n\n${commitBody}`
      : commitMessage;

    await gitService.commit(message, {
      name: settings.githubUsername,
      email: settings.githubEmail,
    });

    setCommitMessage('');
    setCommitBody('');
    await refreshGitStatus();
  };

  return (
    <div className="changes-view">
      {/* Commit box */}
      <CommitBox
        message={commitMessage}
        body={commitBody}
        onMessageChange={setCommitMessage}
        onBodyChange={setCommitBody}
        onCommit={handleCommit}
        canCommit={staged.length > 0 && commitMessage.trim().length > 0}
      />

      {/* Staged changes */}
      {staged.length > 0 && (
        <div className="file-group">
          <div className="group-header">
            <span>Staged Changes ({staged.length})</span>
            <button onClick={handleUnstageAll}>−</button>
          </div>
          {staged.map(file => (
            <FileItem
              key={file.path}
              file={file}
              onAction={() => handleUnstage(file.path)}
              actionIcon="−"
              onDiff={() => showDiff(file.path)}
            />
          ))}
        </div>
      )}

      {/* Unstaged changes */}
      {unstaged.length > 0 && (
        <div className="file-group">
          <div className="group-header">
            <span>Changes ({unstaged.length})</span>
            <button onClick={handleStageAll}>+</button>
          </div>
          {unstaged.map(file => (
            <FileItem
              key={file.path}
              file={file}
              onAction={() => handleStage(file.path)}
              actionIcon="+"
              onDiff={() => showDiff(file.path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**DiffViewer Component:**
```typescript
// src/components/Git/DiffViewer.tsx
// Use react-diff-view or custom implementation

export function DiffViewer({ filepath }: Props) {
  const [diff, setDiff] = useState<Diff | null>(null);

  useEffect(() => {
    async function loadDiff() {
      const result = await gitService.diff(filepath);
      setDiff(parseDiff(result));
    }
    loadDiff();
  }, [filepath]);

  return (
    <div className="diff-viewer">
      {/* Side-by-side diff */}
      <div className="diff-container">
        <div className="diff-left">
          {diff?.oldLines.map((line, i) => (
            <div key={i} className={line.type === 'delete' ? 'bg-red-900' : ''}>
              {line.content}
            </div>
          ))}
        </div>
        <div className="diff-right">
          {diff?.newLines.map((line, i) => (
            <div key={i} className={line.type === 'add' ? 'bg-green-900' : ''}>
              {line.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Files to Create:**
- `src/components/Git/SourceControlPanel.tsx`
- `src/components/Git/ChangesView.tsx`
- `src/components/Git/CommitBox.tsx`
- `src/components/Git/DiffViewer.tsx`
- `src/components/Git/GitHistory.tsx`
- `src/components/Git/BranchManager.tsx`
- `src/components/Git/MergeConflictResolver.tsx`

**Dependencies to Add:**
```bash
pnpm add diff react-diff-view diff2html
```

#### 2.2 Git Service Enhancements 🔧

**Add Missing Operations:**
```typescript
// src/services/git.ts - ADD

export async function diff(filepath: string): Promise<Result<string>> {
  // Get diff between working tree and HEAD
  const commits = await git.log({ fs, dir: '/repo', depth: 1 });
  const headCommit = commits[0].oid;

  const diff = await git.walk({
    fs,
    dir: '/repo',
    trees: [git.TREE({ ref: headCommit }), git.WORKDIR()],
    map: async (filepath, [A, B]) => {
      if (!A || !B) return null;
      const aContent = await A.content();
      const bContent = await B.content();
      return { filepath, aContent, bContent };
    },
  });

  return { success: true, data: formatDiff(diff) };
}

export async function restore(filepath: string, options: { staged?: boolean }): Promise<Result<void>> {
  if (options.staged) {
    // Unstage file
    await git.resetIndex({ fs, dir: '/repo', filepath });
  } else {
    // Discard changes
    await git.checkout({ fs, dir: '/repo', filepaths: [filepath], force: true });
  }
  return { success: true };
}

export async function stash(): Promise<Result<string>> {
  // Create stash commit
  const status = await statusMatrix('/repo');
  const changes = status.filter(([_, head, workdir, stage]) => workdir !== head);

  // Save stash metadata to IndexedDB
  const stashId = nanoid();
  await db.stashes.add({
    id: stashId,
    message: 'WIP',
    files: changes,
    timestamp: Date.now(),
  });

  // Reset working directory
  await git.checkout({ fs, dir: '/repo', ref: 'HEAD', force: true });

  return { success: true, data: stashId };
}

export async function merge(branchName: string): Promise<Result<MergeResult>> {
  const result = await git.merge({
    fs,
    dir: '/repo',
    ours: await getCurrentBranch('/repo'),
    theirs: branchName,
    author: { name: 'User', email: 'user@example.com' },
  });

  if (result.conflicts) {
    return {
      success: false,
      error: 'Merge conflicts',
      data: { conflicts: result.conflicts },
    };
  }

  return { success: true, data: result };
}
```

**Add to git.ts:**
- `diff(filepath)` - Get file diff
- `restore(filepath, options)` - Unstage or discard changes
- `stash()` - Stash working directory changes
- `stashPop()` - Apply stashed changes
- `merge(branchName)` - Merge branches
- `rebase(branchName)` - Rebase current branch
- `cherryPick(commitOid)` - Cherry-pick commit

---

### **Phase 3: AI Chat Session Management**

#### 3.1 Session-Based Chat 💬
**Status:** ClaudeCodePanel uses local state, not persisted

**Implementation:**

**Step 1: Connect ClaudeCodePanel to Database**
```typescript
// src/components/IDE/ClaudeCodePanel.tsx - MODIFY

export function ClaudeCodePanel() {
  const { activeWorkspaceId } = useWorkspaceStore();
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load sessions for current workspace
  useEffect(() => {
    async function loadSessions() {
      if (!activeWorkspaceId) return;

      const projectSessions = await db.getProjectSessions(activeWorkspaceId);
      setSessions(projectSessions);

      // Load most recent session
      if (projectSessions.length > 0) {
        const recent = projectSessions.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        await loadSession(recent.id);
      }
    }
    loadSessions();
  }, [activeWorkspaceId]);

  // Load session messages
  async function loadSession(sessionId: string) {
    const sessionMessages = await db.getSessionMessages(sessionId);
    setMessages(sessionMessages);
    setActiveSessionId(sessionId);
  }

  // Save message to database
  async function saveMessage(message: Omit<AIMessage, 'id'>) {
    const id = nanoid();
    const msg: AIMessage = { ...message, id };

    await db.addMessage(msg, activeSessionId!);
    setMessages(prev => [...prev, msg]);

    // Update session timestamp
    await db.updateSession(activeSessionId!, { updatedAt: Date.now() });
  }

  // Create new session
  async function createNewSession() {
    const sessionId = nanoid();
    const session: AISession = {
      id: sessionId,
      title: 'New Chat',
      projectId: activeWorkspaceId!,
      providerId: providerType,
      model: providerType === 'glm' ? 'glm-4.6' : 'claude-sonnet-4',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };

    await db.addSession(session);
    setSessions(prev => [...prev, session]);
    setActiveSessionId(sessionId);
    setMessages([]);
  }

  // Rest of component implementation...
}
```

**Step 2: Session Sidebar**
```typescript
// src/components/IDE/ChatSessionSidebar.tsx - NEW

export function ChatSessionSidebar() {
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  return (
    <div className="chat-sessions sidebar">
      <div className="header">
        <h3>Chat Sessions</h3>
        <button onClick={createNewSession}>+</button>
      </div>

      {/* Pinned sessions */}
      {sessions.filter(s => s.pinned).length > 0 && (
        <div className="session-group">
          <div className="group-title">Pinned</div>
          {sessions.filter(s => s.pinned).map(session => (
            <SessionItem
              key={session.id}
              session={session}
              active={session.id === activeSessionId}
              onSelect={() => loadSession(session.id)}
              onPin={() => togglePin(session.id)}
              onDelete={() => deleteSession(session.id)}
            />
          ))}
        </div>
      )}

      {/* Recent sessions */}
      <div className="session-group">
        <div className="group-title">Recent</div>
        {sessions.filter(s => !s.pinned).slice(0, 10).map(session => (
          <SessionItem
            key={session.id}
            session={session}
            active={session.id === activeSessionId}
            onSelect={() => loadSession(session.id)}
            onPin={() => togglePin(session.id)}
            onDelete={() => deleteSession(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Files to Create:**
- `src/components/IDE/ChatSessionSidebar.tsx`
- `src/components/IDE/SessionItem.tsx`

**Files to Modify:**
- `src/components/IDE/ClaudeCodePanel.tsx` - Connect to database
- `src/App.tsx` - Add session sidebar toggle

---

### **Phase 4: Security & PWA Enhancements**

#### 4.1 Security Hardening 🔒

**Content Security Policy (CSP):**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';
               connect-src 'self' https://api.anthropic.com https://api.z.ai https://api.openai.com https://cors.isomorphic-git.org;
               img-src 'self' data: https:;
               font-src 'self' data:;
               worker-src 'self' blob:;">
```

**API Key Encryption:**
```typescript
// src/utils/encryption.ts - NEW

import { subtle } from 'crypto';

// Derive encryption key from user passphrase
async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('browser-ide-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt API key
export async function encryptApiKey(apiKey: string, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase);
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(apiKey)
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt API key
export async function decryptApiKey(encrypted: string, passphrase: string): Promise<string> {
  const key = await deriveKey(passphrase);
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
```

**Session Lock:**
```typescript
// src/components/SessionLock.tsx - NEW

export function SessionLock() {
  const [locked, setLocked] = useState(() => {
    // Lock after 15 minutes of inactivity
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return false;
    return Date.now() - parseInt(lastActivity) > 15 * 60 * 1000;
  });

  const [passphrase, setPassphrase] = useState('');

  const handleUnlock = async () => {
    try {
      // Verify passphrase by decrypting a test value
      await decryptApiKey(settings.encryptedTestKey, passphrase);
      setLocked(false);
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch {
      toast.error('Invalid passphrase');
    }
  };

  if (!locked) return <App />;

  return (
    <div className="session-lock">
      <div className="lock-dialog">
        <h2>Session Locked</h2>
        <input
          type="password"
          placeholder="Enter passphrase"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
        />
        <button onClick={handleUnlock}>Unlock</button>
      </div>
    </div>
  );
}
```

**Environment Validation:**
```typescript
// src/utils/security.ts - NEW

export function validateEnvironment() {
  // Check for HTTPS in production
  if (import.meta.env.PROD && location.protocol !== 'https:') {
    throw new Error('HTTPS required in production');
  }

  // Check for required headers
  if (import.meta.env.PROD) {
    // COOP/COEP headers required for WebContainer
    const coop = document.head.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]');
    const coep = document.head.querySelector('meta[http-equiv="Cross-Origin-Embedder-Policy"]');

    if (!coop || !coep) {
      console.warn('Missing COOP/COEP headers - WebContainer may not work');
    }
  }

  // Check for localStorage availability
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch {
    throw new Error('localStorage not available - IDE requires storage');
  }

  // Check for IndexedDB
  if (!window.indexedDB) {
    throw new Error('IndexedDB not available - IDE requires database');
  }
}
```

#### 4.2 PWA Enhancements 📱

**Enhanced Service Worker:**
```typescript
// vite.config.ts - MODIFY

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Browser IDE Pro',
        short_name: 'IDE Pro',
        description: 'Full-featured web IDE with AI assistance',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['development', 'productivity'],
        screenshots: [
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/screenshots/mobile.png',
            sizes: '750x1334',
            type: 'image/png',
            form_factor: 'narrow',
          },
        ],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Advanced caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.(anthropic|openai)\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ai-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        // Offline fallback
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
});
```

**Offline Sync Queue:**
```typescript
// src/services/offline-sync.ts - NEW

interface PendingAction {
  id: string;
  type: 'git_commit' | 'git_push' | 'ai_message';
  projectId: string;
  payload: any;
  timestamp: number;
  retries: number;
}

class OfflineSyncService {
  private queue: PendingAction[] = [];

  async addToQueue(action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>) {
    const pending: PendingAction = {
      ...action,
      id: nanoid(),
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(pending);
    await db.pendingActions.add(pending);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  async sync() {
    const pending = await db.pendingActions.where('synced').equals(0).toArray();

    for (const action of pending) {
      try {
        await this.executeAction(action);
        await db.pendingActions.update(action.id, { synced: 1 });
      } catch (error) {
        // Increment retry count
        await db.pendingActions.update(action.id, {
          retries: action.retries + 1,
        });

        // Remove if too many retries
        if (action.retries >= 3) {
          await db.pendingActions.delete(action.id);
        }
      }
    }
  }

  private async executeAction(action: PendingAction) {
    switch (action.type) {
      case 'git_commit':
        await gitService.commit(action.payload.message, action.payload.author);
        break;
      case 'git_push':
        await gitService.push(action.payload.token, 'origin', 'main');
        break;
      case 'ai_message':
        // Re-send AI message
        break;
    }
  }
}

export const offlineSync = new OfflineSyncService();

// Listen for online/offline events
window.addEventListener('online', () => offlineSync.sync());
```

---

## 📂 File Structure (Complete)

```
src/
├── components/
│   ├── IDE/
│   │   ├── FileExplorer.tsx
│   │   ├── Editor.tsx
│   │   ├── Terminal.tsx              # ✅ Enhanced
│   │   ├── StatusBar.tsx             # ✅ Enhanced with branch switcher
│   │   ├── Preview.tsx
│   │   ├── CloneDialog.tsx           # ✅ Fixed
│   │   ├── SettingsDialog.tsx
│   │   ├── AIAssistant.tsx
│   │   ├── ClaudeCodePanel.tsx       # ✅ Enhanced with sessions
│   │   ├── ExtensionsPanel.tsx
│   │   ├── WorkspaceSwitcher.tsx     # 🆕 NEW
│   │   ├── ProjectPicker.tsx         # 🆕 NEW
│   │   ├── ChatSessionSidebar.tsx    # 🆕 NEW
│   │   └── SessionItem.tsx           # 🆕 NEW
│   ├── Git/
│   │   ├── SourceControlPanel.tsx    # 🆕 NEW
│   │   ├── ChangesView.tsx           # 🆕 NEW
│   │   ├── CommitBox.tsx             # 🆕 NEW
│   │   ├── DiffViewer.tsx            # 🆕 NEW
│   │   ├── GitHistory.tsx            # 🆕 NEW
│   │   ├── BranchManager.tsx         # 🆕 NEW
│   │   └── MergeConflictResolver.tsx # 🆕 NEW
│   ├── ErrorBoundary.tsx
│   ├── Loading.tsx
│   └── SessionLock.tsx               # 🆕 NEW
├── services/
│   ├── filesystem.ts
│   ├── git.ts                        # ✅ Enhanced
│   ├── webcontainer.ts               # ✅ Enhanced
│   ├── claude-agent.ts
│   ├── vscode-extensions.ts
│   ├── ai-providers.ts
│   └── offline-sync.ts               # 🆕 NEW
├── store/
│   ├── useIDEStore.ts                # ✅ Modified
│   └── useWorkspaceStore.ts          # 🆕 NEW
├── lib/
│   ├── database.ts                   # ✅ Enhanced
│   └── migrations.ts                 # 🆕 NEW
├── utils/
│   ├── logger.ts
│   ├── encryption.ts                 # 🆕 NEW
│   └── security.ts                   # 🆕 NEW
├── types/
│   └── index.ts                      # ✅ Enhanced
├── App.tsx                           # ✅ Modified
└── main.tsx
```

---

## 🎯 Success Criteria

### Phase 1: Stability & Core
- ✅ Terminal executes all commands reliably
- ✅ Git branch switcher shows correct branch
- ✅ Can switch branches from status bar
- ✅ Multiple workspaces can be opened

### Phase 2: Git Integration
- ✅ Source Control panel shows all changes
- ✅ Can stage/unstage files visually
- ✅ Commit with custom message
- ✅ View commit history
- ✅ Create/delete branches
- ✅ Merge branches with conflict resolution
- ✅ Side-by-side diff viewer

### Phase 3: AI Chat
- ✅ Chat sessions persist across reloads
- ✅ Can create multiple sessions per project
- ✅ Pin favorite sessions
- ✅ Search messages within session
- ✅ Session sidebar navigation

### Phase 4: Security & PWA
- ✅ API keys encrypted with passphrase
- ✅ Session lock after inactivity
- ✅ CSP headers configured
- ✅ Offline sync queue for git operations
- ✅ PWA installable on mobile
- ✅ Works offline after initial load

---

## 📦 Dependencies to Add

```json
{
  "dependencies": {
    "diff": "^5.1.0",
    "react-diff-view": "^3.2.0",
    "diff2html": "^3.4.45",
    "nanoid": "^5.0.4"
  }
}
```

---

## 🚀 Implementation Order

**Week 1: Stability**
- Day 1-2: Terminal enhancements
- Day 3-4: Git branch detection fix
- Day 5-6: Multi-workspace foundation
- Day 7: Testing & bug fixes

**Week 2: Git UI**
- Day 1-2: Source Control panel structure
- Day 3-4: Changes view + staging
- Day 5-6: Diff viewer
- Day 7: Git history & branch manager

**Week 3: AI Sessions**
- Day 1-2: Database integration
- Day 3-4: Session sidebar
- Day 5-6: Session management
- Day 7: Testing

**Week 4: Security & Polish**
- Day 1-2: Encryption implementation
- Day 3-4: Offline sync
- Day 5-6: PWA enhancements
- Day 7: Final testing & deployment

---

## 📝 Notes

- **Mobile-first**: All new components must be responsive
- **Offline-first**: Assume network may be unavailable
- **Security-first**: Never store API keys in plain text
- **Performance**: Use virtualization for large file lists
- **Accessibility**: All interactive elements keyboard-navigable

---

**Total Estimated Effort:** 4 weeks full-time development
**Complexity:** High (enterprise-grade IDE)
**Risk Areas:** WebContainer limitations, Git merge conflicts, Encryption UX

This plan transforms Browser IDE Pro into a production-ready, enterprise-grade web IDE that exceeds the capabilities of VS Code Web and Claude Code Web combined.
