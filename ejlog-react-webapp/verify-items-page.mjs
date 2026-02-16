import { chromium } from '@playwright/test';

(async () => {
  console.log('🔍 Verifico la pagina Items su http://localhost:3003...\n');

  const browser = await chromium.launch({ headless: false });
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

  // Cattura richieste di rete
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('📤 REQUEST:', request.method(), request.url());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      console.log('📥 RESPONSE:', response.status(), response.url());
      try {
        const body = await response.text();
        console.log('   Body preview:', body.substring(0, 200));
      } catch (err) {
        console.log('   (cannot read body)');
      }
    }
  });

  try {
    console.log('📡 Caricamento pagina...');
    await page.goto('http://localhost:3003', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Aspetta che React si carichi
    await page.waitForTimeout(2000);

    console.log('\n🔐 Controllo se c\'è una pagina di login...');
    const loginInput = await page.locator('input[type="text"], input[type="password"]').count();

    if (loginInput > 0) {
      console.log('✅ Trovata pagina di login. Tento il login...');

      // Prova login con superuser
      await page.fill('input[type="text"]', 'superuser');
      await page.fill('input[type="password"]', 'superuser');

      console.log('🔑 Cliccando su Login...');
      await page.click('button[type="submit"]');

      // Aspetta il caricamento dopo login
      await page.waitForTimeout(3000);

      console.log('✅ Login completato. Navigando alla pagina Items...');
    }

    // Naviga alla pagina Items
    console.log('\n📦 Navigando alla pagina Items...');

    // Cerca il link/menu Items
    const itemsLink = page.locator('text=/articoli|items|products/i').first();
    const itemsLinkCount = await itemsLink.count();

    if (itemsLinkCount > 0) {
      console.log('✅ Link Items trovato, cliccando...');
      await itemsLink.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('⚠️  Link Items non trovato, provo a navigare direttamente...');
      await page.goto('http://localhost:3003/items');
      await page.waitForTimeout(2000);
    }

    console.log('\n📸 Screenshot della pagina Items salvato come: items-page-verification.png');
    await page.screenshot({
      path: 'items-page-verification.png',
      fullPage: true
    });

    // Verifica URL corrente
    const currentUrl = page.url();
    console.log('\n🔗 URL corrente:', currentUrl);

    // Verifica titolo
    const title = await page.title();
    console.log('📄 Titolo pagina:', title);

    // Conta elementi nella lista
    const listItems = await page.locator('[role="row"], .item-row, .product-row, li').count();
    console.log('\n📊 Elementi lista trovati:', listItems);

    // Cerca tabelle
    const tables = await page.locator('table').count();
    console.log('📋 Tabelle trovate:', tables);

    // Cerca messaggi di errore
    const errorMessages = await page.locator('text=/error|errore|nessun|empty|no items|no data/i').count();
    console.log('⚠️  Messaggi errore/vuoto trovati:', errorMessages);

    // Estrai il testo visibile
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n📝 Contenuto visibile pagina Items (primi 800 caratteri):');
    console.log(bodyText.substring(0, 800));

    // Verifica se ci sono richieste API in attesa
    console.log('\n⏳ Aspetto eventuali richieste API...');
    await page.waitForTimeout(3000);

    console.log('\n✅ Verifica completata!');

  } catch (error) {
    console.error('\n❌ ERRORE durante la verifica:', error.message);
  } finally {
    console.log('\n⏸️  Browser rimane aperto per ispezione manuale...');
    console.log('   Premi CTRL+C per chiudere');

    // Mantieni il browser aperto
    await new Promise(() => {});
  }
})();
