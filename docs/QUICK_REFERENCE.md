# ⚡ Browser IDE Pro v2.0 - Quick Reference

## 🚀 Getting Started

### First Time Setup
1. **Open app** → Click **Settings** (⚙️)
2. **Add AI Keys** → AI Providers tab → Add API keys
3. **Configure Git** → Git tab → Add GitHub token
4. **Create Project** → New Project → Choose type

### Daily Workflow
```
Open App → Select Project → Start Coding
         → AI Chat → Get Help
         → Terminal → Run Commands
         → Debug → Fix Issues
```

---

## 🎯 Essential Features

### File Operations
| Action | Shortcut | Method |
|--------|----------|--------|
| New File | `Ctrl+N` | File Explorer → Right-click → New File |
| Save | `Ctrl+S` | File menu → Save |
| Find in File | `Ctrl+F` | Search bar |
| Global Search | `Ctrl+Shift+F` | Command Palette → "Search" |

### Navigation
| Action | Shortcut | Description |
|--------|----------|---------|
| Go to Definition | `F12` | Jump to function/variable definition |
| Find References | `Shift+F12` | Find all uses of symbol |
| Quick Open | `Ctrl+P` | Open any file by name |
| Go to Line | `Ctrl+G` | Jump to specific line number |
| Command Palette | `Ctrl+Shift+P` | Search all commands |

### Editor Actions
| Action | Shortcut | Description |
|--------|----------|---------|
| Undo/Redo | `Ctrl+Z/Y` | Undo/Redo changes |
| Cut/Copy/Paste | `Ctrl+X/C/V` | Standard clipboard |
| Duplicate Line | `Shift+Alt+Up/Down` | Copy line up/down |
| Comment Line | `Ctrl+/` | Toggle line comment |
| Format Code | `Shift+Alt+F` | Format entire document |

---

## 🤖 AI Assistant

### Start AI Chat
1. Click **AI Chat** icon (🤖) in sidebar
2. Choose AI provider (Claude, GLM, OpenAI)
3. Type your question or request
4. Press Enter to send

### Common AI Prompts
```
"Explain this function" + select code
"Refactor this code to be more efficient"
"Add TypeScript types to this JavaScript"
"Write tests for this function"
"Fix this error" + paste error
"Create a React component for..."
```

### AI Context Features
- **File context:** Right-click file → "Ask AI about this file"
- **Selection context:** Select code → ask specific questions
- **Project awareness:** AI knows your current project structure

---

## 🐛 Debugging

### Set Breakpoints
- **Line breakpoint:** Click in editor gutter (left margin)
- **Conditional breakpoint:** Right-click gutter → Add conditional breakpoint
- **Logpoint:** Right-click gutter → Add logpoint

### Debug Controls
| Action | Shortcut | Description |
|--------|----------|---------|
| Start Debugging | `F5` | Run with debugger |
| Stop Debugging | `Shift+F5` | End debug session |
| Step Over | `F10` | Execute next line |
| Step Into | `F11` | Enter function |
| Step Out | `Shift+F11` | Exit current function |

### Debug Panel
- **Variables:** View and edit variable values
- **Watch:** Monitor expressions during debugging
- **Call Stack:** See function call hierarchy
- **Debug Console:** Execute code in debug context

---

## 💻 Terminal

### Terminal Tabs
- **New Tab:** Click `+` in terminal panel
- **Switch Tabs:** Click tab headers
- **Close Tab:** Click `×` on tab

### Common Commands
```bash
# Package management
npm install <package>        # Install package
npm run <script>              # Run script
npm test                      # Run tests

# Git operations
git status                    # Check status
git add .                     # Stage all changes
git commit -m "message"       # Commit changes
git push                      # Push to remote
git pull                      # Pull from remote

# File operations
ls                           # List files
cd <directory>               # Change directory
mkdir <folder>               # Create folder
cp <src> <dest>              # Copy file
mv <src> <dest>              # Move file
```

### Terminal Profiles
- **Bash:** Default Linux shell
- **Node.js:** JavaScript REPL
- **Python:** Python interpreter (if available)
- **PowerShell:** Windows PowerShell

---

## 🔀 Git Integration

### Clone Repository
1. Click **Clone Repository** in sidebar
2. Enter GitHub URL or username
3. Add GitHub Personal Access Token
4. Choose local project name
5. Wait for clone to complete

### Daily Git Workflow
```bash
# Start working
git checkout -b feature-name    # Create new branch
git status                      # Check current status
git add .                       # Stage all changes
git commit -m "feat: add feature" # Commit with message
git push origin feature-name     # Push to remote

# When done
git checkout main               # Switch back to main
git merge feature-name          # Merge feature branch
git push origin main            # Push merged changes
```

### Git Status Indicators
- **M:** Modified file
- **A:** Added file (staged)
- **D:** Deleted file
- **??:** Untracked file
- **U:** Conflict file

---

## ⚙️ Essential Settings

### Editor Settings (Settings → Editor)
- **Font Size:** Adjust text size (recommend 14-16)
- **Tab Size:** Set indentation (recommend 2-4)
- **Word Wrap:** Toggle line wrapping
- **Line Numbers:** Show/hide line numbers
- **Minimap:** Toggle code minimap

### AI Provider Settings (Settings → AI Providers)
- **API Keys:** Add your API keys securely
- **Default Model:** Choose preferred AI model
- **Temperature:** Control AI creativity (0.0-1.0)
- **Max Tokens:** Limit response length

### Git Settings (Settings → Git)
- **GitHub Token:** Personal Access Token
- **User Name:** Your GitHub name
- **User Email:** Your GitHub email
- **Default Branch:** main or master

