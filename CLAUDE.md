# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 Project Overview

**Browser IDE Pro** is a production-ready, VS Code-like IDE that runs entirely in the browser using TypeScript, React, and modern web technologies.

### Core Capabilities
- Multi-LLM support (Claude, GLM-4.6, OpenAI)
- Multi-project management with parallel workflows
- AI chat sessions with message branching
- Git integration (clone, commit, push, branch)
- Code execution via WebContainers
- IndexedDB for local persistence
- PWA with offline support

### Technology Stack
- **Language:** TypeScript 5.3+
- **Package Manager:** pnpm 8.14+
- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **State:** Zustand 4.4+
- **Database:** Dexie 3.2+ (IndexedDB)
- **Editor:** Monaco Editor
- **Runtime:** WebContainers API

---

## 🚀 Common Commands

### Development
```bash
# Start development server
pnpm dev

# Start dev server accessible on local network (mobile testing)
pnpm dev:mobile

# Type-check without building
pnpm type-check

# Type-check in watch mode
pnpm type-check:watch

# Lint code
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check

# Validate everything (type-check + lint + build)
pnpm validate
```

### Building & Deployment
```bash
# Build for production (includes type-checking)
pnpm build

# Preview production build
pnpm preview

# Preview on local network
pnpm preview:mobile

# Deploy to GitHub Pages (manual)
pnpm deploy

# Deploy using script
pnpm deploy:script
```

### Maintenance
```bash
# Clean build artifacts and Vite cache
pnpm clean

# Clean everything including node_modules
pnpm clean:all

# Run tests (placeholder currently)
pnpm test
```

### Important Notes
- **Always use pnpm**, not npm or yarn - this project requires pnpm 8.14+
- The dev server runs on `http://localhost:5173` by default
- COOP/COEP headers are required for WebContainers - already configured in vite.config.ts
- Use `:mobile` variants for testing on phones/tablets on local network

---

## 📁 Architecture Overview

### High-Level Structure

```
Browser IDE Pro
├── UI Layer (React + TypeScript)
│   ├── Components (src/components/)
│   ├── Hooks (src/hooks/)
│   └── Styles (Tailwind CSS)
│
├── State Management (Zustand)
│   ├── useIDEStore (Main IDE state)
│   ├── useWorkspaceStore (Workspace management)
│   └── Settings persistence
│
├── Business Logic (Services)
│   ├── AI Providers (Multi-LLM abstraction)
│   ├── File System (LightningFS)
│   ├── Git (isomorphic-git)
│   ├── WebContainer (Code execution)
│   ├── Claude CLI (Claude Code integration)
│   └── VS Code Extensions (Extension loading)
│
└── Data Layer (Dexie/IndexedDB)
    ├── Projects Table
    ├── Sessions Table
    ├── Messages Table
    └── Settings Table
```

### Key Architecture Patterns

**1. Single Zustand Store (useIDEStore)**
- The primary store is `src/store/useIDEStore.ts` - a monolithic store managing ALL IDE state
- Uses `zustand/middleware/persist` for localStorage persistence
- Contains: projects, files, git, editor, debugging, snippets, terminals, problems, AI sessions, UI state
- Also has `useWorkspaceStore.ts` for workspace-specific operations

**2. Service Layer Pattern**
- Services are singletons exported from their modules (e.g., `export const gitService = new GitService()`)
- All business logic lives in `/services/` directory
- Services handle: AI providers, filesystem operations, git operations, WebContainers, linting, snippets, intellisense

**3. Component Organization**
```
src/components/
├── IDE/                    # Main IDE components
│   ├── Editor.tsx         # Monaco editor wrapper
│   ├── FileExplorer.tsx   # File tree view
│   ├── Terminal.tsx       # xterm.js terminal
│   ├── AIAssistant.tsx    # AI chat interface
│   ├── ClaudeCodePanel.tsx # Claude Code integration
│   ├── Debugger.tsx       # Debug UI
│   ├── ProblemsPanel.tsx  # Error/warning display
│   ├── SplitEditor.tsx    # Multi-pane editor
│   ├── TerminalTabs.tsx   # Multiple terminal instances
│   └── StatusBar.tsx      # Bottom status bar
├── Git/                    # Git-specific components
│   ├── SourceControlPanel.tsx
│   └── DiffViewer.tsx
├── claude-cli/             # Claude CLI integration
├── ErrorBoundary.tsx       # Error handling
├── Loading.tsx             # Loading states
├── ResponsiveLayout.tsx    # Responsive wrapper
└── MobileOptimizedLayout.tsx # Mobile-specific UI
```

