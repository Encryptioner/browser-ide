import type { StateCreator } from 'zustand';
import type { GitStatus, GitCommit } from '@/types';
import type { IDEStore } from '../types';

export interface GitSlice {
  // State
  currentRepo: string | null;
  currentBranch: string;
  gitStatus: GitStatus[];
  commits: GitCommit[];

  // Actions
  setCurrentRepo: (_repo: string | null) => void;
  setCurrentBranch: (_branch: string) => void;
  setGitStatus: (_status: GitStatus[]) => void;
  setCommits: (_commits: GitCommit[]) => void;
}

export const createGitSlice: StateCreator<IDEStore, [], [], GitSlice> = (set) => ({
  // Initial state
  currentRepo: null,
  currentBranch: 'main',
  gitStatus: [],
  commits: [],

  // Actions
  setCurrentRepo: (repo) => set({ currentRepo: repo }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  setGitStatus: (status) => set({ gitStatus: status }),
  setCommits: (commits) => set({ commits }),
});
