// Debug script to capture full HTML
const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:3008/lists/management...');

  try {
    await page.goto('http://localhost:3008/lists/management', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Get full HTML
    const html = await page.content();

    // Save to file
    fs.writeFileSync('debug-page.html', html);
    console.log('✓ Full HTML saved to: debug-page.html');

    // Check what's in the main content area
    const mainContent = await page.locator('main').innerHTML().catch(() => '');
    console.log('\n=== MAIN CONTENT (first 500 chars) ===');
    console.log(mainContent.substring(0, 500));

    // Check for React root
    const reactRoot = await page.locator('#root').innerHTML().catch(() => '');
    console.log('\n=== REACT ROOT CONTENT (first 800 chars) ===');
    console.log(reactRoot.substring(0, 800));

    // Look for the actual page title in the DOM
    const pageTitle = await page.locator('h1, h2').allTextContents();
    console.log('\n=== PAGE TITLES ===');
    pageTitle.forEach((title, i) => console.log(`  ${i + 1}. ${title}`));

    // Check if there's a "Crea Nuova Lista" button (old page indicator)
    const hasOldButton = await page.locator('text=Crea Nuova Lista').count() > 0;
    console.log('\n=== OLD PAGE CHECK ===');
    console.log('Has "Crea Nuova Lista" button (OLD PAGE):', hasOldButton);

    // Check for new components
    console.log('\n=== NEW COMPONENTS CHECK ===');
    const components = {
      'ListsSidebar': await page.locator('[class*="sidebar"]').count(),
      'Aggiorna button': await page.locator('text=Aggiorna').count(),
      'Pulisci button': await page.locator('text=Pulisci').count(),
      'Inserisci button': await page.locator('text=Inserisci').count(),
    };

    Object.entries(components).forEach(([name, count]) => {
      console.log(`  ${count > 0 ? '✓' : '✗'} ${name}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  await browser.close();
})();