---

## 📱 Mobile Usage

### Touch Gestures
- **Tap:** Focus editor/terminal
- **Double-tap:** Select word
- **Pinch:** Zoom in/out
- **Swipe:** Navigate between panels

### Mobile Keyboard
- **Access Symbol Panel:** Tap `(123)` key
- **Access Code Symbols:** Use symbol keyboard
- **Voice Input:** Use microphone for comments

### Mobile Navigation
- **Bottom Navigation:** Quick access to main features
- **Hamburger Menu:** Access sidebar
- **Floating Action Button:** Quick actions

---

## 🎯 Code Snippets

### JavaScript/TypeScript
Type prefix + **Tab** to expand:

| Prefix | Result |
|---------|--------|
| `for` | `for (let i = 0; i < array.length; i++) { }` |
| `func` | `function name(parameters) { }` |
| `arrow` | `const name = (parameters) => { }` |
| `class` | `class ClassName { }` |
| `try` | `try { } catch (error) { }` |
| `if` | `if (condition) { }` |
| `import` | `import name from 'module'` |
| `export` | `export default name` |

### React
| Prefix | Result |
|---------|--------|
| `component` | `function Component() { return (<div></div>) }` |
| `useeffect` | `useEffect(() => { }, [])` |
| `usestate` | `const [state, setState] = useState()` |
| `usememo` | `useMemo(() => value, [dependencies])` |

### HTML
| Prefix | Result |
|---------|--------|
| `html` | `<!DOCTYPE html><html>...</html>` |
| `div` | `<div className=""></div>` |
| `button` | `<button onClick={() => { }}></button>` |
| `input` | `<input type="" value="" onChange={() => { }} />` |

### CSS
| Prefix | Result |
|---------|--------|
| `flex` | `display: flex; justify-content: center; align-items: center;` |
| `grid` | `display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));` |
| `margin` | `margin: 0; padding: 0;` |

---

## 🔍 Search & Replace

### File Search
- **Find in Current File:** `Ctrl+F`
- **Replace in Current File:** `Ctrl+H`
- **Find in All Files:** `Ctrl+Shift+F`
- **Replace in All Files:** `Ctrl+Shift+H`

### Search Options
- **Case Sensitive:** Match exact case
- **Whole Word:** Match complete words
- **Regular Expression:** Use regex patterns
- **Preserve Case:** Keep original case when replacing

### File Filters
- **Include:** Specify file patterns to search (`*.js`, `*.ts`)
- **Exclude:** Specify patterns to ignore (`node_modules`, `.git`)
- **File Types:** Search only specific file types

---

## 🎨 Themes & Appearance

### Built-in Themes
- **VS Code Dark:** Default dark theme
- **VS Code Light:** Light theme variant
- **High Contrast:** Accessibility theme

### Custom Themes
- **Install:** Settings → Color Theme → Select theme
- **Create:** Custom CSS overrides (advanced)
- **Import:** VS Code theme files

### Font Options
- **Font Family:** Choose programming font
- **Font Size:** Adjust text size (12-24 recommended)
- **Line Height:** Adjust spacing between lines
- **Font Ligatures:** Enable programming ligatures

---

## 💡 Pro Tips

### Productivity
- **Learn shortcuts:** Master `Ctrl+Shift+P` command palette
- **Multiple cursors:** Use `Ctrl+Alt+Click` for bulk editing
- **Split editor:** Drag tabs to create multiple views
- **Pin tabs:** Keep important files always open

### AI Usage
- **Be specific:** Detailed prompts get better results
- **Provide context:** Select relevant code when asking
- **Iterate:** Refine AI responses with follow-up questions
- **Use for learning:** Ask AI to explain complex concepts

### Git Best Practices
- **Commit often:** Small, frequent commits
- **Write good messages:** Describe what and why
- **Use branches:** Work on features separately
- **Pull before pushing:** Avoid conflicts

### Debugging
- **Set strategic breakpoints:** Don't set too many
- **Use logpoints:** For debugging without stopping
- **Watch expressions:** Monitor specific variables
- **Use debug console:** Test code while debugging

---

## 🐛 Troubleshooting

### Common Issues

**AI not working:**
- Check API key in Settings → AI Providers
- Verify internet connection
- Check API key has credits

**Git operations failing:**
- Verify GitHub token in Settings → Git
- Check token has required permissions
- Ensure repository exists and is accessible

**Terminal commands not working:**
- Ensure you're using Chrome or Edge (not Firefox)
- Check if required packages are installed (`npm install`)
- Some commands may be restricted in browser

**Performance issues:**
- Close unused file tabs
- Clear browser cache if app is slow
- Restart app if it becomes unresponsive

### Quick Fixes
- **Reset settings:** Settings → Reset to defaults
- **Clear cache:** Clear browser data for the site
- **Restart:** Close and reopen the app
- **Update:** Ensure you're using latest version

---

## 📞 Help & Support

### Getting Help
- **Command Palette:** `Ctrl+Shift+P` → "Help"
- **Documentation:** Click Help (?) icon
- **Keyboard shortcuts:** `Ctrl+K Ctrl+S` to view all shortcuts
- **Report issues:** GitHub Issues page

### Keyboard Shortcuts
- **View all:** `Ctrl+K Ctrl+S` (or `Cmd+K Cmd+S`)
- **Customize:** Settings → Keyboard Shortcuts
- **VS Code compatible:** Most VS Code shortcuts work

---

**🎉 Happy coding with Browser IDE Pro!**

*Last Updated: December 2024*
*Version: 2.0.0*