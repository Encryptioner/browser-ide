# Phase Tickets

## Browser IDE - TDD-Based Implementation Tickets

**Document Version:** 3.0
**Created:** February 2026
**Updated:** February 2026
**Purpose:** TDD-aligned tickets for existing codebase

---

## Important: Existing Codebase Context

**Current State:**
- ✅ Core services exist: `fileSystem`, `gitService`, `webContainer`, `aiRegistry`
- ✅ Monaco Editor, XTerm terminal integrated
- ✅ Zustand stores (`useIDEStore`, `useWorkspaceStore`)
- ✅ Comprehensive types in `src/types/index.ts`
- ❌ **No testing infrastructure** (Vitest, Playwright - GREENFIELD)
- ❌ **No test files** exist

**TDD Approach for Existing Codebase:**
1. **Phase 1:** Setup testing infrastructure (Vitest, Playwright)
2. **Phase 2:** Create plans for adding tests to existing services
3. **Phase 3 (RED):** Write tests for existing code (will pass initially, then we can add failing tests for new features)
4. **Phase 4 (GREEN):** Existing code already passes, implement new features with TDD
5. **Phase 5:** Review & Deploy

---

## Document Cross-Reference

| Document | Purpose | Key Sections |
|----------|---------|--------------|
| [TDD_APPROACH.md](./TDD_APPROACH.md) | TDD workflow | Self-improving agent loop |
| [AGENT_SPEC.md](./AGENT_SPEC.md) | AI working spec | Commands, Testing, Structure, Style, Git, Boundaries |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code conventions | TS, React, Zustand, Services, Error handling |
| [AGENT_BOUNDARIES.md](./AGENT_BOUNDARIES.md) | Risk management | Always Do, Ask First, Never Do |
| [REQUIREMENTS_BREAKDOWN.md](./REQUIREMENTS_BREAKDOWN.md) | Atomic tasks | 174 FR-* tasks |
| [AGENTS.md](../AGENTS.md) | Learned patterns | Update after each task |

---

## Phase 1: Architecture & Standards Definition

**Owner:** Developer
**Goal:** Setup testing infrastructure for existing codebase

---

### P1-001: Review Existing Architecture

| Field | Value |
|-------|-------|
| **ID** | P1-001 |
| **Title** | Review Existing Codebase Architecture |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/services/](../src/services/) - All singleton services
- [src/store/](../src/store/) - Zustand stores
- [src/components/](../src/components/) - React components
- [src/types/index.ts](../src/types/index.ts) - Type definitions

**Description:**
Review the existing codebase architecture to understand what services, stores, and components already exist.

**Existing Services:**
```markdown
- [x] fileSystem - LightningFS wrapper (src/services/filesystem.ts)
- [x] gitService - isomorphic-git operations (src/services/git.ts)
- [x] webContainer - WebContainer API (src/services/webcontainer.ts)
- [x] aiRegistry - Multi-LLM support (src/services/ai-providers.ts)
- [x] terminalSessionService - Terminal sessions (src/services/terminalSession.ts)
- [x] claudeAgentService - Claude AI (src/services/claude-agent.ts)
- [x] terminalCommandsService - Shell commands (src/services/terminalCommands.ts)
```

**Existing Stores:**
```markdown
- [x] useIDEStore - Main IDE state (src/store/useIDEStore.ts)
- [x] useWorkspaceStore - Workspace management (src/store/useWorkspaceStore.ts)
```

**Acceptance Criteria:**
- [ ] Developer understands existing service patterns
- [ ] Developer understands existing store structure
- [ ] Developer identifies what needs tests

---

### P1-002: Review and Approve Agent Specification

| Field | Value |
|-------|-------|
| **ID** | P1-002 |
| **Title** | Review Agent Specification |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [AGENT_SPEC.md](./AGENT_SPEC.md)

**Description:**
Review AGENT_SPEC.md and verify commands work with existing codebase.

**Tasks:**
```markdown
- [ ] Verify pnpm dev works (dev server on localhost:5173)
- [ ] Verify pnpm build works (production build)
- [ ] Note: pnpm test currently returns "No tests configured yet"
- [ ] Approve AGENT_SPEC.md
```

**Acceptance Criteria:**
- [ ] Dev server works
- [ ] Build works
- [ ] Developer approves agent spec

---

### P1-003: Review and Approve Coding Standards

