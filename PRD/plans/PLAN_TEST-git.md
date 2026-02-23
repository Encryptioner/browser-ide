# Test Plan: GitService

**Plan ID:** P2-002
**Service:** `src/services/git.ts`
**Created:** February 2026
**Status:** Ready for Implementation

---

## Service Overview

The GitService is a singleton service that wraps `isomorphic-git` for Git operations in the browser. It works with LightningFS for file system operations and supports common Git workflows like clone, commit, push, pull, branch management, and more.

### Key Features
- Repository cloning from GitHub with token authentication
- Branch management (list, create, checkout, delete)
- Staging and committing changes
- Push/pull with CORS proxy support
- Status and diff viewing
- Stash operations
- Merge operations

---

## Test File Location

```
src/services/git.test.ts
```

---

## Methods to Test

| Method | Purpose | Test Priority |
|--------|---------|---------------|
| `clone(url, token, onProgress)` | Clone repository | P0 |
| `initializeRepository(dir)` | Init repo state | P0 |
| `getCurrentBranch(dir)` | Get current branch name | P0 |
| `listBranches(dir)` | List all branches | P0 |
| `createBranch(branchName, dir)` | Create new branch | P0 |
| `checkout(branchName, dir)` | Switch branches | P0 |
| `status(filepath, dir)` | Get file status | P0 |
| `statusMatrix(dir)` | Get all file statuses | P0 |
| `add(filepath, dir)` | Stage file | P0 |
| `addAll(dir)` | Stage all changes | P0 |
| `commit(message, author, dir)` | Commit changes | P0 |
| `push(token, remote, ref, dir)` | Push to remote | P0 |
| `pull(token, remote, ref, dir)` | Pull from remote | P0 |
| `log(dir, depth)` | Get commit history | P1 |
| `remove(dir, filepath)` | Unstage/delete file | P1 |
| `resetFiles(dir, filepaths)` | Unstage changes | P1 |
| `deleteBranch(dir, branchName)` | Delete branch | P1 |
| `diff(dir, filepath)` | Get file diff | P1 |
| `getConfig(path, dir)` | Get git config | P2 |
| `setConfig(path, value, dir)` | Set git config | P2 |
| `listRemotes(dir)` | List remotes | P2 |
| `getRemoteUrl(remote, dir)` | Get remote URL | P2 |
| `stash(message, dir)` | Stash changes | P1 |
| `stashList()` | List stashes | P1 |
| `stashApply(index, dir)` | Apply stash | P1 |
| `stashDrop(index)` | Drop stash | P1 |
| `stashPop(index, dir)` | Apply and drop stash | P1 |
| `merge(branchName, dir, options)` | Merge branches | P1 |
| `abortMerge(dir)` | Abort merge | P1 |
| `isMergeInProgress(dir)` | Check merge status | P1 |
| `getMergeConflicts(dir)` | Get conflicts | P1 |

---

## Mock Strategy

### isomorphic-git Mock
```typescript
vi.mock('isomorphic-git', () => ({
  default: {
    clone: vi.fn(),
    currentBranch: vi.fn(),
    listBranches: vi.fn(),
    branch: vi.fn(),
    checkout: vi.fn(),
    status: vi.fn(),
    statusMatrix: vi.fn(),
    add: vi.fn(),
    commit: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    log: vi.fn(),
    remove: vi.fn(),
    resetIndex: vi.fn(),
    deleteBranch: vi.fn(),
    readBlob: vi.fn(),
    getConfig: vi.fn(),
    setConfig: vi.fn(),
    listRemotes: vi.fn(),
    resolveRef: vi.fn(),
    merge: vi.fn(),
  },
  http: {
    web: vi.fn(),
  }
}));
```

### File System Mock
```typescript
// Mock fileSystem service
vi.mock('@/services/filesystem', () => ({
  fileSystem: {
    getFS: vi.fn(() => mockFS),
    getCurrentWorkingDirectory: vi.fn(() => '/repo'),
    exists: vi.fn(),
    deletePath: vi.fn(),
    readFile: vi.fn(),
  }
}));
```

