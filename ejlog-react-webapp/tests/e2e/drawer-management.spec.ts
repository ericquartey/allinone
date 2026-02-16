/**
 * Test E2E per Gestione Cassetti (Drawer Management)
 * Verifica visualizzazione completa dei cassetti di una UDC
 */

import { test, expect } from '@playwright/test';

test.describe('Gestione Cassetti - Visualizzazione UDC e Cassetti', () => {

  test.beforeEach(async ({ page }) => {
    // Vai alla pagina di gestione cassetti
    await page.goto('http://localhost:3000/drawers');

    // Attendi che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('dovrebbe caricare la lista UDC e visualizzare i cassetti completamente', async ({ page }) => {
    console.log('📋 Test: Caricamento UDC e visualizzazione cassetti');

    // 1. Verifica che la pagina sia caricata
    await expect(page.locator('h1')).toContainText(/gestione.*cassetti/i);
    console.log('✅ Titolo pagina trovato');

    // 2. Attendi caricamento delle UDC
    await page.waitForSelector('table, [data-testid="udc-list"]', { timeout: 10000 });
    console.log('✅ Tabella UDC caricata');

    // Screenshot della lista UDC
    await page.screenshot({
      path: 'screenshots/drawer-management-01-udc-list.png',
      fullPage: true
    });

    // 3. Conta quante UDC sono visualizzate
    const udcRows = page.locator('table tbody tr, [data-testid="udc-row"]');
    const udcCount = await udcRows.count();
    console.log(`📊 UDC trovate: ${udcCount}`);

    expect(udcCount).toBeGreaterThan(0);

    // 4. Clicca sulla prima UDC per vedere i cassetti
    const firstUdc = udcRows.first();
    await firstUdc.click();
    console.log('🖱️ Cliccato su prima UDC');

    // 5. Attendi caricamento cassetti
    await page.waitForTimeout(2000); // Attendi animazioni
    await page.waitForSelector('[data-testid="compartment"], .compartment-card, .compartment-item', {
      timeout: 10000,
      state: 'visible'
    });
    console.log('✅ Cassetti caricati');

    // Screenshot dei cassetti caricati
    await page.screenshot({
      path: 'screenshots/drawer-management-02-compartments-loaded.png',
      fullPage: true
    });

    // 6. Verifica quanti cassetti sono visibili
    const compartments = page.locator('[data-testid="compartment"], .compartment-card, .compartment-item');
    const compartmentCount = await compartments.count();
    console.log(`📦 Cassetti visualizzati: ${compartmentCount}`);

    expect(compartmentCount).toBeGreaterThan(0);

    // 7. Verifica che il primo cassetto sia COMPLETAMENTE visibile
    const firstCompartment = compartments.first();

    // Controlla bounding box del cassetto
    const boundingBox = await firstCompartment.boundingBox();

    if (boundingBox) {
      console.log(`📐 Dimensioni primo cassetto:`, boundingBox);

      // Verifica che il cassetto non sia tagliato (altezza minima ragionevole)
      expect(boundingBox.height).toBeGreaterThan(50); // Almeno 50px di altezza

      // Verifica che sia visibile nell'area viewport
      const viewport = page.viewportSize();
      if (viewport) {
        const isInViewport =
          boundingBox.y >= 0 &&
          boundingBox.y + boundingBox.height <= viewport.height;

        console.log(`👁️ Cassetto in viewport: ${isInViewport}`);

        if (!isInViewport) {
          console.warn('⚠️ PROBLEMA: Cassetto non completamente visibile nel viewport');

          // Scroll per rendere visibile
          await firstCompartment.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);

          // Screenshot dopo scroll
          await page.screenshot({
            path: 'screenshots/drawer-management-03-after-scroll.png',
            fullPage: true
          });
        }
      }
    }

    // 8. Verifica che ogni cassetto contenga le informazioni essenziali
    const firstCompartmentText = await firstCompartment.textContent();
    console.log(`📝 Contenuto primo cassetto: ${firstCompartmentText}`);

    // 9. Screenshot finale con evidenziazione del cassetto
    await firstCompartment.highlight();
    await page.screenshot({
      path: 'screenshots/drawer-management-04-compartment-highlighted.png'
    });

    console.log('✅ Test completato');
  });

  test('dovrebbe visualizzare tutti i cassetti senza overflow nascosto', async ({ page }) => {
    console.log('📋 Test: Verifica overflow cassetti');

    // Attendi caricamento
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Clicca prima UDC
    await page.locator('table tbody tr').first().click();

    // Attendi cassetti
    await page.waitForSelector('[data-testid="compartment"], .compartment-card', {
      timeout: 10000
    });

    // Verifica CSS delle card dei cassetti
    const compartmentContainer = page.locator('[data-testid="compartments-container"], .compartments-grid, .compartments-list').first();

    if (await compartmentContainer.count() > 0) {
      const overflow = await compartmentContainer.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          overflow: styles.overflow,
          overflowX: styles.overflowX,
          overflowY: styles.overflowY,
          maxHeight: styles.maxHeight,
          height: styles.height
        };
      });

      console.log('🎨 Stili container cassetti:', overflow);

      // Screenshot CSS inspection
      await page.screenshot({
        path: 'screenshots/drawer-management-05-css-inspection.png',
        fullPage: true
      });

      // Se overflow è hidden, potrebbe causare il problema
      if (overflow.overflow === 'hidden' || overflow.overflowY === 'hidden') {
        console.warn('⚠️ PROBLEMA TROVATO: overflow: hidden nasconde contenuto!');
      }
    }
  });

  test('dovrebbe permettere scroll per vedere tutti i cassetti', async ({ page }) => {
    console.log('📋 Test: Scroll cassetti');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(2000);

    // Verifica scroll
    const compartmentsArea = page.locator('[data-testid="compartments-container"], .compartments-grid').first();

    if (await compartmentsArea.count() > 0) {
      const scrollHeight = await compartmentsArea.evaluate((el) => ({
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        offsetHeight: el.offsetHeight
      }));

      console.log('📏 Dimensioni scroll:', scrollHeight);

      if (scrollHeight.scrollHeight > scrollHeight.clientHeight) {
        console.log('✅ Area è scrollabile');

        // Prova a scrollare
        await compartmentsArea.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });

        await page.waitForTimeout(500);

        await page.screenshot({
          path: 'screenshots/drawer-management-06-scrolled-bottom.png',
          fullPage: true
        });
      } else {
        console.log('ℹ️ Nessuno scroll necessario, tutto visibile');
      }
    }
  });
});
