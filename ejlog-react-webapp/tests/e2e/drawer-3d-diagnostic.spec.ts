import { test, expect } from '@playwright/test';

test.describe('Diagnostica Vista 3D Cassetto', () => {
  test('verifica posizioni compartimenti rispetto al frame cassetto', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Login
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', 'superuser');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Vai a Gestione Cassetti
    await page.click('text=MAGAZZINO');
    await page.click('text=Gestione Cassetti');
    await page.waitForURL('**/drawers');

    console.log('✅ Pagina Gestione Cassetti caricata');

    // Seleziona primo cassetto (1001)
    await page.click('text=1001');
    await page.waitForTimeout(1000);

    console.log('✅ Cassetto 1001 selezionato');

    // Clicca su Vista 3D
    const vista3DButton = page.locator('button:has-text("Vista 3D")');
    if (await vista3DButton.isVisible()) {
      await vista3DButton.click();
      await page.waitForTimeout(2000); // Attendi rendering 3D
      console.log('✅ Vista 3D attivata');
    }

    // Screenshot della vista 3D
    await page.screenshot({
      path: 'screenshots/3d-view-diagnostic.png',
      fullPage: false
    });

    console.log('📸 Screenshot salvato: screenshots/3d-view-diagnostic.png');

    // Verifica presenza canvas Three.js
    const canvas3D = page.locator('canvas').first();
    const isVisible = await canvas3D.isVisible();

    console.log(`🎨 Canvas 3D visibile: ${isVisible}`);

    // Ottieni dimensioni cassetto dal toolbar
    const dimensionsText = await page.locator('text=/Dimensioni:.*mm/').textContent();
    console.log(`📏 Dimensioni cassetto: ${dimensionsText}`);

    console.log('');
    console.log('🔍 ANALISI:');
    console.log('   Verifica visivamente lo screenshot per controllare se:');
    console.log('   1. I compartimenti colorati sbordano dal frame del cassetto');
    console.log('   2. Le dimensioni dei compartimenti rispettano i limiti del loading unit');
    console.log('   3. Le posizioni X,Y dei compartimenti sono corrette');

    expect(isVisible).toBe(true);
  });
});
