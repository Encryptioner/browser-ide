# TODO - Browser IDE Pro v2.0

Current tasks, priorities, and feature roadmap.

---

## 🔥 High Priority (Current Sprint)

### Core Features (Phase 1) - ✅ COMPLETE
- [x] TypeScript migration
- [x] pnpm setup
- [x] Multi-LLM provider system
  - [x] Anthropic Claude
  - [x] Z.ai GLM-4.6
  - [x] OpenAI
  - [x] Provider abstraction layer
- [x] Project management
  - [x] Create/delete projects
  - [x] Switch between projects
  - [x] Project persistence (IndexedDB)
- [x] AI chat sessions
  - [x] Thread-based conversations
  - [x] Message branching
  - [x] Session per project
- [x] Profile system
  - [x] Settings management
  - [x] Multiple profiles
- [x] Database layer (Dexie)
- [x] Core type definitions

### Implementation Tasks (Phase 2) - 🚧 IN PROGRESS

#### Zustand Stores - ⚠️ TODO
- [ ] Create `useProjectStore.ts`
  - [ ] Project CRUD operations
  - [ ] Active project management
  - [ ] Project switching logic
- [ ] Create `useAIStore.ts`
  - [ ] Session management
  - [ ] Message handling
  - [ ] Provider switching
- [ ] Create `useEditorStore.ts`
  - [ ] File management
  - [ ] Tab management
  - [ ] Editor state
- [ ] Create `useSettingsStore.ts`
  - [ ] Settings persistence
  - [ ] Profile management

#### Services - ⚠️ TODO
- [ ] Complete `filesystem.ts`
  - [ ] File CRUD with LightningFS
  - [ ] File tree building
  - [ ] File watching
- [ ] Complete `git.ts`
  - [ ] All isomorphic-git operations
  - [ ] Branch management
  - [ ] Conflict resolution
- [ ] Complete `webcontainer.ts`
  - [ ] Process management
  - [ ] Terminal integration
  - [ ] Preview server

#### UI Components - ⚠️ TODO
- [ ] **Layout**
  - [ ] Main App layout
  - [ ] Titlebar component
  - [ ] Sidebar with tabs
  - [ ] Panel with tabs
  - [ ] Status bar
  
- [ ] **Project Management**
  - [ ] Project list
  - [ ] Project card
  - [ ] New project modal
  - [ ] Project settings
  
- [ ] **Editor**
  - [ ] Monaco editor wrapper
  - [ ] Tab bar
  - [ ] File explorer
  - [ ] Breadcrumbs
  
- [ ] **AI Chat**
  - [ ] Chat interface
  - [ ] Message list
  - [ ] Message bubble
  - [ ] Input box
  - [ ] Provider selector
  - [ ] Session list
  
- [ ] **Settings**
  - [ ] Settings modal
  - [ ] AI provider config
  - [ ] Editor preferences
  - [ ] Git configuration
  - [ ] Theme selector

#### Documentation - ⚠️ TODO
- [x] README.md
- [x] CLAUDE.md
- [x] WORKFLOW.md
- [x] TODO.md (this file)
- [ ] ARCHITECTURE.md
- [ ] API.md
- [ ] CONTRIBUTING.md

---

## 🎯 Medium Priority (Next Sprint)

### Enhanced Features (Phase 3)

#### Git Advanced
- [ ] Visual diff viewer
- [ ] Merge conflict resolution UI
- [ ] Interactive rebase
- [ ] Git blame view
- [ ] Stash management
- [ ] Cherry-pick support

#### Editor Advanced
- [ ] Multi-cursor editing
- [ ] Find and replace (Ctrl+F)
- [ ] Search across files (Ctrl+Shift+F)
- [ ] Code formatting (Prettier integration)
- [ ] Snippets system
- [ ] Minimap enhancements

#### AI Features
- [ ] Code generation from comments
- [ ] Inline AI suggestions
- [ ] Refactoring suggestions
- [ ] Test generation
- [ ] Documentation generation
- [ ] Code review mode

#### Terminal
- [ ] Full xterm.js integration
- [ ] Multiple terminal tabs
- [ ] Split terminals
- [ ] Terminal commands autocomplete
- [ ] Custom shell support

#### Performance
- [ ] Virtual scrolling for large files
- [ ] Web Workers for heavy operations
- [ ] Service Worker optimization
- [ ] Code splitting optimization
- [ ] Lazy loading components

---

## 📊 Low Priority (Future)

### Advanced Features (Phase 4)

