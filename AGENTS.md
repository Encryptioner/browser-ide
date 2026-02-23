# AGENTS.md - AI Agent Knowledge Base

## Browser IDE - Accumulated Wisdom

**Purpose:** This file persists learnings across AI agent iterations
**Reference:** [Self-Improving Agents by Addy Osmani](https://addyosmani.com/blog/self-improving-agents/)

---

## Quick Reference

Before starting any task, read the relevant sections below. After completing a task, update this file with new learnings.

---

## 1. Project Patterns & Conventions

### Service Layer Pattern

```typescript
// All services follow this pattern
class ServiceName {
  async operation(input: Input): Promise<Result<Output>> {
    try {
      const result = await this.doWork(input);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}

// Export as singleton
export const serviceName = new ServiceName();
```

### Import Conventions

```typescript
// ALWAYS use @/ path aliases
import { fileSystem } from '@/services/filesystem';
import type { FileNode } from '@/types';

// NEVER use relative imports
// import { fileSystem } from '../../../services/filesystem'; // BAD
```

### Component Patterns

```typescript
// All components need data-testid for E2E tests
function Button({ onClick }: ButtonProps): JSX.Element {
  return (
    <button data-testid="action-button" onClick={onClick}>
      Click
    </button>
  );
}
```

### State Management

```typescript
// Zustand store with persist middleware
export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      // State and actions
    }),
    { name: 'ide-storage' }
  )
);

// Use selectors to prevent re-renders
const activeFile = useIDEStore((state) => state.activeFile);
```

---

## 2. Technology-Specific Gotchas

### LightningFS (File System)

- **MUST** call `init()` before any file operations
- All paths are absolute (start with `/`)
- File operations are async-only
- Uses IndexedDB under the hood (browser quota limits apply)

```typescript
// Always check if initialized
if (!this.fs) {
  return { success: false, error: 'File system not initialized' };
}
```

### Monaco Editor

- Large bundle (~2MB) - lazy load if possible
- Web Workers needed for IntelliSense
- Must register languages explicitly for non-default languages
- `automaticLayout: true` needed for responsive sizing

```typescript
// Theme must be set before creating editor
monaco.editor.defineTheme('custom-dark', { /* ... */ });
monaco.editor.setTheme('custom-dark');
```

### isomorphic-git

- Requires CORS proxy for GitHub operations
- Use `singleBranch: true` and `depth: 1` for faster clones
- Authentication via `onAuth` callback, not headers
- LightningFS must be passed as `fs` parameter

```typescript
await git.clone({
  fs: fileSystem.getFS(),
  http,
  dir: '/project',
  url: repoUrl,
  corsProxy: 'https://cors.isomorphic-git.org',
  singleBranch: true,
  depth: 1,
  onAuth: () => ({ username: token, password: 'x-oauth-basic' }),
});
```

### xterm.js

- Must call `fitAddon.fit()` after resize events
- Terminal content is not React state - use refs
- Dispose terminal on component unmount to prevent memory leaks

```typescript
useEffect(() => {
  const handleResize = () => fitAddon.fit();
  window.addEventListener('resize', handleResize);
  return () => {
    window.removeEventListener('resize', handleResize);
    terminal.dispose();
  };
}, []);
```

### WebContainers

- **Chromium browsers only** (no Firefox/Safari support)
- Requires COOP/COEP headers (configured in vite.config.ts)
- Boot once, reuse instance
- Process spawning is async

```typescript
// Check browser support before using
if (!WebContainer.isSupported) {
  toast.error('WebContainers require Chrome or Edge');
  return;
}
```

### Dexie.js (IndexedDB)

- Schema changes require version increment
- `useLiveQuery` for reactive data (auto-updates UI)
- Bulk operations are faster than individual writes

```typescript
// Use transactions for atomic operations
await db.transaction('rw', db.projects, db.files, async () => {
  await db.projects.add(project);
  await db.files.bulkAdd(files);
});
```

---

## 3. Lessons Learned

### Issue: Terminal scroll jumps to top after command
**Date:** [Date when discovered]
**Solution:** Call `terminal.scrollToBottom()` after writing output

```typescript
terminal.writeln(output);
terminal.scrollToBottom(); // Add this
```

### Issue: React re-renders entire tree on Zustand state change
**Date:** [Date when discovered]
**Solution:** Use specific selectors instead of destructuring entire state

```typescript
// BAD - subscribes to entire store
const { activeFile, openFiles, closeFile } = useIDEStore();

// GOOD - subscribes only to needed state
const activeFile = useIDEStore((s) => s.activeFile);
const closeFile = useIDEStore((s) => s.closeFile);
```

### Issue: Monaco Editor content not updating on file switch
**Date:** [Date when discovered]
**Solution:** Update model, don't recreate editor

```typescript
// BAD - recreating editor
editor.dispose();
createNewEditor(content);

// GOOD - update model
const model = monaco.editor.createModel(content, language);
editor.setModel(model);
```

### Issue: Git clone hangs on large repos
**Date:** [Date when discovered]
**Solution:** Use shallow clone with depth=1, show progress

```typescript
await git.clone({
  // ...
  depth: 1,
  singleBranch: true,
  onProgress: (event) => {
    updateProgress(event.phase, event.loaded, event.total);
  },
});
```

---

## 4. Code Style Preferences

### Error Handling

```typescript
// ALWAYS use try-catch with Result pattern
async function operation(): Promise<Result<Data>> {
  try {
    const data = await fetchData();
    return { success: true, data };
  } catch (error) {
    logger.error('Operation failed', error);
    return { success: false, error: String(error) };
  }
}
```

### Logging

```typescript
// ALWAYS use logger utility, NEVER console.log
import { logger } from '@/utils/logger';

logger.debug('Detailed info', { context }); // Dev only
logger.info('Important info');
logger.warn('Warning message');
logger.error('Error message', error);
```

### Null Checks

```typescript
// PREFER early returns over nested conditionals
if (!data) {
  return { success: false, error: 'No data' };
}
// Continue with data...
```

### Async/Await

```typescript
// PREFER async/await over .then() chains
// ALWAYS handle errors with try-catch
try {
  const result = await asyncOperation();
} catch (error) {
  handleError(error);
}
```

---

## 5. Testing Conventions

### Test File Location
- Co-locate: `Component.tsx` + `Component.test.tsx`
- Integration: `tests/integration/`
- E2E: `tests/e2e/`

### Test Naming

```typescript
// Pattern: should [expected behavior] when [condition]
it('should return file content when file exists', async () => {});
it('should throw error when path is invalid', async () => {});
```

### Mocking Services

```typescript
vi.mock('@/services/filesystem', () => ({
  fileSystem: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));
```

### E2E Selectors

```typescript
// ALWAYS use data-testid
await page.click('[data-testid="save-button"]');
await expect(page.locator('[data-testid="status-message"]')).toBeVisible();
```

---

## 6. Recent Changes Log

| Date | Change | Files Affected | Notes |
|------|--------|----------------|-------|
| [Date] | Initial project setup | All | TDD framework established |

---

## 7. Blocked Issues

| Issue | Blocker | Workaround | Status |
|-------|---------|------------|--------|
| WebContainers in Safari | Browser limitation | Show unsupported message | Known |

---

## 8. Performance Notes

### Bundle Size Concerns
- Monaco Editor: ~2MB (lazy load on editor open)
- xterm.js: ~500KB (lazy load on terminal open)
- isomorphic-git: ~300KB (tree-shake unused methods)

### Memory Management
- Dispose Monaco editors on tab close
- Dispose xterm terminals on unmount
- Clear large state when switching projects

### IndexedDB Limits
- Safari: ~500MB-1GB hard limit
- Chrome: ~2-10GB (depends on disk)
- Always check quota before large operations

---

## Update Instructions

After completing a task:

1. **Document new patterns** discovered in Section 1
2. **Add gotchas** for technology issues in Section 2
3. **Log lessons learned** from bugs/fixes in Section 3
4. **Update recent changes** in Section 6
5. **Record blocked issues** in Section 7

This file is read at the start of each agent iteration. Keep it concise and actionable.

---

**Last Updated:** [Auto-update with each change]
**Version:** 1.0
