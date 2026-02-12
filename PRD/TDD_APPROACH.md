# Test-Driven Development (TDD) Approach

## Browser IDE Pro v2.0 - Development Methodology

**Document Version:** 1.0
**Created:** February 2026
**Status:** Development Framework
**Methodology:** Test-Driven Development with AI-Assisted Code Generation
**References:**
- [Good Spec by Addy Osmani](https://addyosmani.com/blog/good-spec/)
- [Self-Improving Agents by Addy Osmani](https://addyosmani.com/blog/self-improving-agents/)

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [AGENT_SPEC.md](./AGENT_SPEC.md) | Structured spec for AI agents (Commands, Testing, Structure, Style, Git, Boundaries) |
| [AGENTS.md](../AGENTS.md) | Accumulated wisdom and learnings (updated each iteration) |
| [AGENT_BOUNDARIES.md](./AGENT_BOUNDARIES.md) | Three-tier boundary system (Always Do, Ask First, Never Do) |
| [REQUIREMENTS_BREAKDOWN.md](./REQUIREMENTS_BREAKDOWN.md) | Atomic task decomposition from PRD |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code style and conventions |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Testing framework and approach |
| [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) | Key technical decisions (ADRs) |

---

## Table of Contents

1. [Overview](#1-overview)
2. [TDD Workflow Phases](#2-tdd-workflow-phases)
3. [Phase 1: Architecture & Standards Definition](#3-phase-1-architecture--standards-definition)
4. [Phase 2: AI Planning](#4-phase-2-ai-planning)
5. [Phase 3: Test Case Development](#5-phase-3-test-case-development)
6. [Phase 4: AI Code Generation (Self-Improving Loop)](#6-phase-4-ai-code-generation)
7. [Phase 5: Review & Deployment](#7-phase-5-review--deployment)
8. [Testing Infrastructure](#8-testing-infrastructure)
9. [MCP Integration for Testing](#9-mcp-integration-for-testing)
10. [Requirement Traceability Matrix](#10-requirement-traceability-matrix)
11. [Quality Gates](#11-quality-gates)
12. [Modular Prompt Strategy](#12-modular-prompt-strategy)
13. [Appendix: Test Templates](#13-appendix-test-templates)

---

## 1. Overview

### 1.1 Philosophy

This project follows a **Test-Driven Development (TDD)** approach where:

1. **Tests are written BEFORE code**
2. **Requirements drive test cases**
3. **AI assists in both test generation and code implementation**
4. **Human developers verify, review, and approve at every stage**

### 1.2 Key Principles

| Principle | Description |
|-----------|-------------|
| **Red-Green-Refactor** | Write failing tests first, implement code to pass, then refactor |
| **Requirement Traceability** | Every test maps to a specific requirement (FR-*) |
| **Automated Verification** | CI/CD runs all tests on every change |
| **MCP-Driven UI Testing** | Playwright MCP for automated UI verification |
| **Separation of Concerns** | Backend tests, Frontend tests, E2E tests, Performance tests |
| **Self-Improving Loop** | Agents learn from iterations and persist wisdom in AGENTS.md |
| **Stateless but Iterative** | Fresh context per task, accumulated knowledge persists |

### 1.3 Self-Improving Agent Architecture

Based on [Addy Osmani's Self-Improving Agents](https://addyosmani.com/blog/self-improving-agents/), our AI agents follow a continuous improvement loop:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SELF-IMPROVING AGENT LOOP                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         ITERATION CYCLE                              │   │
│   │                                                                      │   │
│   │      ┌──────────┐                                                   │   │
│   │      │ 1. SELECT│ ◀──────────────────────────────────────┐         │   │
│   │      │   TASK   │                                        │         │   │
│   │      └────┬─────┘                                        │         │   │
│   │           │                                               │         │   │
│   │           ▼                                               │         │   │
│   │      ┌──────────┐                                        │         │   │
│   │      │2. IMPLEMENT                                       │         │   │
│   │      │   CODE   │                                        │         │   │
│   │      └────┬─────┘                                        │         │   │
│   │           │                                               │         │   │
│   │           ▼                                               │         │   │
│   │      ┌──────────┐     ┌──────────┐                       │         │   │
│   │      │3. VALIDATE├────▶│  FAIL?   │                       │         │   │
│   │      │  (Tests) │     └────┬─────┘                       │         │   │
│   │      └──────────┘          │                              │         │   │
│   │                            │ Yes                          │         │   │
│   │           ┌────────────────┴────────────────┐            │         │   │
│   │           ▼                                 │            │         │   │
│   │      ┌──────────┐                          │            │         │   │
│   │      │ 4. FIX   │──────────────────────────┘            │         │   │
│   │      │  & RETRY │                                        │         │   │
│   │      └──────────┘                                        │         │   │
│   │                                                          │         │   │
│   │           │ No (Pass)                                    │         │   │
│   │           ▼                                               │         │   │
│   │      ┌──────────┐                                        │         │   │
│   │      │5. COMMIT │                                        │         │   │
│   │      │  CODE    │                                        │         │   │
│   │      └────┬─────┘                                        │         │   │
│   │           │                                               │         │   │
│   │           ▼                                               │         │   │
│   │      ┌──────────┐                                        │         │   │
│   │      │ 6. LOG   │                                        │         │   │
│   │      │LEARNINGS │──────────▶ AGENTS.md                   │         │   │
│   │      └────┬─────┘                                        │         │   │
│   │           │                                               │         │   │
│   │           ▼                                               │         │   │
│   │      ┌──────────┐                                        │         │   │
│   │      │ 7. RESET │                                        │         │   │
│   │      │ CONTEXT  │────────────────────────────────────────┘         │   │
│   │      └──────────┘                                                   │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   MEMORY CHANNELS:                                                          │
│   ├── Git commit history (code changes in diffs)                           │
│   ├── Progress logs (chronological record)                                 │
│   ├── Task state files (completion status)                                 │
│   └── AGENTS.md (semantic learnings & patterns)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Concepts:

1. **Stateless but Iterative**: Each task gets a fresh, bounded context to prevent overflow
2. **Persistent Memory**: AGENTS.md accumulates learnings across iterations
3. **Validation at Every Step**: Tests run after implementation; failures trigger fixes
4. **Course Correction**: Developers can inject guidance mid-loop via AGENTS.md
5. **Bounded Scope**: One well-defined task at a time, never entire features

### 1.4 Memory Persistence (AGENTS.md)

The `AGENTS.md` file serves as the agent's accumulated wisdom:

```markdown
# AGENTS.md - Project Knowledge Base

## Patterns & Conventions
- All services use Result<T> pattern
- Use @/ path aliases, never relative imports
- Components always include data-testid

## Gotchas & Lessons Learned
- LightningFS requires async init before operations
- Monaco Editor needs explicit language registration
- WebContainers only work in Chromium browsers

## Recent Fixes
- Fixed: Terminal scroll jump (added scrollToBottom after output)
- Fixed: Type error in gitService.clone (missing auth parameter)

## Preferences
- Prefer small, focused functions over large ones
- Always handle loading/error states in components
```

### 1.5 Development Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TDD DEVELOPMENT WORKFLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 1: DEVELOPER DEFINES                                        │   │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐  │   │
│  │ │ Architecture│ │   Coding    │ │ Requirements                 │  │   │
│  │ │  Decisions  │ │  Standards  │ │ (Broken into small todos)   │  │   │
│  │ └─────────────┘ └─────────────┘ └─────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 2: AI PLANS                                                 │   │
│  │ ┌─────────────────────────────────────────────────────────────┐  │   │
│  │ │ Creates detailed implementation plans per requirement        │  │   │
│  │ │ Identifies dependencies and technical approach               │  │   │
│  │ └─────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 3: DEVELOPER REVIEWS & AI WRITES TESTS                      │   │
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────────────┐   │   │
│  │ │ Verify/Modify │ │ Share with    │ │ AI writes test cases  │   │   │
│  │ │ the approach  │ │ the team      │ │ (Backend + Playwright)│   │   │
│  │ └───────────────┘ └───────────────┘ └───────────────────────┘   │   │
│  │                                      │                            │   │
│  │                                      ▼                            │   │
│  │ ┌─────────────────────────────────────────────────────────────┐  │   │
│  │ │ Team reviews and approves test cases                         │  │   │
│  │ └─────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 4: AI GENERATES CODE                                        │   │
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │   │
│  │ │ Planner Agent │ │ Coder Agent   │ │ Reviewer Agent│           │   │
│  │ └───────────────┘ └───────────────┘ └───────────────┘           │   │
│  │                          │                                        │   │
│  │                          ▼                                        │   │
│  │ ┌─────────────────────────────────────────────────────────────┐  │   │
│  │ │ AI Verification: Linting → Tests → Build                     │  │   │
│  │ └─────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│                                    ▼                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 5: DEVELOPER REVIEWS & DEPLOYS                              │   │
│  │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐           │   │
│  │ │ Code Review   │ │ Merge to Main │ │ Deploy        │           │   │
│  │ └───────────────┘ └───────────────┘ └───────────────┘           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TDD Workflow Phases

### 2.1 Phase Summary

| Phase | Owner | Activities | Deliverables |
|-------|-------|------------|--------------|
| **Phase 1** | Developer | Define architecture, coding standards, break requirements into todos | Architecture doc, Standards doc, Todo list |
| **Phase 2** | AI | Create implementation plans | Implementation plans per feature |
| **Phase 3** | Developer + AI | Review plans, write test cases | Approved test suites |
| **Phase 4** | AI | Generate code, verify against tests | Passing codebase |
| **Phase 5** | Developer | Review, merge, deploy | Production release |

### 2.2 Iteration Cycle

Each feature follows this micro-cycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE DEVELOPMENT CYCLE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │
│   │  TODO   │───▶│  PLAN   │───▶│  TEST   │───▶│  CODE   │    │
│   │ Define  │    │  Create │    │  Write  │    │ Generate│    │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘    │
│        │              │              │              │          │
│        │              │              │              ▼          │
│        │              │              │        ┌─────────┐      │
│        │              │              │        │ VERIFY  │      │
│        │              │              │        │ (CI/CD) │      │
│        │              │              │        └─────────┘      │
│        │              │              │              │          │
│        │              │              │              ▼          │
│        │              │              │        ┌─────────┐      │
│        ◀──────────────┴──────────────┴────────│ REVIEW  │      │
│        │         (iterate if needed)          │ & MERGE │      │
│        │                                      └─────────┘      │
│        ▼                                                       │
│   ┌─────────┐                                                  │
│   │  DONE   │                                                  │
│   └─────────┘                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Architecture & Standards Definition

### 3.1 Developer Responsibilities

The software developer is responsible for defining:

#### 3.1.1 Architecture Decisions

Document key architectural decisions in `PRD/ARCHITECTURE_DECISIONS.md`:

| Decision Area | Options Considered | Decision | Rationale |
|--------------|-------------------|----------|-----------|
| **State Management** | Redux, Zustand, Jotai | Zustand | Simpler API, built-in persistence |
| **Testing Framework** | Jest, Vitest | Vitest | Native ESM, faster execution |
| **E2E Testing** | Cypress, Playwright | Playwright | Better MCP support, cross-browser |
| **Component Testing** | React Testing Library | React Testing Library | Community standard |
| **File System** | BrowserFS, LightningFS | LightningFS | isomorphic-git compatibility |
| **Database** | raw IndexedDB, Dexie | Dexie | TypeScript support, simpler API |

#### 3.1.2 Coding Standards

Document coding standards in `PRD/CODING_STANDARDS.md`:

```markdown
# Coding Standards for Browser IDE

## TypeScript
- Strict mode enabled (no `any` types)
- All interfaces in `src/types/index.ts`
- Explicit return types for all functions
- Use `type` for unions/intersections, `interface` for objects

## React Components
- Functional components only (no class components)
- Props interface named `{ComponentName}Props`
- Use `React.FC<Props>` type annotation
- Custom hooks start with `use` prefix

## File Organization
- One component per file
- Co-locate tests with components: `Component.tsx` + `Component.test.tsx`
- Services are singletons exported from their files

## Naming Conventions
- PascalCase: Components, Types, Interfaces
- camelCase: Functions, variables, hooks
- SCREAMING_SNAKE_CASE: Constants
- kebab-case: File names for non-components

## Error Handling
- Use Result pattern: `{ success: boolean, data?: T, error?: string }`
- All async operations wrapped in try/catch
- Use `logger` utility for logging (not console.log)

## Testing
- Test file naming: `*.test.ts` or `*.spec.ts`
- Use `describe` for grouping, `it` for test cases
- AAA pattern: Arrange, Act, Assert
- Mock external dependencies, never real APIs
```

#### 3.1.3 Requirements Breakdown

Break each FR-* requirement into atomic, testable todos:

**Example: FR-FS-001 (Virtual File System)**

```markdown
## FR-FS-001: Implement browser-based virtual file system using LightningFS

### Sub-tasks:
- [ ] FR-FS-001.1: Initialize LightningFS with IndexedDB backend
- [ ] FR-FS-001.2: Create file system singleton service
- [ ] FR-FS-001.3: Implement `readFile(path)` method
- [ ] FR-FS-001.4: Implement `writeFile(path, content)` method
- [ ] FR-FS-001.5: Implement `deleteFile(path)` method
- [ ] FR-FS-001.6: Implement `mkdir(path, recursive?)` method
- [ ] FR-FS-001.7: Implement `readdir(path)` method
- [ ] FR-FS-001.8: Implement `stat(path)` method
- [ ] FR-FS-001.9: Implement `exists(path)` method
- [ ] FR-FS-001.10: Handle errors gracefully with Result pattern
- [ ] FR-FS-001.11: Add TypeScript types for all methods
- [ ] FR-FS-001.12: Ensure isomorphic-git compatibility

### Acceptance Criteria:
- All methods return consistent Result types
- File operations persist across page refresh
- No data loss on concurrent operations
- Works in Chrome, Firefox, Edge (Safari with limitations)
```

### 3.2 Deliverables from Phase 1

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Architecture Decisions | `PRD/ARCHITECTURE_DECISIONS.md` | Key tech decisions with rationale |
| Coding Standards | `PRD/CODING_STANDARDS.md` | Coding conventions and patterns |
| Requirements Breakdown | `PRD/REQUIREMENTS_BREAKDOWN.md` | FR-* broken into atomic todos |
| Test Strategy | `PRD/TEST_STRATEGY.md` | Testing approach per component |

---

## 4. Phase 2: AI Planning

### 4.1 AI Agent Responsibilities

The AI (Claude) creates detailed implementation plans for each feature:

#### 4.1.1 Plan Structure

Each plan must include:

```markdown
# Implementation Plan: [Feature Name]

## Requirement Reference
- Primary: FR-XXX-XXX
- Related: FR-YYY-YYY, FR-ZZZ-ZZZ

## Overview
Brief description of what will be implemented.

## Technical Approach
1. Step 1: [Action]
2. Step 2: [Action]
3. ...

## Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/services/xxx.ts` | Create | New service file |
| `src/types/index.ts` | Modify | Add new types |

## Dependencies
- External: [npm packages needed]
- Internal: [other services/components needed]

## Data Flow
```
[Component] → [Service] → [Storage] → [Response]
```

## Edge Cases to Handle
1. Edge case 1
2. Edge case 2

## Test Coverage Required
- Unit tests for: [list]
- Integration tests for: [list]
- E2E tests for: [list]

## Estimated Complexity
- [ ] Low (< 100 lines)
- [ ] Medium (100-500 lines)
- [x] High (> 500 lines)

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Risk 1 | Mitigation 1 |
```

#### 4.1.2 AI Planning Agents

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Planner** | Creates implementation strategy | Requirements + Architecture | Implementation plan |
| **Researcher** | Investigates technical approaches | Plan + Questions | Technical recommendations |
| **Reviewer** | Reviews plans for completeness | Draft plan | Approved plan with feedback |

### 4.2 Deliverables from Phase 2

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Feature Plans | `PRD/plans/PLAN_FR-XXX.md` | Detailed plan per feature |
| Dependency Graph | `PRD/DEPENDENCY_GRAPH.md` | Feature implementation order |
| Risk Register | `PRD/RISK_REGISTER.md` | Identified risks and mitigations |

---

## 5. Phase 3: Test Case Development

### 5.1 Developer Review Process

Before AI writes tests, developers must:

1. **Review the implementation plan**
   - Verify technical approach is correct
   - Check for missing edge cases
   - Approve or request modifications

2. **Share with the team**
   - Present plan in team review meeting
   - Gather feedback from team members
   - Document decisions and changes

3. **Approve test strategy**
   - Confirm what needs to be tested
   - Agree on test coverage targets
   - Define acceptance criteria

### 5.2 AI Test Generation

#### 5.2.1 Test Categories

| Category | Framework | Location | Purpose |
|----------|-----------|----------|---------|
| **Unit Tests** | Vitest | `src/**/*.test.ts` | Test individual functions/classes |
| **Component Tests** | Vitest + RTL | `src/components/**/*.test.tsx` | Test React components |
| **Integration Tests** | Vitest | `tests/integration/*.test.ts` | Test service interactions |
| **E2E Tests** | Playwright | `tests/e2e/*.spec.ts` | Test full user flows |
| **API Tests** | Vitest | `tests/api/*.test.ts` | Test API integrations |
| **Performance Tests** | Playwright | `tests/performance/*.spec.ts` | Test performance metrics |

#### 5.2.2 Test Writing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEST WRITING WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AI receives approved implementation plan                     │
│                        │                                         │
│                        ▼                                         │
│  2. AI generates test cases based on:                           │
│     - Acceptance criteria                                        │
│     - Edge cases from plan                                       │
│     - Coding standards                                           │
│                        │                                         │
│                        ▼                                         │
│  3. AI creates test files:                                       │
│     ┌─────────────────────────────────────────────────────────┐ │
│     │ // FR-FS-001.test.ts                                    │ │
│     │ describe('FileSystem Service', () => {                  │ │
│     │   describe('readFile', () => {                          │ │
│     │     it('should read existing file', async () => {       │ │
│     │       // Arrange                                         │ │
│     │       // Act                                             │ │
│     │       // Assert                                          │ │
│     │     });                                                  │ │
│     │     it('should return error for non-existent', ...);   │ │
│     │   });                                                    │ │
│     │ });                                                      │ │
│     └─────────────────────────────────────────────────────────┘ │
│                        │                                         │
│                        ▼                                         │
│  4. Developer reviews generated tests                           │
│                        │                                         │
│                        ▼                                         │
│  5. Team approves test suite                                    │
│                        │                                         │
│                        ▼                                         │
│  6. Tests are committed (all should FAIL initially - RED)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.3 Playwright MCP Integration for UI Tests

Use Playwright MCP (Model Context Protocol) for automated UI testing:

```typescript
// tests/e2e/file-explorer.spec.ts
import { test, expect } from '@playwright/test';

/**
 * Requirement: FR-FS-010 - File tree navigation with expand/collapse
 * Tested via Playwright MCP
 */
test.describe('File Explorer - FR-FS-010', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for IDE to load
    await page.waitForSelector('[data-testid="file-explorer"]');
  });

  test('should display file tree on load', async ({ page }) => {
    const fileExplorer = page.locator('[data-testid="file-explorer"]');
    await expect(fileExplorer).toBeVisible();
  });

  test('should expand folder on click', async ({ page }) => {
    const folder = page.locator('[data-testid="folder-src"]');
    await folder.click();

    const children = page.locator('[data-testid="folder-src"] > [data-testid^="file-"]');
    await expect(children.first()).toBeVisible();
  });

  test('should collapse folder on second click', async ({ page }) => {
    const folder = page.locator('[data-testid="folder-src"]');

    // Expand
    await folder.click();
    await expect(page.locator('[data-testid="folder-src-expanded"]')).toBeVisible();

    // Collapse
    await folder.click();
    await expect(page.locator('[data-testid="folder-src-collapsed"]')).toBeVisible();
  });

  test('should navigate to file on click', async ({ page }) => {
    const file = page.locator('[data-testid="file-index-ts"]');
    await file.click();

    // Editor should open with file content
    const editor = page.locator('[data-testid="monaco-editor"]');
    await expect(editor).toContainText('// index.ts content');
  });
});
```

### 5.3 Test Coverage Requirements

| Component Type | Minimum Coverage | Target Coverage |
|---------------|------------------|-----------------|
| **Services** | 90% | 95% |
| **Utilities** | 90% | 95% |
| **React Components** | 80% | 90% |
| **Hooks** | 85% | 95% |
| **Store/State** | 85% | 95% |
| **E2E Flows** | 100% of critical paths | 100% |

### 5.4 Deliverables from Phase 3

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Unit Tests | `src/**/*.test.ts` | Unit tests per module |
| Component Tests | `src/components/**/*.test.tsx` | React component tests |
| Integration Tests | `tests/integration/` | Service integration tests |
| E2E Tests | `tests/e2e/` | Playwright E2E tests |
| Test Review Notes | `PRD/TEST_REVIEWS.md` | Team feedback on tests |

---

## 6. Phase 4: AI Code Generation

### 6.1 AI Code Generation Process

#### 6.1.1 Multi-Agent Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 AI CODE GENERATION WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     PLANNER AGENT                            ││
│  │  - Receives: Approved plan + Failing tests                   ││
│  │  - Creates: Detailed implementation steps                    ││
│  │  - Output: Step-by-step coding instructions                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     CODER AGENT                              ││
│  │  - Receives: Implementation steps + Tests                    ││
│  │  - Creates: Actual code implementation                       ││
│  │  - Follows: Coding standards                                 ││
│  │  - Output: Code that should pass tests                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    REVIEWER AGENT                            ││
│  │  - Receives: Generated code                                  ││
│  │  - Checks: Coding standards compliance                       ││
│  │  - Checks: Security vulnerabilities                          ││
│  │  - Checks: Performance issues                                ││
│  │  - Output: Review feedback / Approved code                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   VERIFICATION LOOP                          ││
│  │                                                               ││
│  │   ┌──────────┐   ┌──────────┐   ┌──────────┐               ││
│  │   │  LINT    │──▶│  TEST    │──▶│  BUILD   │               ││
│  │   │  CHECK   │   │  RUN     │   │  CHECK   │               ││
│  │   └──────────┘   └──────────┘   └──────────┘               ││
│  │        │              │              │                       ││
│  │        │              │              │                       ││
│  │        ▼              ▼              ▼                       ││
│  │   ┌─────────────────────────────────────────────────────┐   ││
│  │   │           ALL CHECKS PASS?                          │   ││
│  │   │                                                      │   ││
│  │   │   YES ───▶ Proceed to Human Review                  │   ││
│  │   │   NO  ───▶ Return to Coder Agent for fixes          │   ││
│  │   └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.1.2 Verification Commands

AI must run these commands and ensure all pass:

```bash
# 1. Linting
pnpm lint
# Must exit with code 0

# 2. Type Checking
pnpm type-check
# Must exit with code 0, no errors

# 3. Unit & Integration Tests
pnpm test
# All tests must pass

# 4. E2E Tests (via Playwright MCP)
pnpm test:e2e
# All tests must pass

# 5. Build
pnpm build
# Must complete successfully
```

#### 6.1.3 Code Generation Rules

| Rule | Description | Enforced By |
|------|-------------|-------------|
| **No `any` types** | All variables must have explicit types | TypeScript strict mode |
| **No console.log** | Use `logger` utility | ESLint rule |
| **Test coverage** | New code must have tests | Coverage thresholds |
| **Error handling** | All async must have try/catch | ESLint rule + Review |
| **Result pattern** | Services return `{ success, data, error }` | Code review |
| **Path aliases** | Use `@/` instead of `../` | ESLint rule |

### 6.2 Iteration on Failures

If tests fail, AI must:

1. **Analyze the failure** - Understand why the test failed
2. **Fix the code** - Modify implementation to pass the test
3. **Re-run verification** - Ensure fix doesn't break other tests
4. **Document the fix** - Note what was wrong and how it was fixed

```
┌─────────────────────────────────────────────────────────────────┐
│                      FAILURE ITERATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Test Fails                                                     │
│       │                                                          │
│       ▼                                                          │
│   Analyze Error Message                                          │
│       │                                                          │
│       ▼                                                          │
│   Identify Root Cause                                            │
│       │                                                          │
│       ├───────────────────────────────────────┐                 │
│       │                                       │                  │
│       ▼                                       ▼                  │
│   Code Bug                              Test Bug                 │
│       │                                       │                  │
│       ▼                                       ▼                  │
│   Fix Code                              Flag for Human Review    │
│       │                                       │                  │
│       ▼                                       │                  │
│   Re-run All Tests ◀──────────────────────────┘                 │
│       │                                                          │
│       ├──── Pass ───▶ Proceed                                   │
│       │                                                          │
│       └──── Fail ───▶ Iterate (max 5 attempts)                  │
│                           │                                      │
│                           └──▶ Escalate to Human if still fails │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Deliverables from Phase 4

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Implementation Code | `src/` | Feature implementation |
| Passing Tests | All test files | All tests now pass (GREEN) |
| Lint Report | CI output | Zero lint errors |
| Build Artifacts | `dist/` | Successful build |
| Change Log | PR description | What was implemented |

---

## 7. Phase 5: Review & Deployment

### 7.1 Developer Review Checklist

Before merging, developers must verify:

#### 7.1.1 Code Review Checklist

```markdown
## Code Review Checklist

### Architecture & Design
- [ ] Code follows established patterns from ARCHITECTURE_DECISIONS.md
- [ ] No over-engineering (minimal code for requirements)
- [ ] Service boundaries are respected
- [ ] State management follows Zustand patterns

### Code Quality
- [ ] No `any` types
- [ ] All functions have explicit return types
- [ ] Error handling is comprehensive
- [ ] No security vulnerabilities introduced
- [ ] No hardcoded secrets or API keys

### Testing
- [ ] All tests pass
- [ ] Coverage meets thresholds
- [ ] Tests cover edge cases from the plan
- [ ] No flaky tests introduced

### Documentation
- [ ] Complex logic has inline comments
- [ ] Public APIs have JSDoc comments
- [ ] README updated if needed

### Performance
- [ ] No obvious performance issues
- [ ] Large operations are async/non-blocking
- [ ] No memory leaks (event listeners cleaned up)

### Final Verification
- [ ] Ran `pnpm validate` locally
- [ ] Tested manually in browser
- [ ] Tested on mobile (if UI changes)
```

#### 7.1.2 Review Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       REVIEW FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AI Creates PR                                                   │
│       │                                                          │
│       ▼                                                          │
│  Automated Checks Run (CI/CD)                                    │
│       │                                                          │
│       ├──── Fails ───▶ AI Fixes Issues                          │
│       │                                                          │
│       ▼                                                          │
│  Developer Reviews Code                                          │
│       │                                                          │
│       ├──── Requests Changes ───▶ AI Makes Changes              │
│       │                                                          │
│       ▼                                                          │
│  Developer Approves                                              │
│       │                                                          │
│       ▼                                                          │
│  Merge to Main Branch                                            │
│       │                                                          │
│       ▼                                                          │
│  Deploy to Staging                                               │
│       │                                                          │
│       ▼                                                          │
│  Smoke Tests on Staging                                          │
│       │                                                          │
│       ├──── Fails ───▶ Rollback & Investigate                   │
│       │                                                          │
│       ▼                                                          │
│  Deploy to Production                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Deployment Process

| Stage | Action | Verification |
|-------|--------|--------------|
| **Pre-merge** | Run full CI/CD pipeline | All checks pass |
| **Merge** | Squash and merge to main | Linear history maintained |
| **Staging** | Auto-deploy to staging | Smoke tests pass |
| **Production** | Manual deployment trigger | Full E2E tests pass |
| **Post-deploy** | Monitor for errors | Error rate < baseline |

### 7.3 Deliverables from Phase 5

| Deliverable | Location | Description |
|-------------|----------|-------------|
| Merged PR | GitHub | Approved and merged code |
| Deployment | Production | Feature is live |
| Documentation | PRD/RELEASES.md | Release notes |

---

## 8. Testing Infrastructure

### 8.1 Test Framework Setup

#### 8.1.1 Directory Structure

```
browser-ide/
├── src/
│   ├── components/
│   │   ├── IDE/
│   │   │   ├── Editor.tsx
│   │   │   └── Editor.test.tsx          # Component test
│   ├── services/
│   │   ├── filesystem.ts
│   │   └── filesystem.test.ts           # Unit test
│   └── hooks/
│       ├── useFileSystem.ts
│       └── useFileSystem.test.ts        # Hook test
├── tests/
│   ├── integration/
│   │   ├── git-filesystem.test.ts       # Cross-service tests
│   │   └── ai-editor.test.ts
│   ├── e2e/
│   │   ├── file-explorer.spec.ts        # Playwright E2E
│   │   ├── git-workflow.spec.ts
│   │   ├── ai-chat.spec.ts
│   │   └── mobile/
│   │       └── touch-navigation.spec.ts
│   └── performance/
│       ├── large-file.spec.ts
│       └── git-clone.spec.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

#### 8.1.2 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
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

#### 8.1.3 Playwright Configuration

```typescript
// playwright.config.ts
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
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablet
    {
      name: 'iPad',
      use: { ...devices['iPad Pro 11'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 8.2 Test Scripts

Add to `package.json`:

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
    "test:e2e:mobile": "playwright test --project='Mobile Chrome' --project='Mobile Safari'",
    "test:all": "pnpm test && pnpm test:e2e",
    "validate": "pnpm type-check && pnpm lint && pnpm test && pnpm build"
  }
}
```

### 8.3 Mock Strategy

| External Dependency | Mock Strategy |
|---------------------|---------------|
| **IndexedDB** | `fake-indexeddb` package |
| **LightningFS** | In-memory mock implementation |
| **Anthropic API** | MSW (Mock Service Worker) |
| **GitHub API** | MSW with recorded responses |
| **WebContainers** | Custom mock with basic functionality |
| **Monaco Editor** | Render actual editor in jsdom |

---

## 9. MCP Integration for Testing

### 9.1 Playwright MCP Overview

Model Context Protocol (MCP) enables AI to interact with Playwright for automated testing:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYWRIGHT MCP ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   Claude    │────▶│  MCP Server │────▶│  Playwright │      │
│   │   (AI)      │◀────│             │◀────│   Browser   │      │
│   └─────────────┘     └─────────────┘     └─────────────┘      │
│                              │                    │             │
│                              │                    │             │
│                              ▼                    ▼             │
│                       ┌─────────────┐     ┌─────────────┐      │
│                       │ MCP Tools   │     │ Browser IDE │      │
│                       │ - navigate  │     │ (localhost) │      │
│                       │ - click     │     └─────────────┘      │
│                       │ - fill      │                          │
│                       │ - assert    │                          │
│                       │ - screenshot│                          │
│                       └─────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 MCP Server Setup

```typescript
// mcp/playwright-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { chromium, Browser, Page } from 'playwright';

class PlaywrightMCPServer {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  // MCP Tools
  tools = {
    navigate: async (url: string) => {
      await this.page?.goto(url);
      return { success: true, url };
    },

    click: async (selector: string) => {
      await this.page?.click(selector);
      return { success: true, selector };
    },

    fill: async (selector: string, value: string) => {
      await this.page?.fill(selector, value);
      return { success: true, selector, value };
    },

    getText: async (selector: string) => {
      const text = await this.page?.textContent(selector);
      return { success: true, text };
    },

    assertVisible: async (selector: string) => {
      const visible = await this.page?.isVisible(selector);
      return { success: visible, selector };
    },

    screenshot: async (name: string) => {
      const buffer = await this.page?.screenshot();
      return { success: true, screenshot: buffer?.toString('base64') };
    },

    waitForSelector: async (selector: string, timeout = 5000) => {
      await this.page?.waitForSelector(selector, { timeout });
      return { success: true, selector };
    },
  };
}
```

### 9.3 AI Using MCP for UI Testing

The AI can use MCP tools to verify UI requirements:

```markdown
## AI Test Verification Example

**Requirement:** FR-FS-010 - File tree navigation with expand/collapse

**AI Actions via MCP:**

1. Navigate to IDE
   ```
   mcp.navigate('http://localhost:5173')
   ```

2. Wait for file explorer
   ```
   mcp.waitForSelector('[data-testid="file-explorer"]')
   ```

3. Click on folder to expand
   ```
   mcp.click('[data-testid="folder-src"]')
   ```

4. Verify children are visible
   ```
   mcp.assertVisible('[data-testid="file-index-ts"]')
   ```

5. Take screenshot for documentation
   ```
   mcp.screenshot('file-explorer-expanded')
   ```

**Result:** PASS - Folder expands and shows children files
```

### 9.4 MCP-Driven Test Generation

AI can generate tests by first exploring the UI via MCP:

```typescript
// AI-generated test based on MCP exploration
test('file explorer expand/collapse - FR-FS-010', async ({ page }) => {
  // Navigate
  await page.goto('http://localhost:5173');

  // Wait for file explorer (discovered via MCP exploration)
  await page.waitForSelector('[data-testid="file-explorer"]');

  // Get initial state
  const srcFolder = page.locator('[data-testid="folder-src"]');
  await expect(srcFolder).toBeVisible();

  // Click to expand (action tested via MCP)
  await srcFolder.click();

  // Verify expansion (assertion tested via MCP)
  const indexFile = page.locator('[data-testid="file-index-ts"]');
  await expect(indexFile).toBeVisible();

  // Click to collapse
  await srcFolder.click();

  // Verify collapse
  await expect(indexFile).not.toBeVisible();
});
```

---

## 10. Requirement Traceability Matrix

### 10.1 Traceability Structure

Every test must map to a requirement:

| Requirement ID | Test File | Test Name | Status |
|---------------|-----------|-----------|--------|
| FR-FS-001 | `filesystem.test.ts` | `should initialize LightningFS` | Pending |
| FR-FS-001 | `filesystem.test.ts` | `should persist across refresh` | Pending |
| FR-FS-002 | `filesystem.test.ts` | `should create nested folders` | Pending |
| FR-FS-006 | `file-operations.test.ts` | `should create new file` | Pending |
| FR-FS-010 | `file-explorer.spec.ts` | `should expand folder on click` | Pending |
| FR-TERM-001 | `terminal.test.tsx` | `should render xterm.js` | Pending |
| FR-GIT-001 | `git.test.ts` | `should clone via HTTPS` | Pending |
| FR-AI-001 | `claude-agent.test.ts` | `should integrate Claude Code` | Pending |

### 10.2 Coverage Dashboard

Track requirement coverage:

```
┌─────────────────────────────────────────────────────────────────┐
│               REQUIREMENT COVERAGE DASHBOARD                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Category          Total   Tested  Covered  Coverage            │
│  ─────────────────────────────────────────────────────────────  │
│  File System       20      0       0        ░░░░░░░░░░ 0%       │
│  Terminal          12      0       0        ░░░░░░░░░░ 0%       │
│  Git               29      0       0        ░░░░░░░░░░ 0%       │
│  Claude Code       19      0       0        ░░░░░░░░░░ 0%       │
│  Settings          12      0       0        ░░░░░░░░░░ 0%       │
│  Project Mgmt      10      0       0        ░░░░░░░░░░ 0%       │
│  Code Execution    9       0       0        ░░░░░░░░░░ 0%       │
│  Storage           12      0       0        ░░░░░░░░░░ 0%       │
│  Mobile UX         4       0       0        ░░░░░░░░░░ 0%       │
│  Security          6       0       0        ░░░░░░░░░░ 0%       │
│  Performance       14      0       0        ░░░░░░░░░░ 0%       │
│  ─────────────────────────────────────────────────────────────  │
│  TOTAL             147     0       0        ░░░░░░░░░░ 0%       │
│                                                                  │
│  Legend: ░ = Pending, ▓ = Tested, █ = Passing                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Quality Gates

### 11.1 Gate Definitions

| Gate | Trigger | Criteria | Blocker? |
|------|---------|----------|----------|
| **G1: Plan Review** | Plan created | Developer approves plan | Yes |
| **G2: Test Review** | Tests written | Team approves tests | Yes |
| **G3: Lint** | Every commit | Zero lint errors | Yes |
| **G4: Type Check** | Every commit | Zero type errors | Yes |
| **G5: Unit Tests** | Every commit | 100% pass, 80%+ coverage | Yes |
| **G6: E2E Tests** | Every PR | 100% pass | Yes |
| **G7: Build** | Every PR | Successful build | Yes |
| **G8: Code Review** | Pre-merge | Developer approves | Yes |
| **G9: Staging** | Post-merge | Smoke tests pass | Yes |
| **G10: Production** | Pre-deploy | Full regression pass | Yes |

### 11.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, dev/*]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e

  build:
    needs: [lint, type-check, unit-tests, e2e-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy-staging:
    needs: [build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      # Deploy to staging environment
      - run: echo "Deploy to staging"

  deploy-production:
    needs: [deploy-staging]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      # Manual approval required in GitHub
      - run: echo "Deploy to production"
```

---

## 12. Modular Prompt Strategy

Based on [Addy Osmani's Good Spec](https://addyosmani.com/blog/good-spec/), avoid the "curse of instructions" by breaking work into focused, modular prompts.

### 12.1 The Problem with Large Specs

Research shows AI performance degrades when facing too many simultaneous requirements. One massive spec overwhelms the model.

### 12.2 Phase-Based Approach

Break the project into phases, feeding only relevant sections for each task:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MODULAR PROMPT PHASES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 1: Foundation                                                 │
│  ├── FR-FS-001: Virtual File System                                 │
│  ├── FR-FS-002: Folder Structure                                    │
│  └── FR-FS-003: IndexedDB Persistence                               │
│  Context: AGENT_SPEC.md (Sections 1,3,4), AGENTS.md                 │
│                                                                      │
│  PHASE 2: Editor                                                     │
│  ├── FR-FS-013: Monaco Integration                                  │
│  ├── FR-FS-014: Auto-save                                           │
│  └── FR-FS-015: Split View                                          │
│  Context: AGENT_SPEC.md (Sections 3,4), Monaco patterns             │
│                                                                      │
│  PHASE 3: Terminal                                                   │
│  ├── FR-TERM-001: xterm.js Integration                              │
│  └── FR-TERM-008: Shell Commands                                    │
│  Context: AGENT_SPEC.md (Sections 1,4), xterm patterns              │
│                                                                      │
│  PHASE 4: Git                                                        │
│  ├── FR-GIT-001: Clone                                              │
│  ├── FR-GIT-005: Commit                                             │
│  └── FR-GIT-006: Push                                               │
│  Context: AGENT_SPEC.md (Sections 1,5), isomorphic-git patterns     │
│                                                                      │
│  PHASE 5: AI Integration                                             │
│  ├── FR-AI-001: Provider Registry                                   │
│  ├── FR-AI-011: Anthropic Claude                                    │
│  └── FR-AI-016: Chat Panel                                          │
│  Context: AGENT_SPEC.md (Sections 4), AI provider patterns          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.3 Per-Task Context Strategy

For each task, provide only:

1. **AGENT_SPEC.md** - Relevant sections only
2. **The specific requirement** - From REQUIREMENTS_BREAKDOWN.md
3. **Related types** - From src/types/index.ts
4. **Existing patterns** - Similar code already in codebase
5. **AGENTS.md** - Relevant gotchas and learnings

### 12.4 Fresh Context Rule

After completing each task:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK COMPLETION CYCLE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. COMPLETE TASK                                                │
│     ├── Implement code                                          │
│     ├── Run tests (pnpm test)                                   │
│     └── Verify build (pnpm build)                               │
│                                                                  │
│  2. COMMIT CHANGES                                               │
│     ├── Stage files (git add)                                   │
│     └── Commit with message (git commit)                        │
│                                                                  │
│  3. UPDATE AGENTS.md                                             │
│     ├── Log new patterns discovered                             │
│     ├── Document gotchas encountered                            │
│     └── Record lessons learned                                  │
│                                                                  │
│  4. RESET CONTEXT                                                │
│     └── Start fresh for next task                               │
│                                                                  │
│  5. SELECT NEXT TASK                                             │
│     └── Load only relevant context for new task                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 12.5 Extended Table of Contents (For Large Specs)

When context is limited, use a summarized index:

```markdown
## Spec Index

### Section 1: Commands (AGENT_SPEC.md:50-120)
Summary: All executable commands for dev, test, build, deploy

### Section 2: Testing (AGENT_SPEC.md:121-200)
Summary: Framework config, coverage requirements, test patterns

### Section 3: Project Structure (AGENT_SPEC.md:201-300)
Summary: Directory layout, path rules, file organization

### Section 4: Code Style (AGENT_SPEC.md:301-450)
Summary: TypeScript patterns, React conventions, error handling

### Section 5: Git Workflow (AGENT_SPEC.md:451-520)
Summary: Branch naming, commit format, PR requirements

### Section 6: Boundaries (AGENT_SPEC.md:521-650)
Summary: Always do, Ask first, Never do actions
```

### 12.6 RAG Integration

For sophisticated agents, use retrieval-augmented generation:

1. **Index** all spec documents with embeddings
2. **Query** relevant sections based on current task
3. **Inject** only pertinent context into prompt
4. **Reduce** context window usage while maintaining accuracy

---

## 13. Appendix: Test Templates

### 13.1 Unit Test Template

```typescript
// Template: src/services/[service].test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { serviceFunction } from './service';

describe('ServiceName', () => {
  // Setup
  beforeEach(() => {
    // Initialize mocks
  });

  afterEach(() => {
    // Cleanup
    vi.clearAllMocks();
  });

  describe('functionName', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      const input = { /* test data */ };

      // Act
      const result = await serviceFunction(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(/* expected */);
    });

    it('should return error when [error condition]', async () => {
      // Arrange
      const invalidInput = { /* invalid data */ };

      // Act
      const result = await serviceFunction(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Expected error message');
    });
  });
});
```

### 13.2 Component Test Template

```typescript
// Template: src/components/[Component]/[Component].test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

// Mock dependencies
vi.mock('@/services/someService', () => ({
  someService: {
    someMethod: vi.fn(),
  },
}));

describe('ComponentName', () => {
  const defaultProps = {
    // Default test props
  };

  const renderComponent = (props = {}) => {
    return render(<ComponentName {...defaultProps} {...props} />);
  };

  it('should render without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  it('should display [content] when [condition]', () => {
    renderComponent({ someProp: 'value' });
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('should call [handler] when [action]', async () => {
    const onAction = vi.fn();
    renderComponent({ onAction });

    await userEvent.click(screen.getByRole('button'));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('should update state when [event]', async () => {
    renderComponent();

    await userEvent.type(screen.getByRole('textbox'), 'test input');

    await waitFor(() => {
      expect(screen.getByDisplayValue('test input')).toBeInTheDocument();
    });
  });
});
```

### 13.3 E2E Test Template

```typescript
// Template: tests/e2e/[feature].spec.ts
import { test, expect, Page } from '@playwright/test';

/**
 * Requirement: FR-XXX-XXX - [Requirement Description]
 */
test.describe('Feature Name - FR-XXX-XXX', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    // Common setup
  });

  test('should [expected behavior] when [user action]', async () => {
    // Arrange - Navigate to correct state
    await page.click('[data-testid="some-element"]');

    // Act - Perform user action
    await page.fill('[data-testid="input"]', 'test value');
    await page.click('[data-testid="submit"]');

    // Assert - Verify outcome
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
    await expect(page.locator('[data-testid="result"]')).toHaveText('Expected result');
  });

  test('should handle error when [error condition]', async () => {
    // Arrange
    await page.route('**/api/endpoint', (route) => {
      route.fulfill({ status: 500 });
    });

    // Act
    await page.click('[data-testid="trigger-api"]');

    // Assert
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should be responsive on mobile', async () => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile-specific behavior
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
  });
});
```

### 13.4 Integration Test Template

```typescript
// Template: tests/integration/[feature].test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { serviceA } from '@/services/serviceA';
import { serviceB } from '@/services/serviceB';

describe('Integration: ServiceA + ServiceB', () => {
  beforeAll(async () => {
    // Setup test environment
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestDatabase();
  });

  it('should [integrated behavior] when [scenario]', async () => {
    // Arrange
    const initialData = await serviceA.createSomething({ /* data */ });

    // Act
    const result = await serviceB.processWithA(initialData.id);

    // Assert
    expect(result.success).toBe(true);

    // Verify side effects
    const updatedData = await serviceA.getSomething(initialData.id);
    expect(updatedData.status).toBe('processed');
  });

  it('should maintain data consistency on failure', async () => {
    // Arrange
    const initialData = await serviceA.createSomething({ /* data */ });

    // Act - Simulate failure mid-operation
    vi.spyOn(serviceB, 'processStep2').mockRejectedValueOnce(new Error('Failure'));

    const result = await serviceB.processWithA(initialData.id);

    // Assert - Transaction should rollback
    expect(result.success).toBe(false);
    const data = await serviceA.getSomething(initialData.id);
    expect(data.status).toBe('unchanged');
  });
});
```

---

## Summary

This TDD approach ensures:

1. **Quality First** - Tests define expected behavior before code is written
2. **Full Traceability** - Every test maps to a requirement
3. **Automated Verification** - CI/CD enforces all quality gates
4. **Human Oversight** - Developers review and approve at every stage
5. **AI Assistance** - AI generates plans, tests, and code efficiently
6. **MCP Integration** - Playwright MCP enables AI-driven UI testing

By following this methodology, the Browser IDE project will maintain high quality while leveraging AI to accelerate development.

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Approved By:** [Pending Developer Approval]
