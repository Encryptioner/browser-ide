# Browser IDE - Production Specification

**Status:** Approved
**Date:** February 20, 2026
**Version:** 1.1

---

## 1. Product Vision

A production-ready, browser-based IDE with full Claude Code SDK integration, responsive design across all device sizes, and offline-capable local development. The IDE targets developers who want VS Code-like editing, terminal, git, and AI-powered coding assistance entirely in the browser.

---

## 2. Architecture Decisions

### 2.1 Claude Code Integration

**Decision:** Use the real `@anthropic-ai/claude-code` SDK, running inside WebContainer as its execution environment.

- WebContainer provides the Node.js runtime, filesystem, and shell that the SDK expects.
- All SDK operations (file reads/writes, bash commands, tool calls) execute within WebContainer.
- WebContainer is the sole execution backend. No backend server. Fully client-side.
- Accept WebContainer limitations: no native modules, limited network, no Docker.
- Architect the tool layer so a backend can be plugged in later without rewriting (progressive enhancement ready).

**Claude Terminal:**
- Claude Code gets a dedicated terminal tab, separate from the user's terminal.
- All Claude tool activity (file edits, command execution, search) displayed in this dedicated tab.
- User terminal remains clean for manual commands.

### 2.2 Unified AI Panel

**Decision:** Merge AI chat and Claude Code into a single unified AI panel.

- Single panel with both chat mode (questions/discussion) and agent mode (file operations).
- Seamless switching between modes.
- When Claude executes tool calls, render them as **interactive cards**:
  - File edits: collapsible card showing inline diff.
  - Terminal commands: card with syntax-highlighted output.
  - File search: card with clickable results.
  - Cards are collapsible, interactive, and scrollable.

### 2.3 File Edit Conflict Resolution

**Decision:** Full inline diff with Monaco DiffEditor.

- When Claude modifies a file currently open in the editor, temporarily switch to Monaco's `DiffEditor` component (inline mode).
- Show original (left) vs Claude's changes (right) with red/green diff highlighting.
- Accept/Reject buttons at the top of the diff view.
- After resolution, switch back to the normal editor.
- If the file is not currently open, apply changes silently and show a toast notification.

### 2.4 State Management

**Decision:** Split the monolithic Zustand store into domain-specific stores.

**Stores:**
| Store | Responsibility | Persistence |
|-------|---------------|-------------|
| `useFileStore` | File tree, open files, file content | IndexedDB (Dexie) |
| `useEditorStore` | Active tab, cursor position, editor settings | localStorage |
| `useGitStore` | Branch, status, commit history | localStorage |
| `useTerminalStore` | Terminal sessions, history | None (ephemeral) |
| `useAIStore` | Chat sessions, messages, agent state | IndexedDB (Dexie) |
| `useUIStore` | Panel visibility, layout, theme | localStorage |
| `useSettingsStore` | User preferences, keybindings | localStorage |

**Cross-store communication:** Subscribe pattern via Zustand's `subscribe` API.
- Stores subscribe to each other for cross-domain updates.
- Example: `FileStore` emits file change, `EditorStore` listens and updates tab content.
- Loose coupling - stores never import each other directly.

### 2.5 API Key Storage

**Decision:** IndexedDB with Web Crypto API, device-bound auto key.

- On first API key entry, generate a non-exportable `CryptoKey` via Web Crypto API.
- Store the `CryptoKey` in IndexedDB (non-extractable).
- Encrypt API keys with AES-GCM before storing in IndexedDB.
- Decryption is transparent to the user - no passphrase needed.
- Keys are device-bound and lost if browser data is cleared.
- Show clear warning to users that clearing browser data will require re-entering keys.

---

## 3. Responsive Design

### 3.1 Breakpoint Strategy

**Decision:** Custom breakpoints defined in a single shared config, used by both Tailwind and JavaScript hooks.