### Test Fixtures
```typescript
// Mock git repository state
const mockGitState = {
  currentBranch: 'main',
  branches: ['main', 'develop', 'feature/test'],
  files: [
    { path: 'src/index.ts', status: 'modified' },
    { path: 'src/app.tsx', status: 'added' },
    { path: 'old.ts', status: 'deleted' },
  ],
  commits: [
    { oid: 'abc123', message: 'Initial commit', author: { name: 'Test', email: 'test@test.com' } }
  ],
  stashes: []
};
```

---

## Test Cases by Method

### 1. Clone Tests

```typescript
describe('GitService - Clone', () => {
  it('should clone repository successfully', async () => {
    const result = await gitService.clone(
      'https://github.com/user/repo.git',
      'ghp_token123'
    );

    expect(result.success).toBe(true);
    expect(result.data).toContain('/repo');
  });

  it('should use default repo name from URL', async () => {
    const result = await gitService.clone(
      'https://github.com/user/my-project.git',
      'ghp_token123'
    );

    expect(result.data).toContain('/my-project');
  });

  it('should clean up existing directory before clone', async () => {
    // Setup: directory already exists
    vi.mocked(fileSystem.exists).mockResolvedValue(true);
    vi.mocked(fileSystem.deletePath).mockResolvedValue({ success: true });

    await gitService.clone('https://github.com/user/repo.git', 'token');

    expect(fileSystem.deletePath).toHaveBeenCalled();
  });

  it('should handle clone failure gracefully', async () => {
    vi.mocked(git.clone).mockRejectedValue(new Error('Network error'));

    const result = await gitService.clone(
      'https://github.com/user/repo.git',
      'token'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should call onProgress callback during clone', async () => {
    const onProgress = vi.fn();

    await gitService.clone(
      'https://github.com/user/repo.git',
      'token',
      onProgress
    );

    expect(onProgress).toHaveBeenCalled();
  });

  it('should use CORS proxy for GitHub operations', async () => {
    await gitService.clone('https://github.com/user/repo.git', 'token');

    expect(git.clone).toHaveBeenCalledWith(
      expect.objectContaining({
        corsProxy: 'https://cors.isomorphic-git.org'
      })
    );
  });
});
```

### 2. Initialization Tests

```typescript
describe('GitService - Initialize Repository', () => {
  it('should initialize repository state successfully', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main');
    vi.mocked(git.statusMatrix).mockResolvedValue([]);
    vi.mocked(git.log).mockResolvedValue([]);

    const result = await gitService.initializeRepository('/repo');

    expect(result.success).toBe(true);
    expect(result.data?.currentBranch).toBe('main');
  });

  it('should update IDE store with repository data', async () => {
    const { useIDEStore } = await import('@/store/useIDEStore');
    const setCurrentBranch = vi.fn();
    const setGitStatus = vi.fn();
    const setCommits = vi.fn();

    vi.mocked(useIDEStore.getState).mockReturnValue({
      setCurrentBranch,
      setGitStatus,
      setCommits,
    } as any);

    await gitService.initializeRepository('/repo');

    expect(setCurrentBranch).toHaveBeenCalled();
    expect(setGitStatus).toHaveBeenCalled();
    expect(setCommits).toHaveBeenCalled();
  });

  it('should return error when not on a branch', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue(null);

    const result = await gitService.initializeRepository('/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not determine current branch');
  });
});
```

### 3. Branch Management Tests

```typescript
describe('GitService - Branch Management', () => {
  describe('listBranches', () => {
    it('should list all branches with current marker', async () => {
      vi.mocked(git.listBranches)
        .mockResolvedValueOnce(['main', 'develop'])
        .mockResolvedValueOnce(['feature/test']);

      vi.mocked(git.currentBranch).mockResolvedValue('main');

      const result = await gitService.listBranches('/repo');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.find(b => b.name === 'main')?.current).toBe(true);
    });

    it('should include remote branches', async () => {
      vi.mocked(git.listBranches)
        .mockResolvedValueOnce(['main'])
        .mockResolvedValueOnce(['main', 'origin/main']);

      const result = await gitService.listBranches('/repo');

      expect(result.data?.map(b => b.name)).toContain('origin/main');
    });

    it('should handle no remote branches gracefully', async () => {
      vi.mocked(git.listBranches)
        .mockResolvedValueOnce(['main'])
        .mockRejectedValue(new Error('No remotes'));

      const result = await gitService.listBranches('/repo');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('createBranch', () => {
    it('should create new branch successfully', async () => {
      const result = await gitService.createBranch('feature-new', '/repo');

      expect(result.success).toBe(true);
      expect(git.branch).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        ref: 'feature-new',
      });
    });

    it('should use current directory by default', async () => {
      vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/repo');

      await gitService.createBranch('feature-new');

      expect(git.branch).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/repo' })
      );
    });
  });

  describe('checkout', () => {
    it('should checkout branch successfully', async () => {
      const result = await gitService.checkout('develop', '/repo');

      expect(result.success).toBe(true);
      expect(git.checkout).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        ref: 'develop',
      });
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      const result = await gitService.deleteBranch('/repo', 'old-branch');

      expect(result.success).toBe(true);
      expect(git.deleteBranch).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        ref: 'old-branch',
      });
    });
  });
});
```

