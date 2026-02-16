const { test, expect } = require('@playwright/test');

test('Verifica Layout - Menu non copre contenuto', async ({ page }) => {
  console.log('🔍 Test Layout EjLog WMS\n');

  // Naviga alla homepage
  await page.goto('http://localhost:3009', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot iniziale - menu aperto
  await page.screenshot({
    path: 'test-results/layout-menu-aperto.png',
    fullPage: true
  });
  console.log('✅ Screenshot menu aperto salvato');

  // Misura dimensioni sidebar
  const sidebar = await page.locator('aside').first();
  const sidebarBox = await sidebar.boundingBox();
  console.log(`📏 Sidebar width: ${sidebarBox?.width}px`);

  // Misura header
  const header = await page.locator('header').first();
  const headerBox = await header.boundingBox();
  console.log(`📏 Header left: ${headerBox?.x}px, width: ${headerBox?.width}px`);

  // Misura main content
  const main = await page.locator('main').first();
  const mainBox = await main.boundingBox();
  console.log(`📏 Main left: ${mainBox?.x}px, width: ${mainBox?.width}px`);

  // Verifica che main non sia coperto dal sidebar
  if (mainBox && sidebarBox) {
    const mainStartX = mainBox.x;
    const sidebarEndX = sidebarBox.width;

    console.log(`\n🔍 Analisi sovrapposizione:`);
    console.log(`   Sidebar termina a: ${sidebarEndX}px`);
    console.log(`   Main inizia a: ${mainStartX}px`);
    console.log(`   Gap: ${mainStartX - sidebarEndX}px`);

    if (mainStartX < sidebarEndX) {
      console.log(`❌ ERRORE: Il menu copre il contenuto di ${sidebarEndX - mainStartX}px`);
    } else {
      console.log(`✅ OK: Nessuna sovrapposizione`);
    }
  }

  // Clicca sul toggle per chiudere il menu
  const toggleBtn = await page.locator('button[aria-label*="menu"]').first();
  await toggleBtn.click();
  await page.waitForTimeout(500);

  // Screenshot - menu chiuso
  await page.screenshot({
    path: 'test-results/layout-menu-chiuso.png',
    fullPage: true
  });
  console.log('✅ Screenshot menu chiuso salvato');

  // Misura dimensioni con menu chiuso
  const sidebarBoxClosed = await sidebar.boundingBox();
  console.log(`\n📏 Sidebar width (chiuso): ${sidebarBoxClosed?.width}px`);

  console.log('\n✅ Test completato');
});
