import { test, expect } from '@playwright/test';

test.describe('List Management Enhanced E2E Tests - Checkpoint 1.2', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3001/');
    await page.evaluate(() => {
      const mockUser = { username: 'operatore1', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-lists-test';

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

  test('01 - ListManagementPage loads and displays table', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(3000);

    // Check page title
    await expect(page.locator('h1:has-text("Gestione Liste")')).toBeVisible();

    // Check table is rendered (using TanStack React Table)
    await page.waitForSelector('table', { timeout: 10000 });
    await expect(page.locator('table')).toBeVisible();

    // Check table headers
    await expect(page.locator('th:has-text("N° Lista")')).toBeVisible();
    await expect(page.locator('th:has-text("Tipo")')).toBeVisible();
    await expect(page.locator('th:has-text("Descrizione")')).toBeVisible();
    await expect(page.locator('th:has-text("Stato")')).toBeVisible();
    await expect(page.locator('th:has-text("Operatore")')).toBeVisible();
    await expect(page.locator('th:has-text("Items")')).toBeVisible();
    await expect(page.locator('th:has-text("Azioni")')).toBeVisible();
  });

  test('02 - Filters work correctly - filter by list type', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Check filters section exists
    await expect(page.locator('text=Filtri Avanzati')).toBeVisible();

    // Select list type filter (Picking)
    await page.selectOption('select[name="listType"]', '0');
    await page.waitForTimeout(1000);

    // Click "Applica Filtri" button
    await page.click('button:has-text("Applica Filtri")');
    await page.waitForTimeout(2000);

    // Verify URL contains query params
    expect(page.url()).toContain('listType=0');
  });

  test('03 - Filters work correctly - filter by status', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Select status filter (OPEN)
    await page.selectOption('select[name="status"]', 'OPEN');
    await page.waitForTimeout(1000);

    // Click "Applica Filtri" button
    await page.click('button:has-text("Applica Filtri")');
    await page.waitForTimeout(2000);

    // Verify URL contains query params
    expect(page.url()).toContain('status=OPEN');
  });

  test('04 - Filters work correctly - date range filter', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Fill date range inputs
    await page.fill('input[name="dateFrom"]', '2025-11-01');
    await page.fill('input[name="dateTo"]', '2025-11-25');
    await page.waitForTimeout(500);

    // Click "Applica Filtri" button
    await page.click('button:has-text("Applica Filtri")');
    await page.waitForTimeout(2000);

    // Verify URL contains date filters
    expect(page.url()).toContain('dateFrom=');
    expect(page.url()).toContain('dateTo=');
  });

  test('05 - Reset filters button works', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management?listType=0&status=OPEN');
    await page.waitForTimeout(2000);

    // Click "Reset Filtri" button
    await page.click('button:has-text("Reset Filtri")');
    await page.waitForTimeout(1000);

    // URL should not contain filter params
    expect(page.url()).not.toContain('listType=');
    expect(page.url()).not.toContain('status=');
  });

  test('06 - Create list wizard opens', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Click "Crea Nuova Lista" button
    await page.click('button:has-text("Crea Nuova Lista")');
    await page.waitForTimeout(800);

    // Check wizard modal opened
    await expect(page.locator('text=Crea Nuova Lista - Step 1/3')).toBeVisible();
    await expect(page.locator('text=Seleziona Tipo Lista')).toBeVisible();
  });

  test('07 - Wizard step 1 - select list type', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Open wizard
    await page.click('button:has-text("Crea Nuova Lista")');
    await page.waitForTimeout(800);

    // Check list type options
    await expect(page.locator('button:has-text("Picking")')).toBeVisible();
    await expect(page.locator('button:has-text("Refilling")')).toBeVisible();
    await expect(page.locator('button:has-text("Inventory")')).toBeVisible();

    // Select Picking
    await page.click('button:has-text("Picking")');
    await page.waitForTimeout(500);

    // Click "Avanti" button
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(800);

    // Should move to Step 2
    await expect(page.locator('text=Step 2/3')).toBeVisible();
    await expect(page.locator('text=Configura Lista')).toBeVisible();
  });

  test('08 - Wizard step 2 - configure list', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Open wizard and go to step 2
    await page.click('button:has-text("Crea Nuova Lista")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Picking")');
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(800);

    // Fill configuration form
    await page.fill('input[name="wizard-description"]', 'Test Lista Picking Magazzino A');
    await page.waitForTimeout(200);
    await page.selectOption('select[name="wizard-priority"]', 'HIGH');
    await page.waitForTimeout(200);
    await page.fill('input[name="wizard-assignedTo"]', 'operatore1');
    await page.waitForTimeout(500);

    // Click "Avanti" button
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(1000);

    // Should move to Step 3
    await expect(page.locator('text=Step 3/3')).toBeVisible();
    await expect(page.locator('text=Riepilogo e Conferma')).toBeVisible();
  });

  test('09 - Wizard step 3 - review and confirm', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Open wizard and complete all steps
    await page.click('button:has-text("Crea Nuova Lista")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Picking")');
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(800);

    await page.fill('input[name="wizard-description"]', 'Test Lista E2E');
    await page.waitForTimeout(200);
    await page.selectOption('select[name="wizard-priority"]', 'HIGH');
    await page.waitForTimeout(200);
    await page.fill('input[name="wizard-assignedTo"]', 'operatore1');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(1000);

    // Review step should show summary
    await expect(page.locator('text=Tipo: Picking')).toBeVisible();
    await expect(page.locator('text=Test Lista E2E')).toBeVisible();
    await expect(page.locator('text=Alta')).toBeVisible(); // Priority is displayed in Italian

    // Click "Conferma e Crea" button
    await page.click('button:has-text("Conferma e Crea")');
    await page.waitForTimeout(2000);

    // Should show success message
    await expect(page.locator('text=Lista creata con successo')).toBeVisible({ timeout: 5000 });
  });

  test('10 - Click row navigates to detail page', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(3000);

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Get first row
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Get list number from first cell
    const listNumberCell = firstRow.locator('td').first();
    const listNumber = await listNumberCell.textContent();

    // Click on row
    await firstRow.click();
    await page.waitForTimeout(1500);

    // Should navigate to detail page
    expect(page.url()).toMatch(/\/lists\/\d+$/);

    // Detail page should load
    await expect(page.locator('h1:has-text("Dettaglio Lista")')).toBeVisible({ timeout: 5000 });
  });

  test('11 - Detail page displays list info and items', async ({ page }) => {
    // Navigate directly to detail page (mock list ID 1)
    await page.goto('http://localhost:3001/lists/1');
    await page.waitForTimeout(3000);

    // Check page header
    await expect(page.locator('h1:has-text("Dettaglio Lista")')).toBeVisible();

    // Check metadata section
    await expect(page.locator('text=Tipo Lista:')).toBeVisible();
    await expect(page.locator('text=Stato:')).toBeVisible();
    await expect(page.locator('text=Operatore:')).toBeVisible();
    await expect(page.locator('text=Priorità:')).toBeVisible();

    // Check progress section
    await expect(page.locator('text=Progresso')).toBeVisible();

    // Check items table
    await expect(page.locator('h3:has-text("Items Lista")')).toBeVisible();
    await page.waitForSelector('table', { timeout: 10000 });

    // Check items table headers
    await expect(page.locator('th:has-text("Codice")')).toBeVisible();
    await expect(page.locator('th:has-text("Descrizione")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantità")')).toBeVisible();
    await expect(page.locator('th:has-text("Ubicazione")')).toBeVisible();
  });

  test('12 - Detail page action buttons work', async ({ page }) => {
    await page.goto('http://localhost:3001/lists/1');
    await page.waitForTimeout(3000);

    // Check action buttons are visible
    await expect(page.locator('button:has-text("Avvia Lista")')).toBeVisible();
    await expect(page.locator('button:has-text("Torna alla Lista")')).toBeVisible();

    // Click "Torna alla Lista" button
    await page.click('button:has-text("Torna alla Lista")');
    await page.waitForTimeout(1500);

    // Should navigate back to management page
    expect(page.url()).toContain('/lists/management');
    await expect(page.locator('h1:has-text("Gestione Liste")')).toBeVisible();
  });
});