| Field | Value |
|-------|-------|
| **ID** | P1-003 |
| **Title** | Review Coding Standards |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [src/services/filesystem.ts](../src/services/filesystem.ts) - Example of existing patterns

**Description:**
Review CODING_STANDARDS.md and verify existing code follows them.

**Existing Pattern Verification:**
```markdown
- [ ] Services use singleton pattern? YES (export const fileSystem = new FileSystemService())
- [ ] Services use Result<T> pattern? CHECK
- [ ] @/ path aliases used? YES (configured in vite.config.ts)
- [ ] No any types? VERIFY
- [ ] Explicit return types? VERIFY
```

**Acceptance Criteria:**
- [ ] Developer understands existing patterns
- [ ] Developer approves coding standards
- [ ] Any violations noted for refactoring

---

### P1-004: Review Agent Boundaries

| Field | Value |
|-------|-------|
| **ID** | P1-004 |
| **Title** | Review Agent Boundaries |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Estimated** | 15 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [AGENT_BOUNDARIES.md](./AGENT_BOUNDARIES.md)

**Description:**
Review three-tier boundary system.

**Tasks:**
```markdown
- [ ] Understand Tier 1: Always Do
- [ ] Understand Tier 2: Ask First (e.g., adding npm packages)
- [ ] Understand Tier 3: Never Do (e.g., commit to main, use any)
```

**Acceptance Criteria:**
- [ ] Developer understands boundaries

---

### P1-005: Setup Vitest (Unit Testing) ⚠️

| Field | Value |
|-------|-------|
| **ID** | P1-005 |
| **Title** | Setup Vitest Testing Framework |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Boundary** | ⚠️ Ask First (adding new packages) |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**Context References:**
- [package.json](../package.json) - Current dependencies
- [AGENT_BOUNDARIES.md - Tier 2](./AGENT_BOUNDARIES.md#tier-2-ask-first-requires-human-approval)

**Description:**
Setup Vitest for unit testing. This requires adding new packages.

**AI Prompt Context:**
```
You need to setup Vitest for the browser-ide project.

Current state:
- React 18.2.0 with Vite 5.0.8
- No testing framework installed
- TypeScript strict mode enabled

Tasks:
1. Install vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom
2. Create vitest.config.ts
3. Update package.json test scripts
4. Create tests/setup.ts for test globals

Follow AGENT_SPEC.md Section 2: Testing for configuration.

BOUNDARY CHECK: This requires adding npm packages - falls under Tier 2: Ask First
Create approval request for adding packages.
```

**Packages to Add:**
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^23.0.0",
    "happy-dom": "^12.0.0"
  }
}
```

**vitest.config.ts to Create:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // or 'happy-dom'
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Acceptance Criteria:**
- [ ] Vitest installed
- [ ] `pnpm test` runs Vitest
- [ ] `pnpm test:watch` works
- [ ] `pnpm test:coverage` generates coverage report
- [ ] `pnpm test:ui` launches UI

---

### P1-006: Setup Playwright (E2E Testing) ⚠️

| Field | Value |
|-------|-------|
| **ID** | P1-006 |
| **Title** | Setup Playwright E2E Testing |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Boundary** | ⚠️ Ask First (adding new packages) |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**Context References:**
- [package.json](../package.json) - Current dependencies
- [AGENT_BOUNDARIES.md - Tier 2](./AGENT_BOUNDARIES.md#tier-2-ask-first-requires-human-approval)

**Description:**
Setup Playwright for E2E testing.

**AI Prompt Context:**
```
You need to setup Playwright for E2E testing.

Current state:
- React 18.2.0 with Vite 5.0.8
- No E2E testing framework
- Dev server runs on localhost:5173

Tasks:
1. Install @playwright/test
2. Create playwright.config.ts
3. Create tests/e2e directory
4. Update package.json with e2e scripts
5. Run npx playwright install

BOUNDARY CHECK: Adding npm packages - Tier 2: Ask First
```

**Packages to Add:**
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

**playwright.config.ts to Create:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Acceptance Criteria:**
- [ ] Playwright installed
- [ ] `pnpm test:e2e` runs E2E tests
- [ ] `pnpm test:e2e:ui` launches UI
- [ ] Browsers installed

---

### P1-007: Create Test Setup Files

| Field | Value |
|-------|-------|
| **ID** | P1-007 |
| **Title** | Create Test Setup and Helper Files |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [AGENT_SPEC.md - Section 2: Testing](./AGENT_SPEC.md#2-testing)
- [CODING_STANDARDS.md - Section 6: Testing Standards](./CODING_STANDARDS.md#6-testing-standards)

**Files to Create:**

**1. tests/setup.ts** - Vitest setup
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

**2. tests/mocks.ts** - Mock factories
```typescript
import { vi } from 'vitest';

