// Capture JavaScript errors from ProductsPageReal
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🔍 CAPTURE ERROR - Dettagli errore JavaScript\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  // Capture ALL console messages
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log(`\n❌ BROWSER ERROR:\n${msg.text()}\n`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`\n❌❌❌ PAGE ERROR ❌❌❌`);
    console.log(`Message: ${error.message}`);
    console.log(`Stack:\n${error.stack}\n`);
  });

  try {
    console.log('📍 Navigazione a http://localhost:3003/products\n');

    await page.goto('http://localhost:3003/products', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    console.log('⏳ Attendo 5 secondi per visualizzare errore...\n');
    await page.waitForTimeout(5000);

    // Check if error details button exists
    const hasDetailsButton = await page.locator('text=Dettagli Errore').isVisible().catch(() => false);

    if (hasDetailsButton) {
      console.log('🔍 Trovato pulsante "Dettagli Errore" - Clicco per espandere...\n');

      await page.locator('text=Dettagli Errore').click();
      await page.waitForTimeout(1000);

      // Try to get error details from expanded section
      const errorDetails = await page.locator('pre, code').first().textContent().catch(() => '');

      if (errorDetails) {
        console.log('═══════════════════════════════════════════════════');
        console.log('📋 DETTAGLI ERRORE ESPANSO:');
        console.log('═══════════════════════════════════════════════════');
        console.log(errorDetails);
        console.log('═══════════════════════════════════════════════════\n');
      }

      await page.screenshot({ path: 'ERROR-DETAILS-EXPANDED.png', fullPage: true });
      console.log('📸 Screenshot con dettagli: ERROR-DETAILS-EXPANDED.png\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 TOTALE ERRORI CATTURATI: ${errors.length}`);
    console.log('═══════════════════════════════════════════════════');

    if (errors.length > 0) {
      console.log('\n🔍 LISTA ERRORI:\n');
      errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.substring(0, 200)}...\n`);
      });
    }

    console.log('\n🌐 Browser rimane aperto per 2 MINUTI');
    console.log('   Ispeziona liberamente la console del browser\n');

    await page.waitForTimeout(120000);

  } catch (error) {
    console.error(`\n❌ CRASH: ${error.message}\n`);
    await page.screenshot({ path: 'CAPTURE-CRASH.png' }).catch(() => {});
  } finally {
    await browser.close();
    console.log('✅ Cattura completata\n');
  }
})();
