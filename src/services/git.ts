import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { fileSystem } from './filesystem';
import type { GitStatus, GitCommit, GitBranch } from '@/types';

export interface GitResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GitAuthor {
  name: string;
  email: string;
}

export interface GitCloneProgress {
  phase: string;
  loaded: number;
  total: number;
}

class GitService {
  private corsProxy = 'https://cors.isomorphic-git.org';

  // Alternative getCurrentBranch method to avoid parameter collision
  private async getCurrentBranchNameFs(dir?: string): Promise<string | null> {
    try {
      return await git.currentBranch({
        fs: fileSystem.getFS(),
        dir,
      }) || null;
    } catch (error) {
      console.error('Get current branch error:', error);
      return null;
    }
  }

  // Update initializeRepository to use the new method
  async initializeRepository(dir = fileSystem.getCurrentWorkingDirectory()): Promise<GitResult<{
    currentBranch: string;
    gitStatus: GitStatus[];
    commits: GitCommit[];
  }>> {
    try {
      // Get current branch
      const branch = await this.getCurrentBranchNameFs(dir);
      if (!branch) {
        return {
          success: false,
          error: 'Could not determine current branch',
        };
      }

      // Get git status
      const allStatus = await this.statusMatrix(dir);
      const gitStatus = allStatus.filter(item => item.status !== 'unmodified');

      // Get recent commits
      const commits = await this.log(dir, 20);

      // Update IDE store
      const { useIDEStore } = await import('@/store/useIDEStore');
      const store = useIDEStore.getState();

      store.setCurrentBranch(branch);
      store.setGitStatus(gitStatus);
      store.setCommits(commits);

      console.log(`✅ Repository initialized: branch=${branch}, status=${gitStatus.length} files, commits=${commits.length}`);

      return {
        success: true,
        data: {
          currentBranch: branch,
          gitStatus,
          commits,
        },
      };
    } catch (error) {
      console.error('Initialize repository error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async clone(
    url: string,
    token: string,
    onProgress?: (progress: GitCloneProgress) => void
  ): Promise<GitResult<string>> {
    const currentDir = fileSystem.getCurrentWorkingDirectory();
    // Create a subdirectory for the repo
    const repoName = url.split('/').pop()?.replace('.git', '') || 'repo';
    const dir = `${currentDir}/${repoName}`;

    // Clean up existing directory
    const exists = await fileSystem.exists(dir);
    if (exists) {
      const result = await fileSystem.deletePath(dir);
      if (!result.success) {
        return { success: false, error: 'Failed to clean up existing directory' };
      }
    }

    try {
      await git.clone({
        fs: fileSystem.getFS(),
        http,
        dir,
        url,
        corsProxy: this.corsProxy,
        singleBranch: false,
        depth: 1,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic',
        }),
        onProgress: (progress) => {
          console.log('Clone progress:', progress);
          if (onProgress) onProgress(progress);
        },
      });

      return { success: true, data: dir };
    } catch (error) {
      console.error('Clone error:', error);
      return { success: false, error: String(error) };
    }
  }

  async getCurrentBranch(dir?: string): Promise<string | null> {
    try {
      const branch = await git.currentBranch({
        fs: fileSystem.getFS(),
        dir,
        fullname: false,
      });
      return branch || null;
    } catch (error) {
      console.error('Get current branch error:', error);
      return null;
    }
  }

