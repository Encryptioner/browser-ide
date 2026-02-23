/**
 * Visual Regression Tests for Browser IDE
 *
 * Captures screenshots at multiple viewport breakpoints to detect
 * unintended visual changes. Uses Playwright's toHaveScreenshot()
 * for pixel-level comparison against stored baselines.
 *
 * To generate or update baselines:
 *   pnpm test:visual:update
 *
 * To run visual regression checks:
 *   pnpm test:visual
 */

import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'xsm', width: 375, height: 667 },
  { name: 'sm', width: 480, height: 800 },
  { name: 'md', width: 640, height: 900 },
  { name: 'lg', width: 768, height: 1024 },
  { name: 'xl', width: 1024, height: 768 },
  { name: '2xl', width: 1280, height: 900 },
] as const;

/**
 * Wait for the app to fully boot past the loading/boot screen
 * and reach a stable visual state.
 */
async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.waitForSelector('.app', { timeout: 30000 });
  // Allow animations and lazy-loaded content to settle
  await page.waitForTimeout(1000);
}

test.describe('Visual Regression', () => {
  // Skip in CI since baseline snapshots are not committed to the repository.
  // Run locally with `pnpm test:visual:update` to generate/update baselines.
  test.skip(() => !!process.env.CI, 'Visual regression tests are skipped in CI (no baseline snapshots)');

  // Run visual tests only in the chromium project to avoid
  // multiplying baselines across all browser/device projects.
  // Cross-browser visual testing can be enabled by removing this filter.
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual regression runs on Chromium only');

  for (const bp of BREAKPOINTS) {
    test.describe(`Breakpoint: ${bp.name} (${bp.width}px)`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: bp.width, height: bp.height });
        await page.goto('/');
        await waitForAppReady(page);
      });

      test(`full app layout at ${bp.name}`, async ({ page }) => {
        await expect(page).toHaveScreenshot(`app-layout-${bp.name}.png`, {
          fullPage: true,
        });
      });

      test(`editor area at ${bp.name}`, async ({ page }) => {
        // The editor area includes the welcome screen or the Monaco editor.
        // On the default welcome view, this is the main content region.
        const editorArea = page.locator('.editor-area, .welcome-screen, [class*="editor-group"]').first();
        const isVisible = await editorArea.isVisible().catch(() => false);

        if (isVisible) {
          await expect(editorArea).toHaveScreenshot(`editor-area-${bp.name}.png`);
        } else {
          // Fallback: capture the main content area if editor-specific selectors are not present
          const mainContent = page.locator('.main-content, .content, main').first();
          await expect(mainContent).toHaveScreenshot(`editor-area-${bp.name}.png`);
        }
      });

      test(`bottom panel at ${bp.name}`, async ({ page }) => {
        // The bottom panel contains terminal, output, problems, etc.
        // It may not be visible at smaller breakpoints.
        const bottomPanel = page.locator('.bottom-panel, .panel, [class*="terminal-panel"]').first();
        const isVisible = await bottomPanel.isVisible().catch(() => false);

        if (isVisible) {
          await expect(bottomPanel).toHaveScreenshot(`bottom-panel-${bp.name}.png`);
        } else {
          // Skip the screenshot if the bottom panel is hidden at this breakpoint.
          // This is expected behavior on small screens.
          test.skip();
        }
      });
    });
  }
});
