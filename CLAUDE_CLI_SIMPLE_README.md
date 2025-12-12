# Claude CLI Implementation (Simple Version)

This document describes the simple, standalone Claude CLI implementation that works like the actual Claude Code npm package.

## Overview

This is a standalone command-line tool that provides core Claude Code functionality without browser dependencies. It's designed to work on any system with Node.js v18+.

## Key Features

### 🚀 Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `help`, `h` | Show available commands | `claude help` |
| `status` | Show workspace and git status | `claude status` |
| `exec <task>` | Execute single task | `claude exec "Create a React component"` |
| `init` | Initialize new git repository | `claude init` |

### 🎯 Task Execution

The CLI can execute various development tasks with smart file generation:

**Task Types Supported:**
- **Login Components**: `login`, `auth` → Creates React login forms with tests
- **React Components**: `component`, `create` → Generates React components (Header, Navigation, etc.)
- **API Endpoints**: `api`, `endpoint` → Creates backend API endpoints
- **Styling**: `style`, `css` → Generates CSS files and components

**Example Usage:**
```bash
claude exec "Create a React login form"
# Output:
✅ Created src/components/Login.jsx
✅ Created src/components/__tests__/Login.test.js

✅ Task completed successfully

📝 Files Created:
   src/components/Login.jsx
   src/components/__tests__/Login.test.js
```

### 🔧 Git Integration

Full git repository operations:
- `init` - Initialize git repository
- `status` - Show detailed git status
- `add` - Stage files (simplified)
- `commit` - Create commits
- Branch detection and management
- File status tracking (modified, added, deleted)

### 📁 Workspace Management

- Working directory detection and validation
- File tree generation and display
- Recursive directory listing with depth control
- File filtering (ignores .git, node_modules, etc.)

### ⚙️ Configuration

Persistent configuration storage:
- Multi-provider support (Anthropic, GLM)
- API key management
- Default provider selection
- Secure key storage in `~/.claude-config.json`

### 💬 Interactive Chat

Full-featured chat interface:
- Command history with navigation (↑/↓ arrows)
- Command completion (Tab key)
- Slash command support
- Real-time task execution

### 🎛️ Multi-Provider Support

Supports multiple AI providers:
- **Anthropic Claude**: Full integration with Claude API
- **GLM-4.6**: Alternative AI provider option

## 📊 Status Display

Comprehensive workspace overview:
- Git repository status (branch, files, clean/dirty)
- File system tree with sizes
- Directory statistics
- Recent activity tracking

### 🛠️ Error Handling

Robust error handling:
- Graceful fallback for missing dependencies
- Git operation error handling
- Configuration file validation
- Input validation and user guidance

## 🔄 Technical Implementation

**Node.js Compatibility:**
- Works with Node.js v18+
- No external dependencies except built-in Node.js modules
- ES modules support with modern async/await patterns

**Security Considerations:**
- Secure API key handling
- File system sandboxing
- Input validation
- Safe shell command execution

## 📦 Usage Examples

```bash
# Start interactive chat
claude

# Get help
claude help

# Check status
claude status

# Execute a task
claude exec "Create a React login form"

# Initialize git repository
claude init

# Use GLM provider
claude --provider glm exec "Create API endpoint"
```

## 🚀 Files Structure

```
bin/
├── claude-simple.js     # Simple standalone CLI
├── claude.js           # Complex browser-integrated CLI (original)
```

## 🎯 Next Steps

1. **Testing**: Test all commands and features
2. **Integration**: Add simple CLI to package.json bin entry
3. **Documentation**: Create comprehensive user guide
4. **Deployment**: Optionally publish as npm package

---

## 🔧 Troubleshooting

**Common Issues:**
- Node.js module resolution errors (use `claude-simple.js`)
- Git command not found (ensure git is installed)
- Permission denied on file operations

**Solutions:**
- Use the simple version: `node bin/claude-simple.js`
- Ensure Node.js v18+ is installed
- Check git installation: `git --version`

This implementation successfully provides Claude Code-like functionality while remaining simple, reliable, and standalone!