  async listBranches(dir?: string): Promise<GitResult<GitBranch[]>> {
    try {
      // Get all local branches
      const localBranches = await git.listBranches({
        fs: fileSystem.getFS(),
        dir,
      });

      // Get remote branches
      let remoteBranches: string[] = [];
      try {
        const remotes = await git.listBranches({
          fs: fileSystem.getFS(),
          dir,
          remote: 'origin',
        });
        remoteBranches = remotes.map(name => `origin/${name}`);
      } catch {
        // No remote branches
      }

      const currentBranch = await this.getCurrentBranch(dir);

      // Combine and deduplicate branches
      const allBranches = [...new Set([...localBranches, ...remoteBranches])];

      const branchList = allBranches.map((name) => ({
        name,
        current: name === currentBranch,
      }));

      console.log(`📋 Found ${branchList.length} branches:`, branchList.map(b => b.name));

      return {
        success: true,
        data: branchList,
      };
    } catch (error) {
      console.error('List branches error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async createBranch(branchName: string, dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      await git.branch({
        fs: fileSystem.getFS(),
        dir: directory,
        ref: branchName,
      });
      return { success: true };
    } catch (error) {
      console.error('Create branch error:', error);
      return { success: false, error: String(error) };
    }
  }

  async checkout(branchName: string, dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      await git.checkout({
        fs: fileSystem.getFS(),
        dir: directory,
        ref: branchName,
      });
      return { success: true };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, error: String(error) };
    }
  }

  async status(filepath = '.', dir?: string): Promise<string> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const status = await git.status({
        fs: fileSystem.getFS(),
        dir: directory,
        filepath,
      });
      return status;
    } catch (error) {
      console.error('Status error:', error);
      return 'unmodified';
    }
  }

  async statusMatrix(dir?: string): Promise<GitStatus[]> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const matrix = await git.statusMatrix({
        fs: fileSystem.getFS(),
        dir: directory,
      });

      return matrix.map(([filepath, head, workdir, stage]) => ({
        path: filepath,
        status: this.getStatusFromMatrix(head, workdir, stage),
      }));
    } catch (error) {
      console.error('Status matrix error:', error);
      return [];
    }
  }

  private getStatusFromMatrix(
    head: number,
    workdir: number,
    stage: number
  ): GitStatus['status'] {
    // [head, workdir, stage]
    // [0, 2, 0] = new, untracked
    // [0, 2, 2] = new, staged
    // [1, 2, 1] = modified, unstaged
    // [1, 2, 2] = modified, staged
    // [1, 0, 1] = deleted, unstaged
    // [1, 0, 0] = deleted, staged
    // [1, 1, 1] = unmodified

    if (head === 0 && workdir === 2 && stage === 0) return 'untracked';
    if (head === 0 && workdir === 2 && stage === 2) return 'added';
    if (head === 1 && workdir === 2 && stage === 1) return 'modified';
    if (head === 1 && workdir === 2 && stage === 2) return 'staged';
    if (head === 1 && workdir === 0) return 'deleted';
    return 'unmodified';
  }

  async add(filepath: string, dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      await git.add({
        fs: fileSystem.getFS(),
        dir: directory,
        filepath,
      });
      return { success: true };
    } catch (error) {
      console.error('Add error:', error);
      return { success: false, error: String(error) };
    }
  }

  async addAll(dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const status = await this.statusMatrix(directory);
      for (const file of status) {
        if (file.status !== 'unmodified') {
          await this.add(file.path, directory);
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Add all error:', error);
      return { success: false, error: String(error) };
    }
  }

  async commit(message: string, author: GitAuthor, dir?: string): Promise<GitResult<string>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const sha = await git.commit({
        fs: fileSystem.getFS(),
        dir: directory,
        message,
        author: {
          name: author.name || 'Browser IDE User',
          email: author.email || 'user@browser-ide.dev',
        },
      });
      return { success: true, data: sha };
    } catch (error) {
      console.error('Commit error:', error);
      return { success: false, error: String(error) };
    }
  }

  async push(
    token: string,
    remote = 'origin',
    remoteRef?: string,
    dir?: string
  ): Promise<GitResult<string>> {
    try {
      const currentBranch = await this.getCurrentBranch(dir);
      const pushRef = remoteRef || currentBranch || 'main';

      console.log(`📤 Pushing branch: ${pushRef} to ${remote}`);

      await git.push({
        fs: fileSystem.getFS(),
        http,
        dir,
        remote,
        ref: pushRef,
        corsProxy: this.corsProxy,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic',
        }),
        onProgress: (progress) => {
          console.log('Push progress:', progress);
        },
      });

      console.log(`✅ Successfully pushed ${pushRef} to ${remote}`);
      return { success: true, data: pushRef };
    } catch (error) {
      console.error('Push error:', error);
      return { success: false, error: String(error) };
    }
  }

  async pull(
    token: string,
    remote = 'origin',
    remoteRef?: string,
    dir?: string
  ): Promise<GitResult<string>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const currentBranch = await this.getCurrentBranch(directory);
      const pullRef = remoteRef || currentBranch || 'main';

      console.log(`📥 Pulling branch: ${pullRef} from ${remote}`);

      await git.pull({
        fs: fileSystem.getFS(),
        http,
        dir: directory,
        remote,
        ref: pullRef,
        corsProxy: this.corsProxy,
        onAuth: () => ({
          username: token,
          password: 'x-oauth-basic',
        }),
        author: {
          name: 'Browser IDE User',
          email: 'user@browser-ide.dev',
        },
      });

      console.log(`✅ Successfully pulled ${pullRef} from ${remote}`);
      return { success: true, data: pullRef };
    } catch (error) {
      console.error('Pull error:', error);
      return { success: false, error: String(error) };
    }
  }

  async log(dir?: string, depth = 20): Promise<GitCommit[]> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const commits = await git.log({
        fs: fileSystem.getFS(),
        dir: directory,
        depth,
      });

      return commits.map((commit) => ({
        oid: commit.oid,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          timestamp: commit.commit.author.timestamp,
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.timestamp,
          timestamp: commit.commit.committer.timestamp,
        },
      }));
    } catch (error) {
      console.error('Log error:', error);
      return [];
    }
  }

  async getConfig(path: string, dir?: string): Promise<string | undefined> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      return await git.getConfig({
        fs: fileSystem.getFS(),
        dir: directory,
        path,
      });
    } catch (error) {
      return undefined;
    }
  }

  async setConfig(path: string, value: string, dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      await git.setConfig({
        fs: fileSystem.getFS(),
        dir: directory,
        path,
        value,
      });
      return { success: true };
    } catch (error) {
      console.error('Set config error:', error);
      return { success: false, error: String(error) };
    }
  }

  async listRemotes(dir?: string): Promise<Array<{ remote: string; url: string }>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const remotes = await git.listRemotes({
        fs: fileSystem.getFS(),
        dir: directory,
      });
      return remotes;
    } catch (error) {
      console.error('List remotes error:', error);
      return [];
    }
  }

  async getRemoteUrl(remote = 'origin', dir?: string): Promise<string | null> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();
    try {
      const remotes = await this.listRemotes(directory);
      const found = remotes.find((r) => r.remote === remote);
      return found ? found.url : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove (unstage) a file
   */
  async remove(dir: string, filepath: string): Promise<GitResult<void>> {
    try {
      await git.remove({
        fs: fileSystem.getFS(),
        dir,
        filepath,
      });
      return { success: true };
    } catch (error) {
      console.error('Remove error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Reset file(s) to HEAD (unstage)
   */
  async resetFiles(dir: string, filepaths?: string[]): Promise<GitResult<void>> {
    try {
      const fs = fileSystem.getFS();

      if (!filepaths || filepaths.length === 0) {
        // Reset all staged files
        const statusMatrix = await git.statusMatrix({ fs, dir });

        for (const [filepath, , worktreeStatus, stageStatus] of statusMatrix) {
          // If file is staged (stage status !== worktree status)
          if (stageStatus !== worktreeStatus) {
            await git.resetIndex({
              fs,
              dir,
              filepath,
            });
          }
        }
      } else {
        // Reset specific files
        for (const filepath of filepaths) {
          await git.resetIndex({
            fs,
            dir,
            filepath,
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Reset error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(dir: string, branchName: string): Promise<GitResult<void>> {
    try {
      await git.deleteBranch({
        fs: fileSystem.getFS(),
        dir,
        ref: branchName,
      });
      return { success: true };
    } catch (error) {
      console.error('Delete branch error:', error);
      return { success: false, error: String(error) };
    }
  }

  
  /**
   * Get diff for a file
   */
  async diff(dir: string, filepath: string): Promise<GitResult<string>> {
    try {
      const fs = fileSystem.getFS();

      // Get HEAD version
      const headContent = await git.readBlob({
        fs,
        dir,
        oid: 'HEAD',
        filepath,
      }).catch(() => null);

      // Get working directory version - read from LightningFS
      let workdirContent = '';
      const fileResult = await fileSystem.readFile(`${dir}/${filepath}`);
      if (fileResult.success && fileResult.data) {
        workdirContent = fileResult.data;
      }

      const oldText = headContent ? new TextDecoder().decode(headContent.blob) : '';
      const newText = workdirContent;

      // Generate unified diff format
      const diff = this.generateUnifiedDiff(filepath, oldText, newText);

      return {
        success: true,
        data: diff,
      };
    } catch (error) {
      console.error('Diff error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Generate unified diff format
   */
  private generateUnifiedDiff(filepath: string, oldText: string, newText: string): string {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const diff: string[] = [];
    diff.push(`--- a/${filepath}`);
    diff.push(`+++ b/${filepath}`);

    // Simple line-by-line diff (not optimal but functional)
    let oldIndex = 0;
    let newIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];

      if (oldIndex >= oldLines.length) {
        // Only new lines remain
        diff.push(`@@ -${oldIndex + 1},0 +${newIndex + 1},${newLines.length - newIndex} @@`);
        while (newIndex < newLines.length) {
          diff.push(`+${newLines[newIndex++]}`);
        }
        break;
      } else if (newIndex >= newLines.length) {
        // Only old lines remain
        diff.push(`@@ -${oldIndex + 1},${oldLines.length - oldIndex} +${newIndex + 1},0 @@`);
        while (oldIndex < oldLines.length) {
          diff.push(`-${oldLines[oldIndex++]}`);
        }
        break;
      } else if (oldLine === newLine) {
        // Context line
        diff.push(` ${oldLine}`);
        oldIndex++;
        newIndex++;
      } else {
        // Changed line
        diff.push(`@@ -${oldIndex + 1},1 +${newIndex + 1},1 @@`);
        diff.push(`-${oldLine}`);
        diff.push(`+${newLine}`);
        oldIndex++;
        newIndex++;
      }
    }

    return diff.join('\n');
  }

  /**
   * Stash uncommitted changes
   * Note: isomorphic-git doesn't have native stash support, so we implement it manually
   */
  async stash(message?: string, dir?: string): Promise<GitResult<string>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const fs = fileSystem.getFS();

      // Get current status
      const statusMatrix = await git.statusMatrix({ fs, dir: directory });
      const hasChanges = statusMatrix.some(
        ([, head, workdir, stage]) => head !== workdir || workdir !== stage
      );

      if (!hasChanges) {
        return {
          success: false,
          error: 'No local changes to stash',
        };
      }

      // Create stash metadata
      const stashMessage = message || `WIP on branch: ${Date.now()}`;
      const timestamp = Date.now();

      // Get current HEAD
      const currentOid = await git.resolveRef({ fs, dir: directory, ref: 'HEAD' });

      // Stage all changes
      for (const [filepath, , worktreeStatus] of statusMatrix) {
        if (worktreeStatus !== 1) {
          // If file exists in working tree
          if (worktreeStatus === 2) {
            await git.add({ fs, dir: directory, filepath });
          } else if (worktreeStatus === 0) {
            // File deleted
            await git.remove({ fs, dir: directory, filepath });
          }
        }
      }

      // Create stash commit
      const stashOid = await git.commit({
        fs,
        dir: directory,
        message: `stash: ${stashMessage}`,
        author: {
          name: 'Browser IDE User',
          email: 'user@browser-ide.dev',
        },
      });

      // Store stash info in a custom location
      const stashData = {
        oid: stashOid,
        message: stashMessage,
        timestamp,
        parentOid: currentOid,
      };

      // Save stash metadata to localStorage
      const existingStashes = this.getStashList();
      existingStashes.unshift(stashData);
      localStorage.setItem('git-stashes', JSON.stringify(existingStashes));

      // Reset working directory to HEAD
      await git.checkout({
        fs,
        dir: directory,
        ref: 'HEAD',
        force: true,
      });

      console.log(`📦 Created stash: ${stashMessage}`);
      return {
        success: true,
        data: stashOid,
      };
    } catch (error) {
      console.error('Stash error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * List all stashes
   */
  async stashList(): Promise<GitResult<Array<{
    index: number;
    oid: string;
    message: string;
    timestamp: number;
  }>>> {
    try {
      const stashes = this.getStashList();
      return {
        success: true,
        data: stashes.map((stash, index) => ({
          index,
          oid: stash.oid,
          message: stash.message,
          timestamp: stash.timestamp,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Apply a stash (without removing it)
   */
  async stashApply(stashIndex: number, dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const stashes = this.getStashList();
      const stash = stashes[stashIndex];

      if (!stash) {
        return {
          success: false,
          error: `Stash index ${stashIndex} not found`,
        };
      }

      const fs = fileSystem.getFS();

      // Cherry-pick the stash commit
      await git.checkout({
        fs,
        dir: directory,
        ref: stash.oid,
        force: false,
      });

      console.log(`✅ Applied stash ${stashIndex}: ${stash.message}`);
      return { success: true };
    } catch (error) {
      console.error('Stash apply error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Remove a stash from the list
   */
  async stashDrop(stashIndex: number): Promise<GitResult<void>> {
    try {
      const stashes = this.getStashList();

      if (stashIndex < 0 || stashIndex >= stashes.length) {
        return {
          success: false,
          error: `Stash index ${stashIndex} out of range`,
        };
      }

      stashes.splice(stashIndex, 1);
      localStorage.setItem('git-stashes', JSON.stringify(stashes));

      console.log(`🗑️ Dropped stash ${stashIndex}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Apply and remove a stash (pop)
   */
  async stashPop(stashIndex: number, dir?: string): Promise<GitResult<void>> {
    const applyResult = await this.stashApply(stashIndex, dir);

    if (!applyResult.success) {
      return applyResult;
    }

    return this.stashDrop(stashIndex);
  }

  /**
   * Get stash list from localStorage
   */
  private getStashList(): Array<{
    oid: string;
    message: string;
    timestamp: number;
    parentOid: string;
  }> {
    try {
      const stashesJson = localStorage.getItem('git-stashes');
      return stashesJson ? JSON.parse(stashesJson) : [];
    } catch {
      return [];
    }
  }

  /**
   * Merge a branch into the current branch
   * Supports both fast-forward and regular merges
   */
  async merge(
    branchName: string,
    dir?: string,
    options?: { fastForwardOnly?: boolean }
  ): Promise<GitResult<{ oid: string; fastForward: boolean }>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const fs = fileSystem.getFS();

      // Get current branch
      const currentBranch = await git.currentBranch({ fs, dir: directory });
      if (!currentBranch) {
        return {
          success: false,
          error: 'Not currently on any branch',
        };
      }

      // Check if branch exists
      try {
        await git.resolveRef({ fs, dir: directory, ref: branchName });
      } catch {
        return {
          success: false,
          error: `Branch '${branchName}' not found`,
        };
      }

      // Check for uncommitted changes
      const statusMatrix = await git.statusMatrix({ fs, dir: directory });
      const hasChanges = statusMatrix.some(
        ([, head, workdir, stage]) => head !== workdir || workdir !== stage
      );

      if (hasChanges) {
        return {
          success: false,
          error: 'You have uncommitted changes. Please commit or stash them before merging.',
        };
      }

      // Attempt fast-forward merge first
      try {
        const result = await git.merge({
          fs,
          dir: directory,
          ours: currentBranch,
          theirs: branchName,
          fastForward: true,
          dryRun: false,
        });

        console.log(`✅ Fast-forward merge completed: ${currentBranch} ← ${branchName}`);
        return {
          success: true,
          data: {
            oid: result.oid || '',
            fastForward: true,
          },
        };
      } catch (ffError) {
        // Fast-forward not possible
        if (options?.fastForwardOnly) {
          return {
            success: false,
            error: 'Fast-forward merge not possible. Use regular merge or rebase.',
          };
        }

        // Try regular merge
        try {
          const result = await git.merge({
            fs,
            dir: directory,
            ours: currentBranch,
            theirs: branchName,
            fastForward: false,
            dryRun: false,
            author: {
              name: 'Browser IDE User',
              email: 'user@browser-ide.dev',
            },
          });

          console.log(`✅ Merge completed: ${currentBranch} ← ${branchName}`);
          return {
            success: true,
            data: {
              oid: result.oid || '',
              fastForward: false,
            },
          };
        } catch (mergeError) {
          console.error('Merge error:', mergeError);
          return {
            success: false,
            error: `Merge failed: ${String(mergeError)}`,
          };
        }
      }
    } catch (error) {
      console.error('Merge error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Abort an in-progress merge
   */
  async abortMerge(dir?: string): Promise<GitResult<void>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const fs = fileSystem.getFS();

      // Reset to HEAD to abort merge
      await git.checkout({
        fs,
        dir: directory,
        ref: 'HEAD',
        force: true,
      });

      console.log('✅ Merge aborted');
      return { success: true };
    } catch (error) {
      console.error('Abort merge error:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Check if a merge is in progress
   */
  async isMergeInProgress(dir?: string): Promise<boolean> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const fs = fileSystem.getFS();

      // Check for MERGE_HEAD file
      try {
        await fs.promises.readFile(`${directory}/.git/MERGE_HEAD`, 'utf8');
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Get merge conflicts (if any)
   */
  async getMergeConflicts(dir?: string): Promise<GitResult<string[]>> {
    const directory = dir || fileSystem.getCurrentWorkingDirectory();

    try {
      const fs = fileSystem.getFS();
      const statusMatrix = await git.statusMatrix({ fs, dir: directory });

      // Files with stage 0 and workdir !== head are conflicts
      const conflicts = statusMatrix
        .filter(([, head, workdir, stage]) => {
          // Conflict markers: stage !== 1 or (head !== workdir && stage === 0)
          return stage === 0 && head !== workdir;
        })
        .map(([filepath]) => filepath);

      return {
        success: true,
        data: conflicts,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

export const gitService = new GitService();