**4. Path Aliases**
- Use `@/` prefix for all imports: `import { useIDEStore } from '@/store/useIDEStore'`
- Configured in both `tsconfig.json` and `vite.config.ts`
- Never use relative imports like `../../../`

**5. Mobile Optimization**
- Separate mobile layout components in `MobileOptimizedLayout.tsx`
- Responsive breakpoints handled via `useMediaQuery` hook
- Keyboard detection via `useKeyboardDetection` hook for mobile keyboards
- Mobile configuration in `src/config/environment.ts` and `useMobileConfig` hook

---

## 🔧 Development Guidelines

### 1. Type Safety

**Always use TypeScript with strict types:**

```typescript
// ✅ GOOD - Explicit types
interface ProjectProps {
  project: Project;
  onSelect: (id: string) => void;
}

export function ProjectCard({ project, onSelect }: ProjectProps) {
  return <div onClick={() => onSelect(project.id)}>{project.name}</div>;
}

// ❌ BAD - No types
export function ProjectCard({ project, onSelect }) {
  return <div onClick={() => onSelect(project.id)}>{project.name}</div>;
}
```

**Important Type Locations:**
- Core types: `src/types/index.ts` (single source of truth)
- All interfaces exported from this file
- Database types have `DB` prefix (e.g., `DBProject`, `DBSession`)

### 2. State Management

**Use Zustand stores for global state:**

```typescript
// ✅ GOOD - Zustand store access
import { useIDEStore } from '@/store/useIDEStore';

function MyComponent() {
  const {
    sidebarOpen,
    toggleSidebar,
    activeProjectId,
    setActiveProject
  } = useIDEStore();

  return (
    <div onClick={toggleSidebar}>
      {sidebarOpen ? 'Hide' : 'Show'} Sidebar
    </div>
  );
}
```

**Store Patterns:**
- State updates are immutable - use spread operators or Immer
- Actions are defined inline in the store
- Use `persist` middleware for localStorage sync (already configured)
- Don't create local state for data that should be global

### 3. Database Operations

**Use Dexie for IndexedDB access:**

```typescript
// ✅ GOOD - Type-safe database operations
import { db } from '@/lib/database';

async function saveProject(project: Project) {
  try {
    const id = await db.addProject(project);
    console.log('✅ Project saved:', id);
    return { success: true, id };
  } catch (error) {
    console.error('❌ Failed to save project:', error);
    return { success: false, error };
  }
}

// Use useLiveQuery for reactive data
import { useLiveQuery } from 'dexie-react-hooks';

function ProjectList() {
  const projects = useLiveQuery(
    () => db.getAllProjects(),
    [] // dependencies
  );

  if (!projects) return <div>Loading...</div>;
  return <div>{/* render projects */}</div>;
}
```

**Database Schema (v1):**
```typescript
projects: 'id, name, lastOpened, starred, *tags'
sessions: 'id, projectId, providerId, createdAt, updatedAt, pinned'
messages: 'id, sessionId, timestamp, role'
settings: 'id'
```

### 4. Service Layer

**Keep business logic in services:**

```typescript
// ✅ GOOD - Service handles API calls
// src/services/ai-providers.ts
export class AnthropicProvider implements LLMProvider {
  async complete(messages, config, onChunk) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      // API call logic
    });
    return this.parseResponse(response);
  }
}

// Export singleton instance
export const gitService = new GitService();
export const fileSystem = new FileSystemService();

// Component just uses the service
function ChatComponent() {
  const handleSend = async (message: string) => {
    const result = await aiRegistry.complete('anthropic', messages, config);
    // Handle result
  };
}
```

