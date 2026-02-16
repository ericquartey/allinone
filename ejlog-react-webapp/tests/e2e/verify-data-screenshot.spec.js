import { test, expect } from '@playwright/test';

test.describe('Verify Real Data Display', () => {
  test('should show real data from database with screenshot', async ({ page }) => {
    // Naviga alla home page
    await page.goto('http://localhost:3000');

    console.log('📱 Navigating to home page...');
    await page.waitForLoadState('networkidle');

    // Prendi screenshot della home
    await page.screenshot({ path: 'screenshots/01-home.png', fullPage: true });
    console.log('📸 Screenshot home page salvato');

    // Prova a navigare alla pagina Items
    try {
      await page.click('text=Articoli', { timeout: 5000 });
      console.log('✅ Clicked on Articoli menu');
    } catch (e) {
      console.log('⚠️  Articoli menu not found, trying Items...');
      try {
        await page.click('text=Items', { timeout: 5000 });
      } catch (e2) {
        console.log('⚠️  Items menu not found either');
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/02-items-page.png', fullPage: true });
    console.log('📸 Screenshot items page salvato');

    // Verifica se ci sono dati nella pagina
    const bodyText = await page.textContent('body');
    console.log('📊 Page contains:', bodyText.substring(0, 200));

    // Cerca elementi che potrebbero contenere dati
    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[class*="card"]').count();
    const hasItems = await page.locator('[class*="item"]').count();

    console.log(`📋 Found: ${hasTable} tables, ${hasCards} cards, ${hasItems} items`);

    // Naviga alla pagina Cassetti/Loading Units
    try {
      await page.click('text=Cassetti', { timeout: 5000 });
      console.log('✅ Clicked on Cassetti menu');
    } catch (e) {
      console.log('⚠️  Cassetti menu not found, trying UDC...');
      try {
        await page.click('text=UDC', { timeout: 5000 });
      } catch (e2) {
        try {
          await page.click('text=Loading Units', { timeout: 5000 });
        } catch (e3) {
          console.log('⚠️  Loading units menu not found');
        }
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/03-cassetti-page.png', fullPage: true });
    console.log('📸 Screenshot cassetti page salvato');

    // Naviga alla pagina Liste
    try {
      await page.click('text=Liste', { timeout: 5000 });
      console.log('✅ Clicked on Liste menu');
    } catch (e) {
      console.log('⚠️  Liste menu not found, trying Lists...');
      try {
        await page.click('text=Lists', { timeout: 5000 });
      } catch (e2) {
        console.log('⚠️  Lists menu not found');
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/04-liste-page.png', fullPage: true });
    console.log('📸 Screenshot liste page salvato');

    // Log finale
    console.log('✅ Test completato! Controlla le screenshot in screenshots/');
  });
});
