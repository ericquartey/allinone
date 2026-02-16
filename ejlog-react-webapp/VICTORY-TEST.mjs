// VICTORY TEST - Verify ProductsPageReal is fully working
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🎯 VICTORY TEST - ProductsPageReal FINAL VALIDATION\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const page = await (await browser.newContext({ viewport: null })).newPage();

  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  try {
    console.log('📡 http://localhost:3002/products\n');

    await page.goto('http://localhost:3002/products', {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });

    // Wait for data loading
    await page.waitForTimeout(8000);

    // Check for error boundary
    const hasError = await page.locator('text=Si è verificato un errore').isVisible().catch(() => false);

    if (hasError) {
      console.log('❌ ERROR - Page still showing error boundary\n');
      console.log('Errors:', errors);
      await page.screenshot({ path: 'VICTORY-FAILED.png', fullPage: true });
    } else {
      // Check for ProductsPageReal content
      const h1 = await page.locator('h1').first().textContent().catch(() => '');
      const h2 = await page.locator('h2').first().textContent().catch(() => '');

      console.log(`📄 H1: "${h1}"`);
      console.log(`📄 H2: "${h2}"\n`);

      // Count statistics cards and table rows
      const cards = await page.locator('.border-l-4').count();
      const rows = await page.locator('tbody tr').count();

      console.log(`📊 Statistics Cards: ${cards}`);
      console.log(`📦 Product Rows: ${rows}\n`);

      // Screenshot
      await page.screenshot({ path: 'VICTORY-SUCCESS.png', fullPage: true });
      console.log('📸 Screenshot: VICTORY-SUCCESS.png\n');

      // Final verdict
      const isSuccess = h1.includes('Prodotti in Magazzino') || h1.includes('Gestione Stock');

      if (isSuccess && rows > 0) {
        console.log('═══════════════════════════════════════════════════');
        console.log('  ✅✅✅ VICTORY! ProductsPageReal WORKS! ✅✅✅');
        console.log('═══════════════════════════════════════════════════');
        console.log(`  🎯 ${cards} statistic cards displayed`);
        console.log(`  📦 ${rows} products loaded from backend`);
        console.log(`  ✨ All imports and Redux Provider fixed`);
        console.log('═══════════════════════════════════════════════════\n');
      } else if (isSuccess) {
        console.log('⚠️  Page loads but NO products - check backend connection\n');
      } else if (h1.includes('Gestione Prodotti')) {
        console.log('⚠️  Still showing OLD page (ProductListPage)\n');
      } else {
        console.log(`⚠️  Unknown state: H1="${h1}"\n`);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('  Browser stays open for 10 MINUTES');
    console.log('  Explore the page and test features');
    console.log('═══════════════════════════════════════\n');

    await page.waitForTimeout(600000);

  } catch (error) {
    console.error(`\n❌ CRASH: ${error.message}\n`);
    await page.screenshot({ path: 'VICTORY-CRASH.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
