import React, { useState, useMemo } from 'react';
import { Search, Book, Zap, Code, Terminal, HelpCircle, X, ExternalLink, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useIDEStore } from '@/store/useIDEStore';

interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: string;
  estimatedReadTime: string;
  targetAudience: string[];
}

interface DocumentationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  sections: DocumentationSection[];
}

const DOCUMENTATION_CATEGORIES: DocumentationCategory[] = [
  {
    id: 'quick',
    name: 'Quick Start',
    icon: <Zap className="w-4 h-4" />,
    sections: [
      {
        id: 'quick-reference',
        title: '⚡ Quick Reference',
        description: 'Essential shortcuts, daily workflows, and quick fixes',
        icon: <Zap className="w-4 h-4" />,
        content: `
# ⚡ Quick Reference - 5 Minute Essential Guide

## 🚀 Getting Started

### Daily Workflow
1. **Open App** → Select Project → Start Coding
2. **AI Chat** → Get help when stuck
3. **Terminal** → Run commands and build tools
4. **Debug** → Fix issues efficiently

## ⌨️ Essential Shortcuts

| Action | Shortcut | Description |
|---------|----------|---------|
| Save File | \`Ctrl+S\` | Save current file |
| Find in File | \`Ctrl+F\` | Search within file |
| Global Search | \`Ctrl+Shift+F\` | Search across all files |
| Quick Open | \`Ctrl+P\` | Open any file by name |
| Command Palette | \`Ctrl+Shift+P\` | Search all commands |
| Go to Definition | \`F12\` | Jump to symbol definition |
| Find References | \`Shift+F12\` | Find all usages |
| Format Code | \`Shift+Alt+F\` | Format document |

## 🤖 AI Assistant

### Start AI Chat
1. Click **AI Chat** icon (🤖) in sidebar
2. Choose AI provider
3. Type your question
4. Press Enter to send

### Common AI Prompts
- "Explain this function" + select code
- "Refactor this code to be more efficient"
- "Add TypeScript types to this JavaScript"
- "Write tests for this function"
- "Fix this error" + paste error

## 🐛 Debugging

### Set Breakpoints
- Click in editor gutter (left margin)
- Right-click for conditional breakpoints
- Use F5 to start debugging

### Debug Controls
- **F5:** Start debugging
- **F10:** Step over
- **F11:** Step into
- **Shift+F11:** Step out
- **Shift+F5:** Stop debugging

## 💻 Terminal

### Common Commands
\`\`\`bash
# Package management
npm install <package>
npm run <script>
npm test

# Git operations
git status
git add .
git commit -m "message"
git push
git pull
\`\`\`

## 🔀 Git Integration

### Clone Repository
1. Click **Clone Repository** in sidebar
2. Enter GitHub URL or username
3. Add GitHub Personal Access Token
4. Choose local project name

### Daily Git Workflow
\`\`\`bash
git checkout -b feature-name    # Create new branch
git add .                       # Stage all changes
git commit -m "feat: add feature" # Commit with message
git push origin feature-name     # Push to remote
\`\`\`
        `,
        estimatedReadTime: '5 min',
        targetAudience: ['Everyone']
      }
    ]
  },
  {
    id: 'user-guide',
    name: 'User Guide',
    icon: <Book className="w-4 h-4" />,
    sections: [
      {
        id: 'getting-started',
        title: '🎯 Getting Started',
        description: 'Complete setup guide for new users',
        icon: <Terminal className="w-4 h-4" />,
        content: `
# 🎯 Getting Started - Complete Setup Guide

## 📋 System Requirements

- **Browser:** Chrome 90+, Edge 90+, Safari 14+, Firefox 88+
- **Screen Resolution:** 320px (mobile) to 4K+ (desktop)
- **Internet:** Required for AI features and Git operations
- **Storage:** 100MB+ available for projects and data

## 🚀 First Time Setup

### 1. Open the Application
Visit [https://your-domain.com](https://your-domain.com) in your browser.
The application works entirely in your browser - no installation required!

### 2. Configure AI Providers
1. Click the **Settings** icon (⚙️) in the bottom left
2. Navigate to the **AI Providers** tab
3. Add API keys for providers you want to use:

**Anthropic Claude:**
- Get API key from [console.anthropic.com](https://console.anthropic.com)
- Supports Claude Sonnet 4.5, Opus 4, Haiku 4

**Z.ai GLM-4.6:**
- Get API key from [z.ai](https://z.ai)
- 200K context window, excellent for coding

**OpenAI:**
- Get API key from [platform.openai.com](https://platform.openai.com)
- Supports GPT-4 Turbo, GPT-4, GPT-3.5 Turbo

### 3. Set Up Git (Optional but Recommended)
1. Go to **Settings** → **Git Configuration**
2. Add your GitHub Personal Access Token
3. Configure your name and email
4. Test connection with a test repository

### 4. Create Your First Project

#### Option A: Empty Project
1. Click **New Project** in the sidebar
2. Choose **Empty Project**
3. Give your project a name
4. Select programming language/framework
5. Click **Create**

#### Option B: Clone Repository
1. Click **Clone Repository** in the sidebar
2. Enter GitHub URL or search by username
3. Choose a local name for the project
4. Wait for cloning to complete

### 5. Start Coding!
- **File Explorer:** Create and manage files
- **Editor:** Write code with syntax highlighting
- **AI Chat:** Get help when you're stuck
- **Terminal:** Run commands and build tools
- **Git:** Version control your changes

## 🎨 Customizing Your Experience

### Editor Settings
1. **Settings** → **Editor**
2. Adjust:
   - Font size (12-24 recommended)
   - Theme (Dark, Light, High Contrast)
   - Tab size (2 or 4 spaces)
   - Word wrap preference
   - Line numbers visibility
   - Minimap toggle

### Keyboard Shortcuts
1. **Settings** → **Keyboard Shortcuts**
2. View all available shortcuts
3. Customize keybindings to your preference
4. Import VS Code keybindings if desired

### AI Configuration
1. **Settings** → **AI Providers**
2. Set your preferred default provider
3. Adjust temperature (0.0-1.0) for creativity
4. Set max token limits for responses
5. Configure custom providers if needed

## 📱 Mobile Setup

### Installing as PWA
**iOS:**
1. Open in Safari
2. Tap Share button (square with arrow)
3. Select "Add to Home Screen"
4. Tap "Add"

**Android:**
1. Open in Chrome
2. Tap menu button (three dots)
3. Select "Install app" or "Add to Home screen"
4. Tap "Install"

### Mobile Optimizations
- Use bottom navigation for quick access
- Enable on-screen keyboard for coding
- Use floating action button for common tasks
- Swipe between panels for navigation

## 🔧 Next Steps

1. **Explore Features:** Browse the [Complete Features Guide](#features)
2. **Learn Shortcuts:** Master the command palette (\`Ctrl+Shift+P\`)
3. **Try AI Assistant:** Ask it to help build a small project
4. **Set Up Git:** Create your first repository
5. **Join Community:** Get help and share tips with other users

**Welcome to Browser IDE Pro! Happy coding! 🎉**
        `,
        estimatedReadTime: '10 min',
        targetAudience: ['New Users']
      },
      {
        id: 'core-features',
        title: '📂 Core Features',
        description: 'File explorer, editor, and essential tools',
        icon: <Code className="w-4 h-4" />,
        content: `
# 📂 Core Features - Essential IDE Tools

## 📁 File Explorer

### Basic Operations
- **Create Files:** Right-click → New File or \`Ctrl+N\`
- **Create Folders:** Right-click → New Folder
- **Rename:** Right-click → Rename or \`F2\`
- **Delete:** Right-click → Delete or \`Del\` key
- **Copy/Paste:** Right-click → Copy/Paste or \`Ctrl+C\`/\`Ctrl+V\`

### Advanced Features
- **Drag & Drop:** Upload files from your computer
- **Search:** Use search bar to filter files
- **File Preview:** Click file to see quick preview
- **Context Menu:** Right-click for more options
- **Bulk Operations:** Select multiple files with \`Ctrl+Click\`

### File Icons
The file explorer shows visual indicators:
- 📁 **Folders:** Yellow directory icons
- 📄 **Text Files:** White document icons
- 🟨 **JavaScript:** Yellow JS icons
- 🔷 **TypeScript:** Blue TS icons
- 🎨 **CSS:** Purple CSS icons
- ⚛️ **React:** Blue React atom icons
- 🟢 **HTML:** Green HTML icons

## 📝 Editor

### Text Editing
- **Multi-cursor:** \`Ctrl+Alt+Click\` to add cursors
- **Column Selection:** \`Shift+Alt+Drag\` for rectangular selection
- **Line Operations:** \`Ctrl+D\` to duplicate lines
- **Comment Toggle:** \`Ctrl+/\` for line comments
- **Move Lines:** \`Alt+Up/Down\` to move lines

### Code Navigation
- **Go to Line:** \`Ctrl+G\` to jump to line number
- **Go to Definition:** \`F12\` or \`Ctrl+Click\` on symbols
- **Find References:** \`Shift+F12\` on any symbol
- **Symbol Search:** \`Ctrl+Shift+O\` for file symbols
- **Global Symbol Search:** \`Ctrl+T\` for workspace symbols

### IntelliSense
- **Auto-completion:** Type to see suggestions
- **Parameter Hints:** See function parameters as you type
- **Quick Info:** Hover over symbols for documentation
- **Error Checking:** Real-time syntax and type errors
- **Auto Imports:** Suggest imports for undefined symbols

### Code Formatting
- **Format Document:** \`Shift+Alt+F\` to format entire file
- **Format Selection:** Select text and format
- **Auto Format:** Format on save (configurable)
- **Language Support:** JavaScript, TypeScript, HTML, CSS, Python, and more

## 🪟 Panel System

### Bottom Panels
- **Terminal:** Command line interface
- **AI Chat:** AI assistant for help
- **Problems:** Error and warning list
- **Output:** Build tool output
- **Debug Console:** Debugging output
- **Search Results:** Global search results

### Panel Management
- **Toggle Panels:** Click panel tabs or use keyboard shortcuts
- **Resize Panels:** Drag panel borders
- **Move Panels:** Drag tabs to rearrange
- **Close Panels:** Click X on tab headers
- **Maximize Panels:** Double-click tab headers

### Side Bar
- **Explorer:** File and folder management
- **Search:** Global file and content search
- **Git:** Source control operations
- **Run:** Task runner and debugging
- **Extensions:** Manage IDE extensions
- **AI Assistant:** AI-powered development help

## 🔍 Search and Replace

### File Search
- **Current File:** \`Ctrl+F\` for in-file search
- **Replace in File:** \`Ctrl+H\` for find/replace
- **Global Search:** \`Ctrl+Shift+F\` to search all files
- **Global Replace:** \`Ctrl+Shift+H\` to replace across files

### Search Options
- **Case Sensitive:** Match exact case
- **Whole Word:** Match complete words only
- **Regular Expression:** Use regex patterns
- **Include:** Search only specific file types
- **Exclude:** Skip certain files and folders

### Search Features
- **Live Results:** See matches as you type
- **Preview Matches:** Hover to see context
- **Quick Navigation:** Click results to jump to file
- **Replace All:** Replace matches in multiple files

## ⚙️ Status Bar

### Information Display
- **Git Status:** Current branch and changes
- **Cursor Position:** Line and column number
- **Encoding:** File character encoding
- **File Type:** Current language/mode
- **Errors/Warnings:** Number of detected issues
- **AI Status:** Connection and usage information

### Interactive Elements
- **Branch Switcher:** Click to change Git branch
- **Language Mode:** Click to change file language
- **Problems Count:** Click to open problems panel
- **AI Status:** Click to configure AI providers

## 🎨 Customization

### Themes
- **VS Code Dark:** Default dark theme
- **VS Code Light:** Light theme variant
- **High Contrast:** Accessibility theme
- **Custom Themes:** Import your own themes

### Font Settings
- **Font Family:** Choose programming fonts
- **Font Size:** Adjust text size (12-24 recommended)
- **Font Weight:** Adjust text thickness
- **Font Ligatures:** Enable programming ligatures
- **Line Height:** Adjust spacing between lines

These core features provide a complete coding environment that works seamlessly across desktop and mobile devices!
        `,
        estimatedReadTime: '15 min',
        targetAudience: ['New Users', 'Intermediate Users']
      }
    ]
  },
  {
    id: 'features',
    name: 'Advanced Features',
    icon: <Code className="w-4 h-4" />,
    sections: [
      {
        id: 'ai-features',
        title: '🤖 AI Assistant',
        description: 'Advanced AI capabilities and multi-LLM support',
        icon: <HelpCircle className="w-4 h-4" />,
        content: `
# 🤖 AI Assistant - Advanced AI Capabilities

## 🎯 Supported AI Providers

### Anthropic Claude
- **Claude Sonnet 4.5:** Advanced reasoning, fast responses
- **Claude Opus 4:** Highest quality, detailed analysis
- **Claude Haiku 4:** Fastest responses, simple tasks
- **Strengths:** Superior reasoning, large context window

### Z.ai GLM-4.6
- **GLM-4.6:** 200K context, excellent for large codebases
- **GLM-4.6 Turbo:** Faster responses, good balance
- **Strengths:** Cost-effective, strong coding abilities

### OpenAI
- **GPT-4 Turbo:** Fast responses, high quality
- **GPT-4:** Excellent reasoning, detailed responses
- **GPT-3.5 Turbo:** Quick responses, simple tasks
- **Strengths:** Fast, widely available, good for most tasks

### Custom Providers
- Add any OpenAI-compatible provider
- Custom endpoints and models
- Flexible configuration options

## 💬 AI Chat Features

### Session Management
- **Multiple Sessions:** Parallel conversations per project
- **Session History:** Browse previous conversations
- **Branching:** Explore different approaches to the same problem
- **Pin Sessions:** Keep important conversations easily accessible
- **Export/Import:** Save and share conversations

### Context Awareness
- **Project Context:** AI knows about your current project structure
- **File Context:** Ask AI about specific files (right-click file)
- **Selection Context:** Select code for targeted assistance
- **Error Context:** Paste error messages for automatic explanations

### Advanced Features
- **Code Generation:** Natural language to working code
- **Bug Fixing:** Automatic bug detection and fixes
- **Code Review:** AI-powered code quality analysis
- **Documentation Generation:** Auto-generate JSDoc and README files
- **Test Generation:** Create unit tests automatically
- **Refactoring:** Code improvement suggestions
- **Performance Optimization:** Code performance analysis

## 🚀 AI-Powered Development

### Smart Code Completion
- **Context-Aware Suggestions:** Based on project structure
- **Multi-Language Support:** Works with all programming languages
- **Learning Patterns:** Adapts to your coding style
- **Import Suggestions:** Automatically suggest module imports

### Error Resolution
- **Automatic Fixes:** AI suggests solutions for common errors
- **Explanation:** Understand why errors occur
- **Best Practices:** AI recommends better approaches
- **Stack Trace Analysis:** Debug complex errors with AI help

### Code Improvement
- **Refactoring Suggestions:** Make code more efficient
- **Style Improvements:** Follow coding standards
- **Type Safety:** Add TypeScript types to JavaScript
- **Performance Optimizations:** Identify bottlenecks and suggest fixes

## 💡 AI Usage Best Practices

### Effective Prompts
- **Be Specific:** Clear, detailed requests get better results
- **Provide Context:** Share relevant code and project details
- **Iterate:** Refine AI responses with follow-up questions
- **Use Examples:** Show AI what you want with code examples

### Code Review Workflow
1. **Paste Code:** Share code you want reviewed
2. **Ask Specific Questions:** "Is this secure?", "Can this be optimized?"
3. **Request Improvements:** "How can I make this more readable?"
4. **Test Suggestions:** Verify AI recommendations before applying

### Learning with AI
- **Ask for Explanations:** Understand complex code
- **Request Alternatives:** Learn different approaches to problems
- **Get Step-by-Step Help:** Break down complex tasks
- **Use as Tutor:** Learn new concepts and technologies

## 🔄 AI Provider Configuration

### Setup Instructions
1. **Settings** → **AI Providers** tab
2. **Add API Keys:** Enter keys for each provider
3. **Set Default:** Choose your preferred provider
4. **Configure Settings:** Adjust temperature and limits

### Temperature Settings
- **0.0-0.3:** Precise, factual responses
- **0.4-0.7:** Balanced creativity and accuracy
- **0.8-1.0:** Creative, exploratory responses

### Usage Monitoring
- **Token Counting:** Track API usage and costs
- **Rate Limits:** Monitor provider rate limits
- **Response Quality:** Compare results across providers

## 🎯 AI Workflows

### Feature Development
1. **Plan:** Ask AI to help plan implementation
2. **Implement:** Use AI for code generation
3. **Review:** AI code review and suggestions
4. **Test:** AI-generated test cases
5. **Document:** AI documentation generation

### Bug Solving
1. **Describe Issue:** Explain the problem clearly
2. **Share Code:** Include relevant code snippets
3. **Debug Together:** Work through solutions with AI
4. **Verify:** Test AI-suggested fixes
5. **Learn:** Understand the root cause

### Learning New Technologies
1. **Ask Questions:** Get explanations of concepts
2. **Request Examples:** See code demonstrations
3. **Practice:** Complete AI-generated exercises
4. **Build Projects:** Apply knowledge with AI guidance
5. **Get Feedback:** AI review of your implementations

The AI assistant transforms Browser IDE Pro into an intelligent coding companion that accelerates development and enhances learning!
        `,
        estimatedReadTime: '20 min',
        targetAudience: ['All Users']
      },
      {
        id: 'vscode-features',
        title: '🎯 VS Code Features',
        description: 'Complete VS Code feature implementation',
        icon: <Code className="w-4 h-4" />,
        content: `
# 🎯 VS Code Features - Complete Implementation

Browser IDE Pro implements **100% of the most popular VS Code features**:

## ✅ Core VS Code Features

### 1. Syntax Highlighting
- **100+ Languages:** JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more
- **Accurate Highlighting:** Professional-level syntax recognition
- **Theme Support:** Consistent highlighting across all themes
- **Performance:** Fast highlighting for large files

### 2. IntelliSense (Smart Code Completion)
- **Type-Aware:** Understands types and interfaces
- **Context-Sensitive:** Provides relevant suggestions
- **Auto-Imports:** Automatically imports modules
- **Parameter Hints:** Shows function parameters as you type
- **Quick Info:** Hover for documentation and types

### 3. Code Navigation
- **Go to Definition:** \`F12\` or \`Ctrl+Click\` on any symbol
- **Find All References:** \`Shift+F12\` to locate all usages
- **Symbol Search:** \`Ctrl+Shift+O\` for file symbols
- **Workspace Symbol Search:** \`Ctrl+T\` for project-wide symbols
- **Go to Line:** \`Ctrl+G\` to jump to line number

### 4. Multi-Cursor Editing
- **Multiple Cursors:** \`Ctrl+Alt+Click\` to add cursors
- **Column Selection:** \`Shift+Alt+Drag\` for rectangular selection
- **Cursor Cloning:** \`Ctrl+D\` to duplicate cursors
- **Cursor Movement:** \`Ctrl+Alt+Up/Down\` to move cursors

### 5. Code Snippets (70+ Built-in)
#### JavaScript/TypeScript Snippets
- **\`for\` + Tab:** Generate for loop
- **\`func\` + Tab:** Create function
- **\`class\` + Tab:** Generate class
- **\`try\` + Tab:** Create try-catch block
- **\`import\` + Tab:** Import module

#### React Snippets
- **\`component\` + Tab:** React function component
- **\`useeffect\` + Tab:** useEffect hook
- **\`usestate\` + Tab:** useState hook
- **\`usememo\` + Tab:** useMemo hook

#### HTML/CSS Snippets
- **\`html\` + Tab:** HTML5 template
- **\`div\` + Tab:** Create div with className
- **\`button\` + Tab:** Create button with onClick
- **\`flex\` + Tab:** Flexbox CSS layout

### 6. Split Editor Layouts
- **Multiple Panels:** Drag tabs to create splits
- **Flexible Layouts:** Horizontal and vertical splits
- **Tab Management:** Drag to reorder tabs
- **Group Editing:** Edit related files side-by-side
- **Layout Presets:** Common layout configurations

### 7. Integrated Terminal
- **Multiple Terminals:** Unlimited terminal tabs
- **Terminal Profiles:** Bash, Node.js, Python, PowerShell
- **Command History:** Search and replay previous commands
- **Process Management:** Monitor and control running processes
- **Custom Profiles:** Create your own terminal configurations

### 8. Advanced Debugger
#### Breakpoint Management
- **Line Breakpoints:** Click in editor gutter
- **Conditional Breakpoints:** Break when condition is true
- **Hit Count Breakpoints:** Break after N hits
- **Logpoints:** Log messages without breaking execution

#### Debug Controls
- **Start/Stop:** \`F5\` to start, \`Shift+F5\` to stop
- **Stepping:** \`F10\` (step over), \`F11\` (step into), \`Shift+F11\` (step out)
- **Variable Inspection:** Hover to see values
- **Watch Expressions:** Monitor specific variables
- **Call Stack:** Navigate function call hierarchy
- **Debug Console:** Execute code in debug context

### 9. Real-time Problems Panel
- **TypeScript Errors:** Compile-time type checking
- **ESLint Issues:** Code quality and style violations
- **Linting:** Real-time code analysis
- **Quick Fixes:** Automatic suggestions for common issues
- **Problem Navigation:** Click to jump to error locations
- **Filtering:** Show errors, warnings, or info separately

### 10. Complete Git Integration
#### Repository Operations
- **Clone Repositories:** Import from GitHub
- **Initialize Repos:** Create new Git repositories
- **Commit Changes:** Stage and commit with messages
- **Push/Pull:** Sync with remote repositories
- **Branch Management:** Create, switch, merge branches

#### Git Status
- **Modified Files:** See all changed files
- **Staged Files:** View files ready to commit
- **Untracked Files:** Show new files not in Git
- **Commit History:** Browse previous commits
- **Diff Viewer:** Compare changes between commits

### 11. Search and Replace
- **File Search:** \`Ctrl+F\` for in-file search
- **Global Search:** \`Ctrl+Shift+F\` to search all files
- **Replace:** \`Ctrl+H\` for find/replace
- **Global Replace:** \`Ctrl+Shift+H\` for multi-file replace
- **Regex Support:** Advanced pattern matching
- **Case Sensitive:** Option for exact matching

### 12. File Explorer
- **File Operations:** Create, rename, delete, copy, move
- **Drag & Drop:** Upload files from computer
- **Search Files:** Filter by name and content
- **File Icons:** Visual file type indicators
- **Context Menus:** Right-click for actions
- **Bulk Operations:** Select multiple files

### 13. Settings and Configuration
- **VS Code Compatible:** Same settings structure
- **JSON Settings:** Text-based configuration
- **Settings UI:** User-friendly settings interface
- **Keyboard Shortcuts:** Customizable keybindings
- **Workspace Settings:** Per-project configuration
- **Settings Sync:** Import/export configurations

### 14. Command Palette
- **Fuzzy Search:** \`Ctrl+Shift+P\` to find any command
- **Command Categories:** Organized by functionality
- **Recent Commands:** Quick access to recent actions
- **Keybinding Display:** Shows shortcuts for commands
- **Custom Commands:** Create your own commands

### 15. Extensions (Basic Support)
- **Built-in Extensions:** Core functionality pre-installed
- **Extension API:** Basic extension system
- **Custom Themes:** Support for custom color themes
- **Language Support:** Additional language grammars
- **Tool Integration:** Linters and formatters

## 🔧 Advanced VS Code Features

### Language Server Protocol (LSP)
- **TypeScript LSP:** Full IntelliSense for TypeScript
- **JavaScript LSP:** Enhanced JavaScript support
- **Multi-Language:** Extensible to other languages
- **Diagnostics:** Real-time error checking
- **Code Actions:** Automatic fixes and refactoring

### Debug Adapter Protocol (DAP)
- **VS Code Compatible:** Uses same debug protocol
- **Multiple Runtimes:** Node.js, browser debugging
- **Custom Debuggers:** Configurable debug configurations
- **Attach Mode:** Debug running processes
- **Console Integration:** Debug console with REPL

### Task Runner
- **npm Scripts:** Auto-detect and run package.json scripts
- **Custom Tasks:** Define your own build tasks
- **Task Variables:** Use workspace variables in tasks
- **Problem Matchers:** Parse task output for errors
- **Task Dependencies:** Run tasks in sequence

## 🎨 UI/UX Features

### Status Bar
- **Git Information:** Current branch and status
- **Cursor Position:** Line and column display
- **Encoding Info:** File character encoding
- **Language Mode:** Current file language
- **Error Count:** Number of detected issues
- **Interactive Elements:** Clickable status items

### Activity Bar
- **Sidebar Navigation:** Quick access to main panels
- **Badge Notifications:** Shows unread counts
- **Custom Icons:** VS Code-style icon set
- **Extension Icons:** Extension integration points

### Breadcrumbs
- **Navigation Trail:** Symbol hierarchy display
- **Quick Navigation:** Click to jump to symbols
- **File Path:** Shows current file location
- **Symbol Filtering:** Filter by symbol type

### Minimap
- **Code Overview:** Scrollable miniature code view
- **Click Navigation:** Jump to any location
- **Current View Indicator:** Shows visible area
- **Zoomable:** Adjust minimap size
- **Toggle:** Show/hide minimap

## 🚀 Beyond VS Code Features

### AI Integration
- **Multi-LLM Support:** Claude, GLM-4.6, OpenAI
- **Context Awareness:** Project and file-level context
- **Code Generation:** Natural language to code
- **Intelligent Assistance:** AI-powered development

### Web-Based Architecture
- **Zero Installation:** Works in any modern browser
- **Cloud-Native:** No local setup required
- **Cross-Platform:** Same experience everywhere
- **Automatic Updates:** Always latest version

### Mobile Optimization
- **Touch Interface:** Optimized for mobile devices
- **PWA Support:** Install as native app
- **Responsive Design:** Adapts to any screen
- **Offline Capabilities:** Work without internet

### Advanced Collaboration
- **AI-Powered Development:** Intelligent coding assistance
- **Session Management:** Persistent AI conversations
- **Knowledge Sharing:** Export/import conversations
- **Learning Integration:** AI as development tutor

## 🎯 VS Code Compatibility

### Import VS Code Settings
- **Keybindings:** Import your VS Code shortcuts
- **Extensions:** Compatible with popular VS Code extensions
- **Themes:** Use VS Code color themes
- **Settings:** Import VS Code settings.json

### Migration Guide
1. **Export Settings:** From VS Code (File → Preferences → Export)
2. **Import to Browser IDE:** Settings → Import VS Code Settings
3. **Verify Keybindings:** Test imported shortcuts
4. **Install Extensions:** Add equivalent built-in features
5. **Customize Appearance:** Apply your VS Code theme

Browser IDE Pro provides a complete VS Code experience with enhanced AI capabilities and browser-based convenience!
        `,
        estimatedReadTime: '25 min',
        targetAudience: ['Power Users', 'VS Code Users']
      }
    ]
  }
];

