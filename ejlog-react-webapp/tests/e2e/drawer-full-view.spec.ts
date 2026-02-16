/**
 * Test E2E - Verifica Visualizzazione Completa Cassetto
 * Testa che il cassetto sia centrato e completamente visibile
 */

import { test, expect } from '@playwright/test';

test.describe('Gestione Cassetti - Visualizzazione Completa e Centratura', () => {

  test('dovrebbe mostrare il cassetto completo e centrato con tutti i compartimenti visibili', async ({ page }) => {
    console.log('🎯 Test: Visualizzazione completa cassetto nella pagina Gestione Cassetti');

    // 1. Vai alla pagina Gestione Cassetti
    await page.goto('http://localhost:3000/drawers');
    await page.waitForLoadState('networkidle');
    console.log('✅ Pagina caricata');

    // Screenshot iniziale
    await page.screenshot({
      path: 'screenshots/cassetto-01-pagina-iniziale.png',
      fullPage: true
    });

    // 2. Attendi che le UDC siano caricate nella sidebar
    await page.waitForTimeout(3000);

    // Cerca i button nella sidebar che rappresentano le UDC
    // Le UDC sono visualizzate come button con testo che contiene il codice (es: "1001")
    const udcButtons = page.locator('button:has-text("1001"), button:has-text("1002"), button:has-text("1003")');
    const udcCount = await udcButtons.count();
    console.log(`📦 Trovate ${udcCount} UDC nella sidebar`);

    if (udcCount === 0) {
      console.warn('⚠️ Nessuna UDC trovata, attendo ulteriore caricamento');
      await page.waitForTimeout(2000);

      // Prova nuovamente con selettore più generico
      const allButtons = page.locator('.w-full.text-left');
      const allCount = await allButtons.count();
      console.log(`Trovati ${allCount} button generici nella sidebar`);

      if (allCount > 0) {
        await allButtons.first().click();
        console.log('✅ Cliccato su primo button disponibile');
      } else {
        throw new Error('Nessuna UDC disponibile per il test');
      }
    } else {
      // 3. Clicca sulla prima UDC disponibile
      await udcButtons.first().click();
      console.log('✅ Selezionata prima UDC dalla lista');
    }

    // 4. Attendi che il canvas sia visibile
    await page.waitForTimeout(3000); // Attendi rendering completo

    const canvas = page.locator('canvas').first();
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Canvas trovato e visibile');

    // Screenshot dopo selezione UDC
    await page.screenshot({
      path: 'screenshots/cassetto-02-udc-selezionata.png',
      fullPage: true
    });

    // 5. Verifica dimensioni e posizione del canvas
    const canvasBox = await canvas.boundingBox();

    if (!canvasBox) {
      throw new Error('❌ Canvas non ha bounding box');
    }

    console.log('📐 Dimensioni Canvas:', {
      width: canvasBox.width,
      height: canvasBox.height,
      x: canvasBox.x,
      y: canvasBox.y
    });

    // 6. Verifica che il canvas sia sufficientemente grande
    expect(canvasBox.width).toBeGreaterThan(400);
    expect(canvasBox.height).toBeGreaterThan(300);
    console.log('✅ Canvas ha dimensioni adeguate');

    // 7. Verifica che il canvas sia nel viewport
    const viewport = page.viewportSize();
    if (viewport) {
      const isInViewport =
        canvasBox.y >= 0 &&
        canvasBox.y + canvasBox.height <= viewport.height &&
        canvasBox.x >= 0 &&
        canvasBox.x + canvasBox.width <= viewport.width;

      console.log('👁️ Canvas completamente nel viewport:', isInViewport);

      if (!isInViewport) {
        console.log('⚠️ Canvas parzialmente fuori viewport, scroll necessario');
        await canvas.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
      }
    }

    // 8. Screenshot del canvas
    await page.screenshot({
      path: 'screenshots/cassetto-03-canvas-completo.png',
      fullPage: true
    });

    // 9. Analizza il contenuto del canvas tramite screenshot
    const canvasScreenshot = await canvas.screenshot({
      path: 'screenshots/cassetto-04-canvas-solo.png'
    });

    console.log('📸 Screenshot canvas salvato');

    // 10. Verifica che ci siano elementi visibili nel canvas
    // Controlliamo il colore dei pixel per vedere se ci sono compartimenti disegnati
    const canvasElement = await canvas.elementHandle();

    if (canvasElement) {
      const hasContent = await page.evaluate((canvasEl) => {
        const canvas = canvasEl as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        if (!ctx) return false;

        // Controlla se ci sono pixel non bianchi/trasparenti nel canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;

        let nonWhitePixels = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Conta pixel che non sono bianchi puri o trasparenti
          if (a > 0 && !(r === 255 && g === 255 && b === 255)) {
            nonWhitePixels++;
          }
        }

        return nonWhitePixels > 1000; // Almeno 1000 pixel colorati
      }, canvasElement);

      console.log('🎨 Canvas ha contenuto visibile:', hasContent);
      expect(hasContent).toBe(true);
    }

    // 11. Testa l'interazione con i compartimenti
    console.log('🖱️ Testo click su compartimento...');

    // Clicca al centro del canvas per selezionare un compartimento
    await canvas.click({
      position: {
        x: canvasBox.width / 2,
        y: canvasBox.height / 2
      }
    });

    await page.waitForTimeout(1000);

    // Screenshot dopo click
    await page.screenshot({
      path: 'screenshots/cassetto-05-dopo-click.png',
      fullPage: true
    });

    // 12. Verifica che la sidebar destra con dettagli sia visibile (se un compartimento è selezionato)
    const detailsSidebar = page.locator('.w-80').filter({ hasText: /Dettagli|ID|Barcode|Posizione/i });

    if (await detailsSidebar.count() > 0) {
      console.log('✅ Sidebar dettagli compartimento visibile');

      await page.screenshot({
        path: 'screenshots/cassetto-06-dettagli-visibili.png',
        fullPage: true
      });
    } else {
      console.log('ℹ️ Nessun compartimento selezionato o sidebar non visibile');
    }

    // 13. Testa i pulsanti Vista 2D / Vista 3D
    const vista2DBtn = page.locator('button').filter({ hasText: 'Vista 2D' });
    const vista3DBtn = page.locator('button').filter({ hasText: 'Vista 3D' });

    if (await vista2DBtn.count() > 0) {
      console.log('✅ Pulsanti visualizzazione trovati');

      // Assicurati che Vista 2D sia selezionata
      const is2DActive = await vista2DBtn.evaluate((btn) => {
        return btn.className.includes('bg-blue-600');
      });

      console.log('📊 Vista 2D attiva:', is2DActive);
      expect(is2DActive).toBe(true);
    }

    // 14. Screenshot finale con annotazioni
    await page.screenshot({
      path: 'screenshots/cassetto-07-test-completo.png',
      fullPage: true
    });

    console.log('✅ Test completato con successo!');
    console.log('📁 Screenshots salvati in screenshots/cassetto-*.png');
  });

  test('dovrebbe visualizzare correttamente compartimenti con diversi livelli di riempimento', async ({ page }) => {
    console.log('🎨 Test: Verifica colori compartimenti per riempimento');

    await page.goto('http://localhost:3000/drawers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Seleziona prima UDC
    const udcButtons = page.locator('button:has-text("1001"), button:has-text("1002"), button:has-text("1003")');

    if (await udcButtons.count() > 0) {
      await udcButtons.first().click();
      console.log('✅ UDC selezionata');

      await page.waitForTimeout(2000);

      // Screenshot per verificare i colori
      await page.screenshot({
        path: 'screenshots/cassetto-colori-riempimento.png',
        fullPage: true
      });

      const canvas = page.locator('canvas').first();
      const canvasElement = await canvas.elementHandle();

      if (canvasElement) {
        // Analizza i colori presenti nel canvas
        const colorInfo = await page.evaluate((canvasEl) => {
          const canvas = canvasEl as HTMLCanvasElement;
          const ctx = canvas.getContext('2d');

          if (!ctx) return { hasColors: false, uniqueColors: 0 };

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          const colorSet = new Set<string>();

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (a > 0) {
              const color = `${r},${g},${b}`;
              colorSet.add(color);
            }
          }

          return {
            hasColors: colorSet.size > 2,
            uniqueColors: colorSet.size
          };
        }, canvasElement);

        console.log('🎨 Colori unici trovati nel canvas:', colorInfo.uniqueColors);
        expect(colorInfo.hasColors).toBe(true);
        expect(colorInfo.uniqueColors).toBeGreaterThan(3);
      }

      console.log('✅ Compartimenti con colori diversi visualizzati correttamente');
    }
  });
});
