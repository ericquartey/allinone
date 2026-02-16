// Debug script per vedere i log della console
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Cattura tutti i log della console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
  });

  // Cattura gli errori
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  // Cattura le richieste di rete fallite
  page.on('requestfailed', request => {
    console.error(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('\n🚀 Navigating to drawer management page...\n');
    await page.goto('http://localhost:3002/drawer-management', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting 5 seconds for auto-login...\n');
    await page.waitForTimeout(5000);

    // Verifica il contenuto della pagina
    const title = await page.title();
    console.log(`\n📄 Page title: ${title}`);

    const url = await page.url();
    console.log(`🔗 Current URL: ${url}`);

    // Screenshot
    const screenshotPath = './drawer-debug-screenshot.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`\n📸 Screenshot saved to: ${screenshotPath}`);

    // Lascia il browser aperto per debug
    console.log('\n👀 Browser will stay open for 60 seconds for debugging...\n');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);

    // Screenshot dell'errore
    const errorPath = './drawer-debug-error.png';
    await page.screenshot({ path: errorPath, fullPage: true });
    console.log(`\n📸 Error screenshot saved to: ${errorPath}`);
  } finally {
    await browser.close();
    console.log('\n✅ Done!');
  }
})();
