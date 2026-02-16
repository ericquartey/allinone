// @ts-check
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3009';

test.describe('Debug Test', () => {
  test('Check what is actually rendering', async ({ page }) => {
    // Cattura errori console
    const consoleMessages = [];
    const errors = [];

    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Vai alla pagina e aspetta un po'
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });

    // Aspetta 5 secondi per sicurezza
    await page.waitForTimeout(5000);

    // Ottieni l'HTML del body
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('=== BODY HTML ===');
    console.log(bodyHTML.substring(0, 1000));

    // Verifica se ci sono errori
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== PAGE ERRORS ===');
    errors.forEach(err => console.log(err));

    // Prova a trovare il root div
    const rootDiv = await page.locator('#root').innerHTML().catch(() => 'NOT FOUND');
    console.log('\n=== ROOT DIV CONTENT ===');
    console.log(rootDiv);

    // Cerca h1
    const h1Count = await page.locator('h1').count();
    console.log(`\n=== H1 COUNT: ${h1Count} ===`);

    // Se esiste h1, mostralo
    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`H1 TEXT: ${h1Text}`);
    }
  });
});
