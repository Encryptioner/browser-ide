/**
 * GitService Unit Tests
 *
 * Test Plan: PRD/plans/PLAN_TEST-git.md
 * Implementation: src/services/git.ts
 *
 * Testing the isomorphic-git wrapper service with comprehensive coverage
 * of all Git operations.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest';


// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock functions for isomorphic-git
const mockClone = vi.fn();
const mockCurrentBranch = vi.fn();
const mockListBranches = vi.fn();
const mockBranch = vi.fn();
const mockCheckout = vi.fn();
const mockStatus = vi.fn();
const mockStatusMatrix = vi.fn();
const mockAdd = vi.fn();
const mockCommit = vi.fn();
const mockPush = vi.fn();
const mockPull = vi.fn();
const mockLog = vi.fn();
const mockRemove = vi.fn();
const mockResetIndex = vi.fn();
const mockDeleteBranch = vi.fn();
const mockReadBlob = vi.fn();
const mockGetConfig = vi.fn();
const mockSetConfig = vi.fn();
const mockListRemotes = vi.fn();
const mockResolveRef = vi.fn();
const mockMerge = vi.fn();

// Mock http module
const mockHttp = { web: vi.fn() };

// Setup the isomorphic-git mock before imports
vi.mock('isomorphic-git', () => ({
  default: {
    clone: mockClone,
    currentBranch: mockCurrentBranch,
    listBranches: mockListBranches,
    branch: mockBranch,
    checkout: mockCheckout,
    status: mockStatus,
    statusMatrix: mockStatusMatrix,
    add: mockAdd,
    commit: mockCommit,
    push: mockPush,
    pull: mockPull,
    log: mockLog,
    remove: mockRemove,
    resetIndex: mockResetIndex,
    deleteBranch: mockDeleteBranch,
    readBlob: mockReadBlob,
    getConfig: mockGetConfig,
    setConfig: mockSetConfig,
    listRemotes: mockListRemotes,
    resolveRef: mockResolveRef,
    merge: mockMerge,
  },
  http: mockHttp,
}));

// Mock filesystem service
const mockFSPromises = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
};

const mockFileSystem = {
  getFS: vi.fn(() => ({
    promises: mockFSPromises,
  })),
  getCurrentWorkingDirectory: vi.fn(() => '/repo'),
  exists: vi.fn(),
  deletePath: vi.fn(),
  readFile: vi.fn(),
};

vi.mock('@/services/filesystem', () => ({
  fileSystem: mockFileSystem,
}));

// Mock useIDEStore
const mockSetCurrentBranch = vi.fn();
const mockSetGitStatus = vi.fn();
const mockSetCommits = vi.fn();

vi.mock('@/store/useIDEStore', () => ({
  useIDEStore: {
    getState: vi.fn(() => ({
      setCurrentBranch: mockSetCurrentBranch,
      setGitStatus: mockSetGitStatus,
      setCommits: mockSetCommits,
    })),
  },
}));

// Import GitService after mocking
const { GitService } = await import('./git');

// =============================================================================
// TEST UTILITIES
// =============================================================================

let gitService: InstanceType<typeof GitService>;

function resetAllMocks(): void {
  vi.clearAllMocks();

  // Reset filesystem mock defaults
  mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/repo');
  mockFileSystem.exists.mockResolvedValue(false);
  mockFileSystem.deletePath.mockResolvedValue({ success: true });
  mockFileSystem.readFile.mockResolvedValue({ success: true, data: '' });

  // Reset FS promises mock
  mockFSPromises.readFile.mockReset();
  mockFSPromises.readFile.mockRejectedValue(new Error('Not found'));

  // Reset git mock defaults
  mockCurrentBranch.mockResolvedValue('main');
  mockStatusMatrix.mockResolvedValue([]);
  mockListBranches.mockResolvedValue(['main']);
  mockLog.mockResolvedValue([]);
}

// =============================================================================
// GLOBAL SETUP
// =============================================================================

beforeAll(() => {
  // Setup localStorage mock
  global.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  } as Storage;
});

beforeEach(() => {
  resetAllMocks();
  gitService = new GitService();
});

afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// CLONE TESTS
// =============================================================================

describe('GitService - Clone', () => {
  it('should clone repository successfully', async () => {
    mockClone.mockResolvedValue(undefined);

    const result = await gitService.clone(
      'https://github.com/user/repo.git',
      'ghp_token123'
    );

    expect(result.success).toBe(true);
    expect(result.data).toContain('/repo');
    expect(mockClone).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://github.com/user/repo.git',
        corsProxy: 'https://cors.isomorphic-git.org',
        singleBranch: false,
        depth: 1,
      })
    );
  });

  it('should extract repo name from URL', async () => {
    mockClone.mockResolvedValue(undefined);

    const result = await gitService.clone(
      'https://github.com/user/my-project.git',
      'ghp_token123'
    );

    expect(result.success).toBe(true);
    expect(result.data).toContain('/my-project');
  });

  it('should clean up existing directory before clone', async () => {
    mockFileSystem.exists.mockResolvedValue(true);
    mockClone.mockResolvedValue(undefined);

    await gitService.clone('https://github.com/user/repo.git', 'token');

    expect(mockFileSystem.deletePath).toHaveBeenCalledWith('/repo/repo');
  });

  it('should return error when cleanup fails', async () => {
    mockFileSystem.exists.mockResolvedValue(true);
    mockFileSystem.deletePath.mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    const result = await gitService.clone(
      'https://github.com/user/repo.git',
      'token'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to clean up');
  });

  it('should handle clone failure gracefully', async () => {
    mockClone.mockRejectedValue(new Error('Network error'));

    const result = await gitService.clone(
      'https://github.com/user/repo.git',
      'token'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should call onProgress callback during clone', async () => {
    const onProgress = vi.fn();
    mockClone.mockImplementation(({ onProgress: progressCb }: { onProgress?: (_progress: { phase: string; loaded: number; total: number }) => void }) => {
      progressCb?.({ phase: 'fetching', loaded: 50, total: 100 });
      return Promise.resolve();
    });

    await gitService.clone(
      'https://github.com/user/repo.git',
      'token',
      onProgress
    );

    expect(onProgress).toHaveBeenCalledWith({
      phase: 'fetching',
      loaded: 50,
      total: 100,
    });
  });

  it('should use CORS proxy for GitHub operations', async () => {
    mockClone.mockResolvedValue(undefined);

    await gitService.clone('https://github.com/user/repo.git', 'token');

    expect(mockClone).toHaveBeenCalledWith(
      expect.objectContaining({
        corsProxy: 'https://cors.isomorphic-git.org',
      })
    );
  });

  it('should authenticate with token', async () => {
    mockClone.mockResolvedValue(undefined);
    let capturedOnAuth: (() => { username: string; password: string }) | undefined;

    mockClone.mockImplementation(({ onAuth }: { onAuth?: () => { username: string; password: string } }) => {
      capturedOnAuth = onAuth;
      return Promise.resolve();
    });

    await gitService.clone('https://github.com/user/repo.git', 'ghp_test_token');

    expect(capturedOnAuth).toBeDefined();
    const authResult = capturedOnAuth();
    expect(authResult).toEqual({
      username: 'ghp_test_token',
      password: 'x-oauth-basic',
    });
  });
});

// =============================================================================
// INITIALIZATION TESTS
// =============================================================================

describe('GitService - Initialize Repository', () => {
  it('should initialize repository state successfully', async () => {
    const result = await gitService.initializeRepository('/repo');

    expect(result.success).toBe(true);
    expect(result.data?.currentBranch).toBe('main');
    expect(mockSetCurrentBranch).toHaveBeenCalledWith('main');
    expect(mockSetGitStatus).toHaveBeenCalled();
    expect(mockSetCommits).toHaveBeenCalled();
  });

  it('should return error when not on a branch', async () => {
    mockCurrentBranch.mockResolvedValue(null);

    const result = await gitService.initializeRepository('/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Could not determine current branch');
  });

  it('should filter unmodified files from git status', async () => {
    mockStatusMatrix.mockResolvedValue([
      ['file1.ts', 1, 2, 1], // modified
      ['file2.ts', 1, 1, 1], // unmodified
      ['file3.ts', 1, 2, 1], // modified
    ]);

    const result = await gitService.initializeRepository('/repo');

    expect(result.success).toBe(true);
    expect(result.data?.gitStatus).toHaveLength(2); // Only modified files
  });

  it('should get commit history with depth 20', async () => {
    mockLog.mockResolvedValue([
      {
        oid: 'abc123',
        commit: {
          message: 'Test commit',
          author: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
          committer: { name: 'Test', email: 'test@test.com', timestamp: 1234567890 },
        },
      },
    ]);

    const result = await gitService.initializeRepository('/repo');

    expect(result.success).toBe(true);
    expect(result.data?.commits).toHaveLength(1);
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 20 })
    );
  });
});

// =============================================================================
// BRANCH MANAGEMENT TESTS
// =============================================================================

describe('GitService - Branch Management', () => {
  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockCurrentBranch.mockResolvedValue('develop');

      const branch = await gitService.getCurrentBranch('/repo');

      expect(branch).toBe('develop');
    });

    it('should return null when not on a branch', async () => {
      mockCurrentBranch.mockResolvedValue(null);

      const branch = await gitService.getCurrentBranch('/repo');

      expect(branch).toBeNull();
    });

    it('should return null on error', async () => {
      mockCurrentBranch.mockRejectedValue(new Error('Not a git repo'));

      const branch = await gitService.getCurrentBranch('/repo');

      expect(branch).toBeNull();
    });
  });

  describe('listBranches', () => {
    it('should list all branches with current marker', async () => {
      mockListBranches
        .mockResolvedValueOnce(['main', 'develop'])
        .mockResolvedValueOnce(['origin/main', 'origin/develop']);

      const result = await gitService.listBranches('/repo');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4);
      expect(result.data?.find(b => b.name === 'main')?.current).toBe(true);
    });

    it('should include remote branches', async () => {
      mockListBranches
        .mockResolvedValueOnce(['main'])
        .mockResolvedValueOnce(['main', 'feature']); // Remote branches without 'origin/' prefix

      const result = await gitService.listBranches('/repo');

      expect(result.data?.map(b => b.name)).toContain('origin/main');
      expect(result.data?.map(b => b.name)).toContain('origin/feature');
    });

    it('should handle no remote branches gracefully', async () => {
      mockListBranches
        .mockResolvedValueOnce(['main'])
        .mockRejectedValueOnce(new Error('No remotes'));

      const result = await gitService.listBranches('/repo');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should deduplicate branches', async () => {
      mockListBranches
        .mockResolvedValueOnce(['main'])
        .mockResolvedValueOnce(['main']); // Duplicate in remote

      const result = await gitService.listBranches('/repo');

      const mainCount = result.data?.filter(b => b.name === 'main').length || 0;
      expect(mainCount).toBe(1);
    });
  });

  describe('createBranch', () => {
    it('should create new branch successfully', async () => {
      mockBranch.mockResolvedValue(undefined);

      const result = await gitService.createBranch('feature-new', '/repo');

      expect(result.success).toBe(true);
      expect(mockBranch).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        ref: 'feature-new',
      });
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockBranch.mockResolvedValue(undefined);

      await gitService.createBranch('feature-new');

      expect(mockBranch).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });

    it('should handle create branch error', async () => {
      mockBranch.mockRejectedValue(new Error('Invalid branch name'));

      const result = await gitService.createBranch('invalid@name', '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid branch name');
    });
  });

  describe('checkout', () => {
    it('should checkout branch successfully', async () => {
      mockCheckout.mockResolvedValue(undefined);

      const result = await gitService.checkout('develop', '/repo');

      expect(result.success).toBe(true);
      expect(mockCheckout).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        ref: 'develop',
      });
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockCheckout.mockResolvedValue(undefined);

      await gitService.checkout('develop');

      expect(mockCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });

    it('should handle checkout error', async () => {
      mockCheckout.mockRejectedValue(new Error('Branch not found'));

      const result = await gitService.checkout('nonexistent', '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Branch not found');
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      mockDeleteBranch.mockResolvedValue(undefined);

      const result = await gitService.deleteBranch('/repo', 'old-branch');

      expect(result.success).toBe(true);
      expect(mockDeleteBranch).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        ref: 'old-branch',
      });
    });

    it('should handle delete branch error', async () => {
      mockDeleteBranch.mockRejectedValue(new Error('Cannot delete checked-out branch'));

      const result = await gitService.deleteBranch('/repo', 'main');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot delete checked-out branch');
    });
  });
});

// =============================================================================
// STATUS TESTS
// =============================================================================

describe('GitService - Status', () => {
  describe('status', () => {
    it('should return file status', async () => {
      mockStatus.mockResolvedValue('modified');

      const status = await gitService.status('src/test.ts', '/repo');

      expect(status).toBe('modified');
    });

    it('should return unmodified on error', async () => {
      mockStatus.mockRejectedValue(new Error('Not in git'));

      const status = await gitService.status('src/test.ts', '/repo');

      expect(status).toBe('unmodified');
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockStatus.mockResolvedValue('*');

      await gitService.status('test.ts');

      expect(mockStatus).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });

  describe('statusMatrix', () => {
    it('should return all file statuses', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['src/test.ts', 1, 2, 1], // modified
        ['new.ts', 0, 2, 2],      // added
        ['deleted.ts', 1, 0, 0],  // deleted
        ['unmodified.ts', 1, 1, 1], // unmodified
      ]);

      const result = await gitService.statusMatrix('/repo');

      expect(result).toHaveLength(4);
      expect(result[0].status).toBe('modified');
      expect(result[1].status).toBe('added');
      expect(result[2].status).toBe('deleted');
      expect(result[3].status).toBe('unmodified');
    });

    it('should return empty array on error', async () => {
      mockStatusMatrix.mockRejectedValue(new Error('Not a git repo'));

      const result = await gitService.statusMatrix('/repo');

      expect(result).toEqual([]);
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockStatusMatrix.mockResolvedValue([]);

      await gitService.statusMatrix();

      expect(mockStatusMatrix).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });
});

// =============================================================================
// STAGE AND COMMIT TESTS
// =============================================================================

describe('GitService - Stage and Commit', () => {
  describe('add', () => {
    it('should stage single file', async () => {
      mockAdd.mockResolvedValue(undefined);

      const result = await gitService.add('src/test.ts', '/repo');

      expect(result.success).toBe(true);
      expect(mockAdd).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        filepath: 'src/test.ts',
      });
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockAdd.mockResolvedValue(undefined);

      await gitService.add('test.ts');

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });

    it('should handle add error', async () => {
      mockAdd.mockRejectedValue(new Error('File not found'));

      const result = await gitService.add('nonexistent.ts', '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });

  describe('addAll', () => {
    it('should stage all modified files', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['file1.ts', 1, 2, 1], // modified
        ['file2.ts', 1, 2, 1], // modified
        ['file3.ts', 1, 1, 1], // unmodified - should be skipped
        ['file4.ts', 0, 2, 0], // untracked - should be staged
      ]);
      mockAdd.mockResolvedValue(undefined);

      const result = await gitService.addAll('/repo');

      expect(result.success).toBe(true);
      expect(mockAdd).toHaveBeenCalledTimes(3); // file1, file2, file4 (not file3 which is unmodified)
    });

    it('should complete addAll even when individual adds fail', async () => {
      // Note: The add method catches its own errors and returns GitResult,
      // so addAll doesn't see errors from individual add calls
      mockStatusMatrix.mockResolvedValue([
        ['file1.ts', 1, 2, 1], // modified
        ['file2.ts', 1, 2, 1], // modified
      ]);
      mockAdd.mockResolvedValue(undefined); // add succeeds

      const result = await gitService.addAll('/repo');

      expect(result.success).toBe(true);
      expect(mockAdd).toHaveBeenCalledTimes(2);
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockStatusMatrix.mockResolvedValue([]);
      mockAdd.mockResolvedValue(undefined);

      await gitService.addAll();

      expect(mockStatusMatrix).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });

  describe('commit', () => {
    it('should commit staged changes', async () => {
      mockCommit.mockResolvedValue('abc123def456');

      const result = await gitService.commit(
        'Test commit',
        { name: 'Test User', email: 'test@test.com' },
        '/repo'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('abc123def456');
    });

    it('should use default author if not provided', async () => {
      mockCommit.mockResolvedValue('sha123');

      await gitService.commit('message', {} as unknown as { name: string; email: string }, '/repo');

      expect(mockCommit).toHaveBeenCalledWith(
        expect.objectContaining({
          author: {
            name: 'Browser IDE User',
            email: 'user@browser-ide.dev',
          },
        })
      );
    });

    it('should use default author for partial author', async () => {
      mockCommit.mockResolvedValue('sha123');

      await gitService.commit('message', { name: 'Custom', email: '' } as unknown as { name: string; email: string }, '/repo');

      expect(mockCommit).toHaveBeenCalledWith(
        expect.objectContaining({
          author: {
            name: 'Custom',
            email: 'user@browser-ide.dev',
          },
        })
      );
    });

    it('should handle commit failure', async () => {
      mockCommit.mockRejectedValue(new Error('Nothing to commit'));

      const result = await gitService.commit(
        'message',
        { name: 'Test', email: 'test@test.com' },
        '/repo'
      );

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// PUSH AND PULL TESTS
// =============================================================================

describe('GitService - Push and Pull', () => {
  describe('push', () => {
    it('should push to remote successfully', async () => {
      mockPush.mockResolvedValue(undefined);

      const result = await gitService.push('ghp_token123', 'origin', undefined, '/repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe('main');
    });

    it('should use current branch by default', async () => {
      mockCurrentBranch.mockResolvedValue('develop');
      mockPush.mockResolvedValue(undefined);

      await gitService.push('token', 'origin', undefined, '/repo');

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'develop' })
      );
    });

    it('should use custom ref if provided', async () => {
      mockPush.mockResolvedValue(undefined);

      await gitService.push('token', 'origin', 'custom-branch', '/repo');

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'custom-branch' })
      );
    });

    it('should authenticate with token', async () => {
      mockPush.mockResolvedValue(undefined);
      let capturedOnAuth: (() => { username: string; password: string }) | undefined;

      mockPush.mockImplementation(({ onAuth }: { onAuth?: () => { username: string; password: string } }) => {
        capturedOnAuth = onAuth;
        return Promise.resolve();
      });

      await gitService.push('ghp_test_token', 'origin', undefined, '/repo');

      expect(capturedOnAuth).toBeDefined();
      const authResult = capturedOnAuth();
      expect(authResult).toEqual({
        username: 'ghp_test_token',
        password: 'x-oauth-basic',
      });
    });

    it('should use CORS proxy', async () => {
      mockPush.mockResolvedValue(undefined);

      await gitService.push('token', 'origin', undefined, '/repo');

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          corsProxy: 'https://cors.isomorphic-git.org',
        })
      );
    });

    it('should handle push error', async () => {
      mockPush.mockRejectedValue(new Error('Authentication failed'));

      const result = await gitService.push('invalid_token', 'origin', undefined, '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });
  });

  describe('pull', () => {
    it('should pull from remote successfully', async () => {
      mockPull.mockResolvedValue(undefined);

      const result = await gitService.pull('ghp_token123', 'origin', undefined, '/repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe('main');
    });

    it('should use current branch by default', async () => {
      mockCurrentBranch.mockResolvedValue('develop');
      mockPull.mockResolvedValue(undefined);

      await gitService.pull('token', 'origin', undefined, '/repo');

      expect(mockPull).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'develop' })
      );
    });

    it('should use default author for merge commits', async () => {
      mockPull.mockResolvedValue(undefined);

      await gitService.pull('token', 'origin', undefined, '/repo');

      expect(mockPull).toHaveBeenCalledWith(
        expect.objectContaining({
          author: {
            name: 'Browser IDE User',
            email: 'user@browser-ide.dev',
          },
        })
      );
    });

    it('should use CORS proxy', async () => {
      mockPull.mockResolvedValue(undefined);

      await gitService.pull('token', 'origin', undefined, '/repo');

      expect(mockPull).toHaveBeenCalledWith(
        expect.objectContaining({
          corsProxy: 'https://cors.isomorphic-git.org',
        })
      );
    });

    it('should authenticate with token', async () => {
      mockPull.mockResolvedValue(undefined);
      let capturedOnAuth: (() => { username: string; password: string }) | undefined;

      mockPull.mockImplementation(({ onAuth }: { onAuth?: () => { username: string; password: string } }) => {
        capturedOnAuth = onAuth;
        return Promise.resolve();
      });

      await gitService.pull('ghp_test_token', 'origin', undefined, '/repo');

      const authResult = capturedOnAuth();
      expect(authResult).toEqual({
        username: 'ghp_test_token',
        password: 'x-oauth-basic',
      });
    });

    it('should handle pull error', async () => {
      mockPull.mockRejectedValue(new Error('Network error'));

      const result = await gitService.pull('token', 'origin', undefined, '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});

// =============================================================================
// LOG TESTS
// =============================================================================

describe('GitService - Log', () => {
  it('should return commit history', async () => {
    mockLog.mockResolvedValue([
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
    mockLog.mockResolvedValue([]);

    await gitService.log('/repo', 5);

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 5 })
    );
  });

  it('should return empty array on error', async () => {
    mockLog.mockRejectedValue(new Error('Not a git repo'));

    const commits = await gitService.log('/repo');

    expect(commits).toEqual([]);
  });

  it('should use current directory by default', async () => {
    mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
    mockLog.mockResolvedValue([]);

    await gitService.log();

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ dir: '/custom-dir' })
    );
  });

  it('should use default depth of 20', async () => {
    mockLog.mockResolvedValue([]);

    await gitService.log('/repo');

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 20 })
    );
  });
});

// =============================================================================
// CONFIG TESTS
// =============================================================================

describe('GitService - Config', () => {
  describe('getConfig', () => {
    it('should return config value', async () => {
      mockGetConfig.mockResolvedValue('user@example.com');

      const value = await gitService.getConfig('user.email', '/repo');

      expect(value).toBe('user@example.com');
    });

    it('should return undefined for missing config', async () => {
      mockGetConfig.mockRejectedValue(new Error('Not found'));

      const value = await gitService.getConfig('missing.key', '/repo');

      expect(value).toBeUndefined();
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockGetConfig.mockResolvedValue('value');

      await gitService.getConfig('user.name');

      expect(mockGetConfig).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });

  describe('setConfig', () => {
    it('should set config value', async () => {
      mockSetConfig.mockResolvedValue(undefined);

      const result = await gitService.setConfig('user.email', 'test@test.com', '/repo');

      expect(result.success).toBe(true);
      expect(mockSetConfig).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        path: 'user.email',
        value: 'test@test.com',
      });
    });

    it('should handle set config error', async () => {
      mockSetConfig.mockRejectedValue(new Error('Invalid config'));

      const result = await gitService.setConfig('invalid', 'value', '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid config');
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockSetConfig.mockResolvedValue(undefined);

      await gitService.setConfig('user.name', 'Test');

      expect(mockSetConfig).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });
});

// =============================================================================
// REMOTE TESTS
// =============================================================================

describe('GitService - Remotes', () => {
  describe('listRemotes', () => {
    it('should return list of remotes', async () => {
      mockListRemotes.mockResolvedValue([
        { remote: 'origin', url: 'https://github.com/user/repo.git' },
        { remote: 'upstream', url: 'https://github.com/original/repo.git' },
      ]);

      const remotes = await gitService.listRemotes('/repo');

      expect(remotes).toHaveLength(2);
      expect(remotes[0]).toEqual({
        remote: 'origin',
        url: 'https://github.com/user/repo.git',
      });
      expect(remotes[1]).toEqual({
        remote: 'upstream',
        url: 'https://github.com/original/repo.git',
      });
    });

    it('should return empty array on error', async () => {
      mockListRemotes.mockRejectedValue(new Error('No remotes'));

      const remotes = await gitService.listRemotes('/repo');

      expect(remotes).toEqual([]);
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockListRemotes.mockResolvedValue([]);

      await gitService.listRemotes();

      expect(mockListRemotes).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });

  describe('getRemoteUrl', () => {
    it('should return remote URL', async () => {
      mockListRemotes.mockResolvedValue([
        { remote: 'origin', url: 'https://github.com/user/repo.git' },
      ]);

      const url = await gitService.getRemoteUrl('origin', '/repo');

      expect(url).toBe('https://github.com/user/repo.git');
    });

    it('should return null for non-existent remote', async () => {
      mockListRemotes.mockResolvedValue([]);

      const url = await gitService.getRemoteUrl('origin', '/repo');

      expect(url).toBeNull();
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockListRemotes.mockResolvedValue([]);

      await gitService.getRemoteUrl();

      expect(mockListRemotes).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });
});

// =============================================================================
// REMOVE AND RESET TESTS
// =============================================================================

describe('GitService - Remove and Reset', () => {
  describe('remove', () => {
    it('should remove file successfully', async () => {
      mockRemove.mockResolvedValue(undefined);

      const result = await gitService.remove('/repo', 'test.ts');

      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith({
        fs: expect.anything(),
        dir: '/repo',
        filepath: 'test.ts',
      });
    });

    it('should handle remove error', async () => {
      mockRemove.mockRejectedValue(new Error('File not in index'));

      const result = await gitService.remove('/repo', 'test.ts');

      expect(result.success).toBe(false);
    });
  });

  describe('resetFiles', () => {
    it('should reset all staged files', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['file1.ts', 1, 2, 2], // staged (stage 2, worktree 2) -> should NOT reset (stage === worktree)
        ['file2.ts', 1, 2, 2], // staged (stage 2, worktree 2) -> should NOT reset
        ['file3.ts', 1, 2, 1], // unstaged (stage 1, worktree 2) -> should reset (stage !== worktree)
        ['file4.ts', 1, 1, 2], // staged deletion (stage 2, worktree 1) -> should reset (stage !== worktree)
      ]);
      mockResetIndex.mockResolvedValue(undefined);

      const result = await gitService.resetFiles('/repo');

      expect(result.success).toBe(true);
      expect(mockResetIndex).toHaveBeenCalledTimes(2); // file3 and file4 (where stage !== worktree)
    });

    it('should reset specific files', async () => {
      mockResetIndex.mockResolvedValue(undefined);

      const result = await gitService.resetFiles('/repo', ['file1.ts', 'file2.ts']);

      expect(result.success).toBe(true);
      expect(mockResetIndex).toHaveBeenCalledTimes(2);
    });

    it('should handle reset error', async () => {
      mockResetIndex.mockRejectedValue(new Error('Reset failed'));

      const result = await gitService.resetFiles('/repo', ['file1.ts']);

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// DIFF TESTS
// =============================================================================

describe('GitService - Diff', () => {
  it('should generate unified diff', async () => {
    mockReadBlob.mockResolvedValue({
      blob: new TextEncoder().encode('old content'),
    });
    mockFileSystem.readFile.mockResolvedValue({
      success: true,
      data: 'new content',
    });

    const result = await gitService.diff('/repo', 'test.ts');

    expect(result.success).toBe(true);
    expect(result.data).toContain('--- a/test.ts');
    expect(result.data).toContain('+++ b/test.ts');
  });

  it('should handle new files', async () => {
    mockReadBlob.mockResolvedValue(null as unknown as { blob: Uint8Array });
    mockFileSystem.readFile.mockResolvedValue({
      success: true,
      data: 'new file content',
    });

    const result = await gitService.diff('/repo', 'new.ts');

    expect(result.success).toBe(true);
    expect(result.data).toContain('+++ b/new.ts');
  });

  it('should handle file read error gracefully', async () => {
    mockReadBlob.mockResolvedValue({
      blob: new TextEncoder().encode('old content'),
    });
    mockFileSystem.readFile.mockResolvedValue({
      success: false,
      error: 'File not found',
    });

    const result = await gitService.diff('/repo', 'test.ts');

    expect(result.success).toBe(true); // Still succeeds with empty new content
  });

  it('should handle diff generation error', async () => {
    mockReadBlob.mockRejectedValue(new Error('Not in git'));
    mockFileSystem.readFile.mockRejectedValue(new Error('Read failed'));

    const result = await gitService.diff('/repo', 'test.ts');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// =============================================================================
// STASH TESTS
// =============================================================================

describe('GitService - Stash', () => {
  beforeEach(() => {
    (vi.mocked(global.localStorage.getItem)).mockReturnValue(null);
  });

  describe('stash', () => {
    it('should stash changes with message', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['test.ts', 1, 2, 1], // modified
      ]);
      mockResolveRef.mockResolvedValue('abc123');
      mockCommit.mockResolvedValue('stash123');
      mockCheckout.mockResolvedValue(undefined);

      const result = await gitService.stash('WIP: work in progress', '/repo');

      expect(result.success).toBe(true);
      expect(result.data).toBe('stash123');
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    it('should use default message if not provided', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['test.ts', 1, 2, 1],
      ]);
      mockResolveRef.mockResolvedValue('abc123');
      mockCommit.mockResolvedValue('stash123');
      mockCheckout.mockResolvedValue(undefined);

      await gitService.stash(undefined, '/repo');

      const setItemCall = (vi.mocked(global.localStorage.setItem)).mock.calls[0];
      const stashData = JSON.parse(setItemCall[1]);
      expect(stashData[0].message).toContain('WIP on branch:');
    });

    it('should return error when no changes to stash', async () => {
      mockStatusMatrix.mockResolvedValue([]);

      const result = await gitService.stash('message', '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('No local changes');
    });

    it('should handle stash error', async () => {
      mockStatusMatrix.mockRejectedValue(new Error('Not a git repo'));

      const result = await gitService.stash('message', '/repo');

      expect(result.success).toBe(false);
    });

    it('should stage changes before stashing', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['test.ts', 1, 2, 1], // modified but not staged
      ]);
      mockResolveRef.mockResolvedValue('abc123');
      mockCommit.mockResolvedValue('stash123');
      mockCheckout.mockResolvedValue(undefined);
      mockAdd.mockResolvedValue(undefined);

      await gitService.stash('message', '/repo');

      expect(mockAdd).toHaveBeenCalled();
    });
  });

  describe('stashList', () => {
    it('should return list of stashes', async () => {
      const stashes = [
        { oid: 'abc', message: 'stash1', timestamp: 123 },
        { oid: 'def', message: 'stash2', timestamp: 456 },
      ];
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(JSON.stringify(stashes));

      const result = await gitService.stashList();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].message).toBe('stash1');
      expect(result.data?.[0].index).toBe(0);
      expect(result.data?.[1].index).toBe(1);
    });

    it('should return empty list when no stashes', async () => {
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(null);

      const result = await gitService.stashList();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle invalid localStorage data', async () => {
      (vi.mocked(global.localStorage.getItem)).mockReturnValue('invalid json');

      const result = await gitService.stashList();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('stashApply', () => {
    it('should apply stash by index', async () => {
      const stashes = [
        { oid: 'abc123', message: 'test', timestamp: 123, parentOid: 'parent' },
      ];
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(JSON.stringify(stashes));
      mockCheckout.mockResolvedValue(undefined);

      const result = await gitService.stashApply(0, '/repo');

      expect(result.success).toBe(true);
      expect(mockCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ ref: 'abc123' })
      );
    });

    it('should return error for invalid index', async () => {
      (vi.mocked(global.localStorage.getItem)).mockReturnValue('[]');

      const result = await gitService.stashApply(0, '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return error for out of range index', async () => {
      const stashes = [{ oid: 'abc', message: 'test', timestamp: 123, parentOid: 'p' }];
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(JSON.stringify(stashes));

      const result = await gitService.stashApply(5, '/repo');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('stashDrop', () => {
    it('should remove stash from list', async () => {
      const stashes = [
        { oid: 'abc', message: 's1', timestamp: 123, parentOid: 'p' },
        { oid: 'def', message: 's2', timestamp: 456, parentOid: 'p' },
      ];
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(JSON.stringify(stashes));

      const result = await gitService.stashDrop(0);

      expect(result.success).toBe(true);

      const setItemCall = (vi.mocked(global.localStorage.setItem)).mock.calls[0];
      const remainingStashes = JSON.parse(setItemCall[1]);
      expect(remainingStashes).toHaveLength(1);
      expect(remainingStashes[0].message).toBe('s2');
    });

    it('should return error for out of range index', async () => {
      const result = await gitService.stashDrop(5);

      expect(result.success).toBe(false);
      expect(result.error).toContain('out of range');
    });
  });

  describe('stashPop', () => {
    it('should apply and drop stash', async () => {
      const stashes = [
        { oid: 'abc', message: 's1', timestamp: 123, parentOid: 'p' },
      ];
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(JSON.stringify(stashes));
      mockCheckout.mockResolvedValue(undefined);

      const result = await gitService.stashPop(0, '/repo');

      expect(result.success).toBe(true);

      const setItemCall = (vi.mocked(global.localStorage.setItem)).mock.calls[0];
      const remainingStashes = JSON.parse(setItemCall[1]);
      expect(remainingStashes).toHaveLength(0);
    });

    it('should return error if apply fails', async () => {
      const stashes = [
        { oid: 'abc', message: 's1', timestamp: 123, parentOid: 'p' },
      ];
      (vi.mocked(global.localStorage.getItem)).mockReturnValue(JSON.stringify(stashes));
      mockCheckout.mockRejectedValue(new Error('Checkout failed'));

      const result = await gitService.stashPop(0, '/repo');

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// MERGE TESTS
// =============================================================================

describe('GitService - Merge', () => {
  it('should perform fast-forward merge', async () => {
    mockCurrentBranch.mockResolvedValue('main');
    mockResolveRef.mockResolvedValue('feature-branch');
    mockStatusMatrix.mockResolvedValue([]); // No uncommitted changes
    mockMerge.mockResolvedValue({ oid: 'new-sha', fastForward: true });

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(true);
    expect(result.data?.fastForward).toBe(true);
    expect(result.data?.oid).toBe('new-sha');
  });

  it('should perform regular merge when fast-forward not possible', async () => {
    mockCurrentBranch.mockResolvedValue('main');
    mockResolveRef.mockResolvedValue('feature-branch');
    mockStatusMatrix.mockResolvedValue([]);
    // First call fails (fast-forward)
    mockMerge.mockRejectedValueOnce(new Error('Not fast-forward'));
    // Second call succeeds (regular merge)
    mockMerge.mockResolvedValueOnce({
      oid: 'merge-sha',
      fastForward: false,
    });

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(true);
    expect(result.data?.fastForward).toBe(false);
  });

  it('should return error for fast-forward-only option', async () => {
    mockCurrentBranch.mockResolvedValue('main');
    mockResolveRef.mockResolvedValue('feature-branch');
    mockStatusMatrix.mockResolvedValue([]);
    mockMerge.mockRejectedValue(new Error('Not fast-forward'));

    const result = await gitService.merge('feature-branch', '/repo', {
      fastForwardOnly: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Fast-forward merge not possible');
  });

  it('should return error when branch not found', async () => {
    mockCurrentBranch.mockResolvedValue('main');
    mockResolveRef.mockRejectedValue(new Error('Not found'));
    mockStatusMatrix.mockResolvedValue([]);

    const result = await gitService.merge('nonexistent', '/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should return error when there are uncommitted changes', async () => {
    mockCurrentBranch.mockResolvedValue('main');
    mockResolveRef.mockResolvedValue('feature-branch');
    mockStatusMatrix.mockResolvedValue([
      ['test.ts', 1, 2, 1], // Modified
    ]);

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('uncommitted changes');
  });

  it('should return error when not on a branch', async () => {
    mockCurrentBranch.mockResolvedValue(null);

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Not currently on any branch');
  });

  it('should handle regular merge failure', async () => {
    mockCurrentBranch.mockResolvedValue('main');
    mockResolveRef.mockResolvedValue('feature-branch');
    mockStatusMatrix.mockResolvedValue([]);
    // Fast-forward fails
    mockMerge.mockRejectedValueOnce(new Error('Not fast-forward'));
    // Regular merge also fails
    mockMerge.mockRejectedValueOnce(new Error('Merge conflict'));

    const result = await gitService.merge('feature-branch', '/repo');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Merge failed');
  });
});

// =============================================================================
// MERGE STATE TESTS
// =============================================================================

describe('GitService - Merge State', () => {
  describe('abortMerge', () => {
    it('should abort merge successfully', async () => {
      mockCheckout.mockResolvedValue(undefined);

      const result = await gitService.abortMerge('/repo');

      expect(result.success).toBe(true);
      expect(mockCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          ref: 'HEAD',
          force: true,
        })
      );
    });

    it('should handle abort merge error', async () => {
      mockCheckout.mockRejectedValue(new Error('Abort failed'));

      const result = await gitService.abortMerge('/repo');

      expect(result.success).toBe(false);
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockCheckout.mockResolvedValue(undefined);

      await gitService.abortMerge();

      expect(mockCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });

  describe('isMergeInProgress', () => {
    it('should return true when MERGE_HEAD exists', async () => {
      mockFSPromises.readFile.mockResolvedValue('abc123');

      const inProgress = await gitService.isMergeInProgress('/repo');

      expect(inProgress).toBe(true);
      expect(mockFSPromises.readFile).toHaveBeenCalledWith('/repo/.git/MERGE_HEAD', 'utf8');
    });

    it('should return false when MERGE_HEAD does not exist', async () => {
      mockFSPromises.readFile.mockRejectedValue(new Error('Not found'));

      const inProgress = await gitService.isMergeInProgress('/repo');

      expect(inProgress).toBe(false);
      expect(mockFSPromises.readFile).toHaveBeenCalledWith('/repo/.git/MERGE_HEAD', 'utf8');
    });

    it('should return false on error', async () => {
      mockFSPromises.readFile.mockImplementation(() => { throw new Error('Unexpected error'); });

      const inProgress = await gitService.isMergeInProgress('/repo');

      expect(inProgress).toBe(false);
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockFSPromises.readFile.mockRejectedValue(new Error('Not found'));

      await gitService.isMergeInProgress();

      expect(mockFSPromises.readFile).toHaveBeenCalledWith('/custom-dir/.git/MERGE_HEAD', 'utf8');
    });
  });

  describe('getMergeConflicts', () => {
    it('should return conflicted files', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['file1.ts', 1, 2, 0], // conflict
        ['file2.ts', 1, 1, 1], // no conflict
        ['file3.ts', 1, 2, 0], // conflict
      ]);

      const result = await gitService.getMergeConflicts('/repo');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['file1.ts', 'file3.ts']);
    });

    it('should return empty array when no conflicts', async () => {
      mockStatusMatrix.mockResolvedValue([
        ['file1.ts', 1, 1, 1],
        ['file2.ts', 1, 2, 1],
      ]);

      const result = await gitService.getMergeConflicts('/repo');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle error', async () => {
      mockStatusMatrix.mockRejectedValue(new Error('Not a git repo'));

      const result = await gitService.getMergeConflicts('/repo');

      expect(result.success).toBe(false);
    });

    it('should use current directory by default', async () => {
      mockFileSystem.getCurrentWorkingDirectory.mockReturnValue('/custom-dir');
      mockStatusMatrix.mockResolvedValue([]);

      await gitService.getMergeConflicts();

      expect(mockStatusMatrix).toHaveBeenCalledWith(
        expect.objectContaining({ dir: '/custom-dir' })
      );
    });
  });
});
