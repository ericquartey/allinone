// ============================================================================
// EJLOG WMS - Debug Homepage Test
// Verifica cosa succede quando si apre http://localhost:3011
// ============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3011';

test.describe('Debug Homepage', () => {

  test('Verifica cosa viene caricato sulla homepage', async ({ page }) => {
    // Cattura errori console
    const consoleMessages = [];
    const consoleErrors = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Cattura errori di rete
    const networkErrors = [];
    page.on('requestfailed', request => {
      networkErrors.push(`${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });

    console.log('\n========================================');
    console.log('APERTURA HOMEPAGE http://localhost:3011');
    console.log('========================================\n');

    // Vai alla homepage
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Aspetta un po' per vedere se c'è qualche redirect
    await page.waitForTimeout(2000);

    // Controlla URL finale
    const finalUrl = page.url();
    console.log(`URL Iniziale: ${BASE_URL}`);
    console.log(`URL Finale:   ${finalUrl}`);
    console.log('');

    // Controlla il titolo della pagina
    const title = await page.title();
    console.log(`Titolo Pagina: "${title}"`);
    console.log('');

    // Prendi screenshot
    await page.screenshot({ path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\screenshot-homepage.png', fullPage: true });
    console.log('Screenshot salvato: screenshot-homepage.png');
    console.log('');

    // Controlla se ci sono elementi h1, h2, h3
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();
    const buttonCount = await page.locator('button').count();
    const inputCount = await page.locator('input').count();

    console.log('Elementi trovati sulla pagina:');
    console.log(`  - H1: ${h1Count}`);
    console.log(`  - H2: ${h2Count}`);
    console.log(`  - H3: ${h3Count}`);
    console.log(`  - Button: ${buttonCount}`);
    console.log(`  - Input: ${inputCount}`);
    console.log('');

    // Mostra i primi h1/h2/h3 trovati
    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`Primo H1: "${h1Text}"`);
    }
    if (h2Count > 0) {
      const h2Text = await page.locator('h2').first().textContent();
      console.log(`Primo H2: "${h2Text}"`);
    }
    if (h3Count > 0) {
      const h3Text = await page.locator('h3').first().textContent();
      console.log(`Primo H3: "${h3Text}"`);
    }
    console.log('');

    // Mostra il body HTML (primi 500 caratteri)
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body HTML (primi 1000 caratteri):');
    console.log(bodyHTML.substring(0, 1000));
    console.log('...');
    console.log('');

    // Mostra errori console
    if (consoleErrors.length > 0) {
      console.log('ERRORI CONSOLE:');
      consoleErrors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    } else {
      console.log('Nessun errore console trovato');
      console.log('');
    }

    // Mostra errori di rete
    if (networkErrors.length > 0) {
      console.log('ERRORI DI RETE:');
      networkErrors.forEach(err => console.log(`  - ${err}`));
      console.log('');
    } else {
      console.log('Nessun errore di rete trovato');
      console.log('');
    }

    // Mostra tutti i messaggi console (ultimi 20)
    console.log('MESSAGGI CONSOLE (ultimi 20):');
    const lastMessages = consoleMessages.slice(-20);
    lastMessages.forEach(msg => console.log(`  ${msg}`));
    console.log('');

    console.log('========================================');
    console.log('FINE DEBUG');
    console.log('========================================\n');

    // Test sempre passa per vedere l'output
    expect(true).toBe(true);
  });

  test('Prova ad accedere alla pagina di login direttamente', async ({ page }) => {
    console.log('\n========================================');
    console.log('APERTURA PAGINA LOGIN /login');
    console.log('========================================\n');

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log(`URL: ${finalUrl}`);

    const h1Count = await page.locator('h1').count();
    console.log(`Elementi H1 trovati: ${h1Count}`);

    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`Testo H1: "${h1Text}"`);
    }

    // Screenshot
    await page.screenshot({ path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\screenshot-login.png', fullPage: true });
    console.log('Screenshot salvato: screenshot-login.png\n');

    expect(true).toBe(true);
  });

  test('Prova ad accedere alla pagina lists-management direttamente', async ({ page }) => {
    console.log('\n========================================');
    console.log('APERTURA PAGINA /lists-management');
    console.log('========================================\n');

    await page.goto(`${BASE_URL}/lists-management`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const finalUrl = page.url();
    console.log(`URL: ${finalUrl}`);

    const h1Count = await page.locator('h1').count();
    console.log(`Elementi H1 trovati: ${h1Count}`);

    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`Testo H1: "${h1Text}"`);
    }

    // Screenshot
    await page.screenshot({ path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\screenshot-lists.png', fullPage: true });
    console.log('Screenshot salvato: screenshot-lists.png\n');

    expect(true).toBe(true);
  });

});
