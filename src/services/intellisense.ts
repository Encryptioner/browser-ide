import type {
  CompletionItem,
  CompletionContext,
  CompletionList,
  CompletionTriggerKind,
  Hover,
  SignatureHelp,
  Definition,
  Reference,
  DocumentSymbol,
  WorkspaceSymbol,
  CodeAction,
  Diagnostic
} from 'vscode-languageserver-protocol';

export interface IntelliSenseCompletion {
  label: string;
  kind: 'method' | 'function' | 'constructor' | 'field' | 'variable' | 'class' | 'interface' | 'module' | 'property' | 'unit' | 'value' | 'enum' | 'keyword' | 'snippet' | 'text' | 'color' | 'file' | 'reference' | 'folder' | 'typeParameter' | 'user';
  detail?: string;
  documentation?: string;
  insertText?: string;
  filterText?: string;
  sortText?: string;
  commitCharacters?: string[];
  data?: any;
  command?: {
    title: string;
    command: string;
    arguments?: any[];
  };
}

export interface IntelliSenseProvider {
  id: string;
  name: string;
  languages: string[];
  enabled: boolean;

  // Core completion methods
  provideCompletionItems(
    document: string,
    position: { line: number; character: number },
    context?: CompletionContext
  ): Promise<CompletionItem[]>;

  // Hover information
  provideHover(
    document: string,
    position: { line: number; character: number }
  ): Promise<Hover | null>;

  // Signature help for function calls
  provideSignatureHelp(
    document: string,
    position: { line: number; character: number }
  ): Promise<SignatureHelp | null>;

  // Go to definition
  provideDefinition(
    document: string,
    position: { line: number; character: number }
  ): Promise<Definition | null>;

  // Find references
  provideReferences(
    document: string,
    position: { line: number; character: number }
  ): Promise<Reference[]>;

  // Document symbols
  provideDocumentSymbols(document: string): Promise<DocumentSymbol[]>;

  // Code actions (quick fixes, refactoring)
  provideCodeActions(
    document: string,
    range: { start: { line: number; character: number }; end: { line: number; character: number } }
  ): Promise<CodeAction[]>;

  // Diagnostics (linting, type checking)
  provideDiagnostics(document: string): Promise<Diagnostic[]>;

  // Workspace symbols (global search)
  provideWorkspaceSymbols(query: string): Promise<WorkspaceSymbol[]>;

  // Provider lifecycle
  activate(): Promise<void>;
  deactivate(): Promise<void>;
}

export class JavaScriptIntelliSenseProvider implements IntelliSenseProvider {
  id = 'javascript';
  name = 'JavaScript';
  languages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
  enabled = true;

  private builtInObjects = new Map<string, IntelliSenseCompletion[]>();
  private keywords = [
    'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
    'finally', 'for', 'function', 'if', 'implements', 'import', 'in',
    'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private',
    'protected', 'public', 'return', 'super', 'switch', 'static', 'this',
    'throw', 'try', 'true', 'typeof', 'var', 'void', 'while', 'with', 'yield'
  ];

  private fileCache = new Map<string, { content: string; symbols: DocumentSymbol[]; lastModified: number }>();

  constructor() {
    this.initializeBuiltInObjects();
  }

  async activate(): Promise<void> {
    // Initialize language-specific resources
    console.log('JavaScript IntelliSense provider activated');
  }

  async deactivate(): Promise<void> {
    this.fileCache.clear();
    console.log('JavaScript IntelliSense provider deactivated');
  }

