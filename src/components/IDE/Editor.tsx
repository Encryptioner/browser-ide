import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { fileSystem } from '@/services/filesystem';
import { useIDEStore } from '@/store/useIDEStore';
import { useShallow } from 'zustand/react/shallow';
import { linterService } from '@/services/linter';
import { logger } from '@/utils/logger';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { EditorStatusBar } from './EditorStatusBar';
import type * as Monaco from 'monaco-editor';

export function Editor() {
  const { currentFile, openFiles, editorContent, unsavedChanges } = useIDEStore(
    useShallow(state => ({
      currentFile: state.currentFile,
      openFiles: state.openFiles,
      editorContent: state.editorContent,
      unsavedChanges: state.unsavedChanges,
    }))
  );

  const closeFile = useIDEStore(state => state.closeFile);
  const updateEditorContent = useIDEStore(state => state.updateEditorContent);
  const markFileUnsaved = useIDEStore(state => state.markFileUnsaved);
  const markFileSaved = useIDEStore(state => state.markFileSaved);
  const settings = useIDEStore(state => state.settings);
  const setCurrentFile = useIDEStore(state => state.setCurrentFile);
  const searchHighlight = useIDEStore(state => state.searchHighlight);

  const isMobile = useIsMobile();
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const lintTimeout = useRef<number | undefined>(undefined);
  const searchDecorationsRef = useRef<string[]>([]);
  const autoSaveTimeoutRef = useRef<number | undefined>(undefined);

  const loadFile = useCallback(async (path: string) => {
    // Check if already in memory
    if (editorContent[path] !== undefined) {
      setContent(editorContent[path]);
    } else {
      const result = await fileSystem.readFile(path);
      const fileContent = result.success ? result.data || '' : '';
      setContent(fileContent);
      updateEditorContent(path, fileContent);
    }

    // Detect language
    const lang = fileSystem.getLanguageFromPath(path);
    setLanguage(lang);
  }, [editorContent, updateEditorContent]);

  // Autosave functionality
  const triggerAutoSave = useCallback(async (file: string, fileContent: string) => {
    if (!settings.autoSave) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for autosave
    autoSaveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await fileSystem.writeFile(file, fileContent);
        markFileSaved(file);
        logger.info(`Autosaved: ${file}`);
      } catch (error) {
        logger.error('Autosave failed:', error);
      }
    }, settings.autoSaveDelay);
  }, [settings.autoSave, settings.autoSaveDelay, markFileSaved]);

  useEffect(() => {
    if (currentFile) {
      loadFile(currentFile);
    }

    // Cleanup autosave timeout on unmount or file change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentFile, loadFile]);

  // Apply search highlight decorations (use layout effect to avoid concurrent mode issues)
  useLayoutEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;

    // Clear existing decorations first
    searchDecorationsRef.current = editor.deltaDecorations(
      searchDecorationsRef.current,
      []
    );

    // Apply new highlight if it matches the current file
    if (searchHighlight && searchHighlight.file === currentFile && monacoRef.current) {
      const { line, column, text } = searchHighlight;
      const m = monacoRef.current;

      // Create a decoration for the search result
      const decorations: Monaco.editor.IModelDeltaDecoration[] = [
        {
          range: new m.Range(
            line,
            column,
            line,
            column + text.length
          ),
          options: {
            className: 'searchHighlight',
            stickiness: m.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            overviewRuler: {
              color: '#d4af37', // Gold color for search highlights
              position: m.editor.OverviewRulerLane.Full,
            },
          },
        },
      ];

      searchDecorationsRef.current = editor.deltaDecorations(
        [],
        decorations
      );

      // Reveal the line in the editor
      editor.revealLineInCenter(line);
    }
  }, [searchHighlight, currentFile]);

  function handleChange(value: string | undefined) {
    const newValue = value || '';
    setContent(newValue);
    if (currentFile) {
      updateEditorContent(currentFile, newValue);
      markFileUnsaved(currentFile);

      // Trigger autosave
      triggerAutoSave(currentFile, newValue);

      // Update linting in real-time (debounced)
      if (editorRef.current) {
        clearTimeout(lintTimeout.current);
        lintTimeout.current = window.setTimeout(async () => {
          await updateLinting(currentFile, newValue, editorRef.current);
        }, 500) as unknown as number; // 500ms debounce
      }
    }
  }

  async function updateLinting(filename: string, fileContent: string, editor: unknown) {
    try {
      const lang = fileSystem.getLanguageFromPath(filename);
      await linterService.updateMarkers(filename, fileContent, lang, editor as typeof import('monaco-editor'));
    } catch (error) {
      logger.error('Failed to update linting:', error);
    }
  }

  async function handleSave() {
    if (currentFile) {
      await fileSystem.writeFile(currentFile, content);
      markFileSaved(currentFile);

      // Update linting after save
      if (editorRef.current) {
        await updateLinting(currentFile, content, editorRef.current);
      }
    }
  }

  function handleEditorDidMount(editor: Monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof Monaco) {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // Add save shortcut
    // Cmd+S or Ctrl+S
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
      () => {
        handleSave();
      }
    );
  }

  // Handlers for welcome screen buttons
  function handleCloneClick() {
    window.dispatchEvent(new CustomEvent('show-clone-dialog'));
  }

  function handleSettingsClick() {
    window.dispatchEvent(new CustomEvent('show-settings-dialog'));
  }

  if (!currentFile) {
    return (
      <div className="editor-empty flex items-center justify-center h-full bg-gray-900 text-gray-100 px-4 py-8" role="region" aria-label="Editor welcome screen">
        <div className="welcome max-w-4xl text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4" id="welcome-heading">Welcome to Browser IDE</h1>
          <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-8">
            A full-featured IDE that runs entirely in your browser
          </p>
          <div className="features grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="feature p-4 sm:p-6 bg-gray-800 rounded-lg touch-manipulation hover:bg-gray-750 transition-colors">
              <span className="emoji text-3xl sm:text-4xl block mb-2">File Management</span>
              <h3 className="text-base sm:text-lg font-semibold mb-2">File Management</h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Browse and edit files with a VS Code-like interface
              </p>
            </div>
            <div className="feature p-4 sm:p-6 bg-gray-800 rounded-lg touch-manipulation hover:bg-gray-750 transition-colors">
              <span className="emoji text-3xl sm:text-4xl block mb-2">Git Integration</span>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Git Integration</h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Clone, commit, and push directly to GitHub
              </p>
            </div>
            <div className="feature p-4 sm:p-6 bg-gray-800 rounded-lg touch-manipulation hover:bg-gray-750 transition-colors">
              <span className="emoji text-3xl sm:text-4xl block mb-2">Run Code</span>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Run Code</h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Execute Node.js apps with WebContainers
              </p>
            </div>
            <div className="feature p-4 sm:p-6 bg-gray-800 rounded-lg touch-manipulation hover:bg-gray-750 transition-colors">
              <span className="emoji text-3xl sm:text-4xl block mb-2">AI Assistant</span>
              <h3 className="text-base sm:text-lg font-semibold mb-2">AI Assistant</h3>
              <p className="text-xs sm:text-sm text-gray-400">
                Get coding help from multiple AI providers
              </p>
            </div>
          </div>
          <div className="quick-actions flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleCloneClick}
              className="btn-primary px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium touch-manipulation min-w-[44px] min-h-[44px]"
            >
              Clone Repository
            </button>
            <button
              onClick={handleSettingsClick}
              className="btn-secondary px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation min-w-[44px] min-h-[44px]"
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container flex flex-col h-full bg-gray-900" role="region" aria-label="Code editor">
      {/* Mobile-optimized Tabs */}
      <div className="tabs flex bg-gray-800 border-b border-gray-700 overflow-x-auto" role="tablist" aria-label="Open file tabs">
        {openFiles.map((file) => {
          const filename = file.split('/').pop() || file;
          const mobile = isMobile;
          const isUnsaved = unsavedChanges.has(file);
          return (
            <div
              key={file}
              role="tab"
              aria-selected={file === currentFile}
              aria-label={`File: ${filename}${isUnsaved ? ' (unsaved changes)' : ''}`}
              className={`tab flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2 border-r border-gray-700 cursor-pointer min-w-max touch-manipulation ${
                file === currentFile
                  ? 'active bg-gray-900 text-blue-400'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
              onClick={() => setCurrentFile(file)}
              tabIndex={file === currentFile ? 0 : -1}
            >
              <span className={`tab-name text-xs sm:text-sm ${mobile ? 'truncate max-w-[100px]' : ''}`}>
                {mobile && filename.length > 12 ? filename.substring(0, 12) + '...' : filename}
              </span>
              {isUnsaved && (
                <span
                  className="unsaved-indicator text-blue-400 text-xs"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                >
                  ●
                </span>
              )}
              <button
                className={`tab-close hover:bg-gray-600 rounded px-1 text-xs sm:text-sm ${mobile ? 'min-w-[20px] min-h-[20px]' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file);
                }}
                aria-label={`Close file ${filename}`}
                title={`Close ${filename}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrapper flex-1 flex flex-col" role="tabpanel" aria-label="Code editing area">
        <div className="flex-1 min-h-0">
          <MonacoEditor
            height="100%"
            language={language}
            value={content}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            theme={settings.theme}
            loading={
              <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
                <div className="text-center">
                  <div className="animate-pulse mb-2">Loading editor...</div>
                  <div className="w-48 h-1 bg-gray-800 rounded overflow-hidden">
                    <div className="h-full bg-blue-600 rounded animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            }
            options={{
              // Mobile-optimized visual settings
              fontSize: isMobile ? Math.max(settings.fontSize - 2, 12) : settings.fontSize,
              tabSize: settings.tabSize,
              wordWrap: isMobile ? 'on' : (settings.wordWrap || 'off'),
              minimap: { enabled: isMobile ? false : settings.minimap },
              lineNumbers: isMobile ? 'off' : settings.lineNumbers,
              automaticLayout: true,
              scrollBeyondLastLine: false,

              // Enhanced IntelliSense and completion
              suggestOnTriggerCharacters: true,
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              suggestSelection: 'first',
              showUnused: true,
              showDeprecated: true,

              // Error detection and linting
              colorDecorators: true,
              codeLens: true,
              lightbulb: {
                enabled: true
              } as never,

              // Advanced editing features
              multiCursorModifier: 'ctrlCmd',
              multiCursorMergeOverlapping: true,
              renderWhitespace: 'selection',
              renderControlCharacters: true,

              // Find/Replace enhancements
              find: {
                addExtraSpaceOnTop: false,
                autoFindInSelection: 'never',
                seedSearchStringFromSelection: 'never'
              },

              // Folding and outlining
              folding: true,
              foldingStrategy: 'auto',
              foldingHighlight: true,
              showFoldingControls: 'always',

              // Bracket matching and highlighting
              matchBrackets: 'always',
              guides: {
                bracketPairs: true,
                indentation: true
              },

              // Enhanced language features
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: 'on',
              accessibilitySupport: 'auto',

              // Performance optimizations
              stablePeek: true,
              fastScrollSensitivity: 5,
              smoothScrolling: true,

              // Context menu and hover
              contextmenu: true,
              hover: {
                enabled: true,
                delay: 300,
                above: false
              },

              // Links and navigation
              links: true,
              gotoLocation: {
                multiple: 'goto'
              },

              // Inlay hints
              inlayHints: {
                enabled: 'on'
              }
            }}
          />
        </div>
        {currentFile && <EditorStatusBar />}
      </div>
    </div>
  );
}
