// Script Playwright - Visualizza ProductsPageReal con browser pulito
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🚀 Avvio browser PULITO per vedere ProductsPageReal...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ['--start-maximized', '--disable-blink-features=AutomationControlled']
  });

  // Context SENZA cache
  const context = await browser.newContext({
    viewport: null,
    ignoreHTTPSErrors: true,
    // Disabilita cache completamente
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Disabilita cache
  await page.route('**/*', (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  });

  try {
    console.log('📡 Navigazione a http://localhost:3002/products...\n');

    await page.goto('http://localhost:3002/products', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('✅ Pagina caricata!\n');

    // Aspetta un po' per il caricamento
    await page.waitForTimeout(6000);

    // Verifica titolo pagina
    const h1Text = await page.locator('h1').first().textContent().catch(() => 'N/A');
    console.log(`📄 Titolo H1: "${h1Text}"`);

    // Conta elementi chiave
    const statsCards = await page.locator('.border-l-4').count();
    const productRows = await page.locator('tbody tr').count();
    const hasFilters = await page.locator('input[placeholder*="Cerca"]').isVisible().catch(() => false);

    console.log(`📊 Cards statistiche: ${statsCards}`);
    console.log(`📦 Righe prodotti: ${productRows}`);
    console.log(`🔍 Filtri presenti: ${hasFilters ? 'SI' : 'NO'}`);

    // Screenshot
    await page.screenshot({
      path: 'products-page-FINAL.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot salvato: products-page-FINAL.png\n');

    // Verifica quale pagina stiamo vedendo
    const isNewPage = h1Text?.includes('Prodotti in Magazzino');
    const isOldPage = h1Text?.includes('Gestione Prodotti');

    if (isNewPage) {
      console.log('✅✅✅ SUCCESS! ProductsPageReal è CARICATA! ✅✅✅');
      console.log(`   → ${statsCards} cards statistiche`);
      console.log(`   → ${productRows} prodotti visualizzati`);
      console.log(`   → Filtri: ${hasFilters ? 'Presenti' : 'Non trovati'}\n`);
    } else if (isOldPage) {
      console.log('⚠️  Stai ancora vedendo la VECCHIA pagina (ProductListPage)');
      console.log('   Il problema potrebbe essere nel routing o nell\'import\n');
    } else {
      console.log(`⚠️  Titolo non riconosciuto: "${h1Text}"\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('  Browser aperto per 10 MINUTI');
    console.log('  Puoi navigare ed esplorare la pagina');
    console.log('  Premi Ctrl+C per chiudere quando hai finito');
    console.log('═══════════════════════════════════════════════════\n');

    // Tieni aperto 10 minuti
    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}\n`);
    try {
      await page.screenshot({ path: 'products-page-ERROR.png', fullPage: true });
      console.log('📸 Screenshot errore: products-page-ERROR.png\n');
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    await browser.close();
    console.log('\n🔒 Browser chiuso.\n');
  }
})();
