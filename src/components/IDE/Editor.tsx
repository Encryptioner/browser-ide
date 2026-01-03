import { useEffect, useState, useRef, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { fileSystem } from '@/services/filesystem';
import { useIDEStore } from '@/store/useIDEStore';
import { linterService } from '@/services/linter';
import { logger } from '@/utils/logger';

export function Editor() {
  const {
    currentFile,
    openFiles,
    closeFile,
    editorContent,
    updateEditorContent,
    markFileUnsaved,
    markFileSaved,
    settings,
    setCurrentFile,
  } = useIDEStore();

  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const editorRef = useRef<unknown | null>(null);
  const lintTimeout = useRef<number | undefined>(undefined);

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

  useEffect(() => {
    if (currentFile) {
      loadFile(currentFile);
    }
  }, [currentFile, loadFile]);

  function handleChange(value: string | undefined) {
    const newValue = value || '';
    setContent(newValue);
    if (currentFile) {
      updateEditorContent(currentFile, newValue);
      markFileUnsaved(currentFile);

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

  function handleEditorDidMount(editor: unknown) {
    editorRef.current = editor;

    // Add save shortcut

    if (editor && typeof editor === 'object' && 'addCommand' in editor) {
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const monacoEditor = editor as { addCommand: (shortcut: number, callback: () => void) => void };
      /* eslint-enable @typescript-eslint/no-unused-vars */
      // Cmd+S or Ctrl+S
      monacoEditor.addCommand(
        (window.navigator.platform.match('Mac') ? 2048 : 2048) | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
        () => {
          handleSave();
        }
      );
    }

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
      <div className="editor-empty flex items-center justify-center h-full bg-gray-900 text-gray-100 px-4 py-8">
        <div className="welcome max-w-4xl text-center">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Welcome to Browser IDE</h1>
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
    <div className="editor-container flex flex-col h-full bg-gray-900">
      {/* Mobile-optimized Tabs */}
      <div className="tabs flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {openFiles.map((file) => {
          const filename = file.split('/').pop() || file;
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
          return (
            <div
              key={file}
              className={`tab flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2 border-r border-gray-700 cursor-pointer min-w-max touch-manipulation ${
                file === currentFile
                  ? 'active bg-gray-900 text-blue-400'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
              onClick={() => setCurrentFile(file)}
            >
              <span className={`tab-name text-xs sm:text-sm ${isMobile ? 'truncate max-w-[100px]' : ''}`}>
                {isMobile && filename.length > 12 ? filename.substring(0, 12) + '...' : filename}
              </span>
              <button
                className={`tab-close hover:bg-gray-600 rounded px-1 text-xs sm:text-sm ${isMobile ? 'min-w-[20px] min-h-[20px]' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file);
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrapper flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          value={content}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme={settings.theme}
          options={{
            // Mobile-optimized visual settings
            fontSize: typeof window !== 'undefined' && window.innerWidth < 768 ? Math.max(settings.fontSize - 2, 12) : settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: typeof window !== 'undefined' && window.innerWidth < 768 ? 'on' : (settings.wordWrap || 'off'),
            minimap: { enabled: typeof window !== 'undefined' && window.innerWidth < 768 ? false : settings.minimap },
            lineNumbers: typeof window !== 'undefined' && window.innerWidth < 768 ? 'off' : settings.lineNumbers,
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
    </div>
  );
}
