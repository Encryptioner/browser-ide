# Test Strategy

## Browser IDE - Testing Approach

**Document Version:** 1.0
**Created:** March 2026
**Purpose:** Define testing strategy for TDD workflow

---

## 1. Testing Philosophy

| Principle | Description |
|-----------|-------------|
| **Test First** | Write tests before implementation (Red-Green-Refactor) |
| **Requirement Driven** | Every test traces to a requirement (REQ-*) |
| **Fast Feedback** | Tests run quickly, failures identified immediately |
| **Deterministic** | Same input always produces same output |
| **Independent** | Tests don't depend on other tests' state |
| **Readable** | Tests serve as living documentation |

### What to Test vs Skip

| Always Test | Skip Testing |
|-------------|--------------|
| Service logic (file ops, git, AI) | Monaco Editor internals |
| User interactions (click, type) | WebContainers API internals |
| Error scenarios and edge cases | Third-party library behavior |
| State management (Zustand actions) | Trivial getter functions |
| AI provider streaming/parsing | Pure presentational components (no logic) |
| Encryption/security logic | CSS styling details |

---

## 2. Test Pyramid

```
                    +----------+
                    |   E2E    |  10%
                    |  (Slow)  |
                   +------------+
                   | Integration|  20%
                   |  (Medium)  |
                  +--------------+
                  |     Unit     |  70%
                  |    (Fast)    |
                  +--------------+
```

| Type | Framework | Speed | Location |
|------|-----------|-------|----------|
| **Unit** | Vitest + happy-dom | < 5ms | `src/**/*.test.ts` |
| **Component** | Vitest + React Testing Library | < 50ms | `src/**/*.test.tsx` |
| **Integration** | Vitest | < 100ms | `tests/integration/` |
| **E2E** | Playwright | < 30s | `tests/e2e/` |

### Decision Tree

```
Q: Does it involve the DOM/UI?
    NO  --> Unit Test (Vitest)
    YES --> Continue

Q: Does it need multiple services to interact?
    YES --> Integration Test (Vitest)
    NO  --> Continue

Q: Is it a full user-facing workflow?
    YES --> E2E Test (Playwright)
    NO  --> Component Test (Vitest + React Testing Library)
```

---

## 3. Testing by Layer

### 3.1 Service Layer (Singletons)

Services return `APIResponse<T>` -- tests verify both success and error cases:

```typescript
describe('FileSystem', () => {
  describe('readFile', () => {
    it('should return file content when file exists', async () => {
      // Arrange
      await fileSystem.writeFile('/test.ts', 'const x = 1;');

      // Act
      const result = await fileSystem.readFile('/test.ts');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('const x = 1;');
    });

    it('should return error when file does not exist', async () => {
      // Act
      const result = await fileSystem.readFile('/nonexistent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### 3.2 React Components

Test components using React Testing Library:

```typescript
describe('FileExplorer', () => {
  const renderComponent = (props = {}) => {
    return render(<FileExplorer projectId="test" onFileSelect={vi.fn()} {...props} />);
  };

  it('should render file list', () => {
    renderComponent();
    expect(screen.getByTestId('file-explorer')).toBeInTheDocument();
  });

  it('should call onFileSelect when file is clicked', async () => {
    const onFileSelect = vi.fn();
    renderComponent({ onFileSelect });
    await userEvent.click(screen.getByTestId('file-item-index'));
    expect(onFileSelect).toHaveBeenCalledWith('/index.ts');
  });
});
```

### 3.3 Zustand Store

```typescript
describe('useIDEStore', () => {
  beforeEach(() => {
    useIDEStore.setState(initialState);
  });

  it('should set active file', () => {
    useIDEStore.getState().setActiveFile('/src/index.ts');
    expect(useIDEStore.getState().activeFile).toBe('/src/index.ts');
  });

  it('should add AI message to session', () => {
    const message: AIMessage = {
      id: 'msg-1',
      role: 'user',
      content: 'Hello',
      timestamp: Date.now(),
      parentId: null,
    };
    useIDEStore.getState().addAIMessage('session-1', message);
    expect(useIDEStore.getState().aiSessions['session-1'].messages).toContain(message);
  });
});
```

### 3.4 AI Providers

```typescript
describe('AnthropicProvider', () => {
  it('should stream response chunks', async () => {
    const chunks: StreamChunk[] = [];
    const onChunk = (chunk: StreamChunk): void => { chunks.push(chunk); };

    const result = await provider.complete(messages, config, onChunk);

    expect(result.success).toBe(true);
    expect(chunks.some(c => c.type === 'content')).toBe(true);
    expect(chunks.some(c => c.type === 'done')).toBe(true);
  });

  it('should return error when API key is invalid', async () => {
    const result = await provider.complete(messages, { ...config, apiKey: 'invalid' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### 3.5 E2E Tests (Playwright)

Use `data-testid` for stable selectors:

```typescript
test.describe('IDE Editor', () => {
  test('should open file from explorer and display in editor', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('file-explorer-item').first().click();
    await expect(page.getByTestId('editor-content')).toBeVisible();
  });

  test('should show AI panel when AI button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('ai-panel-toggle').click();
    await expect(page.getByTestId('ai-panel')).toBeVisible();
  });
});
```

---

## 4. Test Naming Convention

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return file content when file exists', async () => {});
it('should return error when path is invalid', async () => {});
it('should stream AI response when provider is configured', async () => {});
it('should abort streaming when cancel button is clicked', async () => {});
```

---

## 5. Mock Strategy

| Dependency | Mock Strategy |
|------------|---------------|
| **WebContainers API** | Custom mock with vi.fn() spawn/fs methods |
| **Monaco Editor** | Mock editor instance with setValue/getValue |
| **IndexedDB (Dexie)** | fake-indexeddb or in-memory mock |
| **Fetch API** | vi.fn() or MSW (Mock Service Worker) |
| **AI Providers** | Mock streaming responses with SSE format |
| **isomorphic-git** | Mock git operations returning test data |
| **Crypto (Web Crypto API)** | Mock encrypt/decrypt returning predictable output |

```typescript
// MSW example for AI provider mocking
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://api.anthropic.com/v1/messages', async () => {
    return HttpResponse.json({
      id: 'msg_test',
      content: [{ type: 'text', text: 'Hello from mock' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
  }),
];
```

---

## 6. Coverage Requirements

| Component Type | Minimum | Target |
|---------------|---------|--------|
| Services | 85% | 95% |
| Utilities | 90% | 95% |
| React Components | 75% | 85% |
| Hooks | 80% | 90% |
| Store Slices | 80% | 90% |
| **Overall** | **80%** | **90%** |

Critical flows (AI streaming, file operations, encryption) must have thorough edge case coverage.

---

## 7. Test Data Management

### Fixtures

Co-locate test fixtures with tests or in `tests/fixtures/`:

```typescript
// tests/fixtures/ai-messages.ts
export const testMessages: AIMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    timestamp: 1709000000000,
    parentId: null,
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Hi! How can I help?',
    timestamp: 1709000001000,
    parentId: 'msg-1',
  },
];
```

---

## 8. CI/CD Integration

Tests run in CI on every push and PR:

```yaml
jobs:
  lint-and-typecheck:
    steps: [checkout, install, pnpm lint, pnpm type-check]

  unit-tests:
    steps: [checkout, install, pnpm test:coverage, upload coverage]

  e2e-tests:
    steps: [checkout, install, install playwright, pnpm test:e2e]

  build:
    needs: [lint-and-typecheck, unit-tests, e2e-tests]
    steps: [checkout, install, pnpm build]
```

---

## 9. Flaky Test Policy

1. Flaky tests are marked `test.skip()` immediately with a TODO comment
2. Issue created to fix within 1 sprint
3. Three-strike rule: test removed if flaky 3 times after fixes
4. Never ignore or disable flaky tests silently

---

## 10. Test Review Checklist

- [ ] Tests cover happy path and error/exception cases
- [ ] Tests are deterministic (no random failures)
- [ ] Tests are independent (no shared mutable state)
- [ ] Tests are fast (unit < 5ms, integration < 100ms)
- [ ] Tests have descriptive names (`should ... when ...`)
- [ ] Tests use AAA pattern (Arrange-Act-Assert)
- [ ] Tests use `data-testid` for UI selectors (not CSS classes)
- [ ] Services tested for both success and error `APIResponse`
- [ ] Mocks are reset between tests (`vi.clearAllMocks()` in `afterEach`)
- [ ] Zustand store is reset between tests

---

## 11. Manual Testing

### Overview

Manual test cases complement the automated test suite by covering end-to-end user workflows, visual/UX validation, and cross-cutting concerns that are difficult to automate fully. Manual test cases are stored in:

```
docs/manual-test-cases.csv
```

### When to Create Manual Test Cases

- **Per feature**: Every feature ticket should include manual test cases
- **UI changes**: Visual or interaction changes that cannot be fully validated by automated tests
- **Cross-browser**: WebContainers behavior across different browsers
- **Mobile responsiveness**: Layout and interaction on touch devices
- **AI integration**: End-to-end AI workflows requiring API keys

### How Manual Tests Complement Automated Tests

| Aspect | Automated Tests | Manual Tests |
|--------|----------------|--------------|
| **Speed** | Fast, run in CI | Slower, run per release |
| **Coverage** | Unit logic, component behavior | Full user workflows, visual correctness |
| **Scope** | Isolated units | Cross-feature journeys |
| **Focus** | Regressions | UX, responsiveness, browser compat |

---

**Document Version:** 1.0
**Last Updated:** March 2026
