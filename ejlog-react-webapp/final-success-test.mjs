// FINAL SUCCESS TEST - ProductsPageReal after Redux Provider fix
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🎯 FINAL TEST - ProductsPageReal with Redux Provider\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  // Capture errors
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  try {
    console.log('📡 Navigating to http://localhost:3002/products\n');

    await page.goto('http://localhost:3002/products', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for page to load
    await page.waitForTimeout(8000);

    // Check for error boundary
    const hasError = await page.locator('text=Si è verificato un errore').isVisible().catch(() => false);

    if (hasError) {
      console.log('❌ Still showing error boundary');
      console.log('Errors:', errors);
    } else {
      // Check for ProductsPageReal content
      const h1 = await page.locator('h1').first().textContent().catch(() => '');
      const h2 = await page.locator('h2').first().textContent().catch(() => '');

      console.log(`📄 H1: "${h1}"`);
      console.log(`📄 H2: "${h2}"`);

      // Count cards and table rows
      const cards = await page.locator('.border-l-4, .bg-white.rounded-lg.shadow').count();
      const rows = await page.locator('tbody tr').count();

      console.log(`📊 Statistics cards: ${cards}`);
      console.log(`📦 Product rows: ${rows}`);

      // Screenshot
      await page.screenshot({ path: 'FINAL-SUCCESS.png', fullPage: true });
      console.log('\n📸 Screenshot: FINAL-SUCCESS.png');

      // Check if it's the new page
      const isNewPage = h1.includes('Prodotti in Magazzino');
      const isOldPage = h1.includes('Gestione Prodotti');

      if (isNewPage) {
        console.log('\n✅✅✅ SUCCESS! ProductsPageReal is WORKING! ✅✅✅');
        console.log(`   Cards: ${cards}`);
        console.log(`   Rows: ${rows}`);
      } else if (isOldPage) {
        console.log('\n⚠️  Still showing old page (ProductListPage)');
      } else {
        console.log(`\n⚠️  Unknown state: H1="${h1}"`);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  Browser open for 10 MINUTES');
    console.log('  Explore the page freely');
    console.log('═══════════════════════════════════════\n');

    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ ${error.message}\n`);
    await page.screenshot({ path: 'FINAL-ERROR.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