  private initializeBuiltInObjects(): void {
    // Global objects and their members
    this.builtInObjects.set('console', [
      { label: 'log', kind: 'method', documentation: 'Logs a message to the console' },
      { label: 'error', kind: 'method', documentation: 'Logs an error message to the console' },
      { label: 'warn', kind: 'method', documentation: 'Logs a warning message to the console' },
      { label: 'info', kind: 'method', documentation: 'Logs an info message to the console' },
      { label: 'debug', kind: 'method', documentation: 'Logs a debug message to the console' },
      { label: 'trace', kind: 'method', documentation: 'Logs a trace message to the console' },
      { label: 'table', kind: 'method', documentation: 'Displays data in a tabular format' },
      { label: 'clear', kind: 'method', documentation: 'Clears the console' },
      { label: 'count', kind: 'method', documentation: 'Counts the number of times this has been called' },
      { label: 'group', kind: 'method', documentation: 'Creates a new inline group in the console' },
      { label: 'groupEnd', kind: 'method', documentation: 'Exits the current inline group' },
    ]);

    this.builtInObjects.set('Array', [
      { label: 'length', kind: 'property', documentation: 'The length of the array' },
      { label: 'push', kind: 'method', documentation: 'Adds one or more elements to the end of an array' },
      { label: 'pop', kind: 'method', documentation: 'Removes and returns the last element from an array' },
      { label: 'shift', kind: 'method', documentation: 'Removes and returns the first element from an array' },
      { label: 'unshift', kind: 'method', documentation: 'Adds one or more elements to the beginning of an array' },
      { label: 'slice', kind: 'method', documentation: 'Returns a shallow copy of a portion of an array' },
      { label: 'splice', kind: 'method', documentation: 'Changes the contents of an array by removing or replacing existing elements' },
      { label: 'map', kind: 'method', documentation: 'Creates a new array with the results of calling a function for every array element' },
      { label: 'filter', kind: 'method', documentation: 'Creates a new array with all elements that pass the test implemented by the provided function' },
      { label: 'reduce', kind: 'method', documentation: 'Applies a function against an accumulator and each element in the array' },
      { label: 'forEach', kind: 'method', documentation: 'Executes a provided function once for each array element' },
      { label: 'find', kind: 'method', documentation: 'Returns the value of the first element in the array that satisfies the provided testing function' },
      { label: 'findIndex', kind: 'method', documentation: 'Returns the index of the first element in the array that satisfies the provided testing function' },
      { label: 'includes', kind: 'method', documentation: 'Determines whether an array includes a certain value' },
      { label: 'indexOf', kind: 'method', documentation: 'Returns the first index at which a given element can be found in the array' },
      { label: 'join', kind: 'method', documentation: 'Joins all elements of an array into a string' },
    ]);

    this.builtInObjects.set('Object', [
      { label: 'keys', kind: 'method', documentation: 'Returns an array of a given object\'s own property names' },
      { label: 'values', kind: 'method', documentation: 'Returns an array of a given object\'s own enumerable property values' },
      { label: 'entries', kind: 'method', documentation: 'Returns an array of a given object\'s own enumerable string-keyed property [key, value] pairs' },
      { label: 'assign', kind: 'method', documentation: 'Copies all enumerable own properties from one or more source objects to a target object' },
      { label: 'create', kind: 'method', documentation: 'Creates a new object with the specified prototype object and properties' },
      { label: 'freeze', kind: 'method', documentation: 'Freezes an object' },
      { label: 'seal', kind: 'method', documentation: 'Seals an object' },
      { label: 'hasOwnProperty', kind: 'method', documentation: 'Returns a boolean indicating whether the object has the specified property' },
    ]);

    this.builtInObjects.set('String', [
      { label: 'length', kind: 'property', documentation: 'The length of the string' },
      { label: 'toUpperCase', kind: 'method', documentation: 'Returns the string converted to upper case' },
      { label: 'toLowerCase', kind: 'method', documentation: 'Returns the string converted to lower case' },
      { label: 'trim', kind: 'method', documentation: 'Removes whitespace from both ends of a string' },
      { label: 'slice', kind: 'method', documentation: 'Extracts a section of a string and returns it as a new string' },
      { label: 'substring', kind: 'method', documentation: 'Returns the part of the string between the start and end indexes' },
      { label: 'replace', kind: 'method', documentation: 'Returns a new string with some or all matches of a pattern replaced by a replacement' },
      { label: 'split', kind: 'method', documentation: 'Splits a string into an array of substrings' },
      { label: 'charAt', kind: 'method', documentation: 'Returns the character at the specified index' },
      { label: 'charCodeAt', kind: 'method', documentation: 'Returns the Unicode of the character at the specified index' },
      { label: 'includes', kind: 'method', documentation: 'Determines whether one string may be found within another string' },
      { label: 'startsWith', kind: 'method', documentation: 'Determines whether a string begins with the characters of another string' },
      { label: 'endsWith', kind: 'method', documentation: 'Determines whether a string ends with the characters of another string' },
    ]);

    this.builtInObjects.set('Promise', [
      { label: 'constructor', kind: 'constructor', documentation: 'Creates a new Promise object' },
      { label: 'then', kind: 'method', documentation: 'Appends fulfillment and rejection handlers to the promise' },
      { label: 'catch', kind: 'method', documentation: 'Appends a rejection handler callback to the promise' },
      { label: 'finally', kind: 'method', documentation: 'Appends a handler to the promise' },
      { label: 'all', kind: 'method', documentation: 'Returns a single Promise that resolves when all of the promises in the iterable argument have resolved' },
      { label: 'race', kind: 'method', documentation: 'Returns a promise that fulfills or rejects as soon as one of the promises in an iterable fulfills or rejects' },
      { label: 'resolve', kind: 'method', documentation: 'Returns a Promise object that is resolved with a given value' },
      { label: 'reject', kind: 'method', documentation: 'Returns a Promise object that is rejected with a given reason' },
    ]);

    // ES6+ methods
    this.builtInObjects.set('Math', [
      { label: 'PI', kind: 'property', documentation: 'The ratio of the circumference of a circle to its diameter' },
      { label: 'E', kind: 'property', documentation: 'The base of natural logarithms' },
      { label: 'abs', kind: 'method', documentation: 'Returns the absolute value of a number' },
      { label: 'round', kind: 'method', documentation: 'Returns the value of a number rounded to the nearest integer' },
      { label: 'floor', kind: 'method', documentation: 'Returns the largest integer less than or equal to a given number' },
      { label: 'ceil', kind: 'method', documentation: 'Returns the smallest integer greater than or equal to a given number' },
      { label: 'random', kind: 'method', documentation: 'Returns a pseudo-random number between 0 and 1' },
      { label: 'sqrt', kind: 'method', documentation: 'Returns the square root of a number' },
      { label: 'pow', kind: 'method', documentation: 'Returns base to the exponent power' },
      { label: 'min', kind: 'method', documentation: 'Returns the smallest of zero or more numbers' },
      { label: 'max', kind: 'method', documentation: 'Returns the largest of zero or more numbers' },
    ]);
  }

