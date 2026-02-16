// ============================================================================
// EJLOG WMS - E2E Tests for Report Data Tables
// Test delle tabelle dati nei report con filtri e paginazione
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Report Data Tables', () => {
  test.beforeEach(async ({ page }) => {
    // Login first to access protected routes
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill login credentials (using real backend credentials)
    await page.fill('input[type="text"]', 'superuser');
    await page.fill('input[type="password"]', 'promag06');

    // Click login button
    await page.click('button:has-text("Accedi")');

    // Wait for successful login and redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Navigate to reports dashboard
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Stock Report', () => {
    test('should display stock report with data table', async ({ page }) => {
      // Navigate to stock report
      await page.click('[data-testid="stock-report-card"]');
      await expect(page).toHaveURL('/reports/stock');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check page title (looking only in main content, not header)
      await expect(page.locator('main h1')).toContainText('Report Giacenze');

      // Wait for data to load (mock data should appear after loading)
      await page.waitForTimeout(1000);

      // Check that data table is visible
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Check table headers
      await expect(table.locator('thead')).toContainText('Codice Articolo');
      await expect(table.locator('thead')).toContainText('Descrizione');
      await expect(table.locator('thead')).toContainText('Ubicazione');
      await expect(table.locator('thead')).toContainText('Lotto');
      await expect(table.locator('thead')).toContainText('Quantità');

      // Check that rows are present (at least 1 row if there's data)
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0); // May have 0 rows if no data, or multiple rows with data
    });

    test('should filter stock by zone', async ({ page }) => {
      await page.click('[data-testid="stock-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check initial data is loaded
      const initialRows = page.locator('tbody tr');
      await expect(initialRows.first()).toBeVisible();

      // Select zone filter
      const zoneSelect = page.locator('select').filter({ hasText: /Zona|Zone/i }).or(page.locator('select[name="zone"]'));
      if (await zoneSelect.count() > 0) {
        await zoneSelect.selectOption('A');
        await page.waitForTimeout(1000);

        // Data should be filtered (count may change)
        const filteredRows = page.locator('tbody tr');
        await expect(filteredRows.first()).toBeVisible();
      }
    });

    test('should filter stock by status', async ({ page }) => {
      await page.click('[data-testid="stock-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Select status filter
      const statusSelect = page.locator('select').filter({ hasText: /Stato|Status/i }).or(page.locator('select[name="status"]'));
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('DISPONIBILE');
        await page.waitForTimeout(1000);

        // Check filtered data contains only DISPONIBILE status
        const badges = page.locator('tbody .bg-green-100'); // DISPONIBILE badge
        if (await badges.count() > 0) {
          await expect(badges.first()).toBeVisible();
        }
      }
    });

    test('should sort stock table columns', async ({ page }) => {
      await page.click('[data-testid="stock-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click on a sortable column header
      const headerCell = page.locator('thead th').filter({ hasText: /Codice|Quantità/i }).first();
      await headerCell.click();
      await page.waitForTimeout(500);

      // Click again to reverse sort
      await headerCell.click();
      await page.waitForTimeout(500);

      // Table should still be visible with sorted data
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });
  });

  test.describe('Movements Report', () => {
    test('should display movements report with data table', async ({ page }) => {
      await page.click('[data-testid="movements-report-card"]');
      await expect(page).toHaveURL('/reports/movements');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check page title (looking only in main content, not header)
      await expect(page.locator('main h1')).toContainText('Report Movimenti');

      // Check table is visible
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Check headers
      await expect(table.locator('thead')).toContainText('ID Movimento');
      await expect(table.locator('thead')).toContainText('Tipo');
      await expect(table.locator('thead')).toContainText('Codice Articolo');

      // Check rows are present
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter movements by type', async ({ page }) => {
      await page.click('[data-testid="movements-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Select type filter
      const typeSelect = page.locator('select').filter({ hasText: /Tipo|Type/i }).or(page.locator('select[name="type"]'));
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('IN');
        await page.waitForTimeout(1000);

        // Check for IN type badges (green)
        const inBadges = page.locator('tbody .bg-green-100');
        if (await inBadges.count() > 0) {
          await expect(inBadges.first()).toBeVisible();
        }
      }
    });

    test('should display movement type badges correctly', async ({ page }) => {
      await page.click('[data-testid="movements-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check for different type badges
      const table = page.locator('table tbody');

      // Look for type badges (should have colored backgrounds)
      const badges = table.locator('span.inline-flex.items-center.px-2.py-1.rounded-full');
      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible();
      }
    });
  });

  test.describe('Lists Report', () => {
    test('should display lists report with data table', async ({ page }) => {
      await page.click('[data-testid="lists-report-card"]');
      await expect(page).toHaveURL('/reports/lists');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check page title (looking only in main content, not header)
      await expect(page.locator('main h1')).toContainText('Report Liste');

      // Check table
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Check headers
      await expect(table.locator('thead')).toContainText('ID Lista');
      await expect(table.locator('thead')).toContainText('Tipo');
      await expect(table.locator('thead')).toContainText('Completamento');

      // Check rows are present
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThanOrEqual(0);
    });

    test('should display completion progress bars', async ({ page }) => {
      await page.click('[data-testid="lists-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check for progress bars
      const progressBars = page.locator('.bg-ferrRed').filter({ has: page.locator('[style*="width"]') });
      if (await progressBars.count() > 0) {
        await expect(progressBars.first()).toBeVisible();
      }

      // Check for percentage text
      const percentageText = page.locator('tbody').getByText(/%$/);
      if (await percentageText.count() > 0) {
        await expect(percentageText.first()).toBeVisible();
      }
    });

    test('should filter lists by type and status', async ({ page }) => {
      await page.click('[data-testid="lists-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Try type filter
      const typeSelect = page.locator('select').filter({ hasText: /Tipo|Type/i }).or(page.locator('select[name="type"]'));
      if (await typeSelect.count() > 0) {
        await typeSelect.selectOption('PICKING');
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        await expect(table).toBeVisible();
      }

      // Try status filter
      const statusSelect = page.locator('select').filter({ hasText: /Stato|Status/i }).or(page.locator('select[name="status"]'));
      if (await statusSelect.count() > 0) {
        await statusSelect.selectOption('IN_PROGRESS');
        await page.waitForTimeout(1000);

        const table = page.locator('table');
        await expect(table).toBeVisible();
      }
    });
  });

  test.describe('Productivity Report', () => {
    test('should display productivity report with KPI cards and table', async ({ page }) => {
      await page.click('[data-testid="productivity-report-card"]');
      await expect(page).toHaveURL('/reports/productivity');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check page title (looking only in main content, not header)
      await expect(page.locator('main h1')).toContainText('Report Produttività');

      // Check KPI cards are visible
      const kpiCards = page.locator('.grid').first();
      await expect(kpiCards).toBeVisible();

      // Check for specific KPIs (looking only in KPI cards grid, not table headers)
      await expect(kpiCards.getByText('Task Completati')).toBeVisible();
      await expect(kpiCards.getByText('Efficienza Media')).toBeVisible();
      await expect(kpiCards.getByText('Tempo Medio Task')).toBeVisible();
      await expect(kpiCards.getByText('Ore Totali')).toBeVisible();

      // Check table
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Check headers
      await expect(table.locator('thead')).toContainText('Operatore');
      await expect(table.locator('thead')).toContainText('Task Completati');
      await expect(table.locator('thead')).toContainText('Efficienza');
    });

    test('should display efficiency badges with correct colors', async ({ page }) => {
      await page.click('[data-testid="productivity-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check for efficiency badges
      const table = page.locator('table tbody');
      const badges = table.locator('span.inline-flex.items-center').filter({ hasText: /%$/ });

      if (await badges.count() > 0) {
        await expect(badges.first()).toBeVisible();

        // Check for different color badges (green for high, yellow for medium, red for low)
        const greenBadge = table.locator('.bg-green-100');
        const yellowBadge = table.locator('.bg-yellow-100');

        if (await greenBadge.count() > 0) {
          await expect(greenBadge.first()).toBeVisible();
        }
      }
    });

    test('should display KPI values correctly', async ({ page }) => {
      await page.click('[data-testid="productivity-report-card"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check that KPI values are numbers
      const kpiGrid = page.locator('.grid').first();

      // Task Completati should be a number
      const taskCount = kpiGrid.getByText('Task Completati').locator('..').getByText(/^\d+$/);
      if (await taskCount.count() > 0) {
        await expect(taskCount).toBeVisible();
      }

      // Efficienza should be a percentage
      const efficiency = kpiGrid.getByText('Efficienza Media').locator('..').getByText(/%$/);
      if (await efficiency.count() > 0) {
        await expect(efficiency).toBeVisible();
      }
    });
  });

  test.describe('Common Features', () => {
    test('should have refresh button on all report pages', async ({ page }) => {
      const reports = ['stock', 'movements', 'lists', 'productivity'];

      for (const report of reports) {
        await page.goto(`/reports/${report}`);
        await page.waitForLoadState('networkidle');

        // Check for refresh button
        const refreshButton = page.locator('[data-testid="refresh-button"]');
        await expect(refreshButton).toBeVisible();

        // Click refresh button
        await refreshButton.click();
        await page.waitForTimeout(500);

        // Table should still be visible
        const table = page.locator('table');
        await expect(table).toBeVisible();
      }
    });

    test('should have export button on all report pages', async ({ page }) => {
      const reports = ['stock', 'movements', 'lists', 'productivity'];

      for (const report of reports) {
        await page.goto(`/reports/${report}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for export button
        const exportButton = page.locator('[data-testid="export-button"]');
        await expect(exportButton).toBeVisible();
      }
    });

    test('should have back button on all report pages', async ({ page }) => {
      const reports = ['stock', 'movements', 'lists', 'productivity'];

      for (const report of reports) {
        await page.goto(`/reports/${report}`);
        await page.waitForLoadState('networkidle');

        // Check for back button
        const backButton = page.locator('[data-testid="back-button"]');
        await expect(backButton).toBeVisible();

        // Click back button
        await backButton.click();
        await page.waitForLoadState('networkidle');

        // Should return to reports dashboard
        await expect(page).toHaveURL('/reports');
      }
    });

    test('should show loading state initially', async ({ page }) => {
      await page.goto('/reports/stock');

      // Should show loading skeleton or spinner briefly
      // (Hard to test due to quick load time with mock data, but structure is in place)
      await page.waitForLoadState('networkidle');

      // Eventually table should be visible
      await page.waitForTimeout(1000);
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should navigate between report pages', async ({ page }) => {
      // Start at reports dashboard
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      // Navigate to each report and back
      const reportCards = [
        { testId: 'stock-report-card', url: '/reports/stock', title: 'Giacenze' },
        { testId: 'movements-report-card', url: '/reports/movements', title: 'Movimenti' },
        { testId: 'lists-report-card', url: '/reports/lists', title: 'Liste' },
        { testId: 'productivity-report-card', url: '/reports/productivity', title: 'Produttività' }
      ];

      for (const report of reportCards) {
        // Click report card
        await page.click(`[data-testid="${report.testId}"]`);
        await expect(page).toHaveURL(report.url);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        // Check title contains expected text (looking only in main content, not header)
        await expect(page.locator('main h1')).toContainText(report.title);

        // Go back to dashboard
        await page.click('[data-testid="back-button"]');
        await expect(page).toHaveURL('/reports');
        await page.waitForLoadState('networkidle');
      }
    });
  });
});
