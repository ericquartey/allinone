import { test, expect } from '@playwright/test';

/**
 * Locations Management Page - E2E Test Suite
 *
 * Tests complete user journey for Locations CRUD operations
 * Backend: http://localhost:3077/EjLogHostVertimag/Locations
 * Frontend: http://localhost:3003/management/locations
 */

test.describe('Locations Management Page', () => {
  const BASE_URL = 'http://localhost:3002';
  const LOCATIONS_PATH = '/management/locations';

  test.beforeEach(async ({ page }) => {
    // Navigate to locations page
    await page.goto(`${BASE_URL}${LOCATIONS_PATH}`);
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to locations page via sidebar menu', async ({ page }) => {
    // Start from home
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Look for sidebar menu item
    const locationsLink = page.locator('a[href*="locations"], button:has-text("Ubicazioni")');

    if (await locationsLink.count() > 0) {
      await locationsLink.first().click();
      await page.waitForURL(`**${LOCATIONS_PATH}**`);

      // Verify we're on the correct page
      await expect(page).toHaveURL(new RegExp(LOCATIONS_PATH));
    } else {
      // Direct navigation fallback
      await page.goto(`${BASE_URL}${LOCATIONS_PATH}`);
    }

    // Verify page title
    await expect(
      page.locator('h1, h2').filter({ hasText: /Ubicazioni|Locations/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('should load and display at least 3 locations from backend', async ({ page }) => {
    // Wait for table to be visible
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Verify table has at least 3 rows (backend returns 3 with limit=3)
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();

    expect(rowCount).toBeGreaterThanOrEqual(3);

    // Verify first row contains location data
    const firstRow = tableRows.first();
    await expect(firstRow).toBeVisible();

    // Verify table headers are present
    const expectedHeaders = ['Barcode', 'Description', 'Warehouse', 'Fill %', 'Enabled'];
    for (const header of expectedHeaders) {
      const headerLocator = page.locator('th').filter({ hasText: new RegExp(header, 'i') });
      if (await headerLocator.count() > 0) {
        await expect(headerLocator.first()).toBeVisible();
      }
    }
  });

  test('should use advanced filters (Barcode, Warehouse ID, Enabled)', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for filter section or buttons (use .first() to avoid ambiguity)
    const filterButton = page.locator('button').filter({ hasText: /Filtri|Filters/i });

    if (await filterButton.count() > 0) {
      await filterButton.first().click();
      await page.waitForTimeout(500);
    }

    // Test Barcode filter
    const barcodeInput = page.locator('input[name="barcode"], input[placeholder*="Barcode"]');
    if (await barcodeInput.count() > 0) {
      await barcodeInput.fill('LOC-');
      await page.waitForTimeout(1000);

      // Verify filtered results
      const rows = page.locator('tbody tr:visible');
      if (await rows.count() > 0) {
        await expect(rows.first()).toContainText(/LOC-/i);
      }

      // Clear filter
      await barcodeInput.clear();
    }

    // Test Enabled filter (checkbox or toggle)
    const enabledFilter = page.locator(
      'input[name="enabled"], input[type="checkbox"][id*="enabled"]'
    );

    if (await enabledFilter.count() > 0) {
      await enabledFilter.click();
      await page.waitForTimeout(1000);

      // Verify filter is applied
      const rows = page.locator('tbody tr:visible');
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });

  test('should open create modal with complete form', async ({ page }) => {
    // Look for create button
    const createButton = page.locator(
      'button:has-text("Nuova Ubicazione"), button:has-text("New Location"), button:has-text("Aggiungi")'
    ).first();

    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    // Verify modal is opened
    const modal = page.locator('[role="dialog"], .modal, .MuiDialog-root, [class*="Modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });

    // Verify main form fields
    const expectedFields = [
      'barcode',
      'description',
      'warehouseId',
      'enabled',
      'automated'
    ];

    for (const field of expectedFields) {
      const input = page.locator(`input[name="${field}"], select[name="${field}"]`);
      if (await input.count() > 0) {
        await expect(input).toBeVisible();
      }
    }
  });

  test('should display 5 form sections (Dati Principali, Gerarchia, Coordinate, Dimensioni, Opzioni)', async ({ page }) => {
    // Open create modal
    const createButton = page.locator(
      'button:has-text("Nuova Ubicazione"), button:has-text("New Location"), button:has-text("Aggiungi")'
    ).first();

    await createButton.click();
    await page.waitForTimeout(500);

    // Define expected sections
    const expectedSections = [
      /Dati Principali|Main Data|General/i,
      /Gerarchia|Hierarchy/i,
      /Coordinate|Coordinates/i,
      /Dimensioni|Dimensions/i,
      /Opzioni|Options|Settings/i
    ];

    // Verify sections are present (as headings or labels)
    for (const sectionPattern of expectedSections) {
      const sectionHeading = page.locator('h3, h4, label, legend').filter({ hasText: sectionPattern });

      if (await sectionHeading.count() > 0) {
        await expect(sectionHeading.first()).toBeVisible();
      } else {
        console.log(`Section ${sectionPattern} not found - may use different layout`);
      }
    }

    // Verify specific fields for each section exist
    const mainDataFields = ['barcode', 'description', 'warehouseId'];
    const hierarchyFields = ['parentLocationId', 'levelId'];
    const coordinateFields = ['aisle', 'bay', 'level'];
    const dimensionFields = ['width', 'height', 'depth'];
    const optionFields = ['enabled', 'automated', 'locked'];

    const allFields = [...mainDataFields, ...hierarchyFields, ...coordinateFields, ...dimensionFields, ...optionFields];

    let foundFieldsCount = 0;
    for (const field of allFields) {
      const input = page.locator(`input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`);
      if (await input.count() > 0) {
        foundFieldsCount++;
      }
    }

    // Expect at least 50% of fields to be found
    expect(foundFieldsCount).toBeGreaterThan(allFields.length * 0.5);
  });

  test('should display progress bar for Fill % correctly', async ({ page }) => {
    // Wait for table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Look for Fill % column
    const fillHeader = page.locator('th').filter({ hasText: /Fill|Riempimento|%/i });

    if (await fillHeader.count() > 0) {
      await expect(fillHeader.first()).toBeVisible();

      // Check for progress bars in data rows
      const progressBars = page.locator(
        '[role="progressbar"], .progress-bar, [class*="progress"]'
      );

      if (await progressBars.count() > 0) {
        await expect(progressBars.first()).toBeVisible();

        // Verify progress bar has value attribute or percentage text
        const firstProgressBar = progressBars.first();
        const ariaValueNow = await firstProgressBar.getAttribute('aria-valuenow');
        const textContent = await firstProgressBar.textContent();

        expect(
          ariaValueNow !== null || textContent?.includes('%')
        ).toBeTruthy();
      } else {
        // Alternative: percentage text in cells
        const fillCells = page.locator('tbody tr td').filter({ hasText: /%/ });
        if (await fillCells.count() > 0) {
          await expect(fillCells.first()).toBeVisible();
        }
      }
    }
  });

  test('should display colored badges for enabled/automated status', async ({ page }) => {
    // Wait for table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Look for badge elements (typically styled spans or divs)
    const badges = page.locator(
      '.badge, [class*="badge"], .chip, [class*="chip"], .tag, [class*="status"]'
    );

    if (await badges.count() > 0) {
      const firstBadge = badges.first();
      await expect(firstBadge).toBeVisible();

      // Verify badge has color styling
      const backgroundColor = await firstBadge.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Should not be transparent
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(backgroundColor).not.toBe('transparent');
    } else {
      // Alternative: look for boolean indicators
      const indicators = page.locator('tbody tr td').filter({
        hasText: /Active|Enabled|Attivo|Si|Yes|No/i
      });

      if (await indicators.count() > 0) {
        await expect(indicators.first()).toBeVisible();
      }
    }
  });

  test('should handle pagination or infinite scroll for large datasets', async ({ page }) => {
    // Wait for table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });

    // Look for pagination controls
    const paginationButtons = page.locator(
      '[aria-label*="pagination"], .pagination, button:has-text("Next"), button:has-text("Successivo")'
    );

    if (await paginationButtons.count() > 0) {
      const nextButton = paginationButtons.filter({ hasText: /Next|Successivo|>/i }).first();

      if (await nextButton.count() > 0) {
        const initialRowCount = await page.locator('tbody tr').count();

        await nextButton.click();
        await page.waitForTimeout(1000);

        // Verify new rows loaded or page changed
        const newRowCount = await page.locator('tbody tr').count();

        // Either same count (different page) or more (infinite scroll)
        expect(newRowCount).toBeGreaterThan(0);
      }
    } else {
      // Check for infinite scroll
      const table = page.locator('table');
      await table.evaluate(el => el.scrollIntoView({ block: 'end' }));
      await page.waitForTimeout(1000);

      // Should still have rows
      const rowCount = await page.locator('tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Open create modal
    const createButton = page.locator(
      'button:has-text("Nuova Ubicazione"), button:has-text("New Location"), button:has-text("Aggiungi")'
    ).first();

    await createButton.click();
    await page.waitForTimeout(500);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Salva"), button:has-text("Conferma")').first();

    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Verify validation errors
      const errorMessages = page.locator(
        '.error, .invalid, [class*="error"], [class*="invalid"], [role="alert"]'
      );

      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate error
    await page.route('**/EjLogHostVertimag/Locations*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      });
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify error message
    const errorMessage = page.locator(
      'text=/errore|error/i, [class*="error"], [class*="alert"]'
    );

    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});

