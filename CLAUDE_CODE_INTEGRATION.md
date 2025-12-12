# Claude Code Integration Guide

## Overview

Browser IDE Pro now includes **Claude Code Agent** - an agentic coding assistant powered by GLM-4.6 (via Z.AI) or Anthropic's Claude. This integration brings the power of Claude Code CLI to your browser with natural language coding capabilities.

---

## 🎯 What is Claude Code Agent?

Claude Code Agent is an AI-powered coding assistant that:

- **Executes coding tasks** from natural language commands
- **Uses tools autonomously** (file operations, git, search)
- **Works iteratively** until tasks are complete
- **Provides transparency** by showing all tool executions
- **Integrates with your workspace** for context-aware assistance

### How It Differs from Simple AI Chat

| Feature | Simple AI Chat (🤖) | Claude Code Agent (🧠) |
|---------|---------------------|------------------------|
| **Response Type** | Text only | Text + Code Execution |
| **Tool Use** | None | Full file system, git, search |
| **Autonomy** | Single response | Multi-step task execution |
| **Code Changes** | Copy/paste required | Direct file modifications |
| **Git Operations** | Manual | Automated commits |

---

## 🚀 Getting Started

### 1. Configure API Key

**For GLM-4.6 (Recommended):**

1. Get your API key from [Z.AI](https://z.ai/manage-apikey/apikey-list)
2. Open Settings (⚙️)
3. Navigate to **AI Settings**
4. Enter your key in **GLM API Key** field
5. Save settings

**For Anthropic Claude:**

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Enter it in **Anthropic API Key** field

### 2. Open Claude Code Panel

Click the **🧠** button in the title bar to open Claude Code Agent panel.

### 3. Start Coding!

Type natural language commands:

```
"Create a React component for user profile display"
"Add error handling to the fetchUser function"
"Refactor this code to use TypeScript"
```

---

## 💡 Example Commands

### Creating Components

```
Create a login form component with email and password fields
```

**What happens:**
- Creates `src/components/LoginForm.tsx`
- Adds proper TypeScript types
- Includes form validation
- Adds styling with Tailwind

### Refactoring Code

```
Convert the fetchData function in src/api/users.ts to use async/await instead of promises
```

**What happens:**
- Reads the file
- Identifies the function
- Refactors to async/await
- Updates error handling
- Saves the file

### Git Operations

```
Create a git commit for the authentication changes
```

**What happens:**
- Runs `git status`
- Stages relevant files
- Creates descriptive commit message
- Makes the commit

### Search and Analysis

```
Find all TODO comments in the project
```

**What happens:**
- Searches all files recursively
- Identifies TODO comments
- Provides file paths and line numbers
- Optionally creates issues

---

## 🔧 How It Works

### Agentic Workflow

1. **You give a command**: "Add error handling to fetchUser"

2. **Agent plans**: Identifies it needs to:
   - Read the file
   - Understand current code
   - Add try/catch blocks
   - Write the file back

3. **Agent executes tools**:
   ```
   🔧 Using tool: read_file
   ✅ Tool result: [file content]

   🔧 Using tool: edit_file
   ✅ Tool result: Successfully edited fetchUser.ts
   ```

4. **Agent responds**:
   ```
   ✅ Added comprehensive error handling to fetchUser function including:
   - Try/catch for network errors
   - Validation of response data
   - User-friendly error messages
   ```

### Available Tools

The agent can use these tools autonomously:

- **read_file** - Read any file in the workspace
- **write_file** - Create new files
- **edit_file** - Modify existing files
- **list_files** - Browse directory structure
- **search_code** - Find code patterns
- **git_status** - Check git status
- **git_commit** - Create commits

---

## ⚙️ Configuration

### Provider Selection

Switch between GLM-4.6 and Anthropic Claude using the dropdown:

```
[GLM-4.6 (Z.AI) ▼]  [Anthropic Claude ▼]
```

**GLM-4.6 Advantages:**
- More cost-effective
- Optimized for Chinese + English
- Faster response times
- Better for web development

**Anthropic Claude Advantages:**
- Latest Claude models
- Longer context window
- Best-in-class reasoning

### API Endpoint Configuration

The integration uses Anthropic-compatible endpoints:

**GLM-4.6:**
```
Base URL: https://api.z.ai/api/anthropic
Model: claude-sonnet-4-20250514 (maps to GLM-4.6)
```

**Anthropic:**
```
Base URL: https://api.anthropic.com/v1
Model: claude-sonnet-4-20250514
```

---

## 📊 Artifacts Tracking

After each task, the agent shows what it changed:

```
📝 Created:
  - src/components/UserProfile.tsx
  - src/types/user.ts

✏️ Modified:
  - src/App.tsx
  - src/routes/index.tsx

⚡ Executed:
  - git add .
  - git commit -m "Add user profile component"
```

---

## 🎨 VS Code Extensions Support

### Extension Marketplace

Browser IDE Pro now includes a full VS Code extensions marketplace powered by **Open-VSX**.

### Opening Extensions Panel

Click the **🧩** button in the title bar.

### Browsing Extensions

**Popular Extensions:**
- Prettier - Code formatter
- ESLint
- Python
- Go
- GitLens
- Tailwind CSS IntelliSense

**Search:**
```
Search: "python"
Category: "Programming Languages"
```

### Installing Extensions

1. Browse or search for extensions
2. Click **Install** button
3. Extension is downloaded and cached in IndexedDB
4. Use the extension features in Monaco Editor

### Managing Extensions

**Installed Tab:**
- View all installed extensions
- Uninstall extensions
- See installation date

---

## 🔐 Privacy & Security

### Data Handling

- **API Keys**: Stored locally in browser (localStorage)
- **Code**: Sent only to configured provider
- **Files**: Remain in browser filesystem (LightningFS)
- **Git**: Operations are local-first

### What Gets Sent to AI

When using Claude Code Agent:

- Your command/prompt
- File contents (only when needed by tools)
- Conversation history
- Tool execution results

**Never sent:**
- API keys from other services
- Environment variables
- Git credentials

---

## 🐛 Troubleshooting

### "API Key Required"

**Solution:** Configure your API key in Settings (⚙️) → AI Settings

### "Tool execution failed"

**Possible causes:**
- File doesn't exist
- Invalid file path
- Git repository not initialized

**Solution:** Check the tool input shown in progress messages

### "Maximum iterations reached"

**Cause:** Task took more than 10 tool execution rounds

**Solution:**
- Break down complex tasks into smaller steps
- Be more specific in your commands

### Extension Installation Fails

**Possible causes:**
- Network issues
- Extension not available in Open-VSX
- CORS restrictions

**Solution:**
- Check internet connection
- Try a different extension
- Use popular extensions list

---

## 💻 Terminal Integration

### Combining Terminal + Claude Code

**Workflow:**

1. **Use Claude Code** for file operations:
   ```
   "Create a new Express API server in src/server.ts"
   ```

2. **Use Terminal** for running commands:
   ```
   $ cd src
   $ node server.ts
   ```

3. **Use Claude Code** for debugging:
   ```
   "Fix the CORS error in server.ts"
   ```

### Best Practices

- Use Claude Code for **coding** tasks
- Use Terminal for **execution** tasks
- Use Extensions for **IDE enhancements**

---

## 📚 Advanced Usage

### Multi-Step Tasks

Claude Code Agent can handle complex multi-step tasks:

```
"Create a complete authentication system with:
- Login component
- Registration component
- JWT token handling
- Protected routes
- Error states"
```

The agent will:
1. Create all components
2. Add type definitions
3. Implement routing
4. Add error handling
5. Test integration

### Context-Aware Refactoring

```
"Update all API calls to use the new error handling pattern"
```

The agent will:
1. Search for all API calls
2. Identify current patterns
3. Apply new error handling consistently
4. Update imports if needed

### Automated Testing

```
"Add unit tests for the UserProfile component"
```

The agent will:
1. Create test file
2. Write test cases
3. Add necessary mocks
4. Verify imports

---

## 🔄 Comparison with Claude Code CLI

### Similarities

- ✅ Same agentic workflow
- ✅ Same tool calling system
- ✅ Same natural language interface
- ✅ Iterative task execution

### Differences

| Feature | CLI | Browser IDE |
|---------|-----|-------------|
| **Environment** | Terminal | Browser |
| **File System** | Native FS | LightningFS |
| **Git** | System git | isomorphic-git |
| **Extensions** | VS Code | Monaco + Open-VSX |
| **Offline** | Limited | Full PWA support |
| **Installation** | npm global | Zero install |

---

## 🎓 Tips for Better Results

### Be Specific

❌ "Fix the bug"
✅ "Fix the TypeError in fetchUser function on line 45"

### Provide Context

❌ "Add authentication"
✅ "Add JWT authentication to the Express server in src/server.ts"

### Break Down Complex Tasks

Instead of:
```
"Build a complete e-commerce platform"
```

Try:
```
1. "Create product listing component"
2. "Add shopping cart functionality"
3. "Implement checkout process"
```

### Review Changes

Always review the artifacts section to see what was modified.

---

## 🌟 Example Workflows

### Workflow 1: New Feature

```
1. You: "Create a dark mode toggle component"
2. Agent: Creates DarkModeToggle.tsx
3. You: "Add it to the App.tsx header"
4. Agent: Updates App.tsx
5. You: "Store preference in localStorage"
6. Agent: Adds persistence logic
7. You: "Create a git commit for dark mode"
8. Agent: Commits the changes
```

### Workflow 2: Bug Fix

```
1. You: "Find all console.log statements"
2. Agent: Searches and lists files
3. You: "Replace them with proper logger calls"
4. Agent: Updates all files
5. You: "Add logger import to files that need it"
6. Agent: Updates imports
```

### Workflow 3: Refactoring

```
1. You: "Convert all class components to functional components"
2. Agent: Identifies class components
3. Agent: Converts to hooks
4. Agent: Updates prop types
5. Agent: Tests still pass
```

---

## 📞 Support

If you encounter issues:

1. Check the progress messages for tool execution details
2. Clear conversation history with 🔄 Clear button
3. Try a more specific command
4. Check API key configuration
5. Review browser console for errors

---

## 🚀 Future Enhancements

Planned features:

- [ ] Terminal command execution from agent
- [ ] Multi-file search and replace
- [ ] Automated testing execution
- [ ] Code review mode
- [ ] Collaborative coding sessions
- [ ] Voice commands
- [ ] Custom tool plugins

---

**Built with:**
- [@anthropic-ai/claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code) - Claude Code SDK
- [@anthropic-ai/sdk](https://www.npmjs.com/package/@anthropic-ai/sdk) - Anthropic API
- [Z.AI GLM-4.6](https://zhipu-32152247.mintlify.app/) - GLM model provider
- [Open-VSX](https://open-vsx.org/) - VS Code extensions registry

---

*Last updated: November 29, 2024*
*Version: 2.0.0*
