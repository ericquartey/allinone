// Test per verificare dati reali CON LOGIN
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';
const TEST_USERNAME = 'admin';
const TEST_PASSWORD = 'admin';

test.describe('Test Dati Reali con Autenticazione', () => {

  test('Login e verifica dati reali Items', async ({ page }) => {
    // 1. Vai alla pagina di login
    console.log('1. Navigazione a login page...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 2. Compila form di login
    console.log('2. Compilazione form login...');
    await page.fill('input[type="text"]', TEST_USERNAME);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // 3. Click sul pulsante di login
    console.log('3. Click su login...');
    await page.click('button[type="submit"]');

    // 4. Aspetta il redirect dopo login
    console.log('4. Aspetto redirect...');
    await page.waitForTimeout(3000);

    console.log(`URL dopo login: ${page.url()}`);

    // 5. Vai alla pagina items
    console.log('5. Navigazione a items list...');
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 6. Fai screenshot
    await page.screenshot({
      path: 'test-results/items-with-real-data-logged-in.png',
      fullPage: true
    });

    // 7. Verifica che ci sia contenuto
    const bodyText = await page.textContent('body');
    console.log(`Lunghezza contenuto pagina: ${bodyText.length}`);

    // 8. Stampa parte del contenuto per debugging
    console.log('Prime 500 caratteri della pagina:', bodyText.substring(0, 500));

    // Verifica che ci sia contenuto sostanziale
    expect(bodyText.length).toBeGreaterThan(500);

    console.log('✅ Test completato - Screenshot salvato in test-results/');
  });

  test('Login e verifica dati reali Products/UDC', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="text"]', TEST_USERNAME);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Prova diversi percorsi per prodotti/UDC
    const routes = [
      '/items-list',
      '/udc',
      '/products',
      '/master-data/products'
    ];

    for (const route of routes) {
      try {
        console.log(`\nTestando route: ${route}`);
        await page.goto(`${BASE_URL}${route}`, { timeout: 10000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await page.waitForTimeout(1000);

        const content = await page.textContent('body');
        console.log(`  Lunghezza contenuto: ${content.length}`);

        if (content.length > 500) {
          await page.screenshot({
            path: `test-results/real-data-${route.replace(/\//g, '-')}.png`,
            fullPage: true
          });
          console.log(`  ✅ Screenshot salvato per ${route}`);
        }
      } catch (error) {
        console.log(`  ⚠ Route ${route} non disponibile: ${error.message}`);
      }
    }
  });

});
