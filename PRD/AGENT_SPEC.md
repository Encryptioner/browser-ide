# Agent Specification

## Browser IDE - AI Agent Working Specification

**Document Version:** 1.0
**Created:** February 2026
**Purpose:** Provide a structured specification for AI agents working on this project
**Reference:** Based on [Addy Osmani's Good Spec Principles](https://addyosmani.com/blog/good-spec/)

---

## Quick Reference

This spec follows the **Six Essential Sections** structure:
1. [Commands](#1-commands)
2. [Testing](#2-testing)
3. [Project Structure](#3-project-structure)
4. [Code Style](#4-code-style)
5. [Git Workflow](#5-git-workflow)
6. [Boundaries](#6-boundaries)

---

## Objective

Build a **browser-only IDE** with:
- Full file system using LightningFS + IndexedDB
- Git integration via isomorphic-git
- Multi-LLM support (Anthropic Claude, Z.AI GLM)
- Monaco Editor with TypeScript IntelliSense
- xterm.js terminal with shell command interpreter
- Mobile-first responsive design

**Target:** Small-to-medium repositories (0-300MB recommended)

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Language | TypeScript | 5.3+ |
| Framework | React | 18.2+ |
| Build | Vite | 5.0+ |
| State | Zustand | 4.4+ |
| Database | Dexie.js | 3.2+ |
| Editor | Monaco Editor | Latest |
| Terminal | xterm.js | 5.0+ |
| Git | isomorphic-git | 1.24+ |
| File System | LightningFS | Latest |
| Testing | Vitest + Playwright | Latest |
| Styling | Tailwind CSS | 3.4+ |
| Package Manager | pnpm | 8.14+ |

---

## 1. Commands

### Development

```bash
# Start development server (localhost:5173)
pnpm dev

# Start with network access (for mobile testing)
pnpm dev:mobile
```

### Testing

```bash
# Run unit tests
pnpm test

# Run unit tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run E2E tests with Playwright
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run mobile-specific E2E tests
pnpm test:e2e:mobile
```

### Quality Checks

```bash
# Type check without emitting
pnpm type-check

# Type check in watch mode
pnpm type-check:watch

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check

# Run all validations (type-check + lint + build)
pnpm validate
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview

# Deploy to GitHub Pages
pnpm deploy
```

### Maintenance

```bash
# Clean build artifacts
pnpm clean

# Clean everything including node_modules
pnpm clean:all
```

---

## 2. Testing

### Framework Configuration

| Test Type | Framework | Location | Run Command |
|-----------|-----------|----------|-------------|
| Unit | Vitest | `src/**/*.test.ts` | `pnpm test` |
| Component | Vitest + RTL | `src/**/*.test.tsx` | `pnpm test` |
| Integration | Vitest | `tests/integration/` | `pnpm test` |
| E2E | Playwright | `tests/e2e/` | `pnpm test:e2e` |
| Performance | Playwright | `tests/performance/` | `pnpm test:e2e` |

### Coverage Requirements

```
Statements: 80% minimum
Branches:   80% minimum
Functions:  80% minimum
Lines:      80% minimum
```

### Test Naming Convention

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return file content when file exists', async () => {});
it('should throw error when path is invalid', async () => {});
```

### Test Structure (AAA Pattern)

```typescript
it('should create file when path is valid', async () => {
  // Arrange - Set up test data
  const path = '/test.txt';
  const content = 'Hello, World!';

  // Act - Execute the operation
  const result = await fileSystem.writeFile(path, content);

  // Assert - Verify the outcome
  expect(result.success).toBe(true);
  expect(await fileSystem.exists(path)).toBe(true);
});
```

### E2E Test Data Attributes

Always use `data-testid` for E2E selectors:

```tsx
// Component
<button data-testid="save-button">Save</button>

// Playwright test
await page.click('[data-testid="save-button"]');
```

---

## 3. Project Structure

```
browser-ide/
├── src/
│   ├── components/           # React components
│   │   ├── IDE/             # Main IDE components
│   │   │   ├── Editor.tsx
│   │   │   ├── Editor.test.tsx
│   │   │   └── index.ts
│   │   ├── Git/             # Git-related components
│   │   ├── common/          # Shared/reusable components
│   │   └── claude-cli/      # AI integration UI
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useFileSystem.ts
│   │   └── useFileSystem.test.ts
│   │
│   ├── services/            # Business logic (singletons)
│   │   ├── filesystem.ts    # → export const fileSystem
│   │   ├── git.ts          # → export const gitService
│   │   ├── webcontainer.ts # → export const webContainer
│   │   ├── ai-providers.ts # → export const aiRegistry
│   │   └── claude-agent.ts # → export const claudeAgent
│   │
│   ├── store/               # Zustand stores
│   │   ├── useIDEStore.ts   # Main IDE state
│   │   └── useWorkspaceStore.ts
│   │
│   ├── types/               # TypeScript types
│   │   └── index.ts         # ALL types defined here
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Logging utility
│   │   └── formatters.ts
│   │
│   ├── lib/                 # External library wrappers
│   │   └── database.ts      # Dexie database
│   │
│   └── App.tsx              # Root component
│
├── tests/
│   ├── integration/         # Cross-service tests
│   ├── e2e/                 # Playwright E2E tests
│   ├── performance/         # Performance tests
│   └── fixtures/            # Test data and helpers
│
├── PRD/                     # Product requirements
│   ├── PROJECT_REQUIREMENT.md
│   ├── TDD_APPROACH.md
│   ├── AGENT_SPEC.md        # This file
│   └── ...
│
├── public/                  # Static assets
├── dist/                    # Build output (gitignored)
│
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Key Path Rules

| Rule | Example |
|------|---------|
| Use `@/` alias | `import { fileSystem } from '@/services/filesystem'` |
| Types in `src/types/index.ts` | `import type { FileNode } from '@/types'` |
| Co-locate tests | `Editor.tsx` + `Editor.test.tsx` in same folder |
| Services are singletons | `export const fileSystem = new FileSystemService()` |

---

## 4. Code Style

### TypeScript

```typescript
// ✅ GOOD: Explicit types, no `any`
function calculateSum(a: number, b: number): number {
  return a + b;
}

// ❌ BAD: Implicit return, any type
function calculate(a, b) {
  return a + b;
}
```

### Result Pattern for Services

```typescript
// All service methods return Result<T>
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Example
async function readFile(path: string): Promise<Result<string>> {
  try {
    const content = await fs.readFile(path, 'utf8');
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### React Components

```typescript
// ✅ GOOD: Typed props, functional component
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  isDisabled?: boolean;
}

function Button({ onClick, children, isDisabled = false }: ButtonProps): JSX.Element {
  return (
    <button
      data-testid="action-button"
      onClick={onClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
}
```

### Zustand Store

```typescript
// ✅ GOOD: Typed state and actions
interface IDEState {
  currentFile: string | null;
  openFiles: string[];
  openFile: (path: string) => void;
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      currentFile: null,
      openFiles: [],
      openFile: (path) => {
        const { openFiles } = get();
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path], currentFile: path });
        }
      },
    }),
    { name: 'ide-storage' }
  )
);
```

### Error Handling

```typescript
// ✅ GOOD: Use logger, try-catch, toast for user feedback
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

async function saveFile(path: string, content: string): Promise<void> {
  try {
    const result = await fileSystem.writeFile(path, content);
    if (result.success) {
      toast.success('File saved');
    } else {
      toast.error(`Save failed: ${result.error}`);
      logger.error('File save failed', { path, error: result.error });
    }
  } catch (error) {
    logger.error('Unexpected error saving file', error);
    toast.error('An unexpected error occurred');
  }
}

// ❌ BAD: console.log, unhandled errors
async function saveFile(path, content) {
  console.log('Saving file...');
  await fileSystem.writeFile(path, content);
}
```

---

## 5. Git Workflow

### Branch Naming

```
feature/FR-FS-001-virtual-filesystem
feature/FR-GIT-005-commit-message
bugfix/terminal-scroll-issue
refactor/improve-editor-performance
docs/update-readme
chore/upgrade-dependencies
test/add-filesystem-tests
```

### Commit Message Format

```
<type>(<scope>): <short description>

<longer description if needed>

<footer with references>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`

**Examples:**

```
feat(filesystem): implement writeFile method

Add writeFile method to FileSystemService that creates files
and parent directories automatically.

Implements FR-FS-001.05
```

```
fix(terminal): prevent scroll jump after command

The terminal was jumping to top after each command execution.
Fixed by calling scrollToBottom() after output.

Fixes #123
```

### Pull Request Requirements

```markdown
## Description
Brief description of changes.

## Related Requirements
- FR-FS-001: Virtual File System

## Changes
- Implemented readFile method
- Added unit tests
- Updated types

## Checklist
- [ ] Tests pass locally (`pnpm test`)
- [ ] E2E tests pass (`pnpm test:e2e`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Manual testing completed

## Screenshots
(if applicable)
```

### Pre-Commit Verification

Always run before committing:

```bash
pnpm validate  # Runs: type-check + lint + build
pnpm test      # Run tests
```

---

## 6. Boundaries

### Three-Tier Boundary System

#### ✅ ALWAYS DO (Auto-approved)

| Action | Reason |
|--------|--------|
| Run `pnpm test` after code changes | Verify no regressions |
| Run `pnpm type-check` after TypeScript changes | Catch type errors early |
| Run `pnpm lint` before commits | Maintain code quality |
| Add `data-testid` to interactive elements | Enable E2E testing |
| Use `@/` path aliases | Consistent imports |
| Add JSDoc to public functions | Documentation |
| Create tests for new code | Maintain coverage |
| Use Result pattern in services | Consistent error handling |
| Use `logger` instead of `console.log` | Proper logging |

#### ⚠️ ASK FIRST (Requires Human Review)

| Action | Why Ask |
|--------|---------|
| Modify database schema (`src/lib/database.ts`) | Data migration impact |
| Change Zustand store structure | State persistence impact |
| Update package.json dependencies | Compatibility concerns |
| Modify vite.config.ts or tsconfig.json | Build configuration |
| Change CORS proxy settings | Security implications |
| Modify authentication/encryption code | Security critical |
| Delete or rename public APIs | Breaking changes |
| Add new npm packages | Bundle size, licensing |
| Modify GitHub Actions workflows | CI/CD impact |
| Change IndexedDB table structure | Data loss risk |

#### 🚫 NEVER DO (Hard Stops)

| Action | Consequence |
|--------|-------------|
| Commit API keys or secrets | Security breach |
| Commit to `main` directly | Bypass PR review |
| Use `any` type in TypeScript | Type safety violation |
| Use `console.log` in production code | Use logger instead |
| Skip error handling in async code | Unhandled rejections |
| Edit `node_modules/` | Temporary, lost on install |
| Hard-code user data | Privacy violation |
| Disable ESLint rules without approval | Code quality |
| Remove existing tests without reason | Coverage regression |
| Force push to shared branches | History loss |
| Store sensitive data unencrypted | Security breach |
| Make network calls without timeout | Hanging requests |

---

## Modular Prompt Strategy

### Principle: One Task at a Time

Avoid the "curse of instructions" - don't overwhelm with the entire spec at once.

### Phase-Based Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULAR PROMPT FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1: File System                                            │
│  ├── FR-FS-001: Virtual File System                             │
│  ├── FR-FS-002: Folder Structure                                │
│  └── FR-FS-003: IndexedDB Persistence                           │
│                                                                  │
│  Phase 2: Terminal                                               │
│  ├── FR-TERM-001: xterm.js Integration                          │
│  └── FR-TERM-008: Shell Commands                                │
│                                                                  │
│  Phase 3: Git Integration                                        │
│  ├── FR-GIT-001: Clone                                          │
│  ├── FR-GIT-005: Commit                                         │
│  └── FR-GIT-006: Push                                           │
│                                                                  │
│  Phase 4: AI Integration                                         │
│  ├── FR-AI-001: Provider Registry                               │
│  └── FR-AI-016: Chat Panel                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Per-Task Context

When working on a specific task, provide only:

1. **This spec's relevant section** (e.g., Code Style)
2. **The specific requirement** (e.g., FR-FS-001.03)
3. **Related types** from `src/types/index.ts`
4. **Existing patterns** to follow

### Fresh Context Rule

After completing a task:
1. Commit the changes
2. Update AGENTS.md with learnings
3. Start fresh context for next task

---

## Self-Verification Prompts

After generating code, the agent should ask itself:

```markdown
## Self-Check Questions

1. Does this code follow the Result pattern for services?
2. Are all types explicit (no `any`)?
3. Did I add tests for the new code?
4. Are `data-testid` attributes added for testable elements?
5. Am I using `@/` path aliases?
6. Is error handling comprehensive (try-catch)?
7. Am I using `logger` instead of `console.log`?
8. Does the code pass `pnpm type-check`?
9. Does the code pass `pnpm lint`?
10. Do the tests pass with `pnpm test`?
```

---

## Context Management

### For Large Codebases

Use extended table of contents with summaries:

```markdown
## Spec Index

### Section 1: Commands (Lines 50-120)
Summary: All executable commands for dev, test, build

### Section 2: Testing (Lines 121-200)
Summary: Test framework config, coverage requirements

### Section 3: Project Structure (Lines 201-300)
Summary: Directory layout, path rules

...
```

### RAG Integration

When context is limited, retrieve only relevant sections based on:
- Current task's requirement ID (e.g., FR-FS-001)
- Related component paths
- Relevant type definitions

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial spec based on Addy Osmani's Good Spec principles |

---

**This spec is a living artifact. Update it when learning new patterns or discovering issues.**
