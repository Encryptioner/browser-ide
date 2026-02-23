/**
 * Source Control Service
 *
 * Business logic extracted from SourceControlPanel.tsx.
 * Handles git operations orchestration, file status categorization,
 * branch management, stash management, and utility functions.
 */

import { gitService } from '@/services/git';
import type { GitAuthor } from '@/services/git';
import type { GitStatus } from '@/types';

// ============= Constants =============

const DEFAULT_REPO_DIR = '/repo';

const DEFAULT_AUTHOR: GitAuthor = {
  name: 'Browser IDE User',
  email: 'user@browser-ide.dev',
};

// ============= File Status Helpers =============

/**
 * Filter git status entries to find staged files.
 * Staged files have status: added, modified, or deleted.
 */
export function getStagedFiles(gitStatus: GitStatus[]): GitStatus[] {
  return gitStatus.filter(
    (f) => f.status === 'added' || f.status === 'modified' || f.status === 'deleted'
  );
}

/**
 * Filter git status entries to find unstaged files.
 * Unstaged files have status: unstaged or untracked.
 */
export function getUnstagedFiles(gitStatus: GitStatus[]): GitStatus[] {
  return gitStatus.filter((f) => f.status === 'unstaged' || f.status === 'untracked');
}

// ============= Date Formatting =============

/**
 * Format a Unix timestamp (seconds) into a relative time string.
 * Used for commit history display.
 */
export function formatCommitDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = Date.now();
  const diff = now - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Format a millisecond timestamp into a relative time string.
 * Used for stash display.
 */
export function formatStashTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return date.toLocaleDateString();
}

// ============= Git Operations =============

export interface SourceControlResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Refresh git repository status by re-initializing.
 */
async function refreshRepository(): Promise<SourceControlResult> {
  try {
    const result = await gitService.initializeRepository(DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Stage a single file.
 */
async function stageFile(filepath: string): Promise<SourceControlResult> {
  try {
    const result = await gitService.add(DEFAULT_REPO_DIR, filepath);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Unstage a single file.
 */
async function unstageFile(filepath: string): Promise<SourceControlResult> {
  try {
    const result = await gitService.remove(DEFAULT_REPO_DIR, filepath);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Stage all unstaged files.
 */
async function stageAllFiles(unstagedFiles: GitStatus[]): Promise<SourceControlResult> {
  try {
    for (const file of unstagedFiles) {
      await gitService.add(DEFAULT_REPO_DIR, file.path);
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Unstage all staged files.
 */
async function unstageAllFiles(stagedFiles: GitStatus[]): Promise<SourceControlResult> {
  try {
    for (const file of stagedFiles) {
      await gitService.remove(DEFAULT_REPO_DIR, file.path);
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Validate and perform a commit.
 * Returns an object indicating the validation/commit result.
 */
async function commitChanges(
  message: string,
  stagedFileCount: number
): Promise<SourceControlResult> {
  if (!message.trim()) {
    return { success: false, error: 'Please enter a commit message' };
  }

  if (stagedFileCount === 0) {
    return { success: false, error: 'No staged changes to commit' };
  }

  try {
    const result = await gitService.commit(message.trim(), DEFAULT_AUTHOR, DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Push to remote.
 */
async function pushToRemote(): Promise<SourceControlResult> {
  try {
    const result = await gitService.push('', DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Pull from remote.
 */
async function pullFromRemote(): Promise<SourceControlResult> {
  try {
    const result = await gitService.pull('', DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

// ============= Branch Operations =============

export interface BranchInfo {
  name: string;
  current: boolean;
}

/**
 * Load all branches for the repository.
 */
async function loadBranches(): Promise<SourceControlResult<BranchInfo[]>> {
  try {
    const result = await gitService.listBranches(DEFAULT_REPO_DIR);
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Checkout a branch and re-initialize the repository.
 */
async function checkoutBranch(branchName: string): Promise<SourceControlResult> {
  try {
    const result = await gitService.checkout(branchName);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    await gitService.initializeRepository(DEFAULT_REPO_DIR);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Create a new branch.
 */
async function createBranch(branchName: string): Promise<SourceControlResult> {
  if (!branchName.trim()) {
    return { success: false, error: 'Please enter a branch name' };
  }

  try {
    const result = await gitService.createBranch(DEFAULT_REPO_DIR, branchName.trim());
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a branch. Returns an error if trying to delete the current branch.
 */
async function deleteBranch(
  branchName: string,
  currentBranch: string
): Promise<SourceControlResult> {
  if (branchName === currentBranch) {
    return { success: false, error: 'Cannot delete the current branch' };
  }

  try {
    const result = await gitService.deleteBranch(DEFAULT_REPO_DIR, branchName);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Merge a branch into the current branch.
 * Returns merge type info on success.
 */
async function mergeBranch(
  branchName: string,
  currentBranch: string
): Promise<SourceControlResult<{ mergeType: string }>> {
  if (branchName === currentBranch) {
    return { success: false, error: 'Cannot merge current branch into itself' };
  }

  try {
    const result = await gitService.merge(branchName, DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const mergeType = result.data?.fastForward ? 'Fast-forward' : 'Merge';
    await gitService.initializeRepository(DEFAULT_REPO_DIR);

    return { success: true, data: { mergeType } };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

// ============= Stash Operations =============

export interface StashEntry {
  index: number;
  oid: string;
  message: string;
  timestamp: number;
}

/**
 * Load the stash list.
 */
async function loadStashes(): Promise<SourceControlResult<StashEntry[]>> {
  try {
    const result = await gitService.stashList();
    if (result.success && result.data) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Create a new stash entry.
 */
async function createStash(message?: string): Promise<SourceControlResult> {
  try {
    const result = await gitService.stash(message || undefined, DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Apply a stash entry without removing it.
 */
async function applyStash(index: number): Promise<SourceControlResult> {
  try {
    const result = await gitService.stashApply(index, DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Pop a stash entry (apply and remove).
 */
async function popStash(index: number): Promise<SourceControlResult> {
  try {
    const result = await gitService.stashPop(index, DEFAULT_REPO_DIR);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

/**
 * Drop a stash entry.
 */
async function dropStash(index: number): Promise<SourceControlResult> {
  try {
    const result = await gitService.stashDrop(index);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
}

// ============= Service Singleton =============

class SourceControlService {
  // File status
  readonly getStagedFiles = getStagedFiles;
  readonly getUnstagedFiles = getUnstagedFiles;

  // Date formatting
  readonly formatCommitDate = formatCommitDate;
  readonly formatStashTimestamp = formatStashTimestamp;

  // Git operations
  readonly refreshRepository = refreshRepository;
  readonly stageFile = stageFile;
  readonly unstageFile = unstageFile;
  readonly stageAllFiles = stageAllFiles;
  readonly unstageAllFiles = unstageAllFiles;
  readonly commitChanges = commitChanges;
  readonly pushToRemote = pushToRemote;
  readonly pullFromRemote = pullFromRemote;

  // Branch operations
  readonly loadBranches = loadBranches;
  readonly checkoutBranch = checkoutBranch;
  readonly createBranch = createBranch;
  readonly deleteBranch = deleteBranch;
  readonly mergeBranch = mergeBranch;

  // Stash operations
  readonly loadStashes = loadStashes;
  readonly createStash = createStash;
  readonly applyStash = applyStash;
  readonly popStash = popStash;
  readonly dropStash = dropStash;
}

export const sourceControlService = new SourceControlService();
