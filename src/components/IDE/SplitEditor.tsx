import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { X, Plus, Copy, CornerLeftUp, CornerRightUp, Columns, Rows, Maximize2, Minimize2, ChevronDown, FileText, GitCompare } from 'lucide-react';
import { useIDEStore } from '@/store/useIDEStore';
import { EditorGroup, EditorInstance, SplitEditorState } from '@/types';
import { clsx } from 'clsx';
import { nanoid } from 'nanoid';

interface SplitEditorProps {
  className?: string;
}

export function SplitEditor({ className }: SplitEditorProps) {
  const {
    openFiles,
    activeTabId,
    closeFile,
    duplicateTab,
    splitEditorState,
    setSplitEditorState,
    setActiveTab,
  } = useIDEStore();

  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file?: string;
    group?: string;
  } | null>(null);

  const panelRefs = useRef<Record<string, HTMLElement | null>>({});

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

  const addEditorToGroup = useCallback((groupId: string, filePath: string) => {
    if (!splitEditorState) return;

    const newGroups = [...splitEditorState.groups];
    const group = findGroupById(groupId, newGroups);

    if (group && openFiles[filePath]) {
      const newEditor: EditorInstance = {
        id: nanoid(),
        path: filePath,
        title: filePath.split('/').pop() || filePath,
        content: openFiles[filePath].content,
        language: openFiles[filePath].language,
        modified: openFiles[filePath].modified,
      };

      group.editors.push(newEditor);
      setSplitEditorState?.({
        ...splitEditorState,
        groups: newGroups,
        activeGroup: groupId,
        activeEditor: newEditor.id,
      });

      setActiveTab?.(filePath);
    }
  }, [splitEditorState, openFiles, setSplitEditorState, setActiveTab, findGroupById]);

  const removeEditorFromGroup = useCallback((groupId: string, editorId: string) => {
    if (!splitEditorState) return;

    const newGroups = [...splitEditorState.groups];
    const group = findGroupById(groupId, newGroups);

    if (group) {
      group.editors = group.editors.filter(e => e.id !== editorId);

      // Remove group if empty and not the last group
      if (group.editors.length === 0 && newGroups.length > 1) {
        const parentIndex = newGroups.findIndex(g => g.id === groupId ||
          (g.groups && g.groups.some(sub => sub.id === groupId))
        );
        if (parentIndex !== -1) {
          if (newGroups[parentIndex].id === groupId) {
            newGroups.splice(parentIndex, 1);
          } else if (newGroups[parentIndex].groups) {
            newGroups[parentIndex].groups = newGroups[parentIndex].groups!.filter(
              g => g.id !== groupId
            );
          }
        }
      }

      // Update active editor if needed
      let newActiveEditor = splitEditorState.activeEditor;
      let newActiveGroup = splitEditorState.activeGroup;

      if (splitEditorState.activeEditor === editorId) {
        const remainingEditors = group.editors.length > 0 ? group.editors :
          newGroups.length > 0 ? newGroups[0].editors : [];

        if (remainingEditors.length > 0) {
          newActiveEditor = remainingEditors[0].id;
        } else {
          newActiveEditor = '';
        }
      }

      setSplitEditorState?.({
        ...splitEditorState,
        groups: newGroups,
        activeEditor: newActiveEditor,
        activeGroup: newActiveGroup,
      });

      closeFile?.(editorId);
    }
  }, [splitEditorState, setSplitEditorState, closeFile, findGroupById]);

  const splitGroup = useCallback((groupId: string, direction: 'horizontal' | 'vertical') => {
    if (!splitEditorState) return;

    const newGroups = [...splitEditorState.groups];
    const group = findGroupById(groupId, newGroups);

    if (group) {
      const newGroup1: EditorGroup = {
        id: nanoid(),
        orientation: direction,
        size: 50,
        editors: group.editors.slice(0, Math.ceil(group.editors.length / 2)),
      };

      const newGroup2: EditorGroup = {
        id: nanoid(),
        orientation: direction,
        size: 50,
        editors: group.editors.slice(Math.ceil(group.editors.length / 2)),
      };

      const parent = findGroupById(groupId, newGroups) ||
        newGroups.find(g => g.groups?.some(sub => sub.id === groupId));

      if (parent) {
        if (parent.id === groupId) {
          const parentIndex = newGroups.findIndex(g => g.id === groupId);
          newGroups[parentIndex] = {
            id: groupId,
            orientation: direction,
            size: group.size,
            groups: [newGroup1, newGroup2],
          };
        } else if (parent.groups) {
          const parentGroupIndex = parent.groups.findIndex(g => g.id === groupId);
          parent.groups[parentGroupIndex] = {
            id: groupId,
            orientation: direction,
            size: group.size,
            groups: [newGroup1, newGroup2],
          };
        }
      }

      setSplitEditorState?.({
        ...splitEditorState,
        groups: newGroups,
        activeGroup: newGroup1.id,
        orientation: direction,
      });
    }
  }, [splitEditorState, setSplitEditorState, findGroupById]);

  const mergeGroups = useCallback((groupId1: string, groupId2: string) => {
    if (!splitEditorState) return;

    const newGroups = [...splitEditorState.groups];
    const group1 = findGroupById(groupId1, newGroups);
    const group2 = findGroupById(groupId2, newGroups);

    if (group1 && group2) {
      group1.editors = [...group1.editors, ...group2.editors];

      // Remove group2
      const removeGroup = (groups: EditorGroup[]): EditorGroup[] => {
        return groups.filter(g => {
          if (g.id === groupId2) return false;
          if (g.groups) {
            g.groups = removeGroup(g.groups);
          }
          return true;
        });
      };

      const filteredGroups = removeGroup(newGroups);

      setSplitEditorState?.({
        ...splitEditorState,
        groups: filteredGroups,
        activeGroup: groupId1,
      });
    }
  }, [splitEditorState, setSplitEditorState, findGroupById]);

  const handleDragStart = useCallback((e: React.DragEvent, filePath: string) => {
    setDraggedFile(filePath);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedGroup(groupId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, groupId: string) => {
    e.preventDefault();

    if (draggedFile && groupId) {
      addEditorToGroup(groupId, draggedFile);
    }

    setDraggedFile(null);
    setDraggedGroup(null);
  }, [draggedFile, addEditorToGroup]);

  const handleContextMenu = useCallback((e: React.MouseEvent, file?: string, group?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file, group });
  }, []);

  const contextMenuActions = [
    {
      label: 'Split Left',
      icon: CornerLeftUp,
      action: () => {
        if (contextMenu?.group) {
          splitGroup(contextMenu.group, 'horizontal');
        }
      },
      visible: !!contextMenu?.group,
    },
    {
      label: 'Split Right',
      icon: CornerRightUp,
      action: () => {
        if (contextMenu?.group) {
          splitGroup(contextMenu.group, 'horizontal');
        }
      },
      visible: !!contextMenu?.group,
    },
    {
      label: 'Split Below',
      icon: Rows,
      action: () => {
        if (contextMenu?.group) {
          splitGroup(contextMenu.group, 'vertical');
        }
      },
      visible: !!contextMenu?.group,
    },
    {
      label: 'Duplicate Editor',
      icon: Copy,
      action: () => {
        if (contextMenu?.file && contextMenu?.group) {
          addEditorToGroup(contextMenu.group, contextMenu.file);
        }
      },
      visible: !!contextMenu?.file && !!contextMenu?.group,
    },
    {
      label: 'Close Editor',
      icon: X,
      action: () => {
        if (contextMenu?.file && contextMenu?.group) {
          const group = findGroupById(contextMenu.group, splitEditorState?.groups || []);
          if (group) {
            const editor = group.editors.find(e => e.path === contextMenu.file);
            if (editor) {
              removeEditorFromGroup(contextMenu.group, editor.id);
            }
          }
        }
      },
      visible: !!contextMenu?.file && !!contextMenu?.group,
    },
  ];

  const renderEditor = useCallback((editor: EditorInstance, group: EditorGroup) => {
    const isActive = editor.id === splitEditorState?.activeEditor;

    return (
      <div
        key={editor.id}
        className={clsx(
          'flex flex-col h-full border border-gray-700',
          isActive && 'border-blue-500'
        )}
        draggable
        onDragStart={(e) => handleDragStart(e, editor.path)}
        onDragOver={(e) => handleDragOver(e, group.id)}
        onDrop={(e) => handleDrop(e, group.id)}
        onContextMenu={(e) => handleContextMenu(e, editor.path, group.id)}
      >
        {/* Editor Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium truncate">{editor.title}</span>
            {editor.modified && (
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => duplicateTab?.(editor.path)}
              className="p-1 hover:bg-gray-700 rounded"
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => removeEditorFromGroup(group.id, editor.id)}
              className="p-1 hover:bg-gray-700 rounded"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Editor Content - Placeholder for Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-4 bg-gray-900 font-mono text-sm text-gray-300">
            {/* This would be replaced with actual Monaco Editor instance */}
            <div className="text-gray-500">Monaco Editor would be rendered here</div>
            <div className="text-xs text-gray-600 mt-2">
              File: {editor.path}<br />
              Language: {editor.language}<br />
              Lines: {editor.content.split('\n').length}
            </div>
          </div>
        </div>
      </div>
    );
  }, [splitEditorState?.activeEditor, handleDragStart, handleDragOver, handleDrop, handleContextMenu, duplicateTab, removeEditorFromGroup]);

  const renderGroup = useCallback((group: EditorGroup, depth = 0): React.ReactNode => {
    const isActive = group.id === splitEditorState?.activeGroup;
    const isDragOver = draggedGroup === group.id;

    if (group.groups && group.groups.length > 0) {
      // Nested group
      return (
        <PanelGroup
          key={group.id}
          direction={group.orientation}
          className={clsx(
            'border-2 border-dashed',
            isDragOver ? 'border-blue-400 bg-blue-950' : 'border-transparent',
            isActive && 'ring-2 ring-blue-500'
          )}
        >
          {group.groups.map((subGroup, index) => (
            <React.Fragment key={subGroup.id}>
              {index > 0 && (
                <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
              )}
              <Panel defaultSize={subGroup.size} minSize={10}>
                {renderGroup(subGroup, depth + 1)}
              </Panel>
            </React.Fragment>
          ))}
        </PanelGroup>
      );
    } else {
      // Editor group
      return (
        <Panel
          key={group.id}
          ref={(el) => { panelRefs.current[group.id] = el; }}
          className={clsx(
            'p-2 border-2 border-dashed',
            isDragOver ? 'border-blue-400 bg-blue-950' : 'border-transparent',
            isActive && 'ring-2 ring-blue-500',
            'h-full'
          )}
          onDragOver={(e) => handleDragOver(e, group.id)}
          onDrop={(e) => handleDrop(e, group.id)}
        >
          {group.editors.length === 0 ? (
            <div
              className="h-full flex items-center justify-center text-gray-500"
              onContextMenu={(e) => handleContextMenu(e, undefined, group.id)}
            >
              <div className="text-center">
                <Columns className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <div className="text-sm">Drop files here</div>
                <div className="text-xs">or right-click to split</div>
              </div>
            </div>
          ) : (
            <PanelGroup direction={group.orientation} className="h-full">
              {group.editors.map((editor, index) => (
                <React.Fragment key={editor.id}>
                  {index > 0 && (
                    <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
                  )}
                  <Panel defaultSize={100 / group.editors.length} minSize={10}>
                    {renderEditor(editor, group)}
                  </Panel>
                </React.Fragment>
              ))}
            </PanelGroup>
          )}
        </Panel>
      );
    }
  }, [splitEditorState?.activeGroup, draggedGroup, handleDragOver, handleDrop, handleContextMenu, renderEditor]);

  if (!splitEditorState || splitEditorState.groups.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center h-full bg-gray-900 text-gray-500', className)}>
        <div className="text-center">
          <Columns className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <div className="text-lg mb-2">Split Editor</div>
          <div className="text-sm">Open files and drag them to create split views</div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('split-editor flex flex-col h-full bg-gray-900', className)}>
      {/* Split Editor Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => {
            const activeGroup = splitEditorState.groups.find(g => g.id === splitEditorState.activeGroup);
            if (activeGroup && Object.keys(openFiles).length > 0) {
              const firstFile = Object.keys(openFiles)[0];
              addEditorToGroup(activeGroup.id, firstFile);
            }
          }}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          title="Add Current File to Active Group"
        >
          <Plus className="w-4 h-4" />
          Add File
        </button>

        <div className="h-4 w-px bg-gray-600"></div>

        <button
          onClick={() => {
            const activeGroup = splitEditorState.groups.find(g => g.id === splitEditorState.activeGroup);
            if (activeGroup) {
              splitGroup(activeGroup.id, 'horizontal');
            }
          }}
          className="p-2 hover:bg-gray-700 rounded"
          title="Split Horizontal"
        >
          <Columns className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            const activeGroup = splitEditorState.groups.find(g => g.id === splitEditorState.activeGroup);
            if (activeGroup) {
              splitGroup(activeGroup.id, 'vertical');
            }
          }}
          className="p-2 hover:bg-gray-700 rounded"
          title="Split Vertical"
        >
          <Rows className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-gray-600"></div>

        <button
          onClick={() => {
            // Focus active group
            const activeGroup = splitEditorState.groups.find(g => g.id === splitEditorState.activeGroup);
            if (activeGroup && panelRefs.current[activeGroup.id]) {
              panelRefs.current[activeGroup.id]?.focus();
            }
          }}
          className="p-2 hover:bg-gray-700 rounded"
          title="Focus Active Group"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            // Reset to single group
            const activeGroup = splitEditorState.groups.find(g => g.id === splitEditorState.activeGroup);
            if (activeGroup) {
              setSplitEditorState?.({
                groups: [activeGroup],
                activeGroup: activeGroup.id,
                activeEditor: splitEditorState.activeEditor,
                orientation: 'horizontal',
                sizes: [100],
              });
            }
          }}
          className="p-2 hover:bg-gray-700 rounded"
          title="Reset Layout"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Groups: {splitEditorState.groups.length}</span>
          <span>•</span>
          <span>Editors: {splitEditorState.groups.reduce((total, group) => total + group.editors.length, 0)}</span>
          <span>•</span>
          <span>Layout: {splitEditorState.orientation}</span>
        </div>
      </div>

      {/* Split Editor Content */}
      <div className="flex-1 overflow-hidden">
        {splitEditorState.groups.length === 1 && !splitEditorState.groups[0].groups ? (
          renderGroup(splitEditorState.groups[0])
        ) : (
          <PanelGroup direction={splitEditorState.orientation} className="h-full">
            {splitEditorState.groups.map((group, index) => (
              <React.Fragment key={group.id}>
                {index > 0 && (
                  <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
                )}
                <Panel defaultSize={splitEditorState.sizes[index] || 100 / splitEditorState.groups.length} minSize={10}>
                  {renderGroup(group)}
                </Panel>
              </React.Fragment>
            ))}
          </PanelGroup>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {contextMenuActions
            .filter(action => action.visible)
            .map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.action();
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-gray-700"
              >
                {React.createElement(action.icon, { className: 'w-4 h-4' })}
                {action.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default SplitEditor;