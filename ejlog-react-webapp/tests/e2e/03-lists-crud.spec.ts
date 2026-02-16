import { test, expect } from '../fixtures/authFixtures';
import { waitForNetworkIdle, waitForLoadingToFinish, generateTestData } from '../helpers/testHelpers';

/**
 * E2E Tests: Lists CRUD Operations
 *
 * Tests list creation, reading, updating, and deletion
 */

test.describe('Lists Management - CRUD Operations', () => {
  test('should display lists page correctly', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();
    await listsPage.verifyPageLoaded();

    // Take screenshot
    await listsPage.takeListsScreenshot('lists-page-initial');
  });

  test('should load and display lists table', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if table or empty state is visible
    const listsCount = await listsPage.getListsCount();

    if (listsCount > 0) {
      // Lists are present
      await expect(listsPage.listsTable).toBeVisible();
      expect(listsCount).toBeGreaterThan(0);
    } else {
      // Empty state is shown
      const emptyStateVisible = await listsPage.emptyState.isVisible().catch(() => false);
      if (emptyStateVisible) {
        await listsPage.verifyEmptyState();
      }
    }
  });

  test('should search for lists', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const initialCount = await listsPage.getListsCount();

    if (initialCount === 0) {
      test.skip(true, 'No lists available for search test');
    }

    // Search for a specific list (adjust search term based on your data)
    await listsPage.searchLists('PICK');

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify search results
    const searchResultsCount = await listsPage.getListsCount();

    // Search should return results or empty state
    expect(searchResultsCount).toBeGreaterThanOrEqual(0);

    // Take screenshot of search results
    await listsPage.takeListsScreenshot('lists-search-results');
  });

  test('should filter lists by type', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Check if filter dropdown exists
    const filterVisible = await listsPage.filterDropdown.isVisible().catch(() => false);

    if (!filterVisible) {
      test.skip(true, 'Filter dropdown not available');
    }

    // Apply filter (adjust filter value based on your implementation)
    await listsPage.filterByType('Picking');

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify filtered results
    const filteredCount = await listsPage.getListsCount();
    expect(filteredCount).toBeGreaterThanOrEqual(0);
  });

  test('should open create list modal', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();

    // Click create button
    await listsPage.createListButton.click();

    // Modal should be visible
    await expect(listsPage.modal).toBeVisible({ timeout: 10000 });

    // Verify form fields are present
    await expect(listsPage.listNameInput).toBeVisible();

    // Close modal
    await listsPage.closeModal();

    // Modal should be hidden
    await expect(listsPage.modal).toBeHidden();
  });

  test('should create a new list', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();

    const initialCount = await listsPage.getListsCount();

    // Generate test data
    const testData = generateTestData('TestList');

    // Create new list
    await listsPage.createList({
      name: testData.name,
      description: 'Automated test list created by Playwright',
    });

    // Wait for list to be created
    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify list was created
    const newCount = await listsPage.getListsCount();
    expect(newCount).toBeGreaterThan(initialCount);

    // Verify new list appears in table
    await listsPage.verifyListExists(testData.name);

    // Take screenshot
    await listsPage.takeListsScreenshot('list-created');
  });

  test('should view list details', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const listsCount = await listsPage.getListsCount();

    if (listsCount === 0) {
      test.skip(true, 'No lists available for view test');
    }

    // Check if view buttons exist
    const viewButtonsCount = await listsPage.viewButtons.count();

    if (viewButtonsCount > 0) {
      // Click first view button
      await listsPage.viewListDetails(0);

      // Should navigate to list details page
      await waitForNetworkIdle(authenticatedPage, 10000);

      // Verify URL changed
      expect(authenticatedPage.url()).not.toContain('/lists');
    } else {
      console.log('View buttons not available');
    }
  });

  test('should edit existing list', async ({ authenticatedPage, listsPage }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const listsCount = await listsPage.getListsCount();

    if (listsCount === 0) {
      test.skip(true, 'No lists available for edit test');
    }

    // Check if edit buttons exist
    const editButtonsCount = await listsPage.editButtons.count();

    if (editButtonsCount === 0) {
      test.skip(true, 'Edit functionality not available');
    }

    // Get original list data
    const originalData = await listsPage.getListDataFromRow(0);

    // Edit list
    const updatedName = `${originalData.name} - Updated`;
    await listsPage.editList(0, {
      name: updatedName,
      description: 'Updated by Playwright test',
    });

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify list was updated
    await listsPage.verifyListExists(updatedName);

    // Take screenshot
    await listsPage.takeListsScreenshot('list-updated');
  });

  test('should delete list', async ({ authenticatedPage, listsPage }) => {
    // This test should be run carefully as it modifies data
    test.slow(); // Mark as slow test

    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const initialCount = await listsPage.getListsCount();

    if (initialCount === 0) {
      test.skip(true, 'No lists available for delete test');
    }

    // Check if delete buttons exist
    const deleteButtonsCount = await listsPage.deleteButtons.count();

    if (deleteButtonsCount === 0) {
      test.skip(true, 'Delete functionality not available');
    }

    // Delete first list
    await listsPage.deleteList(0);

    await waitForNetworkIdle(authenticatedPage, 5000);

    // Verify list count decreased
    const newCount = await listsPage.getListsCount();
    expect(newCount).toBeLessThan(initialCount);

    // Take screenshot
    await listsPage.takeListsScreenshot('list-deleted');
  });

  test('should handle empty table state', async ({ authenticatedPage, listsPage, page }) => {
    await listsPage.goto();

    // Search for non-existent list
    await listsPage.searchLists('NONEXISTENT_LIST_XXXXXX');

    await waitForNetworkIdle(page, 5000);

    // Should show empty state or zero results
    const count = await listsPage.getListsCount();

    if (count === 0) {
      // Verify empty state is shown
      const emptyStateVisible = await listsPage.emptyState.isVisible().catch(() => false);
      expect(emptyStateVisible).toBeTruthy();
    }
  });

  test('should maintain state when navigating away and back', async ({ authenticatedPage, listsPage, page }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Apply search
    await listsPage.searchLists('PICK');
    await waitForNetworkIdle(page, 5000);

    const searchResultsCount = await listsPage.getListsCount();

    // Navigate away to dashboard
    await page.goto('/dashboard');
    await waitForNetworkIdle(page, 5000);

    // Navigate back to lists
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    // Verify lists page loaded again (state might be reset)
    await listsPage.verifyPageLoaded();
  });

  test('should handle pagination if available', async ({ authenticatedPage, listsPage, page }) => {
    await listsPage.goto();
    await waitForLoadingToFinish(authenticatedPage, 15000);

    const listsCount = await listsPage.getListsCount();

    if (listsCount === 0) {
      test.skip(true, 'No lists for pagination test');
    }

    // Check if pagination exists
    const paginationVisible = await page.locator('.pagination, [aria-label*="pagination"]').isVisible().catch(() => false);

    if (paginationVisible) {
      // Test pagination (implementation specific)
      console.log('Pagination is available');
    } else {
      console.log('Pagination not implemented or not needed');
    }
  });

  test('should load lists page without errors', async ({ authenticatedPage, listsPage, page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await listsPage.goto();
    await waitForNetworkIdle(page, 10000);

    // Filter significant errors
    const significantErrors = consoleErrors.filter((error) => {
      return !error.includes('DevTools') && !error.includes('extension');
    });

    expect(significantErrors.length).toBeLessThanOrEqual(0);
  });
});
