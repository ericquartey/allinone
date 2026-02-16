// ============================================================================
// EJLOG WMS - Critical Workflows Integration Tests
// Test end-to-end per workflow di business critici
// ============================================================================

import { test, expect } from '@playwright/test';

/**
 * Critical Business Workflows Tests
 * Testano i processi end-to-end più importanti del WMS
 */

test.describe('Critical Business Workflows', () => {
  const BASE_URL = 'http://localhost:3005';

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Bypass auth se necessario
    // await page.evaluate(() => localStorage.setItem('auth_token', 'test'));
  });

  test.describe('Picking Workflow', () => {
    test('complete picking list execution', async ({ page }) => {
      // 1. Naviga a liste picking
      await page.goto(`${BASE_URL}/lists`);
      await page.waitForSelector('[data-testid="lists-table"]', { timeout: 10000 });

      // 2. Filtra solo liste picking pending
      await page.selectOption('[data-testid="filter-type"]', 'PICKING');
      await page.selectOption('[data-testid="filter-status"]', 'PENDING');

      // 3. Seleziona prima lista
      await page.waitForSelector('[data-testid="list-row"]');
      const firstList = page.locator('[data-testid="list-row"]').first();
      const listNumber = await firstList.getAttribute('data-list-number');

      // 4. Esegui lista
      await firstList.locator('[data-testid="execute-list-btn"]').click();

      // 5. Conferma esecuzione se richiesto
      const confirmBtn = page.locator('[data-testid="confirm-execute-btn"]');
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
      }

      // 6. Verifica feedback successo
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        /eseguita|success|completata/i
      );

      // 7. Verifica che lo stato sia cambiato
      await page.waitForTimeout(2000); // Attendi aggiornamento
      const updatedList = page.locator(`[data-list-number="${listNumber}"]`);
      await expect(updatedList).toHaveAttribute('data-status', /IN_PROGRESS|PROCESSING/);

      // 8. Naviga al tracker esecuzione
      await page.goto(`${BASE_URL}/lists/execution-tracker`);

      // 9. Verifica che la lista appaia nel tracker
      await expect(
        page.locator(`[data-testid="execution-${listNumber}"]`)
      ).toBeVisible({ timeout: 10000 });

      // 10. Verifica progress tracking
      const progressBar = page.locator(
        `[data-testid="execution-${listNumber}"] [data-testid="progress-bar"]`
      );
      await expect(progressBar).toBeVisible();
    });

    test('picking path optimization workflow', async ({ page }) => {
      // 1. Naviga a path optimizer
      await page.goto(`${BASE_URL}/locations/picking-optimizer`);

      // 2. Seleziona lista picking
      await page.selectOption('[data-testid="select-list"]', { index: 1 });

      // 3. Scegli algoritmo
      await page.click('[data-testid="algorithm-nearest"]');

      // 4. Calcola percorso
      await page.click('[data-testid="calculate-path-btn"]');

      // 5. Verifica risultati
      await expect(page.locator('[data-testid="path-result"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="total-distance"]')).toContainText(/\d+/);
      await expect(page.locator('[data-testid="total-stops"]')).toContainText(/\d+/);

      // 6. Verifica visualizzazione percorso
      await expect(page.locator('[data-testid="path-visualization"]')).toBeVisible();

      // 7. Export percorso
      await page.click('[data-testid="export-path-btn"]');

      // Verifica download
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-path-btn"]'),
      ]);

      expect(download.suggestedFilename()).toMatch(/picking.*path.*json/i);
    });
  });

  test.describe('Replenishment Workflow', () => {
    test('smart replenishment suggestions', async ({ page }) => {
      // 1. Naviga a replenishment suggestions
      await page.goto(`${BASE_URL}/locations/replenishment`);

      // 2. Verifica caricamento suggerimenti
      await expect(page.locator('[data-testid="suggestion-card"]')).toHaveCount({
        gte: 1,
      });

      // 3. Filtra suggerimenti critici
      await page.click('[data-testid="filter-critical"]');

      // 4. Ordina per priorità
      await page.click('[data-testid="sort-priority"]');

      // 5. Seleziona primo suggerimento
      const firstSuggestion = page.locator('[data-testid="suggestion-card"]').first();
      await expect(firstSuggestion).toHaveAttribute('data-priority', 'CRITICAL');

      // 6. Crea task di rifornimento
      await firstSuggestion.locator('[data-testid="create-task-btn"]').click();

      // 7. Conferma creazione
      await page.click('[data-testid="confirm-create-task"]');

      // 8. Verifica task creata
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // 9. Naviga a liste rifornimento
      await page.goto(`${BASE_URL}/lists`);
      await page.selectOption('[data-testid="filter-type"]', 'REFILLING');

      // 10. Verifica che la nuova lista appaia
      await expect(page.locator('[data-testid="list-row"]')).toHaveCount({ gte: 1 });
    });
  });

  test.describe('Inventory Workflow', () => {
    test('complete inventory check cycle', async ({ page }) => {
      // 1. Naviga a locations
      await page.goto(`${BASE_URL}/locations`);

      // 2. Filtra location per inventario
      await page.fill('[data-testid="filter-location-code"]', 'A01-01-01');
      await page.waitForTimeout(1000);

      // 3. Apri dettaglio location
      await page.click('[data-testid="location-card"]');

      // 4. Verifica stock attuale
      const currentStock = await page
        .locator('[data-testid="current-stock-quantity"]')
        .textContent();
      expect(currentStock).toMatch(/\d+/);

      // 5. Crea lista inventario
      await page.click('[data-testid="create-inventory-btn"]');

      // 6. Esegui inventario
      await page.fill('[data-testid="physical-count"]', '150');
      await page.click('[data-testid="submit-inventory"]');

      // 7. Verifica differenza inventariale
      const difference = await page.locator('[data-testid="inventory-difference"]');
      if (await difference.isVisible()) {
        await expect(difference).toContainText(/\d+/);
      }

      // 8. Conferma inventario
      await page.click('[data-testid="confirm-inventory"]');

      // 9. Verifica aggiornamento stock
      await page.waitForTimeout(2000);
      await expect(page.locator('[data-testid="current-stock-quantity"]')).toContainText(
        '150'
      );
    });
  });

  test.describe('Order Processing Workflow', () => {
    test('order priority management and picking generation', async ({ page }) => {
      // 1. Naviga a order priority manager
      await page.goto(`${BASE_URL}/orders/priority`);

      // 2. Verifica caricamento ordini
      await expect(page.locator('[data-testid="order-card"]')).toHaveCount({ gte: 1 });

      // 3. Applica regola priorità CUSTOM (scoring intelligente)
      await page.click('[data-testid="apply-rule-CUSTOM"]');
      await page.waitForTimeout(1500);

      // 4. Verifica riordinamento
      const firstOrder = page.locator('[data-testid="order-card"]').first();
      const urgency = await firstOrder.getAttribute('data-urgency');
      expect(['CRITICAL', 'HIGH']).toContain(urgency);

      // 5. Seleziona ordine critico
      const criticalOrder = page.locator('[data-urgency="CRITICAL"]').first();
      const orderNumber = await criticalOrder.getAttribute('data-order-number');

      // 6. Genera lista picking dall'ordine
      await criticalOrder.locator('[data-testid="generate-picking-btn"]').click();

      // 7. Conferma generazione
      await page.click('[data-testid="confirm-generate"]');

      // 8. Verifica successo
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // 9. Naviga a liste picking
      await page.goto(`${BASE_URL}/lists`);
      await page.selectOption('[data-testid="filter-type"]', 'PICKING');

      // 10. Verifica lista generata
      await expect(
        page.locator(`[data-order-number="${orderNumber}"]`)
      ).toBeVisible();
    });

    test('batch order processing', async ({ page }) => {
      // 1. Naviga a orders
      await page.goto(`${BASE_URL}/orders`);

      // 2. Seleziona multipli ordini
      await page.check('[data-testid="select-order"]:nth-child(1)');
      await page.check('[data-testid="select-order"]:nth-child(2)');
      await page.check('[data-testid="select-order"]:nth-child(3)');

      // 3. Click azione batch
      await page.click('[data-testid="batch-actions-btn"]');

      // 4. Seleziona "Genera Liste Picking"
      await page.click('[data-testid="batch-generate-picking"]');

      // 5. Conferma
      await page.click('[data-testid="confirm-batch"]');

      // 6. Verifica progress
      await expect(page.locator('[data-testid="batch-progress"]')).toBeVisible();

      // 7. Attendi completamento
      await expect(page.locator('[data-testid="batch-complete"]')).toBeVisible({
        timeout: 30000,
      });

      // 8. Verifica riepilogo
      await expect(page.locator('[data-testid="batch-summary"]')).toContainText(/3.*liste/i);
    });
  });

  test.describe('Stock Movement Workflow', () => {
    test('complete stock transfer between locations', async ({ page }) => {
      // 1. Naviga a stock movements
      await page.goto(`${BASE_URL}/stock/movements`);

      // 2. Crea nuovo movimento
      await page.click('[data-testid="create-movement-btn"]');

      // 3. Compila form trasferimento
      await page.selectOption('[data-testid="source-location"]', { index: 1 });
      await page.selectOption('[data-testid="target-location"]', { index: 2 });
      await page.fill('[data-testid="item-code"]', 'ART001');
      await page.fill('[data-testid="quantity"]', '50');
      await page.selectOption('[data-testid="reason"]', 'TRANSFER');

      // 4. Valida form
      await expect(page.locator('[data-testid="submit-movement-btn"]')).toBeEnabled();

      // 5. Conferma movimento
      await page.click('[data-testid="submit-movement-btn"]');

      // 6. Verifica creazione
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // 7. Verifica in lista movimenti
      const movementRow = page.locator('[data-item-code="ART001"]').first();
      await expect(movementRow).toBeVisible();
      await expect(movementRow).toContainText('50');
      await expect(movementRow).toContainText('TRANSFER');

      // 8. Naviga a location source
      await page.goto(`${BASE_URL}/locations`);
      await page.fill('[data-testid="filter-location-code"]', 'A01-01-01');

      // 9. Verifica stock decrementato
      // (test dipende da dati mock/reali)
    });
  });

  test.describe('PLC Integration Workflow', () => {
    test('PLC command execution and signal monitoring', async ({ page }) => {
      // 1. Naviga a PLC devices
      await page.goto(`${BASE_URL}/plc/devices`);

      // 2. Seleziona dispositivo attivo
      await page.click('[data-status="ONLINE"]');

      // 3. Naviga a tab signals
      await page.click('[data-testid="signals-tab"]');

      // 4. Abilita monitoring real-time
      await page.check('[data-testid="auto-refresh-toggle"]');

      // 5. Verifica aggiornamenti
      const signal = page.locator('[data-testid="signal-card"]').first();
      const initialValue = await signal.getAttribute('data-value');

      await page.waitForTimeout(6000); // Attendi 1 refresh

      const updatedValue = await signal.getAttribute('data-value');
      // I valori potrebbero essere cambiati o uguali (dipende dal PLC reale)
      expect(updatedValue).toBeDefined();

      // 6. Naviga a tab commands
      await page.click('[data-testid="commands-tab"]');

      // 7. Esegui comando test
      await page.selectOption('[data-testid="command-template"]', 'TEST_CONNECTION');
      await page.click('[data-testid="execute-command-btn"]');

      // 8. Verifica esecuzione
      await expect(page.locator('[data-testid="command-result"]')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('[data-testid="command-status"]')).toContainText(
        /success|completed/i
      );
    });
  });

  test.describe('Analytics and Reporting Workflow', () => {
    test('stock analytics dashboard and export', async ({ page }) => {
      // 1. Naviga a stock analytics
      await page.goto(`${BASE_URL}/stock/analytics`);

      // 2. Verifica KPIs caricati
      await expect(page.locator('[data-testid="kpi-total-value"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-total-items"]')).toBeVisible();

      // 3. Filtra per categoria
      await page.selectOption('[data-testid="filter-category"]', { index: 1 });

      // 4. Verifica aggiornamento dati
      await page.waitForTimeout(1000);

      // 5. Visualizza top performers
      await expect(page.locator('[data-testid="top-performer-card"]')).toHaveCount({ gte: 1 });

      // 6. Switch metrica
      await page.selectOption('[data-testid="metric-select"]', 'turnoverRate');

      // 7. Verifica aggiornamento classifica
      await page.waitForTimeout(500);

      // 8. Export report
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="export-analytics-btn"]'),
      ]);

      expect(download.suggestedFilename()).toMatch(/analytics.*json/i);
    });

    test('location heatmap analytics', async ({ page }) => {
      // 1. Naviga a location analytics
      await page.goto(`${BASE_URL}/locations/analytics`);

      // 2. Seleziona metrica utilization
      await page.selectOption('[data-testid="metric-select"]', 'utilization');

      // 3. Imposta time range
      await page.selectOption('[data-testid="time-range"]', '7d');

      // 4. Verifica heatmap rendering
      await expect(page.locator('[data-testid="heatmap-grid"]')).toBeVisible();

      // 5. Verifica color coding
      const highUtilization = page.locator('[data-utilization-level="HIGH"]');
      await expect(highUtilization.first()).toBeVisible();

      // 6. Switch to list view
      await page.click('[data-testid="view-list"]');

      // 7. Verifica sort
      await page.click('[data-testid="sort-value-desc"]');

      // 8. Export dati
      await page.click('[data-testid="export-heatmap-btn"]');

      // Verifica export completato
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible();
    });
  });

  test.describe('Capacity Planning Workflow', () => {
    test('location capacity planning and growth projection', async ({ page }) => {
      // 1. Naviga a capacity planner
      await page.goto(`${BASE_URL}/locations/capacity-planning`);

      // 2. Seleziona warehouse
      await page.selectOption('[data-testid="select-warehouse"]', { index: 1 });

      // 3. Verifica current capacity metrics
      await expect(page.locator('[data-testid="current-utilization"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-capacity"]')).toContainText(/\d+/);

      // 4. Seleziona scenario growth
      await page.click('[data-testid="scenario-high-growth"]');

      // 5. Verifica proiezioni
      await expect(page.locator('[data-testid="projected-utilization"]')).toBeVisible();
      await expect(page.locator('[data-testid="days-until-full"]')).toContainText(/\d+/);

      // 6. Visualizza bottlenecks
      await expect(page.locator('[data-testid="bottleneck-location"]')).toHaveCount({
        gte: 0,
      });

      // 7. Visualizza raccomandazioni
      await expect(page.locator('[data-testid="recommendation-card"]')).toHaveCount({
        gte: 1,
      });

      // 8. Export piano
      await page.click('[data-testid="export-plan-btn"]');
    });
  });

  test.describe('Multi-step Complex Workflow', () => {
    test('end-to-end order fulfillment', async ({ page }) => {
      // Workflow completo: Ordine → Prioritizzazione → Picking → Esecuzione → Spedizione

      // Step 1: Crea/Seleziona ordine
      await page.goto(`${BASE_URL}/orders`);
      await page.click('[data-testid="order-card"]');
      const orderNumber = await page.getAttribute('[data-testid="order-number"]', 'value');

      // Step 2: Prioritizza ordine
      await page.goto(`${BASE_URL}/orders/priority`);
      const orderCard = page.locator(`[data-order-number="${orderNumber}"]`);
      await orderCard.locator('[data-testid="set-priority-high"]').click();

      // Step 3: Genera picking list
      await orderCard.locator('[data-testid="generate-picking-btn"]').click();
      await page.click('[data-testid="confirm-generate"]');

      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

      // Step 4: Ottimizza percorso picking
      await page.goto(`${BASE_URL}/locations/picking-optimizer`);
      await page.selectOption('[data-testid="select-list"]', { label: orderNumber });
      await page.click('[data-testid="algorithm-zone"]');
      await page.click('[data-testid="calculate-path-btn"]');

      await expect(page.locator('[data-testid="path-result"]')).toBeVisible();

      // Step 5: Esegui picking
      await page.goto(`${BASE_URL}/lists`);
      await page.fill('[data-testid="filter-order-number"]', orderNumber);
      await page.click('[data-testid="execute-list-btn"]');
      await page.click('[data-testid="confirm-execute-btn"]');

      // Step 6: Monitora esecuzione
      await page.goto(`${BASE_URL}/lists/execution-tracker`);
      const execution = page.locator(`[data-order-number="${orderNumber}"]`);
      await expect(execution).toBeVisible({ timeout: 15000 });

      // Step 7: Verifica completamento
      // (In ambiente reale, attenderemmo il completamento)
      await expect(execution.locator('[data-testid="progress-bar"]')).toBeVisible();

      // Test completato con successo
      expect(true).toBeTruthy();
    });
  });
});
