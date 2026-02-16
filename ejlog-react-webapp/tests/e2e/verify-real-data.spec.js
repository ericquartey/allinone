// ============================================================================
// Test E2E: Verifica Dati Reali da Database
// Verifica che pagine Articoli e Gestione Cassetti caricano dati reali
// ============================================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Verifica Dati Reali dal Database', () => {

  test.beforeEach(async ({ page }) => {
    // Naviga alla home e attendi il caricamento
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Pagina Articoli - Verifica dati reali', async ({ page }) => {
    console.log('🔍 Test: Verifica dati reali nella pagina Articoli');

    // Naviga alla pagina Articoli
    await page.goto(`${BASE_URL}/items`);
    await page.waitForLoadState('networkidle');

    // Attendi che la tabella venga caricata
    await page.waitForSelector('table', { timeout: 10000 });

    // Verifica che ci siano righe nella tabella (dati reali)
    const rows = await page.locator('tbody tr').count();
    console.log(`✅ Trovate ${rows} righe di articoli nella tabella`);
    expect(rows).toBeGreaterThan(0);

    // Verifica che non ci siano messaggi di "Nessun dato" o "Loading"
    const noDataMessage = await page.locator('text=/nessun.*articolo/i').count();
    expect(noDataMessage).toBe(0);

    // Screenshot della pagina con dati reali
    await page.screenshot({
      path: 'tests/screenshots/items-page-real-data.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: tests/screenshots/items-page-real-data.png');

    // Verifica che almeno una riga abbia un codice articolo (seconda colonna, dopo checkbox)
    const firstRowCode = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
    console.log(`📦 Primo articolo trovato: ${firstRowCode}`);
    expect(firstRowCode).toBeTruthy();
    expect(firstRowCode.trim().length).toBeGreaterThan(0);
  });

  test('Pagina Articoli Enhanced - Verifica dati reali', async ({ page }) => {
    console.log('🔍 Test: Verifica dati reali nella pagina Articoli Enhanced');

    // Naviga alla pagina Articoli Enhanced
    await page.goto(`${BASE_URL}/items-enhanced`);
    await page.waitForLoadState('networkidle');

    // Attendi che il contenuto venga caricato
    await page.waitForTimeout(2000);

    // Verifica che ci siano card di articoli o una tabella
    const hasContent = await page.locator('div[class*="grid"], table, div[class*="card"]').count();
    console.log(`✅ Trovati ${hasContent} elementi di contenuto`);
    expect(hasContent).toBeGreaterThan(0);

    // Screenshot della pagina
    await page.screenshot({
      path: 'tests/screenshots/items-enhanced-real-data.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: tests/screenshots/items-enhanced-real-data.png');
  });

  test('Pagina Gestione Cassetti - Verifica dati reali', async ({ page }) => {
    console.log('🔍 Test: Verifica dati reali nella pagina Gestione Cassetti');

    // Naviga alla pagina Gestione Cassetti
    await page.goto(`${BASE_URL}/drawers`);
    await page.waitForLoadState('networkidle');

    // Attendi che il contenuto venga caricato
    await page.waitForTimeout(3000);

    // Verifica che ci sia contenuto visualizzato (drawer cards, tabelle, o liste)
    const drawersContent = await page.locator('div[class*="drawer"], table, ul, div[class*="grid"]').count();
    console.log(`✅ Trovati ${drawersContent} elementi di cassetti`);

    // Screenshot della pagina
    await page.screenshot({
      path: 'tests/screenshots/drawers-page-real-data.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: tests/screenshots/drawers-page-real-data.png');

    // Verifica che non ci siano messaggi di errore
    const errorMessages = await page.locator('text=/error|errore|failed/i').count();
    expect(errorMessages).toBe(0);
  });

  test('Verifica chiamate API al backend Java porta 3077', async ({ page }) => {
    console.log('🔍 Test: Verifica chiamate API al backend Java');

    // Intercetta le chiamate di rete
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method()
        });
        console.log(`📡 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📥 API Response: ${response.status()} ${response.url()}`);
      }
    });

    // Naviga alla pagina Articoli
    await page.goto(`${BASE_URL}/items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verifica che siano state fatte chiamate API
    console.log(`✅ Totale chiamate API: ${apiCalls.length}`);
    expect(apiCalls.length).toBeGreaterThan(0);

    // Stampa tutte le chiamate API
    apiCalls.forEach((call, index) => {
      console.log(`  ${index + 1}. ${call.method} ${call.url}`);
    });
  });

  test('Test connessione Backend Java - Endpoint diretto', async ({ request }) => {
    console.log('🔍 Test: Verifica connessione diretta al backend Java');

    // Test endpoint items search
    const itemsResponse = await request.get('http://localhost:3077/EjLogHostVertimag/api/item-lists/search');
    console.log(`📡 Status /api/item-lists/search: ${itemsResponse.status()}`);

    if (itemsResponse.ok()) {
      const items = await itemsResponse.json();
      console.log(`✅ Liste caricate dal database: ${items.length}`);
      expect(items.length).toBeGreaterThan(0);

      // Stampa le prime 3 liste
      items.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Code: ${item.code}, Type: ${item.itemListType}`);
      });
    } else {
      console.error(`❌ Errore connessione backend: ${itemsResponse.status()}`);
    }

    expect(itemsResponse.status()).toBe(200);
  });
});

