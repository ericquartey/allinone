// TEST FINALE - ProductsPageReal
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🎯 TEST FINALE - ProductsPageReal con App.jsx modificato\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  try {
    console.log('📡 http://localhost:3002/products\n');

    await page.goto('http://localhost:3002/products', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(8000); // Attendi caricamento dati

    // Verifica titolo
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    const h2 = await page.locator('h2').first().textContent().catch(() => '');

    console.log(`📄 H1: "${h1}"`);
    console.log(`📄 H2: "${h2}"`);

    // Cards
    const cards = await page.locator('.border-l-4, .bg-white.rounded-lg.shadow').count();
    console.log(`📊 Cards: ${cards}`);

    // Tabella
    const rows = await page.locator('tbody tr').count();
    console.log(`📦 Righe prodotti: ${rows}`);

    // Screenshot
    await page.screenshot({ path: 'TEST-FINAL.png', fullPage: true });
    console.log('\n📸 Screenshot: TEST-FINAL.png\n');

    // Verifica successo
    const isSuccess = h1.includes('Prodotti in Magazzino') || cards >= 6 || rows > 0;

    if (isSuccess) {
      console.log('✅✅✅ SUCCESS! ProductsPageReal FUNZIONA! ✅✅✅\n');
    } else if (h1.includes('Gestione Prodotti')) {
      console.log('⚠️  Ancora pagina vecchia ProductListPage\n');
    } else {
      console.log(`⚠️  Stato sconosciuto: H1="${h1}"\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('  Browser aperto - Esplora liberamente');
    console.log('  Chiuderà automaticamente tra 10 MINUTI');
    console.log('═══════════════════════════════════════\n');

    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    await page.screenshot({ path: 'TEST-FINAL-ERROR.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
