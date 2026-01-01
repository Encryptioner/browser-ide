# Claude Code - Quick Start Guide

## What is Claude Code?

Claude Code is a **command-based AI coding assistant** integrated into Browser IDE. Unlike chat interfaces, Claude Code works through direct commands that manipulate your codebase in real-time - just like the official [Anthropic Claude Code CLI](https://github.com/anthropics/claude-code).

## Features

- ✅ **Direct file manipulation** - AI creates, edits, and deletes files automatically
- ✅ **Command-based interface** - No chat, just execute commands
- ✅ **Real-time updates** - Changes sync instantly with the IDE
- ✅ **WebContainer execution** - Run npm, git, node commands in the browser
- ✅ **AI-powered tasks** - Natural language task execution with `exec`

## Setup

### 1. Configure API Key

Go to Settings and add your API key:
- **Anthropic API**: Use official Claude models
- **GLM API** (Z.ai): Compatible alternative using GLM-4.6

### 2. Open Claude Code Panel

Click the **"Claude Code"** button in the bottom toolbar to open the CLI terminal.

## Usage

### Basic Commands

```bash
# Show help
help

# List files
ls

# Show file contents
cat src/App.tsx

# Change directory
cd src/components

# Show current directory
pwd

# Clear terminal
clear
```

### File Operations

```bash
# Create directory
mkdir components

# Create empty file
touch README.md
```

### AI-Powered Commands

The real power is in the `exec` command - it lets Claude AI perform complex tasks:

```bash
# Create a new React component
exec "Create a login form component with email and password"

# Refactor code
exec "Refactor the authentication logic to use hooks"

# Fix bugs
exec "Fix the memory leak in the useEffect"

# Add features
exec "Add dark mode support to the app"

# Write tests
exec "Write unit tests for the user service"
```

### Development Commands

```bash
# Run npm commands
npm install react-router-dom
npm run build
npm test

# Git operations
git status
git add .
git commit -m "Add new feature"
git push

# Run Node.js scripts
node scripts/build.js

# Run Python scripts
python analyze.py
```

### Slash Commands (Quick Actions)

```bash
/clear        # Clear terminal and reset
/status       # Show workspace status
/history      # Show command history
/env          # Show environment variables
/help         # Show all slash commands
```

## How it Works

1. **You type a command** (e.g., `exec "add login form"`)
2. **Claude analyzes** your codebase and task
3. **AI executes tools** (read files, write code, run commands)
4. **Files update automatically** in your IDE
5. **You see real-time progress** in the terminal

## Example Workflow

```bash
# Initialize a new React project
init react

# Create a component with AI
exec "Create a responsive navbar with logo and menu items"

# Check what was created
ls src/components

# Run the development server
npm run dev

# Make changes with AI
exec "Add hover effects to the navbar links"

# Commit changes
git add .
git commit -m "Add navbar component"
```

## Tips

- 🎯 **Be specific** with task descriptions for better results
- 📝 **Review changes** before committing
- 🔄 **Use /history** to repeat successful commands
- 💡 **Start simple** and build complexity gradually
- ⚡ **Combine commands** with `exec` for complex workflows

## Troubleshooting

### API Key Not Working
- Verify key is correct in Settings
- Check you have credits/quota remaining
- Try switching between Anthropic and GLM providers

### Commands Failing
- Use `pwd` to check current directory
- Ensure files exist before reading them
- Check WebContainer is initialized (green indicator)

### AI Not Understanding Tasks
- Be more specific in your descriptions
- Break complex tasks into smaller steps
- Include context (file names, locations)

## Advanced Usage

### Custom Workflows

Create complex multi-step workflows:

```bash
exec "
1. Create a user authentication system
2. Add login and register pages
3. Implement JWT token handling
4. Add protected route components
5. Write integration tests
"
```

### Project Initialization

```bash
# React project
init react

# Node.js project
init node

# Basic project
init basic
```

## Comparison: Chat vs Claude Code

| Feature | Chat Interface | Claude Code CLI |
|---------|---------------|-----------------|
| Interaction | Conversational | Command-based |
| File Updates | Manual copy/paste | Automatic |
| Speed | Slower | Faster |
| Workflow | Interrupted | Continuous |
| Best For | Questions, explanations | Direct coding tasks |

## Next Steps

1. Try the `exec` command with a simple task
2. Experiment with file operations
3. Build a small feature end-to-end
4. Integrate into your development workflow

---

**Note**: Claude Code runs in a WebContainer environment. All commands execute in the browser - no server required!

For more information, visit the [official Claude Code repository](https://github.com/anthropics/claude-code).
