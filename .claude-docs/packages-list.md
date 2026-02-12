# Packages Installed for E2E Testing

**Date:** 2026-02-12

## Playwright E2E Testing Stack

### Core Testing Framework
```json
{
  "@playwright/test": "1.58.2",
  "@playwright/cli": "0.1.0"
}
```

### Installation Commands
```bash
# Install Playwright test framework
pnpm add -D @playwright/test@latest

# Install Playwright CLI for AI agents
pnpm add -D @playwright/cli@latest

# Install browser binaries
npx playwright install chromium firefox webkit
```

## Installed Browser Versions

| Browser | Version | Playwright Tag | Path |
|---------|---------|----------------|------|
| Chromium | 145.0.7632.6 | v1208 | ~/Library/Caches/ms-playwright/chromium-1208 |
| Firefox | 146.0.1 | v1509 | ~/Library/Caches/ms-playwright/firefox-1509 |
| WebKit | 26.0 | v2248 | ~/Library/Caches/ms-playwright/webkit-2248 |

## Additional Recommended Packages

### For Future Enhancements
```bash
# Visual regression testing
pnpm add -D @playwright/visual-regression

# Accessibility testing
pnpm add -D axe-playwright

# Performance testing
pnpm add -D lighthouse

# Test data generation
pnpm add -D @faker-js/faker

# Coverage reporting
pnpm add -D @cospired/i18n-coverage
```

## Package Aliases Used in Tests

| Import | Source |
|--------|--------|
| `test, expect` | `@playwright/test` |
| `playwright-cli` | `@playwright/cli` (CLI tool, not imported) |

## Browser Device Configurations

### Desktop
- Chrome: `devices['Desktop Chrome']`
- Firefox: `devices['Desktop Firefox']`
- Safari: `devices['Desktop Safari']`

### Mobile
- Pixel 5: `devices['Pixel 5']` (Android Chrome)
- iPhone 12: `devices['iPhone 12']` (iOS Safari)
