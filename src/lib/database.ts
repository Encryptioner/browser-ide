import Dexie, { Table } from 'dexie';
import type {
  DBProject,
  DBSession,
  DBMessage,
  DBSettings,
  Project,
  AISession,
  AIMessage,
  AppSettings,
} from '@/types';

export class BrowserIDEDatabase extends Dexie {
  // Tables
  projects!: Table<DBProject, string>;
  sessions!: Table<DBSession, string>;
  messages!: Table<DBMessage, string>;
  settings!: Table<DBSettings, string>;

  constructor() {
    super('BrowserIDEDatabase');

    // Define schema
    this.version(1).stores({
      projects: 'id, name, lastOpened, starred, *tags',
      sessions: 'id, projectId, providerId, createdAt, updatedAt, pinned',
      messages: 'id, sessionId, timestamp, role',
      settings: 'id',
    });
  }

  // ========== Projects ==========
  async getAllProjects(): Promise<Project[]> {
    return this.projects.orderBy('lastOpened').reverse().toArray();
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async addProject(project: Project): Promise<string> {
    return this.projects.add(project);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<number> {
    return this.projects.update(id, updates);
  }

  async deleteProject(id: string): Promise<void> {
    await this.projects.delete(id);
    // Also delete associated sessions and messages
    const sessions = await this.sessions.where('projectId').equals(id).toArray();
    const sessionIds = sessions.map(s => s.id);
    await this.sessions.where('projectId').equals(id).delete();
    await this.messages.where('sessionId').anyOf(sessionIds).delete();
  }

  async getStarredProjects(): Promise<Project[]> {
    return this.projects.where('starred').equals(1).toArray();
  }

  async searchProjects(query: string): Promise<Project[]> {
    const lowerQuery = query.toLowerCase();
    return this.projects
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.description?.toLowerCase().includes(lowerQuery) ?? false)
      )
      .toArray();
  }

  // ========== Sessions ==========
  async getProjectSessions(projectId: string): Promise<AISession[]> {
    return this.sessions
      .where('projectId')
      .equals(projectId)
      .reverse()
      .sortBy('updatedAt');
  }

  async getSession(id: string): Promise<AISession | undefined> {
    return this.sessions.get(id);
  }

  async addSession(session: AISession): Promise<string> {
    return this.sessions.add(session);
  }

  async updateSession(id: string, updates: Partial<AISession>): Promise<number> {
    return this.sessions.update(id, { ...updates, updatedAt: Date.now() });
  }

  async deleteSession(id: string): Promise<void> {
    await this.sessions.delete(id);
    // Also delete associated messages
    await this.messages.where('sessionId').equals(id).delete();
  }

  async getPinnedSessions(projectId: string): Promise<AISession[]> {
    return this.sessions
      .where(['projectId', 'pinned'])
      .equals([projectId, 1])
      .toArray();
  }

  // ========== Messages ==========
  async getSessionMessages(sessionId: string): Promise<AIMessage[]> {
    return this.messages
      .where('sessionId')
      .equals(sessionId)
      .sortBy('timestamp');
  }

  async addMessage(message: AIMessage, sessionId: string): Promise<string> {
    const dbMessage: DBMessage = { ...message, sessionId };
    return this.messages.add(dbMessage);
  }

  async updateMessage(id: string, updates: Partial<AIMessage>): Promise<number> {
    return this.messages.update(id, updates);
  }

  async deleteMessage(id: string): Promise<void> {
    await this.messages.delete(id);
  }

  async getMessageWithChildren(messageId: string): Promise<{
    message: DBMessage;
    children: DBMessage[];
  } | null> {
    const message = await this.messages.get(messageId);
    if (!message) return null;

    const children = await this.messages
      .where('parentId')
      .equals(messageId)
      .toArray();

    return { message, children };
  }

  async searchMessages(sessionId: string, query: string): Promise<AIMessage[]> {
    const lowerQuery = query.toLowerCase();
    return this.messages
      .where('sessionId')
      .equals(sessionId)
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .toArray();
  }

  // ========== Settings ==========
  async getSettings(): Promise<AppSettings | null> {
    const result = await this.settings.get('app-settings');
    return result?.settings || null;
  }

  async saveSettings(settings: AppSettings): Promise<string> {
    return this.settings.put({
      id: 'app-settings',
      settings,
      updatedAt: Date.now(),
    });
  }

  // ========== Utilities ==========
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.projects.clear(),
      this.sessions.clear(),
      this.messages.clear(),
      this.settings.clear(),
    ]);
  }

  async exportData(): Promise<{
    projects: Project[];
    sessions: AISession[];
    messages: DBMessage[];
    settings: AppSettings | null;
  }> {
    const [projects, sessions, messages, settings] = await Promise.all([
      this.projects.toArray(),
      this.sessions.toArray(),
      this.messages.toArray(),
      this.getSettings(),
    ]);

    return { projects, sessions, messages, settings };
  }

  async importData(data: {
    projects?: Project[];
    sessions?: AISession[];
    messages?: DBMessage[];
    settings?: AppSettings;
  }): Promise<void> {
    if (data.projects) {
      await this.projects.bulkAdd(data.projects);
    }
    if (data.sessions) {
      await this.sessions.bulkAdd(data.sessions);
    }
    if (data.messages) {
      await this.messages.bulkAdd(data.messages);
    }
    if (data.settings) {
      await this.saveSettings(data.settings);
    }
  }

  // ========== Statistics ==========
  async getStats(): Promise<{
    projectCount: number;
    sessionCount: number;
    messageCount: number;
    totalStorageUsed: number;
  }> {
    const [projectCount, sessionCount, messageCount] = await Promise.all([
      this.projects.count(),
      this.sessions.count(),
      this.messages.count(),
    ]);

    // Estimate storage (rough calculation)
    const projects = await this.projects.toArray();
    const sessions = await this.sessions.toArray();
    const messages = await this.messages.toArray();
    
    const totalStorageUsed = 
      JSON.stringify(projects).length +
      JSON.stringify(sessions).length +
      JSON.stringify(messages).length;

    return {
      projectCount,
      sessionCount,
      messageCount,
      totalStorageUsed,
    };
  }
}

// Create singleton instance
export const db = new BrowserIDEDatabase();

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('✅ Database initialized successfully');
    
    // Check if settings exist, if not create default
    const settings = await db.getSettings();
    if (!settings) {
      const { DEFAULT_EDITOR_SETTINGS, DEFAULT_GIT_SETTINGS } = await import('@/types');
      await db.saveSettings({
        editor: DEFAULT_EDITOR_SETTINGS,
        git: DEFAULT_GIT_SETTINGS,
        ai: {
          providers: [],
          defaultProvider: 'anthropic',
          defaultModel: 'claude-sonnet-4-20250514',
          streamResponses: true,
        },
        appearance: {
          sidebarPosition: 'left',
          panelPosition: 'bottom',
          activityBarVisible: true,
          statusBarVisible: true,
          zoomLevel: 1,
        },
        terminal: {
          fontFamily: 'Consolas, Monaco, monospace',
          fontSize: 14,
          cursorStyle: 'block',
        },
      });
      console.log('✅ Default settings created');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Export hooks for React components
export { useLiveQuery } from 'dexie-react-hooks';