### 4. Status Tests

```typescript
describe('GitService - Status', () => {
  describe('status', () => {
    it('should return file status', async () => {
      vi.mocked(git.status).mockResolvedValue('modified');

      const result = await gitService.status('src/test.ts', '/repo');

      expect(result).toBe('modified');
    });

    it('should return unmodified on error', async () => {
      vi.mocked(git.status).mockRejectedValue(new Error('Not in git'));

      const result = await gitService.status('src/test.ts', '/repo');

      expect(result).toBe('unmodified');
    });
  });

  describe('statusMatrix', () => {
    it('should return all file statuses', async () => {
      vi.mocked(git.statusMatrix).mockResolvedValue([
        ['src/test.ts', 1, 2, 1], // modified
        ['new.ts', 0, 2, 2],      // added
        ['deleted.ts', 1, 0, 0],  // deleted
      ]);

      const result = await gitService.statusMatrix('/repo');

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe('modified');
      expect(result[1].status).toBe('added');
      expect(result[2].status).toBe('deleted');
    });

    it('should map status matrix codes correctly', () => {
      // Test the private getStatusFromMatrix method
      // [0, 2, 0] = untracked
      // [0, 2, 2] = added
      // [1, 2, 1] = modified
      // [1, 2, 2] = staged
      // [1, 0, *] = deleted
    });
  });
});
```

### 5. Stage and Commit Tests

```typescript
describe('GitService - Stage and Commit', () => {
  describe('add', () => {
    it('should stage single file', async () => {
      const result = await gitService.add('src/test.ts', '/repo');

      expect(result.success).toBe(true);
      expect(git.add).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        filepath: 'src/test.ts',
      });
    });

    it('should use current directory by default', async () => {
      vi.mocked(fileSystem.getCurrentWorkingDirectory).mockReturnValue('/repo');

      await gitService.add('test.ts');

      expect(git.add).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/repo' })
      );
    });
  });

  describe('addAll', () => {
    it('should stage all modified files', async () => {
      vi.mocked(git.statusMatrix).mockResolvedValue([
        ['file1.ts', 1, 2, 1],
        ['file2.ts', 1, 2, 1],
      ]);

      const result = await gitService.addAll('/repo');

      expect(result.success).toBe(true);
      expect(git.add).toHaveBeenCalledTimes(2);
    });
  });

  describe('commit', () => {
    it('should commit staged changes', async () => {
      vi.mocked(git.commit).mockResolvedValue('abc123def456');

      const result = await gitService.commit(
        'Test commit',
        { name: 'Test User', email: 'test@test.com' },
        '/repo'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('abc123def456');
    });

    it('should use default author if not provided', async () => {
      vi.mocked(git.commit).mockResolvedValue('sha123');

      await gitService.commit('message', {} as any, '/repo');

      expect(git.commit).toHaveBeenCalledWith(
        expect.objectContaining({
          author: {
            name: 'Browser IDE User',
            email: 'user@browser-ide.dev',
          }
        })
      );
    });

    it('should handle commit failure', async () => {
      vi.mocked(git.commit).mockRejectedValue(new Error('Nothing to commit'));

      const result = await gitService.commit(
        'message',
        { name: 'Test', email: 'test@test.com' },
        '/repo'
      );

      expect(result.success).toBe(false);
    });
  });
});
```

### 6. Push and Pull Tests

