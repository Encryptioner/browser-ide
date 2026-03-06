# Coding Standards

## Browser IDE - Development Guidelines

**Document Version:** 1.0
**Created:** March 2026
**Purpose:** Establish consistent coding standards for the Browser IDE project

---

## Table of Contents

1. [TypeScript Standards](#1-typescript-standards)
2. [React Component Standards](#2-react-component-standards)
3. [State Management (Zustand)](#3-state-management-zustand)
4. [Service Layer Patterns](#4-service-layer-patterns)
5. [Error Handling](#5-error-handling)
6. [Testing Standards](#6-testing-standards)
7. [File Organization](#7-file-organization)
8. [Naming Conventions](#8-naming-conventions)
9. [Documentation Standards](#9-documentation-standards)
10. [Git Workflow](#10-git-workflow)
11. [ESLint Configuration](#11-eslint-configuration)
12. [Code Review Checklist](#12-code-review-checklist)
13. [Cross-Cutting Patterns](#13-cross-cutting-patterns)

---

## 1. TypeScript Standards

### 1.1 Strict Mode

TypeScript strict mode is **required**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 1.2 No `any` Types

**NEVER** use `any` in production code. `as any` is acceptable only in test mocks.

```typescript
// BAD
function processData(data: any) {
  return data.value;
}

// GOOD
function processData(data: unknown): string {
  if (isDataObject(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}
```

### 1.3 Type Definitions Location

All shared types live in the single source of truth: `src/types/index.ts`.

```typescript
// src/types/index.ts
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  model?: string;
  parentId: string | null;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Module-specific types that are not shared can live alongside their module.

### 1.4 Type vs Interface

- Use `interface` for objects that may be extended
- Use `type` for unions, intersections, and mapped types

```typescript
// Interface for extendable objects
interface BaseEntity {
  id: string;
  createdAt: number;
}

// Type for unions
type AIProvider = 'anthropic' | 'openai' | 'glm';

// Type for intersections
type FileWithMetadata = FileEntry & { metadata: Record<string, unknown> };
```

---

## 2. React Component Standards

### 2.1 Component Design Principles

- Use **function components** with TypeScript interfaces for props
- Prefer **composition over inheritance**
- Keep components focused on a single responsibility
- Use `data-testid` on interactive elements

```typescript
interface FileExplorerProps {
  projectId: string;
  className?: string;
  onFileSelect: (path: string) => void;
}

function FileExplorer({ projectId, className, onFileSelect }: FileExplorerProps): JSX.Element {
  return (
    <div data-testid="file-explorer" className={clsx('file-explorer', className)}>
      {/* ... */}
    </div>
  );
}
```

### 2.2 Props Typing

Always use explicit TypeScript interfaces for props:

```typescript
interface EditorProps {
  filePath: string;
  content: string;
  language?: string;
  readOnly?: boolean;
  onChange: (content: string) => void;
}

function Editor({ filePath, content, language = 'typescript', readOnly = false, onChange }: EditorProps): JSX.Element {
  // ...
}
```

### 2.3 Hooks

Custom hooks follow the `use` prefix convention:

```typescript
// hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent): void => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

### 2.4 Event Handler Naming

```typescript
// Internal handlers: handle prefix
function handleFileSelect(path: string): void { /* ... */ }
function handleSubmit(): void { /* ... */ }

// Props callbacks: on prefix
interface Props {
  onFileSelect: (path: string) => void;
  onSubmit: () => void;
}
```

### 2.5 Conditional Rendering

Use ternary for simple conditions, early return for complex:

```typescript
// Simple
return isLoading ? <Spinner /> : <Content />;

// Complex - use early returns or extracted components
if (error) return <ErrorState error={error} />;
if (isLoading) return <Spinner />;
return <Content data={data} />;
```

---

## 3. State Management (Zustand)

### 3.1 Store Structure - Monolithic with Slices

The IDE uses a single Zustand store with logical slices:

```typescript
// store/useIDEStore.ts
export const useIDEStore = create<IDEState>()(
  persist(
    (...a) => ({
      ...createFileSlice(...a),
      ...createEditorSlice(...a),
      ...createAISlice(...a),
      ...createSettingsSlice(...a),
      ...createUISlice(...a),
    }),
    {
      name: 'ide-state',
      partialize: (state) => ({
        // Only persist what's needed
        settings: state.settings,
        recentProjects: state.recentProjects,
      }),
    }
  )
);
```

### 3.2 Selector Performance

**Always** use `useShallow` for object selectors to prevent unnecessary re-renders:

```typescript
import { useShallow } from 'zustand/react/shallow';

// BAD - creates new object reference every render
const { activeFile, openFiles } = useIDEStore(state => ({
  activeFile: state.activeFile,
  openFiles: state.openFiles,
}));

// GOOD - useShallow does shallow equality check
const { activeFile, openFiles } = useIDEStore(useShallow(state => ({
  activeFile: state.activeFile,
  openFiles: state.openFiles,
})));

// OK - single primitive selector doesn't need useShallow
const activeFile = useIDEStore(state => state.activeFile);
```

### 3.3 Persisted State

Use `partialize` to control what gets persisted to localStorage:

```typescript
partialize: (state) => ({
  settings: state.settings,
  recentProjects: state.recentProjects,
  // Do NOT persist: activeFile, openFiles, terminal state, AI messages
}),
```

Sensitive data (API keys) goes to encrypted sessionStorage, not the Zustand persist layer.

---

## 4. Service Layer Patterns

### 4.1 Singleton Services with Result Type

Services are exported as singletons and return `APIResponse<T>`:

```typescript
// services/filesystem.ts
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

export const fileSystem = new FileSystem();
```

### 4.2 Service Architecture

```
Components call services; services never call components.
Services return { success, data?, error? }; never throw.
Services are singletons; instantiated once at module level.
```

Key singletons:
- `fileSystem` - Virtual filesystem operations
- `gitService` - isomorphic-git wrapper
- `webContainer` - WebContainers API
- `aiRegistry` - AI provider registry

### 4.3 AI Provider Pattern

AI providers implement the `LLMProvider` interface and are registered in `AIProviderRegistry`:

```typescript
export interface LLMProvider {
  id: string;
  name: string;
  complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>>;
  validateConfig(config: AIProviderConfig): Promise<boolean>;
}

// Usage
const response = await aiRegistry.complete('anthropic', messages, config, onChunk);
```

---

## 5. Error Handling

### 5.1 Service Layer

Services catch errors and return `APIResponse<T>`:

```typescript
async function saveFile(path: string, content: string): Promise<APIResponse<void>> {
  try {
    await this.fs.writeFile(path, content);
    return { success: true };
  } catch (error) {
    logger.error('Failed to save file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### 5.2 Logger Utility

Use the structured `logger` utility from `@/utils/logger`. **Never** use raw `console.log`:

```typescript
import { logger } from '@/utils/logger';

logger.debug('Debug info');
logger.info('File saved successfully');
logger.warn('Deprecated API usage');
logger.error('Failed to read file:', error);
```

### 5.3 User-Facing Notifications

Use `sonner` for toast notifications:

```typescript
import { toast } from 'sonner';

toast.success('File saved successfully');
toast.error('Failed to save file. Please try again.');
```

### 5.4 Component Error Handling

Components check service results and show appropriate feedback:

```typescript
const handleSave = async (): Promise<void> => {
  const result = await fileSystem.writeFile(path, content);
  if (result.success) {
    toast.success('File saved');
  } else {
    toast.error(result.error || 'Failed to save');
  }
};
```

---

## 6. Testing Standards

### 6.1 Test File Location

Tests are co-located with source files:

```
src/
  services/
    filesystem.ts
    filesystem.test.ts      # unit test
    git.ts
    git.test.ts
  components/
    IDE/
      Editor.tsx
      Editor.test.tsx
tests/
  integration/              # cross-service integration tests
  e2e/                      # Playwright E2E tests
  setup.ts                  # test setup (jest-dom, cleanup)
```

### 6.2 Test Structure (AAA Pattern)

```typescript
describe('FileSystem', () => {
  describe('readFile', () => {
    it('should return file content when file exists', async () => {
      // Arrange
      const path = '/test/file.ts';
      await fileSystem.writeFile(path, 'const x = 1;');

      // Act
      const result = await fileSystem.readFile(path);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('const x = 1;');
    });

    it('should return error when file does not exist', async () => {
      // Act
      const result = await fileSystem.readFile('/nonexistent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### 6.3 Mock Strategy

Mock external dependencies, not the code under test:

```typescript
// Mock WebContainers API
vi.mock('@webcontainer/api', () => ({
  WebContainer: {
    boot: vi.fn().mockResolvedValue({
      fs: { readFile: vi.fn(), writeFile: vi.fn() },
      spawn: vi.fn(),
    }),
  },
}));
```

### 6.4 E2E Testing (Playwright)

Use `data-testid` for stable selectors:

```typescript
test.describe('File Explorer', () => {
  test('should open file on click', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('file-explorer-item').first().click();
    await expect(page.getByTestId('editor-tab')).toBeVisible();
  });
});
```

### 6.5 Test Naming

```typescript
// GOOD
it('should return file content when file exists', () => {});
it('should stream AI response when provider is configured', () => {});

// BAD
it('works', () => {});
it('test error', () => {});
```

---

## 7. File Organization

### 7.1 Import Order

```typescript
// 1. React and framework imports
import React, { useState, useEffect } from 'react';

// 2. External libraries
import { clsx } from 'clsx';

// 3. Internal absolute imports (using @/ alias)
import { useIDEStore } from '@/store/useIDEStore';
import type { FileEntry } from '@/types';

// 4. Relative imports (only within same module)
import { FileItem } from './FileItem';
```

### 7.2 Path Aliases

Use `@/` for all non-relative imports:

```typescript
// BAD
import { fileSystem } from '../../../services/filesystem';

// GOOD
import { fileSystem } from '@/services/filesystem';
```

---

## 8. Naming Conventions

### 8.1 File Naming

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `FileExplorer.tsx` |
| Hooks | camelCase with `use` prefix | `useMediaQuery.ts` |
| Services | camelCase/kebab-case | `filesystem.ts`, `ai-providers.ts` |
| Utilities | camelCase | `logger.ts` |
| Types | camelCase | `index.ts` (in `types/`) |
| Test files | Same as source + `.test` | `filesystem.test.ts` |

### 8.2 Code Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileExplorer` |
| Functions | camelCase | `readFile` |
| Variables | camelCase | `activeFile` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| Interfaces | PascalCase | `FileEntry` |
| Types | PascalCase | `AIProvider` |
| DB types | PascalCase with DB prefix | `DBProject`, `DBSession` |

### 8.3 Boolean Naming

```typescript
const isLoading = true;
const hasError = false;
const canEdit = permissions.includes('write');
const shouldAutoSave = settings.autoSave;
```

---

## 9. Documentation Standards

### 9.1 Inline Comments

Explain **why**, not **what**:

```typescript
// BAD
// Loop through files and filter hidden ones
const visibleFiles = files.filter(f => !f.hidden);

// GOOD
// Hidden files (dotfiles) are excluded from the explorer by default
const visibleFiles = files.filter(f => !f.hidden);
```

### 9.2 TODO Comments

```typescript
// TODO: Implement retry logic for network failures
// FIXME: This causes memory leak when terminal unmounts
// HACK: Workaround for Monaco editor resize bug
```

---

## 10. Git Workflow

### 10.1 Branch Naming

```
feature/add-ai-streaming
bugfix/fix-editor-crash
refactor/improve-file-tree
docs/update-agent-spec
chore/upgrade-dependencies
dev/test-driven-development
```

### 10.2 Commit Message Format

```
<type>(<scope>): <short description>

<longer description if needed>

<footer>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`

### 10.3 Pre-Commit

```bash
pnpm type-check   # Zero type errors
pnpm test -- --run # All tests pass
pnpm lint          # Zero lint errors
```

---

## 11. ESLint Configuration

Key rules enforced:

```typescript
{
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'no-console': ['error', { allow: ['warn', 'error'] }],
}
```

---

## 12. Code Review Checklist

### Architecture
- [ ] Follows singleton service pattern
- [ ] No circular imports
- [ ] Components use Zustand selectors with `useShallow`

### TypeScript
- [ ] No `any` types in production code
- [ ] Types defined in `src/types/index.ts`
- [ ] Uses `@/` path aliases

### Error Handling
- [ ] Services return `APIResponse<T>`
- [ ] Uses `logger` utility (no `console.log`)
- [ ] Uses `sonner` for user notifications
- [ ] All async operations have error handling

### Testing
- [ ] Tests cover happy path and error cases
- [ ] Tests follow AAA pattern
- [ ] Coverage meets 80% thresholds

### Performance
- [ ] `useShallow` for multi-value Zustand selectors
- [ ] No unnecessary re-renders
- [ ] Large operations are async

### Security
- [ ] No hardcoded secrets
- [ ] API keys handled via encrypted sessionStorage
- [ ] CSP headers maintained
- [ ] WebContainers command allowlist respected

---

## 13. Cross-Cutting Patterns

### 13.1 Responsive Design

Use `useMediaQuery` hook with breakpoints:

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');
```

### 13.2 Database (Dexie/IndexedDB)

Use `useLiveQuery` for reactive database queries:

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';

const projects = useLiveQuery(() => db.projects.toArray());
```

DB types use the `DB` prefix: `DBProject`, `DBSession`, `DBMessage`.

### 13.3 WebContainers Integration

WebContainers require COOP/COEP headers. Key constraints:
- Uses `credentialless` COEP mode
- `coi-serviceworker` only loads in production
- Command allowlist restricts spawnable commands
- StackBlitz iframes must be allowed in CSP `frame-src`

### 13.4 AI Integration Modes

Three AI interaction modes:

| Mode | Service | UI Component |
|------|---------|-------------|
| Chat | `ai-providers.ts` (AIProviderRegistry) | `AIPanel.tsx` |
| Agent | `claude-agent.ts` (ClaudeAgent) | `AIPanel.tsx` |
| CLI | `claude-cli.ts` (ClaudeCLI) | `ClaudeCLI.tsx` (xterm.js) |

---

**Document Version:** 1.0
**Last Updated:** March 2026
