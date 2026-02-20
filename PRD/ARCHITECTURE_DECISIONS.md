# Architecture Decision Records (ADR)

## Browser IDE - Key Technical Decisions

**Document Version:** 1.0
**Created:** February 2026
**Purpose:** Document key architectural decisions and their rationale

---

## Table of Contents

1. [ADR-001: Frontend Framework](#adr-001-frontend-framework)
2. [ADR-002: State Management](#adr-002-state-management)
3. [ADR-003: File System Implementation](#adr-003-file-system-implementation)
4. [ADR-004: Git Implementation](#adr-004-git-implementation)
5. [ADR-005: Code Editor](#adr-005-code-editor)
6. [ADR-006: Terminal Implementation](#adr-006-terminal-implementation)
7. [ADR-007: Database Layer](#adr-007-database-layer)
8. [ADR-008: Testing Framework](#adr-008-testing-framework)
9. [ADR-009: E2E Testing](#adr-009-e2e-testing)
10. [ADR-010: AI Provider Architecture](#adr-010-ai-provider-architecture)
11. [ADR-011: Build System](#adr-011-build-system)
12. [ADR-012: Styling Approach](#adr-012-styling-approach)
13. [ADR-013: Package Manager](#adr-013-package-manager)
14. [ADR-014: Node.js Runtime](#adr-014-nodejs-runtime)
15. [ADR-015: Service Layer Pattern](#adr-015-service-layer-pattern)

---

## ADR-001: Frontend Framework

### Status
**ACCEPTED**

### Context
We need a frontend framework for building the Browser IDE user interface. The application requires:
- Component-based architecture
- Good TypeScript support
- Large ecosystem
- Strong performance
- Developer experience

### Decision
**Use React 18+ with TypeScript**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **React 18** | Largest ecosystem, TypeScript support, Concurrent features, Monaco integration | Larger bundle, Not reactive by default |
| Vue 3 | Smaller bundle, Good DX, Composition API | Smaller ecosystem, Monaco integration less mature |
| Svelte | Smallest bundle, Best performance | Smaller ecosystem, Less TypeScript support |
| Solid.js | React-like with fine-grained reactivity | Very new, Small ecosystem |

### Rationale
- React has the largest ecosystem of compatible libraries
- Monaco Editor has first-class React integration
- TypeScript support is mature and well-documented
- Team familiarity with React
- Concurrent features (Suspense, Transitions) useful for IDE

### Consequences
- Larger initial bundle size (~40KB gzipped for React alone)
- Need to manage re-renders carefully
- Access to vast ecosystem of React components

---

## ADR-002: State Management

### Status
**ACCEPTED**

### Context
The IDE needs global state management for:
- Current project and open files
- Editor state (active file, cursor position)
- Git state (status, branches)
- AI session state
- Settings and preferences

### Decision
**Use Zustand with persist middleware**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Zustand** | Simple API, Small (~1KB), Built-in persistence, TypeScript | Less structured than Redux |
| Redux Toolkit | Mature, DevTools, Large community | Boilerplate, Overhead for this project |
| Jotai | Atomic, Fine-grained updates | Less suited for complex state |
| React Context | Built-in, No dependency | Performance issues with frequent updates |
| MobX | Automatic tracking, Less boilerplate | Magic, Harder to debug |

### Rationale
- Zustand's simplicity matches our needs
- Built-in `persist` middleware for localStorage synchronization
- Minimal boilerplate compared to Redux
- Excellent TypeScript support
- Easy to test (just functions)

### Consequences
- Single monolithic store (can split later if needed)
- Need to use selectors to prevent unnecessary re-renders
- Less strict structure than Redux (team discipline required)

### Implementation Pattern

```typescript
// src/store/useIDEStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IDEState {
  // State
  currentProject: string | null;
  openFiles: string[];

  // Actions
  setCurrentProject: (id: string) => void;
  openFile: (path: string) => void;
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      openFiles: [],

      setCurrentProject: (id) => set({ currentProject: id }),
      openFile: (path) => {
        const { openFiles } = get();
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path] });
        }
      },
    }),
    { name: 'ide-storage' }
  )
);
```

---

## ADR-003: File System Implementation

### Status
**ACCEPTED**

### Context
The IDE needs a virtual file system that:
- Persists data in the browser
- Works with isomorphic-git
- Supports standard file operations
- Handles concurrent access

### Decision
**Use LightningFS with IndexedDB backend**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **LightningFS** | isomorphic-git compatible, IndexedDB, Maintained | Less features than BrowserFS |
| BrowserFS | Many backends, Feature-rich | Larger, Less maintained, Not git-compatible |
| OPFS (Origin Private File System) | Native browser API, Fast | Limited browser support, Not git-compatible |
| Custom Implementation | Full control | Development time, Bug risk |

### Rationale
- LightningFS is specifically designed for isomorphic-git
- Uses IndexedDB for persistence (good quota limits)
- Simple API similar to Node.js fs
- Well-maintained and documented

### Consequences
- Tied to LightningFS API
- Limited to browsers with IndexedDB support
- File operations are async-only

### Implementation Pattern

```typescript
// src/services/filesystem.ts
import LightningFS from '@isomorphic-git/lightning-fs';

class FileSystemService {
  private fs: LightningFS | null = null;

  async init(projectId: string): Promise<void> {
    this.fs = new LightningFS(`project-${projectId}`);
  }

  async readFile(path: string): Promise<Result<string>> {
    try {
      const content = await this.fs!.promises.readFile(path, 'utf8');
      return { success: true, data: content as string };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

export const fileSystem = new FileSystemService();
```

---

## ADR-004: Git Implementation

### Status
**ACCEPTED**

### Context
The IDE needs full Git functionality in the browser:
- Clone repositories
- Commit, push, pull
- Branch management
- Status and diff

### Decision
**Use isomorphic-git with CORS proxy**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **isomorphic-git** | Pure JS, Full Git, LightningFS compatible | Needs CORS proxy for remote |
| libgit2 WASM | Real Git binary, All features | Large (~5MB), Complex setup |
| git-js | Node.js API | Not browser-compatible |
| Custom Git client | Full control | Enormous development effort |

### Rationale
- isomorphic-git is purpose-built for browser Git
- Works seamlessly with LightningFS
- Pure JavaScript (no WASM dependencies)
- Active maintenance and good documentation

### Consequences
- Requires CORS proxy for GitHub operations
- Some advanced Git features may be missing
- Performance may lag behind native Git for large repos

### CORS Proxy Configuration

```typescript
// src/services/git.ts
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';

const CORS_PROXY = 'https://cors.isomorphic-git.org';

async function clone(url: string, dir: string): Promise<void> {
  await git.clone({
    fs: fileSystem.getFS(),
    http,
    dir,
    url,
    corsProxy: CORS_PROXY,
    singleBranch: true,
    depth: 1,
  });
}
```

---

## ADR-005: Code Editor

### Status
**ACCEPTED**

### Context
The IDE needs a professional code editor with:
- Syntax highlighting for many languages
- IntelliSense and auto-completion
- VS Code-like experience
- Keyboard shortcuts

### Decision
**Use Monaco Editor**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Monaco Editor** | VS Code engine, Full features, TypeScript support | Large (~2MB), Complex API |
| CodeMirror 6 | Lightweight, Modern, Extensible | Less IntelliSense, More setup |
| Ace Editor | Mature, Stable | Older, Less features |
| Custom Editor | Full control | Enormous effort |

### Rationale
- Monaco is the actual VS Code editor engine
- Best-in-class IntelliSense for TypeScript/JavaScript
- Familiar to developers using VS Code
- Extensive theming and customization

### Consequences
- Large bundle size impact (~2MB)
- Web Worker setup required for IntelliSense
- Complex configuration for advanced features

### Configuration

```typescript
// src/components/IDE/Editor.tsx
import * as monaco from 'monaco-editor';
import { useEffect, useRef } from 'react';

function Editor({ content, language, onChange }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: content,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        fontSize: 14,
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current!.getValue());
      });
    }

    return () => editorRef.current?.dispose();
  }, []);

  return <div ref={containerRef} style={{ height: '100%' }} />;
}
```

---

## ADR-006: Terminal Implementation

### Status
**ACCEPTED**

### Context
The IDE needs a terminal emulator for:
- Shell command execution
- ANSI color support
- Keyboard input handling
- Resizable layout

### Decision
**Use xterm.js with custom shell interpreter**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **xterm.js** | Industry standard, Full ANSI, Addons | Requires shell implementation |
| Hyper Terminal | Beautiful, Extensible | Desktop-focused, Heavy |
| Custom Canvas | Full control | Enormous effort |

### Rationale
- xterm.js is the de facto standard for web terminals
- Used by VS Code, Hyper, and many others
- Excellent addon ecosystem (fit, web-links, etc.)
- Full ANSI escape code support

### Consequences
- Need to implement shell command interpreter
- Terminal session management complexity
- Integration with WebContainers for npm commands

### Configuration

```typescript
// src/components/IDE/Terminal.tsx
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';

function TerminalComponent({ onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current!);
    fitAddon.fit();

    return () => term.dispose();
  }, []);

  return <div ref={terminalRef} style={{ height: '100%' }} />;
}
```

---

## ADR-007: Database Layer

### Status
**ACCEPTED**

### Context
The IDE needs persistent storage for:
- Project metadata
- Settings and preferences
- AI session history
- Git credentials (encrypted)

### Decision
**Use Dexie.js (IndexedDB wrapper)**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Dexie.js** | TypeScript, Reactive, Simple API | Another dependency |
| Raw IndexedDB | No dependency, Native | Complex API, Verbose |
| localForage | Simple API, Fallbacks | Less TypeScript support |
| PouchDB | Sync capabilities | Heavier, CouchDB-focused |

### Rationale
- Dexie provides excellent TypeScript support
- Simpler API than raw IndexedDB
- `useLiveQuery` hook for reactive data
- Built-in migration support

### Consequences
- Additional dependency (~30KB)
- Learning curve for Dexie API
- Tied to Dexie's abstractions

### Schema Definition

```typescript
// src/lib/database.ts
import Dexie, { Table } from 'dexie';

interface DBProject {
  id: string;
  name: string;
  createdAt: number;
  lastOpened: number;
}

interface DBSettings {
  id: string;
  value: unknown;
}

class BrowserIDEDatabase extends Dexie {
  projects!: Table<DBProject>;
  settings!: Table<DBSettings>;

  constructor() {
    super('browser-ide');
    this.version(1).stores({
      projects: 'id, name, lastOpened',
      settings: 'id',
    });
  }
}

export const db = new BrowserIDEDatabase();
```

---

## ADR-008: Testing Framework

### Status
**ACCEPTED**

### Context
The project needs a testing framework for:
- Unit tests
- Component tests
- Integration tests
- Fast feedback loop

### Decision
**Use Vitest with Testing Library**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Vitest** | Native ESM, Vite integration, Fast | Newer, Less documentation |
| Jest | Mature, Large ecosystem | Slow, ESM issues |
| Mocha + Chai | Flexible, Mature | More setup required |

### Rationale
- Vitest has native ESM support (no transpilation)
- Integrates seamlessly with Vite (same config)
- Much faster than Jest (especially watch mode)
- Compatible with Jest API (easy migration)

### Consequences
- Newer ecosystem than Jest
- Some Jest plugins may not work
- Team needs to learn Vitest-specific features

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

---

## ADR-009: E2E Testing

### Status
**ACCEPTED**

### Context
The project needs E2E testing that:
- Tests full user workflows
- Works across browsers
- Supports mobile viewports
- Integrates with MCP for AI-driven testing

### Decision
**Use Playwright**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Playwright** | Cross-browser, Auto-wait, MCP support | Newer |
| Cypress | Great DX, Time travel | Chromium-only, No MCP |
| Puppeteer | Chrome DevTools Protocol | Chrome only |
| Selenium | Mature, All browsers | Slow, Complex |

### Rationale
- Playwright supports all major browsers
- Built-in auto-waiting reduces flaky tests
- Excellent API for mobile testing
- MCP integration for AI-driven testing
- Parallel execution out of the box

### Consequences
- Team needs to learn Playwright API
- Slightly different from Cypress patterns
- Requires browser installation in CI

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['json', { outputFile: 'results.json' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## ADR-010: AI Provider Architecture

### Status
**ACCEPTED**

### Context
The IDE needs to support multiple AI providers:
- Anthropic Claude
- Z.AI GLM
- Potential future providers

### Decision
**Use Provider abstraction with registry pattern**

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AIProviderRegistry                        │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Anthropic  │  │    GLM      │  │   Future    │        │
│  │  Provider   │  │  Provider   │  │  Provider   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                  │
│                    AIProvider                               │
│                    Interface                                │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/services/ai-providers.ts
interface AIProvider {
  id: string;
  name: string;
  complete(messages: Message[], config: Config): Promise<Response>;
  streamComplete(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}

class AIProviderRegistry {
  private providers = new Map<string, AIProvider>();
  private activeId: string = 'anthropic';

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  setActive(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Provider ${id} not registered`);
    }
    this.activeId = id;
  }

  getActive(): AIProvider {
    return this.providers.get(this.activeId)!;
  }
}

export const aiRegistry = new AIProviderRegistry();
```

### Rationale
- Clean abstraction allows easy provider switching
- New providers can be added without changing consumer code
- Consistent API regardless of backend

---

## ADR-011: Build System

### Status
**ACCEPTED**

### Context
The project needs a build system for:
- Development server with HMR
- Production builds
- TypeScript compilation
- Asset optimization

### Decision
**Use Vite 5+**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Vite** | Fast HMR, Native ESM, Simple config | Rollup under hood |
| webpack | Mature, Flexible, Large ecosystem | Slow, Complex config |
| Parcel | Zero config, Fast | Less control |
| esbuild | Fastest, Simple | Limited plugins |

### Rationale
- Vite provides instant HMR via native ESM
- Simple configuration compared to webpack
- Built-in TypeScript support
- Optimized production builds via Rollup

### Consequences
- Some webpack plugins may not work
- Rollup plugin ecosystem (different from webpack)
- Team needs to understand Vite-specific patterns

---

## ADR-012: Styling Approach

### Status
**ACCEPTED**

### Context
The project needs a styling solution that:
- Supports responsive design
- Has good DX
- Produces small bundle sizes
- Works well with React

### Decision
**Use Tailwind CSS with clsx**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **Tailwind CSS** | Utility-first, Small bundle, JIT | Learning curve |
| CSS Modules | Scoped, Standard CSS | More files, Less DX |
| styled-components | Co-located, Dynamic | Runtime cost, Larger bundle |
| Emotion | Flexible, Good DX | Similar to styled-components |

### Rationale
- Tailwind produces smaller bundles (only used utilities)
- Utility-first approach is fast for prototyping
- JIT compiler means no unused CSS in production
- Good integration with Radix UI primitives

### Consequences
- HTML can become verbose with many classes
- Team needs to learn Tailwind utility classes
- Custom design tokens require configuration

---

## ADR-013: Package Manager

### Status
**ACCEPTED**

### Context
The project needs a package manager for:
- Dependency management
- Workspace support (future)
- Fast installation
- Reproducible builds

### Decision
**Use pnpm**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **pnpm** | Fast, Efficient, Strict | Less common |
| npm | Standard, No learning curve | Slower, Larger node_modules |
| yarn | Fast, Good DX | Competition with npm, Berry complexity |
| bun | Fastest, All-in-one | Very new, Less stable |

### Rationale
- pnpm is significantly faster than npm
- Uses symlinks for efficient disk usage
- Strict dependency resolution catches issues early
- Good workspace support for future monorepo

### Consequences
- Team must use pnpm exclusively
- Some scripts may assume npm
- CI must install pnpm

---

## ADR-014: Node.js Runtime

### Status
**ACCEPTED**

### Context
The IDE needs to run Node.js code in the browser for:
- npm/pnpm commands
- Running dev servers
- Executing user code

### Decision
**Use WebContainers (Optional) with graceful degradation**

### Options Considered

| Option | Pros | Cons |
|--------|------|------|
| **WebContainers** | Real Node.js, npm works | Chromium only, Licensing |
| Nodebox | Open source alternative | Less mature |
| Browser-only simulation | No dependency | Limited functionality |
| Server-side execution | Full Node.js | Requires backend |

### Rationale
- WebContainers provide real Node.js in browser
- Fallback to simulation for unsupported browsers
- Optional feature - core IDE works without it

### Consequences
- Limited to Chromium browsers for full functionality
- Need to handle COOP/COEP headers
- Graceful degradation required for Safari/Firefox

---

## ADR-015: Service Layer Pattern

### Status
**ACCEPTED**

### Context
The application needs a service layer for:
- Business logic separation
- Testability
- Reusability across components

### Decision
**Use singleton services with Result pattern**

### Pattern

```typescript
// Service definition
class ServiceName {
  async operation(input: Input): Promise<Result<Output>> {
    try {
      // Business logic
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

// Export singleton
export const serviceName = new ServiceName();
```

### Rationale
- Clear separation between UI and business logic
- Easy to test (mock the service)
- Consistent error handling across application
- Services can be used from components, hooks, and other services

### Consequences
- All async operations return Result type
- Consumers must handle both success and error cases
- Singletons may complicate testing (need reset mechanism)

---

## Decision Summary Table

| # | Area | Decision | Alternatives Rejected |
|---|------|----------|----------------------|
| 001 | Frontend Framework | React 18 | Vue, Svelte, Solid |
| 002 | State Management | Zustand | Redux, Jotai, MobX |
| 003 | File System | LightningFS | BrowserFS, OPFS |
| 004 | Git | isomorphic-git | libgit2 WASM |
| 005 | Code Editor | Monaco | CodeMirror, Ace |
| 006 | Terminal | xterm.js | Hyper, Custom |
| 007 | Database | Dexie.js | Raw IndexedDB, PouchDB |
| 008 | Unit Testing | Vitest | Jest, Mocha |
| 009 | E2E Testing | Playwright | Cypress, Selenium |
| 010 | AI Providers | Registry Pattern | Direct integration |
| 011 | Build System | Vite | webpack, Parcel |
| 012 | Styling | Tailwind CSS | CSS Modules, styled-components |
| 013 | Package Manager | pnpm | npm, yarn |
| 014 | Node.js Runtime | WebContainers | Nodebox, Server-side |
| 015 | Service Layer | Singleton + Result | DI Container, Direct calls |

---

**Document Version:** 1.0
**Last Updated:** February 2026
