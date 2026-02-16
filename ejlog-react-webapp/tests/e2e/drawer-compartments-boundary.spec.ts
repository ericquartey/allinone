import { test, expect } from '@playwright/test';

test.describe('Verifica Scomparti Dentro Perimetro Cassetto', () => {
  test('verifica che tutti gli scomparti siano contenuti nel cassetto', async ({ page }) => {
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

    // Analizza il canvas con JavaScript per verificare i boundaries
    const analysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { error: 'Canvas non trovato' };

      const ctx = canvas.getContext('2d');
      if (!ctx) return { error: 'Context 2D non disponibile' };

      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Trova il bordo del cassetto (linea più scura/spessa)
      // Il bordo del cassetto dovrebbe essere nero/grigio scuro (#1f2937)
      const drawerBorder = {
        minX: width,
        maxX: 0,
        minY: height,
        maxY: 0
      };

      // Cerca pixel del bordo cassetto (molto scuro)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Pixel molto scuro (bordo cassetto dovrebbe essere #1f2937 ~ rgb(31, 41, 55))
          if (a > 200 && r < 60 && g < 60 && b < 70) {
            if (x < drawerBorder.minX) drawerBorder.minX = x;
            if (x > drawerBorder.maxX) drawerBorder.maxX = x;
            if (y < drawerBorder.minY) drawerBorder.minY = y;
            if (y > drawerBorder.maxY) drawerBorder.maxY = y;
          }
        }
      }

      // Trova i bordi degli scomparti (grigio medio #6b7280)
      const compartmentPixels: Array<{x: number, y: number}> = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Pixel grigio medio (bordi scomparti dovrebbero essere #6b7280 ~ rgb(107, 114, 128))
          if (a > 200 && r >= 100 && r <= 115 && g >= 110 && g <= 125 && b >= 120 && b <= 135) {
            compartmentPixels.push({ x, y });
          }
        }
      }

      // Verifica che tutti i pixel degli scomparti siano dentro il cassetto
      let pixelsOutside = 0;
      for (const pixel of compartmentPixels) {
        if (pixel.x < drawerBorder.minX || pixel.x > drawerBorder.maxX ||
            pixel.y < drawerBorder.minY || pixel.y > drawerBorder.maxY) {
          pixelsOutside++;
        }
      }

      return {
        canvasSize: { width, height },
        drawerBorder,
        drawerSize: {
          width: drawerBorder.maxX - drawerBorder.minX,
          height: drawerBorder.maxY - drawerBorder.minY
        },
        compartmentPixelsCount: compartmentPixels.length,
        pixelsOutside,
        allCompartmentsInside: pixelsOutside === 0
      };
    });

    console.log('');
    console.log('📊 ANALISI BOUNDARIES:');
    console.log(`   Canvas: ${analysis.canvasSize.width} × ${analysis.canvasSize.height}px`);
    console.log(`   Bordo cassetto: (${analysis.drawerBorder.minX}, ${analysis.drawerBorder.minY}) to (${analysis.drawerBorder.maxX}, ${analysis.drawerBorder.maxY})`);
    console.log(`   Dimensioni cassetto: ${analysis.drawerSize.width} × ${analysis.drawerSize.height}px`);
    console.log(`   Pixel scomparti trovati: ${analysis.compartmentPixelsCount}`);
    console.log(`   Pixel scomparti fuori cassetto: ${analysis.pixelsOutside}`);

    if (analysis.allCompartmentsInside) {
      console.log('');
      console.log('✅ TUTTI GLI SCOMPARTI SONO DENTRO IL PERIMETRO DEL CASSETTO');
    } else {
      console.log('');
      console.log(`❌ ATTENZIONE: ${analysis.pixelsOutside} pixel di scomparti sono fuori dal cassetto`);
    }

    // Screenshot per verifica visiva
    await page.screenshot({
      path: 'screenshots/drawer-compartments-boundary.png',
      fullPage: false
    });

    console.log('');
    console.log('📸 Screenshot salvato: screenshots/drawer-compartments-boundary.png');

    // Verifica che tutti gli scomparti siano dentro
    expect(analysis.allCompartmentsInside).toBe(true);
    expect(analysis.pixelsOutside).toBe(0);
  });
});
