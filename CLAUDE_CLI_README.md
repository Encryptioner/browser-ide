# Claude CLI Implementation

This document describes the Browser IDE Pro's Claude CLI implementation that works like the actual Claude Code npm package, but is optimized for browser environments using WebContainers.

## Overview

The Claude CLI is a comprehensive command-line interface that provides:

1. **Node.js CLI** (`bin/claude.js`) - Standalone Node.js implementation
2. **Browser CLI** (`src/components/claude-cli/`) - WebContainer-based browser implementation

Both implementations support:
- Claude Code slash commands (`/help`, `/clear`, `/compact`, etc.)
- AI-powered task execution with Claude agents
- Git integration
- File system operations
- Project initialization
- Multi-provider support (Anthropic, GLM-4.6)

## Features

### 🚀 Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help`, `h` | Show available commands | `claude help` |
| `status` | Show workspace and git status | `claude status` |
| `exec <task>` | Execute AI-powered task | `claude exec "Add login button"` |
| `init [type]` | Initialize new project | `claude init react` |
| `clear` | Clear terminal | `claude clear` |

### 📁 File Operations

| Command | Description | Example |
|---------|-------------|---------|
| `ls [path]` | List directory contents | `claude ls src/` |
| `cd <path>` | Change directory | `claude cd src/` |
| `pwd` | Show current directory | `claude pwd` |
| `cat <file>` | Display file contents | `claude cat README.md` |
| `mkdir <dir>` | Create directory | `claude mkdir components` |
| `touch <file>` | Create empty file | `claude touch App.js` |

### ⚡ Claude Code Slash Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show slash command help | `/help` |
| `/clear` | Clear terminal and reset state | `/clear` |
| `/compact` | Compact conversation history | `/compact` |
| `/history` | Show command history | `/history` |
| `/status` | Show detailed workspace status | `/status` |
| `/env` | Show environment variables | `/env` |
| `/cd <path>` | Change working directory | `/cd src/` |
| `/pwd` | Show current directory | `/pwd` |
| `/ls [path]` | List files in directory | `/ls` |
| `/git` | Show git command help | `/git` |
| `/npm` | Show npm command help | `/npm` |
| `/reset` | Reset CLI environment | `/reset` |
| `/exit`, `/quit` | Exit CLI | `/exit` |

### 🔧 Development Commands

| Command | Description | Example |
|---------|-------------|---------|
| `npm <command>` | Run npm commands | `claude npm install` |
| `git <command>` | Run git commands | `claude git status` |
| `node <file>` | Execute Node.js script | `claude node server.js` |
| `python <file>` | Run Python script | `claude python app.py` |

## Architecture

### Node.js CLI (`bin/claude.js`)

```javascript
class ClaudeCLI {
  // Standalone implementation for Node.js environments
  // Supports: file operations, git integration, task execution
  // Uses: fs/promises, child_process, readline
}
```

### Browser CLI (`src/services/claude-cli.ts`)

```typescript
export class ClaudeCLIService {
  // WebContainer-based implementation for browser environments
  // Supports: same commands as Node.js CLI + browser-specific features
  // Uses: @webcontainer/api, claude-agent services
}
```

### React Component (`src/components/claude-cli/`)

```typescript
export function ClaudeCLI() {
  // xterm.js terminal interface
  // WebContainer integration
  // Real-time command execution and output
  // Slash command support
}
```

## Integration with IDE

The CLI integrates seamlessly with the Browser IDE Pro:

1. **File System Sync**: All file operations sync with IDE workspace
2. **Git Integration**: Git commands work with IDE's git service
3. **AI Integration**: `exec` commands use Claude agents for intelligent task execution
4. **WebContainer Security**: All commands run in isolated WebContainer environment
5. **Multi-Provider Support**: Works with Anthropic Claude and GLM-4.6

## Configuration

### Environment Variables

The CLI reads configuration from:

1. **CLI Options**: Passed when creating CLI service
2. **Config File**: `~/.claude-config.json`
3. **Environment Variables**: `ANTHROPIC_API_KEY`, `GLM_API_KEY`

### Example Config

