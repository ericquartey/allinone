import { chromium } from '@playwright/test';

(async () => {
  console.log('🔍 Verifico la pagina su http://localhost:3000...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Cattura console logs
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}]`, msg.text());
  });

  // Cattura errori
  page.on('pageerror', error => {
    console.error('❌ [PAGE ERROR]', error.message);
  });

  try {
    console.log('📡 Caricamento pagina...');
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Aspetta che React si carichi
    await page.waitForTimeout(2000);

    console.log('\n📸 Screenshot salvato come: page-verification.png');
    await page.screenshot({
      path: 'page-verification.png',
      fullPage: true
    });

    // Verifica titolo
    const title = await page.title();
    console.log('\n📄 Titolo pagina:', title);

    // Verifica contenuto body
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n📝 Contenuto visibile (primi 500 caratteri):');
    console.log(bodyText.substring(0, 500));

    // Verifica root element
    const rootExists = await page.locator('#root').count();
    console.log('\n🔍 Elemento #root trovato:', rootExists > 0 ? '✅ SI' : '❌ NO');

    // Verifica se ci sono errori visibili
    const errorMessages = await page.locator('text=/error|errore/i').count();
    console.log('⚠️  Messaggi di errore trovati:', errorMessages);

    // Verifica URL corrente (potrebbe esserci redirect)
    const currentUrl = page.url();
    console.log('\n🔗 URL corrente:', currentUrl);

    // Controlla se c'è una pagina di login
    const loginForm = await page.locator('input[type="text"], input[type="email"], input[type="password"]').count();
    if (loginForm > 0) {
      console.log('🔐 RILEVATO: Pagina di login (contiene campi input)');
    }

    // Controlla il DOM
    const htmlContent = await page.content();
    const hasReactRoot = htmlContent.includes('id="root"');
    console.log('\n🏗️  React root nel DOM:', hasReactRoot ? '✅ SI' : '❌ NO');

    console.log('\n✅ Verifica completata!');

  } catch (error) {
    console.error('\n❌ ERRORE durante la verifica:', error.message);
  } finally {
    await browser.close();
  }
})();