| Breakpoint | Name | Use Case |
|-----------|------|----------|
| 0-479px | `xsm` | Small phones |
| 480-639px | `sm` | Large phones |
| 640-767px | `md` | Small tablets |
| 768-1023px | `lg` | Tablets, landscape phones |
| 1024-1279px | `xl` | Small desktops, landscape tablets |
| 1280px+ | `2xl` | Full desktops |

**Implementation:**
- Define breakpoints in `src/config/breakpoints.ts` as a single source of truth.
- Tailwind reads from this config via `tailwind.config.js`.
- `useMediaQuery` hooks read from the same config.
- **Remove ALL `window.innerWidth` checks** from components. Replace with hooks.
- No direct viewport reads in components - only hooks and Tailwind classes.

### 3.2 Mobile Layout

- **Sidebar:** Overlay drawer (tap button to open/close). No swipe gestures.
- **Bottom panel tabs:** Swipeable horizontal tab bar with dots indicator. Active tab centered.
- **Monaco editor:** Progressive loading (see 5.3). Mobile adaptations: no minimap, word wrap on, reduced font size, no line numbers.
- **Terminal:** Compact header, 12px font, adaptive columns/rows.
- **Touch targets:** Minimum 44x44px on all interactive elements.

### 3.3 Mobile Tab Bar

- All bottom panel tabs visible in a horizontally swipeable strip.
- Active tab visually centered with scroll-snap.
- Dots indicator showing total tab count and current position.
- Tab order: Terminal, Preview, Claude AI, Git, Help.

---

## 4. Service Architecture

### 4.1 Progressive Boot Sequence

**Critical (block render):**
1. FileSystem (LightningFS) initialization
2. Database (Dexie) initialization

**Important (boot early, show progress):**
3. WebContainer boot (show progress bar in terminal panel)

**Lazy (boot on demand):**
4. Git service (initializes when user opens git panel or `.git` exists)
5. AI service (initializes when user opens AI panel or enters a prompt)
6. Sentry (initializes based on user opt-in setting)

**Boot UI:**
- Render skeleton UI immediately with core layout.
- Show loading states inline for each panel/feature.
- Features enable as their services become ready.
- Status indicators in status bar showing service health.

### 4.2 Error Recovery

**Decision:** Auto-retry with exponential backoff + graceful degradation.

- Failed services retry automatically: 3 attempts, exponential backoff (1s, 2s, 4s).
- Show retry progress indicator (attempt 1/3, 2/3, etc.).
- After max retries, degrade gracefully:
  - Disable the feature that depends on the failed service.
  - Show a dismissible banner explaining what's unavailable.
  - Provide a manual "Retry" button.
- Log all failures to Sentry (if available) for monitoring.

### 4.3 WebContainer Graceful Degradation

When WebContainer is unavailable (unsupported browser, boot failure):

- Terminal provides **file browsing only**: `ls`, `cat`, `cd`, `pwd`, `mkdir`, `touch`, `rm`, `rmdir`, `cp`, `mv`.
- All file browsing commands execute against LightningFS directly.
- Commands requiring WebContainer (`npm`, `node`, `python`, etc.) show: `"This command requires WebContainer which is not available in your browser. Supported: Chrome, Edge, Brave."`
- Preview panel shows: "Preview unavailable - WebContainer required."
- Claude Code file operations still work (via LightningFS), but command execution is disabled.

### 4.4 Offline Support

**Decision:** Active offline detection with UI adaptation.

- Monitor `navigator.onLine` + periodic heartbeat (fetch a small resource every 30s).
- When offline:
  - Show offline indicator in status bar.
  - Hide/disable AI features (Claude Code, AI chat).
  - Enable only local operations: file editing, local git commits, terminal file browsing.
  - Git push/pull disabled with clear message.
- When connection restores:
  - Auto-re-enable features.
  - Show "Back online" toast.
  - No request queuing - failed requests fail, user retries manually.

---

## 5. Performance

### 5.1 Performance Budget

