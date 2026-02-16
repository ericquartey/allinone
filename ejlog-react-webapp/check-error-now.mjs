// Check current error after Redux Provider fix
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🔍 Checking current error state...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`\n❌ PAGE ERROR: ${error.message}\n`);
  });

  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  try {
    await page.goto('http://localhost:3002/products', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    await page.waitForTimeout(5000);

    console.log('\n📋 All page errors:');
    errors.forEach(err => console.log(`  - ${err}`));

    await page.screenshot({ path: 'ERROR-CHECK.png', fullPage: true });
    console.log('\n📸 Screenshot: ERROR-CHECK.png\n');

    await page.waitForTimeout(60000);

  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
  } finally {
    await browser.close();
  }
})();
