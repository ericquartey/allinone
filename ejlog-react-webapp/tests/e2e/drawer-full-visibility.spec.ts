import { test, expect } from '@playwright/test';

test.describe('Verifica Visibilità Completa Cassetto 2D', () => {
  test('diagnostica e screenshot cassetto completo', async ({ page }) => {
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

    // Ottieni informazioni sul cassetto
    const dimensionsText = await page.locator('text=/Dimensioni:.*mm/').textContent();
    console.log(`📏 ${dimensionsText}`);

    // Trova il canvas
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();

    if (canvasBox) {
      console.log('🎨 CANVAS INFO:');
      console.log(`   Dimensioni: ${canvasBox.width} × ${canvasBox.height}px`);
      console.log(`   Posizione: (${canvasBox.x}, ${canvasBox.y})`);
    }

    // Screenshot completo della pagina
    await page.screenshot({
      path: 'screenshots/cassetto-completo-full-page.png',
      fullPage: true
    });

    console.log('📸 Screenshot pagina completa salvato');

    // Screenshot solo del canvas
    await canvas.screenshot({
      path: 'screenshots/cassetto-completo-canvas-only.png'
    });

    console.log('📸 Screenshot canvas salvato');

    // Analizza il contenuto del canvas
    const imageData = await canvas.evaluate((canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const width = canvas.width;
      const height = canvas.height;
      const data = ctx.getImageData(0, 0, width, height).data;

      // Trova i bounds del contenuto disegnato
      let minX = width, maxX = 0, minY = height, maxY = 0;
      let hasContent = false;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Se il pixel non è bianco/trasparente
          if (a > 0 && !(r === 255 && g === 255 && b === 255)) {
            hasContent = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      return {
        canvasSize: { width, height },
        contentBounds: hasContent ? { minX, maxX, minY, maxY } : null,
        contentSize: hasContent ? { width: maxX - minX, height: maxY - minY } : null
      };
    });

    if (imageData && imageData.contentBounds) {
      console.log('');
      console.log('📊 ANALISI CONTENUTO CANVAS:');
      console.log(`   Canvas: ${imageData.canvasSize.width} × ${imageData.canvasSize.height}px`);
      console.log(`   Contenuto disegnato: ${imageData.contentSize?.width} × ${imageData.contentSize?.height}px`);
      console.log(`   Bounds: (${imageData.contentBounds.minX}, ${imageData.contentBounds.minY}) to (${imageData.contentBounds.maxX}, ${imageData.contentBounds.maxY})`);

      const widthUsage = ((imageData.contentSize?.width || 0) / imageData.canvasSize.width * 100).toFixed(1);
      const heightUsage = ((imageData.contentSize?.height || 0) / imageData.canvasSize.height * 100).toFixed(1);

      console.log(`   Utilizzo larghezza: ${widthUsage}%`);
      console.log(`   Utilizzo altezza: ${heightUsage}%`);

      // Verifica se il cassetto occupa almeno l'80% dello spazio
      const minUsage = 80;
      if (parseFloat(widthUsage) < minUsage || parseFloat(heightUsage) < minUsage) {
        console.log(`⚠️  ATTENZIONE: Il cassetto non occupa abbastanza spazio (minimo ${minUsage}%)`);
      } else {
        console.log('✅ Il cassetto è ben dimensionato');
      }
    }

    console.log('');
    console.log('📁 Screenshots salvati:');
    console.log('   - screenshots/cassetto-completo-full-page.png');
    console.log('   - screenshots/cassetto-completo-canvas-only.png');

    expect(canvas).toBeVisible();
  });
});