```typescript
describe('GitService - Push and Pull', () => {
  describe('push', () => {
    it('should push to remote successfully', async () => {
      vi.mocked(git.currentBranch).mockResolvedValue('main');

      const result = await gitService.push('ghp_token123', 'origin', undefined, '/repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe('main');
    });

    it('should use current branch by default', async () => {
      vi.mocked(git.currentBranch).mockResolvedValue('develop');

      await gitService.push('token', 'origin', undefined, '/repo');

      expect(git.push).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'develop' })
      );
    });

    it('should use custom ref if provided', async () => {
      await gitService.push('token', 'origin', 'custom-branch', '/repo');

      expect(git.push).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'custom-branch' })
      );
    });

    it('should authenticate with token', async () => {
      await gitService.push('ghp_test_token', 'origin', undefined, '/repo');

      expect(git.push).toHaveBeenCalledWith(
        expect.objectContaining({
          onAuth: expect.any(Function),
        })
      );

      const onAuthCall = vi.mocked(git.push).mock.calls[0][0].onAuth;
      const authResult = onAuthCall();
      expect(authResult).toEqual({
        username: 'ghp_test_token',
        password: 'x-oauth-basic',
      });
    });

    it('should use CORS proxy', async () => {
      await gitService.push('token', 'origin', undefined, '/repo');

      expect(git.push).toHaveBeenCalledWith(
        expect.objectContaining({
          corsProxy: 'https://cors.isomorphic-git.org',
        })
      );
    });
  });

  describe('pull', () => {
    it('should pull from remote successfully', async () => {
      vi.mocked(git.currentBranch).mockResolvedValue('main');

      const result = await gitService.pull('ghp_token123', 'origin', undefined, '/repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe('main');
    });

    it('should use default author for merge commits', async () => {
      await gitService.pull('token', 'origin', undefined, '/repo');

      expect(git.pull).toHaveBeenCalledWith(
        expect.objectContaining({
          author: {
            name: 'Browser IDE User',
            email: 'user@browser-ide.dev',
          },
        })
      );
    });
  });
});
```

### 7. Log Tests

```typescript
describe('GitService - Log', () => {
  it('should return commit history', async () => {
    vi.mocked(git.log).mockResolvedValue([
      {
        oid: 'abc123',
        commit: {
          message: 'First commit',
          author: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
          committer: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
        },
      },
    ]);

    const commits = await gitService.log('/repo', 10);

    expect(commits).toHaveLength(1);
    expect(commits[0]).toEqual({
      oid: 'abc123',
      message: 'First commit',
      author: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
      committer: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
    });
  });

  it('should respect depth parameter', async () => {
    await gitService.log('/repo', 5);

    expect(git.log).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 5 })
    );
  });

  it('should return empty array on error', async () => {
    vi.mocked(git.log).mockRejectedValue(new Error('Not a git repo'));

    const commits = await gitService.log('/repo');

    expect(commits).toEqual([]);
  });
});
```

### 8. Diff Tests

```typescript
describe('GitService - Diff', () => {
  it('should generate unified diff', async () => {
    vi.mocked(git.readBlob).mockResolvedValue({
      blob: new TextEncoder().encode('old content'),
    });

    vi.mocked(fileSystem.readFile).mockResolvedValue({
      success: true,
      data: 'new content',
    });

    const result = await gitService.diff('/repo', 'test.ts');

    expect(result.success).toBe(true);
    expect(result.data).toContain('--- a/test.ts');
    expect(result.data).toContain('+++ b/test.ts');
  });

  it('should handle new files', async () => {
    vi.mocked(git.readBlob).mockResolvedValue(null as any);

    const result = await gitService.diff('/repo', 'new.ts');

    expect(result.success).toBe(true);
  });

  it('should handle binary files gracefully', async () => {
    // Test with binary content
  });
});
```

### 9. Stash Tests

