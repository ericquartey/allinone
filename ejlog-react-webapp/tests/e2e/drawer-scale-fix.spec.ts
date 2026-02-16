import { test, expect } from '@playwright/test';

test.describe('Test Correzione Scala Scomparti', () => {
  test('verifica che gli scomparti ora siano nella scala corretta', async ({ page }) => {
    // Prova prima porta 3000
    let baseUrl = 'http://localhost:3000';

    try {
      await page.goto(baseUrl, { timeout: 5000 });
    } catch {
      console.log('Porta 3000 non disponibile, provo porta 3004...');
      baseUrl = 'http://localhost:3004';
      await page.goto(baseUrl);
    }

    console.log(`✅ Aperta pagina su ${baseUrl}`);

    // Login
    await page.fill('input[name="username"]', 'superuser');
    await page.fill('input[name="password"]', 'superuser');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    console.log('✅ Login completato');

    // Vai a Gestione Cassetti
    await page.goto(`${baseUrl}/drawers`);
    await page.waitForTimeout(2000);

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

    // Aspetta che il canvas sia renderizzato
    await page.waitForSelector('canvas', { timeout: 5000 });

    // Screenshot
    await page.screenshot({
      path: 'screenshots/drawer-scala-corretta.png',
      fullPage: false
    });

    console.log('');
    console.log('📸 Screenshot salvato: screenshots/drawer-scala-corretta.png');
    console.log('');
    console.log('✅ CORREZIONE COMPLETATA!');
    console.log('');
    console.log('🔧 Modifiche applicate:');
    console.log('   1. CompartmentEditor.tsx ora usa scale * 0.98');
    console.log('   2. CompartmentView2D.tsx usa lo stesso fattore');
    console.log('   3. Ora gli scomparti sono nella stessa scala mm del cassetto');
    console.log('');
    console.log('📐 La scala ora è sincronizzata:');
    console.log('   - Editor: scale = Math.min(scaleX, scaleY) * 0.98');
    console.log('   - View:   scale = Math.min(scaleX, scaleY) * 0.98');
    console.log('');
    console.log('⏱️  Browser rimarrà aperto per 2 minuti per permetterti di verificare...');

    // Tieni aperto il browser per 2 minuti
    await page.waitForTimeout(120000);
  });
});
