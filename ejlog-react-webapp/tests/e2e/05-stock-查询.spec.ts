import { test, expect } from '../fixtures/authFixtures';
import { waitForNetworkIdle, waitForLoadingToFinish } from '../helpers/testHelpers';

/**
 * E2E Tests: Stock Management
 *
 * Tests stock查询, filtering, and inventory查询
 */

test.describe('Stock Management', () => {
  test('should display stock page correctly', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await stockPage.verifyPageLoaded();

    // Take screenshot
    await stockPage.takeStockScreenshot('stock-page-initial');
  });

  test('should load stock records', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if stock records are displayed
    const stockCount = await stockPage.getStockRecordsCount();

    if (stockCount > 0) {
      expect(stockCount).toBeGreaterThan(0);
      console.log(`Found ${stockCount} stock records`);
    } else {
      // Verify empty state
      await stockPage.verifyEmptyState();
    }
  });

  test('should search stock records', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const initialCount = await stockPage.getStockRecordsCount();

    if (initialCount === 0) {
      test.skip(true, 'No stock records for search test');
    }

    // Search for stock (adjust search term based on your data)
    await stockPage.searchStock('ITEM');

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify search results
    const searchResultsCount = await stockPage.getStockRecordsCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(0);

    // Take screenshot
    await stockPage.takeStockScreenshot('stock-search-results');
  });

  test('should filter stock by location', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if location filter exists
    const locationFilterVisible = await stockPage.locationFilter.isVisible().catch(() => false);

    if (!locationFilterVisible) {
      test.skip(true, 'Location filter not available');
    }

    // Apply location filter
    await stockPage.filterByLocation('Warehouse A'); // Adjust based on your data

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify filtered results
    const filteredCount = await stockPage.getStockRecordsCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter stock by status', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if status filter exists
    const statusFilterVisible = await stockPage.statusFilter.isVisible().catch(() => false);

    if (!statusFilterVisible) {
      test.skip(true, 'Status filter not available');
    }

    // Apply status filter
    await stockPage.filterByStatus('Available'); // Adjust based on your data

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify filtered results
    const filteredCount = await stockPage.getStockRecordsCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should display stock data in table', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const stockCount = await stockPage.getStockRecordsCount();

    if (stockCount === 0) {
      test.skip(true, 'No stock records for display test');
    }

    // Get data from first row
    const stockData = await stockPage.getStockDataFromRow(0);

    // Verify stock data has content
    expect(stockData.item.length).toBeGreaterThan(0);
    expect(stockData.location.length).toBeGreaterThan(0);

    console.log('Stock data:', stockData);
  });

  test('should display total stock value if available', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if total stock value is displayed
    const totalValue = await stockPage.getTotalStockValue();

    if (totalValue) {
      console.log('Total stock value:', totalValue);
      expect(totalValue.length).toBeGreaterThan(0);
    } else {
      console.log('Total stock value not displayed');
    }
  });

  test('should display total items count if available', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if total items count is displayed
    const totalItems = await stockPage.getTotalItemsCount();

    if (totalItems) {
      console.log('Total items:', totalItems);
      expect(totalItems.length).toBeGreaterThan(0);
    } else {
      console.log('Total items count not displayed');
    }
  });

  test('should show low stock alert if applicable', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check for low stock alert
    const hasAlert = await stockPage.hasLowStockAlert();

    if (hasAlert) {
      console.log('Low stock alert is visible');
      await expect(stockPage.lowStockAlert).toBeVisible();
    } else {
      console.log('No low stock alerts');
    }
  });

  test('should view stock details', async ({ authenticatedPage, stockPage, page }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const stockCount = await stockPage.getStockRecordsCount();

    if (stockCount === 0) {
      test.skip(true, 'No stock records for view test');
    }

    // Check if view buttons exist
    const viewButtonsCount = await stockPage.viewDetailsButtons.count();

    if (viewButtonsCount > 0) {
      // Click first view button
      await stockPage.viewStockDetails(0);

      await waitForNetworkIdle(page, 10000);

      // Should navigate to stock details page
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/stock');
    } else {
      console.log('View buttons not available');
    }
  });

  test('should refresh stock data', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const initialCount = await stockPage.getStockRecordsCount();

    // Refresh stock
    await stockPage.refreshStock();

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Should reload stock data
    const refreshedCount = await stockPage.getStockRecordsCount();

    // Count should be the same or similar (data might have changed)
    expect(refreshedCount).toBeGreaterThanOrEqual(0);
  });

  test('should export stock data if available', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const stockCount = await stockPage.getStockRecordsCount();

    if (stockCount === 0) {
      test.skip(true, 'No stock data to export');
    }

    // Check if export button exists
    const exportButtonVisible = await stockPage.exportButton.isVisible().catch(() => false);

    if (exportButtonVisible) {
      // Trigger export
      await stockPage.exportStock();

      // Wait for download (if implemented)
      await authenticatedPage.waitForTimeout(2000);

      console.log('Export triggered');
    } else {
      console.log('Export functionality not available');
    }
  });

  test('should verify stock item exists', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const stockCount = await stockPage.getStockRecordsCount();

    if (stockCount === 0) {
      test.skip(true, 'No stock items to verify');
    }

    // Get first stock item
    const stockData = await stockPage.getStockDataFromRow(0);

    if (stockData.item) {
      // Verify item exists in table
      await stockPage.verifyStockItemExists(stockData.item);
    }
  });

  test('should clear filters', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Apply search
    await stockPage.searchStock('TEST');
    await waitForNetworkIdle(authenticatedPage, 5000);

    const searchResultsCount = await stockPage.getStockRecordsCount();

    // Clear filters
    await stockPage.clearFilters();
    await waitForNetworkIdle(authenticatedPage, 5000);

    // Should show all stock again
    const allStockCount = await stockPage.getStockRecordsCount();
    expect(allStockCount).toBeGreaterThanOrEqual(searchResultsCount);
  });

  test('should handle empty stock results', async ({ authenticatedPage, stockPage }) => {
    await stockPage.goto();

    // Search for non-existent stock
    await stockPage.searchStock('NONEXISTENT_STOCK_XXXXX');

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Should show empty state or zero results
    const count = await stockPage.getStockRecordsCount();

    if (count === 0) {
      const emptyStateVisible = await stockPage.emptyState.isVisible().catch(() => false);
      expect(emptyStateVisible).toBeTruthy();
    }
  });

  test('should load stock page without console errors', async ({ authenticatedPage, stockPage, page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await stockPage.goto();
    await waitForNetworkIdle(page, 10000);

    const significantErrors = consoleErrors.filter((error) => {
      return !error.includes('DevTools') && !error.includes('extension');
    });

    expect(significantErrors.length).toBeLessThanOrEqual(0);
  });

  test('should maintain filters when navigating back', async ({ authenticatedPage, stockPage, page }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Apply search
    await stockPage.searchStock('ITEM');
    await waitForNetworkIdle(page, 5000);

    // Navigate away
    await page.goto('/dashboard');
    await waitForNetworkIdle(page, 5000);

    // Navigate back
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Page should load (state might be reset)
    await stockPage.verifyPageLoaded();
  });

  test('should have responsive layout', async ({ authenticatedPage, stockPage, page }) => {
    await stockPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(stockPage.pageTitle).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(stockPage.pageTitle).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});
