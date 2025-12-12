# Development Workflow & Checklist

Complete workflow for developing, testing, and deploying Browser IDE Pro v2.0.

---

## 🚀 Quick Start Workflow

### Day 1: Setup (30 minutes)
- [ ] Extract project ZIP
- [ ] Install pnpm: `npm install -g pnpm`
- [ ] Install dependencies: `pnpm install`
- [ ] Start dev server: `pnpm dev`
- [ ] Open http://localhost:5173
- [ ] Explore the UI
- [ ] Read README.md and CLAUDE.md

### Day 2: Configuration (30 minutes)
- [ ] Open Settings
- [ ] Add Anthropic API key
- [ ] Add Z.ai GLM API key (optional)
- [ ] Add GitHub Personal Access Token
- [ ] Configure Git username and email
- [ ] Test AI chat with different providers
- [ ] Clone a test repository

### Day 3: Development (Ongoing)
- [ ] Create feature branch
- [ ] Make changes
- [ ] Test locally
- [ ] Commit and push
- [ ] Deploy

---

## 📋 Development Checklist

### Before Starting Work

- [ ] Pull latest changes: `git pull origin main`
- [ ] Install/update dependencies: `pnpm install`
- [ ] Create feature branch: `git checkout -b feature/my-feature`
- [ ] Check TODO.md for current priorities

### During Development

- [ ] Follow TypeScript best practices
- [ ] Use proper type definitions
- [ ] Add console logs for debugging
- [ ] Test in browser frequently
- [ ] Check TypeScript errors: `pnpm type-check`
- [ ] Check linting: `pnpm lint`
- [ ] Commit frequently with clear messages

### Before Committing

- [ ] **Type Check**: `pnpm type-check` passes
- [ ] **Lint**: `pnpm lint` passes
- [ ] **Build Test**: `pnpm build` succeeds
- [ ] **Manual Test**: Features work as expected
- [ ] **No Secrets**: No API keys in code
- [ ] **Documentation**: Update docs if needed
- [ ] **Clean Code**: Remove debug logs
- [ ] **Git Add**: Stage relevant files only

### Commit Process

```bash
# Stage changes
git add src/components/MyFeature.tsx

# Commit with descriptive message
git commit -m "feat: Add MyFeature component

- Implements X functionality
- Adds Y UI component
- Fixes Z issue"

# Push to remote
git push origin feature/my-feature
```

### Before Merging

- [ ] All checklist items above completed
- [ ] Feature tested end-to-end
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Pull request created
- [ ] Code reviewed (if team)

---

## 🔄 Common Workflows

### Adding a New Feature

1. **Plan**
   - [ ] Define requirements
   - [ ] Design component structure
   - [ ] Update types in `src/types/index.ts`

2. **Implement**
   - [ ] Create service if needed
   - [ ] Create store if needed
   - [ ] Create components
   - [ ] Add to App.tsx

3. **Test**
   - [ ] Test all user flows
   - [ ] Test error cases
   - [ ] Test on mobile
   - [ ] Test PWA offline

4. **Document**
   - [ ] Update README.md
   - [ ] Update CLAUDE.md
   - [ ] Add JSDoc comments

5. **Deploy**
   - [ ] Commit changes
   - [ ] Push to GitHub
   - [ ] Deploy to staging
   - [ ] Test staging
   - [ ] Deploy to production

### Adding a New LLM Provider

1. **Create Provider Class** (`src/services/ai-providers.ts`)
   ```typescript
   export class MyProvider implements LLMProvider {
     async complete(messages, config, onChunk) { }
     async validateConfig(config) { }
   }
   ```

2. **Register Provider**
   ```typescript
   aiRegistry.register('myprovider', new MyProvider());
   ```

3. **Update Types** (`src/types/index.ts`)
   ```typescript
   export type AIProvider = '...' | 'myprovider';
   ```

4. **Add UI** (`src/components/settings/AIProviders.tsx`)
   - Add option to provider dropdown
   - Add configuration form

5. **Test**
   - [ ] Test API connection
   - [ ] Test message sending
   - [ ] Test streaming
   - [ ] Test error handling

6. **Document**
   - [ ] Add to README providers section
   - [ ] Update CLAUDE.md examples

### Fixing a Bug

1. **Reproduce**
   - [ ] Identify steps to reproduce
   - [ ] Document expected vs actual behavior
   - [ ] Check browser console for errors

2. **Locate**
   - [ ] Find affected components
   - [ ] Check related services
   - [ ] Review database operations

3. **Fix**
   - [ ] Implement fix
   - [ ] Add defensive checks
   - [ ] Add logging if needed

4. **Test**
   - [ ] Verify fix works
   - [ ] Test related features
   - [ ] Test edge cases

5. **Document**
   - [ ] Add to CHANGELOG
   - [ ] Update docs if needed

### Deploying Updates

#### GitHub Pages
```bash
# Ensure everything is committed
git status

# Build and deploy
pnpm deploy

# Wait for GitHub Actions
# Visit: https://username.github.io/browser-ide-v2/
```

#### Vercel
```bash
# First time
vercel

# Updates
vercel --prod
```

#### Manual Build
```bash
# Build
pnpm build

# Test build locally
pnpm preview

# Deploy dist/ folder to hosting
```

---

## 🧪 Testing Workflow

### Manual Testing Checklist

#### Core Features
- [ ] **Project Management**
  - [ ] Create new project
  - [ ] Switch between projects
  - [ ] Star/unstar project
  - [ ] Delete project

