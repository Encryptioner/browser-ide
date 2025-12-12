import type { CodeSnippet, SnippetPlaceholder, SnippetSession } from '@/types';
import { nanoid } from 'nanoid';

export class SnippetManager {
  private snippets = new Map<string, CodeSnippet[]>();
  private sessions = new Map<string, SnippetSession>();
  private builtinSnippets: CodeSnippet[] = [];

  constructor() {
    this.initializeBuiltinSnippets();
  }

  private initializeBuiltinSnippets(): void {
    // JavaScript/TypeScript snippets
    this.builtinSnippets = [
      // Common statements
      {
        id: nanoid(),
        name: 'Console Log',
        prefix: 'log',
        body: ['console.log($0);'],
        description: 'Log output to console',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 100,
      },
      {
        id: nanoid(),
        name: 'Console Error',
        prefix: 'error',
        body: ['console.error($0);'],
        description: 'Log error to console',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 100,
      },
      {
        id: nanoid(),
        name: 'Console Warn',
        prefix: 'warn',
        body: ['console.warn($0);'],
        description: 'Log warning to console',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 100,
      },
      {
        id: nanoid(),
        name: 'Console Debug',
        prefix: 'debug',
        body: ['console.debug($0);'],
        description: 'Log debug to console',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 100,
      },

      // Control structures
      {
        id: nanoid(),
        name: 'For Loop',
        prefix: 'for',
        body: [
          'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {',
          '  ${3:// body}',
          '}'
        ],
        description: 'Create a for loop',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'For...of Loop',
        prefix: 'forof',
        body: [
          'for (const ${1:item} of ${2:iterable}) {',
          '  ${3:// body}',
          '}'
        ],
        description: 'Create a for...of loop',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'For...in Loop',
        prefix: 'forin',
        body: [
          'for (const ${1:key} in ${2:object}) {',
          '  ${3:// body}',
          '}'
        ],
        description: 'Create a for...in loop',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'While Loop',
        prefix: 'while',
        body: [
          'while (${1:condition}) {',
          '  ${2:// body}',
          '}'
        ],
        description: 'Create a while loop',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'Do...While Loop',
        prefix: 'dowhile',
        body: [
          'do {',
          '  ${1:// body}',
          '} while (${2:condition});'
        ],
        description: 'Create a do...while loop',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },

      // Conditional statements
      {
        id: nanoid(),
        name: 'If Statement',
        prefix: 'if',
        body: [
          'if (${1:condition}) {',
          '  ${2:// body}',
          '}'
        ],
        description: 'Create an if statement',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 95,
      },
      {
        id: nanoid(),
        name: 'If-Else Statement',
        prefix: 'ifelse',
        body: [
          'if (${1:condition}) {',
          '  ${2:// if body}',
          '} else {',
          '  ${3:// else body}',
          '}'
        ],
        description: 'Create an if-else statement',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 95,
      },
      {
        id: nanoid(),
        name: 'Switch Statement',
        prefix: 'switch',
        body: [
          'switch (${1:expression}) {',
          '  case ${2:value}:',
          '    ${3:// break body}',
          '    break;',
          '  default:',
          '    ${4:// default body}',
          '    break;',
          '}'
        ],
        description: 'Create a switch statement',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 80,
      },

      // Functions
      {
        id: nanoid(),
        name: 'Arrow Function',
        prefix: 'arrow',
        body: [
          'const ${1:functionName} = (${2:params}) => {',
          '  ${3:// body}',
          '};'
        ],
        description: 'Create an arrow function',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 95,
      },
      {
        id: nanoid(),
        name: 'Function Declaration',
        prefix: 'function',
        body: [
          'function ${1:functionName}(${2:params}) {',
          '  ${3:// body}',
          '}'
        ],
        description: 'Create a function declaration',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 95,
      },
      {
        id: nanoid(),
        name: 'Async Function',
        prefix: 'async',
        body: [
          'async function ${1:functionName}(${2:params}) {',
          '  ${3:// body}',
          '}'
        ],
        description: 'Create an async function',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'Async Arrow Function',
        prefix: 'asyncarrow',
        body: [
          'const ${1:functionName} = async (${2:params}) => {',
          '  ${3:// body}',
          '};'
        ],
        description: 'Create an async arrow function',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },

      // Array methods
      {
        id: nanoid(),
        name: 'Array Map',
        prefix: 'map',
        body: [
          '${1:array}.map((${2:item}) => {',
          '  return ${3:transformed};',
          '})'
        ],
        description: 'Map over an array',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },
      {
        id: nanoid(),
        name: 'Array Filter',
        prefix: 'filter',
        body: [
          '${1:array}.filter((${2:item}) => {',
          '  return ${3:condition};',
          '})'
        ],
        description: 'Filter an array',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },
      {
        id: nanoid(),
        name: 'Array Reduce',
        prefix: 'reduce',
        body: [
          '${1:array}.reduce((${2:acc}, ${3:item}) => {',
          '  return ${4:accumulator};',
          '}, ${5:initialValue})'
        ],
        description: 'Reduce an array',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },
      {
        id: nanoid(),
        name: 'Array ForEach',
        prefix: 'foreach',
        body: [
          '${1:array}.forEach((${2:item}) => {',
          '  ${3:// body}',
          '});'
        ],
        description: 'Loop over an array with forEach',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },
      {
        id: nanoid(),
        name: 'Array Find',
        prefix: 'find',
        body: [
          '${1:array}.find((${2:item}) => {',
          '  return ${3:condition};',
          '})'
        ],
        description: 'Find an item in an array',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },

      // Objects and Classes
      {
        id: nanoid(),
        name: 'Object Destructuring',
        prefix: 'destruct',
        body: ['const { ${1:property1}, ${2:property2} } = ${3:object};'],
        description: 'Destructure object properties',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 80,
      },
      {
        id: nanoid(),
        name: 'Class Declaration',
        prefix: 'class',
        body: [
          'class ${1:ClassName} {',
          '  constructor(${2:params}) {',
          '    ${3:// initialization}',
          '  }',
          '',
          '  ${4:// methods}',
          '}'
        ],
        description: 'Create a class',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 80,
      },
      {
        id: nanoid(),
        name: 'Class Method',
        prefix: 'method',
        body: [
          '${1:methodName}(${2:params}) {',
          '  ${3:// body}',
          '}'
        ],
        description: 'Create a class method',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },

      // Promises and Async
      {
        id: nanoid(),
        name: 'Try-Catch',
        prefix: 'try',
        body: [
          'try {',
          '  ${1:// try body}',
          '} catch (${2:error}) {',
          '  ${3:// catch body}',
          '}'
        ],
        description: 'Create a try-catch block',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'Promise Chain',
        prefix: 'promise',
        body: [
          'new Promise((resolve, reject) => {',
          '  ${1:// async operation}',
          '})',
          '  .then(${2:result} => {',
          '    ${3:// handle result}',
          '  })',
          '  .catch(${4:error} => {',
          '    ${5:// handle error}',
          '  });'
        ],
        description: 'Create a promise with then-catch',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 75,
      },
      {
        id: nanoid(),
        name: 'Async/Await',
        prefix: 'await',
        body: [
          'try {',
          '  const ${1:result} = await ${2:promise};',
          '  ${3:// use result}',
          '} catch (${4:error}) {',
          '  ${5:// handle error}',
          '}'
        ],
        description: 'Use async/await with try-catch',
        scope: 'javascript,typescript',
        isBuiltin: true,
        priority: 85,
      },

      // React snippets
      {
        id: nanoid(),
        name: 'React Component',
        prefix: 'rcomponent',
        body: [
          'import React from \'react\';',
          '',
          'interface ${1:ComponentName}Props {',
          '  ${2:// props}',
          '}',
          '',
          'export function ${1:ComponentName}({ ${3:props} }: ${1:ComponentName}Props) {',
          '  return (',
          '    <div>',
          '      ${4:// JSX}',
          '    </div>',
          '  );',
          '}',
          '',
          'export default ${1:ComponentName};'
        ],
        description: 'Create a React functional component',
        scope: 'typescriptreact,javascriptreact',
        isBuiltin: true,
        priority: 100,
      },
      {
        id: nanoid(),
        name: 'React Hook',
        prefix: 'rhook',
        body: [
          'function use${1:HookName}(${2:params}) {',
          '  const [${3:state}, set${3:state}] = React.useState(${4:initialValue});',
          '',
          '  ${5:// hook logic}',
          '',
          '  return ${6:returnValue};',
          '}',
          '',
          'export default use${1:HookName};'
        ],
        description: 'Create a custom React hook',
        scope: 'typescriptreact,javascriptreact',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'React useEffect',
        prefix: 'useffect',
        body: [
          'React.useEffect(() => {',
          '  ${1:// effect logic}',
          '',
          '  return () => {',
          '    ${2:// cleanup}',
          '  };',
          '}, [${3:dependencies}]);'
        ],
        description: 'React useEffect hook',
        scope: 'typescriptreact,javascriptreact',
        isBuiltin: true,
        priority: 95,
      },
      {
        id: nanoid(),
        name: 'React useState',
        prefix: 'usestate',
        body: ['const [${1:state}, set${1:state}] = React.useState(${2:initialValue});'],
        description: 'React useState hook',
        scope: 'typescriptreact,javascriptreact',
        isBuiltin: true,
        priority: 95,
      },

      // Node.js snippets
      {
        id: nanoid(),
        name: 'Require Module',
        prefix: 'require',
        body: ['const ${1:moduleName} = require(\'${2:module}\');'],
        description: 'Require a Node.js module',
        scope: 'javascript',
        isBuiltin: true,
        priority: 90,
      },
      {
        id: nanoid(),
        name: 'Module Export',
        prefix: 'module.exports',
        body: ['module.exports = ${1:value};'],
        description: 'Export from CommonJS module',
        scope: 'javascript',
        isBuiltin: true,
        priority: 85,
      },
      {
        id: nanoid(),
        name: 'Express Route',
        prefix: 'route',
        body: [
          'app.${1:get}(\'/${2:path}\', (${3:req}, ${4:res}) => {',
          '  ${5:// route handler}',
          '});'
        ],
        description: 'Create an Express route',
        scope: 'javascript',
        isBuiltin: true,
        priority: 80,
      },
    ];

    // Register built-in snippets
    this.registerSnippets(this.builtinSnippets);
  }

