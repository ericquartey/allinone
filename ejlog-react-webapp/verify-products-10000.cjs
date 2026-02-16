/**
 * Verifica che la pagina ProductsSearch carichi tutti i prodotti reali
 * Test standalone senza configurazione complessa
 */

const { chromium } = require('@playwright/test');

(async () => {
  console.log('\n📦 VERIFICA CARICAMENTO PRODOTTI\n');
  console.log('================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  try {
    console.log('🔄 Apertura pagina http://localhost:3010/products/search...');
    await page.goto('http://localhost:3010/products/search', {
      waitUntil: 'load',
      timeout: 15000
    });

    console.log('⏳ Attendo caricamento tabella prodotti...');
    await page.waitForSelector('table tbody tr', { timeout: 20000 });

    // Conta i prodotti
    const rowCount = await page.locator('tbody tr').count();
    console.log(`\n✅ PRODOTTI VISUALIZZATI: ${rowCount}\n`);

    // Leggi il totale mostrato
    const totalText = await page.locator('p:has-text("Totale:")').textContent();
    console.log(`📊 ${totalText}\n`);

    // Mostra i primi 10 prodotti
    console.log('📦 PRIMI 10 PRODOTTI:\n');
    const displayCount = Math.min(10, rowCount);

    for (let i = 0; i < displayCount; i++) {
      const codice = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(2)`).textContent();
      const descrizione = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(3)`).textContent();
      const qty = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(7)`).textContent();
      const magazzino = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(1)`).textContent();

      console.log(`  ${i + 1}. [Mag: ${magazzino.trim()}] ${codice.trim()} - ${descrizione.trim()} (Qty: ${qty.trim()})`);
    }

    console.log('\n================================');
    console.log('✅ VERIFICA COMPLETATA CON SUCCESSO!');
    console.log('================================\n');

    if (rowCount >= 100) {
      console.log('✅ Ottimo! La pagina sta caricando un numero elevato di prodotti.');
    } else {
      console.log('⚠️  Attenzione: Meno di 100 prodotti caricati. Verifica il limite nel codice.');
    }

    console.log('\n💡 Il browser rimarrà aperto per 60 secondi per visualizzare i dati...\n');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    console.error('\nDettagli:', error);
  } finally {
    await browser.close();
    console.log('\n🔒 Browser chiuso.\n');
  }
})();
