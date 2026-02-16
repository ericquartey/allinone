import { test, expect } from '@playwright/test';

test.describe('Stock Page - Functional Test with Real Data', () => {
  test('should search stock by warehouse and display results', async ({ page }) => {
    // Intercetta chiamate API
    const apiCalls: { url: string, status: number }[] = [];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('Stock') || url.includes('stock')) {
        apiCalls.push({ url, status: response.status() });
        console.log(`[API-STOCK] ${response.status()} - ${url}`);
      }
    });

    // Vai alla pagina Stock
    await page.goto('http://localhost:8080/stock');
    await page.waitForLoadState('networkidle');

    console.log('=== STEP 1: Pagina caricata ===');

    // Verifica elementi iniziali
    await expect(page.locator('h4:has-text("Giacenze Magazzino")')).toBeVisible();
    await expect(page.locator('text=Filtri di Ricerca')).toBeVisible();

    // Screenshot iniziale
    await page.screenshot({ path: 'tests/e2e/screenshots/stock-01-initial.png', fullPage: true });

    console.log('=== STEP 2: Compilazione filtro ID Magazzino ===');

    // Compila il filtro ID Magazzino = 1
    const warehouseInput = page.locator('input[type="number"]').filter({ hasText: '' }).first();
    await warehouseInput.fill('1');

    // Screenshot con filtro compilato
    await page.screenshot({ path: 'tests/e2e/screenshots/stock-02-filter-filled.png', fullPage: true });

    console.log('=== STEP 3: Click su pulsante Cerca ===');

    // Click su "Cerca"
    await page.locator('button:has-text("Cerca")').first().click();

    // Aspetta che la chiamata API completi
    await page.waitForTimeout(3000);

    console.log('=== STEP 4: Verifica risultati ===');
    console.log('API Calls:', apiCalls);

    // Screenshot dopo ricerca
    await page.screenshot({ path: 'tests/e2e/screenshots/stock-03-results.png', fullPage: true });

    // Verifica che ci sia stata almeno una chiamata all'API Stock
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0].status).toBe(200);

    // Verifica presenza tabella con dati
    const tableRows = await page.locator('tbody tr').count();
    console.log(`Righe tabella trovate: ${tableRows}`);

    // Deve esserci almeno 1 riga di dati (non il messaggio vuoto)
    expect(tableRows).toBeGreaterThan(0);

    // Verifica presenza dati nelle celle
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.locator('td').nth(0)).not.toHaveText('-'); // Codice articolo

    console.log('=== TEST COMPLETATO CON SUCCESSO ===');
  });

  test('should show empty state when no results found', async ({ page }) => {
    await page.goto('http://localhost:8080/stock');
    await page.waitForLoadState('networkidle');

    // Cerca con ID Magazzino inesistente
    const warehouseInput = page.locator('input[placeholder*="Es: 1"]');
    await warehouseInput.fill('99999');

    await page.locator('button:has-text("Cerca")').first().click();
    await page.waitForTimeout(2000);

    // Verifica messaggio "Nessuna giacenza trovata"
    await expect(page.locator('text=Nessuna giacenza trovata')).toBeVisible();

    await page.screenshot({ path: 'tests/e2e/screenshots/stock-04-empty-state.png', fullPage: true });
  });

  test('should clear filters correctly', async ({ page }) => {
    await page.goto('http://localhost:8080/stock');
    await page.waitForLoadState('networkidle');

    // Compila più filtri
    await page.locator('input[placeholder*="ART001"]').fill('TEST123');
    await page.locator('input[placeholder*="Es: 1"]').fill('1');

    // Verifica contatore filtri attivi
    await expect(page.locator('text=/\\d+ filtri attivi/')).toBeVisible();

    // Click su pulisci filtri
    await page.locator('button[aria-label*="Pulisci"]').click();

    // Verifica che i campi siano vuoti
    await expect(page.locator('input[placeholder*="ART001"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="Es: 1"]')).toHaveValue('');

    await page.screenshot({ path: 'tests/e2e/screenshots/stock-05-cleared.png', fullPage: true });
  });
});
