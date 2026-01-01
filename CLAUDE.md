# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

---

## Project Overview

**Browser IDE** - VS Code-like IDE running in the browser with TypeScript, React, and modern web technologies.

### Core Capabilities
- Multi-LLM support (Claude, GLM-4.6, OpenAI)
- Multi-project management
- AI chat sessions with message branching
- Git integration (clone, commit, push, branch)
- Code execution via WebContainers
- IndexedDB for local persistence
- PWA with offline support

### Technology Stack
- **Language:** TypeScript 5.3+
- **Package Manager:** pnpm 8.14+ (REQUIRED)
- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **State:** Zustand 4.4+
- **Database:** Dexie 3.2+ (IndexedDB)
- **Editor:** Monaco Editor
- **Runtime:** WebContainers API

---

## Common Commands

```bash
# Development
pnpm dev                  # Start dev server (localhost:5173)
pnpm dev:mobile           # Dev server on local network
pnpm type-check           # Type-check without building
pnpm type-check:watch     # Type-check in watch mode
pnpm lint                 # Lint code
pnpm lint:fix             # Fix linting issues
pnpm format               # Format code with Prettier
pnpm format:check         # Check formatting
pnpm validate             # Type-check + lint + build

# Building & Deployment
pnpm build                # Build for production
pnpm preview              # Preview production build
pnpm preview:mobile       # Preview on local network
pnpm deploy               # Deploy to GitHub Pages
pnpm deploy:script        # Deploy using script

# Maintenance
pnpm clean                # Clean build artifacts
pnpm clean:all            # Clean everything including node_modules
```

**Important Notes:**
- Always use pnpm, never npm or yarn
- COOP/COEP headers required for WebContainers (configured in vite.config.ts)
- Use `:mobile` variants for testing on phones/tablets

---

## Architecture

### High-Level Structure

```
src/
├── components/           # React components
│   ├── IDE/             # Main IDE components
│   ├── Git/             # Git-specific components
│   └── claude-cli/      # Claude CLI integration
├── services/            # Business logic (singletons)
│   ├── ai-providers.ts  # Multi-LLM abstraction
│   ├── filesystem.ts    # LightningFS wrapper
│   ├── git.ts          # isomorphic-git operations
│   ├── webcontainer.ts # WebContainer wrapper
│   └── ...
├── store/               # Zustand stores
│   ├── useIDEStore.ts  # Main IDE state (monolithic)
│   └── useWorkspaceStore.ts
├── types/index.ts       # All TypeScript types
├── lib/database.ts      # Dexie database wrapper
└── hooks/               # React hooks
```

### Key Patterns

**1. Zustand Store (useIDEStore)**
- Single monolithic store at `src/store/useIDEStore.ts`
- Uses `persist` middleware for localStorage
- Contains all IDE state: projects, files, git, editor, terminals, AI sessions, UI state

**2. Service Layer**
- Services are singletons: `export const gitService = new GitService()`
- All business logic in `src/services/`
- Components call services, services don't call components

**3. Path Aliases**
- Use `@/` prefix for all imports: `import { useIDEStore } from '@/store/useIDEStore'`
- Never use relative imports like `../../../`

**4. Database**
- Dexie wrapper at `src/lib/database.ts`
- Schema v1: `projects`, `sessions`, `messages`, `settings`
- Use `useLiveQuery` for reactive queries

**5. Types**
- Single source of truth: `src/types/index.ts`
- Database types have `DB` prefix (e.g., `DBProject`, `DBSession`)

---

## Development Guidelines

### TypeScript
- Strict mode enabled - no `any` types
- All interfaces in `src/types/index.ts`
- Props must be explicitly typed

### State Management
- Use Zustand stores for global state
- Use `persist` middleware for localStorage sync
- State updates are immutable

### Error Handling
- Use `sonner` for toast notifications
- Use `logger` utility from `@/utils/logger`
- Services return `{ success: boolean, data?: T, error?: string }`
- Wrap async operations in try/catch

### Styling
- Tailwind CSS utility classes
- Use `clsx` for conditional classes
- Custom config in `tailwind.config.js`

### Responsive Design
- Use `useMediaQuery` hook from `@/hooks/useMediaQuery`
- Breakpoints: Mobile `<768px`, Tablet `768-1024px`, Desktop `>1024px`

---

## Critical Implementation Details

### WebContainers
- **Requirements:** Chromium browsers only, COOP/COEP headers, HTTPS in production
- Singleton: `webContainer` from `@/services/webcontainer`

```typescript
import { webContainer } from '@/services/webcontainer';
await webContainer.boot();
const process = await webContainer.spawn('npm', ['install']);
```

### Git Integration
- Uses `isomorphic-git` + LightningFS
- Singleton: `gitService` from `@/services/git`
- CORS proxy required for remote operations

```typescript
import { gitService } from '@/services/git';
await gitService.clone(url, token);
const status = await gitService.status();
await gitService.commit('message');
await gitService.push(token);
```

### File System
- LightningFS (IndexedDB-backed)
- Singleton: `fileSystem` from `@/services/filesystem`
- All paths are absolute (start with `/`)

```typescript
import { fileSystem } from '@/services/filesystem';
const { success, data } = await fileSystem.readFile('/path/file.txt');
await fileSystem.writeFile('/path/file.txt', 'content');
const { files, folders } = await fileSystem.readDirectory('/path');
```

### Monaco Editor
- Default theme: `vs-dark`
- Custom themes in `src/components/IDE/Editor.tsx`
- Built-in languages: TypeScript, JavaScript, HTML, CSS, JSON, Markdown

---

## Code Review Checklist

Before committing:
- [ ] No `any` types, all interfaces in `src/types/index.ts`
- [ ] All async operations have try/catch
- [ ] Using Zustand stores appropriately
- [ ] Using Dexie correctly with proper types
- [ ] Business logic in services, not components
- [ ] Using `@/` path aliases consistently
- [ ] Using `logger` utility for logging
- [ ] Using Tailwind + `clsx` for styling
- [ ] Code formatted with Prettier
- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm build` succeeds

---

## Key Files

**Essential:**
- `src/App.tsx` - Main application component
- `src/store/useIDEStore.ts` - Primary Zustand store
- `src/types/index.ts` - All TypeScript types
- `src/lib/database.ts` - Dexie database wrapper
- `vite.config.ts` - Build config, COOP/COEP headers

**Configuration:**
- `package.json` - Dependencies, scripts
- `tsconfig.json` - TypeScript strict mode config
- `tailwind.config.js` - Tailwind customization
- `.eslintrc.cjs` - ESLint rules

**Service Singletons:**
- `src/services/filesystem.ts` → `fileSystem`
- `src/services/git.ts` → `gitService`
- `src/services/webcontainer.ts` → `webContainer`
- `src/services/ai-providers.ts` → `aiRegistry`

---

**Last Updated:** December 2024
