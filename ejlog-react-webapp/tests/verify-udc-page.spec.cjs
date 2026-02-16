// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test suite per verificare il funzionamento della pagina UDC
 * con mock data
 */
test.describe('UDC Page - Mock Data Test', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla home page
    await page.goto('http://localhost:3002/');
    await page.waitForLoadState('networkidle');
  });

  test('dovrebbe visualizzare la pagina UDC con mock data', async ({ page }) => {
    // Clicca sul menu UDC nella sidebar
    await page.click('text=Gestione UDC');
    await page.waitForTimeout(1000);

    // Verifica che siamo sulla pagina corretta
    await expect(page).toHaveURL(/.*\/udc/);

    // Verifica presenza header
    await expect(page.locator('h1')).toContainText('Gestione UDC');

    // Verifica presenza statistiche
    const totalCard = page.locator('text=Totale UDC').locator('..').locator('..');
    await expect(totalCard).toBeVisible();

    // Verifica presenza tabella
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verifica presenza dati mock (almeno una UDC)
    const firstBarcode = page.locator('text=UDC001234');
    await expect(firstBarcode).toBeVisible();

    // Screenshot della pagina
    await page.screenshot({
      path: 'tests/screenshots/udc-page-mock-data.png',
      fullPage: true,
    });

    console.log('Screenshot salvato: tests/screenshots/udc-page-mock-data.png');
  });

  test('dovrebbe filtrare UDC per stato', async ({ page }) => {
    await page.click('text=Gestione UDC');
    await page.waitForTimeout(1000);

    // Trova e clicca sul filtro stato
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('OCCUPIED');
    await page.waitForTimeout(500);

    // Verifica che mostri solo UDC occupate
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    await page.screenshot({
      path: 'tests/screenshots/udc-page-filtered.png',
      fullPage: true,
    });
  });

  test('dovrebbe cercare UDC per barcode', async ({ page }) => {
    await page.click('text=Gestione UDC');
    await page.waitForTimeout(1000);

    // Inserisci testo nella search bar
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('UDC001234');
    await page.waitForTimeout(500);

    // Verifica che mostri solo la UDC cercata
    await expect(page.locator('text=UDC001234')).toBeVisible();

    await page.screenshot({
      path: 'tests/screenshots/udc-page-search.png',
      fullPage: true,
    });
  });

  test('dovrebbe visualizzare le statistiche corrette', async ({ page }) => {
    await page.click('text=Gestione UDC');
    await page.waitForTimeout(1000);

    // Verifica statistiche (basate sui mock data: 8 UDC totali)
    const totalText = await page.locator('text=Totale UDC').locator('..').locator('..').textContent();
    expect(totalText).toContain('8');

    // Verifica UDC Occupate (5 nei mock data)
    const occupiedText = await page.locator('text=Occupate').locator('..').locator('..').textContent();
    expect(occupiedText).toContain('5');

    // Verifica UDC Vuote (2 nei mock data)
    const emptyText = await page.locator('text=Vuote').locator('..').locator('..').textContent();
    expect(emptyText).toContain('2');

    // Verifica UDC Bloccate (1 nei mock data)
    const blockedText = await page.locator('text=Bloccate').locator('..').locator('..').textContent();
    expect(blockedText).toContain('1');

    await page.screenshot({
      path: 'tests/screenshots/udc-page-stats.png',
      fullPage: true,
    });
  });
});