**Available Services:**
- `ai-providers.ts` - Multi-LLM abstraction (Anthropic, GLM, OpenAI)
- `filesystem.ts` - LightningFS wrapper with Promise API
- `git.ts` - isomorphic-git operations
- `webcontainer.ts` - WebContainer API wrapper
- `claude-cli.ts` - Claude Code CLI integration
- `vscode-extensions.ts` - VS Code extension loading
- `linter.ts` - Code linting
- `snippets.ts` - Code snippet management
- `intellisense.ts` - Autocomplete/IntelliSense
- `importExport.ts` - Project import/export

### 5. Error Handling

**Always handle errors gracefully:**

```typescript
// ✅ GOOD - Comprehensive error handling
import { toast } from 'sonner';

async function cloneRepository(url: string, token: string) {
  try {
    const result = await gitService.clone(url, token);

    if (!result.success) {
      toast.error(`Clone failed: ${result.error}`);
      return;
    }

    toast.success('Repository cloned successfully');
    return result.data;

  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
  }
}
```

**Error Handling Patterns:**
- Use `sonner` for toast notifications (already imported via `Toaster` in App.tsx)
- Log errors with `logger` utility from `@/utils/logger`
- Services return `{ success: boolean, data?: T, error?: string }` pattern
- Wrap async operations in try/catch
- Use ErrorBoundary for component-level errors

---

## 🎨 UI Development

### Component Structure

```typescript
// Component template
import { useState, useEffect } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import type { MyComponentProps } from '@/types';
import clsx from 'clsx';

interface MyComponentProps {
  title: string;
  onAction: () => void;
  className?: string;
}

export function MyComponent({ title, onAction, className }: MyComponentProps) {
  // Hooks first
  const [state, setState] = useState<string>('');
  const { someGlobalState } = useIDEStore();

  // Event handlers
  const handleClick = () => {
    // Logic
    onAction();
  };

  // Effects
  useEffect(() => {
    // Side effects
  }, []);

  // Render
  return (
    <div className={clsx('my-component', className)}>
      <h2>{title}</h2>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Styling

**Use Tailwind CSS utility classes:**

```typescript
// ✅ GOOD - Tailwind classes
<div className="flex items-center gap-2 p-4 bg-gray-900 rounded-lg">
  <Icon className="w-5 h-5 text-blue-400" />
  <span className="text-sm font-medium text-gray-100">Title</span>
</div>

// Use clsx for conditional classes
import clsx from 'clsx';

