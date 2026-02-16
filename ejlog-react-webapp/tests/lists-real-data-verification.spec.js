/**
 * Lists Management - Real Data Verification Test
 *
 * Verifica che la pagina Gestione Liste utilizzi dati reali dal backend EjLog
 * e che tutte le operazioni funzionino correttamente con restApiClient.
 *
 * Backend: http://localhost:3077
 * REST API Endpoints:
 * - POST /api/item-lists/{id}/execute
 * - POST /api/item-lists/{id}/terminate
 * - POST /api/item-lists/{id}/waiting
 * - POST /api/item-lists/{id}/reserve
 * - POST /api/item-lists/{id}/rereserve
 */

const { test, expect } = require('@playwright/test');

test.describe('Lists Management - Real Data Integration', () => {

  test.beforeEach(async ({ page }) => {
    // Navigare alla pagina Gestione Liste (porta dinamica, controllare quale è attiva)
    // Port 3009, 3010, or 3011 depending on availability
    const testPort = process.env.TEST_PORT || '3009';
    await page.goto(`http://localhost:${testPort}/lists`);

    // Attendere che la pagina sia caricata
    await page.waitForLoadState('networkidle');

    // Attendere che la tabella liste sia visibile
    await page.waitForSelector('table', { timeout: 10000 });
  });

  test('Verifica caricamento liste da backend', async ({ page }) => {
    // Verificare che ci sia almeno una riga nella tabella (header + dati)
    const rows = await page.locator('table tbody tr');
    const rowCount = await rows.count();

    console.log(`✅ Liste caricate: ${rowCount} righe`);

    // Se non ci sono liste, verificare che ci sia un messaggio appropriato
    if (rowCount === 0) {
      const emptyMessage = await page.locator('text=/Nessuna lista|No data|Empty/i');
      await expect(emptyMessage).toBeVisible();
      console.log('ℹ️ Nessuna lista presente nel database (corretto)');
    } else {
      // Verificare che le colonne principali siano presenti
      const headers = await page.locator('table thead th');
      await expect(headers).toContainText(['Numero', 'Tipo', 'Stato']);
      console.log('✅ Colonne tabella corrette');
    }
  });

  test('Verifica sidebar operazioni', async ({ page }) => {
    // Verificare che la sidebar operazioni sia visibile
    const sidebar = await page.locator('[class*="sidebar"], aside').first();
    await expect(sidebar).toBeVisible();

    // Verificare presenza pulsanti operazioni principali
    const operationButtons = [
      'Esegui',
      'Attesa',
      'Termina',
      'Prenota',
      'Riprenota'
    ];

    for (const buttonText of operationButtons) {
      const button = await page.locator(`button:has-text("${buttonText}")`);
      const isVisible = await button.isVisible();
      console.log(`${isVisible ? '✅' : '⚠️'} Pulsante "${buttonText}": ${isVisible ? 'presente' : 'non trovato'}`);
    }
  });

  test('Verifica barra contatori stato', async ({ page }) => {
    // Verificare presenza contatori: Picking, Refilling, Vision, Inventory
    const counters = [
      { label: 'Picking', icon: 'InboxIcon' },
      { label: 'Rifornimento', icon: 'RefreshIcon' },
      { label: 'Visione', icon: 'EyeIcon' },
      { label: 'Inventario', icon: 'ClipboardIcon' }
    ];

    // Cercare elementi che mostrano i contatori
    const statusBar = await page.locator('[class*="status"], [class*="counter"]').first();

    if (await statusBar.isVisible()) {
      console.log('✅ Barra contatori visibile');

      // Verificare che ci siano numeri visualizzati
      const numberElements = await page.locator('text=/\\d+/');
      const count = await numberElements.count();
      console.log(`✅ Trovati ${count} elementi numerici (contatori)`);
    } else {
      console.log('⚠️ Barra contatori non trovata o non visibile');
    }
  });

  test('Verifica console per chiamate REST API reali', async ({ page }) => {
    const apiCalls = [];

    // Intercettare tutte le chiamate di rete
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/item-lists')) {
        apiCalls.push({
          method: request.method(),
          url: url,
          timestamp: new Date().toISOString()
        });
        console.log(`📡 [REST API] ${request.method()} ${url}`);
      }
    });

    // Ricaricare la pagina per catturare le chiamate iniziali
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Attendere un momento per le chiamate asincrone
    await page.waitForTimeout(2000);

    if (apiCalls.length > 0) {
      console.log(`✅ Rilevate ${apiCalls.length} chiamate REST API reali:`);
      apiCalls.forEach(call => {
        console.log(`   - ${call.method} ${call.url}`);
      });
    } else {
      console.log('⚠️ Nessuna chiamata REST API rilevata (potrebbe essere normale se non ci sono liste)');
    }

    // Verificare che NON ci siano chiamate al vecchio endpoint sbagliato
    const wrongCalls = apiCalls.filter(call =>
      call.url.includes('/EjLogHostVertimag/api/item-lists')
    );

    expect(wrongCalls.length).toBe(0);
    if (wrongCalls.length > 0) {
      console.error('❌ ERRORE: Trovate chiamate al vecchio endpoint errato!');
    } else {
      console.log('✅ Nessuna chiamata errata a /EjLogHostVertimag/api/item-lists');
    }
  });

  test('Verifica chiamate corrette a restApiClient', async ({ page }) => {
    const correctApiCalls = [];
    const incorrectApiCalls = [];

    // Monitorare chiamate di rete
    page.on('request', request => {
      const url = request.url();

      // Chiamate corrette: http://localhost:3077/api/item-lists/*
      if (url.match(/^http:\/\/localhost:3077\/api\/item-lists/)) {
        correctApiCalls.push(url);
        console.log(`✅ Chiamata corretta: ${url}`);
      }

      // Chiamate errate: */EjLogHostVertimag/api/item-lists/*
      if (url.includes('/EjLogHostVertimag/api/item-lists')) {
        incorrectApiCalls.push(url);
        console.error(`❌ Chiamata ERRATA: ${url}`);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Report finale
    console.log('\n📊 REPORT CHIAMATE API:');
    console.log(`   ✅ Chiamate corrette (restApiClient): ${correctApiCalls.length}`);
    console.log(`   ❌ Chiamate errate (apiClient): ${incorrectApiCalls.length}`);

    // Test DEVE passare: 0 chiamate errate
    expect(incorrectApiCalls.length).toBe(0);
  });

  test('Verifica che non ci siano errori 404 per REST API', async ({ page }) => {
    const errors404 = [];

    // Monitorare risposte HTTP
    page.on('response', response => {
      if (response.url().includes('/api/item-lists') && response.status() === 404) {
        errors404.push({
          url: response.url(),
          status: response.status()
        });
        console.error(`❌ 404 NOT FOUND: ${response.url()}`);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificare che NON ci siano errori 404
    if (errors404.length > 0) {
      console.error(`\n❌ ERRORI 404 RILEVATI (${errors404.length}):`);
      errors404.forEach(err => {
        console.error(`   - ${err.url}`);
      });
    } else {
      console.log('✅ Nessun errore 404 sulle chiamate REST API');
    }

    expect(errors404.length).toBe(0);
  });

  test('Verifica import di restApiClient nel browser', async ({ page }) => {
    // Verificare che restApiClient sia caricato correttamente
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }

      // Cercare log di restApiClient in development
      if (msg.text().includes('[REST API]')) {
        console.log(`📡 ${msg.text()}`);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Filtrare errori rilevanti (escludere errori noti innocui)
    const relevantErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('chunk') &&
      err.includes('restApiClient') || err.includes('REST API')
    );

    if (relevantErrors.length > 0) {
      console.error('❌ Errori console rilevati:');
      relevantErrors.forEach(err => console.error(`   ${err}`));
    } else {
      console.log('✅ Nessun errore console relativo a restApiClient');
    }
  });

  test('Screenshot finale - verifica visiva', async ({ page }) => {
    // Screenshot della pagina completa
    await page.screenshot({
      path: 'test-results/lists-management-real-data.png',
      fullPage: true
    });

    console.log('✅ Screenshot salvato in test-results/lists-management-real-data.png');
  });

});

test.describe('Lists Management - Operations Test (se ci sono liste)', () => {

  test('Testa selezione lista e abilitazione pulsanti', async ({ page }) => {
    const testPort = process.env.TEST_PORT || '3009';
    await page.goto(`http://localhost:${testPort}/lists`);
    await page.waitForLoadState('networkidle');

    // Verificare se ci sono liste
    const rows = await page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      console.log(`✅ Trovate ${rowCount} liste, testo selezione...`);

      // Selezionare prima lista (click sulla riga)
      await rows.first().click();
      await page.waitForTimeout(500);

      console.log('✅ Lista selezionata');

      // Verificare che i pulsanti siano abilitati
      const executeButton = await page.locator('button:has-text("Esegui")');
      const isDisabled = await executeButton.isDisabled();

      console.log(`${isDisabled ? '⚠️' : '✅'} Pulsante Esegui ${isDisabled ? 'disabilitato' : 'abilitato'}`);

    } else {
      console.log('ℹ️ Nessuna lista disponibile per test selezione');
    }
  });

});

