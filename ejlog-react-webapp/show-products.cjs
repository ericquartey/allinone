// Script per visualizzare e verificare la lista completa dei prodotti
const { chromium } = require('@playwright/test');

(async () => {
  console.log('\n🚀 Avvio browser per mostrare la lista prodotti...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  try {
    // Naviga alla pagina
    console.log('📂 Caricamento pagina http://localhost:3003/products/search');
    await page.goto('http://localhost:3003/products/search');

    // Aspetta che i dati siano caricati
    console.log('⏳ Attendo caricamento dati...');
    await page.waitForSelector('table tbody tr', { timeout: 20000 });

    // Aspetta un attimo per vedere il caricamento
    await page.waitForTimeout(2000);

    // Conta i prodotti
    const rowCount = await page.locator('tbody tr').count();
    console.log(`\n✅ PRODOTTI VISUALIZZATI NELLA TABELLA: ${rowCount}\n`);

    // Prendi il totale dal backend
    const totalText = await page.locator('p:has-text("Totale:")').textContent();
    console.log(`📊 ${totalText}\n`);

    // Mostra i primi 10 prodotti
    console.log('📦 PRIMI 10 PRODOTTI NELLA LISTA:\n');
    console.log('═'.repeat(80));

    for (let i = 0; i < Math.min(10, rowCount); i++) {
      const magazzino = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(1)`).textContent();
      const codice = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(2)`).textContent();
      const descrizione = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(3)`).textContent();
      const lotto = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(4)`).textContent();
      const qty = await page.locator(`tbody tr:nth-child(${i + 1}) td:nth-child(7)`).textContent();

      console.log(`${String(i + 1).padStart(2, ' ')}. MAG: ${magazzino.trim().padEnd(5)} | ${codice.trim().padEnd(15)} | ${descrizione.trim().substring(0, 30).padEnd(30)} | Lotto: ${lotto.trim().padEnd(10)} | Qty: ${qty.trim()}`);
    }

    if (rowCount > 10) {
      console.log(`\n   ... e altri ${rowCount - 10} prodotti\n`);
    }

    console.log('═'.repeat(80));
    console.log('\n✅ VERIFICA COMPLETATA!');
    console.log(`✅ La pagina mostra ${rowCount} prodotti nella tabella`);
    console.log('✅ Puoi scorrere la lista nel browser per vedere tutti i prodotti');
    console.log('\n💡 Il browser rimarrà aperto per 60 secondi per permetterti di esplorare i dati.\n');

    // Mantieni il browser aperto per 60 secondi
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Browser chiuso.\n');
  }
})();
