import React, { useCallback, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useIDEStore } from '@/store/useIDEStore';
import { EditorGroup, SplitEditorState } from '@/types';
import { clsx } from 'clsx';
import { nanoid } from 'nanoid';

interface SplitEditorProps {
  className?: string;
}

export function SplitEditor({ className }: SplitEditorProps) {
  const {
    splitEditorState,
    setSplitEditorState,
  } = useIDEStore();

  // Initialize split editor state if not present
  useEffect(() => {
    if (!splitEditorState || splitEditorState.groups.length === 0) {
      const defaultGroup: EditorGroup = {
        id: nanoid(),
        orientation: 'horizontal',
        size: 100,
        editors: [],
        groups: [],
      };

      const initialState: SplitEditorState = {
        groups: [defaultGroup],
        activeGroup: defaultGroup.id,
        activeEditor: '',
        orientation: 'horizontal',
        sizes: [100],
      };

      setSplitEditorState?.(initialState);
    }
  }, [splitEditorState, setSplitEditorState]);

  const findGroupById = useCallback((groupId: string, groups: EditorGroup[]): EditorGroup | null => {
    for (const group of groups) {
      if (group.id === groupId) {
        return group;
      }
      if (group.groups) {
        const found = findGroupById(groupId, group.groups);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // The following functions are kept for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addEditorToGroup = useCallback(() => {
    // Future: Add editor to a specific group
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeEditorFromGroup = useCallback(() => {
    // Future: Remove editor from a specific group
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const splitGroup = useCallback(() => {
    // Future: Split a group into two
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _mergeGroups = useCallback(() => {
    // Future: Merge two groups into one
  }, []);

  return (
    <div className={clsx('split-editor flex flex-col h-full bg-gray-900', className)}>
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <p>Split Editor</p>
        </div>
      </div>
    </div>
  );
}

export default SplitEditor;
