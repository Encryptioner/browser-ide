# Agent Specification

## Browser IDE - AI Agent Working Specification

**Document Version:** 1.0
**Created:** March 2026
**Purpose:** Provide a structured, reusable specification for AI agents working on this project
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

Build a **VS Code-like IDE running entirely in the browser** with:
- Monaco Editor for code editing with IntelliSense
- WebContainers for in-browser Node.js runtime and terminal
- AI-assisted development (Chat, Agent, and CLI modes)
- Git integration via isomorphic-git
- IndexedDB persistence via Dexie

Target: Single-page application deployed to GitHub Pages, works on desktop and mobile browsers.

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Language | TypeScript | 5.3+ (strict mode) |
| Framework | React | 18.2+ |
| Build Tool | Vite | 5.0+ |
| State Management | Zustand | 4.4+ |
| Database | Dexie (IndexedDB) | 3.2+ |
| Editor | Monaco Editor | Latest |
| Runtime | WebContainers API | Latest |
| Unit Testing | Vitest + happy-dom | Latest |
| E2E Testing | Playwright | Latest |
| Styling | Tailwind CSS | Latest |
| Package Manager | pnpm | 8.14+ |
| Node | Node.js | ^22.16.0 |

---

## 1. Commands

### Development

```bash
# Start development server
pnpm dev

# Type-check without building
pnpm type-check

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Run all validations (type-check + lint + build)
pnpm validate
```

### Testing

```bash
# Run all unit tests once
pnpm test -- --run

# Run a single test file
pnpm test -- src/services/git.test.ts

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run Playwright E2E tests
pnpm test:e2e
```

### Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## 2. Testing

### Framework Configuration

| Test Type | Framework | Location | Run Command |
|-----------|-----------|----------|-------------|
| Unit | Vitest + happy-dom | `src/**/*.test.ts` | `pnpm test -- --run` |
| Component | Vitest + React Testing Library | `src/**/*.test.tsx` | `pnpm test -- --run` |
| Integration | Vitest | `tests/integration/**/*.test.ts` | `pnpm test -- --run` |
| E2E | Playwright | `tests/e2e/` | `pnpm test:e2e` |

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
it('should create a project when input is valid', async () => {
  // Arrange - Set up test data
  const input = { name: 'my-project', template: 'react-ts' };

  // Act - Execute the operation
  const result = await fileSystem.createProject(input);

  // Assert - Verify the outcome
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject(input);
});
```

### E2E Test Data Attributes

Always use `data-testid` for E2E selectors:

```tsx
<button data-testid="save-button">Save</button>
```

```typescript
// Playwright test
await page.click('[data-testid="save-button"]');
```

---

## 3. Project Structure

```
browser-ide/
src/
  components/
    IDE/                    # Main IDE layout components
      AIPanel.tsx           # AI chat/agent panel
      ClaudeCodePanel.tsx   # Claude CLI wrapper
      Editor.tsx            # Monaco editor
      FileExplorer.tsx      # File tree sidebar
      Terminal.tsx           # Terminal panel
    claude-cli/
      ClaudeCLI.tsx         # xterm.js Claude CLI terminal
    ui/                     # Reusable UI components
  hooks/                    # React hooks (useMediaQuery, etc.)
  lib/
    database.ts             # Dexie IndexedDB wrapper
  services/
    ai-providers.ts         # AI provider registry (Anthropic, OpenAI, GLM)
    claude-agent.ts         # Claude agentic tool-calling service
    claude-cli.ts           # Claude CLI streaming service
    filesystem.ts           # Virtual filesystem operations
    git.ts                  # isomorphic-git wrapper
    webcontainer.ts         # WebContainers API wrapper
    crypto.ts               # Encryption for API keys
    linter.ts               # Code linting service
    intellisense.ts         # IntelliSense/autocomplete
  store/
    useIDEStore.ts          # Primary Zustand store (monolithic)
    slices/                 # Store slices (settings, AI, UI, etc.)
    types.ts                # Store type definitions
  types/
    index.ts                # All TypeScript interfaces (single source of truth)
  utils/
    logger.ts               # Structured logger (replaces console.log)
  App.tsx                   # Main application component
docs/
  Agent/                    # AI agent specifications (this directory)
  plans/                    # Design documents
tests/
  integration/              # Cross-service integration tests
  e2e/                      # Playwright E2E tests
  setup.ts                  # Test setup (jest-dom, cleanup)
vite.config.ts              # Build config, COOP/COEP headers, CSP
vitest.config.ts            # Test configuration
playwright.config.ts        # E2E test configuration
```

### Key Path Rules

| Rule | Example |
|------|---------|
| Use `@/` path alias for all imports | `import { useIDEStore } from '@/store/useIDEStore'` |
| Never use deep relative imports | No `../../../` |
| All types in single source of truth | `import type { AIMessage } from '@/types'` |
| Co-locate tests with source | `filesystem.ts` + `filesystem.test.ts` |
| Services are singletons | `export const fileSystem = new FileSystem()` |

---

## 4. Code Style

### TypeScript

```typescript
// GOOD: Explicit types, no `any`
function calculateSum(a: number, b: number): number {
  return a + b;
}

