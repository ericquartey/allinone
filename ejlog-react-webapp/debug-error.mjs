// Debug ProductsPageReal - Capture console errors
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🔍 DEBUG - Capturing console errors from ProductsPageReal\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });

    if (type === 'error' || type === 'warning') {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`\n❌ PAGE ERROR:\n${error.message}\n${error.stack}\n`);
  });

  try {
    console.log('📡 Navigating to http://localhost:3002/products\n');

    await page.goto('http://localhost:3002/products', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(5000);

    // Check for error boundary
    const errorBoundary = await page.locator('text=Si è verificato un errore').isVisible().catch(() => false);

    if (errorBoundary) {
      console.log('\n⚠️  Error Boundary is visible!\n');

      // Try to expand error details
      const detailsButton = page.locator('text=Dettagli Errore');
      if (await detailsButton.isVisible().catch(() => false)) {
        await detailsButton.click();
        await page.waitForTimeout(500);

        // Read error details
        const errorDetails = await page.locator('pre, code, .error-details').allTextContents();
        if (errorDetails.length > 0) {
          console.log('📄 Error Details:');
          errorDetails.forEach(detail => console.log(detail));
        }
      }
    }

    // Check what's actually rendering
    const h1 = await page.locator('h1').allTextContents();
    const h2 = await page.locator('h2').allTextContents();

    console.log(`\n📄 H1 elements: ${JSON.stringify(h1)}`);
    console.log(`📄 H2 elements: ${JSON.stringify(h2)}`);

    // Screenshot
    await page.screenshot({ path: 'DEBUG-ERROR.png', fullPage: true });
    console.log('\n📸 Screenshot: DEBUG-ERROR.png\n');

    // Print all console messages
    console.log('\n📋 All console messages:');
    consoleMessages.forEach(({ type, text }) => {
      console.log(`  [${type}] ${text}`);
    });

    console.log('\n═══════════════════════════════════════');
    console.log('  Press Ctrl+C to close');
    console.log('═══════════════════════════════════════\n');

    await page.waitForTimeout(120000); // 2 minutes

  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    await page.screenshot({ path: 'DEBUG-ERROR-CRASH.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
