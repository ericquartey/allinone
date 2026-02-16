/**
 * Quick Debug Script for Scheduler Settings Page
 */

const { chromium } = require('playwright');

(async () => {
  console.log('\n🚀 Starting Scheduler Settings Page Debug...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Log console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`❌ Console Error: ${msg.text()}`);
    }
  });

  // Log page errors
  page.on('pageerror', err => {
    console.error(`❌ Page Error: ${err.message}`);
  });

  // Log API responses
  page.on('response', async response => {
    if (response.url().includes('/api/scheduler-status')) {
      console.log(`\n📡 API: ${response.url()}`);
      console.log(`   Status: ${response.status()}`);

      if (response.ok()) {
        try {
          const data = await response.json();
          console.log(`   ✅ Scheduler Exists: ${data.schedulerExists}`);
          console.log(`   ✅ Running: ${data.running}`);
          console.log(`   ✅ Total: ${data.summary?.total || 0}`);
          console.log(`   ✅ Errors: ${data.summary?.errors || 0}\n`);
        } catch (e) {}
      } else {
        console.error(`   ❌ API Failed!\n`);
      }
    }
  });

  try {
    // Navigate
    console.log('🌐 Opening http://localhost:3000/scheduler-settings...\n');
    await page.goto('http://localhost:3000/scheduler-settings', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded!\n');

    // Wait to see the page
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'screenshots/scheduler-debug.png', fullPage: true });
    console.log('📸 Screenshot: screenshots/scheduler-debug.png\n');

    // Check title
    const title = await page.textContent('h1').catch(() => null);
    console.log(`📝 Title: ${title}\n`);

    // Keep browser open
    console.log('✨ Browser will stay open for 15 seconds...\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'screenshots/scheduler-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 Done!\n');
  }
})();
