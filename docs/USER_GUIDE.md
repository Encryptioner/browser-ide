# 🚀 Browser IDE Pro v2.0 - User Guide

## 📖 Table of Contents

- [Getting Started](#getting-started)
- [Core Features](#core-features)
- [VS Code Features](#vs-code-features)
- [AI Assistant](#ai-assistant)
- [Terminal & Code Execution](#terminal--code-execution)
- [Git Integration](#git-integration)
- [Project Management](#project-management)
- [Settings & Configuration](#settings--configuration)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Mobile Usage](#mobile-usage)
- [PWA Installation](#pwa-installation)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### System Requirements
- **Browser:** Chrome 90+, Edge 90+, Safari 14+, Firefox 88+
- **Screen Resolution:** 320px (mobile) to 4K+ (desktop)
- **Internet:** Required for AI features and Git operations
- **Storage:** 100MB+ available for projects and data

### First Time Setup

1. **Open the Application**
   ```
   Visit: https://your-domain.com
   Or: http://localhost:5173 (development)
   ```

2. **Configure AI Providers**
   - Click the **Settings** icon (⚙️) in the bottom left
   - Navigate to **AI Providers** tab
   - Add API keys for providers you want to use:
     - **Anthropic Claude:** Get API key from console.anthropic.com
     - **Z.ai GLM-4.6:** Get API key from z.ai
     - **OpenAI:** Get API key from platform.openai.com

3. **Set Up Git**
   - Go to **Settings** → **Git Configuration**
   - Add your GitHub Personal Access Token
   - Configure your name and email

4. **Create Your First Project**
   - Click **New Project** in the sidebar
   - Choose **Empty Project** or **Clone Repository**
   - Give your project a name
   - Start coding!

---

## 🎯 Core Features

### 📁 File Explorer
- **Create files/folders:** Right-click → New File/Folder
- **Rename:** Right-click → Rename or `F2`
- **Delete:** Right-click → Delete or `Del`
- **Copy/Paste:** Right-click → Copy/Paste or `Ctrl+C`/`Ctrl+V`
- **Search:** Use the search bar at the top to filter files

### 📝 Editor
- **Syntax highlighting:** Automatic for 100+ languages
- **IntelliSense:** Smart code completion
- **Error checking:** Real-time linting and type checking
- **Multiple cursors:** `Ctrl+Alt+Click` to add cursors
- **Code folding:** Click the chevrons in the gutter

### 🐛 Debug Panel
- **Breakpoints:** Click in the gutter to set breakpoints
- **Step execution:** Step over, into, out of functions
- **Variable inspection:** Hover over variables to see values
- **Debug console:** Execute code in the current context
- **Call stack:** Navigate the function call hierarchy

### ✂️ Split Editor
- **Split horizontally:** Drag editor tab to bottom
- **Split vertically:** Drag editor tab to right side
- **Move tabs:** Drag and drop to rearrange
- **Maximize panel:** Double-click tab header

### 📋 Problems Panel
- **Real-time errors:** TypeScript, ESLint, and Prettier issues
- **Quick navigation:** Click to jump to error location
- **Filter by severity:** Show only errors, warnings, or info
- **Auto-fix:** Some errors can be fixed automatically

---

## 🔥 VS Code Features

### 🧩 Code Snippets
- **Built-in snippets:** 70+ professional snippets included
- **Trigger with Tab:** Type snippet prefix and press `Tab`
- **Popular examples:**
  - `for` + `Tab` → For loop
  - `if` + `Tab` → If statement
  - `func` + `Tab` → Function declaration
  - `class` + `Tab` → Class definition
  - `try` + `Tab` → Try-catch block

### 💡 IntelliSense
- **Smart completion:** Context-aware suggestions
- **Parameter hints:** See function parameters as you type
- **Quick info:** Hover over symbols for documentation
- **Auto imports:** Automatically import modules
- **Code formatting:** `Shift+Alt+F` to format code

### 🎯 Go to Definition
- **F12** or **Ctrl+Click** on any symbol
- Jump to function definitions, variable declarations
- Works across files and projects

### 🔍 Find References
- **Shift+F12** on any symbol
- Find all usages of a function, variable, or type
- Navigate between references easily

### 🔄 Rename Symbol
- **F2** on any symbol
- Rename variables, functions, and types across all files
- Automatic refactoring maintains code correctness

---

## 🤖 AI Assistant

### Starting a Chat
1. Click the **AI Chat** icon in the sidebar (🤖)
2. Choose your AI provider from the dropdown
3. Type your question or code request
4. Press Enter or click Send

### AI Features
- **Code generation:** Describe what you want to build
- **Bug fixing:** Paste code and ask for fixes
- **Code explanation:** Ask AI to explain complex code
- **Refactoring:** Request code improvements
- **Documentation:** Generate JSDoc comments
- **Testing:** Ask for unit test creation

### Chat Context
- **Project awareness:** AI knows about your current project
- **File context:** Right-click file → "Ask AI about this file"
- **Code selection:** Select code and ask specific questions
- **Session history:** Previous conversations are saved

### Branching Conversations
- **Branch responses:** Create different conversation paths
- **Compare solutions:** See multiple approaches to the same problem
- **Merge branches:** Combine the best parts of different conversations

---

## 🖥️ Terminal & Code Execution

### Terminal Tabs
- **Multiple terminals:** Open unlimited terminal tabs
- **Profiles available:**
  - **Bash:** Default Linux shell
  - **Node.js:** Interactive Node.js REPL
  - **Python:** Python interpreter (when available)
  - **PowerShell:** Windows PowerShell

### Running Commands
- **Package management:** `npm`, `pnpm`, `yarn`
- **Build tools:** `webpack`, `vite`, `rollup`
- **Git commands:** Full git workflow support
- **File operations:** `ls`, `cd`, `mkdir`, `cp`, `mv`

### Code Execution
- **JavaScript/Node.js:** Run `node filename.js`
- **TypeScript:** Run `ts-node filename.ts` (if installed)
- **Build processes:** Run `npm run build`
- **Test suites:** Run `npm test`

### WebContainer Support
- **Isolated environment:** Each project runs in a secure container
- **Node.js modules:** Install packages with `npm install`
- **Full filesystem:** Access to virtual project directory
- **Network access:** Make API calls from your code

---

## 🔀 Git Integration

### Clone Repository
1. Click **Clone Repository** in the sidebar
2. Enter GitHub URL (or GitHub username for auto-suggestion)
3. Enter your GitHub Personal Access Token
4. Choose a local name for the project
5. Wait for cloning to complete

### Git Operations
- **Commit changes:** Stage files and write commit messages
- **Push to remote:** Upload changes to GitHub
- **Pull from remote:** Download latest changes
- **Create branches:** Work on features independently
- **Merge branches:** Combine different work streams
- **View history:** See commit history and changes

### Git Status
- **Modified files:** See which files have changed
- **Untracked files:** New files not yet in git
- **Staged files:** Files ready to commit
- **Commit history:** Browse previous commits

### Branch Management
- **Switch branches:** Easily move between branches
- **Create new branch:** Start working on a new feature
- **Delete branch:** Remove branches you're done with
- **Compare branches:** See differences between branches

---

## 📂 Project Management

### Multiple Projects
- **Unlimited projects:** Work on as many projects as you want
- **Quick switching:** Use the project switcher in the top bar
- **Recent projects:** Quickly access recent work
- **Star projects:** Mark important projects with stars

### Project Types
- **Empty project:** Start fresh with a clean slate
- **Clone repository:** Work on existing GitHub projects
- **Templates:** Pre-configured project starters (coming soon)

### File Management
- **Virtual filesystem:** All files stored in your browser
- **Drag and drop:** Upload files from your computer
- **File uploads:** Import existing projects
- **Export projects:** Download your work as ZIP files

### Project Organization
- **Tags:** Organize projects with custom tags
- **Search:** Find projects quickly with search
- **Sort by:** Name, last opened, or stars
- **Archive:** Hide old projects you're not working on

---

## ⚙️ Settings & Configuration

### Editor Settings
- **Theme:** Choose from VS Code Dark, Light, or High Contrast
- **Font size:** Adjust editor text size
- **Tab size:** Set indentation (2 or 4 spaces recommended)
- **Word wrap:** Toggle line wrapping
- **Line numbers:** Show/hide line numbers
- **Minimap:** Toggle code minimap

### AI Provider Settings
- **API keys:** Securely store your API keys
- **Default model:** Choose your preferred AI model
- **Temperature:** Control AI creativity (0.0-1.0)
- **Max tokens:** Limit response length
- **Custom providers:** Add your own AI providers

### Git Settings
- **GitHub token:** Store your Personal Access Token
- **Default branch:** Set your default branch name
- **Auto-commit:** Configure automatic commits
- **Merge strategy:** Choose merge behavior

### Terminal Settings
- **Default shell:** Choose your preferred shell
- **Font size:** Adjust terminal text size
- **Color scheme:** Select terminal theme
- **Bell:** Toggle terminal bell sound
- **Cursor style:** Choose cursor appearance

### Keyboard Shortcuts
- **View all:** `Ctrl+K Ctrl+S` (or `Cmd+K Cmd+S` on Mac)
- **Customizable:** Create your own keybindings
- **VS Code compatible:** Most VS Code shortcuts work

---

## ⌨️ Keyboard Shortcuts

### Essential Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Find |
| `Ctrl+H` | Replace |
| `Ctrl+G` | Go to line |
| `Ctrl+P` | Quick open file |
| `Ctrl+,` | Open settings |
| `Ctrl+Shift+P` | Command palette |

### Editor Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+X` | Cut line |
| `Ctrl+C` | Copy line |
| `Ctrl+V` | Paste |
| `Ctrl+D` | Select next match |
| `Alt+Up/Down` | Move line up/down |
| `Shift+Alt+F` | Format code |
| `Ctrl+/` | Toggle comment |
| `Ctrl+]` | Indent line |
| `Ctrl+[` | Outdent line |

### Panel Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+\`` | Toggle terminal |
| `Ctrl+J` | Toggle panel focus |
| `Ctrl+B` | Toggle sidebar |
| `F11` | Toggle fullscreen |
| `Ctrl+1-9` | Focus on panel 1-9 |

### Debug Shortcuts
| Shortcut | Action |
|----------|--------|
| `F9` | Toggle breakpoint |
| `F5` | Start debugging |
| `Shift+F5` | Stop debugging |
| `F10` | Step over |
| `F11` | Step into |
| `Shift+F11` | Step out |

---

## 📱 Mobile Usage

### Touch Gestures
- **Tap to focus:** Single tap to focus editor or terminal
- **Double-tap to select:** Double-tap words to select them
- **Pinch to zoom:** Zoom in/out of the editor
- **Swipe to navigate:** Swipe between tabs and panels

### Mobile Keyboard
- **Symbol panel:** Access special characters easily
- **Code keyboard:** Optimized layout for programming
- **Voice input:** Use voice-to-text for comments (experimental)
- **External keyboard:** Full keyboard support for tablets

### Mobile UI
- **Bottom navigation:** Easy thumb access to main features
- **Floating action button:** Quick access to common actions
- **Slide-out panels:** Maximize screen real estate
- **Responsive design:** Adapts to any screen size

### Performance Tips
- **Use external keyboard:** For serious coding sessions
- **Close unused tabs:** Keep only essential files open
- **Enable airplane mode:** When not using AI features
- **Use Wi-Fi:** More reliable than mobile data

---

## 📲 PWA Installation

### Desktop Installation
1. **Open in Chrome or Edge**
2. **Look for install icon** (⊕) in address bar
3. **Click "Install"** to add to desktop/applications
4. **Launch from desktop** like any other app

### Mobile Installation (iOS)
1. **Open in Safari**
2. **Tap Share button** (square with arrow)
3. **Select "Add to Home Screen"**
4. **Tap "Add"** to confirm
5. **Launch from Home Screen** like any app

### Mobile Installation (Android)
1. **Open in Chrome**
2. **Tap menu button** (three dots)
3. **Select "Install app"** or "Add to Home screen"
4. **Tap "Install"** to confirm
5. **Launch from app drawer**

### PWA Benefits
- **Offline access:** Work without internet connection
- **Full screen:** No browser chrome for maximum workspace
- **Background updates:** Automatic updates when online
- **Notifications:** Get alerts for build completions (coming soon)
- **Native feel:** Feels like a desktop application

---

## 🐛 Troubleshooting

### Common Issues

#### **AI Features Not Working**
- **Check API key:** Ensure API key is valid and has credits
- **Check internet:** AI features require internet connection
- **Provider status:** Some providers may be temporarily down
- **Rate limits:** You may have hit usage limits

#### **Git Operations Failing**
- **Check token:** Verify GitHub Personal Access Token is valid
- **Permissions:** Ensure token has required permissions
- **Repository access:** Make sure repository exists and is accessible
- **Network:** Check internet connection and firewall settings

#### **Terminal Commands Not Working**
- **WebContainer support:** Requires Chrome or Edge (not Firefox)
- **Node.js modules:** Run `npm install` for missing packages
- **Permissions:** Some commands may be restricted in browser
- **Network:** External network calls may be blocked

#### **Performance Issues**
- **Large files:** Avoid opening very large files (>1MB)
- **Memory usage:** Close unused tabs and restart if slow
- **Browser extensions:** Some extensions may interfere
- **Device specs:** Performance depends on your device capabilities

### Debug Mode
1. **Open Developer Tools:** `F12` or right-click → Inspect
2. **Check Console:** Look for error messages
3. **Network tab:** Monitor API calls and responses
4. **Application tab:** Check IndexedDB storage and settings

### Reset & Recovery
- **Clear browser data:** Clear site data if app is not working
- **Reset settings:** Use Settings → Reset to restore defaults
- **Export projects:** Backup your work before clearing data
- **Contact support:** Create GitHub issue for persistent problems

### Getting Help
- **GitHub Issues:** Report bugs and request features
- **Documentation:** Check this guide and README
- **Community:** Join Discord for community support
- **Email:** Contact support@browser-ide.dev

---

## 💡 Pro Tips

### Productivity
- **Keyboard shortcuts:** Learn shortcuts to work faster
- **Command palette:** `Ctrl+Shift+P` for quick access
- **Multiple cursors:** Use `Ctrl+Alt+Click` for bulk editing
- **Snippets:** Create custom snippets for repetitive code

### AI Collaboration
- **Be specific:** Clear, detailed prompts get better results
- **Context matters:** Select relevant code when asking questions
- **Iterate:** Refine AI responses with follow-up questions
- **Learn from AI:** Ask AI to explain solutions to learn

### Project Organization
- **Use descriptive names:** Clear project and file names
- **Tag projects:** Organize work with custom tags
- **Regular commits:** Commit frequently with clear messages
- **Documentation:** Write good README files for your projects

### Performance
- **Close unused tabs:** Keep only essential files open
- **Use split editor:** Compare files side-by-side efficiently
- **Leverage AI:** Use AI for code reviews and optimizations
- **Offline mode:** Work offline when internet is slow

---

## 🎓 Next Steps

### Tutorials
- **Beginner's guide:** Learn the basics step by step
- **AI workflows:** Master AI-assisted development
- **Git integration:** Version control best practices
- **Advanced debugging:** Professional debugging techniques

### Extensions
- **Coming soon:** Plugin system for custom functionality
- **Community extensions:** Share and discover extensions
- **Custom themes:** Create and share color schemes
- **Language support:** Add new languages and tools

### Community
- **GitHub:** Contribute to the project
- **Discord:** Join the developer community
- **Blog:** Read tutorials and announcements
- **YouTube:** Watch video tutorials and demos

---

**Happy coding! 🎉**

*Made with ❤️ for developers who code anywhere, anytime.*

*Last Updated: December 2024*
*Version: 2.0.0*