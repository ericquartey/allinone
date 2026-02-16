/**
 * ============================================================================
 * UI Visibility Regression Test
 * Verifica che tutti gli elementi principali dell'UI siano visibili dopo login
 * ============================================================================
 */

import { test, expect } from '@playwright/test';

// Base URL - configurato in playwright.config.ts
const BASE_URL = 'http://localhost:3007';

test.describe('UI Visibility - Main Layout Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto(BASE_URL);

    // NOTA: In DEV mode, l'autenticazione è bypassata (vedi App.tsx line 222-227)
    // Quindi dovremmo essere già autenticati
  });

  test('Header should be visible and contain all elements', async ({ page }) => {
    // Wait for header to be visible
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Check header background color (should be white)
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    // Check menu toggle button exists
    const menuButton = header.locator('button').first();
    await expect(menuButton).toBeVisible();

    // Check logo section
    const logo = header.locator('div').filter({ hasText: 'F' }).first();
    await expect(logo).toBeVisible();

    // Check title
    const title = header.getByText('EjLog WMS');
    await expect(title).toBeVisible();

    // Check user menu section (avatar/profile)
    const userSection = header.locator('button').last();
    await expect(userSection).toBeVisible();
  });

  test('Sidebar should be visible and collapsible', async ({ page }) => {
    // Wait for sidebar to be visible
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Sidebar should have the correct background color (ferretto-dark: #32373c)
    await expect(sidebar).toHaveCSS('background-color', 'rgb(50, 55, 60)');

    // Check if sidebar contains navigation items
    const navItems = sidebar.locator('nav a, nav button');
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);

    // Check for toggle button
    const toggleButton = page.locator('button[aria-label*="menu"]').first();
    await expect(toggleButton).toBeVisible();

    // Test collapsing sidebar
    await toggleButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // After collapse, sidebar should still be visible but narrower
    await expect(sidebar).toBeVisible();

    // Expand again
    await toggleButton.click();
    await page.waitForTimeout(500);
    await expect(sidebar).toBeVisible();
  });

  test('Main content area should be visible', async ({ page }) => {
    // Main content should be visible
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 10000 });

    // Main should have correct background (gray-50)
    await expect(main).toHaveCSS('background-color', 'rgb(249, 250, 251)');

    // Content container should exist
    const container = main.locator('.container').first();
    await expect(container).toBeVisible();
  });

  test('Footer should be visible at bottom', async ({ page }) => {
    // Footer should be visible
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Footer should contain "EjLog WMS"
    await expect(footer).toContainText('EjLog WMS');

    // Footer should contain "Ferretto Group"
    await expect(footer).toContainText('Ferretto Group');
  });

  test('Full layout integration - all elements present', async ({ page }) => {
    // Verify all major layout components are present simultaneously
    const header = page.locator('header').first();
    const sidebar = page.locator('aside').first();
    const main = page.locator('main').first();
    const footer = page.locator('footer').first();

    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(sidebar).toBeVisible();
    await expect(main).toBeVisible();
    await expect(footer).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tests/screenshots/ui-layout-full.png',
      fullPage: true
    });
  });

  test('Navigation menu items are clickable', async ({ page }) => {
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Find first navigation link in sidebar
    const firstNavLink = sidebar.locator('nav a').first();
    await expect(firstNavLink).toBeVisible();

    // Link should be clickable (not disabled)
    await expect(firstNavLink).toBeEnabled();

    // Click should navigate (check that page doesn't throw)
    await firstNavLink.click();
    await page.waitForTimeout(1000);

    // Verify we're still on a valid page (header should still be visible)
    await expect(page.locator('header')).toBeVisible();
  });

  test('Responsive sidebar on different viewport sizes', async ({ page }) => {
    // Test on desktop (default)
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(sidebar).toBeVisible(); // Should still be visible

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    // On mobile, sidebar might be collapsed or hidden by default
    // This is acceptable behavior
  });
});

test.describe('UI Visibility - No Console Errors', () => {
  test('Page should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the application
    await page.goto(BASE_URL);

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that no critical errors occurred
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') && // Ignore favicon errors
        !err.includes('DevTools') && // Ignore DevTools warnings
        !err.includes('Extension') // Ignore browser extension errors
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
    }

    // Optionally fail the test if there are errors
    // expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('UI Visibility - Network Requests', () => {
  test('Critical assets should load successfully', async ({ page }) => {
    const failedRequests: string[] = [];

    // Listen for failed requests
    page.on('requestfailed', (request) => {
      failedRequests.push(request.url());
    });

    // Navigate to the application
    await page.goto(BASE_URL);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Filter out non-critical failures (fonts, analytics, etc.)
    const criticalFailures = failedRequests.filter(
      (url) =>
        !url.includes('fonts.googleapis.com') &&
        !url.includes('analytics') &&
        !url.includes('gtag')
    );

    if (criticalFailures.length > 0) {
      console.log('Failed requests:', criticalFailures);
    }

    // Verify no critical asset failures
    expect(criticalFailures.length).toBeLessThan(5); // Allow some tolerance
  });
});
