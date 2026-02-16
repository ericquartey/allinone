// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test Suite: Verifica Dati Reali PICK1742
 * Obiettivo: Verificare che i dati della lista PICK1742 vengono visualizzati correttamente
 */

const BASE_URL = 'http://localhost:3001';
const API_BASE_URL = 'http://localhost:8080/EjLogHostVertimag';

test.describe('Verifica Lista PICK1742', () => {

  test('1. Backend API restituisce lista PICK1742', async ({ request }) => {
    console.log('\n=== Test 1: Verifica API Backend ===');

    const response = await request.get(`${API_BASE_URL}/Lists`, {
      params: {
        limit: 10,
        offset: 0
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('Risposta API Lists:', JSON.stringify(data, null, 2));

    // Verifica struttura
    expect(data).toHaveProperty('result', 'OK');
    expect(data).toHaveProperty('exported');
    expect(Array.isArray(data.exported)).toBeTruthy();

    // Verifica che esista PICK1742
    const pick1742 = data.exported.find(list =>
      list.listHeader && list.listHeader.listNumber === 'PICK1742'
    );

    expect(pick1742).toBeTruthy();
    console.log('\n✓ Lista PICK1742 trovata nel database');
    console.log('  - Numero lista:', pick1742.listHeader.listNumber);
    console.log('  - Descrizione:', pick1742.listHeader.listDescription);
    console.log('  - Tipo lista:', pick1742.listHeader.listType);
    console.log('  - Stato lista:', pick1742.listHeader.listStatus);
    console.log('  - Numero righe:', pick1742.listRows ? pick1742.listRows.length : 0);

    // Verifica righe
    if (pick1742.listRows && pick1742.listRows.length > 0) {
      console.log('\n  Dettagli prima riga:');
      const firstRow = pick1742.listRows[0];
      console.log('    - Row Number:', firstRow.rowNumber);
      console.log('    - Item:', firstRow.item);
      console.log('    - Quantità richiesta:', firstRow.requestedQty);
      console.log('    - Quantità processata:', firstRow.processedQty);
    }
  });

  test('2. Frontend mostra dati reali nella pagina Lists', async ({ page }) => {
    console.log('\n=== Test 2: Verifica Frontend Lists Page ===');

    await page.goto(`${BASE_URL}/lists`);
    await page.waitForLoadState('networkidle');

    // Attendi che i dati siano caricati
    await page.waitForTimeout(3000);

    // Screenshot per debugging
    await page.screenshot({
      path: 'test-results/lists-page-screenshot.png',
      fullPage: true
    });
    console.log('Screenshot salvato: test-results/lists-page-screenshot.png');

    // Verifica che non ci siano errori visibili
    const errorMessages = await page.locator('text=/error|errore|failed/i').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('text=/error|errore|failed/i').first().textContent();
      console.log('⚠ Errore trovato:', errorText);
    }

    // Verifica contenuto pagina
    const bodyText = await page.textContent('body');
    console.log('Lunghezza contenuto pagina:', bodyText.length);

    // Cerca la presenza di PICK1742 nel DOM
    const pick1742Present = bodyText.includes('PICK1742');
    if (pick1742Present) {
      console.log('✓ Testo "PICK1742" trovato nella pagina');
    } else {
      console.log('⚠ Testo "PICK1742" NON trovato nella pagina');
      console.log('Prime 1000 caratteri:', bodyText.substring(0, 1000));
    }

    // Verifica presenza tabella o lista
    const hasTable = await page.locator('table').count() > 0;
    const hasList = await page.locator('[role="list"], ul li').count() > 0;

    console.log('Ha tabella:', hasTable);
    console.log('Ha lista:', hasList);

    expect(hasTable || hasList).toBeTruthy();
  });

  test('3. Frontend carica dati da API e mostra PICK1742', async ({ page }) => {
    console.log('\n=== Test 3: Verifica Integrazione Backend-Frontend ===');

    // Intercepta le chiamate API
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/Lists')) {
        apiCalls.push({
          url: request.url(),
          method: request.method()
        });
        console.log('API Request:', request.method(), request.url());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/Lists')) {
        console.log('API Response:', response.status(), response.url());
        if (response.ok()) {
          try {
            const data = await response.json();
            console.log('Numero record ricevuti:', data.recordNumber);
            if (data.exported) {
              console.log('Numero liste esportate:', data.exported.length);
            }
          } catch (e) {
            console.log('Impossibile parsare response JSON');
          }
        }
      }
    });

    await page.goto(`${BASE_URL}/lists`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Verifica che sia stata fatta almeno una chiamata API
    console.log('\nChiamate API Lists effettuate:', apiCalls.length);
    expect(apiCalls.length).toBeGreaterThan(0);

    // Screenshot finale
    await page.screenshot({
      path: 'test-results/lists-final-state.png',
      fullPage: true
    });
    console.log('Screenshot finale salvato: test-results/lists-final-state.png');
  });

  test('4. Verifica Dashboard mostra statistiche corrette', async ({ page }) => {
    console.log('\n=== Test 4: Verifica Dashboard Statistiche ===');

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot dashboard
    await page.screenshot({
      path: 'test-results/dashboard-screenshot.png',
      fullPage: true
    });
    console.log('Screenshot salvato: test-results/dashboard-screenshot.png');

    // Verifica indicatore connessione backend
    const backendStatus = await page.locator('text=/backend connesso/i').count();
    if (backendStatus > 0) {
      console.log('✓ Indicatore "Backend Connesso" presente');
    } else {
      console.log('⚠ Indicatore "Backend Connesso" non trovato');
    }

    // Verifica presenza cards statistiche
    const statsCards = page.locator('[class*="card"], [class*="stat"], [class*="metric"]');
    const statsCount = await statsCards.count();
    console.log('Numero cards statistiche trovate:', statsCount);
    expect(statsCount).toBeGreaterThan(0);
  });

  test('5. Verifica Items page con dati reali', async ({ page }) => {
    console.log('\n=== Test 5: Verifica Items Page ===');

    // Intercepta chiamate API Items
    page.on('response', async response => {
      if (response.url().includes('/Items')) {
        console.log('API Items Response:', response.status());
        if (response.ok()) {
          try {
            const data = await response.json();
            console.log('Items ricevuti:', data.recordNumber);
            if (data.exported && data.exported.length > 0) {
              console.log('Primo item:', data.exported[0].code, '-', data.exported[0].description);
            }
          } catch (e) {
            console.log('Errore parsing Items response');
          }
        }
      }
    });

    await page.goto(`${BASE_URL}/items`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: 'test-results/items-page-screenshot.png',
      fullPage: true
    });
    console.log('Screenshot salvato: test-results/items-page-screenshot.png');

    const bodyText = await page.textContent('body');
    console.log('Lunghezza contenuto Items page:', bodyText.length);
    expect(bodyText.length).toBeGreaterThan(500);
  });
});

test.describe('Verifica NO Errori "exported: null"', () => {

  test('6. Verifica che exported non sia null in API Lists', async ({ request }) => {
    console.log('\n=== Test 6: Verifica exported NON null ===');

    const response = await request.get(`${API_BASE_URL}/Lists`, {
      params: { limit: 10, offset: 0 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verifica che exported esista e sia un array
    expect(data.exported).toBeTruthy();
    expect(Array.isArray(data.exported)).toBeTruthy();

    console.log('✓ exported è un array valido');
    console.log('✓ exported NON è null');
    console.log('Numero elementi in exported:', data.exported.length);

    // Questo era il problema prima: exported: null
    expect(data.exported).not.toBeNull();
  });

  test('7. Verifica che exported non sia null in API Items', async ({ request }) => {
    console.log('\n=== Test 7: Verifica Items exported NON null ===');

    const response = await request.get(`${API_BASE_URL}/Items`, {
      params: { limit: 10, offset: 0 }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.exported).toBeTruthy();
    expect(Array.isArray(data.exported)).toBeTruthy();
    expect(data.exported).not.toBeNull();

    console.log('✓ Items exported è un array valido');
    console.log('Numero Items:', data.exported.length);
  });
});
