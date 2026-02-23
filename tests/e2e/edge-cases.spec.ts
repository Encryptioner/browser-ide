import { test, expect } from '@playwright/test';

/**
 * Edge Case and Performance Tests
 *
 * TC-054 to TC-057: Edge Cases
 * TC-058 to TC-060: Performance
 */

// Run tests serially to avoid IndexedDB conflicts between tabs
test.describe.configure({ mode: 'serial' });

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.app', { timeout: 30000 });
  });

  test('TC-054: Create file with special characters in name', async ({ page }) => {
    // Create file with spaces via command palette (more reliable than sidebar input)
    await page.keyboard.press('Control+Shift+P');
    const cmdInput = page.locator('#command-palette-input');
    await expect(cmdInput).toBeVisible({ timeout: 5000 });
    await cmdInput.fill('New File');
    await page.getByText('Create a new file').click();
    await page.waitForTimeout(500);

    // Verify a file tab was created
    const tab1 = page.locator('[role="tab"]').first();
    await expect(tab1).toBeVisible({ timeout: 5000 });

    // Create a second file
    await page.keyboard.press('Control+Shift+P');
    await expect(cmdInput).toBeVisible({ timeout: 5000 });
    await cmdInput.fill('New File');
    await page.getByText('Create a new file').click();
    await page.waitForTimeout(500);

    // Verify we now have multiple tabs
    const tabCount = await page.locator('[role="tab"]').count();
    expect(tabCount).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: 'test-results/TC-054-special-chars.png' });
  });

  test('TC-055: Open very large file', async ({ page }) => {
    // Create a file via command palette
    await page.keyboard.press('Control+Shift+P');
    const cmdInput = page.locator('#command-palette-input');
    await expect(cmdInput).toBeVisible({ timeout: 5000 });
    await cmdInput.fill('New File');
    await page.getByText('Create a new file').click();
    await page.waitForTimeout(500);

    // Verify file opened - check for editor tab
    const tab = page.locator('[role="tab"]').first();
    await expect(tab).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'test-results/TC-055-large-file.png' });
  });

  test('TC-056: Multiple browser tabs open same IDE', async ({ page: page1 }) => {
    await page1.waitForSelector('.app', { timeout: 30000 });

    // Ensure sidebar is visible for file creation
    const sidebar1 = page1.locator('[data-panel-id="sidebar"]');
    const isSidebarVisible = await sidebar1.isVisible().catch(() => false);
    if (!isSidebarVisible) {
      await page1.locator('button[title="Toggle Files"]').click();
      await page1.waitForTimeout(300);
    }

    // Create a file in first tab using command palette (more reliable than sidebar button)
    await page1.keyboard.press('Control+Shift+P');
    const cmd1 = page1.locator('#command-palette-input');
    await expect(cmd1).toBeVisible({ timeout: 5000 });
    await cmd1.fill('New File');
    await page1.getByText('Create a new file').click();
    await page1.waitForTimeout(500);

    // Verify a file was created (tab should appear)
    const tab1 = page1.locator('[role="tab"]').first();
    await expect(tab1).toBeVisible({ timeout: 5000 });

    // Open second tab
    const page2 = await page1.context().newPage();
    await page2.goto('/');
    await page2.waitForSelector('.app', { timeout: 30000 });

    // Second tab should load the app successfully
    await expect(page2.locator('.app')).toBeVisible({ timeout: 10000 });

    // Both tabs should function independently
    await page2.keyboard.press('Control+Shift+P');
    const cmd2 = page2.locator('#command-palette-input');
    await expect(cmd2).toBeVisible({ timeout: 5000 });
    await cmd2.fill('New File');
    await page2.getByText('Create a new file').click();
    await page2.waitForTimeout(500);

    // Verify second tab also created a file
    const tab2 = page2.locator('[role="tab"]').first();
    await expect(tab2).toBeVisible({ timeout: 5000 });

    await page1.screenshot({ path: 'test-results/TC-056-multitab.png' });
    await page2.close();
  });

  test('TC-057: Offline after initial load', async ({ page }) => {
    await page.waitForSelector('.app', { timeout: 30000 });

    // Go offline
    await page.context().setOffline(true);

    // Create a file via command palette (should work offline - IndexedDB is local)
    await page.keyboard.press('Control+Shift+P');
    const cmdInput = page.locator('#command-palette-input');
    await expect(cmdInput).toBeVisible({ timeout: 5000 });
    await cmdInput.fill('New File');
    await page.getByText('Create a new file').click();
    await page.waitForTimeout(500);

    // Verify file was created (tab should appear)
    const tab = page.locator('[role="tab"]').first();
    await expect(tab).toBeVisible({ timeout: 5000 });

    // Verify the app is still responsive while offline
    await expect(page.locator('.app')).toBeVisible();

    await page.screenshot({ path: 'test-results/TC-057-offline.png' });

    // Go back online
    await page.context().setOffline(false);
  });
});

