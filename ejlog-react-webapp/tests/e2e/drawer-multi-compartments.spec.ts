import { test, expect } from '@playwright/test';

test.describe('Drawer with Multiple Compartments', () => {
  test('seleziona cassetto con più divisioni e analizza rendering', async ({ page }) => {
    // Listen to console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(`[${msg.type()}] ${text}`);
      console.log(`Browser console: [${msg.type()}] ${text}`);
    });

    await page.goto('http://localhost:3000');

    // Login
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', 'superuser');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    console.log('✅ Login completato');

    // Vai a Gestione Cassetti
    await page.click('text=MAGAZZINO');
    await page.click('text=Gestione Cassetti');
    await page.waitForURL('**/drawers', { timeout: 10000 });

    console.log('✅ Pagina Gestione Cassetti caricata');

    // Seleziona cassetto 1001 (dovrebbe avere più scomparti)
    await page.click('text=1001');
    await page.waitForTimeout(2000);

    console.log('✅ Cassetto 1001 selezionato');

    // Assicurati di essere in Vista 2D
    const vista2DButton = page.locator('button:has-text("Vista 2D")');
    if (await vista2DButton.isVisible()) {
      await vista2DButton.click();
      await page.waitForTimeout(1000);
    }

    console.log('✅ Vista 2D attiva');

    // Aspetta che il canvas sia renderizzato
    await page.waitForSelector('canvas', { timeout: 5000 });

    // Analizza il canvas
    const canvasAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return { error: 'Canvas non trovato' };

      const ctx = canvas.getContext('2d');
      if (!ctx) return { error: 'Context 2D non disponibile' };

      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Analizza i colori presenti per identificare:
      // - Bordo cassetto: #1f2937 (rgb 31, 41, 55) - lineWidth 8px
      // - Bordi scomparti: #6b7280 (rgb 107, 114, 128) - lineWidth 2px

      const colors = new Map<string, number>();
      let drawerBorderPixels = 0;
      let compartmentBorderPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 200) { // Pixel visibile
          const color = `rgb(${r},${g},${b})`;
          colors.set(color, (colors.get(color) || 0) + 1);

          // Bordo cassetto (molto scuro)
          if (r < 60 && g < 60 && b < 70) {
            drawerBorderPixels++;
          }

          // Bordi scomparti (grigio medio)
          if (r >= 100 && r <= 115 && g >= 110 && g <= 125 && b >= 120 && b <= 135) {
            compartmentBorderPixels++;
          }
        }
      }

      return {
        canvasSize: { width, height },
        drawerBorderPixels,
        compartmentBorderPixels,
        totalColors: colors.size,
        hasCompartments: compartmentBorderPixels > 0
      };
    });

    console.log('');
    console.log('📊 ANALISI CANVAS:');
    console.log(`   Dimensioni: ${canvasAnalysis.canvasSize.width} × ${canvasAnalysis.canvasSize.height}px`);
    console.log(`   Pixel bordo cassetto (scuro): ${canvasAnalysis.drawerBorderPixels}`);
    console.log(`   Pixel bordi scomparti (grigio): ${canvasAnalysis.compartmentBorderPixels}`);
    console.log(`   Colori totali: ${canvasAnalysis.totalColors}`);
    console.log(`   Scomparti visibili: ${canvasAnalysis.hasCompartments ? '✅ SI' : '❌ NO'}`);

    // Screenshot
    await page.screenshot({
      path: 'screenshots/drawer-multi-compartments.png',
      fullPage: false
    });

    console.log('');
    console.log('📸 Screenshot salvato: screenshots/drawer-multi-compartments.png');

    // Stampa console warnings
    const warnings = consoleMessages.filter(msg => msg.includes('warn'));
    if (warnings.length > 0) {
      console.log('');
      console.log('⚠️  CONSOLE WARNINGS:');
      warnings.forEach(w => console.log(`   ${w}`));
    }

    // Verifica che il canvas sia visibile
    const canvas = page.locator('canvas').first();
    expect(canvas).toBeVisible();

    // Verifica che ci siano scomparti renderizzati
    if (!canvasAnalysis.hasCompartments) {
      console.log('');
      console.log('❌ PROBLEMA: Nessuno scomparto visibile sul canvas');
      console.log('   Possibili cause:');
      console.log('   1. Compartments data non caricati dall\'API');
      console.log('   2. Validation logic troppo restrittiva');
      console.log('   3. Dimensioni compartments invalide');
    }

    // Tieni il browser aperto per 20 secondi
    console.log('');
    console.log('⏱️  Browser aperto per 20 secondi...');
    await page.waitForTimeout(20000);
  });
});
