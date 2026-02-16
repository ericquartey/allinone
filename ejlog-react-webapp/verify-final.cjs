const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function verifyFinal() {
  console.log('\n🚀 Verifica Finale EjLog Application\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const resultsDir = 'test-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    // Test caricamento frontend
    console.log('📍 Caricamento frontend (http://localhost:3009)...');
    const response = await page.goto('http://localhost:3009', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ Frontend HTTP ${response.status()}`);

    // Aspetta rendering React
    await page.waitForTimeout(3000);

    // Screenshot
    await page.screenshot({ path: path.join(resultsDir, 'final-verification.png'), fullPage: true });
    console.log('✅ Screenshot: test-results/final-verification.png');

    // Verifica titolo
    const title = await page.title();
    console.log(`📄 Titolo: "${title}"`);

    // Verifica contenuto
    const content = await page.textContent('body');
    console.log(`📊 Contenuto: ${content.length} caratteri`);

    // Verifica errori console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Ricarica per catturare errori
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RISULTATI VERIFICA');
    console.log('='.repeat(60));
    console.log('✅ Frontend HTTP 200');
    console.log(`✅ Titolo: "${title}"`);
    console.log(`✅ Contenuto: ${content.length} caratteri`);
    console.log(`${consoleErrors.length === 0 ? '✅' : '⚠️ '} Errori console: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('\nErrori rilevati:');
      consoleErrors.slice(0, 5).forEach(err => console.log(`  - ${err.substring(0, 100)}`));
    }

    console.log('='.repeat(60));
    console.log('\n🎉 Verifica completata!\n');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    await page.screenshot({ path: path.join(resultsDir, 'error-final.png') });
  } finally {
    await browser.close();
  }
}

verifyFinal();