```json
{
  "anthropic": {
    "apiKey": "your-anthropic-key",
    "baseUrl": "https://api.anthropic.com",
    "model": "claude-sonnet-4-20250514"
  },
  "glm": {
    "apiKey": "your-glm-key",
    "baseUrl": "https://api.z.ai/api/anthropic",
    "model": "claude-sonnet-4-20250514"
  },
  "defaultProvider": "anthropic"
}
```

## Usage Examples

### Basic Usage

```bash
# Start interactive session
claude

# Show help
claude help

# Execute single task
claude exec "Create a React component for user profile"

# Show status
claude status

# Initialize project
claude init react
```

### Browser IDE Integration

```typescript
import { ClaudeCLI } from '@/components/claude-cli';

function MyIDE() {
  return (
    <ClaudeCLI
      options={{
        provider: 'anthropic',
        apiKey: 'your-api-key'
      }}
      onCommand={(command, result) => {
        console.log(`Executed: ${command}`);
      }}
    />
  );
}
```

### Slash Commands in Action

```bash
claude> /help
🔧 Executing slash command: /help
⚡ Claude Code Slash Commands:
  /help     Show available slash commands
  /clear    Clear terminal and reset state
  /compact  Compact conversation history
  /status   Show detailed workspace status

claude> /clear
🔧 Executing slash command: /clear
🧹 Terminal cleared

claude> exec "Add responsive navigation"
🎯 Executing task: Add responsive navigation
🤔 Analyzing task...
🔧 Generating solution...
📝 Creating files...
✅ Task completed successfully
📝 Files Created:
   + src/components/Navigation.jsx
   + src/components/Navigation.css
```

## Technical Implementation

### WebContainer Integration

The browser CLI uses WebContainers to provide:

- **Isolated Environment**: Commands run in secure container
- **Real File System**: Actual file operations persist
- **Process Management**: Ability to spawn and manage processes
- **Network Access**: Controlled access to external resources

### AI Agent Integration

Task execution (`exec` command) uses the Claude agent system:

1. **Task Analysis**: Claude analyzes the request
2. **Tool Selection**: Appropriate tools are selected
3. **Execution**: Tools execute in WebContainer environment
4. **Artifact Tracking**: All file changes are tracked and synced
5. **Progress Updates**: Real-time progress feedback

### Cross-Platform Compatibility

- **Desktop**: Full feature support with native Node.js CLI
- **Browser**: Full feature support with WebContainer CLI
- **Mobile**: Optimized terminal interface for mobile devices
- **Tablet**: Responsive design with touch support

## Security Considerations

1. **WebContainer Isolation**: All commands run in isolated containers
2. **API Key Protection**: Keys stored securely in browser storage
3. **File System Sandboxing**: Limited access to designated workspace
4. **Network Restrictions**: Controlled external resource access
5. **Process Limits**: Time and resource limits on executions

## Performance Optimizations

1. **Lazy Loading**: CLI service initializes on-demand
2. **Command Caching**: Frequent commands cached for faster execution
3. **Output Streaming**: Real-time output display
4. **Memory Management**: Efficient WebContainer resource usage
5. **History Management**: Intelligent command history compaction

## Development Notes

### Adding New Commands

To add a new command:

1. **Node.js CLI**: Add case in `executeCommand()` switch
2. **Browser CLI**: Add case in `executeCommand()` method
3. **Slash Commands**: Add case in `handleSlashCommand()` method
4. **Help Text**: Update `showHelpCommand()` function

### Testing Commands

```bash
# Test Node.js CLI
node bin/claude.js --help
node bin/claude.js status

# Test Browser CLI (in dev environment)
npm run dev
# Navigate to CLI panel in browser
```

## Future Enhancements

1. **Plugin System**: Allow custom command extensions
2. **Multi-language Support**: Commands for different programming languages
3. **Collaboration**: Shared terminal sessions
4. **Advanced AI**: Enhanced Claude agent capabilities
5. **Performance Metrics**: Command execution analytics

---

This implementation provides a complete Claude Code-like experience that works seamlessly in browser environments while maintaining compatibility with desktop usage patterns.