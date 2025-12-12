import { useState, useEffect, useRef } from 'react';
import { useIDEStore } from '@/store/useIDEStore';
import { fileSystem } from '@/services/filesystem';

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  context: string;
}

export function SearchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [searchOptions, setSearchOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includeFiles: '*.{js,jsx,ts,tsx,json,css,html,md}',
    excludeFiles: '*.min.js,*.d.ts,node_modules/*'
  });
  const [isSearching, setIsSearching] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  const { currentFile, openFiles, setCurrentFile } = useIDEStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+F or Cmd+Shift+F for global search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }

      // Ctrl+H for replace mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'H' && isOpen) {
        e.preventDefault();
        setReplaceMode(!replaceMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, replaceMode]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Perform search
  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    const searchResults: SearchResult[] = [];

    try {
      // Get all files in current directory
      const fileList = await fileSystem.listCurrentDirectory();
      if (!fileList.success || !fileList.data) return;

      // Filter files based on include/exclude patterns
      const filesToSearch = fileList.data.filter(item => {
        if (item.type !== 'file') return false;

        const filename = item.name;
        const includePattern = searchOptions.includeFiles.replace(/\*/g, '.*');
        const excludePattern = searchOptions.excludeFiles.replace(/\*/g, '.*');

        return new RegExp(includePattern).test(filename) &&
               !new RegExp(excludePattern).test(filename);
      });

      // Search each file
      for (const file of filesToSearch) {
        const contentResult = await fileSystem.readFile(file.name);
        if (contentResult.success && contentResult.data) {
          const lines = contentResult.data.split('\n');

          lines.forEach((line, lineIndex) => {
            let searchRegex;

            if (searchOptions.regex) {
              searchRegex = new RegExp(searchTerm, searchOptions.caseSensitive ? 'g' : 'gi');
            } else {
              const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const flags = searchOptions.caseSensitive ? 'g' : 'gi';
              searchRegex = searchOptions.wholeWord
                ? new RegExp(`\\b${escapedTerm}\\b`, flags)
                : new RegExp(escapedTerm, flags);
            }

            const matches = [...line.matchAll(searchRegex)];
            matches.forEach(match => {
              if (match.index !== undefined) {
                searchResults.push({
                  file: file.name,
                  line: lineIndex + 1,
                  column: match.index + 1,
                  text: match[0],
                  context: line.trim()
                });
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      setResults(searchResults);
      setCurrentResultIndex(0);
    }
  };

  // Navigate to search result
  const goToResult = (result: SearchResult) => {
    setCurrentFile(result.file);
    // TODO: Add line and column highlighting in Monaco editor
  };

  // Replace function (simplified)
  const performReplace = async () => {
    if (!searchTerm.trim() || !replaceMode) return;

    let replaceCount = 0;
    const filesToReplace = new Set(results.map(r => r.file));

    for (const filePath of Array.from(filesToReplace)) {
      const contentResult = await fileSystem.readFile(filePath);
      if (contentResult.success && contentResult.data) {
        let newContent = contentResult.data;

        results
          .filter(r => r.file === filePath)
          .forEach(result => {
            // Simple string replace for now
            if (searchOptions.regex) {
              const regex = new RegExp(searchTerm, searchOptions.caseSensitive ? 'g' : 'gi');
              newContent = newContent.replace(regex, replaceTerm);
            } else {
              newContent = newContent.replace(
                new RegExp(searchTerm, searchOptions.caseSensitive ? 'g' : 'gi'),
                replaceTerm
              );
            }
            replaceCount++;
          });

        await fileSystem.writeFile(filePath, newContent);
      }
    }

    alert(`Replaced ${replaceCount} occurrences in ${filesToReplace.size} files`);
    // Re-search to update results
    await performSearch();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1 relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch();
                  }
                }}
                placeholder="Find..."
                className="w-full bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none pr-10"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
                {results.length} results
              </div>
            </div>

            {replaceMode && (
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Replace..."
                className="flex-1 bg-gray-800 text-gray-100 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReplaceMode(!replaceMode)}
              className={`px-3 py-2 rounded text-sm ${
                replaceMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Toggle Replace Mode (Ctrl+H)"
            >
              Replace
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search options */}
        <div className="px-4 py-2 border-b border-gray-700 flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={searchOptions.caseSensitive}
              onChange={(e) => setSearchOptions({...searchOptions, caseSensitive: e.target.checked})}
            />
            Case Sensitive
          </label>

          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={searchOptions.wholeWord}
              onChange={(e) => setSearchOptions({...searchOptions, wholeWord: e.target.checked})}
            />
            Whole Word
          </label>

          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={searchOptions.regex}
              onChange={(e) => setSearchOptions({...searchOptions, regex: e.target.checked})}
            />
            Regular Expression
          </label>

          <div className="flex-1" />

          <button
            onClick={performSearch}
            disabled={isSearching || !searchTerm.trim()}
            className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>

          {replaceMode && (
            <button
              onClick={performReplace}
              disabled={results.length === 0 || !replaceTerm.trim()}
              className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Replace All
            </button>
          )}
        </div>

        {/* File patterns */}
        <div className="px-4 py-2 border-b border-gray-700 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-400">Include:</label>
            <input
              type="text"
              value={searchOptions.includeFiles}
              onChange={(e) => setSearchOptions({...searchOptions, includeFiles: e.target.value})}
              className="flex-1 bg-gray-800 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-400">Exclude:</label>
            <input
              type="text"
              value={searchOptions.excludeFiles}
              onChange={(e) => setSearchOptions({...searchOptions, excludeFiles: e.target.value})}
              className="flex-1 bg-gray-800 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-xs"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {results.length === 0 && !isSearching && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No results found' : 'Enter a search term and press Enter'}
            </div>
          )}

          {results.length > 0 && (
            <div className="text-xs text-gray-500 px-4 py-2 border-b border-gray-700">
              Found {results.length} results in {new Set(results.map(r => r.file)).size} files
            </div>
          )}

          <div className="divide-y divide-gray-700">
            {results.map((result, index) => (
              <div
                key={`${result.file}-${result.line}-${result.column}`}
                className={`px-4 py-2 hover:bg-gray-800 cursor-pointer ${
                  index === currentResultIndex ? 'bg-blue-600 bg-opacity-20' : ''
                }`}
                onClick={() => goToResult(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-400 font-mono text-xs">
                        {result.file}:{result.line}:{result.column}
                      </span>
                      <span className="text-yellow-500 font-semibold">
                        {result.text}
                      </span>
                    </div>
                    <div className="text-gray-300 font-mono text-sm truncate">
                      {result.context}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status bar */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
            <span>
              {currentResultIndex + 1} of {results.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentResultIndex(Math.max(0, currentResultIndex - 1))}
                disabled={currentResultIndex === 0}
                className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50"
              >
                ↑ Previous
              </button>
              <button
                onClick={() => setCurrentResultIndex(Math.min(results.length - 1, currentResultIndex + 1))}
                disabled={currentResultIndex === results.length - 1}
                className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50"
              >
                ↓ Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}