  private async parseDocument(document: string): Promise<{ content: string; symbols: DocumentSymbol[] }> {
    const cached = this.fileCache.get(document);
    const now = Date.now();

    if (cached && now - cached.lastModified < 5000) {
      return cached;
    }

    try {
      const response = await fetch(document);
      const content = await response.text();

      const symbols = this.extractSymbols(content);

      const parsed = { content, symbols, lastModified: now };
      this.fileCache.set(document, parsed);

      return parsed;
    } catch (error) {
      console.error('Failed to parse document:', error);
      return { content: '', symbols: [], lastModified: now };
    }
  }

  private extractSymbols(content: string): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Function declarations
      const functionMatch = trimmed.match(/^(async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        symbols.push({
          name: functionMatch[2],
          kind: 12, // Function
          location: {
            uri: '',
            range: {
              start: { line: index, character: 0 },
              end: { line: index, character: line.length }
            }
          }
        });
      }

      // Variable declarations
      const varMatch = trimmed.match(/^(const|let|var)\s+(\w+)/);
      if (varMatch) {
        symbols.push({
          name: varMatch[2],
          kind: 13, // Variable
          location: {
            uri: '',
            range: {
              start: { line: index, character: 0 },
              end: { line: index, character: line.length }
            }
          }
        });
      }

      // Class declarations
      const classMatch = trimmed.match(/^class\s+(\w+)/);
      if (classMatch) {
        symbols.push({
          name: classMatch[1],
          kind: 5, // Class
          location: {
            uri: '',
            range: {
              start: { line: index, character: 0 },
              end: { line: index, character: line.length }
            }
          }
        });
      }

      // Method declarations (inside classes)
      const methodMatch = trimmed.match(/^(\s*)(async\s+)?(\w+)\s*\(/);
      if (methodMatch && !functionMatch) {
        symbols.push({
          name: methodMatch[3],
          kind: 6, // Method
          location: {
            uri: '',
            range: {
              start: { line: index, character: methodMatch[1].length },
              end: { line: index, character: line.length }
            }
          }
        });
      }
    });

