const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting browser check for products page...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  // Capture errors
  page.on('pageerror', err => {
    const text = `[ERROR] ${err.message}`;
    consoleMessages.push(text);
    console.log(text);
  });

  try {
    console.log('📍 Navigating to http://localhost:3006/products...\n');
    await page.goto('http://localhost:3006/products', { waitUntil: 'domcontentloaded' });

    console.log('⏳ Waiting 5 seconds for all code to execute...\n');
    await page.waitForTimeout(5000);

    // Check page title
    const title = await page.locator('h1').first().textContent();
    console.log(`\n✅ Page title: "${title}"\n`);

    // Check for products table
    const tableExists = await page.locator('table').count() > 0;
    console.log(`📊 Table exists: ${tableExists}`);

    if (tableExists) {
      const rowCount = await page.locator('tbody tr').count();
      console.log(`📋 Table rows: ${rowCount}`);

      if (rowCount > 0) {
        const firstRowText = await page.locator('tbody tr').first().textContent();
        console.log(`📄 First row: ${firstRowText.substring(0, 100)}...`);
      }
    }

    // Check for "Nessun prodotto" message
    const noProductsVisible = await page.locator('text=Nessun prodotto').isVisible().catch(() => false);
    console.log(`❌ "Nessun prodotto" visible: ${noProductsVisible}`);

    // Take screenshot
    await page.screenshot({ path: 'products-check-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: products-check-screenshot.png');

    console.log('\n' + '='.repeat(70));
    console.log('📝 SUMMARY OF CONSOLE MESSAGES:');
    console.log('='.repeat(70));

    if (consoleMessages.length === 0) {
      console.log('⚠️  NO CONSOLE MESSAGES CAPTURED!');
    } else {
      consoleMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg}`);
      });
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('✅ Test completed. Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('👋 Browser closed.');
})();
