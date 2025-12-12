# Quick Reference - Browser IDE Pro v2.0

## 🎛️ Interface Controls

### Title Bar Buttons

| Button | Name | Shortcut | Function |
|--------|------|----------|----------|
| 📁 | Sidebar | - | Toggle file explorer |
| 💻 | Terminal | - | Toggle terminal panel |
| 👁️ | Preview | - | Toggle preview panel |
| 🧠 | Claude Code | - | Toggle AI agent panel |
| 🧩 | Extensions | - | Toggle extensions marketplace |
| 📥 Clone | Clone | - | Clone GitHub repository |
| 🤖 AI | AI Chat | - | Simple AI chat (non-agentic) |
| ⚙️ | Settings | - | Open settings dialog |

### Editor Shortcuts

| Shortcut | Function |
|----------|----------|
| Cmd/Ctrl + S | Save current file |
| Cmd/Ctrl + F | Find in file |
| Cmd/Ctrl + H | Replace in file |
| Cmd/Ctrl + / | Toggle comment |

---

## 🧠 Claude Code Agent Commands

### File Operations

```
"Create a new file at src/components/Header.tsx"
"Read the contents of src/App.tsx"
"Delete the old-component.tsx file"
"Rename user.ts to userService.ts"
```

### Code Generation

```
"Create a React hook for fetching user data"
"Generate TypeScript types for the API response"
"Add JSDoc comments to all functions in utils.ts"
"Create a CSS module for the Button component"
```

### Code Modification

```
"Add error handling to the fetchData function"
"Convert this class component to a functional component"
"Refactor to use TypeScript instead of JavaScript"
"Replace all var declarations with const/let"
```

### Search & Analysis

```
"Find all files that import React"
"Search for TODO comments in the project"
"List all TypeScript files in src/components"
"Find functions that don't have error handling"
```

### Git Operations

```
"Show git status"
"Create a commit for authentication changes"
"List recent commits"
"Check which files are modified"
```

---

## 🧩 Extension Marketplace

### Popular Extensions

| Extension | Category | Use Case |
|-----------|----------|----------|
| Prettier | Formatter | Auto-format code |
| ESLint | Linter | Find code issues |
| Python | Language | Python support |
| GitLens | Git | Enhanced git features |
| Tailwind CSS | CSS | Tailwind IntelliSense |

### Quick Actions

- **Search:** Type extension name in search box
- **Filter:** Select category dropdown
- **Install:** Click "Install" button
- **Manage:** Switch to "Installed" tab

---

## ⚙️ Settings Configuration

### Git Settings

```
GitHub Username: your-username
GitHub Email: your@email.com
GitHub Token: ghp_xxxxxxxxxxxx
```

**Get Token:** [GitHub Settings → Tokens](https://github.com/settings/tokens)
**Required Scope:** `repo`

### AI Settings - GLM-4.6

```
Provider: Z.AI GLM
API Key: [Get from Z.AI]
Model: GLM-4.6
```

**Get Key:** [Z.AI API Keys](https://z.ai/manage-apikey/apikey-list)

### AI Settings - Anthropic

```
Provider: Anthropic
API Key: sk-ant-xxxx
Model: Claude Sonnet 4
```

**Get Key:** [Anthropic Console](https://console.anthropic.com/)

### Editor Settings

```
Theme: vs-dark (dark) / vs (light)
Font Size: 14px
Tab Size: 2 spaces
Word Wrap: On
Line Numbers: On
Minimap: On
Auto Save: On (1000ms delay)
```

---

## 🔄 Workflow Examples

### Workflow 1: Clone & Edit

```
1. Click 📥 Clone
2. Enter: https://github.com/username/repo
3. Files appear in explorer (📁)
4. Click file to open
5. Edit in Monaco editor
6. Save with Cmd+S
```

### Workflow 2: AI-Assisted Coding

```
1. Click 🧠 Claude Code
2. Type: "Create a login form component"
3. Agent creates src/components/LoginForm.tsx
4. Review in file explorer
5. Open and customize
6. Agent commits: "Add login form"
```

### Workflow 3: Install Extensions

```
1. Click 🧩 Extensions
2. Search: "prettier"
3. Click "Install" on Prettier
4. Extension cached in browser
5. Use Prettier in Monaco editor
```

### Workflow 4: Run & Preview

```
1. Clone React app
2. Open 💻 Terminal
3. Run: npm install
4. Run: npm start
5. Click 👁️ Preview
6. View running app
```

---

## 📊 Panel Layout

```
┌─────────────────────────────────────────────────────┐
│ 🚀 IDE  📁💻👁️🧠🧩  📥Clone 🤖AI ⚙️            │ Title Bar
├──────────┬──────────────────────────────────────────┤
│          │ 📄 App.tsx  📄 utils.ts  ✕              │ Editor Tabs
│ File     ├──────────────────────────────────────────┤
│ Explorer │                                          │
│          │         Monaco Editor                    │
│ 📂 src   │         (Code editing)                   │
│ 📄 App   │                                          │
├──────────┼──────────────────────────────────────────┤
│          │ 💻Terminal | 👁️Preview | 🧠Claude | 🧩Ext │ Bottom Tabs
│          │ $ npm start                              │
│          │ Server running...                        │
└──────────┴──────────────────────────────────────────┘
```

---

## 🎯 Best Practices

### File Organization

```
src/
├── components/      # React components
├── services/        # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
├── hooks/          # Custom hooks
└── styles/         # CSS/styling
```

### Commit Messages

```
✅ Good:
"Add user authentication with JWT"
"Fix memory leak in WebSocket connection"
"Refactor API service to use async/await"

❌ Bad:
"Update files"
"Fix bug"
"Changes"
```

### Claude Code Commands

```
✅ Specific:
"Add error handling to fetchUser in src/api/user.ts"

❌ Vague:
"Fix the code"
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Styling not loading | Refresh browser (F5) |
| Terminal dimensions error | Already fixed, refresh |
| API key not working | Check key in Settings |
| File not found | Check file path is absolute |
| Git operations fail | Initialize repo first |
| Extension won't install | Check internet connection |
| Agent max iterations | Break task into smaller steps |

---

## 🔑 Keyboard Shortcuts Summary

```
Editor:
Cmd/Ctrl + S       Save file
Cmd/Ctrl + F       Find
Cmd/Ctrl + H       Replace

IDE:
Cmd/Ctrl + B       Toggle sidebar (if implemented)
Cmd/Ctrl + `       Toggle terminal (if implemented)
```

---

## 📚 Documentation Links

- [Full Documentation](./IDE_COMPLETE.md)
- [Claude Code Integration](./CLAUDE_CODE_INTEGRATION.md)
- [Quick Start Guide](./QUICK_START.md)
- [Production Ready](./PRODUCTION_READY.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

## 🆘 Getting Help

1. Check browser console (F12)
2. Review error messages
3. Check API key configuration
4. Read documentation
5. File issue on GitHub

---

**Happy Coding! 🚀**

*Browser IDE Pro v2.0 - The complete IDE in your browser*
