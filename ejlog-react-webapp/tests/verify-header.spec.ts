import { test, expect } from '@playwright/test';

test.describe('Verifica Header e User Info', () => {
  test('Verifica che header mostri nome utente', async ({ page }) => {
    console.log('\n🔍 Test Header - Verifica nome utente\n');

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    // Screenshot iniziale
    await page.screenshot({ path: 'test-results/header-initial.png' });

    // Cerca elementi nell'header
    const headerText = await page.textContent('header');
    console.log('📄 Contenuto header:', headerText);

    // Verifica presenza user menu
    const userMenuButton = page.locator('button:has(svg.w-8.h-8)').first();
    const isVisible = await userMenuButton.isVisible();
    console.log('👤 User menu button visibile:', isVisible);

    if (isVisible) {
      await userMenuButton.click();
      await page.waitForTimeout(1000);

      // Screenshot con menu aperto
      await page.screenshot({ path: 'test-results/header-menu-open.png' });

      const menuContent = await page.textContent('[class*="absolute"][class*="right-0"]');
      console.log('📋 Contenuto menu dropdown:', menuContent);
    }

    // Verifica store di autenticazione
    const authState = await page.evaluate(() => {
      const storage = localStorage.getItem('ejlog-auth-storage');
      return storage ? JSON.parse(storage) : null;
    });

    console.log('🔐 Auth state:', JSON.stringify(authState, null, 2));
  });
});