**Target:** Works on 3G connections.

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 5s on 3G |
| Initial bundle | < 3MB |
| Total bundle (all chunks) | < 8MB |
| Time to Interactive | < 7s on 3G |
| Code splitting | Aggressive - load only what's visible |

### 5.2 Code Splitting Strategy

```
Entry chunk:        React, Zustand, core UI components (~200KB)
Monaco chunk:       @monaco-editor/react + languages (~2.5MB, lazy)
Terminal chunk:     @xterm/xterm + addons (~300KB, lazy)
Git chunk:          isomorphic-git + lightning-fs (~400KB, lazy)
AI chunk:           @anthropic-ai/sdk + claude-code (~500KB, lazy)
WebContainer chunk: @webcontainer/api (~200KB, lazy)
Vendor chunk:       date-fns, nanoid, clsx, diff2html (~100KB)
```

### 5.3 Progressive Monaco Loading

1. **Phase 1 (immediate):** Render a basic text editor (textarea with monospace font + basic syntax highlighting via CSS).
2. **Phase 2 (background):** Load Monaco core editor bundle. Swap textarea for Monaco when ready.
3. **Phase 3 (on demand):** Load language-specific features (TypeScript language service, JSON schema validation, etc.) only when a file of that type is opened.
4. Cache all chunks via service worker for instant subsequent loads.

---

## 6. Deployment

### 6.1 Multi-Target Build

**Decision:** Separate builds for different deployment targets.

| Command | Target | Features |
|---------|--------|----------|
| `pnpm build:gh` | GitHub Pages | coi-serviceworker, no PWA SW, `/browser-ide/` base path |
| `pnpm build:full` | Cloudflare/Vercel/self-hosted | Full PWA, native COOP/COEP headers, `/` base path |
| `pnpm build` | Default (full) | Same as `build:full` |

**GitHub Pages build differences:**
- PWA service worker disabled (conflicts with coi-serviceworker).
- `coi-serviceworker.min.js` copied to dist.
- Base path set to `/browser-ide/`.

**Full build differences:**
- PWA service worker enabled with workbox caching.
- COOP/COEP set via server headers (not service worker).
- Base path set to `/`.

### 6.2 CI/CD

- GitHub Actions workflow for:
  - `pnpm type-check` on every PR.
  - `pnpm lint` on every PR.
  - `pnpm test -- --run` on every PR.
  - `pnpm build` on every PR (verify it compiles).
  - Playwright smoke tests on merge to main.
  - Auto-deploy to GitHub Pages on tag/release.

---

## 7. Testing Strategy

### 7.1 Test Pyramid

| Layer | Tool | Coverage Target | Focus |
|-------|------|----------------|-------|
| Unit | Vitest + happy-dom | 80% statements/branches/functions/lines | Services, hooks, utilities |
| Integration | Vitest + real Dexie/LightningFS | Critical paths | Service interactions with real storage |
| E2E (smoke) | Playwright | App loads, editor renders, terminal opens, settings save | Deployment validation |
| E2E (critical paths) | Playwright | File CRUD, terminal commands, Claude Code interaction, git ops | User journey validation |
| Visual regression | Playwright screenshots | Responsive layouts across breakpoints | CSS/layout regression detection |

### 7.2 E2E Critical Paths

1. App boots and renders editor.
2. Create file -> edit -> save -> verify content persists on refresh.
3. Open terminal -> run command -> see output.
4. Claude Code: enter prompt -> see tool calls -> see file changes.
5. Git: init repo -> stage files -> commit -> verify commit log.
6. Responsive: verify layout at xsm, sm, md, lg, xl breakpoints.
7. Settings: change theme -> verify persistence.

---

## 8. Security

### 8.1 Existing (Keep)

- WebContainer command allowlist + argument sanitization.
- CSP headers in vite.config.ts (dev and preview).
- API keys stripped from localStorage persistence.
- Sentry data sanitization (no keys/tokens in error reports).
- `.gitignore` excludes `.env`, credentials, `node_modules`.

