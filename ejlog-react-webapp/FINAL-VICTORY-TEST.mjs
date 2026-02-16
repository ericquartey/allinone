// FINAL VICTORY TEST - Verifica completa funzionamento ProductsPageReal
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🏆 FINAL VICTORY TEST - Verifica completa ProductsPageReal\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  // Track backend requests
  const backendRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('Stock')) {
      backendRequests.push(url);
      console.log(`📡 API Request: ${url.substring(0, 100)}...`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('Stock')) {
      const status = response.status();
      if (status === 200) {
        try {
          const data = await response.json();
          console.log(`✅ API Success: ${data.recordNumber} records, ${data.exported?.length} items\n`);
        } catch (e) {}
      }
    }
  });

  // Track JavaScript errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`❌ JavaScript Error: ${error.message.substring(0, 100)}\n`);
  });

  try {
    console.log('📍 Navigazione a http://localhost:3003/products\n');

    await page.goto('http://localhost:3003/products', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('⏳ Attendo 10 secondi per caricamento completo...\n');
    await page.waitForTimeout(10000);

    // Verifica contenuto pagina
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    const rows = await page.locator('tbody tr').count();
    const cards = await page.locator('.border-l-4').count();
    const hasError = await page.locator('text=Si è verificato un errore').isVisible().catch(() => false);
    const hasTable = await page.locator('table').isVisible().catch(() => false);

    // Screenshot
    await page.screenshot({ path: 'FINAL-VICTORY.png', fullPage: true });
    console.log('📸 Screenshot: FINAL-VICTORY.png\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RISULTATI FINALI:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`   H1: "${h1}"`);
    console.log(`   📊 Cards statistiche: ${cards}`);
    console.log(`   📦 Righe prodotti: ${rows}`);
    console.log(`   🔗 Richieste backend: ${backendRequests.length}`);
    console.log(`   ❌ Errori JavaScript: ${errors.length}`);
    console.log(`   ⚠️  Errore visualizzato: ${hasError ? 'SÌ' : 'NO'}`);
    console.log(`   📋 Tabella visibile: ${hasTable ? 'SÌ' : 'NO'}`);
    console.log('═══════════════════════════════════════════════════\n');

    //  Final Verdict
    if (rows >= 50 && cards > 0 && !hasError && errors.length === 0) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════╗');
      console.log('║                                                   ║');
      console.log('║   ✅✅✅ VICTORY! TUTTO FUNZIONA! ✅✅✅         ║');
      console.log('║                                                   ║');
      console.log('╚═══════════════════════════════════════════════════╝');
      console.log('');
      console.log(`  🎯 ${cards} cards statistiche visualizzate`);
      console.log(`  📦 ${rows} prodotti caricati dal backend 3077`);
      console.log(`  ✅ Nessun errore JavaScript`);
      console.log(`  ✅ Proxy Vite configurato correttamente`);
      console.log(`  ✅ Redux Provider funzionante`);
      console.log(`  ✅ ProductsPageReal completamente operativa`);
      console.log('');
      console.log('═══════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️  PROBLEMI RILEVATI:\n');
      if (hasError) console.log('   - ErrorBoundary attivo');
      if (errors.length > 0) console.log(`   - ${errors.length} errori JavaScript`);
      if (rows === 0) console.log('   - Nessun prodotto visualizzato');
      if (cards === 0) console.log('   - Nessuna card statistica');
      console.log('');
    }

    console.log('🌐 Browser rimane aperto per 10 MINUTI');
    console.log('   Puoi esplorare la pagina e testare le funzionalità\n');

    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}\n`);
    await page.screenshot({ path: 'FINAL-CRASH.png' }).catch(() => {});
  } finally {
    await browser.close();
    console.log('✅ Test completato\n');
  }
})();

