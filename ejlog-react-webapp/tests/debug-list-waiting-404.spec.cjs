/**
 * Playwright Test - Debug 404 Error on List Waiting Operation
 *
 * Questo test intercetta TUTTE le richieste di rete e identifica
 * quale chiamata API fallisce con 404 quando si clicca su "Attesa"
 */

const { test, expect } = require('@playwright/test');

test.describe('Debug List Waiting 404 Error', () => {

  test('should intercept all network requests and identify 404 error', async ({ page }) => {
    // Array per registrare tutte le richieste API
    const apiRequests = [];
    const failedRequests = [];

    // Intercetta TUTTE le richieste
    page.on('request', request => {
      const url = request.url();
      const method = request.method();

      console.log(`🌐 [REQUEST] ${method} ${url}`);

      // Registra solo richieste API
      if (url.includes('/api/') || url.includes('/EjLogHostVertimag/')) {
        apiRequests.push({
          method,
          url,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Intercetta TUTTE le risposte
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      const method = response.request().method();

      console.log(`📡 [RESPONSE] ${status} ${method} ${url}`);

      // Registra richieste fallite (4xx, 5xx)
      if (status >= 400 && (url.includes('/api/') || url.includes('/EjLogHostVertimag/'))) {
        failedRequests.push({
          method,
          url,
          status,
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });

        console.error(`❌ [ERROR] ${status} ${method} ${url}`);
      }
    });

    // Naviga alla pagina delle liste
    console.log('📍 Navigating to http://localhost:3006/lists');
    await page.goto('http://localhost:3006/lists', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Attendi che la tabella delle liste sia caricata
    console.log('⏳ Waiting for lists table to load...');
    await page.waitForSelector('table', { timeout: 10000 });

    // Trova il primo pulsante "Attesa" visibile
    console.log('🔍 Looking for "Attesa" button...');
    const waitingButton = page.locator('button:has-text("Attesa")').first();

    // Verifica che il pulsante esista
    const buttonExists = await waitingButton.count() > 0;
    console.log(`✅ Button "Attesa" found: ${buttonExists}`);

    if (!buttonExists) {
      console.warn('⚠️  No "Attesa" button found on the page');
      console.log('Available buttons:', await page.locator('button').allTextContents());

      // Prova a cercare qualsiasi pulsante di azione
      const actionButtons = await page.locator('table button').all();
      console.log(`Found ${actionButtons.length} buttons in the table`);

      for (const btn of actionButtons) {
        const text = await btn.textContent();
        console.log(`  - Button text: "${text}"`);
      }

      // Fallback: cerca pulsanti con classi specifiche
      const blueButtons = await page.locator('button.bg-blue-600').all();
      console.log(`Found ${blueButtons.length} blue buttons (potential "Attesa" buttons)`);

      return;
    }

    // Aspetta un secondo per vedere lo stato prima del click
    await page.waitForTimeout(1000);

    // Clicca sul pulsante "Attesa"
    console.log('🖱️  Clicking "Attesa" button...');

    try {
      // Forza il click anche se il pulsante è nascosto o coperto
      await waitingButton.click({ force: true, timeout: 5000 });
      console.log('✅ Button clicked successfully');
    } catch (error) {
      console.error('❌ Failed to click button:', error.message);

      // Prova con JavaScript click
      console.log('🔄 Trying JavaScript click...');
      await waitingButton.evaluate(btn => btn.click());
    }

    // Attendi un po' per catturare tutte le richieste
    console.log('⏳ Waiting for network requests to complete...');
    await page.waitForTimeout(3000);

    // Analizza i risultati
    console.log('\n' + '='.repeat(80));
    console.log('📊 NETWORK ANALYSIS REPORT');
    console.log('='.repeat(80));

    console.log(`\n📤 Total API Requests: ${apiRequests.length}`);
    apiRequests.forEach((req, idx) => {
      console.log(`  ${idx + 1}. [${req.timestamp}] ${req.method} ${req.url}`);
    });

    console.log(`\n❌ Failed Requests (4xx/5xx): ${failedRequests.length}`);
    failedRequests.forEach((req, idx) => {
      console.log(`  ${idx + 1}. [${req.timestamp}] ${req.status} ${req.statusText}`);
      console.log(`     ${req.method} ${req.url}`);
    });

    // Trova la richiesta 404 specifica
    const request404 = failedRequests.find(req => req.status === 404);

    if (request404) {
      console.log('\n' + '='.repeat(80));
      console.log('🎯 404 ERROR FOUND!');
      console.log('='.repeat(80));
      console.log(`Method:      ${request404.method}`);
      console.log(`URL:         ${request404.url}`);
      console.log(`Status:      ${request404.status} ${request404.statusText}`);
      console.log(`Timestamp:   ${request404.timestamp}`);

      // Analizza l'URL per identificare il problema
      const urlObj = new URL(request404.url);
      console.log(`\nURL Breakdown:`);
      console.log(`  Protocol:  ${urlObj.protocol}`);
      console.log(`  Host:      ${urlObj.host}`);
      console.log(`  Pathname:  ${urlObj.pathname}`);
      console.log(`  Search:    ${urlObj.search}`);

      // Identifica quale endpoint dovrebbe essere chiamato
      console.log(`\n🔧 ANALYSIS:`);

      if (urlObj.pathname.includes('/api/item-lists/')) {
        console.log(`✅ Correct path prefix: /api/item-lists/`);

        // Estrai l'ID dalla URL
        const pathParts = urlObj.pathname.split('/');
        const listIdIndex = pathParts.indexOf('item-lists') + 1;
        const listId = pathParts[listIdIndex];
        const operation = pathParts[listIdIndex + 1];

        console.log(`  List ID:     ${listId}`);
        console.log(`  Operation:   ${operation}`);

        console.log(`\n💡 Expected URL:`);
        console.log(`  http://localhost:3077/api/item-lists/{listId}/waiting`);
        console.log(`\n💡 Actual URL called:`);
        console.log(`  ${request404.url}`);

        if (operation !== 'waiting') {
          console.log(`\n⚠️  PROBLEM: Operation endpoint is '${operation}', should be 'waiting'`);
        }

        if (listId && isNaN(listId)) {
          console.log(`\n⚠️  PROBLEM: List ID is '${listId}', should be a numeric ID`);
        }

      } else if (urlObj.pathname.includes('/EjLogHostVertimag/')) {
        console.log(`❌ WRONG path prefix: /EjLogHostVertimag/`);
        console.log(`   This endpoint should use /api/item-lists/ instead`);
        console.log(`   The proxy configuration might be wrong`);
      } else {
        console.log(`❌ UNKNOWN path: ${urlObj.pathname}`);
        console.log(`   Expected: /api/item-lists/{id}/waiting`);
      }

    } else if (failedRequests.length > 0) {
      console.log('\n⚠️  No 404 error found, but other errors occurred');
    } else {
      console.log('\n✅ No failed requests detected');
      console.log('   The operation might have succeeded or no request was made');
    }

    console.log('\n' + '='.repeat(80));

    // Screenshot finale
    await page.screenshot({
      path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\tests\\screenshots\\list-waiting-404-debug.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to tests/screenshots/list-waiting-404-debug.png');

    // Asserzioni per fallire il test se c'è un 404
    if (request404) {
      throw new Error(`404 Error detected: ${request404.method} ${request404.url}`);
    }
  });

});

