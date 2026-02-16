/**
 * Test Diagnostico - Analisi Visualizzazione Cassetto 2D
 * Identifica problemi di dimensionamento e visualizzazione
 */

import { test, expect } from '@playwright/test';

test.describe('Diagnostica Visualizzazione Cassetto 2D', () => {

  test('analizza dimensioni container, canvas e cassetto disegnato', async ({ page }) => {
    console.log('🔍 Test Diagnostico: Analisi completa visualizzazione');

    // 1. Vai alla pagina
    await page.goto('http://localhost:3003/drawers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('✅ Pagina caricata');

    // 2. Seleziona prima UDC
    const udcButtons = page.locator('button:has-text("1001"), button:has-text("1002"), button:has-text("1003")');

    if (await udcButtons.count() > 0) {
      await udcButtons.first().click();
      console.log('✅ UDC selezionata');
      await page.waitForTimeout(3000);
    } else {
      throw new Error('Nessuna UDC trovata');
    }

    // Screenshot iniziale
    await page.screenshot({
      path: 'screenshots/diagnostic-01-initial.png',
      fullPage: true
    });

    // 3. Analizza il container del canvas
    const container = page.locator('div').filter({ has: page.locator('canvas') }).first();
    const containerBox = await container.boundingBox();

    if (containerBox) {
      console.log('📦 CONTAINER DIMENSIONS:');
      console.log(`   Width: ${containerBox.width}px`);
      console.log(`   Height: ${containerBox.height}px`);
      console.log(`   Position X: ${containerBox.x}px`);
      console.log(`   Position Y: ${containerBox.y}px`);
    }

    // 4. Analizza il canvas
    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });

    const canvasBox = await canvas.boundingBox();
    const canvasAttrs = await canvas.evaluate((el) => {
      const c = el as HTMLCanvasElement;
      return {
        canvasWidth: c.width,
        canvasHeight: c.height,
        styleWidth: c.style.width,
        styleHeight: c.style.height,
        displayWidth: c.clientWidth,
        displayHeight: c.clientHeight
      };
    });

    console.log('🎨 CANVAS ANALYSIS:');
    console.log(`   Canvas internal size: ${canvasAttrs.canvasWidth} × ${canvasAttrs.canvasHeight}px`);
    console.log(`   Canvas display size: ${canvasAttrs.displayWidth} × ${canvasAttrs.displayHeight}px`);
    console.log(`   Canvas style: ${canvasAttrs.styleWidth} × ${canvasAttrs.styleHeight}`);
    if (canvasBox) {
      console.log(`   Canvas bounding box: ${canvasBox.width} × ${canvasBox.height}px`);
      console.log(`   Canvas position: (${canvasBox.x}, ${canvasBox.y})`);
    }

    // 5. Analizza il contenuto disegnato sul canvas
    const drawingInfo = await canvas.evaluate((canvasEl) => {
      const canvas = canvasEl as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');

      if (!ctx) return { hasContent: false };

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let coloredPixels = 0;

      // Trova i limiti del contenuto disegnato
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Pixel colorato (non bianco puro o trasparente)
          if (a > 0 && !(r === 255 && g === 255 && b === 255)) {
            coloredPixels++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const contentCenterX = minX + contentWidth / 2;
      const contentCenterY = minY + contentHeight / 2;
      const canvasCenterX = canvas.width / 2;
      const canvasCenterY = canvas.height / 2;

      return {
        hasContent: coloredPixels > 0,
        coloredPixels,
        contentBounds: { minX, minY, maxX, maxY },
        contentSize: { width: contentWidth, height: contentHeight },
        contentCenter: { x: contentCenterX, y: contentCenterY },
        canvasCenter: { x: canvasCenterX, y: canvasCenterY },
        isCentered: Math.abs(contentCenterX - canvasCenterX) < 50 && Math.abs(contentCenterY - canvasCenterY) < 50
      };
    });

    console.log('🖼️ DRAWING CONTENT ANALYSIS:');
    console.log(`   Has content: ${drawingInfo.hasContent}`);
    console.log(`   Colored pixels: ${drawingInfo.coloredPixels}`);
    console.log(`   Content bounds: (${drawingInfo.contentBounds.minX}, ${drawingInfo.contentBounds.minY}) to (${drawingInfo.contentBounds.maxX}, ${drawingInfo.contentBounds.maxY})`);
    console.log(`   Content size: ${drawingInfo.contentSize.width} × ${drawingInfo.contentSize.height}px`);
    console.log(`   Content center: (${drawingInfo.contentCenter.x.toFixed(1)}, ${drawingInfo.contentCenter.y.toFixed(1)})`);
    console.log(`   Canvas center: (${drawingInfo.canvasCenter.x.toFixed(1)}, ${drawingInfo.canvasCenter.y.toFixed(1)})`);
    console.log(`   Is centered: ${drawingInfo.isCentered}`);

    // 6. Calcola percentuale di utilizzo del canvas
    const usagePercentageWidth = (drawingInfo.contentSize.width / canvasAttrs.canvasWidth * 100).toFixed(1);
    const usagePercentageHeight = (drawingInfo.contentSize.height / canvasAttrs.canvasHeight * 100).toFixed(1);

    console.log('📊 CANVAS USAGE:');
    console.log(`   Width usage: ${usagePercentageWidth}%`);
    console.log(`   Height usage: ${usagePercentageHeight}%`);

    // 7. Identifica il problema
    if (Number(usagePercentageWidth) > 95 || Number(usagePercentageHeight) > 95) {
      console.log('⚠️ PROBLEMA IDENTIFICATO: Cassetto troppo grande per il canvas (>95% utilizzo)');
      console.log('   SOLUZIONE: Ridurre ulteriormente la scala del disegno');
    } else if (Number(usagePercentageWidth) < 50 && Number(usagePercentageHeight) < 50) {
      console.log('⚠️ PROBLEMA IDENTIFICATO: Cassetto troppo piccolo (<50% utilizzo canvas)');
      console.log('   SOLUZIONE: Aumentare la scala del disegno');
    } else if (!drawingInfo.isCentered) {
      console.log('⚠️ PROBLEMA IDENTIFICATO: Cassetto non centrato');
      console.log('   SOLUZIONE: Rivedere calcolo offsetX/offsetY');
    } else {
      console.log('✅ VISUALIZZAZIONE OK: Cassetto ben dimensionato e centrato');
    }

    // 8. Screenshot annotato
    await page.screenshot({
      path: 'screenshots/diagnostic-02-analyzed.png',
      fullPage: true
    });

    console.log('✅ Test diagnostico completato');
    console.log('📁 Screenshots salvati in screenshots/diagnostic-*.png');
  });
});
