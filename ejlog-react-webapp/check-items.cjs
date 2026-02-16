const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📂 Aprendo pagina articoli...');
  await page.goto('http://localhost:3000/items');

  console.log('⏳ Aspetto 5 secondi per il caricamento...');
  await page.waitForTimeout(5000);

  console.log('📸 Faccio screenshot...');
  await page.screenshot({ path: 'items-screenshot.png', fullPage: true });
  console.log('✅ Screenshot salvato: items-screenshot.png');

  console.log('\n⏳ Browser aperto per 15 secondi...');
  await page.waitForTimeout(15000);

  await browser.close();
  console.log('👋 Test completato');
})();