  registerSnippet(snippet: CodeSnippet): void {
    if (!this.snippets.has(snippet.language || 'global')) {
      this.snippets.set(snippet.language || 'global', []);
    }

    const languageSnippets = this.snippets.get(snippet.language || 'global')!;
    languageSnippets.push(snippet);

    // Sort by priority and prefix
    languageSnippets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return a.prefix.localeCompare(b.prefix);
    });
  }

  registerSnippets(snippets: CodeSnippet[]): void {
    snippets.forEach(snippet => this.registerSnippet(snippet));
  }

  getSnippets(language?: string): CodeSnippet[] {
    const allSnippets: CodeSnippet[] = [];

    // Get global snippets
    const globalSnippets = this.snippets.get('global') || [];
    allSnippets.push(...globalSnippets);

    // Get language-specific snippets
    if (language) {
      const languageSnippets = this.snippets.get(language) || [];
      allSnippets.push(...languageSnippets);
    }

    return allSnippets;
  }

  searchSnippets(query: string, language?: string): CodeSnippet[] {
    const allSnippets = this.getSnippets(language);
    const lowerQuery = query.toLowerCase();

    return allSnippets.filter(snippet => {
      // Check prefix match
      if (snippet.prefix.toLowerCase().startsWith(lowerQuery)) {
        return true;
      }

      // Check name match
      if (snippet.name.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      // Check description match
      if (snippet.description?.toLowerCase().includes(lowerQuery)) {
        return true;
      }

      return false;
    });
  }

  removeSnippet(snippetId: string): boolean {
    for (const [language, snippets] of this.snippets.entries()) {
      const index = snippets.findIndex(snippet => snippet.id === snippetId);
      if (index !== -1) {
        snippets.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  updateSnippet(snippetId: string, updates: Partial<CodeSnippet>): boolean {
    for (const [language, snippets] of this.snippets.entries()) {
      const snippet = snippets.find(s => s.id === snippetId);
      if (snippet) {
        Object.assign(snippet, updates);

        // Re-sort snippets
        snippets.sort((a, b) => {
          if (a.priority !== b.priority) {
            return (b.priority || 0) - (a.priority || 0);
          }
          return a.prefix.localeCompare(b.prefix);
        });

        return true;
      }
    }
    return false;
  }

  createSession(editorId: string, snippet: CodeSnippet): SnippetSession {
    const session: SnippetSession = {
      id: nanoid(),
      snippet,
      placeholders: this.extractPlaceholders(snippet.body),
      activePlaceholder: 0,
      isActive: true,
      editorId,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string): SnippetSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId: string, updates: Partial<SnippetSession>): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      return true;
    }
    return false;
  }

  finishSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getActiveSession(editorId: string): SnippetSession | undefined {
    return Array.from(this.sessions.values()).find(
      session => session.isActive && session.editorId === editorId
    );
  }

  private extractPlaceholders(body: string[]): SnippetPlaceholder[] {
    const placeholders: SnippetPlaceholder[] = [];
    const placeholderRegex = /\$(\d+)(?::([^$]*))?\$/g;
    let match;
    let index = 0;

    for (const line of body) {
      while ((match = placeholderRegex.exec(line)) !== null) {
        const placeholderNumber = parseInt(match[1]);
        const transform = match[2];
        const choices = transform?.match(/([^|]+)/g);
        const defaultChoice = choices?.[0];

        placeholders.push({
          index: placeholderNumber,
          text: `$${placeholderNumber}`,
          transform: transform,
          choices: choices || [],
          default: defaultChoice,
        });
      }
    }

    return placeholders;
  }

  processSnippetBody(body: string[], session: SnippetSession): string {
    let result = body.join('\n');

    // Replace placeholders with their current values
    session.placeholders.forEach(placeholder => {
      const placeholderText = session.activePlaceholder === placeholder.index ?
        `\${${placeholder.index}:${placeholder.text}}` : placeholder.text;

      result = result.replace(new RegExp(`\\$${placeholder.index}`, 'g'), placeholderText);
    });

    return result;
  }

  nextPlaceholder(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.placeholders.length === 0) {
      return false;
    }

    const nextIndex = session.activePlaceholder + 1;
    if (nextIndex >= session.placeholders.length) {
      session.isActive = false;
      return false;
    }

    session.activePlaceholder = nextIndex;
    return true;
  }

  previousPlaceholder(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.placeholders.length === 0) {
      return false;
    }

    const prevIndex = session.activePlaceholder - 1;
    if (prevIndex < 0) {
      return false;
    }

    session.activePlaceholder = prevIndex;
    return true;
  }

  getCurrentPlaceholder(sessionId: string): SnippetPlaceholder | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive || session.placeholders.length === 0) {
      return undefined;
    }

    return session.placeholders[session.activePlaceholder];
  }

  // Import/Export functionality
  exportSnippets(): string {
    const exportData = {
      version: '1.0.0',
      snippets: Array.from(this.snippets.values()).flat(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  importSnippets(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const data = JSON.parse(jsonData);

      if (!data.snippets || !Array.isArray(data.snippets)) {
        errors.push('Invalid snippet format: missing snippets array');
        return { success: false, imported: 0, errors };
      }

      for (const snippetData of data.snippets) {
        try {
          const snippet: CodeSnippet = {
            id: snippetData.id || nanoid(),
            name: snippetData.name,
            prefix: snippetData.prefix,
            body: Array.isArray(snippetData.body) ? snippetData.body : [snippetData.body],
            description: snippetData.description,
            scope: snippetData.scope,
            author: snippetData.author,
            language: snippetData.language,
            priority: snippetData.priority || 50,
            isBuiltin: false,
          };

          this.registerSnippet(snippet);
          imported++;
        } catch (error) {
          errors.push(`Error importing snippet "${snippetData.name}": ${error}`);
        }
      }

      return { success: imported > 0, imported, errors };
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error}`);
      return { success: false, imported: 0, errors };
    }
  }

  // User snippet management
  createUserSnippet(snippet: Omit<CodeSnippet, 'id' | 'isBuiltin'>): CodeSnippet {
    const newSnippet: CodeSnippet = {
      ...snippet,
      id: nanoid(),
      isBuiltin: false,
      priority: snippet.priority || 50,
    };

    this.registerSnippet(newSnippet);
    return newSnippet;
  }

  getUserSnippets(language?: string): CodeSnippet[] {
    const allSnippets = this.getSnippets(language);
    return allSnippets.filter(snippet => !snippet.isBuiltin);
  }

  deleteSnippet(snippetId: string): boolean {
    // Can't delete built-in snippets
    const snippet = this.findSnippet(snippetId);
    if (snippet?.isBuiltin) {
      return false;
    }

    return this.removeSnippet(snippetId);
  }

  private findSnippet(snippetId: string): CodeSnippet | undefined {
    for (const snippets of this.snippets.values()) {
      const snippet = snippets.find(s => s.id === snippetId);
      if (snippet) return snippet;
    }
    return undefined;
  }
}

// Global instance
export const snippetManager = new SnippetManager();

// Convenience functions
export function getSnippets(language?: string): CodeSnippet[] {
  return snippetManager.getSnippets(language);
}

export function searchSnippets(query: string, language?: string): CodeSnippet[] {
  return snippetManager.searchSnippets(query, language);
}

export function createSnippet(editorId: string, snippet: CodeSnippet): SnippetSession {
  return snippetManager.createSession(editorId, snippet);
}

export function processSnippet(sessionId: string): string {
  const session = snippetManager.getSession(sessionId);
  if (!session) return '';

  return snippetManager.processSnippetBody(session.snippet.body, session);
}

export function nextPlaceholder(sessionId: string): boolean {
  return snippetManager.nextPlaceholder(sessionId);
}

export function previousPlaceholder(sessionId: string): boolean {
  return snippetManager.previousPlaceholder(sessionId);
}

export function getCurrentPlaceholder(sessionId: string): SnippetPlaceholder | undefined {
  return snippetManager.getCurrentPlaceholder(sessionId);
}

export function finishSnippetSession(sessionId: string): void {
  snippetManager.finishSession(sessionId);
}