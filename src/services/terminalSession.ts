/**
 * Terminal Session Management Service
 *
 * Handles:
 * - Terminal session persistence across page refreshes
 * - Command history with reverse search (Ctrl+R)
 * - Tab completion for commands and paths
 * - Environment variable management
 * - Background process tracking
 */

import { fileSystem } from './filesystem';

export interface TerminalSession {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  workingDirectory: string;
  commandHistory: string[];
  environmentVariables: Record<string, string>;
  backgroundProcesses: BackgroundProcess[];
  output: string[];
}

export interface BackgroundProcess {
  id: string;
  command: string;
  args: string[];
  pid?: number;
  startedAt: number;
  status: 'running' | 'stopped' | 'completed';
  exitCode?: number;
}

export interface CommandMatch {
  command: string;
  description?: string;
  type: 'builtin' | 'path' | 'alias';
}

class TerminalSessionService {
  private sessions: Map<string, TerminalSession> = new Map();
  private currentSessionId: string | null = null;

  // Built-in commands for tab completion
  private builtinCommands: Record<string, string> = {
    // File System
    'ls': 'List directory contents',
    'pwd': 'Print working directory',
    'cd': 'Change directory',
    'mkdir': 'Create directory',
    'rm': 'Remove files/directories',
    'mv': 'Move/rename files',
    'cp': 'Copy files',
    'cat': 'Display file contents',
    'touch': 'Create empty file',
    'nano': 'Text editor',
    'vi': 'Vi editor',
    'vim': 'Vim editor',
    'echo': 'Print text',

    // Git
    'git': 'Version control system',

    // Claude
    'claude': 'AI coding assistant',

    // Utilities
    'clear': 'Clear terminal screen',
    'help': 'Show available commands',
    'which': 'Locate command',
    'env': 'Display environment variables',
    'export': 'Set environment variable',
    'history': 'Show command history',

    // WebContainer
    'node': 'Node.js runtime',
    'npm': 'Node package manager',
    'pnpm': 'Fast package manager',
    'yarn': 'Package manager',
  };

  constructor() {
    this.loadSessions();
  }

  /**
   * Create a new terminal session
   */
  createSession(): TerminalSession {
    const session: TerminalSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      workingDirectory: '/',
      commandHistory: [],
      environmentVariables: {
        HOME: '/',
        PWD: '/',
        USER: 'user',
        SHELL: '/bin/bash',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        LANG: 'en_US.UTF-8',
        TERM: 'xterm-256color',
      },
      backgroundProcesses: [],
      output: [],
    };

    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    this.saveSessions();

