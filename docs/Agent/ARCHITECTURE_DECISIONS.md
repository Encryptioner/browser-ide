# Architecture Decisions Record (ADR)

## Browser IDE - Key Architecture Decisions

**Document Version:** 1.0
**Created:** March 2026

---

## Overview

A VS Code-like IDE running entirely in the browser. Single-page React application with Monaco Editor, WebContainers for in-browser Node.js, AI-assisted development via Claude, and Git integration via isomorphic-git. Deployed to GitHub Pages.

---

## ADR-001: React 18 + Vite (not Next.js or Remix)

**Decision:** React 18 with Vite as build tool.

**Rationale:** Pure client-side SPA -- no server required. Deployed to GitHub Pages as static files. WebContainers run in-browser, so no SSR benefit. Vite provides fast HMR and optimized builds.

**Rejected:**
- Next.js -- server-side features unnecessary, adds complexity
- Vue 3 -- team preference for React ecosystem
- Svelte -- smaller ecosystem for IDE-like applications

---

## ADR-002: Zustand (not Redux or Jotai)

**Decision:** Zustand 4.4+ with monolithic store and logical slices.

**Rationale:** Simpler API than Redux, no boilerplate. Built-in `persist` middleware for localStorage. `useShallow` selector optimization prevents unnecessary re-renders. Single store keeps state discoverable.

**Key design:**
- Monolithic store at `src/store/useIDEStore.ts`
- Logical slices in `src/store/slices/`
- `partialize` controls what gets persisted
- Sensitive data (API keys) in encrypted sessionStorage, not Zustand persist

**Rejected:**
- Redux Toolkit -- too much boilerplate for this project size
- Jotai -- atom-based model harder to reason about for complex IDE state
- MobX -- class-based, doesn't fit functional React patterns

---

## ADR-003: Monaco Editor (Locally Bundled)

**Decision:** Monaco Editor bundled locally, not loaded from CDN.

**Rationale:** CSP compliance -- CDN loading requires relaxed `script-src` which weakens security. Local bundling ensures Monaco works with strict CSP headers and offline.

**Key constraints:**
- Web workers configured via Vite plugin
- Themes and language support bundled at build time
- Editor state managed via Zustand store

---

## ADR-004: WebContainers API for In-Browser Runtime

**Decision:** StackBlitz WebContainers API for in-browser Node.js execution.

**Rationale:** Enables full Node.js runtime in the browser without a backend server. Users can install npm packages, run scripts, and execute code entirely client-side.