<div className={clsx(
  'button',
  variant === 'primary' && 'bg-blue-500',
  variant === 'danger' && 'bg-red-500',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

**Tailwind Configuration:**
- Custom configuration in `tailwind.config.js`
- Typography plugin enabled (`@tailwindcss/typography`)
- VS Code dark theme colors used as base

### Responsive Design

**Use the provided responsive utilities:**

```typescript
import { useMediaQuery } from '@/hooks/useMediaQuery';

function MyComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  if (isMobile) {
    return <MobileView />;
  }

  return <DesktopView />;
}
```

**Breakpoints:**
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

---

## 🔌 Adding New Features

### Adding a New LLM Provider

**Step 1: Define Provider Class**

```typescript
// src/services/ai-providers.ts
export class MyProvider implements LLMProvider {
  id = 'myprovider';
  name = 'My Provider';

  async complete(
    messages: AIMessage[],
    config: AIProviderConfig,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<APIResponse<AIMessage>> {
    // Implement API call
    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    // Parse and return
    const data = await response.json();
    return {
      success: true,
      data: {
        id: data.id,
        role: 'assistant',
        content: data.content,
        timestamp: Date.now(),
        model: config.model,
        parentId: null,
      },
    };
  }

  async validateConfig(config: AIProviderConfig): Promise<boolean> {
    // Test API key
    try {
      const response = await fetch(`${config.baseUrl}/test`, {
        headers: { 'Authorization': `Bearer ${config.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

**Step 2: Register Provider**

```typescript
// src/services/ai-providers.ts
export const aiRegistry = new AIProviderRegistry();
aiRegistry.register('myprovider', new MyProvider());
```

**Step 3: Update Types**

```typescript
// src/types/index.ts
export type AIProvider = 'anthropic' | 'glm' | 'openai' | 'myprovider';

export const AI_PROVIDERS = {
  // ...existing providers
  myprovider: {
    name: 'My Provider',
    baseUrl: 'https://api.myprovider.com',
    models: ['model-1', 'model-2'],
  },
} as const;
```

**Step 4: Add UI**

```typescript
// src/components/IDE/SettingsDialog.tsx
<select value={provider} onChange={(e) => setProvider(e.target.value)}>
  <option value="anthropic">Anthropic Claude</option>
  <option value="glm">Z.ai GLM</option>
  <option value="openai">OpenAI</option>
  <option value="myprovider">My Provider</option>
</select>
```

### Adding a New Component

**1. Create Component File**

```bash
# Create component directory
mkdir -p src/components/myfeature

# Create component file (use .tsx extension)
touch src/components/myfeature/MyFeature.tsx
```

**2. Implement Component**

```typescript
// src/components/myfeature/MyFeature.tsx
import { useState } from 'react';
import type { MyFeatureProps } from '@/types';

export function MyFeature({ data, onSave }: MyFeatureProps) {
  const [state, setState] = useState('');

  return (
    <div className="my-feature">
      {/* Implementation */}
    </div>
  );
}
```

**3. Export from Index**

```typescript
// src/components/myfeature/index.ts
export { MyFeature } from './MyFeature';
```

**4. Use in Parent**

```typescript
// src/App.tsx or parent component
import { MyFeature } from '@/components/myfeature';

export function App() {
  return (
    <div>
      <MyFeature data={data} onSave={handleSave} />
    </div>
  );
}
```

---

## 🗄️ Database Patterns

### Creating a New Table

**1. Define Type**

```typescript
// src/types/index.ts
export interface MyData {
  id: string;
  name: string;
  createdAt: number;
}

export interface DBMyData extends MyData {
  // Additional DB fields if needed
}
```

**2. Add to Database Schema**

```typescript
// src/lib/database.ts
export class BrowserIDEDatabase extends Dexie {
  myData!: Table<DBMyData, string>;

  constructor() {
    super('BrowserIDEDatabase');

    // IMPORTANT: Increment version number!
    this.version(2).stores({
      // Existing tables...
      projects: 'id, name, lastOpened, starred, *tags',
      sessions: 'id, projectId, providerId, createdAt, updatedAt, pinned',
      messages: 'id, sessionId, timestamp, role',
      settings: 'id',
      // New table:
      myData: 'id, name, createdAt',
    });
  }

  // Add methods
  async getMyData(id: string): Promise<MyData | undefined> {
    return this.myData.get(id);
  }

  async addMyData(data: MyData): Promise<string> {
    return this.myData.add(data);
  }
}

// Export singleton instance
export const db = new BrowserIDEDatabase();
```

**3. Use in Components**

```typescript
// Use useLiveQuery for reactive queries
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/database';

function MyComponent() {
  const items = useLiveQuery(
    () => db.myData.toArray(),
    []  // Dependencies
  );

  if (!items) return <div>Loading...</div>;

  return (
    <div>
      {items.map(item => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}
```

---

## 🔍 Critical Implementation Details

### WebContainers

**Requirements:**
- Only works in Chromium browsers (Chrome, Edge, Brave)
- Requires COOP/COEP headers (already configured in vite.config.ts)
- Must be served over HTTPS in production (or localhost in dev)

**Usage:**
```typescript
import { webContainer } from '@/services/webcontainer';

// Boot WebContainer
await webContainer.boot();

// Run command
const process = await webContainer.spawn('npm', ['install']);
```

### Monaco Editor

**Theme Configuration:**
- Default theme: `vs-dark` (VS Code dark theme)
- Theme can be changed in settings
- Custom themes defined in `src/components/IDE/Editor.tsx`

**Language Support:**
- TypeScript/JavaScript (built-in)
- HTML/CSS (built-in)
- JSON (built-in)
- Markdown (built-in)
- Additional languages loaded on-demand

### Git Integration

**Implementation:**
- Uses `isomorphic-git` for all git operations
- LightningFS for virtual file system
- CORS proxy required for remote operations (configured in git service)

**Common Operations:**
```typescript
import { gitService } from '@/services/git';

// Clone repository
await gitService.clone(url, token);

// Get status
const status = await gitService.status();

// Commit changes
await gitService.commit('Commit message');

// Push to remote
await gitService.push(token);
```

### File System

**Virtual File System:**
- Uses LightningFS (IndexedDB-backed)
- Singleton instance: `fileSystem` from `@/services/filesystem`
- All paths are absolute (start with `/`)
- Root directory is `/`

**Key Operations:**
```typescript
import { fileSystem } from '@/services/filesystem';

// Read file
const { success, data, error } = await fileSystem.readFile('/path/to/file.txt');

// Write file
await fileSystem.writeFile('/path/to/file.txt', 'content');

// List directory
const { files, folders } = await fileSystem.readDirectory('/path');

// Create directory
await fileSystem.mkdir('/path/to/dir');
```

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

Before committing major changes:

- [ ] Test on Chrome/Edge (primary browsers)
- [ ] Test on mobile Safari (iOS)
- [ ] Test on mobile Chrome (Android)
- [ ] Test with keyboard shortcuts
- [ ] Test with screen reader (basic accessibility)
- [ ] Test offline mode (PWA)
- [ ] Test with different screen sizes
- [ ] Check console for errors
- [ ] Verify TypeScript compilation
- [ ] Run linter

### Unit Tests (Coming Soon)

```typescript
// ✅ GOOD - Test structure
describe('AIProviderRegistry', () => {
  it('should register and retrieve providers', () => {
    const registry = new AIProviderRegistry();
    const provider = new AnthropicProvider();

    registry.register('anthropic', provider);
    const retrieved = registry.get('anthropic');

    expect(retrieved).toBe(provider);
  });

  it('should return undefined for unknown providers', () => {
    const registry = new AIProviderRegistry();
    const result = registry.get('unknown' as AIProvider);

    expect(result).toBeUndefined();
  });
});
```

---

## 🐛 Debugging

### Debug Logging

```typescript
// Use logger utility
import { logger } from '@/utils/logger';

logger.info('User action performed');
logger.warn('Potential issue detected');
logger.error('Operation failed', error);

// Use console groups for clarity
console.group('🔍 Project Loading');
console.log('Project ID:', projectId);
console.log('Loading from database...');
const project = await db.getProject(projectId);
console.log('Project loaded:', project);
console.groupEnd();

// Use time for performance
console.time('Clone Repository');
await gitService.clone(url, token);
console.timeEnd('Clone Repository');
```

### React DevTools

- Install React DevTools extension
- Use Components tab to inspect props/state
- Use Profiler to find performance issues
- Check Zustand store state via React DevTools

### IndexedDB Inspector

- Open DevTools → Application → IndexedDB
- Database name: `BrowserIDEDatabase`
- Inspect tables: projects, sessions, messages, settings
- Clear data for testing (be careful - no undo!)

### Common Issues

**WebContainer not working:**
- Check browser compatibility (Chrome/Edge only)
- Verify COOP/COEP headers in Network tab
- Check console for SharedArrayBuffer errors

**TypeScript errors:**
```bash
pnpm type-check  # Check types without building
```

**Monaco editor not loading:**
- Check Network tab for failed CDN requests
- Verify vite.config.ts chunk splitting configuration

**Mobile keyboard issues:**
- Test on real device (not simulator)
- Check `useKeyboardDetection` hook
- Verify viewport meta tag in index.html

---

## 📝 Code Review Checklist

Before committing code, ensure:

- [ ] **TypeScript:** No `any` types, all interfaces defined in `src/types/index.ts`
- [ ] **Errors:** All async operations have try/catch
- [ ] **State:** Using Zustand stores appropriately (useIDEStore or useWorkspaceStore)
- [ ] **Database:** Using Dexie correctly with proper types
- [ ] **Services:** Business logic in service layer, not components
- [ ] **Components:** Props typed, handlers implemented, using function components
- [ ] **Styling:** Using Tailwind classes, using `clsx` for conditionals
- [ ] **Imports:** Using `@/` path aliases consistently
- [ ] **Logging:** Using `logger` utility with meaningful messages
- [ ] **Comments:** Complex logic explained (but prefer self-documenting code)
- [ ] **Formatting:** Code formatted with Prettier
- [ ] **Linting:** No ESLint errors (`pnpm lint`)
- [ ] **Types:** Type-check passes (`pnpm type-check`)
- [ ] **Build:** Production build succeeds (`pnpm build`)

---

## 🚀 Deployment Checklist

Before deploying:

- [ ] **Build:** `pnpm build` completes successfully
- [ ] **Types:** `pnpm type-check` passes
- [ ] **Lint:** `pnpm lint` passes
- [ ] **Test:** Manual testing complete (see Testing Checklist)
- [ ] **PWA:** Manifest and icons configured in `public/`
- [ ] **Headers:** COOP/COEP headers verified (vite.config.ts)
- [ ] **Environment:** API keys stored in settings, not hardcoded
- [ ] **Git:** All changes committed with descriptive messages
- [ ] **Docs:** README.md and CLAUDE.md updated if needed
- [ ] **Version:** package.json version bumped appropriately
- [ ] **Mobile:** Tested on real mobile devices
- [ ] **Console:** No errors in production build console

---

## 🎓 Learning Resources

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### React
- [React Docs](https://react.dev/)
- [React Hooks Reference](https://react.dev/reference/react)

### Zustand
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

### Dexie
- [Dexie Tutorial](https://dexie.org/docs/Tutorial)
- [Dexie React Hooks](https://dexie.org/docs/dexie-react-hooks/useLiveQuery())

### pnpm
- [pnpm Docs](https://pnpm.io/)
- [pnpm CLI](https://pnpm.io/cli/add)

### WebContainers
- [WebContainers API Docs](https://webcontainers.io/api)

### Monaco Editor
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)

---

## 💡 Common Patterns

### Loading States

```typescript
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState />;

  return <DataDisplay data={data} />;
}
```

### Form Handling

```typescript
function MyForm() {
  const [values, setValues] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await saveData(values);
      toast.success('Saved successfully');
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      {errors.name && <span className="text-red-500">{errors.name}</span>}
      {/* More fields */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Panel Resizing

```typescript
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function SplitView() {
  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize={25} minSize={15}>
        <Sidebar />
      </Panel>
      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500" />
      <Panel defaultSize={75}>
        <MainContent />
      </Panel>
    </PanelGroup>
  );
}
```

---

## 📞 Getting Help

If you're stuck:

1. **Check types:** TypeScript errors often reveal the root issue
2. **Console logs:** Add strategic logging with `logger` utility
3. **DevTools:** Use React DevTools, Network tab, IndexedDB inspector
4. **Documentation:** Check this file, README.md, and inline code comments
5. **Examples:** Look at existing components for patterns
6. **Build:** Try `pnpm clean && pnpm install && pnpm dev`

---

## 🔑 Key Files to Know

**Essential Files:**
- `src/App.tsx` - Main application component with all panel orchestration
- `src/store/useIDEStore.ts` - Primary Zustand store (ALL IDE state)
- `src/types/index.ts` - All TypeScript type definitions
- `src/lib/database.ts` - Dexie database wrapper
- `vite.config.ts` - Build configuration, COOP/COEP headers, chunk splitting

**Configuration:**
- `package.json` - Dependencies, scripts, pnpm version
- `tsconfig.json` - TypeScript configuration with strict mode
- `tailwind.config.js` - Tailwind CSS customization
- `.eslintrc.cjs` - ESLint rules
- `src/config/environment.ts` - Environment configuration

**Service Singletons:**
- `src/services/filesystem.ts` → exports `fileSystem`
- `src/services/git.ts` → exports `gitService`
- `src/services/webcontainer.ts` → exports `webContainer`
- `src/services/ai-providers.ts` → exports `aiRegistry`

---

**This is a living document. Update it as the project evolves!**

*Last Updated: December 2024*
*Version: 2.0.0*
