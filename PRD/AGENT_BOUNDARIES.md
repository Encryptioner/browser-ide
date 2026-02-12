# Agent Boundaries & Safeguards

## Browser IDE Pro v2.0 - Risk Management for AI Agents

**Document Version:** 1.0
**Created:** February 2026
**Reference:** [Addy Osmani's Good Spec](https://addyosmani.com/blog/good-spec/)

---

## Overview

This document defines the **Three-Tier Boundary System** for AI agents working on this project. Every action falls into one of three categories:

| Tier | Symbol | Description | Action Required |
|------|--------|-------------|-----------------|
| **Always Do** | ✅ | Safe actions, auto-approved | Execute immediately |
| **Ask First** | ⚠️ | High-impact changes | Request human approval |
| **Never Do** | 🚫 | Hard stops, forbidden actions | Refuse and explain |

---

## Tier 1: Always Do (Auto-Approved)

These actions are safe and expected. Execute without asking.

### Code Quality

| Action | Reason |
|--------|--------|
| ✅ Run `pnpm type-check` | Catch type errors early |
| ✅ Run `pnpm lint` | Maintain code quality |
| ✅ Run `pnpm lint:fix` | Auto-fix linting issues |
| ✅ Run `pnpm format` | Consistent formatting |
| ✅ Run `pnpm test` | Verify no regressions |
| ✅ Run `pnpm build` | Ensure build succeeds |

### Development

| Action | Reason |
|--------|--------|
| ✅ Create new TypeScript files in `src/` | Standard development |
| ✅ Create new test files (`*.test.ts`, `*.test.tsx`) | TDD workflow |
| ✅ Add/modify React components | Standard development |
| ✅ Add/modify service methods | Standard development |
| ✅ Add/modify custom hooks | Standard development |
| ✅ Add/modify utility functions | Standard development |

### Code Patterns

| Action | Reason |
|--------|--------|
| ✅ Use Result<T> pattern in services | Project convention |
| ✅ Use @/ path aliases | Project convention |
| ✅ Use logger utility | Project convention |
| ✅ Add data-testid attributes | E2E testing |
| ✅ Add JSDoc to public functions | Documentation |
| ✅ Use explicit TypeScript types | Type safety |
| ✅ Add try-catch to async operations | Error handling |

### Git Operations

| Action | Reason |
|--------|--------|
| ✅ Check `git status` | Information gathering |
| ✅ Check `git diff` | Review changes |
| ✅ Check `git log` | Review history |
| ✅ Create feature branches | Isolation |
| ✅ Stage files with `git add` | Standard workflow |
| ✅ Commit to feature branches | Standard workflow |

### File Reading

| Action | Reason |
|--------|--------|
| ✅ Read any file in `src/` | Understanding code |
| ✅ Read any file in `tests/` | Understanding tests |
| ✅ Read any file in `PRD/` | Understanding requirements |
| ✅ Read `package.json` | Understanding dependencies |
| ✅ Read config files | Understanding configuration |

---

## Tier 2: Ask First (Requires Human Approval)

These actions have significant impact. Always request approval before proceeding.

### Database & State

| Action | Why Ask |
|--------|---------|
| ⚠️ Modify `src/lib/database.ts` schema | Data migration required |
| ⚠️ Change Dexie version number | Breaking change possible |
| ⚠️ Modify Zustand store structure | Persisted state affected |
| ⚠️ Change localStorage/IndexedDB keys | Data loss possible |

### Dependencies

| Action | Why Ask |
|--------|---------|
| ⚠️ Add new npm packages | Bundle size, security, licensing |
| ⚠️ Remove existing packages | Breaking changes |
| ⚠️ Update package versions | Compatibility concerns |
| ⚠️ Modify `pnpm-lock.yaml` | Reproducibility |

### Configuration

| Action | Why Ask |
|--------|---------|
| ⚠️ Modify `vite.config.ts` | Build behavior changes |
| ⚠️ Modify `tsconfig.json` | Compilation behavior |
| ⚠️ Modify `tailwind.config.js` | Styling changes |
| ⚠️ Modify `.eslintrc.cjs` | Linting rules |
| ⚠️ Modify `playwright.config.ts` | Test behavior |
| ⚠️ Modify `vitest.config.ts` | Test behavior |

### Security-Sensitive

| Action | Why Ask |
|--------|---------|
| ⚠️ Modify authentication code | Security critical |
| ⚠️ Modify encryption/decryption | Security critical |
| ⚠️ Modify CORS proxy settings | Security implications |
| ⚠️ Change API endpoints | External service impact |
| ⚠️ Modify credential storage | Security critical |

### API & Breaking Changes

| Action | Why Ask |
|--------|---------|
| ⚠️ Rename public API functions | Breaking change |
| ⚠️ Change function signatures | Breaking change |
| ⚠️ Remove exported functions | Breaking change |
| ⚠️ Modify service singleton exports | Dependency impact |

### CI/CD

| Action | Why Ask |
|--------|---------|
| ⚠️ Modify `.github/workflows/` | CI pipeline changes |
| ⚠️ Modify deployment scripts | Production impact |
| ⚠️ Change environment variables | Runtime behavior |

### Large Refactors

| Action | Why Ask |
|--------|---------|
| ⚠️ Rename files | Import updates needed |
| ⚠️ Move files between directories | Import updates needed |
| ⚠️ Split/merge components | Architecture change |
| ⚠️ Change folder structure | Project organization |

### Approval Request Format

When asking for approval, use this format:

```markdown
## Approval Request

**Action:** [What you want to do]
**Reason:** [Why this is necessary]
**Impact:** [What will be affected]
**Risk:** [Low/Medium/High]
**Alternatives:** [Other options considered]

**Files to modify:**
- `path/to/file1.ts`
- `path/to/file2.ts`

**Changes preview:**
[Brief description or diff snippet]

**Awaiting approval to proceed.**
```

---

## Tier 3: Never Do (Hard Stops)

These actions are **forbidden**. Refuse immediately and explain why.

### Security Violations

| Action | Consequence |
|--------|-------------|
| 🚫 Commit API keys or secrets | Security breach |
| 🚫 Commit passwords or tokens | Security breach |
| 🚫 Commit `.env` files | Credential exposure |
| 🚫 Hard-code credentials in source | Security vulnerability |
| 🚫 Disable HTTPS for API calls | Man-in-the-middle risk |
| 🚫 Store sensitive data unencrypted | Data breach risk |

### Git Violations

| Action | Consequence |
|--------|-------------|
| 🚫 Commit directly to `main` | Bypass code review |
| 🚫 Force push to `main` | History loss |
| 🚫 Force push to shared branches | Collaboration issues |
| 🚫 Rewrite published history | Team disruption |
| 🚫 Delete remote branches without approval | Data loss |

### Code Quality Violations

| Action | Consequence |
|--------|-------------|
| 🚫 Use `any` type | Type safety violation |
| 🚫 Use `console.log` in production code | Use logger instead |
| 🚫 Skip error handling in async code | Unhandled rejections |
| 🚫 Disable ESLint rules without approval | Code quality |
| 🚫 Remove existing tests without reason | Coverage regression |
| 🚫 Merge code that fails tests | Quality gate violation |

### System Violations

| Action | Consequence |
|--------|-------------|
| 🚫 Edit `node_modules/` | Temporary, lost on install |
| 🚫 Edit `dist/` (build output) | Overwritten on build |
| 🚫 Edit lock files manually | Reproducibility |
| 🚫 Delete user data | Data loss |
| 🚫 Execute shell commands without sandboxing | System security |

### Privacy Violations

| Action | Consequence |
|--------|-------------|
| 🚫 Log user credentials | Privacy breach |
| 🚫 Send user data to external services without consent | GDPR violation |
| 🚫 Store personal data without encryption | Compliance violation |

### Refusal Response Format

When refusing a forbidden action:

```markdown
## Action Refused

**Requested action:** [What was requested]
**Category:** 🚫 Never Do
**Reason:** [Why this is forbidden]
**Consequence:** [What could go wrong]

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
| Work on feature branches only | Never commit to `main` |
| Create PR for all changes | No direct merges |
| Require tests to pass | Block merge on failure |
| Require human approval | No auto-merge |

### Execution Sandboxing

| Environment | Allowed Actions |
|-------------|-----------------|
| Read operations | Always allowed |
| Write to `src/`, `tests/` | Allowed |
| Write to config files | Ask first |
| Write outside project | Never |
| Network requests | Only to documented APIs |
| System commands | Only documented commands |

### Stop Conditions

Immediately stop and escalate if:

1. **Error loop**: Same error occurs 3+ times
2. **Scope creep**: Task requires changes outside original scope
3. **Uncertainty**: Unclear how to proceed safely
4. **Conflict**: Multiple valid approaches, need human decision
5. **Security concern**: Action may have security implications

---

## Human Intervention Points

### Developer Can Always:

1. **Pause** agent at any point
2. **Modify** AGENTS.md to inject guidance
3. **Override** boundaries with explicit approval
4. **Review** all changes before merge
5. **Reject** and rollback any changes

### Intervention Triggers:

| Trigger | Action |
|---------|--------|
| Agent stuck > 3 iterations | Human review needed |
| Conflicting requirements | Human decision needed |
| Security-sensitive changes | Human approval required |
| Breaking changes | Human approval required |
| Performance-critical paths | Human review recommended |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOUNDARY QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ ALWAYS DO                                                   │
│  • Run tests, lint, type-check                                  │
│  • Create/modify code in src/, tests/                           │
│  • Use project conventions (Result<T>, @/, logger)              │
│  • Add data-testid, JSDoc, types                                │
│  • Git: status, diff, branch, add, commit (feature branch)      │
│                                                                  │
│  ⚠️ ASK FIRST                                                   │
│  • Database schema, Zustand structure                           │
│  • Add/remove/update dependencies                               │
│  • Config files (vite, tsconfig, eslint)                        │
│  • Security-sensitive code                                       │
│  • API changes, breaking changes                                │
│  • CI/CD modifications                                          │
│                                                                  │
│  🚫 NEVER DO                                                    │
│  • Commit secrets/credentials                                    │
│  • Commit to main directly                                      │
│  • Use `any` type                                               │
│  • Use console.log (use logger)                                 │
│  • Skip error handling                                          │
│  • Remove tests without reason                                  │
│  • Edit node_modules/                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Document Version:** 1.0
**Last Updated:** February 2026
