import type { editor } from 'monaco-editor';

interface LintDiagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  source: string;
  code?: string;
}

interface LintResult {
  file: string;
  diagnostics: LintDiagnostic[];
}

interface LintProvider {
  name: string;
  languages: string[];
  lint: (content: string, language: string) => LintDiagnostic[];
}

class BasicJSLinter implements LintProvider {
  name = 'JavaScript Linter';
  languages = ['javascript', 'typescript'];

  lint(content: string, language: string): LintDiagnostic[] {
    const diagnostics: LintDiagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Basic syntax checking
      this.checkUnbalancedBrackets(line, lineIndex + 1, diagnostics);
      this.checkUnmatchedParentheses(line, lineIndex + 1, diagnostics);
      this.checkMissingSemicolons(line, lineIndex + 1, diagnostics);
      this.checkUnusedVariables(line, lineIndex + 1, diagnostics);
      this.checkFormatting(line, lineIndex + 1, diagnostics);
    });

    return diagnostics;
  }

  private checkUnbalancedBrackets(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const openBrackets = (line.match(/[\{\[]]/g) || []).length;
    const closeBrackets = (line.match(/[\}\]]/g) || []).length;

    if (openBrackets !== closeBrackets) {
      const bracketType = openBrackets > closeBrackets ? 'opening' : 'closing';
      diagnostics.push({
        severity: 'error',
        message: `Unbalanced brackets - too many ${bracketType} brackets`,
        line: lineNumber,
        column: line.indexOf(bracketType === 'opening' ? '{' : '}') + 1,
        source: 'basic-js-linter'
      });
    }
  }

  private checkUnmatchedParentheses(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const openParens = (line.match(/\(/g) || []).length;
    const closeParens = (line.match(/\)/g) || []).length;

    if (openParens !== closeParens) {
      diagnostics.push({
        severity: 'error',
        message: 'Unmatched parentheses',
        line: lineNumber,
        column: line.indexOf('(') + 1,
        source: 'basic-js-linter'
      });
    }
  }

  private checkMissingSemicolons(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const trimmed = line.trim();

    // Skip if it's a control structure or empty line
    if (trimmed === '' ||
        trimmed.startsWith('if') ||
        trimmed.startsWith('for') ||
        trimmed.startsWith('while') ||
        trimmed.startsWith('function') ||
        trimmed.includes('//') ||
        trimmed.includes('{')) {
      return;
    }

    // Check if line ends with semicolon and not already commented
    if (trimmed.length > 0 &&
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('}') &&
        !trimmed.endsWith('{') &&
        !trimmed.includes('//')) {
      diagnostics.push({
        severity: 'warning',
        message: 'Missing semicolon',
        line: lineNumber,
        column: trimmed.length,
        source: 'basic-js-linter'
      });
    }
  }

  private checkUnusedVariables(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    // Simple unused variable detection
    const varPattern = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    const vars = [];
    let match;

    while ((match = varPattern.exec(line)) !== null) {
      vars.push(match[1]);
    }

    // Check if variables are used elsewhere (simplified)
    vars.forEach(varName => {
      const isUsed = line.includes(`${varName} =`) || line.includes(`${varName}.`);
      if (!isUsed) {
        diagnostics.push({
          severity: 'warning',
          message: `Variable '${varName}' is declared but never used`,
          line: lineNumber,
          column: line.indexOf(varName) + 1,
          source: 'basic-js-linter'
        });
      }
    });
  }

  private checkFormatting(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    // Check for multiple spaces
    if (line.includes('  ')) {
      diagnostics.push({
        severity: 'info',
        message: 'Multiple spaces detected, consider using tabs or single spaces',
        line: lineNumber,
        column: line.indexOf('  ') + 1,
        source: 'basic-js-linter'
      });
    }

    // Check for trailing whitespace
    if (line.trim().length !== line.length) {
      diagnostics.push({
        severity: 'info',
        message: 'Trailing whitespace',
        line: lineNumber,
        column: line.length,
        source: 'basic-js-linter'
      });
    }
  }
}

class BasicHTMLLinter implements LintProvider {
  name = 'HTML Linter';
  languages = ['html', 'htm'];

  lint(content: string, language: string): LintDiagnostic[] {
    const diagnostics: LintDiagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      this.checkUnclosedTags(line, lineIndex + 1, diagnostics);
      this.checkInvalidAttributes(line, lineIndex + 1, diagnostics);
    });

    return diagnostics;
  }

  private checkUnclosedTags(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const openTags = line.match(/<[^\/][^>]*>/g) || [];
    const closeTags = line.match(/<\/[^>]*>/g) || [];

    // Simple check - might have false positives
    openTags.forEach((openTag, index) => {
      const tagName = openTag.match(/<(\w+)/)?.[1];
      if (tagName) {
        const hasClosingTag = closeTags.some(closeTag => closeTag.includes(`/${tagName}`));
        if (!hasClosingTag && !openTag.includes('/>')) {
          diagnostics.push({
            severity: 'error',
            message: `Unclosed tag: <${tagName}>`,
            line: lineNumber,
            column: line.indexOf(openTag) + 1,
            source: 'basic-html-linter'
          });
        }
      }
    });
  }

  private checkInvalidAttributes(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const attrPattern = /(\w+)=["']([^"']*)["']/g;
    let match;

    while ((match = attrPattern.exec(line)) !== null) {
      const attrValue = match[2];
      if (attrValue === '') {
        diagnostics.push({
          severity: 'warning',
          message: `Empty attribute value for '${match[1]}'`,
          line: lineNumber,
          column: line.indexOf(match[0]) + 1,
          source: 'basic-html-linter'
        });
      }
    }
  }
}

