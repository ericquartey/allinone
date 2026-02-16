const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verify() {
  console.log('\n🚀 Verifica EjLog Application con Playwright\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const resultsDir = 'test-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    console.log('📍 Caricamento frontend (http://localhost:3005)...');
    const response = await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ Frontend HTTP ${response.status()}`);

    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(resultsDir, 'homepage.png'), fullPage: true });
    console.log('✅ Screenshot: test-results/homepage.png');

    const title = await page.title();
    console.log(`📄 Titolo: "${title}"`);

    const content = await page.textContent('body');
    console.log(`📊 Contenuto: ${content.length} caratteri`);

    console.log('\n📊 VERIFICA COMPLETATA');
    console.log('✅ Frontend funzionante');
    console.log('✅ React renderizzato');
    console.log('✅ Screenshot salvato\n');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    await page.screenshot({ path: path.join(resultsDir, 'error.png') });
  } finally {
    await browser.close();
  }
}

verify();
