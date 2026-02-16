// ============================================================================
// Test E2E: Verifica che la pagina ProductsPageReal mostri i dati nelle colonne
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('ProductsPageReal - Data Display', () => {

  test('should display product data in table columns', async ({ page }) => {
    // Naviga alla pagina prodotti
    await page.goto('/products');

    // Attendi che la tabella carichi i dati
    await page.waitForSelector('[data-testid="products-grid"]', { timeout: 30000 });

    // Attendi che ci siano righe nella tabella
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Verifica che ci siano righe
    const rows = await page.locator('table tbody tr').count();
    console.log(`Found ${rows} rows in the table`);
    expect(rows).toBeGreaterThan(0);

    // Prendi la prima riga
    const firstRow = page.locator('table tbody tr').first();

    // Verifica che le celle abbiano contenuto
    const cells = firstRow.locator('td');
    const cellCount = await cells.count();
    console.log(`Found ${cellCount} cells in first row`);

    // Estrai il testo di ogni cella
    for (let i = 0; i < cellCount; i++) {
      const cellText = await cells.nth(i).innerText();
      console.log(`Cell ${i}: "${cellText}"`);
    }

    // Verifica che la colonna CODICE abbia dati (prima colonna)
    const codeCell = cells.first();
    const codeText = await codeCell.innerText();
    console.log(`\nCode cell text: "${codeText}"`);
    expect(codeText.trim()).not.toBe('');
    expect(codeText.trim()).not.toBe('-');

    // Verifica che la colonna DESCRIZIONE abbia dati (seconda colonna)
    const descriptionCell = cells.nth(1);
    const descriptionText = await descriptionCell.innerText();
    console.log(`Description cell text: "${descriptionText}"`);
    expect(descriptionText.trim()).not.toBe('');
    expect(descriptionText.trim()).not.toBe('-');

    // Verifica che la colonna GIACENZA abbia dati (quinta colonna circa)
    const stockCells = await cells.all();
    let foundStockData = false;
    for (const cell of stockCells) {
      const text = await cell.innerText();
      if (text.match(/\d+\.\d{2}/)) {
        console.log(`Found stock data: "${text}"`);
        foundStockData = true;
        break;
      }
    }
    expect(foundStockData).toBe(true);

    console.log('\n✅ All column data checks passed!');
  });

  test('should display correct product codes in first column', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Prendi i primi 5 codici prodotto dalla tabella
    const codeButtons = page.locator('table tbody tr td:first-child button');
    const count = Math.min(await codeButtons.count(), 5);

    console.log(`\nProduct codes in table:`);
    for (let i = 0; i < count; i++) {
      const code = await codeButtons.nth(i).innerText();
      console.log(`  ${i + 1}. ${code}`);

      // Verifica che il codice non sia vuoto
      expect(code.trim()).not.toBe('');
      expect(code.trim().length).toBeGreaterThan(0);
    }
  });

  test('should display descriptions in second column', async ({ page }) => {
    await page.goto('/products');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Prendi le prime 5 descrizioni dalla tabella
    const descriptionCells = page.locator('table tbody tr td:nth-child(2) span');
    const count = Math.min(await descriptionCells.count(), 5);

    console.log(`\nProduct descriptions in table:`);
    for (let i = 0; i < count; i++) {
      const description = await descriptionCells.nth(i).innerText();
      console.log(`  ${i + 1}. ${description}`);

      // Verifica che la descrizione non sia vuota
      expect(description.trim()).not.toBe('');
      expect(description.trim().length).toBeGreaterThan(0);
    }
  });

  test('should transform backend data correctly', async ({ page, request }) => {
    // Chiama direttamente l'API backend
    const backendResponse = await request.get('http://localhost:3077/EjLogHostVertimag/Stock', {
      params: { limit: 1, skip: 0 },
    });

    const backendData = await backendResponse.json();
    const firstBackendProduct = backendData.exported[0];

    console.log('\nBackend product structure:');
    console.log('  item:', firstBackendProduct.item, '(type:', typeof firstBackendProduct.item, ')');
    console.log('  description:', firstBackendProduct.description);
    console.log('  qty:', firstBackendProduct.qty);

    // Naviga alla pagina e verifica che i dati trasformati siano corretti
    await page.goto('/products');
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRowCode = await page.locator('table tbody tr td:first-child button').first().innerText();
    const firstRowDescription = await page.locator('table tbody tr td:nth-child(2) span').first().innerText();

    console.log('\nFrontend table first row:');
    console.log('  Code:', firstRowCode);
    console.log('  Description:', firstRowDescription);

    // Verifica che il codice dal backend corrisponda al codice nella tabella
    // (Potrebbero essere in ordine diverso, ma almeno uno deve matchare)
    const allCodes = await page.locator('table tbody tr td:first-child button').allInnerTexts();
    const backendCode = firstBackendProduct.item;

    console.log('\nAll codes in table:', allCodes.slice(0, 10));
    console.log('Expected backend code:', backendCode);

    // Il codice dal backend dovrebbe apparire da qualche parte nella tabella
    const codeFound = allCodes.some(code => code.trim() === backendCode);
    expect(codeFound).toBe(true);

    console.log('\n✅ Backend data transformation is working correctly!');
  });

});

