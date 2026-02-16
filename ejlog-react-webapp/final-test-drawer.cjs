const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`[BROWSER ${msg.type().toUpperCase()}]`, text);
  });

  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
  });

  try {
    console.log('\n🔍 Checking drawer management page on port 3005...\n');

    await page.goto('http://localhost:3005/drawer-management', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    const url = page.url();
    const title = await page.title();

    console.log('\n📊 Page Status:');
    console.log('Current URL:', url);
    console.log('Page Title:', title);

    // Check for specific elements
    const hasHeader = await page.locator('h1:has-text("Gestione Cassetti")').count() > 0;
    const hasSearch = await page.locator('input[placeholder*="Cerca"]').count() > 0;
    const hasDrawerList = await page.locator('button:has-text("scomparti")').count() > 0;

    console.log('\n✓ Has "Gestione Cassetti" header:', hasHeader);
    console.log('✓ Has search input:', hasSearch);
    console.log('✓ Has drawer list:', hasDrawerList);

    // Screenshot
    await page.screenshot({
      path: './final-drawer-test.png',
      fullPage: true
    });
    console.log('\n📸 Screenshot saved: final-drawer-test.png');

    console.log('\n👀 Keeping browser open for 60 seconds...\n');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: './final-drawer-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Done!\n');
  }
})();