// BAD: Implicit return, any type
function calculate(a, b) {
  return a + b;
}
```

### Service Layer Pattern — Singleton with Result Type

```typescript
// Services return { success: boolean, data?: T, error?: string }
class FileSystem {
  async readFile(path: string): Promise<APIResponse<string>> {
    try {
      const content = await this.fs.readFile(path, 'utf-8');
      return { success: true, data: content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton
export const fileSystem = new FileSystem();
```

### React Component Patterns

```typescript
interface FileExplorerProps {
  projectId: string;
  className?: string;
  onFileSelect: (path: string) => void;
}

function FileExplorer({ projectId, className, onFileSelect }: FileExplorerProps): JSX.Element {
  const { files } = useIDEStore(useShallow(state => ({
    files: state.files,
  })));

  return (
    <div data-testid="file-explorer" className={clsx('file-explorer', className)}>
      {/* ... */}
    </div>
  );
}
```

### State Management — Zustand

```typescript
// Single monolithic store with slices
// Use useShallow for performance
const { activeFile, openFiles } = useIDEStore(useShallow(state => ({
  activeFile: state.activeFile,
  openFiles: state.openFiles,
})));
```

### Error Handling

```typescript
// Services return Result type, never throw
// Use logger utility (not console.log)
import { logger } from '@/utils/logger';

logger.info('File saved successfully');
logger.error('Failed to read file:', error);

// Use sonner for user-facing notifications
import { toast } from 'sonner';
toast.success('File saved');
toast.error('Failed to save file');
```

---

## 5. Git Workflow

### Branch Naming

```
feature/<short-description>
bugfix/<short-description>
refactor/<short-description>
docs/<short-description>
chore/<short-description>
dev/<short-description>
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
feat(ai): add streaming support for Claude agent mode

Implement real-time text streaming with tool call tracking
for the agentic Claude Code integration.
```

```
fix(editor): prevent Monaco crash on empty file content

Guard against null content in editor mount lifecycle.
```

### Pre-Commit Verification

Always run before committing:

```bash
pnpm type-check   # Zero type errors
pnpm test -- --run # All tests pass
pnpm lint          # Zero lint errors
```

---

## 6. Boundaries

This section provides a summary of agent boundaries. For the full, detailed boundary definitions, see [AGENT_BOUNDARIES.md](./AGENT_BOUNDARIES.md).

### Three-Tier Boundary System

#### ALWAYS DO (Auto-approved)

| Action | Reason |
|--------|--------|
| Run tests after code changes | Verify no regressions |
| Run type-check after TypeScript changes | Catch type errors early |
| Run lint before commits | Maintain code quality |
| Add `data-testid` to interactive elements | Enable E2E testing |
| Use `@/` path alias for imports | Consistent imports |
| Use `logger` utility (not `console.log`) | Proper logging |
| Use `sonner` for toast notifications | Consistent UX |
| Create tests for new code | Maintain 80% coverage |
| Return `APIResponse<T>` from services | Consistent error handling |
| Use `useShallow` for Zustand selectors | Prevent unnecessary re-renders |

#### ASK FIRST (Requires Human Review)

| Action | Why Ask |
|--------|---------|
| Modify Dexie database schema | Data migration impact |
| Modify Zustand store structure | State persistence impact |
| Update package.json dependencies | Compatibility concerns |
| Modify vite.config.ts (CSP, COOP/COEP) | Security headers impact |
| Modify WebContainers command allowlist | Security implications |
| Change AI provider API integration | External service impact |
| Modify encryption/secrets handling | Security critical |

#### NEVER DO (Hard Stops)

| Action | Consequence |
|--------|-------------|
| Commit API keys or secrets | Security breach |
| Commit to `main`/`master` directly | Bypass PR review |
| Use `any` type in production code | Type safety violation |
| Use `console.log` in production code | Use logger instead |
| Skip error handling in async code | Unhandled rejections |
| Edit `node_modules/` | Temporary, lost on install |
| Remove existing tests without reason | Coverage regression |
| Force push to shared branches | History loss |
| Use npm or yarn (pnpm only) | Package manager consistency |

---

## Modular Prompt Strategy

### Phase-Based Approach

```
Phase 1: Core IDE Foundation
  Editor, file explorer, terminal, basic layout

Phase 2: AI Integration
  Chat mode, agent mode, Claude CLI, provider registry

Phase 3: Git & Collaboration
  Git operations, source control panel, diff viewer

Phase 4: WebContainers & Runtime
  In-browser Node.js, package management, process management

Phase 5: Polish & Mobile
  Responsive design, keyboard shortcuts, settings, help
```

### Per-Task Context

When working on a specific task, provide only:
1. **This spec's relevant section** (e.g., Code Style, Testing)
2. **The specific requirement** being implemented
3. **Related type definitions** from `src/types/index.ts`
4. **Existing patterns** to follow from the codebase

### Self-Verification Prompts

After generating code, the agent should verify:

```markdown
1. Are all types explicit (no `any` in production code)?
2. Did I write tests (unit/component)?
3. Are `data-testid` attributes added for testable elements?
4. Am I using `logger` utility (no raw console)?
5. Am I using `useShallow` for Zustand selectors?
6. Do services return `APIResponse<T>`?
7. Am I using `@/` path aliases?
8. Does the code pass `pnpm type-check`?
9. Does the code pass `pnpm lint`?
10. Do the tests pass with `pnpm test -- --run`?
```

---

**This spec is a living artifact. Update it when learning new patterns or discovering issues.**
