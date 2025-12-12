# Production Deployment Guide

> **Browser IDE Pro v2.0** - Complete deployment guide for production environments

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Platforms](#deployment-platforms)
3. [Environment Configuration](#environment-configuration)
4. [Security Considerations](#security-considerations)
5. [Mobile Testing](#mobile-testing)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Code Quality

- [ ] **TypeScript compilation passes:** `pnpm type-check`
- [ ] **No ESLint errors:** `pnpm lint`
- [ ] **Production build succeeds:** `pnpm build`
- [ ] **No console errors in production build**
- [ ] **All critical bugs fixed**

### Testing

- [ ] **Test on Chrome/Edge** (WebContainer support)
- [ ] **Test on Firefox** (basic functionality)
- [ ] **Test on Safari** (iOS/macOS)
- [ ] **Test on Android Chrome**
- [ ] **Test on iOS Safari**
- [ ] **Test PWA installation** (desktop + mobile)
- [ ] **Test offline functionality**
- [ ] **Test keyboard on real mobile device**

### Configuration

- [ ] **API key flow tested** (UI settings)
- [ ] **Z.ai GLM provider tested**
- [ ] **Anthropic provider tested**
- [ ] **Git operations tested**
- [ ] **WebContainer tested** (Chrome/Edge only)
- [ ] **Mobile keyboard tested** (real device)

---

## 🚀 Deployment Platforms

### 1. Vercel (Recommended) ⭐

**Why Vercel:**
- ✅ Zero configuration
- ✅ Automatic COOP/COEP headers
- ✅ CDN with global edge network
- ✅ Automatic HTTPS
- ✅ Preview deployments for PRs
- ✅ Excellent performance

**Steps:**

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy to production
pnpm build
vercel --prod
```

**Configuration File:** `vercel.json`

```json
{
  "version": 2,
  "name": "browser-ide-pro",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Resource-Policy",
          "value": "cross-origin"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

### 2. Netlify

**Why Netlify:**
- ✅ Simple deployment
- ✅ Automatic SSL
- ✅ Form handling
- ✅ Serverless functions
- ✅ Good free tier

**Steps:**

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Login
netlify login

# Build and deploy
pnpm build
netlify deploy --prod
```

**Configuration File:** `netlify.toml`

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Resource-Policy = "cross-origin"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

### 3. GitHub Pages

**Why GitHub Pages:**
- ✅ Free for public repos
- ✅ Integrated with GitHub
- ✅ Simple workflow

**Limitations:**
- ⚠️ Cannot set COOP/COEP headers (WebContainer won't work)
- ⚠️ Best for demo/portfolio only

**Steps:**

```bash
# Build and deploy
pnpm deploy
```

**GitHub Actions:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - uses: pnpm/action-setup@v2
        with:
          version: 8.14.0

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

### 4. Cloudflare Pages

**Why Cloudflare:**
- ✅ Fast global CDN
- ✅ Unlimited bandwidth
- ✅ Excellent performance
- ✅ Custom headers support

**Steps:**

1. Connect GitHub repository to Cloudflare Pages
2. Set build command: `pnpm build`
3. Set build output: `dist`
4. Add custom headers in Cloudflare dashboard

**Headers Configuration:**

```
_headers:
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
```

---

## 🔐 Environment Configuration

### API Key Management

**✅ Recommended Approach: User-Defined Settings**

API keys should be configured by users in the Settings UI, NOT in environment variables.

**Why:**
- ✅ Users control their own API keys
- ✅ No accidental key exposure
- ✅ Per-user configuration
- ✅ Stored securely in IndexedDB

**UI Settings Location:**
```
Settings (⚙️) → AI Providers → Configure API Keys
```

**Supported Providers:**
1. **Anthropic Claude**
   - API Key: `sk-ant-...`
   - Base URL: `https://api.anthropic.com/v1` (default)

2. **Z.ai GLM-4.6**
   - API Key: `glm-...`
   - Base URL: `https://api.z.ai/api/anthropic` (default)

3. **OpenAI**
   - API Key: `sk-...`
   - Base URL: `https://api.openai.com/v1` (default)

---

### Optional: Development Defaults

**.env file (Optional - Development Only)**

Use `.env` ONLY for local development/testing defaults. Never commit real API keys.

```bash
# .env (OPTIONAL - for development defaults only)
# Copy from .env.example

# Optional defaults for testing - users should configure in UI
VITE_ANTHROPIC_API_KEY=
VITE_GLM_API_KEY=
VITE_Z_AI_BASE_URL=https://api.z.ai/api/anthropic
```

**Priority Order:**
1. **UI Settings** (Primary) - Stored in IndexedDB
2. **Environment Variables** (Fallback) - Development defaults only
3. **Empty** - User must configure

**Code Implementation:**

```typescript
// src/services/ai-providers.ts
const getAPIKey = (provider: 'anthropic' | 'glm' | 'openai'): string => {
  // 1. Check user settings (IndexedDB) - PRIMARY
  const userSettings = getUserSettings();
  if (userSettings?.apiKeys?.[provider]) {
    return userSettings.apiKeys[provider];
  }

  // 2. Check environment variables - FALLBACK for development
  const envKey = import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`];
  if (envKey) {
    return envKey;
  }

  // 3. Return empty - user must configure in UI
  return '';
};
```

---

## 🔒 Security Considerations

### 1. API Key Storage

**Current Implementation:**
- ✅ Stored in IndexedDB (encrypted by browser)
- ✅ Never sent to any server except AI provider
- ✅ Not exposed in logs
- ✅ Not included in error messages

**Enhancements Needed:**
- [ ] Add client-side encryption (Web Crypto API)
- [ ] Add "show/hide" toggle for API keys
- [ ] Show only last 4 characters in UI
- [ ] Add API key validation before saving

---

### 2. Content Security Policy (CSP)

**Recommended Headers:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self'
    https://api.anthropic.com
    https://api.z.ai
    https://api.openai.com;
  worker-src 'self' blob:;
```

**Note:** `'unsafe-eval'` is required for Monaco Editor and WebContainer.

---

### 3. HTTPS Enforcement

- ✅ Always use HTTPS in production
- ✅ Enable HSTS (HTTP Strict Transport Security)
- ✅ Redirect HTTP to HTTPS

---

### 4. Sensitive Data Handling

**Do NOT log:**
- ❌ API keys
- ❌ User code/files
- ❌ Git credentials
- ❌ Personal tokens

**Safe to log:**
- ✅ Feature usage (anonymized)
- ✅ Error types (without sensitive data)
- ✅ Performance metrics

---

## 📱 Mobile Testing

### Required Testing

#### 1. Keyboard Behavior
**Test Cases:**
- [ ] Keyboard shows when input focused
- [ ] Keyboard hides when input blurred
- [ ] Layout adjusts when keyboard visible
- [ ] Input remains visible when keyboard shows
- [ ] Keyboard height detected correctly
- [ ] Portrait and landscape modes work
- [ ] Safe area insets respected (iPhone X+)

**Test Devices:**
- iPhone 12+ (iOS 15+)
- Android phone (Chrome 94+)
- iPad (latest iOS)
- Android tablet

---

#### 2. Touch Interactions
**Test Cases:**
- [ ] All buttons have 44px minimum touch target
- [ ] No accidental double-taps
- [ ] Swipe gestures work
- [ ] Long press works (file tree)
- [ ] Pinch-to-zoom disabled
- [ ] Pull-to-refresh disabled

---

#### 3. PWA Installation
**Test Cases:**
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] App icon appears on home screen
- [ ] App launches in standalone mode
- [ ] Splash screen shows
- [ ] Offline functionality works

---

### Testing on Same WiFi

**For mobile testing on real devices:**

```bash
# Start dev server accessible on network
pnpm dev:mobile

# Server will be available at:
# http://YOUR_IP:5173
# Example: http://192.168.1.100:5173
```

**Steps:**
1. Run `pnpm dev:mobile` on development machine
2. Note the IP address shown (e.g., `192.168.1.100:5173`)
3. Connect mobile device to same WiFi
4. Open browser on mobile device
5. Navigate to `http://YOUR_IP:5173`
6. Test all features

---

### Mobile Debugging

**Chrome DevTools (Android):**
1. Enable USB debugging on Android
2. Connect device via USB
3. Open `chrome://inspect` on desktop
4. Select device and inspect

**Safari Web Inspector (iOS):**
1. Enable Web Inspector on iOS (Settings → Safari → Advanced)
2. Connect device via USB
3. Open Safari on Mac
4. Develop → [Device Name] → Select page

---

## ⚡ Performance Optimization

### 1. Build Optimization

**Already Implemented:**
- ✅ Vite code splitting
- ✅ Tree shaking
- ✅ Minification
- ✅ Gzip compression

**Additional Optimizations:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['@monaco-editor/react', 'monaco-editor'],
          'vendor': ['react', 'react-dom', 'zustand'],
          'ai': ['@anthropic-ai/sdk'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

---

### 2. Runtime Optimization

**Lazy Loading:**

```typescript
// Lazy load Monaco Editor
const MonacoEditor = lazy(() => import('@/components/editor/MonacoEditor'));

// Lazy load heavy components
const ClaudeCLI = lazy(() => import('@/components/claude-cli/ClaudeCLI'));
```

**Code Splitting:**

```typescript
// Route-based code splitting
const routes = [
  {
    path: '/',
    component: lazy(() => import('@/pages/Home')),
  },
  {
    path: '/settings',
    component: lazy(() => import('@/pages/Settings')),
  },
];
```

---

### 3. Lighthouse Score Targets

**Performance:**
- Target: 90+
- Current: ~85

**Optimizations:**
- [ ] Lazy load Monaco Editor
- [ ] Reduce bundle size
- [ ] Optimize images
- [ ] Add resource hints

**Accessibility:**
- Target: 95+
- Current: ~90

**Improvements:**
- [ ] Add ARIA labels
- [ ] Improve keyboard navigation
- [ ] Add focus indicators
- [ ] Fix color contrast

**PWA:**
- Target: 100
- Current: 100 ✅

**SEO:**
- Target: 100
- Current: 100 ✅

---

## 📊 Monitoring & Analytics (Optional)

### Error Tracking

**Sentry Integration:**

```bash
pnpm add @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.headers;
      }
      return event;
    },
  });
}
```

---

### Analytics

**Plausible Analytics (Privacy-Friendly):**

```html
<!-- public/index.html -->
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

**Or Google Analytics:**

```typescript
// src/utils/analytics.ts
export const trackEvent = (category: string, action: string, label?: string) => {
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
    });
  }
};
```

---

## 🐛 Troubleshooting

### WebContainer Not Working

**Symptoms:**
- "WebContainer failed to initialize"
- Terminal doesn't respond
- Node.js commands don't run

**Solutions:**
1. **Check Browser:** Must use Chrome or Edge (not Firefox/Safari)
2. **Check Headers:** Verify COOP/COEP headers are set
3. **Check Console:** Look for security errors
4. **Try Vercel:** GitHub Pages doesn't support required headers

**Debug:**
```bash
# Check headers in browser
curl -I https://your-domain.com

