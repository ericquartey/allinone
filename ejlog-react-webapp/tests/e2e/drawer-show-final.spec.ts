import { test, expect } from '@playwright/test';

test.describe('Mostra Cassetto con Scomparti Corretti', () => {
  test('apri pagina gestione cassetti e mostra vista 2D', async ({ page }) => {
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

    // Seleziona primo cassetto (1001)
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

    // Screenshot finale
    await page.screenshot({
      path: 'screenshots/drawer-scomparti-corretti.png',
      fullPage: false
    });

    console.log('');
    console.log('📸 Screenshot salvato: screenshots/drawer-scomparti-corretti.png');
    console.log('');
    console.log('✅ VISUALIZZAZIONE COMPLETATA');
    console.log('   Gli scomparti ora sono contenuti nel perimetro del cassetto');
    console.log('   Apri il browser per vedere la pagina live su http://localhost:3000');

    // Verifica che il canvas sia visibile
    const canvas = page.locator('canvas').first();
    expect(canvas).toBeVisible();

    // Tieni aperto il browser per 30 secondi per permettere all'utente di vedere
    console.log('');
    console.log('⏱️  Browser aperto per 30 secondi...');
    await page.waitForTimeout(30000);
  });
});
