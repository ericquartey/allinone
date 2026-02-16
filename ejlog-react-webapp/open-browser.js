/**
 * Script semplice per aprire il browser con Playwright
 */
const { chromium } = require('@playwright/test');

const PORT = process.env.PORT || 8080;
const URL = `http://localhost:${PORT}`;

async function openBrowser() {
  console.log(`\n🌐 Apertura browser su ${URL}...\n`);

  try {
    const browser = await chromium.launch({
      headless: false,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled'
      ]
    });

    const context = await browser.newContext({
      viewport: null,
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    console.log('📍 Navigazione in corso...\n');

    await page.goto(URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('✅ Pagina caricata!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Browser aperto con successo!');
    console.log(`📍 URL: ${URL}`);
    console.log('🔧 Il browser rimarrà aperto');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Mantieni il browser aperto indefinitamente
    await new Promise(() => {});

  } catch (error) {
    console.error('\n❌ Errore:', error.message);
    console.error('\n⚠️  Assicurati che il server Vite sia in esecuzione su', URL);
    process.exit(1);
  }
}

openBrowser();
