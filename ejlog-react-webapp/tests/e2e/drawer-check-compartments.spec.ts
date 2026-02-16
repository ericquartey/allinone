import { test, expect } from '@playwright/test';

test.describe('Verifica Scomparti', () => {
  test('controlla se gli scomparti sono visibili', async ({ page }) => {
    // Vai direttamente alla porta 3000
    await page.goto('http://localhost:3000');

    console.log('✅ Pagina aperta su http://localhost:3000');

    // Aspetta che la pagina sia caricata
    await page.waitForTimeout(2000);

    // Controlla se siamo sulla login page
    const loginInput = page.locator('input[name="username"]');
    const isLoginPage = await loginInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isLoginPage) {
      console.log('📋 Pagina di login trovata');

      // Fai login
      await page.fill('input[name="username"]', 'superuser');
      await page.fill('input[name="password"]', 'superuser');
      await page.click('button[type="submit"]');

      console.log('🔐 Login effettuato');

      // Aspetta redirect alla dashboard
      await page.waitForTimeout(3000);
    } else {
      console.log('⚠️  Nessuna pagina di login trovata');
    }

    // Vai alla pagina cassetti
    console.log('🔄 Navigazione a /drawers...');
    await page.goto('http://localhost:3000/drawers');
    await page.waitForTimeout(3000);

    console.log('✅ Pagina /drawers caricata');

    // Controlla se ci sono cassetti nella lista
    const drawersList = page.locator('[class*="drawer"]').first();
    const hasDrawers = await drawersList.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasDrawers) {
      console.log('📦 Lista cassetti trovata');

      // Cerca il cassetto 1001
      const drawer1001 = page.locator('text=1001').first();
      const has1001 = await drawer1001.isVisible({ timeout: 3000 }).catch(() => false);

      if (has1001) {
        console.log('✅ Cassetto 1001 trovato, cliccando...');
        await drawer1001.click();
        await page.waitForTimeout(2000);

        console.log('✅ Cassetto 1001 selezionato');

        // Cerca il bottone Vista 2D
        const vista2DButton = page.locator('button:has-text("Vista 2D")');
        const hasVista2D = await vista2DButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (hasVista2D) {
          console.log('🖼️  Bottone Vista 2D trovato, cliccando...');
          await vista2DButton.click();
          await page.waitForTimeout(2000);
        } else {
          console.log('⚠️  Bottone Vista 2D non trovato');
        }

        // Cerca il canvas
        const canvas = page.locator('canvas').first();
        const hasCanvas = await canvas.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasCanvas) {
          console.log('✅ Canvas trovato!');

          // Screenshot
          await page.screenshot({
            path: 'screenshots/drawer-compartments-check.png',
            fullPage: false
          });

          console.log('📸 Screenshot salvato: screenshots/drawer-compartments-check.png');

          // Analizza il canvas con JavaScript
          const canvasInfo = await page.evaluate(() => {
            const canvas = document.querySelector('canvas');
            if (!canvas) return { error: 'Canvas non trovato' };

            const ctx = canvas.getContext('2d');
            if (!ctx) return { error: 'Context non ottenuto' };

            // Controlla se ci sono pixel disegnati
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;

            let hasNonWhitePixels = false;
            let nonWhiteCount = 0;

            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const a = pixels[i + 3];

              // Controlla se il pixel non è bianco (255,255,255) e non è trasparente
              if (a > 0 && (r < 250 || g < 250 || b < 250)) {
                hasNonWhitePixels = true;
                nonWhiteCount++;
              }
            }

            return {
              width: canvas.width,
              height: canvas.height,
              hasNonWhitePixels,
              nonWhiteCount,
              totalPixels: pixels.length / 4
            };
          });

          console.log('');
          console.log('📊 ANALISI CANVAS:');
          console.log(`   Dimensioni: ${canvasInfo.width}x${canvasInfo.height}`);
          console.log(`   Pixel totali: ${canvasInfo.totalPixels}`);
          console.log(`   Pixel disegnati (non bianchi): ${canvasInfo.nonWhiteCount}`);
          console.log(`   Ha contenuto disegnato: ${canvasInfo.hasNonWhitePixels ? 'SÌ ✅' : 'NO ❌'}`);
          console.log('');

          if (canvasInfo.hasNonWhitePixels) {
            console.log('✅ IL CANVAS HA CONTENUTO DISEGNATO!');
            console.log('   Gli scomparti dovrebbero essere visibili.');
          } else {
            console.log('❌ IL CANVAS È VUOTO!');
            console.log('   Gli scomparti NON sono stati disegnati.');
          }

        } else {
          console.log('❌ Canvas NON trovato!');
        }

      } else {
        console.log('❌ Cassetto 1001 non trovato');
      }

    } else {
      console.log('❌ Lista cassetti non trovata');
    }

    console.log('');
    console.log('⏱️  Browser rimarrà aperto per 30 secondi...');
    await page.waitForTimeout(30000);
  });
});
