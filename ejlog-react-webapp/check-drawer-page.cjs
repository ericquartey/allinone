// Script per controllare la pagina dei cassetti in dettaglio
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Cattura tutti i log e errori
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]`, text);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('[PAGE ERROR]', error.message);
  });

  page.on('requestfailed', request => {
    errors.push(`Request failed: ${request.url()}`);
    console.error('[REQUEST FAILED]', request.url(), request.failure().errorText);
  });

  try {
    console.log('\n🚀 Loading drawer management page...\n');

    await page.goto('http://localhost:3003/drawer-management', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n⏳ Waiting for page to fully load...\n');
    await page.waitForTimeout(5000);

    // Verifica il contenuto della pagina
    const title = await page.title();
    const url = page.url();
    const bodyText = await page.textContent('body');

    console.log('\n📊 Page Analysis:');
    console.log('================');
    console.log('Title:', title);
    console.log('URL:', url);
    console.log('');

    // Cerca elementi specifici
    const hasLoginStatus = bodyText.includes('Auto-login');
    const hasToken = bodyText.includes('Token:');
    const hasError = bodyText.includes('Errore:');

    console.log('✓ Has login status:', hasLoginStatus);
    console.log('✓ Has token displayed:', hasToken);
    console.log('✓ Has errors:', hasError);
    console.log('');

    // Conta errori
    console.log('📋 Error Summary:');
    console.log('================');
    console.log('Total console errors:', logs.filter(l => l.includes('[error]')).length);
    console.log('Total page errors:', errors.length);
    console.log('');

    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✅ No critical errors!');
    }

    // Screenshot
    await page.screenshot({
      path: './drawer-check-full.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved: drawer-check-full.png');

    // Lascia aperto per ispezione
    console.log('\n👀 Browser will stay open for 60 seconds for inspection...\n');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Done!\n');
  }
})();