    return symbols;
  }

  async provideCompletionItems(
    document: string,
    position: { line: number; character: number },
    context?: CompletionContext
  ): Promise<CompletionItem[]> {
    const completions: CompletionItem[] = [];

    try {
      const { content, symbols } = await this.parseDocument(document);
      const lines = content.split('\n');
      const currentLine = lines[position.line] || '';
      const textBeforeCursor = currentLine.substring(0, position.character);

      // Get the word being typed
      const wordMatch = textBeforeCursor.match(/(\w+)$/);
      const currentWord = wordMatch ? wordMatch[1] : '';

      // Member access completion (obj.prop or obj.method)
      const memberAccessMatch = textBeforeCursor.match(/(\w+)\.(\w*)$/);
      if (memberAccessMatch) {
        const objectName = memberAccessMatch[1];
        const memberPrefix = memberAccessMatch[2];

        const builtInMembers = this.builtInObjects.get(objectName) || [];

        builtInMembers.forEach(member => {
          if (member.label.toLowerCase().startsWith(memberPrefix.toLowerCase())) {
            completions.push({
              label: member.label,
              kind: this.getCompletionItemKind(member.kind),
              detail: member.detail,
              documentation: member.documentation ? { kind: 'plaintext', value: member.documentation } : undefined,
              insertText: member.label,
              filterText: member.label,
              sortText: '0',
            });
          }
        });

        // Check for object properties from the document
        const objectSymbols = symbols.filter(symbol =>
          symbol.name === objectName && symbol.kind === 13 // Variable
        );

        // For now, just provide basic completions for local objects
        if (objectSymbols.length > 0) {
          const localProperties = [
            'length', 'toString', 'valueOf', 'constructor'
          ];

          localProperties.forEach(prop => {
            if (prop.toLowerCase().startsWith(memberPrefix.toLowerCase())) {
              completions.push({
                label: prop,
                kind: 10, // Property
                detail: `Property of ${objectName}`,
                insertText: prop,
                sortText: '1',
              });
            }
          });
        }
      } else {
        // Regular completion
        if (currentWord.length > 0) {
          // Keywords
          this.keywords.forEach(keyword => {
            if (keyword.toLowerCase().startsWith(currentWord.toLowerCase())) {
              completions.push({
                label: keyword,
                kind: 14, // Keyword
                documentation: { kind: 'plaintext', value: `JavaScript keyword: ${keyword}` },
                insertText: keyword,
                sortText: '0',
              });
            }
          });

          // Built-in objects
          this.builtInObjects.forEach((members, objectName) => {
            if (objectName.toLowerCase().startsWith(currentWord.toLowerCase())) {
              completions.push({
                label: objectName,
                kind: 5, // Class
                detail: `Built-in ${objectName} object`,
                insertText: objectName,
                sortText: '1',
              });
            }
          });

          // Document symbols
          symbols.forEach(symbol => {
            if (symbol.name.toLowerCase().startsWith(currentWord.toLowerCase())) {
              completions.push({
                label: symbol.name,
                kind: symbol.kind,
                detail: `Local ${this.getSymbolKindName(symbol.kind)}`,
                insertText: symbol.name,
                sortText: '2',
              });
            }
          });

          // Snippets
          const snippets = [
            { prefix: 'for', label: 'for loop', body: 'for (let i = 0; i < array.length; i++) {\n  $0\n}' },
            { prefix: 'forof', label: 'for...of loop', body: 'for (const item of iterable) {\n  $0\n}' },
            { prefix: 'foreach', label: 'forEach loop', body: 'array.forEach((item, index) => {\n  $0\n});' },
            { prefix: 'if', label: 'if statement', body: 'if (condition) {\n  $0\n}' },
            { prefix: 'ifelse', label: 'if-else statement', body: 'if (condition) {\n  $0\n} else {\n  \n}' },
            { prefix: 'try', label: 'try-catch', body: 'try {\n  $0\n} catch (error) {\n  \n}' },
            { prefix: 'function', label: 'function declaration', body: 'function $1() {\n  $0\n}' },
            { prefix: 'arrow', label: 'arrow function', body: 'const $1 = ($2) => {\n  $0\n};' },
            { prefix: 'class', label: 'class declaration', body: 'class $1 {\n  constructor() {\n    $0\n  }\n}' },
            { prefix: 'import', label: 'import statement', body: 'import $1 from "$2";' },
            { prefix: 'require', label: 'require statement', body: 'const $1 = require("$2");' },
            { prefix: 'export', label: 'export statement', body: 'export default $1;' },
            { prefix: 'const', label: 'const declaration', body: 'const $1 = $0;' },
            { prefix: 'let', label: 'let declaration', body: 'let $1 = $0;' },
            { prefix: 'console', label: 'console.log', body: 'console.log($0);' },
          ];

          snippets.forEach(snippet => {
            if (snippet.prefix.startsWith(currentWord)) {
              completions.push({
                label: snippet.label,
                kind: 15, // Snippet
                detail: `Snippet: ${snippet.prefix}`,
                documentation: { kind: 'plaintext', value: `Code snippet for ${snippet.label}` },
                insertText: snippet.body,
                insertTextFormat: 2, // Snippet
                sortText: '3',
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error providing completions:', error);
    }

    return completions;
  }

  async provideHover(
    document: string,
    position: { line: number; character: number }
  ): Promise<Hover | null> {
    try {
      const { content, symbols } = await this.parseDocument(document);
      const lines = content.split('\n');
      const currentLine = lines[position.line] || '';

      // Find word at position
      const wordMatch = currentLine.match(/\w+/g);
      if (!wordMatch) return null;

      let wordAtPosition = '';
      let charIndex = 0;

      for (const word of wordMatch) {
        const wordStart = currentLine.indexOf(word, charIndex);
        const wordEnd = wordStart + word.length;

        if (position.character >= wordStart && position.character <= wordEnd) {
          wordAtPosition = word;
          break;
        }

        charIndex = wordEnd;
      }

      if (!wordAtPosition) return null;

      // Check built-in objects
      const builtInMembers = this.builtInObjects.get(wordAtPosition);
      if (builtInMembers) {
        return {
          contents: {
            kind: 'markdown',
            value: `## ${wordAtPosition}\n\nBuilt-in JavaScript object.\n\n**Methods and properties:**\n${builtInMembers.map(m => `- \`${m.label}\`: ${m.documentation || ''}`).join('\n')}`
          },
          range: {
            start: position,
            end: { line: position.line, character: position.character + wordAtPosition.length }
          }
        };
      }

      // Check for built-in object members
      const memberAccessMatch = currentLine.match(/(\w+)\.(\w+)/);
      if (memberAccessMatch) {
        const objectName = memberAccessMatch[1];
        const memberName = memberAccessMatch[2];

        if (memberName === wordAtPosition) {
          const members = this.builtInObjects.get(objectName) || [];
          const member = members.find(m => m.label === memberName);

          if (member) {
            return {
              contents: {
                kind: 'markdown',
                value: `## ${objectName}.${memberName}\n\n${member.documentation || `Built-in ${member.kind} of ${objectName}`}`
              },
              range: {
                start: position,
                end: { line: position.line, character: position.character + memberName.length }
              }
            };
          }
        }
      }

      // Check document symbols
      const symbol = symbols.find(s => s.name === wordAtPosition);
      if (symbol) {
        const kindName = this.getSymbolKindName(symbol.kind);
        return {
          contents: {
            kind: 'markdown',
            value: `## ${wordAtPosition}\n\n${kindName} defined in this file at line ${symbol.location.range.start.line + 1}`
          },
          range: {
            start: position,
            end: { line: position.line, character: position.character + wordAtPosition.length }
          }
        };
      }

    } catch (error) {
      console.error('Error providing hover:', error);
    }

    return null;
  }

  async provideSignatureHelp(
    document: string,
    position: { line: number; character: number }
  ): Promise<SignatureHelp | null> {
    // Basic signature help implementation
    // In a real implementation, this would parse function signatures and parameters
    return null;
  }

  async provideDefinition(
    document: string,
    position: { line: number; character: number }
  ): Promise<Definition | null> {
    try {
      const { symbols } = await this.parseDocument(document);
      const lines = (await this.parseDocument(document)).content.split('\n');
      const currentLine = lines[position.line] || '';

      // Find word at position
      const wordMatch = currentLine.match(/\w+/g);
      if (!wordMatch) return null;

      let wordAtPosition = '';
      let charIndex = 0;

      for (const word of wordMatch) {
        const wordStart = currentLine.indexOf(word, charIndex);
        const wordEnd = wordStart + word.length;

        if (position.character >= wordStart && position.character <= wordEnd) {
          wordAtPosition = word;
          break;
        }

        charIndex = wordEnd;
      }

      if (!wordAtPosition) return null;

      // Find symbol definition
      const symbol = symbols.find(s => s.name === wordAtPosition);
      if (symbol) {
        return {
          uri: document,
          range: symbol.location.range
        };
      }

    } catch (error) {
      console.error('Error providing definition:', error);
    }

    return null;
  }

  async provideReferences(
    document: string,
    position: { line: number; character: number }
  ): Promise<Reference[]> {
    // Basic references implementation
    // In a real implementation, this would search through all open files
    return [];
  }

  async provideDocumentSymbols(document: string): Promise<DocumentSymbol[]> {
    try {
      const { symbols } = await this.parseDocument(document);
      return symbols;
    } catch (error) {
      console.error('Error providing document symbols:', error);
      return [];
    }
  }

  async provideCodeActions(
    document: string,
    range: { start: { line: number; character: number }; end: { line: number; character: number } }
  ): Promise<CodeAction[]> {
    // Basic code actions implementation
    // In a real implementation, this would provide quick fixes and refactoring
    return [];
  }

  async provideDiagnostics(document: string): Promise<Diagnostic[]> {
    // Basic diagnostics implementation
    // In a real implementation, this would use ESLint or TypeScript compiler
    const diagnostics: Diagnostic[] = [];

    try {
      const { content } = await this.parseDocument(document);
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for common syntax errors
        if (line.match(/const\s+\w+\s*=\s*[^;]*$/)) {
          diagnostics.push({
            range: {
              start: { line: index, character: line.length },
              end: { line: index, character: line.length }
            },
            severity: 2, // Warning
            code: 'missing-semicolon',
            message: 'Missing semicolon',
            source: 'javascript'
          });
        }

        // Check for undefined variables (basic check)
        const varMatches = line.match(/\b(\w+)\b/g);
        if (varMatches) {
          varMatches.forEach(variable => {
            if (!this.keywords.includes(variable) &&
                !this.builtInObjects.has(variable) &&
                variable.match(/^[A-Z]/) &&
                !line.includes('const ') && !line.includes('let ') && !line.includes('var ') &&
                !line.includes('function ') && !line.includes('class ')) {
              diagnostics.push({
                range: {
                  start: { line: index, character: line.indexOf(variable) },
                  end: { line: index, character: line.indexOf(variable) + variable.length }
                },
                severity: 1, // Error
                code: 'undefined-variable',
                message: `'${variable}' is not defined`,
                source: 'javascript'
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Error providing diagnostics:', error);
    }

    return diagnostics;
  }

  async provideWorkspaceSymbols(query: string): Promise<WorkspaceSymbol[]> {
    // Basic workspace symbols implementation
    // In a real implementation, this would search through all workspace files
    return [];
  }

  private getCompletionItemKind(kind: string): number {
    const kindMap: Record<string, number> = {
      'method': 2,
      'function': 3,
      'constructor': 4,
      'field': 5,
      'variable': 6,
      'class': 7,
      'interface': 8,
      'module': 9,
      'property': 10,
      'unit': 11,
      'value': 12,
      'enum': 13,
      'keyword': 14,
      'snippet': 15,
      'text': 1,
      'color': 16,
      'file': 17,
      'reference': 18,
      'folder': 19,
      'typeParameter': 20,
      'user': 21,
    };

    return kindMap[kind] || 1;
  }

  private getSymbolKindName(kind: number): string {
    const kindNames: Record<number, string> = {
      1: 'File',
      2: 'Module',
      3: 'Namespace',
      4: 'Package',
      5: 'Class',
      6: 'Method',
      7: 'Property',
      8: 'Field',
      9: 'Constructor',
      10: 'Enum',
      11: 'Interface',
      12: 'Function',
      13: 'Variable',
      14: 'Constant',
      15: 'String',
      16: 'Number',
      17: 'Boolean',
      18: 'Array',
      19: 'Object',
      20: 'Key',
      21: 'Null',
      22: 'Enum Member',
      23: 'Struct',
      24: 'Event',
      25: 'Operator',
      26: 'Type Parameter',
    };

    return kindNames[kind] || 'Unknown';
  }
}

export class IntelliSenseRegistry {
  private providers = new Map<string, IntelliSenseProvider>();

  register(provider: IntelliSenseProvider): void {
    this.providers.set(provider.id, provider);
  }

  unregister(id: string): void {
    const provider = this.providers.get(id);
    if (provider) {
      provider.deactivate();
      this.providers.delete(id);
    }
  }

  getProvider(id: string): IntelliSenseProvider | undefined {
    return this.providers.get(id);
  }

  getProvidersForLanguage(language: string): IntelliSenseProvider[] {
    return Array.from(this.providers.values()).filter(provider =>
      provider.enabled && provider.languages.includes(language)
    );
  }

  getAllProviders(): IntelliSenseProvider[] {
    return Array.from(this.providers.values());
  }

  async activateAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.activate();
    }
  }

  async deactivateAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.deactivate();
    }
  }
}

// Global registry instance
export const intelliSenseRegistry = new IntelliSenseRegistry();

// Register built-in providers
intelliSenseRegistry.register(new JavaScriptIntelliSenseProvider());

// Export convenience functions
export function provideCompletionItems(
  document: string,
  position: { line: number; character: number },
  language: string,
  context?: CompletionContext
): Promise<CompletionItem[]> {
  const providers = intelliSenseRegistry.getProvidersForLanguage(language);
  const completions = Promise.all(
    providers.map(provider => provider.provideCompletionItems(document, position, context))
  );

  return completions.then(results => results.flat());
}

export function provideHover(
  document: string,
  position: { line: number; character: number },
  language: string
): Promise<Hover | null> {
  const providers = intelliSenseRegistry.getProvidersForLanguage(language);

  for (const provider of providers) {
    const result = await provider.provideHover(document, position);
    if (result) return result;
  }

  return null;
}

export function provideDiagnostics(document: string, language: string): Promise<Diagnostic[]> {
  const providers = intelliSenseRegistry.getProvidersForLanguage(language);
  const diagnostics = Promise.all(
    providers.map(provider => provider.provideDiagnostics(document))
  );

  return diagnostics.then(results => results.flat());
}