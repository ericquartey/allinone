/**
 * Verifica Gestione Liste - Dati Reali
 *
 * Script semplice per verificare che la pagina Lists Management
 * stia caricando dati reali dal backend via REST API.
 */

const { chromium } = require('playwright');

(async () => {
  console.log('='.repeat(80));
  console.log('VERIFICA GESTIONE LISTE - DATI REALI');
  console.log('='.repeat(80));
  console.log('');

  // Trova porta attiva tra 3001-3015
  let targetPort = 3009;

  const browser = await chromium.launch({
    headless: false, // Mostra browser per vedere cosa succede
    slowMo: 500 // Rallenta le operazioni per vederle
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Arrays per tracciare le chiamate API
  const apiCalls = [];
  const errors = [];

  // Intercetta richieste di rete
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/item-lists')) {
      apiCalls.push({
        method: request.method(),
        url: url,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Intercetta risposte per verificare errori
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/item-lists') && response.status() >= 400) {
      errors.push({
        url: url,
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  // Intercetta console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`  [BROWSER ERROR] ${msg.text()}`);
    }
  });

  try {
    console.log(`1. Navigazione a http://localhost:${targetPort}/lists ...`);
    await page.goto(`http://localhost:${targetPort}/lists`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('   ✅ Pagina caricata');

    console.log('');
    console.log('2. Attesa caricamento tabella liste...');
    await page.waitForSelector('table', { timeout: 10000 });
    console.log('   ✅ Tabella trovata');

    console.log('');
    console.log('3. Conteggio righe tabella...');
    const rows = await page.locator('table tbody tr').count();
    console.log(`   ℹ️  Righe trovate: ${rows}`);

    console.log('');
    console.log('4. Verifica pulsanti operazioni sidebar...');
    const buttons = ['Esegui', 'Attesa', 'Termina', 'Prenota', 'Riprenota'];
    for (const btnText of buttons) {
      const visible = await page.locator(`button:has-text("${btnText}")`).isVisible().catch(() => false);
      console.log(`   ${visible ? '✅' : '⚠️'}  Pulsante "${btnText}": ${visible ? 'presente' : 'NON trovato'}`);
    }

    // Attendere un momento per raccogliere tutte le chiamate API
    await page.waitForTimeout(2000);

    console.log('');
    console.log('='.repeat(80));
    console.log('REPORT CHIAMATE REST API');
    console.log('='.repeat(80));
    console.log('');

    if (apiCalls.length === 0) {
      console.log('⚠️  NESSUNA chiamata REST API rilevata');
      console.log('    Questo potrebbe significare:');
      console.log('    - Database vuoto (nessuna lista da caricare)');
      console.log('    - Backend non attivo');
      console.log('    - Endpoint sbagliato');
    } else {
      console.log(`✅ Rilevate ${apiCalls.length} chiamate REST API:`);
      console.log('');
      apiCalls.forEach((call, index) => {
        console.log(`${index + 1}. ${call.method} ${call.url}`);
      });
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('VERIFICA CHIAMATE CORRETTE');
    console.log('='.repeat(80));
    console.log('');

    // Verifica che NON ci siano chiamate al vecchio endpoint errato
    const wrongCalls = apiCalls.filter(call =>
      call.url.includes('/EjLogHostVertimag/api/item-lists')
    );

    if (wrongCalls.length > 0) {
      console.log(`❌ ERRORE: Trovate ${wrongCalls.length} chiamate ERRATE:`);
      wrongCalls.forEach(call => {
        console.log(`   - ${call.method} ${call.url}`);
      });
      console.log('');
      console.log('   Il problema è che useListOperations sta usando apiClient invece di restApiClient!');
    } else {
      console.log('✅ Nessuna chiamata errata a /EjLogHostVertimag/api/item-lists');
    }

    console.log('');

    // Verifica che ci siano chiamate corrette
    const correctCalls = apiCalls.filter(call =>
      call.url.match(/^http:\/\/localhost:3077\/api\/item-lists/)
    );

    if (correctCalls.length > 0) {
      console.log(`✅ Trovate ${correctCalls.length} chiamate CORRETTE a restApiClient:`);
      correctCalls.forEach(call => {
        console.log(`   - ${call.method} ${call.url}`);
      });
    } else {
      if (apiCalls.length > 0) {
        console.log('⚠️  Nessuna chiamata diretta a http://localhost:3077');
        console.log('   Le chiamate potrebbero essere proxied tramite Vite');
      }
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('VERIFICA ERRORI HTTP');
    console.log('='.repeat(80));
    console.log('');

    if (errors.length > 0) {
      console.log(`❌ ERRORI HTTP rilevati (${errors.length}):`);
      errors.forEach(err => {
        console.log(`   - ${err.status} ${err.statusText}: ${err.url}`);
      });
    } else {
      console.log('✅ Nessun errore HTTP sulle chiamate REST API');
    }

    console.log('');
    console.log('='.repeat(80));
    console.log('SCREENSHOT FINALE');
    console.log('='.repeat(80));
    console.log('');

    await page.screenshot({
      path: 'test-results/lists-real-data-verification.png',
      fullPage: true
    });

    console.log('✅ Screenshot salvato in test-results/lists-real-data-verification.png');
    console.log('');

    console.log('='.repeat(80));
    console.log('RIEPILOGO VERIFICA');
    console.log('='.repeat(80));
    console.log('');

    console.log(`Righe tabella: ${rows}`);
    console.log(`Chiamate API totali: ${apiCalls.length}`);
    console.log(`Chiamate errate: ${wrongCalls.length}`);
    console.log(`Errori HTTP: ${errors.length}`);
    console.log('');

    if (wrongCalls.length === 0 && errors.length === 0) {
      console.log('🎉 VERIFICA COMPLETATA CON SUCCESSO!');
      console.log('   La pagina Gestione Liste sta usando dati reali via REST API.');
    } else {
      console.log('⚠️  VERIFICA COMPLETATA CON AVVISI');
      console.log('   Controllare i dettagli sopra per i problemi rilevati.');
    }

    console.log('');
    console.log('Il browser resterà aperto per 10 secondi per permettere ispezione manuale...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('');
    console.error('❌ ERRORE DURANTE LA VERIFICA:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('Possibili cause:');
    console.error(`   - Server dev non attivo su porta ${targetPort}`);
    console.error('   - Pagina /lists non esiste');
    console.error('   - Timeout caricamento');
  } finally {
    await browser.close();
    console.log('');
    console.log('Browser chiuso. Verifica completata.');
    console.log('='.repeat(80));
  }
})();

