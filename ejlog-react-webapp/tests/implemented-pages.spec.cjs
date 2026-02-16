// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test Suite per le pagine implementate con dati reali
 * Verifica che le 5 pagine completate funzionino correttamente
 */

const BASE_URL = 'http://localhost:3009';

test.describe('Implemented Pages with Real Data', () => {
  test.beforeEach(async ({ page }) => {
    // Attendi che la pagina sia completamente caricata
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  });

  test('Dashboard should load with real KPIs', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Verifica titolo pagina (secondo h1 nella pagina)
    await expect(page.locator('h1').nth(1)).toContainText('Dashboard');

    // Verifica indicatore backend connesso
    await expect(page.locator('text=Backend Connesso')).toBeVisible();

    // Verifica presenza card statistiche
    await expect(page.locator('text=Articoli Totali')).toBeVisible();
    await expect(page.locator('text=Liste Totali')).toBeVisible();
    await expect(page.locator('text=Giacenze Totali')).toBeVisible();
    await expect(page.locator('text=Sotto Soglia')).toBeVisible();

    // Verifica presenza grafico
    await expect(page.locator('text=Distribuzione Giacenze per Categoria')).toBeVisible();

    console.log('✓ Dashboard caricata con successo');
  });

  test('Items Page should load with real data', async ({ page }) => {
    await page.goto(`${BASE_URL}/items`, { waitUntil: 'networkidle' });

    // Verifica titolo (secondo h1 nella pagina)
    await expect(page.locator('h1').nth(1)).toContainText('Gestione Articoli');

    // Verifica indicatore backend
    await expect(page.locator('text=Backend Connesso')).toBeVisible();

    // Verifica presenza tabella
    await expect(page.locator('text=Codice')).toBeVisible();
    await expect(page.locator('text=Descrizione')).toBeVisible();
    await expect(page.locator('text=Giacenza')).toBeVisible();

    // Verifica presenza filtri
    await expect(page.locator('input[placeholder*="Codice"]')).toBeVisible();

    // Verifica presenza stats cards
    await expect(page.locator('text=Articoli Totali')).toBeVisible();

    console.log('✓ Items Page caricata con successo');
  });

  test('Lists Page should load with real data', async ({ page }) => {
    await page.goto(`${BASE_URL}/lists`, { waitUntil: 'networkidle' });

    // Verifica titolo (secondo h1 nella pagina)
    await expect(page.locator('h1').nth(1)).toContainText('Gestione Liste');

    // Verifica indicatore backend
    await expect(page.locator('text=Backend Connesso')).toBeVisible();

    // Verifica presenza tabella
    await expect(page.locator('text=Numero Lista')).toBeVisible();
    await expect(page.locator('text=Tipo')).toBeVisible();
    await expect(page.locator('text=Stato')).toBeVisible();

    // Verifica presenza stats
    await expect(page.locator('text=Liste Totali')).toBeVisible();
    await expect(page.locator('text=In Corso')).toBeVisible();

    console.log('✓ Lists Page caricata con successo');
  });

  test('Stock Page should load with real data', async ({ page }) => {
    await page.goto(`${BASE_URL}/stock`, { waitUntil: 'networkidle' });

    // Verifica titolo (secondo h1 nella pagina)
    await expect(page.locator('h1').nth(1)).toContainText('Gestione Giacenze');

    // Verifica indicatore backend
    await expect(page.locator('text=Backend Connesso')).toBeVisible();

    // Verifica presenza tabella
    await expect(page.locator('text=Codice')).toBeVisible();
    await expect(page.locator('text=Giacenza')).toBeVisible();
    await expect(page.locator('text=Soglia')).toBeVisible();

    // Verifica presenza filtri
    await expect(page.locator('input[placeholder*="Cerca"]')).toBeVisible();

    // Verifica stats
    await expect(page.locator('text=Giacenze Totali')).toBeVisible();

    console.log('✓ Stock Page caricata con successo');
  });

  test('Movements Page should load with real data', async ({ page }) => {
    await page.goto(`${BASE_URL}/movements`, { waitUntil: 'networkidle' });

    // Verifica titolo (secondo h1 nella pagina)
    await expect(page.locator('h1').nth(1)).toContainText('Movimenti di Magazzino');

    // Verifica indicatore backend
    await expect(page.locator('text=Backend Connesso')).toBeVisible();

    // Verifica presenza tabella
    await expect(page.locator('text=Data')).toBeVisible();
    await expect(page.locator('text=Codice Articolo')).toBeVisible();
    await expect(page.locator('text=Quantità')).toBeVisible();
    await expect(page.locator('text=Tipo Movimento')).toBeVisible();

    // Verifica presence filtri
    await expect(page.locator('label:has-text("Data Da")')).toBeVisible();
    await expect(page.locator('label:has-text("Data A")')).toBeVisible();

    // Verifica stats cards
    await expect(page.locator('text=Movimenti Totali')).toBeVisible();
    await expect(page.locator('text=Carichi')).toBeVisible();
    await expect(page.locator('text=Scarichi')).toBeVisible();

    console.log('✓ Movements Page caricata con successo');
  });

  test('Sidebar navigation should have all links', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Verifica presenza link nel menu
    await expect(page.locator('a[href="/"]')).toBeVisible();
    await expect(page.locator('a[href="/items"]')).toBeVisible();
    await expect(page.locator('a[href="/lists"]')).toBeVisible();
    await expect(page.locator('a[href="/stock"]')).toBeVisible();
    await expect(page.locator('a[href="/movements"]')).toBeVisible();

    console.log('✓ Tutti i link nel sidebar sono presenti');
  });

  test('Navigation between pages should work', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Test navigazione a Items
    await page.click('a[href="/items"]');
    await expect(page).toHaveURL(`${BASE_URL}/items`);
    await expect(page.locator('h1').nth(1)).toContainText('Gestione Articoli');

    // Test navigazione a Lists
    await page.click('a[href="/lists"]');
    await expect(page).toHaveURL(`${BASE_URL}/lists`);
    await expect(page.locator('h1').nth(1)).toContainText('Gestione Liste');

    // Test navigazione a Stock
    await page.click('a[href="/stock"]');
    await expect(page).toHaveURL(`${BASE_URL}/stock`);
    await expect(page.locator('h1').nth(1)).toContainText('Gestione Giacenze');

    // Test navigazione a Movements
    await page.click('a[href="/movements"]');
    await expect(page).toHaveURL(`${BASE_URL}/movements`);
    await expect(page.locator('h1').nth(1)).toContainText('Movimenti di Magazzino');

    // Test navigazione a Dashboard
    await page.click('a[href="/"]');
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.locator('h1').nth(1)).toContainText('Dashboard');

    console.log('✓ Navigazione tra pagine funzionante');
  });

  test('All pages should have Backend Connesso indicator', async ({ page }) => {
    const pages = [
      { url: '/', name: 'Dashboard' },
      { url: '/items', name: 'Items' },
      { url: '/lists', name: 'Lists' },
      { url: '/stock', name: 'Stock' },
      { url: '/movements', name: 'Movements' }
    ];

    for (const testPage of pages) {
      await page.goto(`${BASE_URL}${testPage.url}`, { waitUntil: 'networkidle' });
      await expect(page.locator('text=Backend Connesso')).toBeVisible();
      console.log(`✓ ${testPage.name}: Backend indicator presente`);
    }
  });
});
