# Browser IDE Pro v2.0 - Quick Start Guide 🚀

## 🎯 What You Got

A **complete VS Code-like IDE in your browser** with:

- ✅ **WebContainer VM** - Run Node.js/npm without backend
- ✅ **Git Integration** - Clone, commit, push GitHub repos
- ✅ **Multi-AI Support** - Claude, GLM-4.6, OpenAI
- ✅ **Monaco Editor** - Full VS Code editor
- ✅ **Terminal** - xterm.js shell
- ✅ **PWA** - Install as desktop/mobile app
- ✅ **100% TypeScript** - Production-ready

---

## 🚀 Getting Started (2 Minutes)

### 1. Start Dev Server

```bash
cd /Users/ankur/Projects/side-projects/coding-challenges/browser-ide
pnpm install  # If not done
pnpm dev
```

**Open:** http://localhost:5173

### 2. Configure Settings (One-Time)

Click **⚙️ Settings** button:

**Git Settings:**
- GitHub Username: `your-username`
- GitHub Email: `your@email.com`
- GitHub Token: [Create here](https://github.com/settings/tokens) (needs `repo` scope)

**AI Settings (Optional):**
- Anthropic API Key: [Get here](https://console.anthropic.com/)
- GLM API Key: [Get here](https://open.bigmodel.cn/)
- OpenAI API Key: [Get here](https://platform.openai.com/)

Click **Save**.

### 3. Clone Your First Repo

Click **📥 Clone**:
- URL: `https://github.com/your-username/your-repo.git`
- Token: (auto-filled from settings)
- Click **Clone**

Files appear in File Explorer! 🎉

---

## 💻 Basic Usage

### File Navigation
- Click files in **left sidebar** to open
- Multiple files open in **tabs**
- Save with **Cmd/Ctrl+S**

### Terminal
- Toggle with **💻** button
- Run: `npm install`, `npm start`, etc.
- Full bash/zsh commands work

### Preview
- Toggle with **👁️** button
- Auto-detects `localhost` URLs
- Live reload on code changes

### AI Assistant
- Click **🤖 AI** button
- Select provider (GLM recommended)
- Ask: "Explain this code" or "Add error handling"

---

## 🎬 Example Workflow

### Clone & Run a React App

1. **Clone:**
   ```
   📥 Clone → https://github.com/facebook/create-react-app.git
   ```

2. **Install:**
   ```
   💻 Terminal → cd create-react-app → npm install
   ```

3. **Run:**
   ```
   npm start
   ```

4. **Preview:**
   ```
   👁️ Preview → See app running!
   ```

5. **Edit:**
   - Open `src/App.js`
   - Make changes
   - **Cmd+S** to save
   - See live update in preview!

### Get AI Help

1. Open any file
2. Click **🤖 AI**
3. Ask: "Add TypeScript types to this component"
4. Copy response to editor

---

## ⚙️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save File | `Cmd/Ctrl + S` |
| Toggle Sidebar | Click **📁** |
| Toggle Terminal | Click **💻** |
| Toggle Preview | Click **👁️** |
| Open AI | Click **🤖** |
| Settings | Click **⚙️** |

---

## 🔧 Panel Layout

```
┌─────────────────────────────────────────────────┐
│ 🚀 Browser IDE Pro  📁💻👁️  📥Clone 🤖AI ⚙️ │ ← Title Bar
├──────────┬──────────────────────────────────────┤
│          │ 📄 file1.js  📄 file2.ts  ✕         │ ← Editor Tabs
│  File    ├──────────────────────────────────────┤
│  Tree    │                                      │
│          │      Monaco Editor                   │
│  📂 src  │      (Code editing)                  │
│  📄 app  │                                      │
│  📄 main │                                      │
│          ├──────────────────────────────────────┤
│          │ Terminal | Preview                   │ ← Bottom Panel
│          │ $ npm start                          │
│          │ Server running on localhost:3000     │
├──────────┴──────────────────────────────────────┤
│ main | src/App.tsx | Browser IDE v2.0          │ ← Status Bar
└─────────────────────────────────────────────────┘
```

---

## 📱 Mobile Usage

Works great on tablets/phones!

**Layout adapts:**
- Sidebar auto-hides on small screens
- Terminal/Preview in tabs
- Touch-friendly buttons
- Swipe to resize panels

**Install as PWA:**
1. Open on mobile browser
2. Tap "Add to Home Screen"
3. Works offline!

---

## 🎯 Pro Tips

### 1. Multiple Projects
- Clone different repos to different folders
- Open in new tabs: `/repo1`, `/repo2`
- Each tab = independent workspace

### 2. Quick Clone
- Recent repos saved
- One-click re-clone

### 3. AI-Powered Coding
- Select code → Ask AI "Explain this"
- Ask: "Convert to TypeScript"
- Ask: "Add error handling"

### 4. WebContainer Power
- Run any npm package
- Test full-stack apps
- No backend needed!

### 5. Git Workflow
- Make changes
- Terminal: `git add .`
- Terminal: `git commit -m "message"`
- Terminal: `git push`

---

## 🐛 Troubleshooting

### "Clone failed"
- Check GitHub token has `repo` scope
- Public repos don't need token
- Private repos need valid token

### "Terminal not responding"
- Refresh page (F5)
- WebContainer reboots automatically

### "Preview shows nothing"
- Check terminal for server URL
- Only works with web servers (React, Vite, etc.)
- Not for CLI apps

### "AI not responding"
- Check API key in settings
- Verify internet connection
- Try different provider

---

## 🚀 Deploy Your IDE

### GitHub Pages (Free!)

```bash
pnpm build
pnpm deploy
```

**URL:** `https://your-username.github.io/browser-ide/`

### Netlify/Vercel

1. Connect GitHub repo
2. Build command: `pnpm build`
3. Output directory: `dist`
4. Deploy!

---

## 📚 Documentation

**Full Docs:**
- `IDE_COMPLETE.md` - Complete feature list
- `PRODUCTION_READY.md` - Production checklist
- `DEPLOYMENT.md` - Deployment guide
- `README.md` - Project overview
- `CLAUDE.md` - AI development guide

---

## 🎉 You're Ready!

**Next Steps:**
1. ✅ Clone a repo
2. ✅ Edit some code
3. ✅ Run in terminal
4. ✅ Preview in browser
5. ✅ Get AI help
6. ✅ Deploy your IDE!

**Questions?**
- Check `IDE_COMPLETE.md` for detailed docs
- All features work offline after first load
- PWA = install as desktop/mobile app

---

**Happy Coding! 🚀**

Built with TypeScript, React, Monaco, xterm.js, and WebContainers.
