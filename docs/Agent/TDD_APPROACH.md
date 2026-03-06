# Test-Driven Development (TDD) Approach

## Browser IDE - AI-Assisted Development Framework

**Document Version:** 1.0
**Created:** March 2026
**Methodology:** Test-Driven Development with AI-Assisted Code Generation
**References:**
- [Good Spec by Addy Osmani](https://addyosmani.com/blog/good-spec/)
- [Self-Improving Agents by Addy Osmani](https://addyosmani.com/blog/self-improving-agents/)

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [AGENT_SPEC.md](./AGENT_SPEC.md) | Structured spec for AI agents (Commands, Testing, Structure, Style, Git, Boundaries) |
| [AGENT_BOUNDARIES.md](./AGENT_BOUNDARIES.md) | Three-tier boundary system (Always Do, Ask First, Never Do) |
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Code style and conventions |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Testing framework, pyramid, mock strategy, coverage |
| [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) | Key architectural decisions and rationale |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Ticket-Based Folder Structure](#2-ticket-based-folder-structure)
3. [TDD Workflow Phases](#3-tdd-workflow-phases)
4. [Phase 1: Architecture & Standards Definition](#4-phase-1-architecture--standards-definition)
5. [Phase 2: AI Planning](#5-phase-2-ai-planning)
6. [Phase 3: Test Case Development](#6-phase-3-test-case-development)
7. [Phase 4: AI Code Generation (Self-Improving Loop)](#7-phase-4-ai-code-generation)
8. [Phase 5: Review & Deployment](#8-phase-5-review--deployment)
9. [Quality Gates](#9-quality-gates)
10. [Modular Prompt Strategy](#10-modular-prompt-strategy)

---

## 1. Overview

### 1.1 Philosophy

This framework follows **strict TDD** where:

1. **Tests are written BEFORE code** -- no exceptions
2. **Requirements drive test cases** -- every test traces to a requirement
3. **AI assists in both test generation and code implementation**
4. **Human developers verify, review, and approve at every stage**

### 1.2 Key Principles

| Principle | Description |
|-----------|-------------|
| **Red-Green-Refactor** | Write failing tests first, implement to pass, then refactor |
| **Requirement Traceability** | Every test maps to a specific requirement (REQ-*) |
| **Automated Verification** | CI/CD runs all tests on every change |
| **Self-Improving Loop** | Agents learn from iterations and persist wisdom in AGENTS.md |
| **Stateless but Iterative** | Fresh context per task, accumulated knowledge persists |

### 1.3 Self-Improving Agent Architecture

```
SELF-IMPROVING AGENT LOOP

  1. SELECT TASK
       |
  2. IMPLEMENT CODE
       |
  3. VALIDATE (Tests)  -->  FAIL? --> 4. FIX & RETRY (max 5)
       |                                     |
       | Pass                                |
       v                                     |
  5. COMMIT                                  |
       |                                     |
  6. LOG LEARNINGS --> AGENTS.md             |
       |                                     |
  7. RESET CONTEXT  <------------------------+

  MEMORY CHANNELS:
    - Git commit history (code changes in diffs)
    - Task state files (completion status)
    - AGENTS.md (semantic learnings & patterns)
```

### 1.4 Memory Persistence (AGENTS.md)

The `AGENTS.md` file serves as the agent's accumulated wisdom:

```markdown
# AGENTS.md - Browser IDE Knowledge Base

## Patterns & Conventions
- Services are singletons returning APIResponse<T>
- Path alias: @/ for src/
- Zustand store with useShallow selectors
- Monaco Editor bundled locally (not CDN)

## Gotchas & Lessons Learned
- WebContainers require COOP/COEP headers
- coi-serviceworker only loads in production
- Anthropic API needs 'anthropic-dangerous-direct-browser-access' header

## Recent Fixes
- Fixed: Streaming JSON delta parsing (accumulate string, parse at block_stop)
- Fixed: z.ai proxy routing (use config.baseUrl, not hardcoded URL)
```

---

## 2. Ticket-Based Folder Structure

All AI-generated artifacts for a ticket are stored in a dedicated folder:

```
ai/
  TICKET-001/                    # Feature: AI streaming
    requirements/
      REQ-AI-001.md              # Streaming requirements
    plans/
      PLAN-AI-001.md             # Implementation plan
    tests/
      ai-streaming.test-spec.md  # Test specifications
    reviews/
      REVIEW-001.md              # Code review notes

  TICKET-002/                    # Feature: Git integration
    requirements/
    plans/
    tests/
    reviews/
```

### 2.1 Folder Conventions

| Folder | Contents | Created By |
|--------|----------|------------|
| `requirements/` | Atomic requirement breakdowns (REQ-*) | Developer + AI |
| `plans/` | Implementation plans per requirement | AI (reviewed by developer) |
| `tests/` | Test specifications written before code | AI (approved by developer) |
| `reviews/` | Code review notes, feedback, learnings | Developer + AI |

### 2.2 Workflow Per Ticket

```
1. Create ai/TICKET-X/ folder
2. Break requirements into ai/TICKET-X/requirements/
3. AI creates plans in ai/TICKET-X/plans/
4. Developer reviews plans
5. AI writes test specs in ai/TICKET-X/tests/
6. Developer approves test specs
7. AI implements code (tests first, then implementation)
8. Review notes in ai/TICKET-X/reviews/
```

---

## 3. TDD Workflow Phases

### 3.1 Phase Summary

| Phase | Owner | Activities | Deliverables |
|-------|-------|------------|--------------|
| **Phase 1** | Developer | Define architecture, standards, break requirements | Architecture doc, Standards doc, Todo list |
| **Phase 2** | AI | Create implementation plans | Plans in `ai/TICKET-X/plans/` |
| **Phase 3** | Developer + AI | Review plans, write test cases | Approved test suites |
| **Phase 4** | AI | Generate code, verify against tests | Passing codebase |
| **Phase 5** | Developer | Review, merge, deploy | Production release |

### 3.2 Iteration Cycle

```
TODO --> PLAN --> TEST --> CODE --> VERIFY --> REVIEW & MERGE --> DONE
  ^                                   |
  |       (iterate if needed)         |
  +-----------------------------------+
```

---

## 4. Phase 1: Architecture & Standards Definition

### 4.1 Developer Responsibilities

1. **Architecture Decisions** -- `docs/Agent/ARCHITECTURE_DECISIONS.md`
2. **Coding Standards** -- `docs/Agent/CODING_STANDARDS.md`
3. **Requirements Breakdown** -- `ai/TICKET-X/requirements/`

### 4.2 Requirements Breakdown

Break each requirement into atomic, testable sub-tasks:

```markdown
## REQ-AI-001: Implement AI streaming chat

### Sub-tasks:
- [ ] REQ-AI-001.1: Create AIProviderRegistry with provider interface
- [ ] REQ-AI-001.2: Implement Anthropic provider with SSE streaming
- [ ] REQ-AI-001.3: Implement OpenAI provider with SSE streaming
- [ ] REQ-AI-001.4: Add z.ai proxy support via configurable baseUrl
- [ ] REQ-AI-001.5: Add cancel/abort support for streaming
- [ ] REQ-AI-001.6: Display streaming text in chat UI

### Acceptance Criteria:
- Streaming shows text in real-time as chunks arrive
- Cancel button aborts the stream mid-response
- z.ai proxy URL is configurable in settings
- Error states show user-friendly messages
```

---

## 5. Phase 2: AI Planning

### 5.1 Plan Structure

Each plan in `ai/TICKET-X/plans/` must include:

```markdown
# Implementation Plan: [Feature Name]

## Requirement Reference
- Primary: REQ-XXX-NNN

## Technical Approach
1. Step 1: [Action]
2. Step 2: [Action]

## Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `src/services/ai-providers.ts` | Modify | Add streaming support |
| `src/components/IDE/AIPanel.tsx` | Modify | Add streaming UI |

## Dependencies
- External: [npm packages needed]
- Internal: [other services/modules needed]

## Edge Cases
1. Network disconnection during streaming
2. User cancels mid-stream

## Test Coverage Required
- Unit: ai-providers.test.ts
- Component: AIPanel.test.tsx
- E2E: ai-chat.spec.ts
```

---

## 6. Phase 3: Test Case Development

### 6.1 Test Categories

| Category | Framework | Location |
|----------|-----------|----------|
| Unit | Vitest + happy-dom | `src/**/*.test.ts` |
| Component | Vitest + React Testing Library | `src/**/*.test.tsx` |
| Integration | Vitest | `tests/integration/*.test.ts` |
| E2E | Playwright | `tests/e2e/*.spec.ts` |

See [TEST_STRATEGY.md](./TEST_STRATEGY.md) for detailed testing patterns, mock strategies, and coverage requirements.

### 6.2 AI Test Generation Flow

```
1. AI receives approved plan
2. AI generates test specs based on acceptance criteria + edge cases
3. AI creates test files (all should FAIL initially -- RED)
4. Developer reviews test suite
5. Tests committed to codebase
```

---

## 7. Phase 4: AI Code Generation

### 7.1 Verification Commands

AI must run and pass all of these:

```bash
pnpm lint          # Zero lint errors
pnpm type-check    # Zero type errors
pnpm test -- --run # All tests pass
pnpm build         # Build succeeds
```

### 7.2 Code Generation Rules

| Rule | Enforced By |
|------|-------------|
| No `any` types | TypeScript strict mode + ESLint |
| No `console.log` | ESLint (use `logger` utility) |
| Test coverage meets 80% | Vitest coverage |
| All async has error handling | ESLint + code review |
| Services return `APIResponse<T>` | Code review |
| `useShallow` for Zustand selectors | Code review |
| `@/` path aliases | ESLint import rules |

### 7.3 Iteration on Failures

```
Test Fails --> Analyze Error --> Identify Root Cause
  +-- Code Bug --> Fix Code --> Re-run All Tests
  +-- Test Bug --> Flag for Human Review

Max 5 retry attempts --> Escalate to human if still failing
```

---

## 8. Phase 5: Review & Deployment

### 8.1 Review Flow

```
AI Creates PR --> CI/CD Runs --> Developer Reviews
  +-- Requests Changes --> AI Fixes --> Re-review
  +-- Approves --> Merge --> Deploy to GitHub Pages
```

### 8.2 Deployment

| Stage | Action | Gate |
|-------|--------|------|
| Pre-merge | Full CI pipeline | All checks pass |
| Merge | Squash merge to main | Developer approval |
| Deploy | GitHub Pages via GitHub Actions | Build succeeds |

---

## 9. Quality Gates

| Gate | Trigger | Criteria | Blocker? |
|------|---------|----------|----------|
| **G1: Plan Review** | Plan created | Developer approves plan | Yes |
| **G2: Test Review** | Tests written | Developer approves tests | Yes |
| **G3: Lint** | Every commit | Zero lint errors | Yes |
| **G4: Type Check** | Every commit | Zero type errors | Yes |
| **G5: Unit Tests** | Every commit | 100% pass, meets 80% coverage | Yes |
| **G6: E2E Tests** | Every PR | 100% pass | Yes |
| **G7: Build** | Every PR | Successful build | Yes |
| **G8: Code Review** | Pre-merge | Developer approves | Yes |

---

## 10. Modular Prompt Strategy

### 10.1 Phase-Based Approach

Break the project into phases, feeding only relevant sections for each task:

```
Phase 1: Core IDE
  - REQ-EDIT-001: Monaco Editor integration
  - REQ-FS-001: Virtual filesystem
  - REQ-TERM-001: Terminal integration
  Context: AGENT_SPEC.md (Sections 1,3,4), AGENTS.md

Phase 2: AI Integration
  - REQ-AI-001: Chat mode (streaming)
  - REQ-AI-002: Agent mode (tool calling)
  - REQ-AI-003: Claude CLI mode
  Context: AGENT_SPEC.md (Sections 3,4), AI patterns

Phase 3: Git & Source Control
  - REQ-GIT-001: Git operations
  - REQ-GIT-002: Source control panel
  Context: AGENT_SPEC.md (Sections 3,4,5), Git patterns

Phase 4: WebContainers
  - REQ-WC-001: In-browser Node.js
  - REQ-WC-002: Package management
  Context: AGENT_SPEC.md (Sections 1,3), WebContainers docs

Phase 5: Polish
  - REQ-UI-001: Responsive design
  - REQ-UI-002: Settings & preferences
  Context: AGENT_SPEC.md (Section 4), UI patterns
```

### 10.2 Per-Task Context

For each task, provide only:

1. **Relevant AGENT_SPEC.md sections**
2. **The specific requirement** from `ai/TICKET-X/requirements/`
3. **Related type definitions** from `src/types/index.ts`
4. **Existing patterns** from the codebase
5. **AGENTS.md** -- relevant gotchas and learnings

### 10.3 Fresh Context Rule

After completing each task:

1. **Complete** -- implement, run tests, verify build
2. **Commit** -- stage and commit with conventional message
3. **Update AGENTS.md** -- log patterns, gotchas, lessons
4. **Reset context** -- start fresh for next task
5. **Select next task** -- load only relevant context

---

## Summary

This TDD approach ensures:

1. **Quality First** -- Tests define expected behavior before code is written
2. **Organized Artifacts** -- All ticket work lives in `ai/TICKET-X/` folders
3. **Full Traceability** -- Every test maps to a requirement
4. **Automated Verification** -- CI/CD enforces all quality gates
5. **Human Oversight** -- Developers review and approve at every stage
6. **AI Assistance** -- AI generates plans, tests, and code efficiently

---

**Document Version:** 1.0
**Last Updated:** March 2026
