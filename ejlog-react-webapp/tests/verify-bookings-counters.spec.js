/**
 * Test per verificare la visibilità delle prenotazioni e dei counter
 * nella pagina dell'applicazione EjLog
 */

const { test, expect } = require('@playwright/test');

test.describe('Verifica Prenotazioni e Counter', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla homepage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Dovrebbe mostrare la dashboard con i counter', async ({ page }) => {
    console.log('\n=== TEST: Dashboard e Counter ===');

    // Prendi screenshot iniziale
    await page.screenshot({
      path: 'screenshots/dashboard-initial.png',
      fullPage: true
    });

    // Verifica che la pagina sia caricata
    const title = await page.title();
    console.log('Page title:', title);

    // Cerca i counter principali
    const counterSelectors = [
      '[data-testid*="counter"]',
      '[class*="counter"]',
      '[class*="Counter"]',
      '[class*="stat"]',
      '[class*="metric"]',
      'div[class*="card"]',
      '.dashboard-card',
      '.stat-card'
    ];

    console.log('\n--- Ricerca Counter ---');
    for (const selector of counterSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        console.log(`✓ Trovati ${elements.length} elementi con selector: ${selector}`);
        for (let i = 0; i < Math.min(3, elements.length); i++) {
          const text = await elements[i].textContent();
          const isVisible = await elements[i].isVisible();
          console.log(`  [${i}] Visibile: ${isVisible}, Testo: "${text?.trim().substring(0, 50)}"`);
        }
      }
    }

    // Verifica presenza di numeri (indicativi di counter)
    const bodyText = await page.textContent('body');
    const numbers = bodyText.match(/\d+/g);
    console.log(`\n--- Numeri trovati nella pagina: ${numbers ? numbers.length : 0} ---`);
    if (numbers && numbers.length > 0) {
      console.log('Primi 10 numeri:', numbers.slice(0, 10).join(', '));
    }
  });

  test('Dovrebbe mostrare le prenotazioni (reservations/bookings)', async ({ page }) => {
    console.log('\n=== TEST: Prenotazioni ===');

    // Cerca link/pulsanti per prenotazioni
    const bookingLinks = [
      'text=/prenotazioni/i',
      'text=/reservations/i',
      'text=/bookings/i',
      'a[href*="reservation"]',
      'a[href*="booking"]',
      'a[href*="prenotaz"]'
    ];

    console.log('\n--- Ricerca link prenotazioni ---');
    for (const selector of bookingLinks) {
      try {
        const link = page.locator(selector).first();
        if (await link.count() > 0) {
          const text = await link.textContent();
          const href = await link.getAttribute('href');
          console.log(`✓ Trovato link: "${text?.trim()}" -> ${href}`);

          // Clicca e verifica
          await link.click();
          await page.waitForLoadState('networkidle');

          const url = page.url();
          console.log(`  Navigato a: ${url}`);

          // Prendi screenshot
          await page.screenshot({
            path: 'screenshots/prenotazioni-page.png',
            fullPage: true
          });

          // Cerca tabelle o liste
          const tables = await page.locator('table').count();
          const lists = await page.locator('ul, ol').count();
          console.log(`  Tabelle trovate: ${tables}`);
          console.log(`  Liste trovate: ${lists}`);

          break;
        }
      } catch (e) {
        // Continua con il prossimo selector
      }
    }

    // Verifica se ci sono API calls per prenotazioni
    console.log('\n--- Intercetta chiamate API ---');
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('reservation') || url.includes('booking') || url.includes('prenotaz')) {
        console.log(`✓ API call: ${url}`);
        console.log(`  Status: ${response.status()}`);
        try {
          const json = await response.json();
          console.log(`  Response:`, JSON.stringify(json).substring(0, 200));
        } catch (e) {
          // Not JSON
        }
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('Analisi completa della pagina corrente', async ({ page }) => {
    console.log('\n=== ANALISI COMPLETA PAGINA ===');

    // 1. Informazioni base
    const url = page.url();
    const title = await page.title();
    console.log(`\nURL: ${url}`);
    console.log(`Title: ${title}`);

    // 2. Tutti i link visibili
    console.log('\n--- Link Visibili ---');
    const links = await page.locator('a').all();
    for (const link of links.slice(0, 20)) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      const isVisible = await link.isVisible();
      if (isVisible) {
        console.log(`${text?.trim()} -> ${href}`);
      }
    }

    // 3. Tutti gli heading
    console.log('\n--- Headings ---');
    const headings = await page.locator('h1, h2, h3, h4').all();
    for (const h of headings) {
      const tag = await h.evaluate(el => el.tagName);
      const text = await h.textContent();
      console.log(`${tag}: ${text?.trim()}`);
    }

    // 4. Network requests
    console.log('\n--- Network Requests ---');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('localhost:3077') || request.url().includes('localhost:3079')) {
        requests.push(request.url());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('API Calls rilevate:');
    requests.forEach(req => console.log(`  - ${req}`));

    // 5. Console errors
    console.log('\n--- Console Messages ---');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ ERROR: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`⚠️  WARNING: ${msg.text()}`);
      }
    });

    // 6. Screenshot finale
    await page.screenshot({
      path: 'screenshots/analisi-completa.png',
      fullPage: true
    });

    console.log('\n✓ Screenshot salvato in screenshots/analisi-completa.png');
  });

  test('Verifica specifiche per counter e metriche', async ({ page }) => {
    console.log('\n=== VERIFICA COUNTER E METRICHE ===');

    // Aspetta che i componenti si carichino
    await page.waitForTimeout(3000);

    // Cerca pattern comuni per counter/statistiche
    const patterns = [
      { selector: 'div:has-text("Totale")', name: 'Totale' },
      { selector: 'div:has-text("Attiv")', name: 'Attivi' },
      { selector: 'div:has-text("Complet")', name: 'Completati' },
      { selector: 'div:has-text("Pending")', name: 'In attesa' },
      { selector: 'div:has-text("Liste")', name: 'Liste' },
      { selector: 'div:has-text("Operazioni")', name: 'Operazioni' },
      { selector: 'div:has-text("Prenotaz")', name: 'Prenotazioni' },
    ];

    console.log('\n--- Counter per categoria ---');
    for (const pattern of patterns) {
      try {
        const elements = await page.locator(pattern.selector).all();
        if (elements.length > 0) {
          console.log(`\n${pattern.name}:`);
          for (let i = 0; i < Math.min(3, elements.length); i++) {
            const text = await elements[i].textContent();
            const isVisible = await elements[i].isVisible();
            if (isVisible) {
              console.log(`  - ${text?.trim()}`);
            }
          }
        }
      } catch (e) {
        // Continua
      }
    }

    // Cerca tutti gli elementi con numeri grandi (probabili counter)
    console.log('\n--- Elementi con numeri ---');
    const allText = await page.locator('body *').allTextContents();
    const withNumbers = allText.filter(t => /\b\d{1,5}\b/.test(t));
    withNumbers.slice(0, 15).forEach(t => {
      console.log(`  - ${t.trim().substring(0, 80)}`);
    });
  });
});

