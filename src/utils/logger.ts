/**
 * Centralized Logging Utility
 * Provides structured logging with different levels
 */

import { config } from '@/config/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: unknown;
  context?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private minLevel: LogLevel;

  constructor() {
    this.minLevel = config.LOG_LEVEL;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.minLevel);
    const logIndex = levels.indexOf(level);
    return logIndex >= currentIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '🔴',
    };

    const prefix = context ? `[${context}]` : '';
    return `${emoji[level]} ${prefix} ${message}`;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('debug')) return;

    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: Date.now(),
      data,
      context,
    };

    this.addLog(entry);
    console.log(this.formatMessage('debug', message, context), data || '');
  }

  info(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('info')) return;

    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: Date.now(),
      data,
      context,
    };

    this.addLog(entry);
    console.info(this.formatMessage('info', message, context), data || '');
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (!this.shouldLog('warn')) return;

    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: Date.now(),
      data,
      context,
    };

    this.addLog(entry);
    console.warn(this.formatMessage('warn', message, context), data || '');
  }

  error(message: string, error?: unknown, context?: string): void {
    if (!this.shouldLog('error')) return;

    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: Date.now(),
      data: error,
      context,
    };

    this.addLog(entry);
    console.error(this.formatMessage('error', message, context), error || '');

    // TODO: Send to error tracking service in production
    if (config.ENABLE_ERROR_TRACKING) {
      this.reportError(entry);
    }
  }

  private reportError(entry: LogEntry): void {
    // TODO: Implement error reporting to external service
    // Example: Sentry, LogRocket, etc.
    if (config.IS_DEV) {
      console.log('Would report error to tracking service:', entry);
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return [...this.logs];
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  downloadLogs(): void {
    const logsJson = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `browser-ide-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogEntry };
