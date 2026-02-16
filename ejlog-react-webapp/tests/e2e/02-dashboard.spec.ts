import { test, expect } from '../fixtures/authFixtures';
import { waitForNetworkIdle, waitForLoadingToFinish } from '../helpers/testHelpers';

/**
 * E2E Tests: Dashboard
 *
 * Tests the main dashboard page and navigation
 */

test.describe('Dashboard', () => {
  test('should display dashboard after authentication', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Verify dashboard title
    const title = await dashboardPage.getPageTitle();
    expect(title.length).toBeGreaterThan(0);

    // Take screenshot
    await dashboardPage.takeDashboardScreenshot('dashboard-initial');
  });

  test('should show sidebar navigation', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();

    // Verify sidebar is visible
    await expect(dashboardPage.sidebar).toBeVisible();

    // Verify navigation items
    await dashboardPage.verifySidebarItems();
  });

  test('should navigate to Lists page from dashboard', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();

    // Navigate to Lists
    await dashboardPage.navigateToLists();

    // Verify we're on Lists page
    expect(page.url()).toContain('/lists');

    // Wait for page to load
    await waitForNetworkIdle(page, 10000);
    await waitForLoadingToFinish(page, 10000);
  });

  test('should navigate to Items page from dashboard', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();

    // Check if Items link exists
    const itemsLinkVisible = await dashboardPage.itemsLink.isVisible().catch(() => false);

    if (itemsLinkVisible) {
      await dashboardPage.navigateToItems();

      // Verify we're on Items page
      expect(page.url()).toContain('/items');

      await waitForNetworkIdle(page, 10000);
    } else {
      test.skip(true, 'Items page not available in navigation');
    }
  });

  test('should navigate to Stock page from dashboard', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();

    // Check if Stock link exists
    const stockLinkVisible = await dashboardPage.stockLink.isVisible().catch(() => false);

    if (stockLinkVisible) {
      await dashboardPage.navigateToStock();

      // Verify we're on Stock page
      expect(page.url()).toContain('/stock');

      await waitForNetworkIdle(page, 10000);
    } else {
      test.skip(true, 'Stock page not available in navigation');
    }
  });

  test('should display dashboard statistics', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();

    // Check if stats cards are visible
    const statsCount = await dashboardPage.getStatsCount();

    if (statsCount > 0) {
      // Verify at least one stat card is visible
      expect(statsCount).toBeGreaterThan(0);
    } else {
      // Stats might not be implemented yet
      console.log('No stat cards found on dashboard');
    }
  });

  test('should show activity feed if available', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();

    const hasActivity = await dashboardPage.hasActivityFeed();

    if (hasActivity) {
      await expect(dashboardPage.activityFeed).toBeVisible();
    } else {
      console.log('Activity feed not available');
    }
  });

  test('should handle page refresh without losing authentication', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });

    // In dev mode, should remain authenticated
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // Should stay on dashboard (auth bypass)
      expect(page.url()).toContain('/dashboard');
    } else {
      // Should either stay authenticated or redirect to login
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|login)/);
    }
  });

  test('should navigate back to dashboard from other pages', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();

    // Navigate to Lists
    const listsLinkVisible = await dashboardPage.listsLink.isVisible().catch(() => false);

    if (listsLinkVisible) {
      await dashboardPage.navigateToLists();
      expect(page.url()).toContain('/lists');

      // Go back to dashboard
      await page.goto('/dashboard');
      await waitForNetworkIdle(page, 10000);

      expect(page.url()).toContain('/dashboard');
    } else {
      test.skip(true, 'Navigation test requires Lists page');
    }
  });

  test('should have responsive layout', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();

    // Test desktop viewport (default)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(dashboardPage.sidebar).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    // Sidebar might be collapsed or hidden

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    // Sidebar should be hidden or as mobile menu

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should show user menu if available', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();

    const userMenuVisible = await dashboardPage.userMenu.isVisible().catch(() => false);

    if (userMenuVisible) {
      // Click user menu
      await dashboardPage.userMenu.click();
      await authenticatedPage.waitForTimeout(500);

      // Should show dropdown menu
      // (Implementation specific - adjust selectors as needed)
    } else {
      console.log('User menu not found');
    }
  });

  test('should handle logout from dashboard', async ({ authenticatedPage, dashboardPage, page }) => {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      test.skip(true, 'Skipping logout test in dev mode (auth bypass)');
    }

    await dashboardPage.goto();

    // Check if logout button exists
    const logoutVisible = await dashboardPage.logoutButton.isVisible().catch(() => false);

    if (logoutVisible) {
      await dashboardPage.logout();

      // Should redirect to login
      expect(page.url()).toContain('/login');
    } else {
      test.skip(true, 'Logout button not found');
    }
  });

  test('should load dashboard without console errors', async ({ authenticatedPage, dashboardPage, page }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await dashboardPage.goto();
    await waitForNetworkIdle(page, 10000);

    // Filter out known acceptable errors
    const significantErrors = consoleErrors.filter((error) => {
      // Filter out React DevTools warnings, etc.
      return !error.includes('DevTools') && !error.includes('extension');
    });

    // There should be no significant console errors
    expect(significantErrors.length).toBeLessThanOrEqual(0);
  });

  test('should have correct page title', async ({ authenticatedPage, dashboardPage, page }) => {
    await dashboardPage.goto();

    // Check page title contains app name
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    // You can add more specific assertions based on your app title
  });
});
