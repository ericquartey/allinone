import { test, expect } from '@playwright/test';

test.describe('Debug Gestione Cassetti', () => {
  test('Verifica caricamento pagina e errori API', async ({ page }) => {
    // Intercetta tutte le richieste API
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    // Cattura richieste API
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
        console.log(`[API REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    // Cattura risposte API
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const url = response.url();
        let body = null;

        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            body = await response.json();
          } else {
            body = await response.text();
          }
        } catch (e) {
          body = `[Cannot parse response: ${e}]`;
        }

        apiResponses.push({
          url,
          status,
          body
        });

        console.log(`[API RESPONSE] ${status} ${url}`);
        if (status >= 400) {
          console.error(`[API ERROR] ${status} ${url}:`, body);
        }
      }
    });

    // Cattura messaggi console
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${text}`);
    });

    // Cattura errori JavaScript
    page.on('pageerror', error => {
      const errorMsg = error.toString();
      errors.push(errorMsg);
      console.error(`[PAGE ERROR] ${errorMsg}`);
    });

    // Naviga alla pagina Gestione Cassetti
    console.log('\n📍 Navigating to Gestione Cassetti...\n');
    await page.goto('http://localhost:8080/drawers', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Attendi un po' per far caricare tutto
    await page.waitForTimeout(3000);

    // Screenshot della pagina
    await page.screenshot({
      path: 'C:/F_WMS/dev/workspacesEjlog/EjLog/documentazioni/ejlog-react-webapp/screenshots/gestione-cassetti-debug.png',
      fullPage: true
    });

    // Verifica elementi nella pagina
    console.log('\n🔍 Checking page elements...\n');

    const pageTitle = await page.locator('h1').first().textContent();
    console.log(`Page Title: ${pageTitle}`);

    const hasSearchInput = await page.locator('input[placeholder*="Cerca"]').count() > 0;
    console.log(`Has Search Input: ${hasSearchInput}`);

    const drawerListItems = await page.locator('[class*="drawer"]').count();
    console.log(`Drawer List Items Found: ${drawerListItems}`);

    const errorMessages = await page.locator('[class*="error"]').allTextContents();
    console.log(`Error Messages:`, errorMessages);

    const noDataMessages = await page.locator('text=/nessun|non trovato|vuoto/i').allTextContents();
    console.log(`No Data Messages:`, noDataMessages);

    // Verifica stato loading
    const loadingIndicators = await page.locator('[class*="loading"], [class*="spin"]').count();
    console.log(`Loading Indicators: ${loadingIndicators}`);

    // Report finale
    console.log('\n📊 FINAL REPORT\n');
    console.log('=' .repeat(60));

    console.log('\n🌐 API REQUESTS:');
    apiRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });

    console.log('\n📥 API RESPONSES:');
    apiResponses.forEach(res => {
      console.log(`  [${res.status}] ${res.url}`);
      if (res.status >= 400 || res.body) {
        console.log(`    Body:`, JSON.stringify(res.body, null, 2).substring(0, 500));
      }
    });

    console.log('\n💬 CONSOLE MESSAGES (last 10):');
    consoleMessages.slice(-10).forEach(msg => {
      console.log(`  ${msg}`);
    });

    console.log('\n❌ ERRORS:');
    if (errors.length > 0) {
      errors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('  No JavaScript errors detected');
    }

    console.log('\n📸 Screenshot saved to: screenshots/gestione-cassetti-debug.png');
    console.log('=' .repeat(60));

    // Scrivi report su file
    const report = {
      timestamp: new Date().toISOString(),
      pageTitle,
      hasSearchInput,
      drawerListItems,
      errorMessages,
      noDataMessages,
      loadingIndicators,
      apiRequests,
      apiResponses,
      consoleMessages,
      errors
    };

    await page.evaluate((reportData) => {
      console.log('FULL DEBUG REPORT:', JSON.stringify(reportData, null, 2));
    }, report);
  });
});
