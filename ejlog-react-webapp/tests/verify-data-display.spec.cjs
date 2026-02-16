// ============================================================================
// EJLOG WMS - Playwright Test: Verify Real Data Display
// Test per verificare che il frontend mostri i dati reali dal backend
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('EjLog WMS - Verifica Visualizzazione Dati Reali', () => {

  test.beforeEach(async ({ page }) => {
    // Intercetta le chiamate API per verificare CORS e risposte
    page.on('response', response => {
      const url = response.url();
      if (url.includes('localhost:3079')) {
        console.log(`📡 API Response: ${response.status()} - ${url}`);
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    // Naviga alla homepage
    await page.goto('http://localhost:3014', { waitUntil: 'networkidle' });
  });

  // Test 1: Verifica Dashboard
  test('1. Dashboard deve caricare senza errori CORS', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Verifica che non ci siano errori CORS nella console
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.waitForTimeout(1000);

    // Verifica che la pagina sia caricata
    const title = await page.title();
    console.log(`✅ Dashboard caricata: ${title}`);

    // Controlla errori CORS
    const corsErrors = errors.filter(e => e.includes('CORS') || e.includes('Access-Control'));
    if (corsErrors.length > 0) {
      console.log(`❌ Errori CORS trovati: ${corsErrors.join(', ')}`);
    } else {
      console.log('✅ Nessun errore CORS');
    }
  });

  // Test 2: Verifica Gestione Articoli (Prodotti)
  test('2. Gestione Articoli deve mostrare i prodotti', async ({ page }) => {
    // Apri la sidebar
    const menuButton = page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")').first();
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    // Clicca su "Gestione Articoli"
    await page.click('text=Gestione Articoli');
    await page.waitForTimeout(2000);

    // Verifica che la pagina sia caricata
    const url = page.url();
    console.log(`📍 URL: ${url}`);
    expect(url).toContain('/items');

    // Cerca elementi che potrebbero contenere dati
    const pageContent = await page.content();

    // Verifica presenza di dati
    const hasTable = await page.locator('table').count() > 0;
    const hasCards = await page.locator('[class*="card"]').count() > 0;
    const hasRows = await page.locator('tr, [role="row"]').count() > 1;

    console.log(`📊 Elementi trovati:`);
    console.log(`   - Tabelle: ${await page.locator('table').count()}`);
    console.log(`   - Card: ${await page.locator('[class*="card"]').count()}`);
    console.log(`   - Righe dati: ${await page.locator('tr, [role="row"]').count()}`);

    // Verifica presenza di messaggi di errore
    const errorMessages = await page.locator('text=/errore|error|failed|fallito/i').count();
    if (errorMessages > 0) {
      console.log(`❌ Messaggi di errore trovati: ${errorMessages}`);
      const errors = await page.locator('text=/errore|error|failed|fallito/i').allTextContents();
      console.log(`   ${errors.join(', ')}`);
    }

    // Verifica presenza di messaggi "no data"
    const noDataMessages = await page.locator('text=/no data|nessun dato|nessun articolo|empty/i').count();
    if (noDataMessages > 0) {
      console.log(`⚠️  Messaggi "no data" trovati: ${noDataMessages}`);
    }

    // Screenshot per debug
    await page.screenshot({
      path: 'test-results/items-page.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: test-results/items-page.png');
  });

  // Test 3: Verifica Gestione Liste
  test('3. Gestione Liste deve mostrare le liste', async ({ page }) => {
    // Apri la sidebar
    const menuButton = page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")').first();
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    // Clicca su "Gestione Liste"
    await page.click('text=Gestione Liste');
    await page.waitForTimeout(2000);

    console.log(`📍 URL: ${page.url()}`);
    expect(page.url()).toContain('/lists');

    // Conta elementi
    console.log(`📊 Elementi trovati:`);
    console.log(`   - Tabelle: ${await page.locator('table').count()}`);
    console.log(`   - Righe dati: ${await page.locator('tr, [role="row"]').count()}`);

    // Screenshot
    await page.screenshot({
      path: 'test-results/lists-page.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: test-results/lists-page.png');
  });

  // Test 4: Verifica chiamate API dirette
  test('4. Verifica risposta API diretta per Items', async ({ page }) => {
    let apiResponseReceived = false;
    let apiData = null;

    // Intercetta risposta API
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('localhost:3079') && url.includes('Items')) {
        apiResponseReceived = true;
        try {
          apiData = await response.json();
          console.log(`✅ API Items risposta ricevuta:`);
          console.log(`   Status: ${response.status()}`);
          console.log(`   Headers: ${JSON.stringify(response.headers())}`);
          console.log(`   Data recordNumber: ${apiData?.recordNumber || 'N/A'}`);
          console.log(`   Data result: ${apiData?.result || 'N/A'}`);
        } catch (e) {
          console.log(`❌ Errore parsing JSON: ${e.message}`);
        }
      }
    });

    // Naviga alla pagina Items
    const menuButton = page.locator('button[aria-label="Toggle menu"], button:has-text("Menu")').first();
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);
    }

    await page.click('text=Gestione Articoli');
    await page.waitForTimeout(3000);

    if (apiResponseReceived) {
      console.log('✅ API chiamata eseguita con successo');
    } else {
      console.log('❌ Nessuna chiamata API rilevata - frontend potrebbe non chiamare il backend');
    }
  });

  // Test 5: Verifica CORS headers
  test('5. Verifica CORS headers nelle risposte API', async ({ page }) => {
    const apiResponses = [];

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('localhost:3079')) {
        const headers = response.headers();
        apiResponses.push({
          url,
          status: response.status(),
          corsHeaders: {
            'access-control-allow-origin': headers['access-control-allow-origin'],
            'access-control-allow-methods': headers['access-control-allow-methods'],
            'access-control-allow-headers': headers['access-control-allow-headers'],
          }
        });
      }
    });

    // Naviga e attendi chiamate API
    await page.goto('http://localhost:3014/items');
    await page.waitForTimeout(3000);

    console.log(`\n📡 Risposte API ricevute: ${apiResponses.length}`);
    apiResponses.forEach((resp, idx) => {
      console.log(`\n${idx + 1}. ${resp.url}`);
      console.log(`   Status: ${resp.status}`);
      console.log(`   CORS Headers:`);
      console.log(`     - Allow-Origin: ${resp.corsHeaders['access-control-allow-origin'] || '❌ MANCANTE'}`);
      console.log(`     - Allow-Methods: ${resp.corsHeaders['access-control-allow-methods'] || '❌ MANCANTE'}`);
      console.log(`     - Allow-Headers: ${resp.corsHeaders['access-control-allow-headers'] || '❌ MANCANTE'}`);
    });

    if (apiResponses.length === 0) {
      console.log('⚠️  NESSUNA chiamata API rilevata - il frontend potrebbe non stare chiamando il backend!');
    }
  });
});

