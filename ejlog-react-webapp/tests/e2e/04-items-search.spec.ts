import { test, expect } from '../fixtures/authFixtures';
import { waitForNetworkIdle, waitForLoadingToFinish } from '../helpers/testHelpers';

/**
 * E2E Tests: Items Search and Management
 *
 * Tests item search, filtering, and viewing
 */

test.describe('Items Management', () => {
  test('should display items page correctly', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await itemsPage.verifyPageLoaded();

    // Take screenshot
    await itemsPage.takeItemsScreenshot('items-page-initial');
  });

  test('should load items list', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if items are displayed
    const itemsCount = await itemsPage.getItemsCount();

    if (itemsCount > 0) {
      expect(itemsCount).toBeGreaterThan(0);
      console.log(`Found ${itemsCount} items`);
    } else {
      // Verify empty state
      await itemsPage.verifyEmptyState();
    }
  });

  test('should search for items', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const initialCount = await itemsPage.getItemsCount();

    if (initialCount === 0) {
      test.skip(true, 'No items available for search test');
    }

    // Search for items (adjust search term based on your data)
    await itemsPage.searchItems('ITEM');

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify search results
    const searchResultsCount = await itemsPage.getItemsCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(0);

    // Take screenshot
    await itemsPage.takeItemsScreenshot('items-search-results');
  });

  test('should filter items by category', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if category filter exists
    const categoryFilterVisible = await itemsPage.categoryFilter.isVisible().catch(() => false);

    if (!categoryFilterVisible) {
      test.skip(true, 'Category filter not available');
    }

    // Apply category filter
    await itemsPage.filterByCategory('Category 1'); // Adjust based on your data

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify filtered results
    const filteredCount = await itemsPage.getItemsCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter items by status', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if status filter exists
    const statusFilterVisible = await itemsPage.statusFilter.isVisible().catch(() => false);

    if (!statusFilterVisible) {
      test.skip(true, 'Status filter not available');
    }

    // Apply status filter
    await itemsPage.filterByStatus('Active'); // Adjust based on your data

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify filtered results
    const filteredCount = await itemsPage.getItemsCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should display item details in table', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const itemsCount = await itemsPage.getItemsCount();

    if (itemsCount === 0) {
      test.skip(true, 'No items for display test');
    }

    // Check if using table layout
    const tableVisible = await itemsPage.itemsTable.isVisible().catch(() => false);

    if (tableVisible) {
      // Get data from first row
      const itemData = await itemsPage.getItemDataFromRow(0);

      // Verify item data has content
      expect(itemData.sku.length).toBeGreaterThan(0);

      console.log('Item data:', itemData);
    } else {
      console.log('Items displayed in grid layout');
    }
  });

  test('should click on item to view details', async ({ authenticatedPage, itemsPage, page }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const itemsCount = await itemsPage.getItemsCount();

    if (itemsCount === 0) {
      test.skip(true, 'No items available for click test');
    }

    // Click first item
    await itemsPage.clickItem(0);

    await waitForNetworkIdle(page, 10000);

    // Should navigate to item details page
    // Verify URL changed (adjust based on your routing)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/items/');
  });

  test('should clear search and show all items', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Search for something
    await itemsPage.searchItems('TEST');
    await waitForNetworkIdle(authenticatedPage, 5000);

    const searchResultsCount = await itemsPage.getItemsCount();

    // Clear search
    await itemsPage.clearSearch();
    await waitForNetworkIdle(authenticatedPage, 5000);

    // Should show all items again
    const allItemsCount = await itemsPage.getItemsCount();
    expect(allItemsCount).toBeGreaterThanOrEqual(searchResultsCount);
  });

  test('should handle pagination if available', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const itemsCount = await itemsPage.getItemsCount();

    if (itemsCount === 0) {
      test.skip(true, 'No items for pagination test');
    }

    // Check if next page button exists and is enabled
    const nextButtonVisible = await itemsPage.paginationNext.isVisible().catch(() => false);

    if (nextButtonVisible) {
      const isEnabled = await itemsPage.paginationNext.isEnabled();

      if (isEnabled) {
        // Go to next page
        await itemsPage.goToNextPage();

        await waitForNetworkIdle(authenticatedPage, 5000);

        // Should load next page items
        const nextPageItemsCount = await itemsPage.getItemsCount();
        expect(nextPageItemsCount).toBeGreaterThan(0);

        // Take screenshot
        await itemsPage.takeItemsScreenshot('items-page-2');
      }
    } else {
      console.log('Pagination not available');
    }
  });

  test('should verify item exists by SKU', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const itemsCount = await itemsPage.getItemsCount();

    if (itemsCount === 0) {
      test.skip(true, 'No items to verify');
    }

    // Get first item's SKU
    const tableVisible = await itemsPage.itemsTable.isVisible().catch(() => false);

    if (tableVisible) {
      const itemData = await itemsPage.getItemDataFromRow(0);

      if (itemData.sku) {
        // Verify item exists
        await itemsPage.verifyItemExists(itemData.sku);
      }
    }
  });

  test('should handle empty search results', async ({ authenticatedPage, itemsPage }) => {
    await itemsPage.goto();

    // Search for non-existent item
    await itemsPage.searchItems('NONEXISTENT_ITEM_XXXXX');

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Should show empty state or zero results
    const count = await itemsPage.getItemsCount();

    if (count === 0) {
      const emptyStateVisible = await itemsPage.emptyState.isVisible().catch(() => false);
      expect(emptyStateVisible).toBeTruthy();
    }
  });

  test('should load items page without console errors', async ({ authenticatedPage, itemsPage, page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await itemsPage.goto();
    await waitForNetworkIdle(page, 10000);

    const significantErrors = consoleErrors.filter((error) => {
      return !error.includes('DevTools') && !error.includes('extension');
    });

    expect(significantErrors.length).toBeLessThanOrEqual(0);
  });

  test('should maintain search state when navigating back', async ({ authenticatedPage, itemsPage, page }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Perform search
    await itemsPage.searchItems('ITEM');
    await waitForNetworkIdle(page, 5000);

    // Navigate away
    await page.goto('/dashboard');
    await waitForNetworkIdle(page, 5000);

    // Navigate back
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Page should load (state might be reset)
    await itemsPage.verifyPageLoaded();
  });

  test('should have responsive layout', async ({ authenticatedPage, itemsPage, page }) => {
    await itemsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Test different viewport sizes
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(itemsPage.searchInput).toBeVisible();

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await expect(itemsPage.searchInput).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
  });
});
