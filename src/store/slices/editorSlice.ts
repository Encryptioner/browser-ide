import type { StateCreator } from 'zustand';
import type { SplitEditorState } from '@/types';
import type { IDEStore } from '../types';

export interface PendingDiff {
  file: string;
  original: string;
  modified: string;
  language: string;
}

export interface EditorSlice {
  // State
  currentFile: string | null;
  openFiles: string[];
  editorContent: Record<string, string>;
  unsavedChanges: Set<string>;
  activeTabId: string | null;
  splitEditorState: SplitEditorState | null;
  searchHighlight: {
    file: string;
    line: number;
    column: number;
    text: string;
  } | null;
  fileLastSavedTime: Record<string, number>;
  pendingDiff: PendingDiff | null;

  // Actions
  setCurrentFile: (_file: string | null) => void;
  addOpenFile: (_file: string) => void;
  closeFile: (_file: string) => void;
  closeAllFiles: () => void;
  updateEditorContent: (_file: string, _content: string) => void;
  markFileUnsaved: (_file: string) => void;
  markFileSaved: (_file: string) => void;
  setSearchHighlight: (
    _highlight: { file: string; line: number; column: number; text: string } | null
  ) => void;
  clearSearchHighlight: () => void;
  setSplitEditorState: (_state: SplitEditorState) => void;
  setActiveTab: (_tabId: string) => void;
  duplicateTab: (_tabId: string) => void;
  closeTab: (_tabId: string) => void;
  setPendingDiff: (_diff: PendingDiff | null) => void;
  acceptDiff: () => void;
  rejectDiff: () => void;
}

export const createEditorSlice: StateCreator<IDEStore, [], [], EditorSlice> = (
  set,
  get
) => ({
  // Initial state
  currentFile: null,
  openFiles: [],
  editorContent: {},
  unsavedChanges: new Set(),
  activeTabId: null,
  splitEditorState: null,
  searchHighlight: null,
  fileLastSavedTime: {},
  pendingDiff: null,

  // Actions
  setCurrentFile: (file) => set({ currentFile: file }),
  addOpenFile: (file) =>
    set((state) => {
      if (state.openFiles.includes(file)) return state;
      return { openFiles: [...state.openFiles, file] };
    }),
  closeFile: (fileId) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f !== fileId);
      const newCurrentFile =
        state.currentFile === fileId
          ? newOpenFiles.length > 0
            ? newOpenFiles[newOpenFiles.length - 1]
            : null
          : state.currentFile;

      return {
        openFiles: newOpenFiles,
        currentFile: newCurrentFile,
      };
    }),
  closeAllFiles: () => set({ openFiles: [], currentFile: null }),
  updateEditorContent: (file, content) =>
    set((state) => ({
      editorContent: { ...state.editorContent, [file]: content },
      unsavedChanges: new Set([...state.unsavedChanges, file]),
    })),
  markFileUnsaved: (file) =>
    set((state) => ({
      unsavedChanges: new Set([...state.unsavedChanges, file]),
    })),
  markFileSaved: (file) =>
    set((state) => {
      const newUnsavedChanges = new Set(state.unsavedChanges);
      newUnsavedChanges.delete(file);
      return { unsavedChanges: newUnsavedChanges };
    }),
  setSearchHighlight: (highlight) => set({ searchHighlight: highlight }),
  clearSearchHighlight: () => set({ searchHighlight: null }),
  setSplitEditorState: (state) => set({ splitEditorState: state }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  duplicateTab: (tabId) => {
    const sourceFile = get().files[tabId];
    if (sourceFile) {
      const newTabId = `tab-${Date.now()}`;
      set((state) => ({
        files: { ...state.files, [newTabId]: sourceFile },
        openFiles: [...state.openFiles, newTabId],
        activeTabId: newTabId,
      }));
    }
  },
  closeTab: (tabId) =>
    set((state) => {
      const newOpenFiles = state.openFiles.filter((f) => f !== tabId);
      const newFiles = { ...state.files };
      delete newFiles[tabId];

      return {
        openFiles: newOpenFiles,
        files: newFiles,
        activeTabId:
          state.activeTabId === tabId
            ? newOpenFiles.length > 0
              ? newOpenFiles[newOpenFiles.length - 1]
              : null
            : state.activeTabId,
      };
    }),
  setPendingDiff: (diff) => set({ pendingDiff: diff }),
  acceptDiff: () => {
    const { pendingDiff } = get();
    if (!pendingDiff) return;
    set((state) => ({
      editorContent: {
        ...state.editorContent,
        [pendingDiff.file]: pendingDiff.modified,
      },
      unsavedChanges: new Set([...state.unsavedChanges, pendingDiff.file]),
      pendingDiff: null,
    }));
  },
  rejectDiff: () => set({ pendingDiff: null }),
});
