// Script per mostrare la pagina di gestione cassetti
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Navigating to drawer management page...');
    await page.goto('http://localhost:3002/drawer-management', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Screenshot
    const screenshotPath = './drawer-page-screenshot.png';
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    // Lascia il browser aperto per 30 secondi
    console.log('👀 Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Screenshot dell'errore
    const errorPath = './drawer-page-error.png';
    await page.screenshot({ path: errorPath, fullPage: true });
    console.log(`📸 Error screenshot saved to: ${errorPath}`);
  } finally {
    await browser.close();
    console.log('✅ Done!');
  }
})();
