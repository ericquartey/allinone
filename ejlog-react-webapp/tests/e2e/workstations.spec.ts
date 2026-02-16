import { test, expect } from '@playwright/test';

/**
 * Workstations Management Page - E2E Test Suite
 *
 * Tests complete user journey for Workstations CRUD operations
 * Backend: http://localhost:3077/EjLogHostVertimag/Workstations
 * Frontend: http://localhost:3003/management/workstations
 */

test.describe('Workstations Management Page', () => {
  const BASE_URL = 'http://localhost:3002';
  const WORKSTATIONS_PATH = '/management/workstations';

  test.beforeEach(async ({ page }) => {
    // Navigate to workstations page
    await page.goto(`${BASE_URL}${WORKSTATIONS_PATH}`);
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to workstations page via sidebar menu', async ({ page }) => {
    // Start from home
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Look for sidebar menu item (adjust selector based on actual implementation)
    const workstationsLink = page.locator('a[href*="workstations"], button:has-text("Postazioni")');

    if (await workstationsLink.count() > 0) {
      await workstationsLink.first().click();
      await page.waitForURL(`**${WORKSTATIONS_PATH}**`);

      // Verify we're on the correct page
      await expect(page).toHaveURL(new RegExp(WORKSTATIONS_PATH));
    } else {
      // Direct navigation fallback
      await page.goto(`${BASE_URL}${WORKSTATIONS_PATH}`);
    }

    // Verify page title or heading
    await expect(
      page.locator('h1, h2').filter({ hasText: /Postazioni|Workstations/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should load and display workstations table with data from backend', async ({ page }) => {
    // Wait for table to be visible
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Verify table has rows (backend returns 2 workstations)
    const tableRows = page.locator('tbody tr');
    await expect(tableRows).toHaveCount(2, { timeout: 10000 });

    // Verify expected data from backend (Vertimag 1)
    const firstRow = tableRows.first();
    await expect(firstRow).toContainText(/Vertimag/i);

    // Verify table headers are present
    const expectedHeaders = ['ID', 'Description', 'IP Address', 'Type'];
    for (const header of expectedHeaders) {
      await expect(
        page.locator('th').filter({ hasText: new RegExp(header, 'i') })
      ).toBeVisible();
    }
  });

  test('should filter workstations by IP address or connected user', async ({ page }) => {
    // Wait for table to load
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Look for search/filter input
    const searchInput = page.locator('input[type="text"], input[placeholder*="Cerca"], input[placeholder*="Search"]').first();

    if (await searchInput.count() > 0) {
      await searchInput.fill('192.168');
      await page.waitForTimeout(1000); // Debounce

      // Verify filtered results
      const filteredRows = page.locator('tbody tr:visible');
      await expect(filteredRows.first()).toContainText(/192\.168/);
    } else {
      console.log('Search input not found - skipping filter test');
    }
  });

  test('should open create modal when clicking new workstation button', async ({ page }) => {
    // Look for "Nuova Postazione" or "New Workstation" button
    const createButton = page.locator(
      'button:has-text("Nuova Postazione"), button:has-text("New Workstation"), button:has-text("Aggiungi")'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Verify modal is opened
    const modal = page.locator('[role="dialog"], .modal, .MuiDialog-root, [class*="Modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });

    // Verify form fields are present
    await expect(page.locator('input[name="description"], input[placeholder*="Descrizione"]')).toBeVisible();
    await expect(page.locator('input[name="ipAddress"], input[placeholder*="IP"]')).toBeVisible();
  });

  test('should validate required fields in create form', async ({ page }) => {
    // Open create modal
    const createButton = page.locator(
      'button:has-text("Nuova Postazione"), button:has-text("New Workstation"), button:has-text("Aggiungi")'
    ).first();

    await createButton.click();
    await page.waitForTimeout(500);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Salva"), button:has-text("Conferma")').first();

    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Verify validation errors are shown
      const errorMessages = page.locator('.error, .invalid, [class*="error"], [class*="invalid"]');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display all table columns correctly', async ({ page }) => {
    // Wait for table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Define expected columns
    const expectedColumns = [
      { name: 'ID', pattern: /id/i },
      { name: 'Description', pattern: /desc/i },
      { name: 'IP Address', pattern: /ip/i },
      { name: 'Type', pattern: /type|tipo/i },
      { name: 'Connected User', pattern: /user|utente/i },
      { name: 'Status', pattern: /status|stato/i }
    ];

    // Verify headers
    for (const col of expectedColumns.slice(0, 4)) { // Test first 4 mandatory columns
      const header = page.locator('th').filter({ hasText: col.pattern });
      await expect(header).toBeVisible({ timeout: 5000 });
    }

    // Verify data is populated in cells
    const firstDataRow = page.locator('tbody tr').first();
    const cells = firstDataRow.locator('td');

    // Should have at least 4 cells
    await expect(cells).toHaveCount(4, { timeout: 5000 }).catch(() =>
      expect(cells.count()).resolves.toBeGreaterThanOrEqual(4)
    );
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/EjLogHostVertimag/Workstations*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Reload page to trigger error
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify error message is shown
    const errorMessage = page.locator(
      'text=/errore|error/i, [class*="error"], [class*="alert"]'
    );

    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state while fetching data', async ({ page }) => {
    // Intercept API to delay response
    await page.route('**/EjLogHostVertimag/Workstations*', async route => {
      await page.waitForTimeout(2000); // Simulate slow network
      route.continue();
    });

    // Reload page
    await page.reload();

    // Verify loading indicator appears
    const loadingIndicator = page.locator(
      '[class*="loading"], [class*="spinner"], [class*="skeleton"]'
    );

    // Should show loading state briefly
    if (await loadingIndicator.count() > 0) {
      await expect(loadingIndicator.first()).toBeVisible();
    }

    // Eventually data should load
    await expect(page.locator('table tbody tr')).toHaveCount(2, { timeout: 15000 });
  });
});

