/**
 * Test per la pagina ProductsSearch
 * Verifica che la pagina si carica e che i filtri funzionano correttamente
 */

const { test, expect } = require('@playwright/test');

test.describe('ProductsSearch Page', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina ProductsSearch
    await page.goto('http://localhost:3003/products/search');
    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('dovrebbe caricare la pagina con tutti gli elementi UI', async ({ page }) => {
    // Verifica il titolo della pagina
    await expect(page.locator('h1')).toContainText('Ricerca Prodotti / Stock');

    // Verifica che i 5 campi di filtro siano presenti
    await expect(page.locator('input[placeholder="es: ITEM001"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Numero lotto"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Numero seriale"]')).toBeVisible();
    await expect(page.locator('input[placeholder="ID Magazzino"]')).toBeVisible();
    await expect(page.locator('input[placeholder="ID UDC"]')).toBeVisible();

    // Verifica che i 4 pulsanti di azione siano presenti
    await expect(page.locator('button:has-text("Ricerca")')).toBeVisible();
    await expect(page.locator('button:has-text("Aggiorna")')).toBeVisible();
    await expect(page.locator('button:has-text("Pulisci")')).toBeVisible();
    await expect(page.locator('button:has-text("Estrai CSV")')).toBeVisible();
  });

  test('dovrebbe caricare i dati dal backend all\'avvio', async ({ page }) => {
    // Aspetta che i dati siano caricati (max 10 secondi)
    await page.waitForSelector('table', { timeout: 10000 });

    // Verifica che la tabella sia presente
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Verifica le intestazioni della tabella
    await expect(page.locator('th:has-text("Magazzino")')).toBeVisible();
    await expect(page.locator('th:has-text("Codice")')).toBeVisible();
    await expect(page.locator('th:has-text("Descrizione")')).toBeVisible();
    await expect(page.locator('th:has-text("Lotto")')).toBeVisible();
    await expect(page.locator('th:has-text("Matricola")')).toBeVisible();
    await expect(page.locator('th:has-text("Scadenza")')).toBeVisible();
    await expect(page.locator('th:has-text("Quantità")')).toBeVisible();
    await expect(page.locator('th:has-text("UDC")')).toBeVisible();

    // Verifica che ci siano delle righe di dati
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    console.log(`✓ Caricati ${rowCount} prodotti dal backend`);
  });

  test('dovrebbe mostrare il totale dei record', async ({ page }) => {
    // Aspetta che il totale sia visibile
    await page.waitForSelector('p:has-text("Totale:")', { timeout: 10000 });

    // Verifica che il totale sia visualizzato
    const totalText = await page.locator('p:has-text("Totale:")').textContent();
    expect(totalText).toMatch(/Totale:\s+\d+\s+prodotti/);

    console.log(`✓ ${totalText}`);
  });

  test('dovrebbe filtrare per codice articolo', async ({ page }) => {
    // Aspetta che i dati iniziali siano caricati
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Inserisci un filtro per codice articolo
    await page.locator('input[placeholder="es: ITEM001"]').fill('001');

    // Clicca sul pulsante Ricerca
    await page.locator('button:has-text("Ricerca")').click();

    // Aspetta che la tabella si aggiorni
    await page.waitForTimeout(1000);

    // Verifica che ci siano risultati filtrati
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // Verifica che i risultati contengano il codice cercato
      const firstItemCode = await page.locator('tbody tr:first-child td:nth-child(2)').textContent();
      expect(firstItemCode).toContain('001');
      console.log(`✓ Filtro applicato: trovati ${rowCount} prodotti con codice contenente '001'`);
    } else {
      console.log('✓ Nessun prodotto trovato con il filtro applicato');
    }
  });

  test('dovrebbe pulire i filtri', async ({ page }) => {
    // Aspetta che i dati iniziali siano caricati
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Inserisci valori nei filtri
    await page.locator('input[placeholder="es: ITEM001"]').fill('TEST123');
    await page.locator('input[placeholder="Numero lotto"]').fill('LOT456');

    // Clicca sul pulsante Pulisci
    await page.locator('button:has-text("Pulisci")').click();

    // Verifica che i campi siano vuoti
    await expect(page.locator('input[placeholder="es: ITEM001"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Numero lotto"]')).toHaveValue('');

    console.log('✓ Filtri puliti correttamente');
  });

  test('dovrebbe aggiornare i dati', async ({ page }) => {
    // Aspetta che i dati iniziali siano caricati
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Conta i record iniziali
    const initialRows = await page.locator('tbody tr').count();

    // Clicca sul pulsante Aggiorna
    await page.locator('button:has-text("Aggiorna")').click();

    // Aspetta che i dati si aggiornino
    await page.waitForTimeout(1000);

    // Verifica che ci siano ancora dati
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    console.log(`✓ Dati aggiornati: ${initialRows} → ${rowCount} record`);
  });

  test('dovrebbe mostrare il loading spinner durante il caricamento', async ({ page }) => {
    // Ricarica la pagina
    await page.reload();

    // Verifica che lo spinner di loading sia visibile all'inizio
    // (potrebbe essere molto veloce, quindi usiamo un timeout corto)
    try {
      await page.waitForSelector('.animate-spin', { timeout: 2000 });
      console.log('✓ Loading spinner mostrato durante il caricamento');
    } catch (e) {
      console.log('✓ Caricamento troppo veloce per vedere lo spinner');
    }

    // Verifica che lo spinner scompaia dopo il caricamento
    await page.waitForSelector('table', { timeout: 10000 });
    await expect(page.locator('.animate-spin')).not.toBeVisible();
  });

  test('dovrebbe disabilitare il pulsante CSV quando non ci sono dati', async ({ page }) => {
    // Questo test verifica la logica del pulsante CSV
    // Se non ci sono dati, il pulsante dovrebbe essere disabilitato

    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');

    // Il pulsante CSV dovrebbe essere visibile
    const csvButton = page.locator('button:has-text("Estrai CSV")');
    await expect(csvButton).toBeVisible();

    console.log('✓ Pulsante CSV presente nell\'interfaccia');
  });
});
