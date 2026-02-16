// Script per visualizzare la pagina Products con Playwright
import { chromium } from '@playwright/test';

(async () => {
  console.log('🚀 Avvio browser per visualizzare pagina Products...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  console.log('📡 Connessione a http://localhost:3001/products...');

  try {
    // Vai alla pagina Products
    await page.goto('http://localhost:3001/products', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('✅ Pagina caricata!');

    // Aspetta un po' per il rendering
    await page.waitForTimeout(3000);

    // Prendi screenshot
    await page.screenshot({
      path: 'products-page-screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: products-page-screenshot.png');

    // Verifica se ci sono errori visibili
    const errorVisible = await page.locator('text=Errore caricamento').isVisible().catch(() => false);
    if (errorVisible) {
      console.log('⚠️ Rilevato messaggio di errore nella pagina');
    }

    // Conta righe tabella
    const rows = await page.locator('tbody tr').count().catch(() => 0);
    console.log(`📦 Righe tabella: ${rows}`);

    // Conta le cards
    const cards = await page.locator('.border-l-4').count().catch(() => 0);
    console.log(`📊 Cards statistiche: ${cards}`);

    console.log('\n✨ Pagina Products aperta! Tengo il browser aperto per la visualizzazione...');
    console.log('👉 Il browser resterà aperto per 2 minuti, poi si chiuderà automaticamente.');

    // Mantieni il browser aperto
    await page.waitForTimeout(120000); // 2 minuti

  } catch (error) {
    console.error('❌ Errore:', error.message);
    await page.screenshot({ path: 'products-page-error.png' });
    console.log('📸 Screenshot errore salvato: products-page-error.png');
  } finally {
    await browser.close();
    console.log('🔒 Browser chiuso.');
  }
})();
