// Script per visualizzare la pagina Products con Playwright
const { chromium } = require('@playwright/test');

(async () => {
  console.log('🚀 Avvio browser per visualizzare pagina Products...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('📡 Connessione a http://localhost:3001/products...');

  try {
    // Vai alla pagina Products
    await page.goto('http://localhost:3001/products', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Pagina caricata!');

    // Aspetta che la tabella sia visibile
    await page.waitForSelector('[data-testid="products-grid"]', { timeout: 10000 });
    console.log('✅ Tabella prodotti caricata!');

    // Prendi screenshot
    await page.screenshot({
      path: 'products-page-screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: products-page-screenshot.png');

    // Conta i prodotti visualizzati
    const productCount = await page.locator('tbody tr').count();
    console.log(`📦 Prodotti visualizzati: ${productCount}`);

    // Verifica le statistiche cards
    const cards = await page.locator('.border-l-4').count();
    console.log(`📊 Cards statistiche: ${cards}`);

    console.log('\n✨ Pagina Products funzionante! Tengo il browser aperto per la visualizzazione...');
    console.log('👉 Premi Ctrl+C per chiudere il browser quando hai finito.');

    // Mantieni il browser aperto
    await page.waitForTimeout(300000); // 5 minuti

  } catch (error) {
    console.error('❌ Errore:', error.message);
    await page.screenshot({ path: 'products-page-error.png' });
    console.log('📸 Screenshot errore salvato: products-page-error.png');
  } finally {
    await browser.close();
  }
})();
