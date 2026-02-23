# P2 Design: Claude Code Integration Layer

## Overview

Wire the existing AI backend services (claude-agent.ts, claude-cli.ts, ai-providers.ts) to new UI components. The backend has a complete agentic loop with 7 tools and streaming - the gap is UI.

## Build Order (bottom-up)

1. Claude Terminal Tab (#30)
2. Monaco DiffEditor (#29)
3. Tool Call Cards (#28)
4. Unified AI Panel (#27)

## Components

### 1. Claude Terminal Tab

**File:** `src/components/IDE/ClaudeTerminal.tsx`

- Special terminal tab auto-created when agent mode starts
- Read-only output stream showing tool activity with timestamps
- Renders: `[12:34:05] Reading file: src/App.tsx`, `[12:34:06] Writing file: src/utils/helper.ts`
- Uses existing TerminalTabs infrastructure (new tab type: `claude`)
- Cleared on new session start

### 2. Monaco DiffEditor

**File:** `src/components/IDE/DiffEditor.tsx`

- Wraps Monaco `DiffEditor` component (from @monaco-editor/react)
- Props: `original: string`, `modified: string`, `language: string`, `onAccept()`, `onReject()`
- Accept/Reject bar at top
- Integrated into Editor.tsx: when `pendingDiff` state exists, render DiffEditor instead of normal editor
- New store state in editorSlice: `pendingDiff: { file, original, modified } | null`

### 3. Tool Call Cards

**Directory:** `src/components/IDE/ToolCards/`

- `ToolCallCard.tsx` - base collapsible card wrapper (icon, title, status badge, chevron)
- `FileEditCard.tsx` - inline diff preview, "Open Diff" button linking to DiffEditor
- `CommandCard.tsx` - syntax-highlighted command + output, exit code badge
- `SearchCard.tsx` - file results list with click-to-open

Cards render inside AI panel message stream. Each tool call from claude-agent maps to a card.

### 4. Unified AI Panel

**File:** `src/components/IDE/AIPanel.tsx` (replaces AIAssistant.tsx)

- Bottom panel tab (activeBottomPanel: 'claude-code')
- Mode toggle: Chat (Q&A) | Agent (tool calling)
- **Chat mode**: Calls aiRegistry.complete() with streaming, renders markdown responses
- **Agent mode**: Calls ClaudeCodeAgent.executeTask(), renders tool call cards inline
- Message input with Cmd/Ctrl+Enter, session selector dropdown
- Streaming indicator with cancel button

### 5. AI Store Slice

**File:** `src/store/slices/aiSlice.ts`

```typescript
interface AISlice {
  activeAISessionId: string | null;
  aiSessionList: AISession[];
  isStreaming: boolean;
  agentMode: 'chat' | 'agent';
  pendingToolCalls: ToolCallState[];

  createAISession: () => string;
  addAIMessage: (sessionId: string, message: AIMessage) => void;
  setStreaming: (streaming: boolean) => void;
  setAgentMode: (mode: 'chat' | 'agent') => void;
  addToolCall: (call: ToolCallState) => void;
  updateToolCall: (id: string, update: Partial<ToolCallState>) => void;
}
```

## Data Flow

```
User types message
  → AIPanel dispatches to Chat or Agent service
  → Service streams response chunks
  → Each chunk updates store → re-renders message list
  → Tool calls (agent mode) rendered as cards
  → File edits trigger DiffEditor in Editor.tsx
  → All tool activity logged to Claude Terminal
```

## Implementation Notes

- AIAssistant.tsx (modal) gets deleted, replaced by AIPanel.tsx (bottom panel)
- No new npm dependencies needed (Monaco DiffEditor ships with @monaco-editor/react)
- Agent executeTask returns artifacts which map directly to tool cards
- Streaming uses onChunk callback pattern from ai-providers.ts