**Key constraints:**
- Requires COOP/COEP headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: credentialless`)
- `coi-serviceworker.js` provides headers in production (GitHub Pages)
- Vite dev server sets headers directly
- StackBlitz iframes must be allowed in CSP `frame-src`
- Command allowlist restricts spawnable commands for security

---

## ADR-005: Dexie (IndexedDB) for Persistence

**Decision:** Dexie 3.2+ as IndexedDB wrapper for structured data storage.

**Rationale:** Browser-only app needs client-side persistence. IndexedDB handles large data (files, projects, AI conversations). Dexie provides clean Promise-based API and `useLiveQuery` for reactive queries.

**Schema (v1):**
- `projects` -- project metadata
- `sessions` -- AI chat sessions
- `messages` -- AI messages
- `settings` -- user preferences

**DB types use `DB` prefix:** `DBProject`, `DBSession`, `DBMessage`.

---

## ADR-006: isomorphic-git for Git Operations

**Decision:** isomorphic-git with LightningFS for in-browser Git.

**Rationale:** Full Git implementation in JavaScript. Works with IndexedDB-backed filesystem. Supports clone, commit, push, pull, branch operations without a server.

**Key constraints:**
- CORS proxy required for remote Git operations
- All operations check for `.git` directory existence first
- File operations go through the virtual filesystem

---

## ADR-007: AI Provider Registry Pattern

**Decision:** Pluggable AI provider registry (`AIProviderRegistry`) with `LLMProvider` interface.

**Rationale:** Supports multiple AI providers (Anthropic, OpenAI, Z.ai GLM) through a common interface. Users configure their preferred provider and API key in settings.

**Three AI modes:**

| Mode | Service | Purpose |
|------|---------|---------|
| Chat | `ai-providers.ts` | Simple streaming LLM conversations |
| Agent | `claude-agent.ts` | Agentic tool-calling loop (read/write files, run commands) |
| CLI | `claude-cli.ts` | xterm.js terminal for Claude Code CLI |

**Key design choices:**
- z.ai proxy support via configurable `baseUrl` per provider
- `anthropic-dangerous-direct-browser-access` header for browser-side Anthropic calls
- Encrypted API key storage in sessionStorage
- AbortController for cancelling streaming requests
- Streaming text displayed in real-time via Zustand state updates

---

## ADR-008: Singleton Service Architecture

**Decision:** All business logic in `src/services/` as exported singleton instances.

**Rationale:** Simple, predictable initialization. Services are stateless or manage their own state. Components call services; services never call components. All services return `{ success: boolean, data?: T, error?: string }`.

**Key singletons:**
- `fileSystem` -- virtual filesystem operations
- `gitService` -- isomorphic-git wrapper
- `webContainer` -- WebContainers API
- `aiRegistry` -- AI provider registry

---

## ADR-009: Encrypted Secrets in SessionStorage

**Decision:** API keys encrypted with `crypto.ts` and stored in sessionStorage (not localStorage).

**Rationale:** API keys must not be stored in plaintext. SessionStorage clears on tab close (more secure than localStorage). Encryption adds defense-in-depth. Zustand `persist` only stores non-sensitive state in localStorage.

---

## ADR-010: Tailwind CSS + clsx

**Decision:** Tailwind CSS for styling, `clsx` for conditional class composition.

**Rationale:** Utility-first CSS avoids naming collisions. Purged in production for minimal bundle. `clsx` provides clean conditional class joining.

**Responsive breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Use `useMediaQuery` hook for responsive behavior in components.

---

## ADR-011: Vitest + Playwright Testing Stack

**Decision:** Vitest with happy-dom for unit/component tests, Playwright for E2E.

**Rationale:** Vitest is Vite-native, shares config, and runs fast with ESM. happy-dom is lighter than jsdom. Playwright covers all major browsers and mobile viewports.

**Configuration:**
- Globals enabled (`describe`, `it`, `expect`, `vi` available without imports)
- Setup file: `tests/setup.ts` (jest-dom matchers, auto-cleanup)
- Coverage thresholds: 80% for statements, branches, functions, lines
- Playwright: Chromium, Firefox, WebKit + mobile viewports

---

## ADR-012: CSP (Content Security Policy) Strategy

**Decision:** Strict CSP with environment-specific relaxations.

**Dev server:**
- `script-src 'self' 'unsafe-inline'` (required for Vite HMR)

**Production:**
- `script-src 'self'` (no unsafe-inline)
- `frame-src` includes `stackblitz.com` domains for WebContainers

**Rationale:** Defense-in-depth against XSS. Dev needs `unsafe-inline` for HMR but production is strict.

---

## ADR-013: GitHub Pages Deployment

**Decision:** Static deployment to GitHub Pages with `coi-serviceworker.js` for COOP/COEP headers.

**Rationale:** Free hosting for open-source project. GitHub Pages doesn't support custom headers, so `coi-serviceworker.js` intercepts requests and adds required headers for WebContainers.

**Base path:** `/browser-ide/` (configured in Vite `base` option).

---

## ADR-014: pnpm Package Manager

**Decision:** pnpm 8.14+ as the only allowed package manager.

**Rationale:** Strict dependency resolution, faster installs, disk-efficient via content-addressable storage. npm and yarn are explicitly forbidden for consistency.

---

## ADR-015: TDD with AI Agent-Assisted Coding

**Decision:** All development follows TDD (Red-Green-Refactor) with AI agent specifications in `docs/Agent/` directory. Six documents define agent working spec, boundaries, coding standards, TDD workflow, test strategy, and architecture decisions.

**Rationale:** AI-assisted development without guardrails produces inconsistent code. The `docs/Agent/` directory ensures AI-generated code follows the same patterns as human-written code.

---

## Summary Table

| ADR | Decision | Key Technology |
|-----|----------|---------------|
| 001 | Frontend framework | React 18 + Vite |
| 002 | State management | Zustand 4.4+ (monolithic + slices) |
| 003 | Code editor | Monaco Editor (local bundle) |
| 004 | Browser runtime | WebContainers API |
| 005 | Client-side DB | Dexie (IndexedDB) |
| 006 | Git integration | isomorphic-git + LightningFS |
| 007 | AI integration | Provider registry + 3 modes (Chat/Agent/CLI) |
| 008 | Service architecture | Singleton services with Result type |
| 009 | Secrets storage | Encrypted sessionStorage |
| 010 | Styling | Tailwind CSS + clsx |
| 011 | Testing | Vitest + happy-dom + Playwright |
| 012 | Security | Strict CSP with env-specific relaxations |
| 013 | Deployment | GitHub Pages + coi-serviceworker |
| 014 | Package manager | pnpm (only) |
| 015 | AI-assisted TDD | docs/Agent/ specifications |

---

**Document Version:** 1.0
**Last Updated:** March 2026