// Mock fileSystem service
export const mockFileSystem = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  deleteFile: vi.fn(),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  exists: vi.fn(),
  init: vi.fn(),
};

// Mock gitService
export const mockGitService = {
  clone: vi.fn(),
  status: vi.fn(),
  add: vi.fn(),
  commit: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
  branch: vi.fn(),
  checkout: vi.fn(),
};

// More mocks as needed...
```

**3. tests/test-utils.tsx** - React test utilities
```typescript
import { render, RenderOptions } from '@testing-library/react';
import { IDEState } from '@/types';

// Custom render function with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add providers (Zustand, Router, etc.)
  return render(ui, options);
}
```

**Acceptance Criteria:**
- [ ] tests/setup.ts created
- [ ] tests/mocks.ts created with service mocks
- [ ] tests/test-utils.tsx created
- [ ] `pnpm test` runs without errors (0 files, but setup works)

---

### P1-008: Update package.json Scripts

| Field | Value |
|-------|-------|
| **ID** | P1-008 |
| **Title** | Update package.json Test Scripts |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Boundary** | ⚠️ Ask First (modifying package.json) |
| **Estimated** | 15 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [package.json](../package.json)
- [AGENT_SPEC.md - Section 1: Commands](./AGENT_SPEC.md#1-commands)

**Current test script:** `"test": "echo 'No tests configured yet' && exit 0"`

**Update to:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "pnpm test && pnpm test:e2e"
  }
}
```

**Acceptance Criteria:**
- [ ] package.json updated
- [ ] All scripts work
- [ ] `pnpm test` runs Vitest
- [ ] `pnpm test:e2e` runs Playwright

---

### P1-009: Initialize AGENTS.md

| Field | Value |
|-------|-------|
| **ID** | P1-009 |
| **Title** | Initialize AGENTS.md with Existing Patterns |
| **Priority** | P0 (Blocking) |
| **TDD Phase** | Setup |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [AGENTS.md](../AGENTS.md)
- [src/services/](../src/services/) - Existing service patterns

**Description:**
Initialize AGENTS.md with patterns from existing codebase.

**AGENTS.md Template:**
```markdown
# AGENTS.md - Browser IDEject Knowledge Base

## Technology Stack
- **Frontend:** React 18.2, TypeScript 5.3, Vite 5.0
- **State:** Zustand 4.4 with localStorage persistence
- **Database:** Dexie 3.2 (IndexedDB wrapper)
- **File System:** LightningFS (IndexedDB-backed)
- **Git:** isomorphic-git 1.25
- **Editor:** Monaco Editor
- **Terminal:** xterm.js 5.5
- **AI:** Anthropic Claude, GLM-4, OpenAI
- **Testing:** Vitest (unit), Playwright (E2E)

## Service Patterns

### Singleton Export Pattern
All services use singleton export:
\`\`\`typescript
class FileSystemService { ... }
export const fileSystem = new FileSystemService();
\`\`\`

### Result<T> Pattern
Services return consistent result objects:
\`\`\`typescript
interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
}
\`\`\`

## Technology-Specific Gotchas

### LightningFS (File System)
- MUST call `init()` before any file operations
- All paths are absolute (start with `/`)
- IndexedDB operations are async

### Monaco Editor
- Large bundle (~2MB) - lazy load if possible
- Must register languages explicitly
- Uses @monaco-editor/react wrapper

### isomorphic-git
- Requires CORS proxy for GitHub operations
- Use `singleBranch: true` and `depth: 1` for faster clones

### xterm.js
- Requires fit addon for resize handling
- Scroll to bottom after command output
- Use add-ons: fit, web-links

## Testing Patterns

### Service Mocking
- Mock singleton exports from services
- Use vi.mock() for service modules
- Clear mocks in afterEach

### Component Testing
- Use @testing-library/react
- data-testid selectors for E2E compatibility
- User event simulation for interactions

## Existing Services Reference

| Service | Location | Purpose |
|---------|----------|---------|
| fileSystem | src/services/filesystem.ts | LightningFS wrapper |
| gitService | src/services/git.ts | isomorphic-git wrapper |
| webContainer | src/services/webcontainer.ts | WebContainer API wrapper |
| aiRegistry | src/services/ai-providers.ts | Multi-LLM provider registry |
| terminalSessionService | src/services/terminalSession.ts | Terminal session management |

## Lessons Learned
*This section will be updated after each implementation*
```

