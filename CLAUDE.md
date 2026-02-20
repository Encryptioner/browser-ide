# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Browser IDE** - VS Code-like IDE running in the browser with TypeScript, React, and modern web technologies.

### Technology Stack
- **Language:** TypeScript 5.3+ (strict mode)
- **Package Manager:** pnpm 8.14+ (REQUIRED - never use npm or yarn)
- **Node:** ^22.16.0
- **Framework:** React 18.2+
- **Build Tool:** Vite 5.0+
- **State:** Zustand 4.4+
- **Database:** Dexie 3.2+ (IndexedDB)
- **Editor:** Monaco Editor
- **Runtime:** WebContainers API
- **Testing:** Vitest (unit) + Playwright (e2e)

---

## Common Commands

```bash
# Development
pnpm dev                  # Start dev server (localhost:5173)
pnpm type-check           # Type-check without building
pnpm lint                 # Lint code
pnpm lint:fix             # Fix linting issues
pnpm format               # Format code with Prettier
pnpm validate             # Type-check + lint + build

# Testing
pnpm test -- --run        # Run all unit tests once
pnpm test -- src/services/git.test.ts  # Run a single test file
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Generate coverage report
pnpm test:e2e             # Run Playwright E2E tests

# Building
pnpm build                # Build for production
pnpm preview              # Preview production build
```

### Test Configuration
- **Framework:** Vitest with `happy-dom` environment
- **Setup file:** `tests/setup.ts` (jest-dom matchers, auto-cleanup)
- **Test patterns:** `src/**/*.test.ts`, `src/**/*.test.tsx`, `tests/integration/**/*.test.ts`
- **Globals enabled:** `describe`, `it`, `expect`, `vi` available without imports
- **Coverage thresholds:** 80% for statements, branches, functions, lines
- **E2E:** Playwright with Chromium, Firefox, WebKit + mobile viewports

---

## Architecture

### Key Patterns

**1. Service Layer (Singletons)**
- All business logic lives in `src/services/` as singleton exports
- Components call services; services never call components
- Services return `{ success: boolean, data?: T, error?: string }`
- Key singletons: `fileSystem`, `gitService`, `webContainer`, `aiRegistry`

**2. Zustand Store**
- Single monolithic store at `src/store/useIDEStore.ts`
- Uses `persist` middleware with `partialize` for localStorage
- Use `useShallow` selectors from `zustand/react/shallow` for performance

**3. Path Aliases**
- Use `@/` prefix for all imports: `import { useIDEStore } from '@/store/useIDEStore'`
- Never use relative imports like `../../../`

**4. Database**
- Dexie wrapper at `src/lib/database.ts`
- Schema v1: `projects`, `sessions`, `messages`, `settings`
- Use `useLiveQuery` for reactive queries
- Database types have `DB` prefix (e.g., `DBProject`, `DBSession`)

**5. Types**
- Single source of truth: `src/types/index.ts`
- All new interfaces go here

---

## Critical Implementation Details

### WebContainers
- Requires COOP/COEP headers (configured in `vite.config.ts` server headers)
- Uses `credentialless` COEP mode (works even when `crossOriginIsolated` is false)
- `coi-serviceworker` only loads in production (GitHub Pages path `/browser-ide/`)
- Internally uses StackBlitz iframes (must be allowed in CSP `frame-src`)
- Command allowlist in `webcontainer.ts` restricts which commands can be spawned

### Git Integration
- Uses `isomorphic-git` + LightningFS
- CORS proxy required for remote operations
- All git operations must check for `.git` directory existence before running (returns empty/no-op if no repo)

### CSP Headers
- Dev server CSP requires `'unsafe-inline'` in `script-src` for Vite HMR
- Preview/production CSP must NOT include `'unsafe-inline'`
- `frame-src` must include `stackblitz.com` domains for WebContainers

---

## Development Guidelines

- No `any` types in production code (`as any` acceptable only in test mocks)
- Use `logger` utility from `@/utils/logger` (not `console.log`)
- Use `sonner` for toast notifications
- Tailwind CSS + `clsx` for styling
- Use `useMediaQuery` hook for responsive design (breakpoints: 768px, 1024px)

### Before Committing
- `pnpm type-check` passes
- `pnpm test -- --run` passes
- `pnpm lint` passes

---

## Key Files

- `src/App.tsx` - Main application component with startup initialization
- `src/store/useIDEStore.ts` - Primary Zustand store (all IDE state)
- `src/types/index.ts` - All TypeScript interfaces
- `src/lib/database.ts` - Dexie database wrapper
- `vite.config.ts` - Build config, COOP/COEP headers, CSP policies
- `vitest.config.ts` - Test configuration
- `playwright.config.ts` - E2E test configuration

---

**Last Updated:** February 2026
