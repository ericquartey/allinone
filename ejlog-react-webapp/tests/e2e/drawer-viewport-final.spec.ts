import { test, expect } from '@playwright/test';

test.describe('Drawer Viewport Final Diagnostic', () => {
  test('analizza e risolve problema visibilità completa cassetto', async ({ page }) => {
    await page.goto('http://localhost:3000');

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

    // ANALISI COMPLETA DIMENSIONI
    const viewportSize = page.viewportSize();
    console.log('');
    console.log('📱 VIEWPORT:');
    console.log(`   ${viewportSize?.width} × ${viewportSize?.height}px`);

    // Ottieni toolbar height
    const toolbar = page.locator('.px-4.py-3.border-b').first();
    const toolbarBox = await toolbar.boundingBox();
    console.log('');
    console.log('🔧 TOOLBAR:');
    console.log(`   Altezza: ${toolbarBox?.height}px`);

    // Ottieni container canvas
    const container = page.locator('div.flex-1.p-4').first();
    const containerBox = await container.boundingBox();

    console.log('');
    console.log('📦 CONTAINER CANVAS:');
    console.log(`   Dimensioni: ${containerBox?.width} × ${containerBox?.height}px`);
    console.log(`   Posizione: (${containerBox?.x}, ${containerBox?.y})`);

    // Ottieni canvas
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();

    console.log('');
    console.log('🎨 CANVAS:');
    console.log(`   Dimensioni: ${canvasBox?.width} × ${canvasBox?.height}px`);
    console.log(`   Posizione: (${canvasBox?.x}, ${canvasBox?.y})`);

    // DIAGNOSI PROBLEMA
    if (containerBox && canvasBox && viewportSize) {
      console.log('');
      console.log('🔍 DIAGNOSI:');

      const canvasFitsWidth = canvasBox.width <= containerBox.width;
      const canvasFitsHeight = canvasBox.height <= containerBox.height;

      const containerFitsWidth = (containerBox.x + containerBox.width) <= viewportSize.width;
      const containerFitsHeight = (containerBox.y + containerBox.height) <= viewportSize.height;

      console.log(`   Canvas fit in container width: ${canvasFitsWidth ? '✅' : '❌'}`);
      console.log(`   Canvas fit in container height: ${canvasFitsHeight ? '✅' : '❌'}`);
      console.log(`   Container fit in viewport width: ${containerFitsWidth ? '✅' : '❌'}`);
      console.log(`   Container fit in viewport height: ${containerFitsHeight ? '✅' : '❌'}`);

      if (!canvasFitsWidth || !canvasFitsHeight) {
        console.log('');
        console.log('⚠️  PROBLEMA TROVATO:');
        console.log(`   Canvas troppo grande per container!`);
        console.log(`   Spazio disponibile: ${containerBox.width} × ${containerBox.height}px`);
        console.log(`   Canvas necessita: ${canvasBox.width} × ${canvasBox.height}px`);
        console.log(`   Overflow X: ${canvasBox.width - containerBox.width}px`);
        console.log(`   Overflow Y: ${canvasBox.height - containerBox.height}px`);
      }

      if (!containerFitsWidth || !containerFitsHeight) {
        console.log('');
        console.log('⚠️  PROBLEMA AGGIUNTIVO:');
        console.log(`   Container esce dal viewport!`);
        console.log(`   Container termina a X: ${containerBox.x + containerBox.width}px`);
        console.log(`   Viewport larghezza: ${viewportSize.width}px`);
        console.log(`   Container termina a Y: ${containerBox.y + containerBox.height}px`);
        console.log(`   Viewport altezza: ${viewportSize.height}px`);
      }

      // SOLUZIONE PROPOSTA
      console.log('');
      console.log('💡 SOLUZIONE PROPOSTA:');
      const idealWidth = Math.floor(containerBox.width * 0.95);
      const idealHeight = Math.floor(containerBox.height * 0.95);
      console.log(`   Canvas ideale: ${idealWidth} × ${idealHeight}px`);
      console.log(`   Questo garantisce 95% dello spazio container con margini`);
    }

    // Screenshot diagnostico
    await page.screenshot({
      path: 'screenshots/drawer-viewport-diagnostic.png',
      fullPage: false
    });

    console.log('');
    console.log('📸 Screenshot salvato: screenshots/drawer-viewport-diagnostic.png');

    // Verifica scroll necessario
    const needsScrollX = await page.evaluate(() => {
      const container = document.querySelector('div.flex-1.p-4');
      return container ? container.scrollWidth > container.clientWidth : false;
    });

    const needsScrollY = await page.evaluate(() => {
      const container = document.querySelector('div.flex-1.p-4');
      return container ? container.scrollHeight > container.clientHeight : false;
    });

    console.log('');
    console.log('📜 SCROLL NECESSARIO:');
    console.log(`   Scroll orizzontale: ${needsScrollX ? '❌ SI' : '✅ NO'}`);
    console.log(`   Scroll verticale: ${needsScrollY ? '❌ SI' : '✅ NO'}`);

    if (needsScrollX || needsScrollY) {
      console.log('');
      console.log('❌ PROBLEMA CONFERMATO: Canvas richiede scroll per essere visto completamente');
    } else {
      console.log('');
      console.log('✅ Canvas completamente visibile senza scroll');
    }

    expect(canvas).toBeVisible();
  });
});
