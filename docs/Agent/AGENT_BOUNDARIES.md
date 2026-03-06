# Agent Boundaries & Safeguards

## Browser IDE - Risk Management for AI Agents

**Document Version:** 1.0
**Created:** March 2026
**Reference:** [Addy Osmani's Good Spec](https://addyosmani.com/blog/good-spec/)

---

## Overview

This document defines the **Three-Tier Boundary System** for AI agents working on the Browser IDE project. Every action falls into one of three categories:

| Tier | Symbol | Description | Action Required |
|------|--------|-------------|-----------------|
| **Always Do** | -- | Safe actions, auto-approved | Execute immediately |
| **Ask First** | -- | High-impact changes | Request human approval |
| **Never Do** | -- | Hard stops, forbidden actions | Refuse and explain |

---

## Tier 1: Always Do (Auto-Approved)

These actions are safe and expected. Execute without asking.

### Code Quality

| Action | Reason |
|--------|--------|
| Run type checking (`pnpm type-check`) | Catch type errors early |
| Run linter (`pnpm lint`) | Maintain code quality |
| Run linter auto-fix (`pnpm lint:fix`) | Auto-fix linting issues |
| Run formatter (`pnpm format`) | Consistent formatting |
| Run test suite (`pnpm test -- --run`) | Verify no regressions |
| Run build (`pnpm build`) | Ensure build succeeds |

### Development

| Action | Reason |
|--------|--------|
| Create new source files in `src/` | Standard development |
| Create new test files (`*.test.ts`, `*.test.tsx`) | TDD workflow |
| Add/modify React components in `src/components/` | Standard development |
| Add/modify services in `src/services/` | Standard development |
| Add/modify hooks in `src/hooks/` | Standard development |
| Add/modify types in `src/types/index.ts` | Single source of truth |
| Add/modify utilities in `src/utils/` | Standard development |

### Code Patterns

| Action | Reason |
|--------|--------|
| Return `APIResponse<T>` from service methods | Project convention |
| Use `@/` path aliases for imports | Project convention |
| Use `logger` utility from `@/utils/logger` | Project convention |
| Use `sonner` for toast notifications | Project convention |
| Use `useShallow` for Zustand selectors | Performance convention |
| Use `clsx` for conditional class names | Project convention |
| Use `useMediaQuery` hook for responsive design | Project convention |
| Add `data-testid` for E2E-testable elements | E2E testing |
| Add documentation comments to complex logic | Documentation |
| Use explicit types / avoid `any` | Type safety |
| Add error handling to async operations | Error handling |

### Git Operations

| Action | Reason |
|--------|--------|
| Check `git status` | Information gathering |
| Check `git diff` | Review changes |
| Check `git log` | Review history |
| Create feature branches | Isolation |
| Stage files with `git add` | Standard workflow |
| Commit to feature branches | Standard workflow |

### File Reading

| Action | Reason |
|--------|--------|
| Read any file in `src/` | Understanding code |
| Read any file in `tests/` | Understanding tests |
| Read any file in `docs/` | Understanding requirements |
| Read `package.json`, `tsconfig.json` | Understanding config |
| Read `vite.config.ts`, `vitest.config.ts` | Understanding build/test setup |

---

## Tier 2: Ask First (Requires Human Approval)

These actions have significant impact. Always request approval before proceeding.

### Database & State

| Action | Why Ask |
|--------|---------|
| Modify Dexie schema in `src/lib/database.ts` | Data migration required |
| Change IndexedDB version or table structure | Existing data may be incompatible |
| Modify Zustand store structure in `useIDEStore.ts` | Persisted state impact |
| Change `partialize` configuration in store | localStorage compatibility |
| Modify encrypted session storage logic | API keys stored there |

### Dependencies

| Action | Why Ask |
|--------|---------|
| Add new packages or libraries | Bundle size, security, licensing |
| Remove existing packages | Breaking changes |
| Update package versions | Compatibility concerns |
| Modify `pnpm-lock.yaml` | Reproducibility |

### Configuration

| Action | Why Ask |
|--------|---------|
| Modify `vite.config.ts` | Build behavior, CSP headers, COOP/COEP |
| Modify `tsconfig.json` | Compilation behavior |
| Modify `tailwind.config.js` | Styling changes |
| Modify ESLint/Prettier configuration | Linting rules |
| Modify `vitest.config.ts` or `playwright.config.ts` | Test behavior |

### Security-Sensitive

| Action | Why Ask |
|--------|---------|
| Modify CSP (Content Security Policy) headers | Security implications |
| Modify COOP/COEP headers | WebContainers requirement |
| Change WebContainers command allowlist | Command injection risk |
| Modify `crypto.ts` encryption logic | API key security |
| Change AI provider API integration code | External service impact |
| Modify `anthropic-dangerous-direct-browser-access` usage | Security implications |
| Change z.ai proxy routing logic | API routing impact |

### API & Breaking Changes

| Action | Why Ask |
|--------|---------|
| Rename exported service singletons | Breaking change |
| Change service method signatures | Dependency impact |
| Remove exported functions or types | Breaking change |
| Modify AI provider registry interface | Multiple consumers |

### Large Refactors

| Action | Why Ask |
|--------|---------|
| Rename files | Import/reference updates needed |
| Move files between directories | Import/reference updates needed |
| Split/merge components | Architecture change |
| Change folder structure | Project organization |

### Approval Request Format

When asking for approval, use this format:

```markdown
## Approval Request

**Action:** [What you want to do]
**Reason:** [Why this is necessary]
**Impact:** [What will be affected]
**Risk:** [Low/Medium/High]

**Files to modify:**
- `path/to/file1`
- `path/to/file2`

**Awaiting approval to proceed.**
```

---

## Tier 3: Never Do (Hard Stops)

These actions are **forbidden**. Refuse immediately and explain why.

### Security Violations

| Action | Consequence |
|--------|-------------|
| Commit API keys or secrets | Security breach |
| Commit `.env` files | Credential exposure |
| Hard-code credentials in source | Security vulnerability |
| Store API keys in localStorage unencrypted | Key exposure |
| Disable CSP headers | XSS vulnerability |

### Git Violations

| Action | Consequence |
|--------|-------------|
| Commit directly to `main`/`master` | Bypass code review |
| Force push to `main`/`master` | History loss |
| Force push to shared branches | Collaboration issues |
| Delete remote branches without approval | Data loss |

### Code Quality Violations

| Action | Consequence |
|--------|-------------|
| Use `any` type in production code | Type safety violation |
| Use `console.log` in production code (use `logger`) | Logging standards violation |
| Skip error handling in async code | Unhandled rejections |
| Disable linter rules without approval | Code quality regression |
| Remove existing tests without reason | Coverage regression |
| Merge code that fails tests | Quality gate violation |
| Use npm or yarn instead of pnpm | Package manager consistency |

### System Violations

| Action | Consequence |
|--------|-------------|
| Edit `node_modules/` | Temporary, lost on install |
| Edit `dist/` build output | Overwritten on build |
| Edit lock files manually | Reproducibility |
| Modify `coi-serviceworker.js` | WebContainers breaks |

### Refusal Response Format

When refusing a forbidden action:

```markdown
## Action Refused

**Requested action:** [What was requested]
**Category:** Never Do
**Reason:** [Why this is forbidden]

**Alternative approach:**
[Suggest a safe alternative if applicable]
```

---

## Risk Management Safeguards

### Iteration Limits

| Safeguard | Limit | Action on Exceed |
|-----------|-------|------------------|
| Max retry attempts per task | 5 | Escalate to human |
| Max files modified per task | 10 | Request approval |
| Max lines changed per file | 500 | Request approval |
| Max new dependencies per task | 3 | Request approval |

### Branch Protection

| Rule | Enforcement |
|------|-------------|
| Work on feature branches only | Never commit to `main`/`master` |
| Create PR for all changes | No direct merges |
| Require tests to pass | Block merge on failure |
| Require human approval | No auto-merge |

### Stop Conditions

Immediately stop and escalate if:

1. **Error loop**: Same error occurs 3+ times
2. **Scope creep**: Task requires changes outside original scope
3. **Uncertainty**: Unclear how to proceed safely
4. **Conflict**: Multiple valid approaches, need human decision
5. **Security concern**: Action may have security implications

---

## Browser IDE-Specific Boundaries

### WebContainers

| Action | Tier |
|--------|------|
| Read WebContainers process output | Always Do |
| Spawn commands from the allowlist | Always Do |
| Modify the command allowlist | Ask First |
| Remove COOP/COEP headers | Never Do |
| Allow arbitrary shell commands | Never Do |

### Monaco Editor

| Action | Tier |
|--------|------|
| Configure editor themes, keybindings | Always Do |
| Add new language support | Ask First |
| Bundle Monaco from CDN (use local) | Never Do |

### AI Integration

| Action | Tier |
|--------|------|
| Call AI providers with user-configured keys | Always Do |
| Stream responses and update UI | Always Do |
| Modify provider base URLs | Ask First |
| Add new AI providers | Ask First |
| Expose API keys in client-side logs | Never Do |

---

## Quick Reference Card

```
BOUNDARY QUICK REFERENCE

  ALWAYS DO
  * Run tests, lint, type-check, format
  * Create/modify code in src/ and tests/
  * Follow project conventions (logger, sonner, useShallow, @/ aliases)
  * Add data-testid, explicit types, error handling
  * Git: status, diff, branch, add, commit (feature branch)

  ASK FIRST
  * Dexie schema, IndexedDB migrations
  * Zustand store structure, persistence config
  * Add/remove/update dependencies
  * Config files (vite, tsconfig, eslint, vitest)
  * Security: CSP, COOP/COEP, crypto, WebContainers allowlist
  * AI provider API changes

  NEVER DO
  * Commit secrets/credentials
  * Commit to main/master directly
  * Use `any` type in production
  * Use console.log (use logger)
  * Use npm/yarn (pnpm only)
  * Skip error handling
  * Remove tests without reason
  * Edit node_modules/ or dist/
```

---

**Document Version:** 1.0
**Last Updated:** March 2026
