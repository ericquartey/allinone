// ============================================================================
// EJLOG WMS - API Integration Tests
// Test end-to-end per integrazione backend API
// ============================================================================

import { test, expect } from '@playwright/test';

/**
 * Backend API Integration Tests
 * Verificano la corretta integrazione tra frontend React e backend Java
 */

test.describe('Backend API Integration', () => {
  const BASE_URL = 'http://localhost:3005';
  const API_URL = 'http://localhost:3077/api';

  test.beforeEach(async ({ page }) => {
    // Setup: Naviga alla home
    await page.goto(BASE_URL);

    // Bypass autenticazione se necessario
    // await page.evaluate(() => {
    //   localStorage.setItem('auth_token', 'test_token');
    // });
  });

  test.describe('Health Check', () => {
    test('should verify backend is running', async ({ page }) => {
      const response = await page.request.get(`${API_URL}/health`);
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
    });

    test('should verify API version endpoint', async ({ page }) => {
      const response = await page.request.get(`${API_URL}/version`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('buildTime');
    });
  });

  test.describe('Lists API Integration', () => {
    test('should fetch lists from backend', async ({ page }) => {
      await page.goto(`${BASE_URL}/lists`);

      // Attendi il caricamento
      await page.waitForSelector('[data-testid="lists-table"]', { timeout: 10000 });

      // Intercetta la chiamata API
      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/item-lists/search') && response.status() === 200,
        { timeout: 15000 }
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(Array.isArray(data) || data.items).toBeTruthy();
    });

    test('should handle list detail view', async ({ page }) => {
      await page.goto(`${BASE_URL}/lists`);

      // Clicca sulla prima lista
      await page.waitForSelector('[data-testid="list-row"]', { timeout: 10000 });
      const firstList = page.locator('[data-testid="list-row"]').first();
      await firstList.click();

      // Verifica navigazione al dettaglio
      await expect(page).toHaveURL(/\/lists\/\d+/);

      // Verifica chiamata API dettaglio
      const detailResponse = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/item-lists/') &&
          !response.url().includes('/search') &&
          response.status() === 200,
        { timeout: 10000 }
      );

      expect(detailResponse.ok()).toBeTruthy();
    });

    test('should handle list execution', async ({ page }) => {
      await page.goto(`${BASE_URL}/lists`);

      // Trova e clicca pulsante esegui sulla prima lista
      await page.waitForSelector('[data-testid="execute-list-btn"]', { timeout: 10000 });
      const executeBtn = page.locator('[data-testid="execute-list-btn"]').first();

      // Intercetta la chiamata POST execute
      const [response] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/execute') && response.request().method() === 'POST',
          { timeout: 10000 }
        ),
        executeBtn.click(),
      ]);

      expect(response.ok()).toBeTruthy();
    });

    test('should handle filters and search', async ({ page }) => {
      await page.goto(`${BASE_URL}/lists`);

      // Applica filtro per numero lista
      await page.fill('[data-testid="filter-list-number"]', 'LST001');

      // Intercetta chiamata API con filtri
      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/item-lists/search') &&
          response.url().includes('numList=LST001'),
        { timeout: 10000 }
      );

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('PLC API Integration', () => {
    test('should fetch PLC devices', async ({ page }) => {
      await page.goto(`${BASE_URL}/plc/devices`);

      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/plc/devices') && response.status() === 200,
        { timeout: 10000 }
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(Array.isArray(data) || data.devices).toBeTruthy();
    });

    test('should handle PLC device detail', async ({ page }) => {
      await page.goto(`${BASE_URL}/plc/devices`);

      // Clicca sul primo dispositivo
      await page.waitForSelector('[data-testid="plc-device-card"]', { timeout: 10000 });
      const firstDevice = page.locator('[data-testid="plc-device-card"]').first();
      await firstDevice.click();

      // Verifica navigazione al dettaglio
      await expect(page).toHaveURL(/\/plc\/devices\/\d+/);

      // Verifica caricamento segnali
      const signalsResponse = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/plc/') &&
          response.url().includes('/signals'),
        { timeout: 10000 }
      );

      expect(signalsResponse.ok()).toBeTruthy();
    });

    test('should execute PLC command', async ({ page }) => {
      await page.goto(`${BASE_URL}/plc/devices/1`);

      // Naviga al tab comandi
      await page.click('[data-testid="commands-tab"]');

      // Seleziona un comando
      await page.selectOption('[data-testid="command-select"]', { index: 1 });

      // Intercetta POST command
      const [response] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.url().includes('/api/plc/') &&
            response.url().includes('/commands') &&
            response.request().method() === 'POST',
          { timeout: 10000 }
        ),
        page.click('[data-testid="execute-command-btn"]'),
      ]);

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Locations API Integration', () => {
    test('should fetch warehouse locations', async ({ page }) => {
      await page.goto(`${BASE_URL}/locations`);

      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/locations') && response.status() === 200,
        { timeout: 10000 }
      );

      expect(response.ok()).toBeTruthy();
    });

    test('should handle location filters', async ({ page }) => {
      await page.goto(`${BASE_URL}/locations`);

      // Applica filtro warehouse
      await page.selectOption('[data-testid="filter-warehouse"]', { index: 1 });

      // Verifica chiamata API con filtri
      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/locations') &&
          response.url().includes('warehouseId'),
        { timeout: 10000 }
      );

      expect(response.ok()).toBeTruthy();
    });

    test('should display warehouse map', async ({ page }) => {
      await page.goto(`${BASE_URL}/locations`);

      // Switch to map view
      await page.click('[data-testid="view-mode-map"]');

      // Verifica che la mappa SVG sia renderizzata
      await expect(page.locator('svg[data-testid="warehouse-map"]')).toBeVisible();

      // Verifica che ci siano zone o locations nella mappa
      await expect(page.locator('[data-testid^="zone-"]')).toHaveCount({ gte: 1 });
    });
  });

  test.describe('Stock API Integration', () => {
    test('should fetch stock movements', async ({ page }) => {
      await page.goto(`${BASE_URL}/stock/movements`);

      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/stock/movements') && response.status() === 200,
        { timeout: 10000 }
      );

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(Array.isArray(data) || data.movements).toBeTruthy();
    });

    test('should handle stock analytics dashboard', async ({ page }) => {
      await page.goto(`${BASE_URL}/stock/analytics`);

      // Verifica caricamento KPIs
      await expect(page.locator('[data-testid="kpi-total-value"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="kpi-total-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-turnover-rate"]')).toBeVisible();
    });
  });

  test.describe('Orders API Integration', () => {
    test('should fetch orders list', async ({ page }) => {
      await page.goto(`${BASE_URL}/orders`);

      const response = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/orders') && response.status() === 200,
        { timeout: 10000 }
      );

      expect(response.ok()).toBeTruthy();
    });

    test('should handle order priority manager', async ({ page }) => {
      await page.goto(`${BASE_URL}/orders/priority`);

      // Verifica caricamento ordini
      await expect(page.locator('[data-testid="order-card"]')).toHaveCount({ gte: 1 });

      // Applica regola priorità
      await page.click('[data-testid="apply-rule-FIFO"]');

      // Verifica che l'ordine delle carte cambi
      await page.waitForTimeout(1000); // Attendi animazione

      const firstOrder = page.locator('[data-testid="order-card"]').first();
      await expect(firstOrder).toHaveAttribute('data-priority', '1');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simula errore di rete bloccando richieste API
      await page.route('**/api/**', (route) => route.abort('failed'));

      await page.goto(`${BASE_URL}/lists`);

      // Verifica che venga mostrato errore
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        /connessione|network|errore/i
      );
    });

    test('should handle 404 errors', async ({ page }) => {
      await page.route('**/api/item-lists/99999', (route) =>
        route.fulfill({ status: 404, body: JSON.stringify({ error: 'Not Found' }) })
      );

      await page.goto(`${BASE_URL}/lists/99999`);

      await expect(page.locator('[data-testid="error-404"]')).toBeVisible({
        timeout: 10000,
      });
    });

    test('should handle 500 server errors', async ({ page }) => {
      await page.route('**/api/item-lists/search', (route) =>
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) })
      );

      await page.goto(`${BASE_URL}/lists`);

      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="error-message"]')).toContainText(
        /server|errore/i
      );
    });

    test('should handle timeout errors', async ({ page, context }) => {
      // Imposta timeout molto basso
      await context.route('**/api/**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 60000));
        route.continue();
      });

      await page.goto(`${BASE_URL}/lists`);

      // Verifica che dopo timeout mostri errore
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible({
        timeout: 35000,
      });
    });
  });

  test.describe('Real-time Updates', () => {
    test('should handle polling updates for list execution', async ({ page }) => {
      await page.goto(`${BASE_URL}/lists/execution-tracker`);

      // Intercetta prima chiamata
      const firstResponse = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/item-lists/') &&
          response.url().includes('/status'),
        { timeout: 10000 }
      );

      const firstData = await firstResponse.json();

      // Attendi polling refresh (5 secondi default)
      await page.waitForTimeout(6000);

      // Intercetta seconda chiamata
      const secondResponse = await page.waitForResponse(
        (response) =>
          response.url().includes('/api/item-lists/') &&
          response.url().includes('/status'),
        { timeout: 10000 }
      );

      expect(secondResponse.ok()).toBeTruthy();

      // Verifica che ci sia stato un refresh
      expect(secondResponse.request().url()).toBe(firstResponse.request().url());
    });

    test('should handle signal monitoring real-time updates', async ({ page }) => {
      await page.goto(`${BASE_URL}/plc/signals/monitor`);

      // Abilita auto-refresh
      await page.check('[data-testid="auto-refresh-toggle"]');

      // Intercetta due chiamate successive
      let callCount = 0;
      await page.on('response', (response) => {
        if (response.url().includes('/api/plc/signals') && response.status() === 200) {
          callCount++;
        }
      });

      // Attendi due refresh (5s ciascuno)
      await page.waitForTimeout(12000);

      expect(callCount).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe('Performance', () => {
    test('should load lists page within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE_URL}/lists`);
      await page.waitForSelector('[data-testid="lists-table"]', { timeout: 10000 });

      const loadTime = Date.now() - startTime;

      // Verifica che il caricamento sia sotto 5 secondi
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Simula response con molti dati
      await page.route('**/api/item-lists/search', (route) => {
        const largDataset = Array.from({ length: 500 }, (_, i) => ({
          id: i + 1,
          numList: `LST${String(i + 1).padStart(6, '0')}`,
          description: `Lista ${i + 1}`,
          status: ['PENDING', 'IN_PROGRESS', 'COMPLETED'][i % 3],
        }));

        route.fulfill({
          status: 200,
          body: JSON.stringify(largDataset),
        });
      });

      await page.goto(`${BASE_URL}/lists`);

      // Verifica rendering
      await expect(page.locator('[data-testid="list-row"]')).toHaveCount({ gte: 10 });

      // Verifica scroll virtuale o paginazione
      const hasVirtualScroll = await page.locator('[data-virtual-scroll]').isVisible();
      const hasPagination = await page.locator('[data-testid="pagination"]').isVisible();

      expect(hasVirtualScroll || hasPagination).toBeTruthy();
    });
  });

  test.describe('Cache and Offline', () => {
    test('should use cached data when offline', async ({ page, context }) => {
      await page.goto(`${BASE_URL}/lists`);

      // Attendi caricamento iniziale
      await page.waitForSelector('[data-testid="lists-table"]', { timeout: 10000 });

      // Salva il numero di liste visibili
      const initialCount = await page.locator('[data-testid="list-row"]').count();

      // Simula offline
      await context.setOffline(true);

      // Ricarica pagina
      await page.reload();

      // Verifica che i dati cached siano ancora visibili
      await expect(page.locator('[data-testid="list-row"]')).toHaveCount(initialCount);

      // Verifica indicatore offline
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });
  });
});

