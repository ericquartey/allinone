import { test, expect } from '@playwright/test';

test.describe('Stock Page - Error Check', () => {
  test('should load Stock page and check for errors', async ({ page }) => {
    // Intercetta errori console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Intercetta errori pagina
    const pageErrors: Error[] = [];
    page.on('pageerror', error => {
      pageErrors.push(error);
    });

    // Vai alla pagina Stock
    await page.goto('http://localhost:8080/stock');

    // Attendi che la pagina sia caricata
    await page.waitForLoadState('networkidle');

    // Screenshot della pagina
    await page.screenshot({ path: 'tests/e2e/screenshots/stock-page-error.png', fullPage: true });

    // Verifica presenza elementi principali
    const title = await page.locator('h4:has-text("Giacenze Magazzino")').count();
    console.log('Title found:', title);

    const accordion = await page.locator('text=Filtri di Ricerca').count();
    console.log('Accordion found:', accordion);

    const searchButton = await page.locator('button:has-text("Cerca")').count();
    console.log('Search button found:', searchButton);

    // Log errori
    if (consoleErrors.length > 0) {
      console.log('=== CONSOLE ERRORS ===');
      consoleErrors.forEach(err => console.log(err));
    }

    if (pageErrors.length > 0) {
      console.log('=== PAGE ERRORS ===');
      pageErrors.forEach(err => console.log(err.message, err.stack));
    }

    // Ottieni tutto il contenuto HTML per debug
    const bodyText = await page.locator('body').textContent();
    console.log('=== PAGE CONTENT ===');
    console.log(bodyText?.substring(0, 500));
  });
});