```typescript
describe('GitService - Stash', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('stash', () => {
    it('should stash changes with message', async () => {
      vi.mocked(git.statusMatrix).mockResolvedValue([
        ['test.ts', 1, 2, 1],
      ]);

      vi.mocked(git.resolveRef).mockResolvedValue('abc123');
      vi.mocked(git.commit).mockResolvedValue('stash123');

      const result = await gitService.stash('WIP: work in progress', '/repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe('stash123');
    });

    it('should save stash to localStorage', async () => {
      vi.mocked(git.statusMatrix).mockResolvedValue([
        ['test.ts', 1, 2, 1],
      ]);

      vi.mocked(git.resolveRef).mockResolvedValue('abc123');
      vi.mocked(git.commit).mockResolvedValue('stash123');

      await gitService.stash('message', '/repo');

      const stashes = JSON.parse(localStorage.getItem('git-stashes') || '[]');
      expect(stashes).toHaveLength(1);
      expect(stashes[0].message).toBe('message');
    });

    it('should return error when no changes to stash', async () => {
      vi.mocked(git.statusMatrix).mockResolvedValue([]);

      const result = await gitService.stash('message', '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No local changes');
    });
  });

  describe('stashList', () => {
    it('should return list of stashes', async () => {
      localStorage.setItem('git-stashes', JSON.stringify([
        { oid: 'abc', message: 'stash1', timestamp: 123 },
        { oid: 'def', message: 'stash2', timestamp: 456 },
      ]));

      const result = await gitService.stashList();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].message).toBe('stash1');
    });
  });

  describe('stashApply', () => {
    it('should apply stash by index', async () => {
      localStorage.setItem('git-stashes', JSON.stringify([
        { oid: 'abc123', message: 'test', timestamp: 123, parentOid: 'parent' },
      ]));

      const result = await gitService.stashApply(0, '/repo');

      expect(result.success).toBe(true);
      expect(git.checkout).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'abc123' })
      );
    });

    it('should return error for invalid index', async () => {
      localStorage.setItem('git-stashes', '[]');

      const result = await gitService.stashApply(0, '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('stashDrop', () => {
    it('should remove stash from list', async () => {
      localStorage.setItem('git-stashes', JSON.stringify([
        { oid: 'abc', message: 's1', timestamp: 123, parentOid: 'p' },
        { oid: 'def', message: 's2', timestamp: 456, parentOid: 'p' },
      ]));

      const result = await gitService.stashDrop(0);

      expect(result.success).toBe(true);

      const stashes = JSON.parse(localStorage.getItem('git-stashes') || '[]');
      expect(stashes).toHaveLength(1);
      expect(stashes[0].message).toBe('s2');
    });
  });

  describe('stashPop', () => {
    it('should apply and drop stash', async () => {
      localStorage.setItem('git-stashes', JSON.stringify([
        { oid: 'abc', message: 's1', timestamp: 123, parentOid: 'p' },
      ]));

      vi.mocked(git.checkout).mockResolvedValue(undefined);

      const result = await gitService.stashPop(0, '/repo');

      expect(result.success).toBe(true);

      const stashes = JSON.parse(localStorage.getItem('git-stashes') || '[]');
      expect(stashes).toHaveLength(0);
    });
  });
});
```

### 10. Merge Tests

```typescript
describe('GitService - Merge', () => {
  it('should perform fast-forward merge', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main');
    vi.mocked(git.resolveRef).mockResolvedValue('feature-branch');

    vi.mocked(git.merge).mockResolvedValue({ oid: 'new-sha', fastForward: true });

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(true);
    expect(result.data?.fastForward).toBe(true);
  });

  it('should perform regular merge when fast-forward not possible', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main');

    // First call fails (fast-forward)
    vi.mocked(git.merge).mockRejectedValueOnce(new Error('Not fast-forward'));

    // Second call succeeds (regular merge)
    vi.mocked(git.merge).mockResolvedValueOnce({
      oid: 'merge-sha',
      fastForward: false,
    });

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(true);
    expect(result.data?.fastForward).toBe(false);
  });

  it('should return error for fast-forward-only option', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main');

    vi.mocked(git.merge).mockRejectedValue(new Error('Not fast-forward'));

    const result = await gitService.merge('feature-branch', '/repo', {
      fastForwardOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Fast-forward merge not possible');
  });

  it('should return error when branch not found', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main');

    vi.mocked(git.resolveRef).mockRejectedValue(new Error('Not found'));

    const result = await gitService.merge('nonexistent', '/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should return error when there are uncommitted changes', async () => {
    vi.mocked(git.currentBranch).mockResolvedValue('main');

    vi.mocked(git.statusMatrix).mockResolvedValue([
      ['test.ts', 1, 2, 1], // Modified
    ]);

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('uncommitted changes');
  });
});
```