**Acceptance Criteria:**
- [ ] AGENTS.md created in project root
- [ ] Documents existing patterns
- [ ] Ready for agent updates

---

## Phase 2: AI Planning

**Owner:** AI (Planner Agent)
**Goal:** Create implementation plans for adding tests

---

### P2-001: Create Plan - Test FileSystemService (FR-FS-001)

| Field | Value |
|-------|-------|
| **ID** | P2-001 |
| **Title** | Create Test Plan: FileSystemService |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/services/filesystem.ts](../src/services/filesystem.ts) - Existing service
- [AGENT_SPEC.md - Section 2: Testing](./AGENT_SPEC.md#2-testing)
- [CODING_STANDARDS.md - Section 6: Testing Standards](./CODING_STANDARDS.md#6-testing-standards)
- [REQUIREMENTS_BREAKDOWN.md - FR-FS-001](./REQUIREMENTS_BREAKDOWN.md#fr-fs-001-virtual-file-system-with-lightningfs)

**AI Prompt Context:**
```
You are creating a TEST PLAN for the existing FileSystemService.

Read:
1. src/services/filesystem.ts - understand the existing implementation
2. AGENT_SPEC.md Section 2: Testing - test framework and patterns
3. CODING_STANDARDS.md Section 6: Testing Standards - AAA pattern, coverage
4. REQUIREMENTS_BREAKDOWN.md FR-FS-001 - all sub-requirements to test

The FileSystemService already exists. You need to create a plan for:
1. Writing comprehensive unit tests for all methods
2. Testing the Result<T> pattern
3. Testing error handling
4. Testing edge cases

Create: PRD/plans/PLAN_TEST-filesystem.md
```

**Plan Template:**
```markdown
# Test Plan: FileSystemService

## Service Location
src/services/filesystem.ts

## Methods to Test
| Method | FR Requirement | Test Focus |
|--------|---------------|------------|
| init() | FR-FS-001.03 | LightningFS initialization |
| readFile() | FR-FS-001.04 | Success, file not found, error handling |
| writeFile() | FR-FS-001.05 | Create, overwrite, parent creation |
| deleteFile() | FR-FS-001.06 | Success, file not found |
| mkdir() | FR-FS-001.07 | Single, recursive, exists |
| readdir() | FR-FS-001.08 | Success, not directory, error |
| stat() | FR-FS-001.09 | File metadata, not found |
| exists() | FR-FS-001.10 | True for exists, false for not |

## Test File Location
src/services/filesystem.test.ts (co-located)

## Mock Strategy
- Mock LightningFS internal operations
- Test Result<T> pattern compliance
- Test error handling with try-catch

## Edge Cases to Cover
1. IndexedDB quota exceeded
2. File not found scenarios
3. Concurrent operations
4. Invalid paths

## Coverage Target
- Statements: 90%
- Branches: 85%
- Functions: 90%
- Lines: 90%
```

**AI Output:** `PRD/plans/PLAN_TEST-filesystem.md`

---

### P2-002: Create Plan - Test GitService (FR-GIT-001 to FR-GIT-009)

| Field | Value |
|-------|-------|
| **ID** | P2-002 |
| **Title** | Create Test Plan: GitService |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 45 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/services/git.ts](../src/services/git.ts) - Existing service
- [REQUIREMENTS_BREAKDOWN.md - FR-GIT](./REQUIREMENTS_BREAKDOWN.md#3-git-integration-fr-git)

**AI Output:** `PRD/plans/PLAN_TEST-git.md`

---

### P2-003: Create Plan - Test Editor Component (FR-FS-013)

| Field | Value |
|-------|-------|
| **ID** | P2-003 |
| **Title** | Create Test Plan: Monaco Editor Component |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/components/IDE/Editor.tsx](../src/components/IDE/Editor.tsx) - Existing component
- [REQUIREMENTS_BREAKDOWN.md - FR-FS-013](./REQUIREMENTS_BREAKDOWN.md#fr-fs-013-monaco-editor-integration)

**AI Output:** `PRD/plans/PLAN_TEST-editor.md`

---

### P2-004: Create Plan - Test FileExplorer Component (FR-FS-010)

| Field | Value |
|-------|-------|
| **ID** | P2-004 |
| **Title** | Create Test Plan: FileExplorer Component |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/components/IDE/FileExplorer.tsx](../src/components/IDE/FileExplorer.tsx) - Existing component
- [REQUIREMENTS_BREAKDOWN.md - FR-FS-010](./REQUIREMENTS_BREAKDOWN.md#fr-fs-010-file-tree-navigation)

**AI Output:** `PRD/plans/PLAN_TEST-file-explorer.md`

---

### P2-005: Create Plan - Test Terminal Component (FR-TERM-001)

| Field | Value |
|-------|-------|
| **ID** | P2-005 |
| **Title** | Create Test Plan: Terminal Component |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/components/IDE/Terminal.tsx](../src/components/IDE/Terminal.tsx) - Existing component
- [REQUIREMENTS_BREAKDOWN.md - FR-TERM-001](./REQUIREMENTS_BREAKDOWN.md#fr-term-001-xtermjs-terminal)

**AI Output:** `PRD/plans/PLAN_TEST-terminal.md`

---

### P2-006: Create Plan - Test AI Provider Registry (FR-AI-001)

| Field | Value |
|-------|-------|
| **ID** | P2-006 |
| **Title** | Create Test Plan: AI Provider Registry |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 30 minutes |
| **Status** | `[ ]` Not Started |

**Context References:**
- [src/services/ai-providers.ts](../src/services/ai-providers.ts) - Existing service
- [REQUIREMENTS_BREAKDOWN.md - FR-AI](./REQUIREMENTS_BREAKDOWN.md#4-claude-code-cli-integration-fr-ai)

**AI Output:** `PRD/plans/PLAN_TEST-ai-providers.md`

---

### P2-007: Create E2E Test Plans

| Field | Value |
|-------|-------|
| **ID** | P2-007 |
| **Title** | Create E2E Test Plans |
| **Priority** | P0 |
| **TDD Phase** | Planning |
| **Boundary** | ✅ Always Do |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**Description:**
Create E2E test plans for critical user flows.

**E2E Flows to Plan:**
```markdown
- [ ] File Operations Flow: Create, edit, save, delete file
- [ ] Git Workflow Flow: Clone, modify, commit, push
- [ ] Terminal Flow: Run commands, see output
- [ ] AI Chat Flow: Send message, receive streaming response
- [ ] Editor Flow: Open file, edit content, syntax highlighting
```

**AI Output:** `PRD/plans/PLAN_E2E-tests.md`

---

## Phase 3: Test Case Development (RED Phase)

**Owner:** Developer + AI
**Goal:** Write tests for existing code
**Note:** Since code exists, tests will PASS initially. We then add failing tests for new features.

---

### P3-001: Developer Approves Test Plans

| Field | Value |
|-------|-------|
| **ID** | P3-001 |
| **Title** | Review and Approve All Test Plans |
| **Priority** | P0 |
| **TDD Phase** | RED (preparation) |
| **Boundary** | ⚠️ Ask First |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**Description:**
Developer reviews all test plans from Phase 2.

**Tasks:**
```markdown
- [ ] Review PLAN_TEST-filesystem.md
- [ ] Review PLAN_TEST-git.md
- [ ] Review PLAN_TEST-editor.md
- [ ] Review PLAN_TEST-file-explorer.md
- [ ] Review PLAN_TEST-terminal.md
- [ ] Review PLAN_TEST-ai-providers.md
- [ ] Review PLAN_E2E-tests.md
- [ ] Approve all or request changes
```

**Acceptance Criteria:**
- [ ] All plans reviewed
- [ ] Plans cover existing functionality
- [ ] Plans include edge cases
- [ ] Developer approves

---

### P3-002: AI Generates Tests - FileSystemService

| Field | Value |
|-------|-------|
| **ID** | P3-002 |
| **Title** | Generate Tests: FileSystemService |
| **Priority** | P0 |
| **TDD Phase** | RED/GREEN (existing code) |
| **Boundary** | ✅ Always Do |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**Context References:**
- [PRD/plans/PLAN_TEST-filesystem.md](./plans/PLAN_TEST-filesystem.md)
- [src/services/filesystem.ts](../src/services/filesystem.ts)
- [AGENT_SPEC.md - Section 2: Testing](./AGENT_SPEC.md#2-testing)
- [tests/mocks.ts](../tests/mocks.ts) - Mock factories

**AI Prompt Context:**
```
You are writing unit tests for the EXISTING FileSystemService.

Read:
1. PRD/plans/PLAN_TEST-filesystem.md - test plan
2. src/services/filesystem.ts - implementation
3. AGENT_SPEC.md Section 2: Testing - AAA pattern, naming
4. CODING_STANDARDS.md Section 6: Testing Standards

Create: src/services/filesystem.test.ts

IMPORTANT: Since the service exists, tests will PASS initially.
Focus on:
1. Comprehensive coverage of all methods
2. Testing Result<T> pattern
3. Testing error cases
4. Testing edge cases
5. Using mocks for LightningFS

Use AAA pattern (Arrange, Act, Assert).
Use descriptive naming: "should [expected] when [condition]"
```

**AI Output:** `src/services/filesystem.test.ts`

**Verification:**
```bash
pnpm test filesystem.test.ts
# Expected: Tests pass (GREEN phase for existing code)
```

---

### P3-003: AI Generates Tests - GitService

| Field | Value |
|-------|-------|
| **ID** | P3-003 |
| **Title** | Generate Tests: GitService |
| **Priority** | P0 |
| **TDD Phase** | RED/GREEN |
| **Boundary** | ✅ Always Do |
| **Estimated** | 1 hour |
| **Status** | `[ ]` Not Started |

**AI Output:** `src/services/git.test.ts`

---

### P3-004: AI Generates Tests - Components

| Field | Value |
|-------|-------|
| **ID** | P3-004 |
| **Title** | Generate Tests: IDE Components |
| **Priority** | P0 |
| **TDD Phase** | RED/GREEN |
| **Boundary** | ✅ Always Do |
| **Estimated** | 2 hours |
| **Status** | `[ ]` Not Started |

**Components to Test:**
```markdown
- [ ] src/components/IDE/Editor.test.tsx
- [ ] src/components/IDE/FileExplorer.test.tsx
- [ ] src/components/IDE/Terminal.test.tsx
- [ ] src/components/IDE/ClaudeCodePanel.test.tsx
```

---

### P3-005: AI Generates E2E Tests

| Field | Value |
|-------|-------|
| **ID** | P3-005 |
| **Title** | Generate E2E Tests: Critical Flows |
| **Priority** | P0 |
| **TDD Phase** | RED/GREEN |
| **Boundary** | ✅ Always Do |
| **Estimated** | 2 hours |
| **Status** | `[ ]` Not Started |

**E2E Tests to Create:**
```markdown
- [ ] tests/e2e/file-operations.spec.ts
- [ ] tests/e2e/git-workflow.spec.ts
- [ ] tests/e2e/terminal.spec.ts
- [ ] tests/e2e/ai-chat.spec.ts
- [ ] tests/e2e/editor.spec.ts
```

---

## Ticket Status Summary

| Phase | Total Tickets | Pending | In Progress | Completed |
|-------|---------------|---------|-------------|-----------|
| Phase 1: Setup Testing Infrastructure | 9 | 9 | 0 | 0 |
| Phase 2: AI Planning | 7 | 7 | 0 | 0 |
| Phase 3: Test Development | 5 | 5 | 0 | 0 |
| **Phase 1-3 TOTAL** | **21** | **21** | **0** | **0** |

---

## Quick Reference: Existing Services

| Service | Location | Status | Needs Tests |
|---------|----------|--------|-------------|
| fileSystem | src/services/filesystem.ts | ✅ Exists | Yes |
| gitService | src/services/git.ts | ✅ Exists | Yes |
| webContainer | src/services/webcontainer.ts | ✅ Exists | Yes |
| aiRegistry | src/services/ai-providers.ts | ✅ Exists | Yes |
| terminalSessionService | src/services/terminalSession.ts | ✅ Exists | Yes |
| claudeAgentService | src/services/claude-agent.ts | ✅ Exists | Yes |
| terminalCommandsService | src/services/terminalCommands.ts | ✅ Exists | Yes |

---

**Document Version:** 3.0
**Last Updated:** February 2026
