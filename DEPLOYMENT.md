# Deployment Guide - Browser IDE Pro v2.0

This guide covers deploying Browser IDE Pro to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build for Production](#build-for-production)
- [Deployment Options](#deployment-options)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)

## Prerequisites

- Node.js 18+ and pnpm 8+
- Git configured
- Platform-specific account (GitHub Pages, Netlify, Vercel, etc.)

## Build for Production

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Type Check

```bash
pnpm type-check
```

Ensure no TypeScript errors before building.

### 3. Build

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting and tree shaking
- Source maps (if enabled)
- Service worker for PWA
- Optimized assets

### 4. Preview Build Locally

```bash
pnpm preview
```

Test the production build at `http://localhost:4173`

## Deployment Options

### Option 1: GitHub Pages

**Automatic Deployment (Recommended)**

1. Create `.github/workflows/deploy.yml`:

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

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-slim
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Build
        run: pnpm build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. Enable GitHub Pages in repository settings
3. Push to main branch - automatic deployment!

**Manual Deployment**

```bash
pnpm deploy
```

This runs `gh-pages -d dist` to deploy to GitHub Pages.

### Option 2: Netlify

**Via Netlify CLI**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Via Git Integration**

1. Connect repository to Netlify
2. Configure build settings:
   - Build command: `pnpm build`
   - Publish directory: `dist`
   - Node version: 18

3. Add `netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Cross-Origin-Embedder-Policy = "require-corp"
    Cross-Origin-Opener-Policy = "same-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Vercel

**Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**Via Git Integration**

1. Connect repository to Vercel
2. Configure:
   - Framework: Vite
   - Build command: `pnpm build`
   - Output directory: `dist`

3. Add `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

### Option 4: Self-Hosted (Docker)

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Build and run:

```bash
docker build -t browser-ide-pro .
docker run -p 8080:80 browser-ide-pro
```

## Environment Variables

No environment variables are required for basic deployment. For custom configuration:

```bash
# .env.production (optional)
VITE_APP_VERSION=2.0.0
```

Access in code:

```typescript
import.meta.env.VITE_APP_VERSION
```

## Post-Deployment

### 1. Verify Deployment

- [ ] App loads without errors
- [ ] All routes work correctly
- [ ] Service worker registers (check DevTools → Application)
- [ ] PWA installable
- [ ] Responsive on mobile/tablet/desktop
- [ ] Console has no errors

### 2. Test PWA

- [ ] Install app from browser
- [ ] Works offline
- [ ] Updates prompt appears when new version deployed

### 3. Performance

Check with Lighthouse:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### 4. Security Headers

Verify headers at: https://securityheaders.com/

Should include:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Cross-Origin-Embedder-Policy: require-corp
- Cross-Origin-Opener-Policy: same-origin

### 5. Monitor

Set up monitoring:

- Error tracking (Sentry, LogRocket)
- Analytics (Google Analytics, Plausible)
- Uptime monitoring (UptimeRobot, Pingdom)

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

### 404 on Routes

Ensure your hosting platform supports SPA routing. Add redirects to `index.html`.

### Service Worker Issues

Clear service workers in DevTools → Application → Service Workers → Unregister

### Large Bundle Size

Check bundle analysis:

```bash
pnpm build
```

Look for large chunks and optimize imports.

## Updating Deployment

```bash
# Pull latest changes
git pull

# Install updated dependencies
pnpm install

# Build
pnpm build

# Deploy (depends on platform)
pnpm deploy  # or platform-specific command
```

## Rollback

### GitHub Pages

```bash
git revert HEAD
git push
```

### Netlify/Vercel

Use platform dashboard to rollback to previous deployment.

## Support

For issues:
- Check browser console for errors
- Review build logs
- Check platform-specific documentation
- Open issue on GitHub repository

---

**Production Checklist:**

- [ ] Type check passes
- [ ] Build completes successfully
- [ ] Preview build tested locally
- [ ] Environment variables configured
- [ ] Security headers set
- [ ] PWA manifest configured
- [ ] Service worker working
- [ ] Mobile responsive
- [ ] Lighthouse score acceptable
- [ ] Error tracking configured
- [ ] Monitoring set up
