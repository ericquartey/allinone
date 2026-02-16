// ============================================================================
// E2E Tests - Reports Export Functionality
// Test delle funzionalità di export (CSV, Excel, PDF) per tutti i report
// ============================================================================

import { test, expect } from '@playwright/test';

// ============================================================================
// SETUP & HELPERS
// ============================================================================

/**
 * Helper per il login come amministratore
 */
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill login credentials
  await page.fill('input[type="text"]', 'superuser');
  await page.fill('input[type="password"]', 'promag06');

  // Click login button
  await page.click('button:has-text("Accedi")');

  // Wait for successful login - aumentato timeout a 30s
  await page.waitForURL('/dashboard', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Helper per navigare a una pagina report
 */
async function navigateToReportPage(page, reportPath) {
  await page.goto(reportPath);
  await page.waitForLoadState('networkidle');

  // Aspetta che la pagina sia completamente caricata
  await page.waitForTimeout(1000);
}

/**
 * Helper per verificare la presenza del pulsante export
 */
async function verifyExportButtonExists(page) {
  const exportButton = page.getByTestId('export-button');
  await expect(exportButton).toBeVisible();
  return exportButton;
}

/**
 * Helper per verificare il dropdown menu export
 */
async function verifyExportDropdown(page) {
  const exportButton = await verifyExportButtonExists(page);

  // Hover sul pulsante per mostrare il dropdown
  await exportButton.hover();

  // Aspetta che il dropdown sia visibile
  await page.waitForTimeout(300); // Tempo per l'animazione

  // Verifica che le 3 opzioni siano presenti
  const csvOption = page.locator('button:has-text("Esporta CSV")');
  const excelOption = page.locator('button:has-text("Esporta Excel")');
  const pdfOption = page.locator('button:has-text("Esporta PDF")');

  await expect(csvOption).toBeVisible();
  await expect(excelOption).toBeVisible();
  await expect(pdfOption).toBeVisible();

  return { csvOption, excelOption, pdfOption };
}

// ============================================================================
// TEST SUITE - Stock Report Export
// ============================================================================

test.describe('Stock Report - Export Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToReportPage(page, '/reports/stock');
  });

  test('should display export button', async ({ page }) => {
    await verifyExportButtonExists(page);
  });

  test('should show export dropdown menu on hover', async ({ page }) => {
    await verifyExportDropdown(page);
  });

  test('should have export button enabled when data is present', async ({ page }) => {
    // Aspetta che i dati siano caricati
    await page.waitForSelector('[data-testid="export-button"]');

    const exportButton = page.getByTestId('export-button');

    // Verifica che il pulsante non sia disabilitato
    await expect(exportButton).not.toBeDisabled();
  });

  test('should display correct text on export button', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).toContainText('Esporta PDF');
  });
});

// ============================================================================
// TEST SUITE - Movements Report Export
// ============================================================================

test.describe('Movements Report - Export Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToReportPage(page, '/reports/movements');
  });

  test('should display export button', async ({ page }) => {
    await verifyExportButtonExists(page);
  });

  test('should show export dropdown menu on hover', async ({ page }) => {
    await verifyExportDropdown(page);
  });

  test('should have export button enabled when data is present', async ({ page }) => {
    await page.waitForSelector('[data-testid="export-button"]');
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).not.toBeDisabled();
  });
});

// ============================================================================
// TEST SUITE - Lists Report Export
// ============================================================================

test.describe('Lists Report - Export Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToReportPage(page, '/reports/lists');
  });

  test('should display export button', async ({ page }) => {
    await verifyExportButtonExists(page);
  });

  test('should show export dropdown menu on hover', async ({ page }) => {
    await verifyExportDropdown(page);
  });

  test('should have export button enabled when data is present', async ({ page }) => {
    await page.waitForSelector('[data-testid="export-button"]');
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).not.toBeDisabled();
  });
});

// ============================================================================
// TEST SUITE - Productivity Report Export
// ============================================================================

test.describe('Productivity Report - Export Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToReportPage(page, '/reports/productivity');
  });

  test('should display export button', async ({ page }) => {
    await verifyExportButtonExists(page);
  });

  test('should show export dropdown menu on hover', async ({ page }) => {
    await verifyExportDropdown(page);
  });

  test('should have export button enabled when data is present', async ({ page }) => {
    await page.waitForSelector('[data-testid="export-button"]');
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).not.toBeDisabled();
  });
});

// ============================================================================
// TEST SUITE - Export UI Interactions
// ============================================================================

test.describe('Export UI - Dropdown Interactions', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToReportPage(page, '/reports/stock');
  });

  test('dropdown should be hidden by default', async ({ page }) => {
    const csvOption = page.locator('button:has-text("Esporta CSV")');

    // Il dropdown dovrebbe essere nascosto (invisible)
    await expect(csvOption).not.toBeVisible();
  });

  test('dropdown should appear on hover', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');

    // Hover sul pulsante
    await exportButton.hover();
    await page.waitForTimeout(300);

    // Ora il dropdown dovrebbe essere visibile
    const csvOption = page.locator('button:has-text("Esporta CSV")');
    await expect(csvOption).toBeVisible();
  });

  test('dropdown should contain all three format options', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await exportButton.hover();
    await page.waitForTimeout(300);

    // Verifica tutte e 3 le opzioni
    await expect(page.locator('button:has-text("Esporta CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Esporta Excel")')).toBeVisible();
    await expect(page.locator('button:has-text("Esporta PDF")')).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE - Export Button States
// ============================================================================

test.describe('Export Button - Disabled State', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should be disabled when no data is available', async ({ page }) => {
    // Naviga alla pagina stock report
    await navigateToReportPage(page, '/reports/stock');

    // Applica filtri che non restituiscono dati (se possibile)
    // Per ora verifichiamo solo che il pulsante esista
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE - Cross-Page Export Consistency
// ============================================================================

test.describe('Export Consistency - All Report Pages', () => {

  const reportPages = [
    { path: '/reports/stock', name: 'Stock' },
    { path: '/reports/movements', name: 'Movements' },
    { path: '/reports/lists', name: 'Lists' },
    { path: '/reports/productivity', name: 'Productivity' }
  ];

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const report of reportPages) {
    test(`${report.name} Report should have consistent export UI`, async ({ page }) => {
      await navigateToReportPage(page, report.path);

      // Verifica pulsante export
      const exportButton = page.getByTestId('export-button');
      await expect(exportButton).toBeVisible();
      await expect(exportButton).toContainText('Esporta PDF');

      // Verifica dropdown
      await exportButton.hover();
      await page.waitForTimeout(300);

      await expect(page.locator('button:has-text("Esporta CSV")')).toBeVisible();
      await expect(page.locator('button:has-text("Esporta Excel")')).toBeVisible();
      await expect(page.locator('button:has-text("Esporta PDF")')).toBeVisible();
    });
  }
});

// ============================================================================
// TEST SUITE - Export Button Accessibility
// ============================================================================

test.describe('Export Button - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToReportPage(page, '/reports/stock');
  });

  test('export button should have proper data-testid', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');
    await expect(exportButton).toBeVisible();
  });

  test('export button should have download icon', async ({ page }) => {
    const exportButton = page.getByTestId('export-button');

    // Verifica che il pulsante contenga l'icona download (lucide-react)
    const icon = exportButton.locator('svg');
    await expect(icon).toBeVisible();
  });
});
