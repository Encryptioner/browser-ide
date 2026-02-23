/**
 * E2E Tests for Browser IDE - Application Loading
 *
 * These tests verify the core application loads and renders correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Application Loading', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');

    // Check that the page title contains "Browser IDE"
    await expect(page).toHaveTitle(/Browser IDE/);
  });

  test('should render the main IDE layout', async ({ page }) => {
    await page.goto('/');

    // Check for the main layout components
    // The IDE should have a sidebar with projects, file explorer, editor, and terminal
    const mainContainer = page.locator('main, #root, [class*="ide"], [class*="IDE"]').first();
    await expect(mainContainer).toBeVisible();
  });

  test('should handle the root path', async ({ page }) => {
    const response = await page.goto('/');

    // Should get a successful response
    expect(response?.status()).toBeLessThan(400);
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check for viewport meta tag (important for mobile PWA)
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);

    // Check for charset
    const charset = page.locator('meta[charset]');
    await expect(charset).toHaveAttribute('charset', /utf-8/i);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still load without errors
    await expect(page).toHaveTitle(/Browser IDE/);
  });

  test('should be responsive on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // Page should still load without errors
    await expect(page).toHaveTitle(/Browser IDE/);
  });

  test('should have no console errors on load', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait a bit for any async errors to appear
    await page.waitForTimeout(2000);

    // Filter out errors that are expected:
    // 1. COOP/COEP headers - Required for WebContainers, expected in dev mode
    // 2. Extension/DevTools - Browser extension errors, not our app
    // 3. Git errors when no repo exists - Expected for fresh IDE without initialized git
    const criticalErrors = errors.filter(err =>
      !err.includes('COOP') &&
      !err.includes('COEP') &&
      !err.includes('Extension') &&
      !err.includes('DevTools') &&
      !err.includes('Status matrix error') &&
      !err.includes('Get current branch error') &&
      !err.includes('Failed to load resource') &&
      !err.includes('ENOENT')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
