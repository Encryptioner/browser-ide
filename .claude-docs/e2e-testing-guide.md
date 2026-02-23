# E2E Testing Guide for Browser IDE

## Packages Installed

### Testing Dependencies
- `@playwright/cli@0.1.0` - CLI interface for browser automation
- `@playwright/test@1.58.2` - Playwright test framework (already installed)

### Browsers Installed
- Chromium 145.0.7632.6 (playwright v1208)
- Firefox 146.0.1 (playwright v1509)
- WebKit 26.0 (playwright v2248)

## Commands Reference

### Install Playwright Browsers
```bash
npx playwright install chromium firefox webkit
```

### Run E2E Tests
```bash
# Run all E2E tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test tests/e2e/app.spec.ts

# Run with UI (headed mode)
pnpm exec playwright test --ui

# Run with debug mode
pnpm exec playwright test --debug

# Run specific browser
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox
pnpm exec playwright test --project=webkit

# Run mobile tests
pnpm exec playwright test --project="Mobile Chrome"
pnpm exec playwright test --project="Mobile Safari"
```

### Playwright CLI Commands
```bash
# Open browser with URL
npx playwright-cli open http://localhost:5173 --headed

# Take snapshot
npx playwright-cli snapshot

# Click element by reference
npx playwright-cli click e1

# Type text
npx playwright-cli type "Hello World"

# Take screenshot
npx playwright-cli screenshot

# List sessions
npx playwright-cli list

# Close all browsers
npx playwright-cli close-all
```

## Test Structure

```
tests/e2e/
├── app.spec.ts              # Application loading tests
├── editor.spec.ts           # Editor functionality tests
├── project-management.spec.ts # Project management tests
└── (more to be added)
```

## Key Files

- `playwright.config.ts` - Playwright configuration
- `tests/e2e/` - E2E test directory
- `playwright-report/` - HTML test reports
- `test-results/` - Test results and artifacts

## Notes

- Tests run on http://localhost:5173
- Dev server starts automatically via webServer config
- Screenshot on failure enabled
- Video recording on retry enabled
- Trace on first retry enabled