### 8.2 New Requirements

- **Web Crypto API key encryption** (see 2.5).
- **CSP nonce for inline scripts** in production build (replace `'unsafe-inline'`).
- **Subresource Integrity (SRI)** for CDN resources.
- **Rate limiting** on AI API calls (client-side throttle: max 10 requests/minute).

---

## 9. Production Hardening Priorities

### P0 - Critical (Must fix before any release)

1. Fix all runtime instability: state persistence, component crashes, service initialization race conditions.
2. Implement progressive boot with FS+DB critical gate.
3. Fix breakpoint inconsistencies (single source of truth).
4. Auto-retry with backoff for failed services.
5. WebContainer graceful degradation (file browsing fallback).
6. Fix all 43 lint warnings.

### P1 - High (Required for production)

7. Split Zustand store into domain stores with subscribe pattern.
8. Implement Web Crypto API key storage.
9. Active offline detection with UI adaptation.
10. Progressive Monaco loading.
11. Separate build targets (GH Pages vs full).
12. CI/CD pipeline (GitHub Actions).
13. E2E smoke tests + critical path tests.

### P2 - Important (Required for Claude Code)

14. Real Claude Code SDK integration via WebContainer.
15. Unified AI panel (chat + agent).
16. Interactive tool call cards.
17. Monaco DiffEditor for Claude file edits.
18. Dedicated Claude terminal tab.

### P3 - Polish (Post-launch improvements)

19. Swipeable mobile tab bar with dots indicator.
20. Visual regression tests.
21. Integration tests with real Dexie/LightningFS.
22. Performance monitoring + bundle size tracking.
23. CSP nonce for production inline scripts.

---

## 10. User Guide / Help Documentation

### 10.1 Requirement

The IDE must include an easily accessible, in-app user guide that explains how to use all features. The guide should be understandable by any developer familiar with IDEs (VS Code, JetBrains, etc.) without requiring knowledge of this specific codebase.

### 10.2 Content Outline

The guide should cover:

1. **Getting Started** - First-time setup, creating a project, opening files.
2. **File Explorer** - Creating, renaming, deleting files/folders. Drag and drop. Context menus.
3. **Editor** - Multi-tab editing, syntax highlighting, keyboard shortcuts, split view.
4. **Terminal** - Built-in terminal usage, available commands, WebContainer limitations.
5. **Git Integration** - Cloning repos, staging changes, committing, pushing/pulling, branch management.
6. **AI Assistant** - Setting up API keys, starting AI chat sessions, message branching, Claude Code features.
7. **Project Management** - Multi-project support, switching projects, project settings.
8. **Keyboard Shortcuts** - Complete shortcut reference (Ctrl/Cmd+P command palette, Ctrl/Cmd+S save, etc.).
9. **Offline Mode** - What works offline (local editing, git commits) vs what doesn't (AI, remote git).
10. **Troubleshooting** - Common issues (WebContainer not loading, API key errors, browser compatibility).

### 10.3 Accessibility

- **Help Panel** (`?` icon or `Ctrl/Cmd+Shift+H`): Opens a searchable help panel within the IDE.
- **Contextual tooltips**: Key UI elements have tooltips explaining their function.
- **First-run walkthrough**: Optional guided tour on first visit highlighting main features.
- **Command Palette integration**: `Help: ...` commands discoverable via `Ctrl/Cmd+P`.

### 10.4 Implementation

- Content stored as structured data (not external docs) so it works offline.
- Rendered in the existing HelpPanel component with markdown support.
- Searchable - users can filter help topics by keyword.
- Mobile-responsive layout for the help panel.

---

## 11. Non-Goals

- No URL routing. Single-page app with internal state.
- No swipe gestures for sidebar (tap only).
- No backend server. Fully client-side.
- No multi-user collaboration.
- No cloud file storage (all local IndexedDB).
- No request queuing when offline.

---

**Last Updated:** February 20, 2026
