// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Debug test per creazione lista touch mode
 * Intercetta le chiamate API e mostra errori dettagliati
 */
test.describe('Debug Create List Touch', () => {
  test('should debug list creation with foreign key error', async ({ page }) => {
    // Abilita log dettagliati
    page.on('console', msg => console.log(`🖥️  CONSOLE ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`🔴 PAGE ERROR: ${error.message}`));

    // Intercetta tutte le richieste API
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log(`📦 BODY: ${request.postData()}`);
        }
      }
    });

    // Intercetta tutte le risposte API
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const status = response.status();
        const statusText = status >= 400 ? '❌' : '✅';
        console.log(`${statusText} RESPONSE: ${status} ${response.url()}`);

        try {
          const body = await response.text();
          console.log(`📥 RESPONSE BODY: ${body}`);
        } catch (e) {
          console.log(`⚠️  Could not read response body`);
        }
      }
    });

    // Vai alla pagina
    console.log('\n🚀 Navigating to create list touch page...');
    await page.goto('http://localhost:3000/operations/lists/touch/create');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Crea Lista")', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Compila descrizione
    console.log('\n📝 Filling description...');
    await page.click('input[placeholder*="Ordine cliente"]');
    await page.waitForTimeout(500);

    // Verifica se tastiera virtuale è apparsa
    const keyboardVisible = await page.isVisible('text=Descrizione Lista');
    console.log(`⌨️  Virtual keyboard visible: ${keyboardVisible}`);

    if (keyboardVisible) {
      // Usa tastiera virtuale
      await page.click('button:has-text("T")');
      await page.click('button:has-text("E")');
      await page.click('button:has-text("S")');
      await page.click('button:has-text("T")');
      await page.click('button:has-text("✓ Conferma")');
      console.log('✅ Description entered via virtual keyboard');
    } else {
      // Fallback
      await page.fill('input[placeholder*="Ordine cliente"]', 'TEST');
      console.log('✅ Description entered via input');
    }

    await page.waitForTimeout(500);

    // Cerca e aggiungi un articolo
    console.log('\n🔍 Searching for item...');
    const searchInput = page.locator('input[placeholder*="Cerca articolo"]');
    await searchInput.click();
    await page.waitForTimeout(500);

    // Check if search keyboard appears
    const searchKeyboardVisible = await page.isVisible('text=Cerca Articolo');
    console.log(`⌨️  Search keyboard visible: ${searchKeyboardVisible}`);

    if (searchKeyboardVisible) {
      await page.click('button:has-text("✓ Conferma")');
      await page.waitForTimeout(500);
    }

    // Attendi caricamento articoli
    await page.waitForTimeout(2000);
    console.log('⏳ Waiting for items to load...');

    // Verifica presenza articoli
    const itemsCount = await page.locator('[data-testid="item-card"], .bg-white.rounded-xl.border-4').count();
    console.log(`📊 Found ${itemsCount} items`);

    if (itemsCount > 0) {
      // Clicca primo articolo
      console.log('➕ Adding first item...');
      await page.locator('[data-testid="item-card"], .bg-white.rounded-xl.border-4').first().click();
      await page.waitForTimeout(1000);

      // Verifica articolo aggiunto
      const selectedCount = await page.locator('.bg-green-50, .border-green-500').count();
      console.log(`✅ Selected items: ${selectedCount}`);
    } else {
      console.log('⚠️  No items found to add');
    }

    // Trova e clicca pulsante Crea Lista
    console.log('\n🎯 Creating list...');
    const createButton = page.locator('button:has-text("Crea Lista")');
    await createButton.scrollIntoViewIfNeeded();
    await createButton.click();

    // Attendi risposta
    console.log('⏳ Waiting for API response...');
    await page.waitForTimeout(3000);

    // Verifica risultato
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);

    // Check for error messages
    const errorVisible = await page.isVisible('text=/errore|error|failed/i');
    if (errorVisible) {
      const errorText = await page.textContent('text=/errore|error|failed/i');
      console.log(`❌ Error message visible: ${errorText}`);
    }

    // Keep browser open for manual inspection
    console.log('\n⏸️  Test complete - browser will stay open for 30 seconds');
    await page.waitForTimeout(30000);
  });
});
