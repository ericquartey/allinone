const { test, expect } = require('@playwright/test');

test('Verifica sovrapposizioni menu e contenuto', async ({ page }) => {
  console.log('🔍 Verifica Sovrapposizioni Menu\n');

  // Naviga alla homepage
  await page.goto('http://localhost:3009', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot iniziale
  await page.screenshot({
    path: 'test-results/overlap-check-initial.png',
    fullPage: true
  });
  console.log('✅ Screenshot iniziale salvato');

  // Misura sidebar
  const sidebar = await page.locator('aside').first();
  const sidebarBox = await sidebar.boundingBox();
  console.log(`\n📏 Sidebar:`);
  console.log(`   X: ${sidebarBox?.x}px`);
  console.log(`   Width: ${sidebarBox?.width}px`);
  console.log(`   Termina a: ${(sidebarBox?.x || 0) + (sidebarBox?.width || 0)}px`);

  // Misura header
  const header = await page.locator('header').first();
  const headerBox = await header.boundingBox();
  console.log(`\n📏 Header:`);
  console.log(`   X: ${headerBox?.x}px`);
  console.log(`   Width: ${headerBox?.width}px`);

  // Misura main content
  const main = await page.locator('main').first();
  const mainBox = await main.boundingBox();
  console.log(`\n📏 Main Content:`);
  console.log(`   X: ${mainBox?.x}px`);
  console.log(`   Width: ${mainBox?.width}px`);

  // Cerca il testo "Dashboard" o "EjLog WMS"
  const dashboardText = await page.locator('h1, h2, h3').filter({ hasText: /dashboard/i }).first();
  let dashboardBox = null;

  try {
    dashboardBox = await dashboardText.boundingBox();
    if (dashboardBox) {
      console.log(`\n📏 Testo Dashboard:`);
      console.log(`   X: ${dashboardBox.x}px`);
      console.log(`   Y: ${dashboardBox.y}px`);
    }
  } catch (e) {
    console.log('\n⚠️  Testo Dashboard non trovato direttamente');
  }

  // Verifica sovrapposizione
  const sidebarEnd = (sidebarBox?.x || 0) + (sidebarBox?.width || 0);
  const mainStart = mainBox?.x || 0;
  const headerStart = headerBox?.x || 0;

  console.log(`\n🔍 Analisi Sovrapposizioni:`);
  console.log(`   Sidebar termina a: ${sidebarEnd}px`);
  console.log(`   Main inizia a: ${mainStart}px`);
  console.log(`   Header inizia a: ${headerStart}px`);

  // Check overlaps
  let hasOverlap = false;

  if (mainStart < sidebarEnd) {
    const overlap = sidebarEnd - mainStart;
    console.log(`   ❌ SOVRAPPOSIZIONE Main: ${overlap}px`);
    hasOverlap = true;
  } else {
    console.log(`   ✅ Main OK: gap di ${mainStart - sidebarEnd}px`);
  }

  if (headerStart < sidebarEnd) {
    const overlap = sidebarEnd - headerStart;
    console.log(`   ❌ SOVRAPPOSIZIONE Header: ${overlap}px`);
    hasOverlap = true;
  } else {
    console.log(`   ✅ Header OK: gap di ${headerStart - sidebarEnd}px`);
  }

  if (dashboardBox && dashboardBox.x < sidebarEnd) {
    const overlap = sidebarEnd - dashboardBox.x;
    console.log(`   ❌ SOVRAPPOSIZIONE Testo Dashboard: ${overlap}px`);
    hasOverlap = true;
  } else if (dashboardBox) {
    console.log(`   ✅ Testo Dashboard OK: gap di ${dashboardBox.x - sidebarEnd}px`);
  }

  // Screenshot finale con evidenziazione
  await page.screenshot({
    path: 'test-results/overlap-check-final.png',
    fullPage: true
  });

  console.log(`\n${hasOverlap ? '❌ PROBLEMI RILEVATI' : '✅ TUTTO OK'}`);
  console.log('\n📸 Screenshots salvati in test-results/');
});
