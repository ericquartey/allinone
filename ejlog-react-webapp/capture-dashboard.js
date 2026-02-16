const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Avvio cattura screenshot dashboard...\n');

  // Crea cartella screenshots
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📱 Apertura pagina login...');
    await page.goto('http://localhost:3004/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot login page
    await page.screenshot({
      path: path.join(screenshotsDir, '01-login-page.png'),
      fullPage: true
    });
    console.log('✅ Screenshot login salvato: 01-login-page.png\n');

    // Compila form
    console.log('🔐 Compilazione form di login...');
    await page.fill('input[name="username"], input[type="text"]', 'superuser');
    await page.fill('input[name="password"], input[type="password"]', 'promag27');
    await page.waitForTimeout(500);

    // Screenshot form compilato
    await page.screenshot({
      path: path.join(screenshotsDir, '02-login-filled.png'),
      fullPage: true
    });
    console.log('✅ Screenshot form compilato: 02-login-filled.png\n');

    // Click login
    console.log('👆 Click su bottone login...');
    await page.click('button[type="submit"]');

    // Aspetta redirect
    await page.waitForTimeout(3000);

    console.log('📊 Caricamento dashboard...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot dashboard completo
    await page.screenshot({
      path: path.join(screenshotsDir, '03-dashboard-full.png'),
      fullPage: true
    });
    console.log('✅ Screenshot dashboard completo: 03-dashboard-full.png\n');

    // Cerca hero banner
    try {
      const heroBanner = page.locator('div').filter({ hasText: 'Benvenuto' }).first();
      if (await heroBanner.isVisible()) {
        await heroBanner.screenshot({
          path: path.join(screenshotsDir, '04-hero-banner.png')
        });
        console.log('✅ Screenshot hero banner: 04-hero-banner.png\n');
      }
    } catch (e) {
      console.log('⚠️  Hero banner non trovato, skip screenshot\n');
    }

    // Verifica contenuto
    const bodyText = await page.textContent('body');
    if (bodyText.includes('superuser')) {
      console.log('✅ Utente "superuser" trovato nella pagina!\n');
    }
    if (bodyText.includes('Amministratore') || bodyText.includes('ADMIN')) {
      console.log('✅ Ruolo amministratore trovato!\n');
    }

    console.log('🎉 Cattura completata con successo!');
    console.log(`📁 Screenshots salvati in: ${screenshotsDir}\n`);

    // Lista files
    const files = fs.readdirSync(screenshotsDir);
    console.log('📸 Screenshots disponibili:');
    files.forEach(f => console.log(`   - ${f}`));

  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
    console.log('\n✅ Browser chiuso');
  }
})();
