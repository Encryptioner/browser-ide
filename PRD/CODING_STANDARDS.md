# Coding Standards

## Browser IDE Pro v2.0 - Development Guidelines

**Document Version:** 1.0
**Created:** February 2026
**Purpose:** Establish consistent coding standards for the project

---

## Table of Contents

1. [TypeScript Standards](#1-typescript-standards)
2. [React Standards](#2-react-standards)
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

---

## 1. TypeScript Standards

### 1.1 Strict Mode

TypeScript strict mode is **required**. The following compiler options must be enabled:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 1.2 No `any` Types

**NEVER** use the `any` type. Use proper types or `unknown` when the type is truly unknown.

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

// Type guard
function isDataObject(data: unknown): data is { value: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as { value: unknown }).value === 'string'
  );
}
```

### 1.3 Explicit Return Types

All functions must have explicit return types:

```typescript
// BAD
function calculateSum(a: number, b: number) {
  return a + b;
}

// GOOD
function calculateSum(a: number, b: number): number {
  return a + b;
}

// GOOD - async functions
async function fetchData(id: string): Promise<Data> {
  const response = await api.get(`/data/${id}`);
  return response.data;
}
```

### 1.4 Type Definitions Location

All shared types must be defined in `src/types/index.ts`:

```typescript
// src/types/index.ts

// Result pattern for service returns
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Database types (prefixed with DB)
export interface DBProject {
  id: string;
  name: string;
  createdAt: number;
  lastOpened: number;
}

// Component prop types
export interface FileExplorerProps {
  projectId: string;
  onFileSelect: (path: string) => void;
}

// API response types
export interface AnthropicResponse {
  id: string;
  content: string;
  model: string;
  usage: TokenUsage;
}
```

### 1.5 Type vs Interface

- Use `interface` for objects that may be extended
- Use `type` for unions, intersections, and mapped types

```typescript
// Use interface for extendable objects
interface BaseEntity {
  id: string;
  createdAt: number;
}

interface Project extends BaseEntity {
  name: string;
  description?: string;
}

// Use type for unions
type FileType = 'file' | 'directory' | 'symlink';

// Use type for intersections
type ProjectWithSettings = Project & { settings: Settings };

// Use type for mapped types
type Readonly<T> = { readonly [K in keyof T]: T[K] };
```

### 1.6 Generics

Use descriptive generic names when the meaning isn't obvious:

```typescript
// BAD - unclear generic
function transform<T, U>(input: T, fn: (x: T) => U): U {
  return fn(input);
}

// GOOD - descriptive generics
function transform<Input, Output>(
  input: Input,
  transformer: (x: Input) => Output
): Output {
  return transformer(input);
}

// OK for simple, conventional generics
function identity<T>(value: T): T {
  return value;
}
```

---

## 2. React Standards

### 2.1 Functional Components Only

Use functional components exclusively. No class components.

```typescript
// BAD
class MyComponent extends React.Component<Props> {
  render() {
    return <div>{this.props.title}</div>;
  }
}

// GOOD
const MyComponent: React.FC<Props> = ({ title }) => {
  return <div>{title}</div>;
};

// ALSO GOOD (preferred for simpler typing)
function MyComponent({ title }: Props): JSX.Element {
  return <div>{title}</div>;
}
```

### 2.2 Props Interface Naming

Props interfaces must follow the `{ComponentName}Props` pattern:

```typescript
// src/components/FileExplorer/FileExplorer.tsx
interface FileExplorerProps {
  projectId: string;
  onFileSelect: (path: string) => void;
  className?: string;
}

