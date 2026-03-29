/**
 * Typed Google Analytics event tracking service for Browser IDE.
 *
 * Pure TypeScript module — no React imports. Safe to import from any file
 * including components, services, and contexts.
 *
 * PRIVACY RULES (IDE handles sensitive code):
 * - Never track file names or paths — only extensions
 * - Never track terminal commands — only categories
 * - Never track git remote URLs — could contain private repo info
 * - Never track AI message content — only provider, model, response length
 * - Never track file content or code
 * - All errors go through sanitizeError()
 */

// ── GA configuration ────────────────────────────────────────

const GA_CONFIG = {
  /** Set to true only after a real Measurement ID is assigned. */
  enabled: false,
  measurementId: 'G-XXXXXXXXXX',
};

// ── Event taxonomy ──────────────────────────────────────────

type ProjectEvent =
  | { name: 'project_created'; params: { template: string } }
  | { name: 'project_opened' }
  | { name: 'project_switched' }
  | { name: 'project_deleted' };

type EditorEvent =
  | { name: 'file_created'; params: { file_extension: string } }
  | { name: 'file_opened'; params: { file_extension: string } }
  | { name: 'file_deleted' }
  | { name: 'file_uploaded'; params: { file_count: number; method: 'button' | 'drag_drop' } }
  | { name: 'command_palette_used'; params: { command: string } };

type TerminalEvent =
  | { name: 'terminal_opened'; params: { profile: 'bash' | 'node' | 'python' | 'powershell' } }
  | { name: 'terminal_command_run'; params: { command_category: 'npm' | 'git' | 'node' | 'python' | 'system' | 'other' } }
  | { name: 'terminal_closed' };

type GitEvent =
  | { name: 'git_init' }
  | { name: 'git_clone' }
  | { name: 'git_commit'; params: { file_count: number } }
  | { name: 'git_push' }
  | { name: 'git_branch_created' };

type AIEvent =
  | { name: 'ai_message_sent'; params: { provider: string; model: string } }
  | { name: 'ai_response_received'; params: { provider: string; response_length: number } }
  | { name: 'ai_provider_switched'; params: { from_provider: string; to_provider: string } }
  | { name: 'ai_chat_opened' };

type DebuggerEvent =
  | { name: 'debug_session_started' }
  | { name: 'breakpoint_set' }
  | { name: 'debug_action'; params: { action: 'step_over' | 'step_into' | 'step_out' | 'continue' | 'stop' } };

type UIEvent =
  | { name: 'theme_toggled'; params: { theme: 'dark' | 'light' } }
  | { name: 'panel_toggled'; params: { panel: 'terminal' | 'explorer' | 'search' | 'git' | 'debug' | 'ai' | 'problems' } }
  | { name: 'settings_changed'; params: { setting_category: string } };

type ErrorEvent = {
  name: 'error_occurred';
  params: { category: string; action: string; error: string };
};

export type AnalyticsEvent =
  | ProjectEvent
  | EditorEvent
  | TerminalEvent
  | GitEvent
  | AIEvent
  | DebuggerEvent
  | UIEvent
  | ErrorEvent;

// ── Guard ────────────────────────────────────────────────────

/**
 * Returns true only when analytics should fire: production build + enabled flag.
 * This prevents dev noise and allows the flag to gate real data collection.
 */
function shouldTrack(): boolean {
  if (!GA_CONFIG.enabled) return false;
  if (typeof window === 'undefined' || !window.gtag) return false;
  return import.meta.env.PROD;
}

// ── Core tracking function ───────────────────────────────────

/**
 * Send a typed analytics event to Google Analytics.
 * No-ops gracefully when GA is disabled, not in production, or gtag is blocked.
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (!shouldTrack()) return;

  const { name, ...rest } = event;
  const params = 'params' in rest ? rest.params : undefined;
  window.gtag('event', name, params);
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Extract the file extension from a file path or name.
 * Returns the extension with a leading dot (e.g. ".ts") or "unknown" if none.
 * NEVER returns the filename or path — only the extension.
 */
export function getFileExtension(filePathOrName: string): string {
  const name = filePathOrName.split('/').pop() ?? filePathOrName;
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return 'unknown';
  return name.slice(dotIndex).toLowerCase();
}

type CommandCategory = 'npm' | 'git' | 'node' | 'python' | 'system' | 'other';

const COMMAND_CATEGORY_PATTERNS: Array<[RegExp, CommandCategory]> = [
  [/^npm\b|^npx\b|^pnpm\b|^yarn\b/, 'npm'],
  [/^git\b/, 'git'],
  [/^node\b|^ts-node\b|^tsx\b/, 'node'],
  [/^python\b|^python3\b|^pip\b|^pip3\b/, 'python'],
  [/^ls\b|^cd\b|^pwd\b|^mkdir\b|^rm\b|^mv\b|^cp\b|^cat\b|^touch\b|^echo\b|^clear\b|^help\b|^which\b|^env\b|^export\b|^history\b/, 'system'],
];

/**
 * Categorize a terminal command without logging the actual command.
 * Returns a broad category safe for analytics.
 */
export function categorizeCommand(command: string): CommandCategory {
  const trimmed = command.trim();
  for (const [pattern, category] of COMMAND_CATEGORY_PATTERNS) {
    if (pattern.test(trimmed)) return category;
  }
  return 'other';
}

const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.\w+/g;
const PATH_PATTERN = /\/[\w./\-_]+/g;

/**
 * Strip PII (emails, file paths) from error messages before sending to GA.
 * Truncates to 100 chars to stay within GA parameter limits.
 */
export function sanitizeError(msg: string): string {
  return msg
    .replace(EMAIL_PATTERN, '[email]')
    .replace(PATH_PATTERN, '[path]')
    .slice(0, 100);
}
