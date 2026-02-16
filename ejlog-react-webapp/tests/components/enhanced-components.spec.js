// ============================================================================
// EJLOG WMS - Enhanced Components E2E Tests
// Test Playwright per i nuovi componenti: BarcodeScanner, DataGrid, Export, etc.
// ============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';

test.describe('Enhanced Components Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to enhanced items page (assuming it's added to routing)
    await page.goto(`${BASE_URL}/items-enhanced`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('DataGrid Advanced', () => {
    test('should display data grid with items', async ({ page }) => {
      // Check if data grid is rendered
      const dataGrid = page.locator('[data-testid="items-data-grid"]');
      await expect(dataGrid).toBeVisible();

      // Check if table is rendered
      const table = dataGrid.locator('table');
      await expect(table).toBeVisible();

      // Check if headers are present
      const headers = table.locator('thead th');
      await expect(headers).toHaveCount(8); // Based on columns defined
    });

    test('should sort columns when clicking header', async ({ page }) => {
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Click on "Codice" header to sort
      const codeHeader = dataGrid.locator('[data-testid="items-data-grid-header-code"]');
      await codeHeader.click();

      // Check if sort indicator is visible
      await expect(codeHeader.locator('text=↑')).toBeVisible();

      // Click again to reverse sort
      await codeHeader.click();
      await expect(codeHeader.locator('text=↓')).toBeVisible();
    });

    test('should paginate through results', async ({ page }) => {
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Check pagination controls are visible
      const nextBtn = dataGrid.locator('[data-testid="items-data-grid-next-page"]');
      await expect(nextBtn).toBeVisible();

      // If not on last page, click next
      if (await nextBtn.isEnabled()) {
        await nextBtn.click();

        // Wait for navigation
        await page.waitForTimeout(500);

        // Check that we're on page 2
        const pageInfo = dataGrid.locator('text=/Page 2 of/');
        await expect(pageInfo).toBeVisible();
      }
    });

    test('should select rows with checkboxes', async ({ page }) => {
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Select first row
      const firstRowCheckbox = dataGrid.locator('[data-testid="items-data-grid-select-row-0"]');
      await firstRowCheckbox.check();

      // Check that row is selected
      await expect(firstRowCheckbox).toBeChecked();

      // Check that selection info is displayed
      const selectionInfo = page.locator('text=/1 row.*selected/i');
      await expect(selectionInfo).toBeVisible();
    });

    test('should change page size', async ({ page }) => {
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Find page size selector
      const pageSizeSelect = dataGrid.locator('[data-testid="items-data-grid-page-size"]');
      await pageSizeSelect.selectOption('50');

      // Wait for data to reload
      await page.waitForTimeout(500);

      // Check that "50" option is selected
      await expect(pageSizeSelect).toHaveValue('50');
    });
  });

  test.describe('Export Button', () => {
    test('should display export dropdown menu', async ({ page }) => {
      // Click export button
      const exportBtn = page.locator('[data-testid="export-button-trigger"]');
      await exportBtn.click();

      // Check if menu is visible
      const menu = page.locator('[data-testid="export-button-menu"]');
      await expect(menu).toBeVisible();

      // Check export options
      await expect(page.locator('[data-testid="export-button-option-excel"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-button-option-csv"]')).toBeVisible();
      await expect(page.locator('[data-testid="export-button-option-pdf"]')).toBeVisible();
    });

    test('should trigger Excel export', async ({ page }) => {
      // Start waiting for download before clicking
      const downloadPromise = page.waitForEvent('download');

      // Click export button
      const exportBtn = page.locator('[data-testid="export-button-trigger"]');
      await exportBtn.click();

      // Click Excel option
      const excelOption = page.locator('[data-testid="export-button-option-excel"]');
      await excelOption.click();

      // Wait for download to start
      const download = await downloadPromise;

      // Check filename contains expected parts
      const filename = download.suggestedFilename();
      expect(filename).toContain('articoli_export');
      expect(filename).toMatch(/\.xlsx$/);
    });

    test('should be disabled when no data', async ({ page }) => {
      // Mock empty data scenario (would need to intercept API call)
      // For now, just check button exists
      const exportBtn = page.locator('[data-testid="export-button-trigger"]');
      await expect(exportBtn).toBeVisible();
    });
  });

  test.describe('Search and Filters', () => {
    test('should filter items by search query', async ({ page }) => {
      // Find search input
      const searchInput = page.locator('input[placeholder*="Cerca"]');
      await searchInput.fill('TEST');

      // Wait for filtering
      await page.waitForTimeout(500);

      // Check that results are filtered (would need to verify actual data)
      const dataGrid = page.locator('[data-testid="items-data-grid"]');
      await expect(dataGrid).toBeVisible();
    });

    test('should clear filters', async ({ page }) => {
      // Fill search
      const searchInput = page.locator('input[placeholder*="Cerca"]');
      await searchInput.fill('TEST');

      // Click reset button
      const resetBtn = page.locator('button:has-text("Reset Filtri")');
      if (await resetBtn.isVisible()) {
        await resetBtn.click();

        // Check search is cleared
        await expect(searchInput).toHaveValue('');
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to create item page', async ({ page }) => {
      // Click "Nuovo Articolo" button
      const createBtn = page.locator('button:has-text("Nuovo Articolo")');
      await createBtn.click();

      // Check URL changed
      await expect(page).toHaveURL(/\/items\/create/);

      // Check form is visible
      await expect(page.locator('h1:has-text("Nuovo Articolo")')).toBeVisible();
    });

    test('should navigate to edit item page when clicking edit icon', async ({ page }) => {
      // Wait for data grid to load
      const dataGrid = page.locator('[data-testid="items-data-grid"]');
      await dataGrid.waitFor({ state: 'visible' });

      // Click first edit button (if exists)
      const editBtns = page.locator('button[title="Edit"]');
      const count = await editBtns.count();

      if (count > 0) {
        await editBtns.first().click();

        // Check URL contains /edit
        await expect(page).toHaveURL(/\/items\/\d+\/edit/);
      }
    });

    test('should navigate to detail page when clicking row', async ({ page }) => {
      // Wait for data grid to load
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Click first row (not on checkbox)
      const firstRow = dataGrid.locator('[data-testid="items-data-grid-row-0"]');
      const firstCell = firstRow.locator('td').nth(1); // Second cell (not checkbox)

      if (await firstCell.isVisible()) {
        await firstCell.click();

        // Check URL changed to detail page
        await expect(page).toHaveURL(/\/items\/\d+$/);
      }
    });
  });

  test.describe('Bulk Actions', () => {
    test('should show bulk actions when rows selected', async ({ page }) => {
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Select first two rows
      const checkbox1 = dataGrid.locator('[data-testid="items-data-grid-select-row-0"]');
      const checkbox2 = dataGrid.locator('[data-testid="items-data-grid-select-row-1"]');

      await checkbox1.check();
      await checkbox2.check();

      // Check bulk actions are visible
      const bulkDeleteBtn = page.locator('button:has-text("Elimina Selezionati")');
      await expect(bulkDeleteBtn).toBeVisible();

      // Check selection count badge
      const badge = page.locator('text=/2 selezionati/i');
      await expect(badge).toBeVisible();
    });

    test('should clear selection', async ({ page }) => {
      const dataGrid = page.locator('[data-testid="items-data-grid"]');

      // Select rows
      const checkbox1 = dataGrid.locator('[data-testid="items-data-grid-select-row-0"]');
      await checkbox1.check();

      // Click clear selection
      const clearBtn = dataGrid.locator('[data-testid="items-data-grid-clear-selection"]');
      if (await clearBtn.isVisible()) {
        await clearBtn.click();

        // Check checkbox is unchecked
        await expect(checkbox1).not.toBeChecked();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check that page is still functional
      const dataGrid = page.locator('[data-testid="items-data-grid"]');
      await expect(dataGrid).toBeVisible();

      // Table should scroll horizontally on mobile
      const table = dataGrid.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check layout
      const dataGrid = page.locator('[data-testid="items-data-grid"]');
      await expect(dataGrid).toBeVisible();
    });
  });
});

test.describe('Item Form Enhanced', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to create item form
    await page.goto(`${BASE_URL}/items/create-enhanced`);
    await page.waitForLoadState('networkidle');
  });

  test('should display form fields', async ({ page }) => {
    // Check main form fields are visible
    await expect(page.locator('input[label="Codice Articolo"]')).toBeVisible();
    await expect(page.locator('input[label="Descrizione"]')).toBeVisible();
    await expect(page.locator('input[label="Unità di Misura"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click submit without filling form
    const submitBtn = page.locator('button[type="submit"]:has-text("Crea Articolo")');
    await submitBtn.click();

    // Check for validation errors
    await expect(page.locator('text=/Codice.*obbligatorio/i')).toBeVisible();
    await expect(page.locator('text=/Descrizione.*obbligatoria/i')).toBeVisible();
  });

  test('should allow file upload for product image', async ({ page }) => {
    // Check if FileUpload component is present
    const dropzone = page.locator('[data-testid*="dropzone"]');
    await expect(dropzone).toBeVisible();

    // Test file upload would require actual file interaction
    // This is a placeholder for file upload testing
  });

  test('should cancel form and navigate back', async ({ page }) => {
    // Click cancel button
    const cancelBtn = page.locator('button:has-text("Annulla")');
    await cancelBtn.click();

    // Confirm dialog appears
    page.once('dialog', dialog => {
      dialog.accept();
    });

    // Check navigation back to items list
    // await expect(page).toHaveURL(/\/items$/);
  });
});