#### Collaboration
- [ ] WebRTC for real-time collaboration
- [ ] Shared sessions
- [ ] Live cursors
- [ ] Chat with team
- [ ] Session recording/replay

#### Extensions
- [ ] Extension API
- [ ] Extension marketplace
- [ ] Custom themes support
- [ ] Language server protocol
- [ ] Debugger integration

#### Cloud Sync (Optional)
- [ ] Optional cloud backup
- [ ] Cross-device sync
- [ ] Conflict resolution
- [ ] Selective sync

#### Analytics
- [ ] Usage statistics
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] User feedback system

#### Mobile Enhancements
- [ ] Gesture controls
- [ ] Voice input
- [ ] Mobile-specific UI
- [ ] Bluetooth keyboard support

---

## 🐛 Bug Fixes

### Known Issues
- [ ] Monaco editor: Large files slow to load
- [ ] WebContainers: Not working in Firefox
- [ ] Mobile: Virtual keyboard covers input
- [ ] Git: Large repos timeout on clone
- [ ] PWA: Install prompt not showing on iOS

### To Investigate
- [ ] Memory leaks with multiple projects
- [ ] IndexedDB quota exceeded handling
- [ ] Service worker update mechanism
- [ ] State persistence race conditions

---

## 🔧 Technical Debt

### Code Quality
- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add code coverage
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Improve error messages

### Refactoring
- [ ] Extract common hooks
- [ ] Simplify component hierarchy
- [ ] Optimize re-renders
- [ ] Clean up unused code
- [ ] Standardize naming conventions
- [ ] Improve TypeScript types

### Documentation
- [ ] Add JSDoc comments
- [ ] Create video tutorials
- [ ] Write blog posts
- [ ] Create examples repository
- [ ] Add troubleshooting guide

---

## 💡 Ideas / Brainstorming

### Potential Features
- [ ] Jupyter notebook support
- [ ] Database browser (SQLite)
- [ ] Docker container management
- [ ] API testing tool (like Postman)
- [ ] Markdown preview
- [ ] Diagram editor (draw.io)
- [ ] Screen recording
- [ ] Audio notes
- [ ] Project templates
- [ ] Code metrics dashboard

### Community Requests
- [ ] vim keybindings
- [ ] Dark mode variants
- [ ] Custom keyboard shortcuts
- [ ] Export project as ZIP
- [ ] Share project via link
- [ ] Embed in other sites
- [ ] Plugin for VS Code

---

## 📅 Release Planning

### v2.0.0 (Initial Release) - 🎯 Current
- [x] Core architecture
- [x] Type definitions
- [x] Database layer
- [x] Multi-LLM support
- [ ] Complete UI implementation
- [ ] Documentation

### v2.1.0 (Enhancement Release)
- [ ] Advanced Git features
- [ ] Editor enhancements
- [ ] Performance optimizations
- [ ] Bug fixes

### v2.2.0 (AI Focus)
- [ ] Advanced AI features
- [ ] More providers
- [ ] AI-powered refactoring

### v3.0.0 (Major Update)
- [ ] Collaboration features
- [ ] Extension system
- [ ] Breaking changes if needed

---

## 🎯 Sprint Planning Template

### Sprint #X (Dates)

**Goal:** [Sprint objective]

**Tasks:**
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

**Done:**
- [ ] Code complete
- [ ] Tests passing
- [ ] Docs updated
- [ ] Deployed

---

## 📊 Metrics & Goals

### Code Metrics
- **Target Test Coverage:** 80%+
- **TypeScript Strict Mode:** Enabled
- **Bundle Size:** < 3MB initial
- **Lighthouse Score:** 90+ (all categories)

### User Metrics
- **GitHub Stars:** 1,000+ (goal)
- **Monthly Active Users:** Track with analytics
- **Average Session Time:** Track usage
- **Feature Adoption:** Track popular features

---

## 🤝 How to Contribute

If you want to help with any of these tasks:

1. **Pick a task** from "High Priority" section
2. **Comment on issue** or create one
3. **Fork repository**
4. **Create branch:** `git checkout -b feature/task-name`
5. **Implement** following CLAUDE.md guidelines
6. **Test thoroughly**
7. **Submit PR** with description

---

## 📝 Notes

- Mark completed items with [x]
- Add new items as needed
- Review and update weekly
- Prioritize based on user feedback
- Keep high priority list short (max 10 items)

---

**This is a living document. Update regularly!**

*Last Updated: November 2024*
*Version: 2.0.0*
