const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Analisi Layout Dettagliata\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Naviga alla homepage
    await page.goto('http://localhost:3009', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Screenshot iniziale
    await page.screenshot({
      path: 'test-results/layout-analysis.png',
      fullPage: true
    });

    console.log('📸 Screenshot salvato: test-results/layout-analysis.png\n');

    // Misura Sidebar
    const sidebar = await page.locator('aside').first();
    const sidebarBox = await sidebar.boundingBox();

    console.log('📐 SIDEBAR:');
    console.log(`   Position: x=${sidebarBox?.x}px, y=${sidebarBox?.y}px`);
    console.log(`   Size: ${sidebarBox?.width}px × ${sidebarBox?.height}px`);
    console.log(`   Termina a X: ${(sidebarBox?.x || 0) + (sidebarBox?.width || 0)}px`);

    // Misura Header
    const header = await page.locator('header').first();
    const headerBox = await header.boundingBox();

    console.log('\n📐 HEADER:');
    console.log(`   Position: x=${headerBox?.x}px, y=${headerBox?.y}px`);
    console.log(`   Size: ${headerBox?.width}px × ${headerBox?.height}px`);

    // Misura Main Content Container
    const mainContainer = await page.locator('main').first();
    const mainBox = await mainContainer.boundingBox();

    console.log('\n📐 MAIN CONTENT:');
    console.log(`   Position: x=${mainBox?.x}px, y=${mainBox?.y}px`);
    console.log(`   Size: ${mainBox?.width}px × ${mainBox?.height}px`);

    // Misura il container interno di main (con padding)
    const innerContainer = await page.locator('main > div').first();
    const innerBox = await innerContainer.boundingBox();

    console.log('\n📐 INNER CONTAINER (main > div):');
    console.log(`   Position: x=${innerBox?.x}px, y=${innerBox?.y}px`);
    console.log(`   Size: ${innerBox?.width}px × ${innerBox?.height}px`);

    // Cerca testo "Magazzino" o qualsiasi h1/h2
    const headings = await page.locator('h1, h2, h3').all();
    console.log('\n📝 TESTI TROVATI:');

    for (let i = 0; i < Math.min(headings.length, 5); i++) {
      const heading = headings[i];
      const text = await heading.textContent();
      const box = await heading.boundingBox();
      if (box) {
        console.log(`   "${text?.slice(0, 30)}..." → x=${box.x}px, y=${box.y}px`);
      }
    }

    // Calcoli sovrapposizioni
    const sidebarEnd = (sidebarBox?.x || 0) + (sidebarBox?.width || 0);
    const mainStart = mainBox?.x || 0;
    const headerStart = headerBox?.x || 0;
    const innerStart = innerBox?.x || 0;

    console.log('\n🔍 ANALISI SOVRAPPOSIZIONI:');
    console.log(`   Sidebar termina a: ${sidebarEnd}px`);
    console.log(`   Header inizia a: ${headerStart}px`);
    console.log(`   Main inizia a: ${mainStart}px`);
    console.log(`   Inner container inizia a: ${innerStart}px`);

    let hasOverlap = false;

    // Check Header
    if (headerStart < sidebarEnd) {
      const overlap = sidebarEnd - headerStart;
      console.log(`   ❌ SOVRAPPOSIZIONE Header: ${overlap}px`);
      hasOverlap = true;
    } else {
      console.log(`   ✅ Header OK: gap di ${headerStart - sidebarEnd}px`);
    }

    // Check Main
    if (mainStart < sidebarEnd) {
      const overlap = sidebarEnd - mainStart;
      console.log(`   ❌ SOVRAPPOSIZIONE Main: ${overlap}px`);
      hasOverlap = true;
    } else {
      console.log(`   ✅ Main OK: gap di ${mainStart - sidebarEnd}px`);
    }

    // Check Inner Container
    if (innerStart < sidebarEnd) {
      const overlap = sidebarEnd - innerStart;
      console.log(`   ❌ SOVRAPPOSIZIONE Inner Container: ${overlap}px`);
      hasOverlap = true;
    } else {
      console.log(`   ✅ Inner Container OK: gap di ${innerStart - sidebarEnd}px`);
    }

    // Verifica z-index
    const sidebarZIndex = await sidebar.evaluate(el => window.getComputedStyle(el).zIndex);
    const headerZIndex = await header.evaluate(el => window.getComputedStyle(el).zIndex);

    console.log('\n🎨 Z-INDEX:');
    console.log(`   Sidebar: ${sidebarZIndex}`);
    console.log(`   Header: ${headerZIndex}`);

    // Verifica margin-left del container principale
    const appContainer = await page.locator('div.min-h-screen > div').first();
    const marginLeft = await appContainer.evaluate(el => window.getComputedStyle(el).marginLeft);
    const marginLeftComputed = await appContainer.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        marginLeft: styles.marginLeft,
        paddingLeft: styles.paddingLeft,
        position: styles.position,
        left: styles.left
      };
    });

    console.log('\n📏 CONTAINER PRINCIPALE STYLES:');
    console.log(`   margin-left: ${marginLeftComputed.marginLeft}`);
    console.log(`   padding-left: ${marginLeftComputed.paddingLeft}`);
    console.log(`   position: ${marginLeftComputed.position}`);
    console.log(`   left: ${marginLeftComputed.left}`);

    console.log(`\n${hasOverlap ? '❌ SOVRAPPOSIZIONI RILEVATE!' : '✅ NESSUNA SOVRAPPOSIZIONE'}`);
    console.log('\n✅ Analisi completata\n');

  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error.message);
  } finally {
    await browser.close();
  }
})();
