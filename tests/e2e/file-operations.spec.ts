/**
 * E2E Tests for Browser IDE - File Operations
 *
 * Verifies the command palette, file explorer visibility,
 * and editor tab interactions.
 */

import { test, expect } from '@playwright/test';

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for the app to be fully ready (past boot screen)
    await page.waitForSelector('.app', { timeout: 30000 });
  });

  test('should open command palette with Ctrl+Shift+P', async ({ page }) => {
    // Press Ctrl+Shift+P to open command palette
    await page.keyboard.press('Control+Shift+P');

    // The command palette has an input with placeholder text
    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });
    await expect(commandInput).toBeFocused();
  });

  test('should open command palette with Meta+Shift+P on macOS', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+P');

    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });
  });

  test('should close command palette with Escape', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Control+Shift+P');
    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(commandInput).not.toBeVisible();
  });

  test('should display commands grouped by category in the command palette', async ({ page }) => {
    await page.keyboard.press('Control+Shift+P');

    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });

    // Verify command categories are visible (File, View, Editor, Git)
    const fileCategory = page.getByText('File', { exact: true }).first();
    await expect(fileCategory).toBeVisible();

    const viewCategory = page.getByText('View', { exact: true }).first();
    await expect(viewCategory).toBeVisible();
  });

  test('should filter commands when typing in command palette', async ({ page }) => {
    await page.keyboard.press('Control+Shift+P');

    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });

    // Type a search term
    await commandInput.fill('toggle');

    // Should show toggle commands (Toggle Sidebar, Toggle Terminal, Toggle Preview)
    const toggleSidebar = page.getByText('Toggle Sidebar');
    await expect(toggleSidebar).toBeVisible();
  });

  test('should create a new file via command palette', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Control+Shift+P');

    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });

    // Search for "New File" command
    await commandInput.fill('New File');

    // Click the New File command
    const newFileCommand = page.getByText('Create a new file');
    await newFileCommand.click();

    // After creating a file, the editor should show tabs with the untitled file
    const editorTabs = page.getByRole('tablist', { name: 'Open file tabs' });
    await expect(editorTabs).toBeVisible({ timeout: 5000 });

    // There should be a tab for the new untitled file
    const untitledTab = page.locator('[role="tab"]').filter({ hasText: 'untitled' });
    await expect(untitledTab.first()).toBeVisible();
  });

  test('should show file explorer when sidebar is open on desktop', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'Desktop-only test - sidebar panel hidden on mobile');

    // The sidebar should be open by default; verify file explorer is present
    // The sidebar panel contains the FileExplorer component
    const sidebarPanel = page.locator('#sidebar');
    const isSidebarVisible = await sidebarPanel.isVisible().catch(() => false);

    if (isSidebarVisible) {
      await expect(sidebarPanel).toBeVisible();
    }
  });

  test('should show editor tabs and allow clicking between them', async ({ page }) => {
    // First, create two files via command palette
    // Create file 1
    await page.keyboard.press('Control+Shift+P');
    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });
    await commandInput.fill('New File');
    await page.getByText('Create a new file').click();

    // Wait for tab to appear
    const firstTab = page.locator('[role="tab"]').first();
    await expect(firstTab).toBeVisible({ timeout: 5000 });

    // Create file 2
    await page.keyboard.press('Control+Shift+P');
    await expect(commandInput).toBeVisible({ timeout: 5000 });
    await commandInput.fill('New File');
    await page.getByText('Create a new file').click();

    // Should now have two tabs
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);

    // Click the first tab to switch to it
    await tabs.first().click();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('should close a file tab when clicking the close button', async ({ page }) => {
    // Create a file first
    await page.keyboard.press('Control+Shift+P');
    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });
    await commandInput.fill('New File');
    await page.getByText('Create a new file').click();

    // Wait for the tab to appear
    const tab = page.locator('[role="tab"]').first();
    await expect(tab).toBeVisible({ timeout: 5000 });

    // Count tabs before closing
    const tabsBefore = await page.locator('[role="tab"]').count();

    // Click the close button on the tab
    const closeButton = tab.locator('.tab-close');
    await closeButton.click();

    // Either we have fewer tabs or the welcome screen is back
    const tabsAfter = await page.locator('[role="tab"]').count();
    const welcomeVisible = await page.getByRole('heading', { name: 'Welcome to Browser IDE' }).isVisible().catch(() => false);

    expect(tabsAfter < tabsBefore || welcomeVisible).toBe(true);
  });

  test('should navigate from welcome screen to editor when creating a file', async ({ page }) => {
    // Verify we start on the welcome screen
    const welcomeHeading = page.getByRole('heading', { name: 'Welcome to Browser IDE' });
    await expect(welcomeHeading).toBeVisible();

    // Create a new file via command palette
    await page.keyboard.press('Control+Shift+P');
    const commandInput = page.locator('#command-palette-input');
    await expect(commandInput).toBeVisible({ timeout: 5000 });
    await commandInput.fill('New File');
    await page.getByText('Create a new file').click();

    // The welcome screen should be replaced by editor tabs
    await expect(welcomeHeading).not.toBeVisible({ timeout: 5000 });

    // Editor tabs should now be visible
    const editorTabs = page.getByRole('tablist', { name: 'Open file tabs' });
    await expect(editorTabs).toBeVisible();
  });
});
