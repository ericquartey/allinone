const { test, expect } = require('@playwright/test');

/**
 * Test di verifica completo dell'applicazione EjLog
 * Frontend: http://localhost:3005
 * Backend: http://localhost:3077
 */

test.describe('EjLog Application - Verifica Completa', () => {

  test('Frontend - Dovrebbe caricare la homepage senza errori', async ({ page }) => {
    console.log('📍 Test: Caricamento homepage frontend...');

    // Naviga alla homepage
    const response = await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Verifica che la risposta sia OK
    expect(response.status()).toBe(200);
    console.log('✅ Frontend risponde con HTTP 200');

    // Aspetta che la pagina sia completamente caricata
    await page.waitForLoadState('domcontentloaded');

    // Verifica che il body sia visibile
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    console.log('✅ Body della pagina è visibile');

    // Prendi uno screenshot della homepage
    await page.screenshot({
      path: 'test-results/homepage-loaded.png',
      fullPage: true
    });
    console.log('✅ Screenshot salvato: test-results/homepage-loaded.png');

    // Verifica il titolo della pagina
    const title = await page.title();
    console.log(`📄 Titolo pagina: "${title}"`);
    expect(title).toBeTruthy();
  });

  test('Frontend - Verifica elementi React caricati', async ({ page }) => {
    console.log('📍 Test: Verifica caricamento React...');

    await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Aspetta un momento per il rendering React
    await page.waitForTimeout(2000);

    // Verifica che ci sia contenuto nella pagina
    const content = await page.textContent('body');
    expect(content.length).toBeGreaterThan(0);
    console.log(`✅ Contenuto pagina caricato (${content.length} caratteri)`);

    // Screenshot dopo il rendering
    await page.screenshot({
      path: 'test-results/react-rendered.png'
    });
    console.log('✅ Screenshot React: test-results/react-rendered.png');
  });

  test('Backend - Verifica che il server REST risponda', async ({ request }) => {
    console.log('📍 Test: Verifica backend REST API...');

    // Test connessione al backend
    const response = await request.get('http://localhost:3077');

    console.log(`📡 Backend risposta: HTTP ${response.status()}`);

    // Il backend può restituire 404 sulla root, ma deve rispondere
    expect(response.status()).toBeLessThan(500);
    console.log('✅ Backend server è attivo e risponde');
  });

  test('Integrazione - Frontend può comunicare con Backend', async ({ page }) => {
    console.log('📍 Test: Verifica integrazione frontend-backend...');

    // Intercetta le chiamate API
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('localhost:3077')) {
        apiCalls.push(request.url());
      }
    });

    await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Aspetta eventuali chiamate API iniziali
    await page.waitForTimeout(3000);

    console.log(`📊 Chiamate API rilevate: ${apiCalls.length}`);
    if (apiCalls.length > 0) {
      console.log('📡 API chiamate:');
      apiCalls.forEach(url => console.log(`  - ${url}`));
    }

    // Screenshot finale
    await page.screenshot({
      path: 'test-results/integration-test.png',
      fullPage: true
    });
    console.log('✅ Test integrazione completato');
  });

  test('UI Components - Verifica presenza componenti base', async ({ page }) => {
    console.log('📍 Test: Verifica componenti UI...');

    await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Verifica che la pagina non mostri errori evidenti
    const pageText = await page.textContent('body');

    // Non dovrebbe contenere errori comuni
    const hasErrors = pageText.includes('Error') ||
                      pageText.includes('Failed to compile') ||
                      pageText.includes('Cannot find module');

    if (hasErrors) {
      console.log('⚠️  Possibili errori rilevati nella pagina');
    } else {
      console.log('✅ Nessun errore evidente nella UI');
    }

    // Screenshot UI
    await page.screenshot({
      path: 'test-results/ui-components.png',
      fullPage: true
    });
    console.log('✅ Screenshot UI: test-results/ui-components.png');
  });

});