function FileExplorer({ projectId, onFileSelect, className }: FileExplorerProps): JSX.Element {
  // ...
}
```

### 2.3 Hooks Rules

- Custom hooks must start with `use` prefix
- Hooks must be called at the top level of components
- Hooks must be called in the same order on every render

```typescript
// src/hooks/useFileSystem.ts
export function useFileSystem(projectId: string): UseFileSystemReturn {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const result = await fileSystem.readDirectory(`/projects/${projectId}`);
      if (result.success) {
        setFiles(result.data!);
      } else {
        setError(result.error!);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return { files, loading, error, refresh: loadFiles };
}
```

### 2.4 Event Handler Naming

Event handlers should be named with `handle` prefix:

```typescript
function Button({ onClick }: ButtonProps): JSX.Element {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onClick();
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### 2.5 Conditional Rendering

Use early returns for cleaner conditional rendering:

```typescript
// BAD - nested ternaries
function Status({ loading, error, data }: StatusProps): JSX.Element {
  return (
    <div>
      {loading ? (
        <Spinner />
      ) : error ? (
        <Error message={error} />
      ) : (
        <Data data={data} />
      )}
    </div>
  );
}

// GOOD - early returns
function Status({ loading, error, data }: StatusProps): JSX.Element {
  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return <Data data={data} />;
}
```

---

## 3. State Management (Zustand)

### 3.1 Store Structure

Follow the established pattern in `useIDEStore.ts`:

```typescript
// src/store/useIDEStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IDEState {
  // State
  currentProject: string | null;
  openFiles: string[];
  activeFile: string | null;

  // Actions
  setCurrentProject: (projectId: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProject: null,
      openFiles: [],
      activeFile: null,

      // Actions
      setCurrentProject: (projectId) => {
        set({ currentProject: projectId });
      },

      openFile: (path) => {
        const { openFiles } = get();
        if (!openFiles.includes(path)) {
          set({ openFiles: [...openFiles, path], activeFile: path });
        } else {
          set({ activeFile: path });
        }
      },

      closeFile: (path) => {
        const { openFiles, activeFile } = get();
        const newOpenFiles = openFiles.filter((f) => f !== path);
        set({
          openFiles: newOpenFiles,
          activeFile: activeFile === path ? newOpenFiles[0] ?? null : activeFile,
        });
      },

      setActiveFile: (path) => {
        set({ activeFile: path });
      },
    }),
    {
      name: 'ide-storage',
      partialize: (state) => ({
        currentProject: state.currentProject,
        openFiles: state.openFiles,
      }),
    }
  )
);
```

### 3.2 Selecting State

Use selectors to prevent unnecessary re-renders:

```typescript
// BAD - subscribes to entire store
function FileList(): JSX.Element {
  const store = useIDEStore();
  return <div>{store.openFiles.length} files open</div>;
}

// GOOD - subscribes only to needed state
function FileList(): JSX.Element {
  const openFiles = useIDEStore((state) => state.openFiles);
  return <div>{openFiles.length} files open</div>;
}

// GOOD - multiple selectors
function Editor(): JSX.Element {
  const activeFile = useIDEStore((state) => state.activeFile);
  const openFile = useIDEStore((state) => state.openFile);
  // ...
}
```

### 3.3 Immutable Updates

Always update state immutably:

```typescript
// BAD - mutating state
set((state) => {
  state.openFiles.push(path); // MUTATION!
  return state;
});

// GOOD - immutable update
set((state) => ({
  openFiles: [...state.openFiles, path],
}));
```

---

## 4. Service Layer Patterns

### 4.1 Singleton Services

Services are singletons exported from their files:

```typescript
// src/services/filesystem.ts
class FileSystemService {
  private fs: LightningFS | null = null;

  async init(projectId: string): Promise<Result<void>> {
    try {
      this.fs = new LightningFS(`project-${projectId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async readFile(path: string): Promise<Result<string>> {
    if (!this.fs) {
      return { success: false, error: 'File system not initialized' };
    }

    try {
      const content = await this.fs.promises.readFile(path, 'utf8');
      return { success: true, data: content as string };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // ... more methods
}

// Export singleton instance
export const fileSystem = new FileSystemService();
```

### 4.2 Result Pattern

All service methods return the Result pattern:

```typescript
export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage in service
async function fetchProject(id: string): Promise<Result<Project>> {
  try {
    const project = await db.projects.get(id);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: `Failed to fetch project: ${error}` };
  }
}

// Usage in component
const result = await fetchProject(projectId);
if (result.success) {
  setProject(result.data!);
} else {
  showError(result.error!);
}
```

### 4.3 Service Dependencies

Services should not import other services directly. Use dependency injection:

```typescript
// BAD - direct import creates tight coupling
import { gitService } from './git';

class FileSystemService {
  async saveAndCommit(path: string, content: string): Promise<Result<void>> {
    await this.writeFile(path, content);
    await gitService.add(path); // Direct coupling!
  }
}

// GOOD - dependency injection
class FileSystemService {
  private gitService?: GitService;

  setGitService(git: GitService): void {
    this.gitService = git;
  }

  async saveAndCommit(path: string, content: string): Promise<Result<void>> {
    await this.writeFile(path, content);
    if (this.gitService) {
      await this.gitService.add(path);
    }
  }
}
```

---

## 5. Error Handling

### 5.1 Try-Catch for Async Operations

All async operations must be wrapped in try-catch:

```typescript
// BAD - unhandled promise rejection
async function loadData(): Promise<void> {
  const data = await api.fetchData(); // May throw!
  setData(data);
}

// GOOD - proper error handling
async function loadData(): Promise<void> {
  try {
    const data = await api.fetchData();
    setData(data);
  } catch (error) {
    logger.error('Failed to load data', error);
    showError('Failed to load data. Please try again.');
  }
}
```

### 5.2 Error Boundaries

Use error boundaries for component error handling:

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Component error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

### 5.3 Logger Utility

Use the `logger` utility instead of `console.log`:

```typescript
// src/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: unknown[]): void => {
    console.info(`[INFO] ${message}`, ...args);
  },

  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${message}`, ...args);
    // Could also send to error tracking service
  },
};

export { logger };
```

### 5.4 Toast Notifications

Use `sonner` for user-facing notifications:

```typescript
import { toast } from 'sonner';

// Success notification
toast.success('File saved successfully');

// Error notification
toast.error('Failed to save file. Please try again.');

// With description
toast.error('Save Failed', {
  description: 'The server is not responding. Check your connection.',
});

// Promise toast
toast.promise(saveFile(), {
  loading: 'Saving...',
  success: 'File saved!',
  error: 'Failed to save file',
});
```

---

## 6. Testing Standards

### 6.1 Test File Location

Tests are co-located with source files:

```
src/
├── components/
│   └── FileExplorer/
│       ├── FileExplorer.tsx
│       └── FileExplorer.test.tsx
├── services/
│   ├── filesystem.ts
│   └── filesystem.test.ts
└── hooks/
    ├── useFileSystem.ts
    └── useFileSystem.test.ts
```

### 6.2 Test Structure (AAA Pattern)

Follow Arrange-Act-Assert pattern:

```typescript
describe('FileSystemService', () => {
  describe('readFile', () => {
    it('should return file content when file exists', async () => {
      // Arrange
      const mockContent = 'Hello, World!';
      await fileSystem.writeFile('/test.txt', mockContent);

      // Act
      const result = await fileSystem.readFile('/test.txt');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockContent);
    });

    it('should return error when file does not exist', async () => {
      // Arrange
      const nonExistentPath = '/nonexistent.txt';

      // Act
      const result = await fileSystem.readFile(nonExistentPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});
```

### 6.3 Mock Strategy

Mock external dependencies:

```typescript
// Mock setup
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// In test
import { api } from '@/services/api';

it('should fetch data', async () => {
  // Arrange
  const mockData = { id: '1', name: 'Test' };
  vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

  // Act
  const result = await service.fetchData('1');

  // Assert
  expect(api.get).toHaveBeenCalledWith('/data/1');
  expect(result).toEqual(mockData);
});
```

### 6.4 Test Data Attributes

Use `data-testid` for E2E test selectors:

```typescript
// Component
function Button({ onClick, children }: ButtonProps): JSX.Element {
  return (
    <button data-testid="submit-button" onClick={onClick}>
      {children}
    </button>
  );
}

// Test
test('should submit form', async ({ page }) => {
  await page.click('[data-testid="submit-button"]');
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

---

## 7. File Organization

### 7.1 Directory Structure

```
src/
├── components/           # React components
│   ├── IDE/             # IDE-specific components
│   │   ├── Editor.tsx
│   │   ├── Editor.test.tsx
│   │   └── index.ts
│   ├── Git/             # Git-related components
│   └── common/          # Shared/reusable components
├── hooks/               # Custom React hooks
├── services/            # Business logic (singletons)
├── store/               # Zustand stores
├── types/               # TypeScript types (index.ts)
├── utils/               # Utility functions
├── lib/                 # External library wrappers
└── App.tsx              # Root component
```

### 7.2 Import Order

Imports must follow this order (enforced by ESLint):

```typescript
// 1. React/external libraries
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// 2. Internal absolute imports (using @/ alias)
import { useIDEStore } from '@/store/useIDEStore';
import { fileSystem } from '@/services/filesystem';
import type { FileNode } from '@/types';

// 3. Relative imports
import { FileTreeItem } from './FileTreeItem';
import styles from './FileExplorer.module.css';
```

### 7.3 Path Aliases

Use `@/` alias for all imports (no relative `../` paths):

```typescript
// BAD
import { useIDEStore } from '../../../store/useIDEStore';

// GOOD
import { useIDEStore } from '@/store/useIDEStore';
```

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## 8. Naming Conventions

### 8.1 File Naming

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase | `FileExplorer.tsx` |
| Hooks | camelCase with `use` prefix | `useFileSystem.ts` |
| Services | camelCase | `filesystem.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | camelCase | `index.ts` |
| Constants | camelCase | `config.ts` |
| Test files | Same as source + `.test` | `filesystem.test.ts` |

### 8.2 Code Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `FileExplorer` |
| Functions | camelCase | `readFile` |
| Variables | camelCase | `currentPath` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| Interfaces | PascalCase | `FileNode` |
| Types | PascalCase | `FileType` |
| Enums | PascalCase | `FileStatus` |
| Enum values | PascalCase | `FileStatus.Modified` |

### 8.3 Boolean Naming

Boolean variables/props should use `is`, `has`, `should`, `can` prefixes:

```typescript
// Variables
const isLoading = true;
const hasError = false;
const canDelete = user.permissions.includes('delete');
const shouldRefresh = lastUpdate < Date.now() - 60000;

// Props
interface ButtonProps {
  isDisabled?: boolean;
  isLoading?: boolean;
  hasIcon?: boolean;
}
```

---

## 9. Documentation Standards

### 9.1 JSDoc for Public APIs

Use JSDoc for public functions and complex logic:

```typescript
/**
 * Reads file content from the virtual file system.
 *
 * @param path - Absolute path to the file
 * @returns Result containing file content or error message
 *
 * @example
 * ```typescript
 * const result = await fileSystem.readFile('/project/src/index.ts');
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
async function readFile(path: string): Promise<Result<string>> {
  // ...
}
```

### 9.2 Inline Comments

Use comments to explain **why**, not **what**:

```typescript
// BAD - describes what the code does
// Loop through files and filter modified ones
const modifiedFiles = files.filter((f) => f.status === 'modified');

// GOOD - explains why
// We only want modified files because unchanged files
// don't need to be displayed in the commit dialog
const modifiedFiles = files.filter((f) => f.status === 'modified');
```

### 9.3 TODO Comments

Format TODO comments consistently:

```typescript
// TODO: Implement retry logic for network failures
// TODO(username): Refactor this after API v2 release
// FIXME: This causes memory leak on unmount
// HACK: Workaround for Monaco editor bug #1234
```

---

## 10. Git Workflow

### 10.1 Branch Naming

```
feature/FR-FS-001-virtual-filesystem
bugfix/fix-terminal-scroll
refactor/improve-editor-performance
docs/update-readme
chore/upgrade-dependencies
```

### 10.2 Commit Message Format

```
<type>(<scope>): <short description>

<longer description if needed>

<footer>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`

Examples:
```
feat(filesystem): implement readFile method

Add readFile method to FileSystemService that returns
Result<string> with file content or error message.

Implements FR-FS-001.04
```

```
fix(terminal): prevent scroll jump on command execution

The terminal was jumping to top after each command.
This was caused by a missing scrollToBottom call.

Fixes #123
```

### 10.3 Pull Request Template

```markdown
## Description
Brief description of changes.

## Related Requirements
- FR-FS-001: Virtual File System

## Changes
- Implemented readFile method
- Added unit tests for readFile
- Updated types

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Screenshots
(if applicable)
```

---

## 11. ESLint Configuration

```javascript
// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['react-refresh', '@typescript-eslint', 'import'],
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',

    // React
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/prop-types': 'off',

    // Import order
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],

    // No console.log (use logger)
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
  settings: {
    react: { version: 'detect' },
  },
};
```

---

## 12. Code Review Checklist

Before approving any PR, verify:

### Architecture
- [ ] Follows established patterns from this document
- [ ] No unnecessary complexity
- [ ] Services are properly structured

### TypeScript
- [ ] No `any` types
- [ ] Explicit return types on all functions
- [ ] Types defined in `src/types/index.ts`

### React
- [ ] Functional components only
- [ ] Props interfaces follow naming convention
- [ ] Hooks follow rules of hooks

### Error Handling
- [ ] All async operations wrapped in try-catch
- [ ] Uses Result pattern for service methods
- [ ] Uses logger utility (no console.log)

### Testing
- [ ] Tests cover happy path and error cases
- [ ] Tests follow AAA pattern
- [ ] Coverage meets thresholds

### Documentation
- [ ] Complex logic has comments explaining why
- [ ] Public APIs have JSDoc

### Performance
- [ ] No obvious memory leaks
- [ ] No unnecessary re-renders
- [ ] Large operations are async

### Security
- [ ] No hardcoded secrets
- [ ] No XSS vulnerabilities
- [ ] Input is validated

---

**Document Version:** 1.0
**Last Updated:** February 2026
