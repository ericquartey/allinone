const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Debugging RF/Picking Page...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text());
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('item-lists') || request.url().includes('picking')) {
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('item-lists') || response.url().includes('picking')) {
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
    }
  });

  // Monitor errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR]:`, error.message);
  });

  try {
    console.log('📍 Navigating to http://localhost:3004/rf/picking...');
    await page.goto('http://localhost:3004/rf/picking', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded!\n');

    // Wait for lists to load
    console.log('⏳ Waiting for picking lists to appear...');
    await page.waitForSelector('text=Liste Picking Disponibili', { timeout: 10000 });
    console.log('✅ Lists section found!\n');

    // Take screenshot
    await page.screenshot({ path: 'debug-picking-page.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-picking-page.png\n');

    // Get list of available picking lists
    const lists = await page.$$eval('button:has-text("PICK")', buttons =>
      buttons.map(btn => {
        const code = btn.querySelector('.font-semibold')?.textContent;
        const desc = btn.querySelector('.text-sm.text-gray-400')?.textContent;
        return { code, desc };
      })
    );

    console.log('📋 Available Picking Lists:');
    lists.forEach((list, i) => {
      console.log(`   ${i + 1}. ${list.code} - ${list.desc}`);
    });
    console.log('');

    if (lists.length > 0) {
      console.log(`🖱️  Clicking on first list: ${lists[0].code}...`);
      await page.click(`button:has-text("${lists[0].code}")`);

      console.log('⏳ Waiting for list details to load...');
      await page.waitForTimeout(3000);

      // Check for errors or success
      const errorToast = await page.$('text=/errore|error/i');
      const successToast = await page.$('text=/caricata|success|righe/i');

      if (errorToast) {
        const errorText = await errorToast.textContent();
        console.log('❌ Error detected:', errorText);
      } else if (successToast) {
        const successText = await successToast.textContent();
        console.log('✅ Success:', successText);

        // Count reservations/rows
        const rowCount = await page.$$eval('[class*="ReservationCard"], [class*="reservation"]', cards => cards.length);
        console.log(`📊 Rows displayed: ${rowCount}`);
      } else {
        console.log('⚠️  No toast message found');
      }

      // Take final screenshot
      await page.screenshot({ path: 'debug-picking-loaded.png', fullPage: true });
      console.log('📸 Screenshot saved: debug-picking-loaded.png\n');
    }

    console.log('✅ Debug complete! Check the screenshots.');
    console.log('   - debug-picking-page.png (initial state)');
    console.log('   - debug-picking-loaded.png (after clicking list)\n');

    // Keep browser open for 10 seconds
    console.log('⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    await page.screenshot({ path: 'debug-picking-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: debug-picking-error.png');
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed. Debug session complete.');
  }
})();
