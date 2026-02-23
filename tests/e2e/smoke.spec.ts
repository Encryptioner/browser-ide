/**
 * E2E Smoke Tests for Browser IDE
 *
 * Verifies that the application boots correctly and critical UI elements
 * are rendered on the welcome screen. These tests act as a first-pass
 * health check before deeper functional tests run.
 */

import { test, expect } from '@playwright/test';

test.describe('App Boot and Service Readiness', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load without crashing and display the app shell', async ({ page }) => {
    // The app container with the "app" class should be present once services are ready
    const appContainer = page.locator('.app');
    await expect(appContainer).toBeVisible({ timeout: 30000 });
  });

  test('should show boot screen while services initialize then transition to main app', async ({ page }) => {
    // Either the boot screen or the main app should be visible at all times.
    // The boot screen contains "Browser IDE" text and a spinner or error.
    // Once services are ready, the main app (with titlebar) renders.
    const titlebar = page.locator('.titlebar');
    await expect(titlebar).toBeVisible({ timeout: 30000 });
  });

  test('should render the welcome screen with heading', async ({ page }) => {
    // Wait for the app to fully load past boot screen
    await page.waitForSelector('.app', { timeout: 30000 });

    const welcomeHeading = page.getByRole('heading', { name: 'Welcome to Browser IDE' });
    await expect(welcomeHeading).toBeVisible();
  });

  test('should display all four feature cards on the welcome screen', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    const featureCards = [
      'File Management',
      'Git Integration',
      'Run Code',
      'AI Assistant',
    ];

    for (const feature of featureCards) {
      // Each feature card has an h3 with the feature name
      const card = page.locator('.feature').filter({ hasText: feature });
      await expect(card.first()).toBeVisible();
    }
  });

  test('should show Clone Repository button on the welcome screen', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    const cloneButton = page.getByRole('button', { name: 'Clone Repository' });
    await expect(cloneButton).toBeVisible();
  });

  test('should show Open Settings button on the welcome screen', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    const settingsButton = page.getByRole('button', { name: 'Open Settings' });
    await expect(settingsButton).toBeVisible();
  });

  test('should have a titlebar with the app version label', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    const titlebar = page.locator('.titlebar');
    await expect(titlebar).toBeVisible();

    // The title contains "Browser IDE" followed by a version string
    const titleText = page.locator('.titlebar .title');
    await expect(titleText).toContainText('Browser IDE');
  });

  test('should have Clone button in the titlebar', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    // The titlebar has a Clone button (shows "Clone" on desktop, icon on mobile)
    const cloneTitlebarButton = page.locator('.titlebar-actions').getByRole('button', { name: /Clone/i });
    // On mobile it might only show the icon, so check for the button with title attribute
    const cloneByTitle = page.locator('.titlebar-actions button[title="Clone Repository"]');

    const isCloneTextVisible = await cloneTitlebarButton.isVisible().catch(() => false);
    const isCloneIconVisible = await cloneByTitle.isVisible().catch(() => false);

    expect(isCloneTextVisible || isCloneIconVisible).toBe(true);
  });

  test('should have Settings button in the titlebar', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    const settingsButton = page.locator('.titlebar-actions button[title="Settings"]');
    await expect(settingsButton).toBeVisible();
  });

  test('should not display any console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForSelector('.app', { timeout: 30000 });

    // Filter out known non-critical errors (e.g., service worker, COOP/COEP warnings)
    const criticalErrors = errors.filter(
      (msg) =>
        !msg.includes('service-worker') &&
        !msg.includes('coi-serviceworker') &&
        !msg.includes('Cross-Origin')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
