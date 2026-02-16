import { test, expect } from '@playwright/test';

test.describe('Stock & UDC Pages - Data Diagnosis', () => {
  test('should diagnose Stock page data loading', async ({ page }) => {
    const consoleMessages: string[] = [];
    const apiCalls: { url: string, status: number, response?: any }[] = [];

    // Intercetta tutti i messaggi console
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Intercetta tutte le chiamate API
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        try {
          const responseBody = await response.text();
          apiCalls.push({
            url,
            status: response.status(),
            response: responseBody
          });
        } catch (e) {
          apiCalls.push({ url, status: response.status() });
        }
      }
    });

    // Vai alla pagina Stock
    await page.goto('http://localhost:8080/stock');
    await page.waitForLoadState('networkidle');

    // Screenshot iniziale
    await page.screenshot({ path: 'tests/e2e/screenshots/stock-initial.png', fullPage: true });

    console.log('=== STOCK PAGE - INITIAL STATE ===');
    const hasSearchButton = await page.locator('button:has-text("Cerca")').count();
    console.log('Search button found:', hasSearchButton);

    // Prova a cercare con un filtro vuoto
    if (hasSearchButton > 0) {
      await page.locator('button:has-text("Cerca")').first().click();
      await page.waitForTimeout(3000);

      // Screenshot dopo ricerca
      await page.screenshot({ path: 'tests/e2e/screenshots/stock-after-search.png', fullPage: true });

      const tableRows = await page.locator('tbody tr').count();
      console.log('Table rows after search:', tableRows);
    }

    // Log chiamate API Stock
    console.log('\n=== STOCK API CALLS ===');
    apiCalls.filter(call => call.url.includes('stock')).forEach(call => {
      console.log(`URL: ${call.url}`);
      console.log(`Status: ${call.status}`);
      console.log(`Response: ${call.response?.substring(0, 500)}`);
    });
  });

  test('should diagnose UDC page data loading', async ({ page }) => {
    const consoleMessages: string[] = [];
    const apiCalls: { url: string, status: number, response?: any }[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        try {
          const responseBody = await response.text();
          apiCalls.push({
            url,
            status: response.status(),
            response: responseBody
          });
        } catch (e) {
          apiCalls.push({ url, status: response.status() });
        }
      }
    });

    // Vai alla pagina UDC
    await page.goto('http://localhost:8080/udc');
    await page.waitForLoadState('networkidle');

    // Screenshot UDC
    await page.screenshot({ path: 'tests/e2e/screenshots/udc-page.png', fullPage: true });

    console.log('\n=== UDC PAGE - STATE ===');
    const pageTitle = await page.locator('h4, h5, h6').first().textContent();
    console.log('Page title:', pageTitle);

    const tableRows = await page.locator('tbody tr').count();
    console.log('Table rows:', tableRows);

    const searchButton = await page.locator('button:has-text("Cerca")').count();
    console.log('Search button:', searchButton);

    // Log chiamate API UDC
    console.log('\n=== UDC API CALLS ===');
    apiCalls.filter(call => call.url.includes('udc') || call.url.includes('tray') || call.url.includes('cassett')).forEach(call => {
      console.log(`URL: ${call.url}`);
      console.log(`Status: ${call.status}`);
      console.log(`Response: ${call.response?.substring(0, 500)}`);
    });

    // Log errori console
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.filter(msg => msg.includes('error') || msg.includes('Error')).forEach(msg => {
      console.log(msg);
    });
  });
});
