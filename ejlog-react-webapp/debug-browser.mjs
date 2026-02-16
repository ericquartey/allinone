import { chromium } from '@playwright/test';

(async () => {
  console.log('🔍 Debug browser - Verifica cosa sta succedendo...');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Console logs
  page.on('console', msg => console.log('📋 BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('❌ PAGE ERROR:', err.message));

  console.log('📱 Navigazione a http://localhost:3001...');

  try {
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Pagina caricata!');

    // Screenshot
    await page.screenshot({ path: 'C:\\F_WMS\\screenshot.png', fullPage: true });
    console.log('📸 Screenshot salvato in C:\\F_WMS\\screenshot.png');

    // Get HTML
    const html = await page.content();
    console.log('📄 Lunghezza HTML:', html.length);

    // Get title
    const title = await page.title();
    console.log('📌 Titolo pagina:', title);

    // Check for errors
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('📝 Testo visibile (primi 500 char):', bodyText.substring(0, 500));

    // Wait to see the page
    console.log('\n⏳ Browser aperto - controlla lo schermo!');
    console.log('   Screenshot salvato in: C:\\F_WMS\\screenshot.png');
    console.log('   Premi Ctrl+C per chiudere\n');

    await page.waitForTimeout(300000); // 5 minuti

  } catch (error) {
    console.error('❌ Errore:', error.message);
    await page.screenshot({ path: 'C:\\F_WMS\\error-screenshot.png' });
    console.log('📸 Screenshot errore salvato in C:\\F_WMS\\error-screenshot.png');
  } finally {
    await browser.close();
  }
})();