### 11. Remote Tests

```typescript
describe('GitService - Remotes', () => {
  describe('listRemotes', () => {
    it('should return list of remotes', async () => {
      vi.mocked(git.listRemotes).mockResolvedValue([
        { remote: 'origin', url: 'https://github.com/user/repo.git' },
      ]);

      const remotes = await gitService.listRemotes('/repo');

      expect(remotes).toHaveLength(1);
      expect(remotes[0]).toEqual({
        remote: 'origin',
        url: 'https://github.com/user/repo.git',
      });
    });

    it('should return empty array on error', async () => {
      vi.mocked(git.listRemotes).mockRejectedValue(new Error('No remotes'));

      const remotes = await gitService.listRemotes('/repo');

      expect(remotes).toEqual([]);
    });
  });

  describe('getRemoteUrl', () => {
    it('should return remote URL', async () => {
      vi.mocked(git.listRemotes).mockResolvedValue([
        { remote: 'origin', url: 'https://github.com/user/repo.git' },
      ]);

      const url = await gitService.getRemoteUrl('origin', '/repo');

      expect(url).toBe('https://github.com/user/repo.git');
    });

    it('should return null for non-existent remote', async () => {
      vi.mocked(git.listRemotes).mockResolvedValue([]);

      const url = await gitService.getRemoteUrl('origin', '/repo');

      expect(url).toBeNull();
    });
  });
});
```

### 12. Config Tests

```typescript
describe('GitService - Config', () => {
  describe('getConfig', () => {
    it('should return config value', async () => {
      vi.mocked(git.getConfig).mockResolvedValue('user@example.com');

      const value = await gitService.getConfig('user.email', '/repo');

      expect(value).toBe('user@example.com');
    });

    it('should return undefined for missing config', async () => {
      vi.mocked(git.getConfig).mockRejectedValue(new Error('Not found'));

      const value = await gitService.getConfig('missing.key', '/repo');

      expect(value).toBeUndefined();
    });
  });

  describe('setConfig', () => {
    it('should set config value', async () => {
      const result = await gitService.setConfig('user.email', 'test@test.com', '/repo');

      expect(result.success).toBe(true);
      expect(git.setConfig).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        path: 'user.email',
        value: 'test@test.com',
      });
    });

    it('should handle set config error', async () => {
      vi.mocked(git.setConfig).mockRejectedValue(new Error('Invalid config'));

      const result = await gitService.setConfig('invalid', 'value', '/repo');

      expect(result.success).toBe(false);
    });
  });
});
```

---

## Edge Cases to Cover

1. **Empty Repository**
   - No commits yet
   - No branches other than main

2. **Detached HEAD State**
   - Not on any branch

3. **Merge Conflicts**
   - Files with conflict markers
   - `getMergeConflicts` returns conflicted files

4. **Large Repositories**
   - Many commits
   - Large diffs

5. **Network Failures**
   - CORS proxy unavailable
   - Invalid tokens
   - Repository not found

6. **Concurrent Operations**
   - Push while pulling
   - Clone while cloning

7. **Special Characters in Branch Names**
   - Unicode characters
   - Slashes (for hierarchical branch names)

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| Statements | 85% |
| Branches | 80% |
| Functions | 85% |
| Lines | 85% |

---

## Notes

- **isomorphic-git API**: Many operations return different data structures. Verify mock responses match actual API.
- **CORS Proxy**: All remote operations use `cors.isomorphic-git.org`. This may fail in some network conditions.
- **File System Dependency**: GitService depends on FileSystem. Ensure proper mock coordination.
- **Status Matrix Encoding**: The [head, workdir, stage] encoding is complex. Test thoroughly.
- **localStorage**: Stash operations use localStorage. Clear between tests.

---

## Related Documents

- [PLAN_TEST-filesystem.md](./PLAN_TEST-filesystem.md) - FileSystemService tests (dependency)
- [CODING_STANDARDS.md](../CODING_STANDARDS.md) - Testing standards
- [tests/mocks.ts](../../tests/mocks.ts) - Mock factory
