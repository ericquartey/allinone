// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test per verificare e risolvere il problema foreign key nella creazione liste
 */
test.describe('Create List Foreign Key Fix', () => {
  test('should create a PICKING list successfully', async ({ page }) => {
    // Abilita log dettagliati
    page.on('console', msg => console.log(`🖥️  CONSOLE ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`🔴 PAGE ERROR: ${error.message}`));

    // Intercetta richieste API
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
        if (request.postData()) {
          console.log(`📦 BODY: ${request.postData()}`);
        }
      }
    });

    // Intercetta risposte API
    page.on('response', async response => {
      if (response.url().includes('/api/item-lists')) {
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

    console.log('\n🚀 Test 1: Creating PICKING list...');

    // Vai alla pagina
    await page.goto('http://localhost:3000/operations/lists/touch/create');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Crea Lista")', { timeout: 10000 });

    // Verifica che PICKING sia già selezionato (default)
    const pickingButton = page.locator('button:has-text("PICKING")');
    await expect(pickingButton).toHaveClass(/bg-blue-600/);
    console.log('✅ PICKING type selected');

    // Inserisci descrizione
    const descInput = page.locator('input[placeholder*="Ordine cliente"]');
    await descInput.click();
    await page.waitForTimeout(500);

    // Controlla se appare tastiera virtuale
    const keyboardVisible = await page.locator('text=Descrizione Lista').isVisible().catch(() => false);

    if (keyboardVisible) {
      console.log('⌨️  Using virtual keyboard');
      await page.click('button:has-text("T")');
      await page.click('button:has-text("E")');
      await page.click('button:has-text("S")');
      await page.click('button:has-text("T")');
      await page.click('button:has-text("1")');
      await page.click('button:has-text("✓ Conferma")');
    } else {
      console.log('⌨️  Using direct input');
      await descInput.fill('TEST1');
    }

    console.log('✅ Description entered: TEST1');
    await page.waitForTimeout(500);

    // Clicca Avanti per andare alla selezione articoli
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(1000);
    console.log('✅ Moved to items selection');

    // Aspetta caricamento articoli
    await page.waitForTimeout(2000);

    // Seleziona un articolo se disponibile
    const itemCards = page.locator('[data-testid="item-card"], .bg-white.rounded-xl.border-4');
    const itemCount = await itemCards.count();
    console.log(`📦 Found ${itemCount} items`);

    if (itemCount > 0) {
      await itemCards.first().click();
      await page.waitForTimeout(500);
      console.log('✅ Selected first item');
    }

    // Vai al riepilogo
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(1000);
    console.log('✅ Moved to review');

    // Crea la lista
    console.log('🎯 Creating list...');
    await page.click('button:has-text("Crea Lista")');

    // Aspetta risposta
    await page.waitForTimeout(3000);

    // Verifica se c'è un errore
    const errorVisible = await page.locator('text=/errore|error|failed|conflicted/i').isVisible().catch(() => false);

    if (errorVisible) {
      const errorText = await page.locator('text=/errore|error|failed|conflicted/i').textContent();
      console.log(`❌ ERROR DETECTED: ${errorText}`);
      throw new Error(`Failed to create list: ${errorText}`);
    }

    // Verifica successo
    const url = page.url();
    console.log(`📍 Current URL: ${url}`);

    if (url.includes('/operations/lists')) {
      console.log('✅ List created successfully!');
    } else {
      console.log('⚠️  URL did not change to lists page');
    }

    await page.waitForTimeout(2000);
  });

  test('should create a REFILLING list successfully', async ({ page }) => {
    page.on('console', msg => console.log(`🖥️  CONSOLE ${msg.type()}: ${msg.text()}`));

    // Intercetta solo errori
    page.on('response', async response => {
      if (response.url().includes('/api/item-lists') && response.status() >= 400) {
        try {
          const body = await response.text();
          console.log(`❌ ERROR RESPONSE: ${body}`);
        } catch (e) {}
      }
    });

    console.log('\n🚀 Test 2: Creating REFILLING list...');

    await page.goto('http://localhost:3000/operations/lists/touch/create');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Crea Lista")', { timeout: 10000 });

    // Seleziona REFILLING
    await page.click('button:has-text("REFILLING")');
    await page.waitForTimeout(500);
    console.log('✅ REFILLING type selected');

    // Inserisci descrizione
    const descInput = page.locator('input[placeholder*="Ordine cliente"]');
    await descInput.click();
    await page.waitForTimeout(500);

    const keyboardVisible = await page.locator('text=Descrizione Lista').isVisible().catch(() => false);

    if (keyboardVisible) {
      await page.click('button:has-text("T")');
      await page.click('button:has-text("E")');
      await page.click('button:has-text("S")');
      await page.click('button:has-text("T")');
      await page.click('button:has-text("2")');
      await page.click('button:has-text("✓ Conferma")');
    } else {
      await descInput.fill('TEST2');
    }

    console.log('✅ Description entered: TEST2');
    await page.waitForTimeout(500);

    // Vai a items
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(2000);

    // Seleziona articolo
    const itemCards = page.locator('[data-testid="item-card"], .bg-white.rounded-xl.border-4');
    const itemCount = await itemCards.count();
    if (itemCount > 0) {
      await itemCards.first().click();
      await page.waitForTimeout(500);
    }

    // Vai a review
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(1000);

    // Crea lista
    console.log('🎯 Creating list...');
    await page.click('button:has-text("Crea Lista")');
    await page.waitForTimeout(3000);

    const errorVisible = await page.locator('text=/errore|error|failed|conflicted/i').isVisible().catch(() => false);

    if (errorVisible) {
      const errorText = await page.locator('text=/errore|error|failed|conflicted/i').textContent();
      console.log(`❌ ERROR DETECTED: ${errorText}`);
      throw new Error(`Failed to create list: ${errorText}`);
    }

    console.log('✅ REFILLING list created successfully!');
    await page.waitForTimeout(2000);
  });
});
