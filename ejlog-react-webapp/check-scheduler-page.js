import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    console.log('❌ Request Failed:', request.url(), request.failure().errorText);
  });

  try {
    console.log('🔍 Navigating to http://localhost:3000/scheduler-settings...');
    await page.goto('http://localhost:3000/scheduler-settings', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully');

    // Wait a bit for the page to fully render
    await page.waitForTimeout(3000);

    // Check if there are any visible error messages
    const errorMessages = await page.locator('text=/error|errore/i').all();
    if (errorMessages.length > 0) {
      console.log(`⚠️  Found ${errorMessages.length} error message(s) on page`);
      for (const msg of errorMessages) {
        const text = await msg.textContent();
        console.log('  -', text?.substring(0, 100));
      }
    }

    // Check for the new Service Statistics section
    const serviceStats = await page.locator('text=Service Statistics').count();
    if (serviceStats > 0) {
      console.log('✅ Service Statistics section found');
    } else {
      console.log('❌ Service Statistics section NOT found');
    }

    // Take a screenshot
    await page.screenshot({ path: 'scheduler-settings-page.png', fullPage: true });
    console.log('📸 Screenshot saved to scheduler-settings-page.png');

    // Keep browser open for inspection
    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
  } finally {
    await browser.close();
  }
})();