# Look for:
# Cross-Origin-Embedder-Policy: require-corp
# Cross-Origin-Opener-Policy: same-origin
```

---

### Mobile Keyboard Not Detected

**Symptoms:**
- Layout doesn't adjust when keyboard appears
- Input gets hidden behind keyboard
- Height detection returns 0

**Solutions:**
1. **Check Browser:** Virtual Keyboard API only on Chrome 94+ Android
2. **Check Config:** Ensure `MOBILE_KEYBOARD.enabled: true`
3. **Test Real Device:** Emulator may not trigger keyboard events
4. **Check Console:** Enable debug logs in development

**Debug:**
```typescript
// Enable debug logs
localStorage.setItem('debug-keyboard', 'true');
```

---

### PWA Not Installing

**Symptoms:**
- Install prompt doesn't appear
- "Add to Home Screen" not available
- App doesn't load offline

**Solutions:**
1. **Check HTTPS:** PWA requires HTTPS (except localhost)
2. **Check Manifest:** Verify `manifest.json` is valid
3. **Check Service Worker:** Must be registered
4. **Check Icons:** Need 192px and 512px icons
5. **Clear Cache:** Unregister old service workers

**Debug:**
```
Chrome DevTools → Application → Manifest
Chrome DevTools → Application → Service Workers
```

---

### API Calls Failing

**Symptoms:**
- "API key not configured"
- CORS errors
- Network errors

**Solutions:**
1. **Check API Key:** Configure in Settings UI
2. **Check Base URL:** Verify correct endpoint
3. **Check Network:** Look for CORS errors
4. **Check Rate Limits:** May be hitting provider limits

**Debug:**
```typescript
// Test API key
const testAPIKey = async (provider: string, apiKey: string) => {
  const providers = {
    anthropic: 'https://api.anthropic.com/v1/messages',
    glm: 'https://api.z.ai/api/anthropic/v1/messages',
  };

  const response = await fetch(providers[provider], {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    }),
  });

  console.log('API Test:', response.status, await response.json());
};
```

---

## 🎯 Post-Deployment Checklist

### Immediate (Within 24 hours)

- [ ] Verify deployment successful
- [ ] Test all major features
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Test on multiple devices
- [ ] Verify PWA installation
- [ ] Check mobile keyboard

### Short-term (Within 1 week)

- [ ] Monitor user feedback
- [ ] Track error rates
- [ ] Optimize performance issues
- [ ] Fix critical bugs
- [ ] Update documentation

### Long-term (Ongoing)

- [ ] Monitor analytics
- [ ] Track usage patterns
- [ ] Plan feature updates
- [ ] Regular security updates
- [ ] Performance optimization

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/browser-ide-v2/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/browser-ide-v2/discussions)
- **Email:** support@browser-ide.dev

---

**Last Updated:** December 2, 2024
**Version:** 2.0.0
**License:** MIT
