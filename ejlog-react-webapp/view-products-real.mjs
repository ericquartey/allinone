// Script Playwright per visualizzare ProductsPageReal con dati reali
import { chromium } from '@playwright/test';

(async () => {
  console.log('🚀 Avvio Chromium per vedere ProductsPageReal...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null, // Usa finestra massimizzata
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();

  try {
    console.log('📡 Navigazione a http://localhost:3001/products...');

    // Naviga all'URL con cache disabilitata
    await page.goto('http://localhost:3001/products', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('✅ Pagina caricata!');

    // Hard refresh per evitare cache
    console.log('🔄 Hard refresh per caricare versione aggiornata...');
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });

    console.log('⏳ Attendo caricamento dati dal backend...');
    await page.waitForTimeout(5000); // Aspetta 5 secondi per il caricamento

    // Verifica se siamo sulla pagina giusta
    const pageTitle = await page.locator('h1').first().textContent();
    console.log(`📄 Titolo pagina: "${pageTitle}"`);

    // Controlla se ci sono cards statistiche
    const statsCards = await page.locator('.border-l-4').count();
    console.log(`📊 Cards statistiche trovate: ${statsCards}`);

    // Controlla quante righe di prodotti ci sono
    const productRows = await page.locator('tbody tr').count();
    console.log(`📦 Righe prodotti nella tabella: ${productRows}`);

    // Prendi screenshot finale
    await page.screenshot({
      path: 'products-page-real-final.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: products-page-real-final.png\n');

    // Verifica se stiamo vedendo ProductsPageReal o ProductListPage
    const hasNewLayout = await page.locator('text=Prodotti in Magazzino').isVisible().catch(() => false);
    const hasOldLayout = await page.locator('text=Gestione Prodotti').isVisible().catch(() => false);

    if (hasNewLayout) {
      console.log('✅ SUCCESSO! Pagina ProductsPageReal caricata correttamente!');
      console.log(`   - ${statsCards} cards statistiche`);
      console.log(`   - ${productRows} prodotti visualizzati\n`);
    } else if (hasOldLayout) {
      console.log('⚠️  ATTENZIONE: Stai vedendo la VECCHIA pagina (ProductListPage)');
      console.log('   Prova a navigare manualmente nel browser a: /products\n');
    }

    // Cerca eventuali errori nella console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    console.log('✨ Browser aperto! Puoi esplorare la pagina.');
    console.log('👉 Il browser rimarrà aperto per 5 MINUTI.');
    console.log('   Premi Ctrl+C in qualsiasi momento per chiudere.\n');

    // Tieni aperto per 5 minuti
    await page.waitForTimeout(300000);

  } catch (error) {
    console.error(`\n❌ ERRORE: ${error.message}\n`);

    // Screenshot dell'errore
    try {
      await page.screenshot({
        path: 'products-page-error-debug.png',
        fullPage: true
      });
      console.log('📸 Screenshot errore salvato: products-page-error-debug.png\n');
    } catch (e) {
      console.log('Non è stato possibile salvare screenshot errore');
    }

  } finally {
    await browser.close();
    console.log('🔒 Browser chiuso.');
  }
})();
