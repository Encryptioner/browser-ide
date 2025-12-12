# Browser IDE Pro v2.0 - Quick Start Guide

> Get up and running in 5 minutes

---

## 🚀 Installation

### Prerequisites
- **Node.js 18+**
- **pnpm 8+** (Install: `npm install -g pnpm`)

### Setup

```bash
# 1. Navigate to project
cd browser-ide

# 2. Install dependencies (fast with pnpm!)
pnpm install

# 3. Start development server
pnpm dev

# 4. Open in browser
# Visit http://localhost:5173
```

---

## 🔑 Configure API Keys

**IMPORTANT:** API keys are configured in the Settings UI, not in environment variables.

### Steps:

1. **Open Settings** - Click ⚙️ icon in top-right corner
2. **Navigate to AI Providers** - Select "AI Providers" tab
3. **Add API Key** - Choose your provider:

#### Anthropic Claude
- Get API key from: https://console.anthropic.com/
- Enter key in Anthropic section
- Default model: `claude-sonnet-4-20250514`

#### Z.ai GLM-4.6
- Get API key from: https://z.ai/
- Enter key in GLM section
- Base URL: `https://api.z.ai/api/anthropic` (default)

#### OpenAI (Optional)
- Get API key from: https://platform.openai.com/
- Enter key in OpenAI section

4. **Save Settings** - Click "Save" button
5. **Test Connection** - Click "Test" to verify API key works

---

## 📱 Mobile Testing

### Test on Mobile Device (Same WiFi)

```bash
# Start server accessible on network
pnpm dev:mobile

# Server available at: http://YOUR_IP:5173
# Example: http://192.168.1.100:5173
```

**Steps:**
1. Run `pnpm dev:mobile` on computer
2. Note IP address shown (e.g., `192.168.1.100:5173`)
3. Connect mobile device to same WiFi
4. Open browser on mobile
5. Navigate to `http://YOUR_IP:5173`

---

## 🎯 Key Features

### ✅ Multi-LLM Support
- Anthropic Claude (Sonnet 4.5, Opus 4, Haiku 4)
- Z.ai GLM-4.6 (200K context, superior coding)
- OpenAI (GPT-4 Turbo, GPT-4, GPT-3.5)

### ✅ Full IDE Experience
- Monaco Editor (VS Code editor)
- File tree & multi-file editing
- Git integration (clone, commit, push)
- Terminal (WebContainer - Chrome/Edge only)
- Code execution

### ✅ Mobile-Optimized
- Virtual Keyboard API support
- Keyboard height detection
- Touch-friendly buttons (44px)
- Safe area support (iPhone X+)
- PWA (install as app)

### ✅ AI Agent
- Claude Code-inspired workflow
- File read/write operations
- Git operations
- Code search
- Multi-step task execution

---

## 📖 Documentation

- **Full Documentation:** `README.md`
- **Implementation Status:** `IMPLEMENTATION_STATUS.md`
- **Production Deployment:** `PRODUCTION_DEPLOYMENT.md`
- **Future Roadmap:** `FUTURE_ROADMAP.md`
- **Development Guide:** `CLAUDE.md`

---

## 🏗️ Build & Deploy

### Production Build

```bash
# Type-check and build
pnpm build

# Preview production build
pnpm preview
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

### Deploy to GitHub Pages

```bash
# Build and deploy
pnpm deploy
```

**Note:** GitHub Pages doesn't support COOP/COEP headers, so WebContainer won't work. Use Vercel for full functionality.

---

## ⚙️ Available Scripts

```json
{
  "dev": "vite",                        // Local development
  "dev:mobile": "vite --host 0.0.0.0",  // Mobile testing (same WiFi)
  "build": "tsc && vite build",         // Production build
  "preview": "vite preview",            // Preview build locally
  "preview:mobile": "vite preview --host 0.0.0.0",  // Preview on mobile
  "type-check": "tsc --noEmit",         // Check TypeScript types
  "lint": "eslint . --ext ts,tsx",      // Lint code
  "lint:fix": "eslint . --ext ts,tsx --fix",  // Fix linting issues
  "deploy": "pnpm build && gh-pages -d dist"  // Deploy to GitHub Pages
}
```

---

## 🎨 Technology Stack

| Category | Technology |
|----------|------------|
| **Language** | TypeScript 5.3+ |
| **Framework** | React 18.2+ |
| **Build** | Vite 5.0+ |
| **Package Manager** | pnpm 8.14+ |
| **State** | Zustand 4.4+ |
| **Database** | Dexie 3.2+ (IndexedDB) |
| **Editor** | Monaco Editor |
| **Runtime** | WebContainers |
| **Styling** | Tailwind CSS 3.4+ |

---

## 🐛 Common Issues

### TypeScript Errors

```bash
# Check types
pnpm type-check

# Rebuild
rm -rf dist node_modules/.vite
pnpm install
pnpm build
```

### WebContainer Not Working

**Solution:** WebContainers only work in Chrome/Edge with proper headers.

- ✅ Use Chrome or Edge (not Firefox/Safari)
- ✅ Deploy to Vercel (has correct headers)
- ❌ GitHub Pages doesn't support required headers

### Mobile Keyboard Not Detected

- ✅ Test on real device (not emulator)
- ✅ Virtual Keyboard API only on Chrome 94+ Android
- ✅ iOS uses fallback viewport detection

---

## 📊 Project Status

- **Version:** 2.0.0
- **Status:** Production Ready (95% complete)
- **License:** MIT
- **Last Updated:** December 2, 2024

---

## 📞 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Documentation:** See docs/ folder

---

## 🎯 Next Steps

1. ✅ Configure API keys in Settings
2. ✅ Create your first project
3. ✅ Clone a repository
4. ✅ Start coding with AI assistance
5. ✅ Test on mobile device
6. ✅ Deploy to production (Vercel)
7. ✅ Install as PWA

---

**Made with ❤️ for developers who code anywhere, anytime.**