class BasicCSSLinter implements LintProvider {
  name = 'CSS Linter';
  languages = ['css', 'scss', 'less'];

  lint(content: string, language: string): LintDiagnostic[] {
    const diagnostics: LintDiagnostic[] = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      this.checkInvalidProperties(line, lineIndex + 1, diagnostics);
      this.checkMissingColons(line, lineIndex + 1, diagnostics);
    });

    return diagnostics;
  }

  private checkInvalidProperties(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const propertyPattern = /\s*([a-zA-Z-]+)\s*:/;
    const match = line.match(propertyPattern);

    if (match) {
      const property = match[1];
      const validProperties = [
        'color', 'background-color', 'font-size', 'margin', 'padding',
        'border', 'display', 'position', 'width', 'height', 'z-index'
      ];

      if (!validProperties.includes(property)) {
        diagnostics.push({
          severity: 'warning',
          message: `Unknown CSS property: '${property}'`,
          line: lineNumber,
          column: line.indexOf(property) + 1,
          source: 'basic-css-linter'
        });
      }
    }
  }

  private checkMissingColons(line: string, lineNumber: number, diagnostics: LintDiagnostic[]) {
    const hasProperty = /\w+\s*[^:]/.test(line) && !line.includes('//');

    if (hasProperty) {
      diagnostics.push({
        severity: 'error',
        message: 'Expected colon in CSS property',
        line: lineNumber,
        column: line.length,
        source: 'basic-css-linter'
      });
    }
  }
}

class LinterService {
  private providers: LintProvider[] = [];
  private markers: Map<string, string[]> = new Map();

  constructor() {
    this.registerProvider(new BasicJSLinter());
    this.registerProvider(new BasicHTMLLinter());
    this.registerProvider(new BasicCSSLinter());
  }

  registerProvider(provider: LintProvider) {
    this.providers.push(provider);
  }

  async lintFile(content: string, language: string, filename: string): Promise<LintResult> {
    const diagnostics: LintDiagnostic[] = [];

    for (const provider of this.providers) {
      if (provider.languages.includes(language)) {
        try {
          const providerDiagnostics = provider.lint(content, language);
          diagnostics.push(...providerDiagnostics);
        } catch (error) {
          console.warn(`Linter provider ${provider.name} failed:`, error);
        }
      }
    }

    return {
      file: filename,
      diagnostics: diagnostics.sort((a, b) => {
        const severityOrder = { 'error': 0, 'warning': 1, 'info': 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
    };
  }

  convertToMonacoDiagnostics(lintResult: LintResult, monaco: typeof editor): editor.IMarkerData[] {
    return lintResult.diagnostics.map(diagnostic => ({
      severity: diagnostic.severity === 'error' ?
        monaco.MarkerSeverity.Error :
        diagnostic.severity === 'warning' ?
        monaco.MarkerSeverity.Warning :
        monaco.MarkerSeverity.Info,
      message: diagnostic.message,
      startLineNumber: diagnostic.line,
      startColumn: diagnostic.column,
      endLineNumber: diagnostic.line,
      endColumn: diagnostic.column + 10, // Highlight some context
      source: diagnostic.source,
      code: diagnostic.code
    }));
  }

  clearMarkers(filename: string, monaco: typeof editor) {
    const model = monaco.editor.getModels().find(m => m.getValue().includes(filename));
    if (model) {
      monaco.editor.setModelMarkers(model, []);
    }
    this.markers.delete(filename);
  }

  async updateMarkers(
    filename: string,
    content: string,
    language: string,
    monaco: typeof editor
  ): Promise<void> {
    // Clear existing markers
    this.clearMarkers(filename, monaco);

    if (!content.trim()) return;

    try {
      const lintResult = await this.lintFile(content, language, filename);
      const monacoDiagnostics = this.convertToMonacoDiagnostics(lintResult, monaco);

      const model = monaco.editor.getModels().find(m => m.getValue().includes(filename));
      if (model) {
        monaco.editor.setModelMarkers(model, monacoDiagnostics);
      }

      this.markers.set(filename, lintResult.diagnostics.map(d => d.message));
    } catch (error) {
      console.error('Failed to update linting markers:', error);
    }
  }

  getProblemsSummary(): { errors: number; warnings: number; info: number } {
    let errors = 0, warnings = 0, info = 0;

    for (const [, markers] of this.markers.entries()) {
      markers.forEach(marker => {
        // This is simplified - in real implementation, we'd track severity
        if (marker.toLowerCase().includes('error')) errors++;
        else if (marker.toLowerCase().includes('warning')) warnings++;
        else info++;
      });
    }

    return { errors, warnings, info };
  }

  getAllProblems(): Map<string, LintDiagnostic[]> {
    return new Map(this.markers.entries());
  }
}

export const linterService = new LinterService();
export type { LintDiagnostic, LintResult, LintProvider };