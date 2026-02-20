/**
 * Undo Manager Service
 *
 * Manages undo history for destructive actions
 */

import { logger } from '@/utils/logger';

interface UndoAction {
  id: string;
  type: 'delete' | 'branch-delete' | 'commit-delete' | 'stash-drop';
  timestamp: number;
  data: unknown;
}

class UndoManager {
  private history: UndoAction[] = [];
  private maxSize = 50;

  /**
   * Add an action to history
   */
  addAction(action: Omit<UndoAction, 'id'>): void {
    const undoAction: UndoAction = {
      ...action,
      id: `${Date.now()}-${action.type}-${Math.random().toString(36).slice(2, 11)}`,
    };
    this.history.unshift(undoAction);

    // Limit history size
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }

    this.saveToStorage();
  }

  /**
   * Get recent actions (for undo UI)
   */
  getRecentActions(limit = 10): UndoAction[] {
    return this.history.slice(0, limit);
  }

  /**
   * Undo an action by ID
   */
  undoAction(actionId: string): boolean {
    const actionIndex = this.history.findIndex(a => a.id === actionId);
    if (actionIndex === -1) {
      logger.error('Undo action not found:', actionId);
      return false;
    }

    const action = this.history[actionIndex];
    this.history.splice(actionIndex, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('undo-history', JSON.stringify(this.history));
    } catch (error) {
      logger.error('Failed to save undo history:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('undo-history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load undo history:', error);
    }
  }

  constructor() {
    this.loadFromStorage();
  }
}

// Export singleton instance
export const undoManager = new UndoManager();
