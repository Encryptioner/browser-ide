# Browser IDE

A VS Code-like IDE that runs entirely in the browser, built with TypeScript, React, and modern web technologies.

## Status

**In Development** - Core architecture is in place, but some features need completion and there are TypeScript errors to resolve.

## Features

### Implemented
- Multi-LLM AI support architecture (Claude, GLM-4.6, OpenAI)
- Project and workspace management system
- Git integration via isomorphic-git
- File system via LightningFS
- Monaco Editor integration
- WebContainers for code execution
- IndexedDB persistence via Dexie
- Terminal with xterm.js
- PWA support
- Mobile-responsive UI

### In Progress
- Fixing TypeScript compilation errors
- Completing UI components
- Testing and validation
- Documentation

## Technology Stack

- **TypeScript 5.3+** - Type-safe development
- **React 18.2+** - UI framework
- **Vite 5.0+** - Build tool and dev server
- **pnpm 8.14+** - Package manager (required)
- **Zustand 4.4+** - State management
- **Dexie 3.2+** - IndexedDB wrapper
- **Monaco Editor** - VS Code editor
- **WebContainers** - Node.js runtime in browser
- **isomorphic-git** - Git operations
- **xterm.js** - Terminal emulator
- **Tailwind CSS** - Styling

## Quick Start

### Prerequisites
- Node.js 18 or higher
- pnpm 8.14 or higher (install: `npm install -g pnpm`)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

### Development Commands

```bash
# Development
pnpm dev                  # Start dev server
pnpm dev:mobile           # Dev server on local network

# Type Checking
pnpm type-check           # Check TypeScript types
pnpm type-check:watch     # Watch mode

# Code Quality
pnpm lint                 # Lint code
pnpm lint:fix             # Fix linting issues
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting
pnpm validate             # Type-check + lint + build

# Building
pnpm build                # Production build
pnpm preview              # Preview production build
pnpm preview:mobile       # Preview on local network

# Deployment
pnpm deploy               # Deploy to GitHub Pages
pnpm deploy:script        # Interactive deployment script

# Maintenance
pnpm clean                # Clean build artifacts
pnpm clean:all            # Clean everything including node_modules
```

## Project Structure

```
src/
├── components/           # React components
│   ├── IDE/             # Main IDE components
│   ├── Git/             # Git-specific components
│   └── claude-cli/      # Claude CLI integration
├── services/            # Business logic (singletons)
│   ├── ai-providers.ts  # Multi-LLM abstraction
│   ├── filesystem.ts    # File operations
│   ├── git.ts          # Git operations
│   ├── webcontainer.ts # Code execution
│   └── ...
├── store/               # Zustand state management
│   ├── useIDEStore.ts  # Main IDE state
│   └── useWorkspaceStore.ts
├── types/index.ts       # TypeScript type definitions
├── lib/database.ts      # Dexie database wrapper
├── hooks/               # React hooks
├── config/              # Configuration
└── utils/               # Utility functions
```

## Documentation

### Project Status & Planning
- **[CURRENT_STATE.md](./CURRENT_STATE.md)** - ⭐ Current project status (what's done, what's next)
- **[TODO.md](./TODO.md)** - Detailed task list and roadmap
- **[PRD/](./PRD/)** - Product requirements and completion reports

### Development & Deployment
- **[CLAUDE.md](./CLAUDE.md)** - Development guide for working with AI assistants
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions

### User Documentation
- **[docs/](./docs/)** - Complete user documentation

## Key Features

### Multi-LLM Support
- Anthropic Claude (Sonnet, Opus, Haiku)
- Z.ai GLM-4.6
- OpenAI GPT models
- Extensible provider system

### Development Environment
- Monaco Editor with IntelliSense
- Integrated terminal
- File explorer
- Git integration
- Debugger panel
- Problems panel
- Code execution via WebContainers

### Data Management
- All data stored locally in IndexedDB
- No cloud dependencies
- Offline-capable PWA
- Export/import functionality

## Browser Requirements

- **Chrome/Edge** (recommended) - Full WebContainer support
- **Firefox/Safari** - Limited (no WebContainers)
- **Mobile** - Responsive UI with touch support

## Current Issues

- TypeScript compilation has errors that need resolution
- Some services need completion
- UI components need refinement
- Test coverage needed

See [TODO.md](./TODO.md) for detailed task list.

## Contributing

This project is in active development. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm validate` to ensure quality
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Credits

Built with excellent open-source technologies:
- Monaco Editor (Microsoft)
- WebContainers (StackBlitz)
- isomorphic-git team
- React (Meta)
- Vite (Evan You)
- And many more...

---

**Status:** In Development
**Last Updated:** December 2024
