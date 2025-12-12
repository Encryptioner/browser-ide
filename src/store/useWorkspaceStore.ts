/**
 * Multi-Workspace Store
 *
 * Manages multiple open projects simultaneously with independent state
 * Each workspace maintains its own editor state, file tree, git status, etc.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, OpenFile, GitStatus, GitCommit } from '@/types';
import { nanoid } from 'nanoid';

export interface WorkspaceData {
  project: Project;
  openFiles: OpenFile[];
  currentFile: string | null;
  gitStatus: GitStatus[];
  commits: GitCommit[];
  currentBranch: string;
  editorState: {
    scrollPosition?: number;
    cursorPosition?: { line: number; column: number };
  };
  sidebarCollapsed: boolean;
  lastActive: number;
}

export interface Workspace {
  id: string;
  projectId: string;
  name: string;
  data: WorkspaceData;
  createdAt: number;
  lastActive: number;
}

interface WorkspaceState {
  // Active workspace
  activeWorkspaceId: string | null;

  // All open workspaces
  workspaces: Record<string, Workspace>;

  // Workspace management
  createWorkspace: (project: Project) => string;
  switchWorkspace: (id: string) => void;
  closeWorkspace: (id: string) => void;
  updateWorkspaceData: (id: string, data: Partial<WorkspaceData>) => void;

  // Getters
  getActiveWorkspace: () => Workspace | null;
  getWorkspace: (id: string) => Workspace | null;
  getAllWorkspaces: () => Workspace[];

  // File operations in workspace
  addOpenFile: (workspaceId: string, file: OpenFile) => void;
  removeOpenFile: (workspaceId: string, filePath: string) => void;
  setCurrentFile: (workspaceId: string, filePath: string | null) => void;
  updateFileContent: (workspaceId: string, filePath: string, content: string) => void;

  // Git operations in workspace
  setGitStatus: (workspaceId: string, status: GitStatus[]) => void;
  setCommits: (workspaceId: string, commits: GitCommit[]) => void;
  setCurrentBranch: (workspaceId: string, branch: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      activeWorkspaceId: null,
      workspaces: {},

      createWorkspace: (project: Project) => {
        const id = nanoid();
        const now = Date.now();

        const workspace: Workspace = {
          id,
          projectId: project.id,
          name: project.name,
          data: {
            project,
            openFiles: [],
            currentFile: null,
            gitStatus: [],
            commits: [],
            currentBranch: project.gitBranch || 'main',
            editorState: {},
            sidebarCollapsed: false,
            lastActive: now,
          },
          createdAt: now,
          lastActive: now,
        };

        set((state) => ({
          workspaces: {
            ...state.workspaces,
            [id]: workspace,
          },
          activeWorkspaceId: id,
        }));

        return id;
      },

      switchWorkspace: (id: string) => {
        const workspace = get().workspaces[id];
        if (!workspace) return;

        set((state) => ({
          activeWorkspaceId: id,
          workspaces: {
            ...state.workspaces,
            [id]: {
              ...workspace,
              lastActive: Date.now(),
              data: {
                ...workspace.data,
                lastActive: Date.now(),
              },
            },
          },
        }));
      },

      closeWorkspace: (id: string) => {
        const { workspaces, activeWorkspaceId } = get();
        const newWorkspaces = { ...workspaces };
        delete newWorkspaces[id];

        // If closing active workspace, switch to most recent
        let newActiveId = activeWorkspaceId === id ? null : activeWorkspaceId;

        if (!newActiveId && Object.keys(newWorkspaces).length > 0) {
          // Switch to most recently active workspace
          const sorted = Object.values(newWorkspaces).sort(
            (a, b) => b.lastActive - a.lastActive
          );
          newActiveId = sorted[0]?.id || null;
        }

        set({
          workspaces: newWorkspaces,
          activeWorkspaceId: newActiveId,
        });
      },

      updateWorkspaceData: (id: string, dataUpdates: Partial<WorkspaceData>) => {
        set((state) => {
          const workspace = state.workspaces[id];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [id]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  ...dataUpdates,
                  lastActive: Date.now(),
                },
                lastActive: Date.now(),
              },
            },
          };
        });
      },

      // Getters
      getActiveWorkspace: () => {
        const { activeWorkspaceId, workspaces } = get();
        return activeWorkspaceId ? workspaces[activeWorkspaceId] || null : null;
      },

      getWorkspace: (id: string) => {
        return get().workspaces[id] || null;
      },

      getAllWorkspaces: () => {
        return Object.values(get().workspaces).sort(
          (a, b) => b.lastActive - a.lastActive
        );
      },

      // File operations
      addOpenFile: (workspaceId: string, file: OpenFile) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          const exists = workspace.data.openFiles.some((f) => f.path === file.path);
          if (exists) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  openFiles: [...workspace.data.openFiles, file],
                },
              },
            },
          };
        });
      },

      removeOpenFile: (workspaceId: string, filePath: string) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  openFiles: workspace.data.openFiles.filter((f) => f.path !== filePath),
                  currentFile:
                    workspace.data.currentFile === filePath ? null : workspace.data.currentFile,
                },
              },
            },
          };
        });
      },

      setCurrentFile: (workspaceId: string, filePath: string | null) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  currentFile: filePath,
                },
              },
            },
          };
        });
      },

      updateFileContent: (workspaceId: string, filePath: string, content: string) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  openFiles: workspace.data.openFiles.map((file) =>
                    file.path === filePath
                      ? { ...file, content, modified: true }
                      : file
                  ),
                },
              },
            },
          };
        });
      },

      // Git operations
      setGitStatus: (workspaceId: string, status: GitStatus[]) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  gitStatus: status,
                },
              },
            },
          };
        });
      },

      setCommits: (workspaceId: string, commits: GitCommit[]) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  commits,
                },
              },
            },
          };
        });
      },

      setCurrentBranch: (workspaceId: string, branch: string) => {
        set((state) => {
          const workspace = state.workspaces[workspaceId];
          if (!workspace) return state;

          return {
            workspaces: {
              ...state.workspaces,
              [workspaceId]: {
                ...workspace,
                data: {
                  ...workspace.data,
                  currentBranch: branch,
                },
              },
            },
          };
        });
      },
    }),
    {
      name: 'workspace-storage',
      version: 1,
    }
  )
);