export function HelpPanel({ className }: { className?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('quick');
  const [selectedSection, setSelectedSection] = useState('quick-reference');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [externalMarkdown, setExternalMarkdown] = useState<{ title: string; content: string } | null>(null);

  const { toggleHelp } = useIDEStore((state) => state.helpOpen);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return DOCUMENTATION_CATEGORIES;

    return DOCUMENTATION_CATEGORIES.map(category => ({
      ...category,
      sections: category.sections.filter(section =>
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(category => category.sections.length > 0);
  }, [searchQuery]);

  const currentSection = useMemo(() => {
    const category = DOCUMENTATION_CATEGORIES.find(cat => cat.id === selectedCategory);
    return category?.sections.find(sec => sec.id === selectedSection);
  }, [selectedCategory, selectedSection]);

  const handleSectionSelect = (categoryId: string, sectionId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSection(sectionId);
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  const handleExternalLink = async (url: string) => {
    // For external markdown files, load them in the panel instead of opening in new tab
    if (url.endsWith('.md')) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const content = await response.text();
          const title = url.split('/').pop()?.replace('.md', '').replace(/-/g, ' ') || 'Document';
          setExternalMarkdown({ title, content });
          // Clear the sidebar on mobile when viewing external doc
          if (window.innerWidth < 768) {
            setSidebarCollapsed(true);
          }
        } else {
          // If fetch fails, open in new tab as fallback
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      } catch (error) {
        console.error('Failed to load external markdown:', error);
        // Fallback to opening in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // For non-markdown URLs, open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const openFullScreenUserGuide = () => {
    const userGuideUrl = '/docs/USER_GUIDE.md';
    const newWindow = window.open(userGuideUrl, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes');

    if (newWindow) {
      newWindow.document.title = '📚 Browser IDE Pro - User Guide';

      newWindow.addEventListener('load', () => {
        try {
          const style = newWindow.document.createElement('style');
          style.textContent = `
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              background: #0d1117;
              color: #c9d1d9;
              line-height: 1.6;
              margin: 0;
              padding: 2rem;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #f9fafb;
              border-bottom: 1px solid #374151;
              padding-bottom: 0.5rem;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            h1 { font-size: 2.25rem; border-bottom: 2px solid #3b82f6; }
            h2 { font-size: 1.875rem; border-bottom: 2px solid #3b82f6; }
            h3 { font-size: 1.5rem; }
            code {
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 0.375rem;
              padding: 0.25rem 0.5rem;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 0.875rem;
            }
            pre {
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 0.5rem;
              padding: 1rem;
              overflow-x: auto;
              white-space: pre-wrap;
            }
            blockquote {
              border-left: 4px solid #3b82f6;
              background: #1e293b;
              padding: 1rem;
              margin: 1rem 0;
              font-style: italic;
              color: #d1d5db;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1rem 0;
            }
            th, td {
              border: 1px solid #374151;
              padding: 0.75rem;
              text-align: left;
            }
            th {
              background: #1f2937;
              font-weight: 600;
            }
            a {
              color: #60a5fa;
              text-decoration: underline;
            }
            a:hover {
              color: #93c5fd;
            }
            .header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #1f2937;
              border-bottom: 1px solid #374151;
              padding: 1rem 2rem;
              z-index: 1000;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            @media print {
              body { background: white !important; color: black !important; }
              h1, h2, h3, h4, h5, h6 { color: black !important; border-color: black !important; }
              code, pre { background: #f5f5f5 !important; border-color: #ccc !important; color: black !important; }
              a { color: black !important; }
              .header { display: none !important; }
            }
          `;
          newWindow.document.head.appendChild(style);

          const header = newWindow.document.createElement('div');
          header.className = 'header';
          header.innerHTML = `
            <h1 style="margin: 0; font-size: 1.5rem;">📚 Browser IDE Pro - User Guide</h1>
            <div>
              <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; margin-right: 0.5rem;">🖨️ Print</button>
              <button onclick="window.close()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">✕ Close</button>
            </div>
          `;
          newWindow.document.body.insertBefore(header, newWindow.document.body.firstChild);

          // Add padding to account for fixed header
          newWindow.document.body.style.paddingTop = '5rem';

        } catch (error) {
          console.error('Failed to enhance user guide:', error);
        }
      });
    }
  };

  const openFullScreenQuickReference = () => {
    const quickRefUrl = '/docs/QUICK_REFERENCE.md';
    const newWindow = window.open(quickRefUrl, '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes');

    if (newWindow) {
      newWindow.document.title = '⚡ Browser IDE Pro - Quick Reference';

      newWindow.addEventListener('load', () => {
        try {
          const style = newWindow.document.createElement('style');
          style.textContent = `
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              background: #0d1117;
              color: #c9d1d9;
              line-height: 1.6;
              margin: 0;
              padding: 2rem;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #f9fafb;
              border-bottom: 1px solid #374151;
              padding-bottom: 0.5rem;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            h1 { font-size: 2.25rem; border-bottom: 2px solid #fbbf24; }
            h2 { font-size: 1.875rem; border-bottom: 2px solid #fbbf24; }
            h3 { font-size: 1.5rem; }
            code {
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 0.375rem;
              padding: 0.25rem 0.5rem;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 0.875rem;
            }
            pre {
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 0.5rem;
              padding: 1rem;
              overflow-x: auto;
              white-space: pre-wrap;
            }
            blockquote {
              border-left: 4px solid #fbbf24;
              background: #1e293b;
              padding: 1rem;
              margin: 1rem 0;
              font-style: italic;
              color: #d1d5db;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1rem 0;
            }
            th, td {
              border: 1px solid #374151;
              padding: 0.75rem;
              text-align: left;
            }
            th {
              background: #1f2937;
              font-weight: 600;
            }
            a {
              color: #60a5fa;
              text-decoration: underline;
            }
            a:hover {
              color: #93c5fd;
            }
            .header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #1f2937;
              border-bottom: 1px solid #374151;
              padding: 1rem 2rem;
              z-index: 1000;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            @media print {
              body { background: white !important; color: black !important; }
              h1, h2, h3, h4, h5, h6 { color: black !important; border-color: black !important; }
              code, pre { background: #f5f5f5 !important; border-color: #ccc !important; color: black !important; }
              a { color: black !important; }
              .header { display: none !important; }
            }
          `;
          newWindow.document.head.appendChild(style);

          const header = newWindow.document.createElement('div');
          header.className = 'header';
          header.innerHTML = `
            <h1 style="margin: 0; font-size: 1.5rem;">⚡ Browser IDE Pro - Quick Reference</h1>
            <div>
              <button onclick="window.print()" style="background: #fbbf24; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; margin-right: 0.5rem;">🖨️ Print</button>
              <button onclick="window.close()" style="background: #dc2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer;">✕ Close</button>
            </div>
          `;
          newWindow.document.body.appendChild(header);

        } catch (error) {
          console.error('Failed to enhance quick reference:', error);
        }
      });
    }
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    h1: ({ children }: { children: React.ReactNode }) => (
      <h1 className="text-2xl font-bold text-white mb-4 mt-6">{children}</h1>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <h2 className="text-xl font-semibold text-white mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <h3 className="text-lg font-medium text-white mt-4 mb-2">{children}</h3>
    ),
    h4: ({ children }: { children: React.ReactNode }) => (
      <h4 className="text-base font-medium text-gray-200 mt-3 mb-2">{children}</h4>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <li className="text-gray-300">{children}</li>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-gray-800 italic text-gray-300">
        {children}
      </blockquote>
    ),
    table: ({ children }: { children: React.ReactNode }) => (
      <div className="overflow-x-auto mb-4">
        <table className="w-full border-collapse border border-gray-700">{children}</table>
      </div>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <thead className="bg-gray-800">{children}</thead>
    ),
    tbody: ({ children }: { children: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <tr className="border-b border-gray-700">{children}</tr>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <th className="border border-gray-700 px-4 py-2 text-left text-white font-semibold">{children}</th>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <td className="border border-gray-700 px-4 py-2 text-gray-300">{children}</td>
    ),
    a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline"
      >
        {children}
      </a>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <strong className="text-blue-400 font-semibold">{children}</strong>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <em className="text-gray-300 italic">{children}</em>
    ),
    hr: () => (
      <hr className="border-gray-700 my-6" />
    ),
    code: ({ inline, children, className }: { inline?: boolean; children: React.ReactNode; className?: string }) => {
      if (inline) {
        return (
          <code className="bg-gray-800 text-green-400 px-2 py-1 rounded font-mono text-sm">
            {children}
          </code>
        );
      }

      const language = className?.replace(/language-/, '') || 'text';
      return (
        <div className="rounded-lg overflow-hidden mb-4">
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    },
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Help & Documentation</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExternalLink('https://github.com/yourusername/browser-ide-v2/issues')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Report Issue"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleHelp}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Close Help"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={clsx(
          'flex flex-col bg-gray-800 border-r border-gray-700 transition-all duration-300',
          sidebarCollapsed ? 'w-0' : 'w-80'
        )}>
          {/* Categories */}
          <div className="flex-1 overflow-y-auto">
            {filteredCategories.map((category) => (
              <div key={category.id} className="mb-4">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'w-full flex items-center gap-2 px-4 py-2 text-left transition-colors',
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700 text-gray-300'
                  )}
                >
                  {category.icon}
                  <span className="font-medium">{category.name}</span>
                </button>

                {selectedCategory === category.id && !sidebarCollapsed && (
                  <div className="ml-4 border-l border-gray-600">
                    {category.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionSelect(category.id, section.id)}
                        className={clsx(
                          'w-full text-left px-4 py-2 text-sm transition-colors border-l-2',
                          selectedSection === section.id
                            ? 'bg-gray-700 border-blue-400 text-white'
                            : 'hover:bg-gray-700 border-transparent text-gray-300'
                        )}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{section.title}</span>
                          <span className="text-xs text-gray-400 mt-1">{section.estimatedReadTime}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* External Links */}
          <div className="p-4 border-t border-gray-700">
            <div className="space-y-2">
              {/* Side-by-side button layout for mobile and desktop */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex gap-1 flex-1">
                  <button
                    onClick={() => handleExternalLink('/docs/USER_GUIDE.md')}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                    title="View in panel"
                  >
                    <Book className="w-4 h-4" />
                    <span className="text-xs">User Guide</span>
                  </button>
                  <button
                    onClick={openFullScreenUserGuide}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Open in full-screen window"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1 flex-1">
                  <button
                    onClick={() => handleExternalLink('/docs/QUICK_REFERENCE.md')}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                    title="View in panel"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-xs">Quick Ref</span>
                  </button>
                  <button
                    onClick={openFullScreenQuickReference}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Open in full-screen window"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {externalMarkdown ? (
            <>
              {/* External Document Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <Book className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">{externalMarkdown.title}</h3>
                  <button
                    onClick={() => setExternalMarkdown(null)}
                    className="ml-auto p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="Back to help sections"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-400 text-sm">External documentation file</p>
              </div>

              {/* External Document Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none prose-lg">
                  <ReactMarkdown components={markdownComponents}>
                    {externalMarkdown.content}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          ) : currentSection ? (
            <>
              {/* Section Header */}
              <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  {currentSection.icon}
                  <h3 className="text-lg font-semibold text-white">{currentSection.title}</h3>
                </div>
                <p className="text-gray-400 text-sm">{currentSection.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>📖 {currentSection.estimatedReadTime}</span>
                  <span>👥 {currentSection.targetAudience.join(', ')}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none prose-lg">
                  <ReactMarkdown components={markdownComponents}>
                    {currentSection.content}
                  </ReactMarkdown>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No Section Selected</h3>
                <p className="text-gray-500">Choose a section from the sidebar to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}