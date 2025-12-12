# Terminal & Git Commands Guide

## Terminal Access

The terminal is integrated into Browser IDE Pro and runs commands via WebContainer.

### Opening Terminal
1. Click the **💻 Terminal** icon in the titlebar
2. Wait for "Ready" status (green dot in terminal header)
3. Terminal prompt appears: `$`

### Available Commands

#### Git Commands
```bash
# Check status
git status

# View branches
git branch
git branch -a  # Show all branches including remote

# Switch branches
git checkout <branch-name>

# Create new branch
git checkout -b <new-branch-name>

# View commit history
git log
git log --oneline --graph

# View diff
git diff <file>
git diff HEAD~1  # Compare with previous commit

# Stage files
git add <file>
git add .  # Stage all changes

# Commit
git commit -m "Your message"

# Push/Pull
git push origin <branch>
git pull origin <branch>

# View remote info
git remote -v
git remote show origin
```

#### Node/NPM Commands
```bash
# Check versions
node --version
npm --version
pnpm --version

# Install dependencies
pnpm install
npm install

# Run scripts
pnpm dev
pnpm build
pnpm test

# View packages
pnpm list
```

#### File System Commands
```bash
# List files
ls
ls -la

# Navigate
cd <directory>
cd ..  # Go up one level
pwd    # Print working directory

# View files
cat <file>
head <file>
tail <file>

# Search
find . -name "*.ts"
grep -r "search term" .
```

#### Terminal Utilities
```bash
# Clear screen
clear

# Show help
help

# Command history
# Use ↑ arrow for previous command
# Use ↓ arrow for next command

# Cancel running command
# Press Ctrl+C
```

## Git Panel UI (Alternative to Terminal)

For visual git operations, use the **🔀 Git** panel:

### Changes Tab
- **View Changes**: Click any changed file to see diff
- **Stage**: Click `+` button next to file
- **Unstage**: Click `−` button next to file
- **Commit**: Write message and click "Commit"
- **Stage All**: Click "Stage All" button
- **Unstage All**: Click "Unstage All" button

### History Tab
- View commit history
- See author, timestamp, commit hash
- HEAD indicator shows current commit

### Branches Tab
- **Switch Branch**: Click any branch name
- **Create Branch**: Click "+ New Branch", enter name
- **Delete Branch**: Hover over branch, click delete icon

### Push/Pull
- **↓ Pull**: Pull latest changes from remote
- **↑ Push**: Push local commits to remote
- **🔄 Refresh**: Manually refresh git status

## Claude Code Integration

Browser IDE Pro includes Claude Code agent integration:

### Opening Claude Code Panel
1. Click **🧠 Claude Code** icon in titlebar
2. Panel opens in bottom area
3. Switch between tabs: Terminal | Preview | Claude Code | Git

### Using Claude Code Agent
1. Open Claude Code panel
2. Type your coding request or question
3. Claude can:
   - Write and edit code
   - Explain code functionality
   - Debug issues
   - Suggest improvements
   - Generate tests
   - Refactor code

### Example Prompts
```
"Add error handling to the login function"
"Explain what this component does"
"Write unit tests for the API service"
"Optimize this database query"
"Fix the TypeScript errors in this file"
```

## Common Workflows

### Workflow 1: Making Changes and Committing
```bash
# Terminal approach
git status
git add src/components/MyComponent.tsx
git commit -m "feat: add new component"
git push origin main

# Or use Git Panel UI:
# 1. Click 🔀 Git icon
# 2. Changes tab shows modified files
# 3. Click file to view diff
# 4. Click + to stage
# 5. Write commit message
# 6. Click Commit
# 7. Click ↑ Push
```

### Workflow 2: Switching Branches
```bash
# Terminal approach
git branch -a
git checkout feature-branch

# Or use Git Panel UI:
# 1. Click 🔀 Git icon
# 2. Branches tab
# 3. Click branch name to switch
```

### Workflow 3: Creating Feature Branch
```bash
# Terminal approach
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# Or use Git Panel UI:
# 1. Click 🔀 Git icon
# 2. Branches tab
# 3. Click "+ New Branch"
# 4. Enter name
# 5. Click Create
```

### Workflow 4: Reviewing Changes Before Commit
```bash
# Terminal approach
git diff src/app.ts

# Or use Git Panel UI:
# 1. Click 🔀 Git icon
# 2. Changes tab
# 3. Click any file
# 4. Diff viewer opens
# 5. Review changes
# 6. Toggle Unified/Split view
```

## Troubleshooting

### Terminal Not Responding
1. Check if "Ready" status shows (green dot)
2. If "Booting", wait a few seconds
3. If "Boot Failed", refresh the page
4. Clear browser cache if issue persists

### Git Commands Failing
1. Ensure repository is cloned (click 📥 Clone)
2. Check remote URL: `git remote -v`
3. Verify authentication token in Settings
4. For push/pull: ensure you have write access

### Branch Switch Not Showing Changes
1. Git panel auto-refreshes after branch switch
2. If not updating, click 🔄 Refresh button
3. Check terminal: `git status`

### Terminal Shows "WebContainer not ready"
1. Wait for terminal to show "Ready" status
2. Built-in commands (clear, help) work immediately
3. Git/Node commands need WebContainer ready

## Keyboard Shortcuts

### Terminal
- **Ctrl+C**: Cancel current command
- **Ctrl+L**: Clear screen
- **↑/↓**: Navigate command history
- **Tab**: (Future) Auto-complete

### IDE
- **Ctrl+Enter**: Commit (when in commit message box)
- **Escape**: Close diff viewer
- **Enter**: Submit (in branch creation input)

## Tips & Best Practices

1. **Use Git Panel for visual workflow** - Easier than terminal for staging/committing
2. **Use Terminal for complex git commands** - More power and flexibility
3. **View diffs before committing** - Click files to review changes
4. **Commit often with clear messages** - Easier to track and revert
5. **Pull before push** - Avoid merge conflicts
6. **Create feature branches** - Keep main/master clean
7. **Use Claude Code for help** - Ask questions about git commands

## Configuration

### Git User Config
```bash
# Set your name and email (persists in browser storage)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# View config
git config --list
```

### Authentication
1. Click ⚙️ Settings
2. Go to Git section
3. Add Personal Access Token (PAT)
4. Token used for push/pull operations

### API Keys for Claude
1. Click ⚙️ Settings
2. Go to AI Providers section
3. Add Anthropic API key
4. Add GLM-4.6 API key (optional)

---

**Need help?** Type `help` in terminal or ask Claude Code agent!
