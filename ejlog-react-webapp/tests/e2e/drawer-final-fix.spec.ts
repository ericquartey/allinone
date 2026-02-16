import { test, expect } from '@playwright/test';

test.describe('Fix Cassetto Visibilità Completa 2D', () => {
  test('analizza e sistema visualizzazione cassetto', async ({ page }) => {
    await page.goto('http://localhost:3004');

    // Login
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', 'superuser');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    console.log('✅ Login completato');

    // Vai a Gestione Cassetti
    await page.click('text=MAGAZZINO');
    await page.click('text=Gestione Cassetti');
    await page.waitForURL('**/drawers');

    console.log('✅ Pagina Gestione Cassetti caricata');

    // Seleziona primo cassetto (1001)
    await page.click('text=1001');
    await page.waitForTimeout(1500);

    console.log('✅ Cassetto 1001 selezionato');

    // Assicurati di essere in Vista 2D
    const vista2DButton = page.locator('button:has-text("Vista 2D")');
    if (await vista2DButton.isVisible()) {
      await vista2DButton.click();
      await page.waitForTimeout(1000);
    }

    console.log('✅ Vista 2D attiva');

    // Ottieni dimensioni viewport
    const viewportSize = page.viewportSize();
    console.log(`📱 Viewport: ${viewportSize?.width} × ${viewportSize?.height}px`);

    // Trova il canvas
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      console.log('');
      console.log('🎨 CANVAS:');
      console.log(`   Dimensioni canvas: ${canvasBox.width} × ${canvasBox.height}px`);
      console.log(`   Posizione: (${canvasBox.x}, ${canvasBox.y})`);

      // Verifica se il canvas è fuori viewport
      if (viewportSize) {
        const outOfBoundsRight = canvasBox.x + canvasBox.width > viewportSize.width;
        const outOfBoundsBottom = canvasBox.y + canvasBox.height > viewportSize.height;

        console.log('');
        console.log('🔍 ANALISI VISIBILITÀ:');
        console.log(`   Canvas esce a destra: ${outOfBoundsRight ? '❌ SI' : '✅ NO'}`);
        console.log(`   Canvas esce in basso: ${outOfBoundsBottom ? '❌ SI' : '✅ NO'}`);

        if (outOfBoundsRight || outOfBoundsBottom) {
          console.log('');
          console.log('⚠️  PROBLEMA RILEVATO:');
          console.log(`   Canvas troppo grande per il viewport!`);
          console.log(`   Spazio disponibile: ${viewportSize.width - canvasBox.x}px (larghezza)`);
          console.log(`   Spazio necessario: ${canvasBox.width}px`);
        }
      }
    }

    // Ottieni dimensioni del container del canvas
    const container = page.locator('div.flex-1.p-4').first();
    const containerBox = await container.boundingBox();

    if (containerBox) {
      console.log('');
      console.log('📦 CONTAINER:');
      console.log(`   Dimensioni: ${containerBox.width} × ${containerBox.height}px`);
      console.log(`   Posizione: (${containerBox.x}, ${containerBox.y})`);
    }

    // Screenshot
    await page.screenshot({
      path: 'screenshots/drawer-fix-diagnostic.png',
      fullPage: false
    });

    console.log('');
    console.log('📸 Screenshot salvato: screenshots/drawer-fix-diagnostic.png');

    expect(canvas).toBeVisible();
  });
});