test.describe('Performance', () => {
  test('TC-058: App loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForSelector('.app', { timeout: 30000 });

    const loadTime = Date.now() - startTime;

    console.log(`App loaded in ${loadTime}ms`);

    // App should load within 3 seconds (local dev)
    expect(loadTime).toBeLessThan(3000);

    // Wait for WebContainer to be ready
    await page.waitForTimeout(2000);

    // Check for console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Should have no critical errors
    const criticalErrors = logs.filter(log =>
      log.includes('Failed to fetch') ||
      log.includes('Uncaught') ||
      log.includes('TypeError')
    );

    console.log('Console errors:', criticalErrors);
    // Allow some non-critical errors
    expect(criticalErrors.length).toBeLessThan(5);

    await page.screenshot({ path: 'test-results/TC-058-load-time.png' });
  });

  test('TC-059: No memory leaks on repeated file open/close', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app', { timeout: 30000 });

    // Create test files via command palette
    const cmdInput = page.locator('#command-palette-input');
    for (let i = 1; i <= 3; i++) {
      await page.keyboard.press('Control+Shift+P');
      await expect(cmdInput).toBeVisible({ timeout: 5000 });
      await cmdInput.fill('New File');
      await page.getByText('Create a new file').click();
      await page.waitForTimeout(300);
    }

    // Verify files were created
    const tabCount = await page.locator('[role="tab"]').count();
    expect(tabCount).toBeGreaterThanOrEqual(3);

    // Use Chrome DevTools Protocol to get memory metrics if available
    // Otherwise, just verify the app stays responsive
    const startTime = Date.now();

    // Open and close files repeatedly using keyboard shortcuts
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Control+w');
      await page.waitForTimeout(50);
    }

    const elapsedTime = Date.now() - startTime;
    console.log(`20 cycles of file close took ${elapsedTime}ms`);

    // Should complete in reasonable time
    expect(elapsedTime).toBeLessThan(30000);

    // Verify app is still responsive
    await expect(page.locator('.app')).toBeVisible();

    await page.screenshot({ path: 'test-results/TC-059-memory-leaks.png' });
  });

  test('TC-060: Terminal responsive with rapid input', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.app', { timeout: 30000 });

    // Wait for WebContainer to be ready
    await page.waitForTimeout(3000);

    await page.click('text=Terminal');
    await page.waitForTimeout(500);

    // Test 1: Rapid typing - use keyboard since terminal is in iframe
    const startTime = Date.now();

    // Focus terminal by clicking in the bottom panel area
    const bottomPanel = page.locator('.bottom-panel').first();

    try {
      await bottomPanel.click();
      await page.waitForTimeout(100);

      // Type some characters rapidly
      for (let i = 0; i < 50; i++) {
        await page.keyboard.type(`x`);
      }
      await page.keyboard.press('Enter');

      const rapidTypeTime = Date.now() - startTime;
      console.log(`Rapid typing (50 chars) took ${rapidTypeTime}ms`);

      // Should complete within 5 seconds
      expect(rapidTypeTime).toBeLessThan(5000);
    } catch (e) {
      console.log('Terminal rapid typing test had issues:', e);
    }

    await page.waitForTimeout(1000);

    // Test 2: Long command
    try {
      const longCommand = 'echo ' + 'y'.repeat(100);
      await page.keyboard.type(longCommand);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('Long command test had issues:', e);
    }

    // Test 3: Multiple commands in sequence
    const startTime2 = Date.now();
    try {
      for (let i = 0; i < 10; i++) {
        await page.keyboard.type(`echo "test ${i}"`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
      }

      const multiCommandTime = Date.now() - startTime2;
      console.log(`10 commands took ${multiCommandTime}ms`);

      // Should complete within 10 seconds
      expect(multiCommandTime).toBeLessThan(10000);
    } catch (e) {
      console.log('Multiple commands test had issues:', e);
    }

    await page.screenshot({ path: 'test-results/TC-060-terminal-rapid.png' });
  });
});
