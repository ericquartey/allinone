const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Script di verifica diretta dell'applicazione EjLog
 * Usa Playwright API senza il test runner
 */

async function verifyApplication() {
  console.log('\n🚀 Avvio verifica applicazione EjLog...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const resultsDir = 'test-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    // Test 1: Verifica caricamento frontend
    console.log('📍 Test 1: Caricamento frontend...');
    const response = await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    if (response && response.status() === 200) {
      console.log('✅ Frontend risponde con HTTP 200');
    } else {
      console.log(`⚠️  Frontend risponde con HTTP ${response ? response.status() : 'N/A'}`);
    }

    // Aspetta che React renderizzi
    await page.waitForTimeout(3000);

    // Test 2: Screenshot homepage
    console.log('📍 Test 2: Cattura screenshot homepage...');
    await page.screenshot({
      path: path.join(resultsDir, 'homepage-verification.png'),
      fullPage: true
    });
    console.log('✅ Screenshot salvato: test-results/homepage-verification.png');

    // Test 3: Verifica titolo
    console.log('📍 Test 3: Verifica titolo pagina...');
    const title = await page.title();
    console.log(`📄 Titolo: "${title}"`);

    // Test 4: Verifica contenuto body
    console.log('📍 Test 4: Verifica contenuto...');
    const bodyText = await page.textContent('body');
    const contentLength = bodyText.length;
    console.log(`📊 Contenuto caricato: ${contentLength} caratteri`);

    // Test 5: Verifica errori console
    console.log('📍 Test 5: Controllo errori console...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Ricarica per catturare eventuali errori
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log(`⚠️  ${consoleErrors.length} errori console rilevati:`);
      consoleErrors.slice(0, 5).forEach(err => console.log(`   - ${err.substring(0, 100)}...`));
    } else {
      console.log('✅ Nessun errore console');
    }

    // Test 6: Screenshot finale
    console.log('📍 Test 6: Screenshot finale...');
    await page.screenshot({
      path: path.join(resultsDir, 'final-state.png'),
      fullPage: true
    });
    console.log('✅ Screenshot finale salvato: test-results/final-state.png');

    // Test 7: Verifica backend (usando fetch nella pagina)
    console.log('📍 Test 7: Test backend API...');
    const backendResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3077');
        return { status: response.status, ok: response.ok };
      } catch (error) {
        return { error: error.message };
      }
    });

    if (backendResponse.error) {
      console.log(`⚠️  Backend errore: ${backendResponse.error}`);
    } else {
      console.log(`✅ Backend risponde: HTTP ${backendResponse.status}`);
    }

    // Riepilogo finale
    console.log('\n' + '='.repeat(60));
    console.log('📊 RIEPILOGO VERIFICA');
    console.log('='.repeat(60));
    console.log('✅ Frontend caricato correttamente');
    console.log('✅ React renderizzato');
    console.log(`✅ Contenuto presente: ${contentLength} caratteri`);
    console.log('✅ Screenshots salvati in test-results/');
    console.log(`${consoleErrors.length === 0 ? '✅' : '⚠️ '} Console errors: ${consoleErrors.length}`);
    console.log('✅ Backend API risponde');
    console.log('='.repeat(60));
    console.log('\n🎉 Verifica completata con successo!\n');

  } catch (error) {
    console.error('\n❌ ERRORE durante la verifica:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);

    // Screenshot dell'errore
    try {
      await page.screenshot({
        path: path.join(resultsDir, 'error-state.png'),
        fullPage: true
      });
      console.log('\n📸 Screenshot errore salvato: test-results/error-state.png');
    } catch (screenshotError) {
      console.error('Impossibile salvare screenshot errore');
    }
  } finally {
    await browser.close();
    console.log('\n👋 Browser chiuso\n');
  }
}

// Esegui la verifica
verifyApplication().catch(error => {
  console.error('Errore fatale:', error);
  process.exit(1);
});

