import { test, expect } from '@playwright/test';

test.describe('Reservations Page E2E Tests - Checkpoint 1.3', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3001/');
    await page.evaluate(() => {
      const mockUser = { username: 'operatore1', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-reservations-test';

      localStorage.setItem('ejlog_auth_token', mockToken);
      localStorage.setItem('ejlog_user', JSON.stringify(mockUser));

      const authStore = {
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        }
      };
      localStorage.setItem('ejlog-auth-storage', JSON.stringify(authStore));
    });
  });

  test('01 - ReservationsPage loads and displays table', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(3000);

    // Check page title
    await expect(page.locator('h1:has-text("Gestione Prenotazioni")')).toBeVisible();

    // Check table is rendered
    await page.waitForSelector('table', { timeout: 10000 });
    await expect(page.locator('table')).toBeVisible();

    // Check table headers
    await expect(page.locator('th:has-text("ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Articolo")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantità")')).toBeVisible();
    await expect(page.locator('th:has-text("UDC")')).toBeVisible();
    await expect(page.locator('th:has-text("Locazione")')).toBeVisible();
    await expect(page.locator('th:has-text("Stato")')).toBeVisible();
    await expect(page.locator('th:has-text("Azioni")')).toBeVisible();
  });

  test('02 - Filters section exists and is functional', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(2000);

    // Check filters section exists
    await expect(page.locator('text=Filtri')).toBeVisible();

    // Check filter fields exist
    await expect(page.locator('input[name="articleCode"]')).toBeVisible();
    await expect(page.locator('select[name="status"]')).toBeVisible();
    await expect(page.locator('input[name="dateFrom"]')).toBeVisible();
    await expect(page.locator('input[name="dateTo"]')).toBeVisible();

    // Check action buttons exist
    await expect(page.locator('button:has-text("Cerca")')).toBeVisible();
    await expect(page.locator('button:has-text("Reset")')).toBeVisible();
  });

  test('03 - Filter by article code', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(2000);

    // Fill article code filter
    await page.fill('input[name="articleCode"]', 'ART001');
    await page.waitForTimeout(500);

    // Click search button
    await page.click('button:has-text("Cerca")');
    await page.waitForTimeout(2000);

    // Verify URL contains query param
    expect(page.url()).toContain('articleCode=ART001');
  });

  test('04 - Filter by status', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(2000);

    // Select status filter
    await page.selectOption('select[name="status"]', 'ATTIVA');
    await page.waitForTimeout(500);

    // Click search button
    await page.click('button:has-text("Cerca")');
    await page.waitForTimeout(2000);

    // Verify URL contains query param
    expect(page.url()).toContain('status=ATTIVA');
  });

  test('05 - Filter by date range', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(2000);

    // Fill date range
    await page.fill('input[name="dateFrom"]', '2025-11-01');
    await page.fill('input[name="dateTo"]', '2025-11-25');
    await page.waitForTimeout(500);

    // Click search button
    await page.click('button:has-text("Cerca")');
    await page.waitForTimeout(2000);

    // Verify URL contains date filters
    expect(page.url()).toContain('dateFrom=');
    expect(page.url()).toContain('dateTo=');
  });

  test('06 - Reset filters button works', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations?articleCode=ART001&status=ATTIVA');
    await page.waitForTimeout(2000);

    // Click reset button
    await page.click('button:has-text("Reset")');
    await page.waitForTimeout(1000);

    // URL should not contain filter params
    expect(page.url()).not.toContain('articleCode=');
    expect(page.url()).not.toContain('status=');
  });

  test('07 - Click row opens detail modal', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(3000);

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Get first row
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Click on row (or detail button)
    const detailButton = firstRow.locator('button:has-text("Dettagli")');
    if (await detailButton.count() > 0) {
      await detailButton.click();
    } else {
      await firstRow.click();
    }
    await page.waitForTimeout(1500);

    // Modal should open
    await expect(page.locator('text=Dettaglio Prenotazione')).toBeVisible({ timeout: 5000 });
  });

  test('08 - Detail modal displays reservation info', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(3000);

    // Wait for table and click first row detail
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const firstRow = page.locator('table tbody tr').first();

    const detailButton = firstRow.locator('button:has-text("Dettagli")');
    if (await detailButton.count() > 0) {
      await detailButton.click();
    } else {
      await firstRow.click();
    }
    await page.waitForTimeout(1500);

    // Check modal content - using role-based selectors within modal
    const modal = page.getByLabel('Dettaglio Prenotazione');
    await expect(page.locator('text=Dettaglio Prenotazione')).toBeVisible();
    await expect(modal.getByText('Informazioni Generali')).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Quantità' })).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Locazioni' })).toBeVisible();
  });

  test('09 - Close detail modal', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(3000);

    // Open detail modal
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const firstRow = page.locator('table tbody tr').first();

    const detailButton = firstRow.locator('button:has-text("Dettagli")');
    if (await detailButton.count() > 0) {
      await detailButton.click();
    } else {
      await firstRow.click();
    }
    await page.waitForTimeout(1500);

    // Modal should be visible
    await expect(page.locator('text=Dettaglio Prenotazione')).toBeVisible();

    // Click close button
    await page.click('button:has-text("Chiudi")');
    await page.waitForTimeout(800);

    // Modal should be closed
    await expect(page.locator('text=Dettaglio Prenotazione')).not.toBeVisible();
  });

  test('10 - Pagination works correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/reservations');
    await page.waitForTimeout(3000);

    // Check pagination controls exist
    await expect(page.locator('text=Pagina')).toBeVisible();

    // Get initial data
    const firstPageFirstRowText = await page.locator('table tbody tr').first().textContent();

    // Click next page if available
    const nextButton = page.locator('button:has-text("Successiva")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(2000);

      // Data should have changed
      const secondPageFirstRowText = await page.locator('table tbody tr').first().textContent();
      expect(secondPageFirstRowText).not.toBe(firstPageFirstRowText);
    }
  });
});