    return session;
  }

  /**
   * Get current session or create one
   */
  getCurrentSession(): TerminalSession {
    if (this.currentSessionId && this.sessions.has(this.currentSessionId)) {
      return this.sessions.get(this.currentSessionId)!;
    }

    return this.createSession();
  }

  /**
   * Update session
   */
  updateSession(sessionId: string, updates: Partial<TerminalSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates, { lastActiveAt: Date.now() });
      this.saveSessions();
    }
  }

  /**
   * Add command to history
   */
  addToHistory(sessionId: string, command: string): void {
    const session = this.sessions.get(sessionId);
    if (session && command.trim()) {
      // Don't add duplicate consecutive commands
      if (session.commandHistory[session.commandHistory.length - 1] !== command) {
        session.commandHistory.push(command);

        // Limit history size
        if (session.commandHistory.length > 1000) {
          session.commandHistory.shift();
        }

        this.saveSessions();
      }
    }
  }

  /**
   * Search command history (for Ctrl+R)
   */
  searchHistory(sessionId: string, query: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session || !query) return [];

    const matches: string[] = [];
    const seen = new Set<string>();

    // Search backwards through history
    for (let i = session.commandHistory.length - 1; i >= 0; i--) {
      const cmd = session.commandHistory[i];
      if (cmd.includes(query) && !seen.has(cmd)) {
        matches.push(cmd);
        seen.add(cmd);

        if (matches.length >= 10) break; // Limit to 10 matches
      }
    }

    return matches;
  }

  /**
   * Get environment variable
   */
  getEnv(sessionId: string, key: string): string | undefined {
    const session = this.sessions.get(sessionId);
    return session?.environmentVariables[key];
  }

  /**
   * Set environment variable
   */
  setEnv(sessionId: string, key: string, value: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.environmentVariables[key] = value;

      // Update PWD when changing directory
      if (key === 'PWD') {
        session.workingDirectory = value;
      }

      this.saveSessions();
    }
  }

  /**
   * Get all environment variables
   */
  getAllEnv(sessionId: string): Record<string, string> {
    const session = this.sessions.get(sessionId);
    return session?.environmentVariables || {};
  }

  /**
   * Tab completion
   */
  async getCompletions(sessionId: string, partialCommand: string): Promise<CommandMatch[]> {
    const matches: CommandMatch[] = [];
    const parts = partialCommand.trim().split(/\s+/);

    if (parts.length === 1) {
      // Complete command name
      const partial = parts[0].toLowerCase();

      for (const [cmd, desc] of Object.entries(this.builtinCommands)) {
        if (cmd.startsWith(partial)) {
          matches.push({ command: cmd, description: desc, type: 'builtin' });
        }
      }
    } else {
      // Complete file/directory path
      const partial = parts[parts.length - 1];
      const pathMatches = await this.getPathCompletions(sessionId, partial);
      matches.push(...pathMatches);
    }

    return matches.slice(0, 20); // Limit to 20 matches
  }

  /**
   * Get path completions for file/directory names
   */
  private async getPathCompletions(sessionId: string, partialPath: string): Promise<CommandMatch[]> {
    const matches: CommandMatch[] = [];

    try {
      const session = this.sessions.get(sessionId);
      if (!session) return matches;

      // Determine directory to search
      let searchDir = session.workingDirectory;
      let prefix = partialPath;

      if (partialPath.includes('/')) {
        const lastSlash = partialPath.lastIndexOf('/');
        const dirPart = partialPath.substring(0, lastSlash + 1);
        prefix = partialPath.substring(lastSlash + 1);

        // Handle absolute vs relative paths
        if (dirPart.startsWith('/')) {
          searchDir = dirPart;
        } else {
          searchDir = `${session.workingDirectory}/${dirPart}`.replace(/\/+/g, '/');
        }
      }

      // List directory contents
      // Temporarily change directory to search dir, list, then change back
      const originalDir = fileSystem.getCurrentWorkingDirectory();
      await fileSystem.changeDirectory(searchDir);
      const result = await fileSystem.listCurrentDirectory();
      await fileSystem.changeDirectory(originalDir);

      if (result.success && result.data) {
        const items = result.data;
        const files = items.filter(i => i.type === 'file').map(i => i.name);
        const folders = items.filter(i => i.type === 'directory').map(i => i.name);

        // Add matching files
        for (const file of files) {
          if (!prefix || file.startsWith(prefix)) {
            matches.push({
              command: partialPath.substring(0, partialPath.length - prefix.length) + file,
              type: 'path',
            });
          }
        }

        // Add matching folders
        for (const folder of folders) {
          if (!prefix || folder.startsWith(prefix)) {
            matches.push({
              command: partialPath.substring(0, partialPath.length - prefix.length) + folder + '/',
              type: 'path',
            });
          }
        }
      }
    } catch (error) {
      console.error('Path completion error:', error);
    }

    return matches;
  }

  /**
   * Track background process
   */
  addBackgroundProcess(sessionId: string, process: BackgroundProcess): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.backgroundProcesses.push(process);
      this.saveSessions();
    }
  }

  /**
   * Get background processes
   */
  getBackgroundProcesses(sessionId: string): BackgroundProcess[] {
    const session = this.sessions.get(sessionId);
    return session?.backgroundProcesses || [];
  }

  /**
   * Update background process status
   */
  updateBackgroundProcess(
    sessionId: string,
    processId: string,
    updates: Partial<BackgroundProcess>
  ): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const process = session.backgroundProcesses.find(p => p.id === processId);
      if (process) {
        Object.assign(process, updates);
        this.saveSessions();
      }
    }
  }

  /**
   * Save sessions to localStorage
   */
  private saveSessions(): void {
    try {
      const sessionsData = Array.from(this.sessions.entries()).map(([_, session]) => ({
        ...session,
      }));

      localStorage.setItem('terminal-sessions', JSON.stringify(sessionsData));
      localStorage.setItem('current-session-id', this.currentSessionId || '');
    } catch (error) {
      console.error('Failed to save terminal sessions:', error);
    }
  }

  /**
   * Load sessions from localStorage
   */
  private loadSessions(): void {
    try {
      const sessionsData = localStorage.getItem('terminal-sessions');
      const currentSessionId = localStorage.getItem('current-session-id');

      if (sessionsData) {
        const sessions: TerminalSession[] = JSON.parse(sessionsData);
        sessions.forEach(session => {
          this.sessions.set(session.id, session);
        });
      }

      if (currentSessionId && this.sessions.has(currentSessionId)) {
        this.currentSessionId = currentSessionId;
      }
    } catch (error) {
      console.error('Failed to load terminal sessions:', error);
    }
  }

  /**
   * Clear old sessions (keep last 10)
   */
  cleanupOldSessions(): void {
    const sessions = Array.from(this.sessions.values())
      .sort((a, b) => b.lastActiveAt - a.lastActiveAt);

    if (sessions.length > 10) {
      const toRemove = sessions.slice(10);
      toRemove.forEach(session => {
        if (session.id !== this.currentSessionId) {
          this.sessions.delete(session.id);
        }
      });
      this.saveSessions();
    }
  }

  /**
   * Add output to session
   */
  addOutput(sessionId: string, output: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.output.push(output);

      // Limit output history
      if (session.output.length > 10000) {
        session.output = session.output.slice(-5000);
      }

      // Don't save on every output (too frequent)
      // Will save on command execution instead
    }
  }

  /**
   * Get session output
   */
  getOutput(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    return session?.output || [];
  }
}

// Export singleton instance
export const terminalSessionService = new TerminalSessionService();