- [ ] **File System**
  - [ ] Open file from explorer
  - [ ] Edit file content
  - [ ] Save file (Ctrl+S)
  - [ ] Create new file
  - [ ] Delete file

- [ ] **Git Operations**
  - [ ] Clone repository
  - [ ] View git status
  - [ ] Stage changes
  - [ ] Commit with message
  - [ ] Push to GitHub

- [ ] **AI Chat**
  - [ ] Start new session
  - [ ] Send message
  - [ ] Receive response
  - [ ] Switch AI provider
  - [ ] View session history

- [ ] **Settings**
  - [ ] Update editor settings
  - [ ] Add/update API keys
  - [ ] Change theme
  - [ ] Export/import settings

#### Platform Testing
- [ ] **Desktop (Chrome)** - Full functionality
- [ ] **Desktop (Edge)** - Full functionality
- [ ] **Desktop (Firefox)** - Basic features (no WebContainers)
- [ ] **Mobile (iOS Safari)** - PWA installation and basic editing
- [ ] **Mobile (Android Chrome)** - PWA installation and full features

#### Performance Testing
- [ ] Large file (>1MB) opens quickly
- [ ] Multiple projects switch smoothly
- [ ] AI responses stream without lag
- [ ] No memory leaks after extended use

---

## 🐛 Debugging Workflow

### When Something Breaks

1. **Check Console**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Note error messages and stack traces

2. **Check Network**
   - Open Network tab
   - Look for failed requests
   - Check response status and body

3. **Check State**
   - Use React DevTools
   - Inspect component props/state
   - Check Zustand store values

4. **Check Database**
   - DevTools → Application → IndexedDB
   - Verify data is stored correctly
   - Check for corruption

5. **Add Logging**
   ```typescript
   console.log('🔍 Debug:', { variable1, variable2 });
   console.group('Operation Name');
   // ... logs
   console.groupEnd();
   ```

6. **Isolate Issue**
   - Comment out code sections
   - Test with minimal reproduction
   - Binary search for problem

7. **Fix and Verify**
   - Implement fix
   - Test thoroughly
   - Remove debug logs

---

## 📊 Performance Optimization Workflow

### Identifying Issues

1. **Lighthouse Audit**
   - DevTools → Lighthouse → Generate report
   - Focus on Performance score
   - Review opportunities

2. **React Profiler**
   - DevTools → Profiler
   - Record interaction
   - Find slow components

3. **Network Analysis**
   - DevTools → Network
   - Check bundle sizes
   - Identify slow requests

### Optimizing

1. **Code Splitting**
   ```typescript
   const LazyComponent = lazy(() => import('./MyComponent'));
   ```

2. **Memoization**
   ```typescript
   const memoizedValue = useMemo(() => expensiveCalc(), [deps]);
   const memoizedCallback = useCallback(() => {}, [deps]);
   ```

3. **Debouncing**
   ```typescript
   const debouncedSearch = useMemo(
     () => debounce((query) => search(query), 300),
     []
   );
   ```

---

## 📝 Documentation Workflow

### Updating Documentation

When making changes, update:

1. **README.md**
   - Feature list
   - Installation steps
   - Configuration guide

2. **CLAUDE.md**
   - New patterns
   - Code examples
   - Architecture changes

3. **TODO.md**
   - Mark completed items
   - Add new tasks
   - Update priorities

4. **CHANGELOG.md** (if exists)
   - Version number
   - New features
   - Bug fixes
   - Breaking changes

### Writing Good Docs

- ✅ Use clear, concise language
- ✅ Provide code examples
- ✅ Include screenshots/gifs
- ✅ Explain "why" not just "how"
- ✅ Keep up-to-date
- ✅ Add links to resources

---

## 🚀 Release Workflow

### Pre-Release

- [ ] All features complete
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG prepared
- [ ] Version number bumped

### Release Steps

1. **Update Version**
   ```bash
   # Update package.json
   pnpm version patch  # or minor, major
   ```

2. **Tag Release**
   ```bash
   git tag -a v2.0.1 -m "Release v2.0.1"
   git push origin v2.0.1
   ```

3. **Create Release**
   - GitHub → Releases → New Release
   - Select tag
   - Add release notes
   - Attach build artifacts

4. **Deploy**
   ```bash
   pnpm build
   pnpm deploy
   ```

5. **Announce**
   - Update README
   - Post to social media
   - Email users (if applicable)

---

## 🎯 Project Maintenance

### Weekly Tasks
- [ ] Check GitHub issues
- [ ] Review pull requests
- [ ] Update dependencies: `pnpm update`
- [ ] Check for security updates
- [ ] Review analytics (if available)

### Monthly Tasks
- [ ] Review TODO.md and prioritize
- [ ] Update documentation
- [ ] Review and refactor code
- [ ] Performance audit
- [ ] Dependency cleanup

### Quarterly Tasks
- [ ] Major version planning
- [ ] Architecture review
- [ ] User feedback review
- [ ] Feature roadmap update
- [ ] Security audit

---

## 📞 Support Workflow

### Handling Issues

1. **Triage**
   - [ ] Reproduce issue
   - [ ] Gather information
   - [ ] Assign priority (P0-P3)
   - [ ] Label appropriately

2. **Investigate**
   - [ ] Check logs
   - [ ] Test locally
   - [ ] Identify root cause

3. **Fix**
   - [ ] Implement solution
   - [ ] Add tests
   - [ ] Update docs

4. **Communicate**
   - [ ] Update issue
   - [ ] Thank reporter
   - [ ] Close with resolution

---

**Keep this document updated as processes evolve!**

*Version: 2.0.0*
*Last Updated: November 2024*
