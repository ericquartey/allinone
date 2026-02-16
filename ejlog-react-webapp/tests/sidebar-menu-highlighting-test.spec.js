// ============================================================================
// Sidebar Menu Highlighting Test
// Verifica che solo la voce attiva venga evidenziata nel menu RF Operations
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Sidebar Menu Highlighting Fix', () => {
  test('should only highlight the active menu item in RF Operations', async ({ page }) => {
    console.log('🧪 Test: Sidebar menu highlighting - only active item should be highlighted');

    // Navigate to the execution lists page
    await page.goto('http://localhost:3002/lists/execution');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for React to render

    console.log('✅ Page loaded: /lists/execution');

    // Wait for sidebar to be visible
    await page.waitForSelector('aside', { state: 'visible' });
    console.log('✅ Sidebar is visible');

    // Find the "Operazioni RF" section
    const rfSection = page.locator('button:has-text("OPERAZIONI RF")');
    await expect(rfSection).toBeVisible();
    console.log('✅ Found "Operazioni RF" section');

    // Make sure the section is expanded (click if needed)
    const isExpanded = await page.locator('nav').locator('text=Lista Prenotazioni').isVisible();
    if (!isExpanded) {
      await rfSection.click();
      await page.waitForTimeout(500); // Wait for animation
      console.log('✅ Expanded "Operazioni RF" section');
    }

    // Get all submenu items in RF Operations section
    const submenuItems = await page.locator('nav ul li a').filter({
      hasText: /Lista Prenotazioni|Esecuzione Prelievo|Esecuzione Riassortimento|Esecuzione Inventario|Movimentazioni RF|Stampe RF/
    }).all();

    console.log(`✅ Found ${submenuItems.length} submenu items`);

    // Count how many items have the active (red) background
    let activeCount = 0;
    let activeItemText = '';

    for (const item of submenuItems) {
      const classes = await item.getAttribute('class');
      const text = await item.textContent();

      if (classes && classes.includes('bg-ferretto-red')) {
        activeCount++;
        activeItemText = text;
        console.log(`🔴 Active item found: "${text}"`);
      } else {
        console.log(`⚪ Inactive item: "${text}"`);
      }
    }

    console.log(`\n📊 Active items count: ${activeCount}`);

    // ASSERT: Only ONE item should be highlighted
    expect(activeCount).toBe(1);
    console.log(`✅ PASS: Only 1 menu item is highlighted (not all together)`);

    // Verify the highlighted item is "Lista Prenotazioni" (since we're on /lists/execution)
    expect(activeItemText.trim()).toContain('Lista Prenotazioni');
    console.log(`✅ PASS: Correct item is highlighted: "${activeItemText.trim()}"`);

    // Additional check: verify other items are NOT highlighted
    const inactiveItems = await page.locator('nav ul li a').filter({
      hasText: /Esecuzione Prelievo|Esecuzione Riassortimento|Esecuzione Inventario|Movimentazioni RF|Stampe RF/
    }).all();

    for (const item of inactiveItems) {
      const classes = await item.getAttribute('class');
      const text = await item.textContent();

      expect(classes).not.toContain('bg-ferretto-red');
      console.log(`✅ "${text.trim()}" is correctly NOT highlighted`);
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('✅ Sidebar menu highlighting bug is FIXED');
    console.log('✅ Only one item is highlighted at a time');
    console.log('✅ All other items remain inactive');
  });

  test('should highlight different item when navigating to different page', async ({ page }) => {
    console.log('\n🧪 Test: Highlighting changes when navigating to different pages');

    // Start at execution lists
    await page.goto('http://localhost:3002/lists/execution');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    console.log('✅ Started at: /lists/execution');

    // Expand RF Operations if needed
    const rfSection = page.locator('button:has-text("OPERAZIONI RF")');
    const isExpanded = await page.locator('nav').locator('text=Lista Prenotazioni').isVisible();
    if (!isExpanded) {
      await rfSection.click();
      await page.waitForTimeout(500);
    }

    // Verify "Lista Prenotazioni" is highlighted
    const listaPrenotazioni = page.locator('a:has-text("Lista Prenotazioni")').first();
    const classes1 = await listaPrenotazioni.getAttribute('class');
    expect(classes1).toContain('bg-ferretto-red');
    console.log('✅ "Lista Prenotazioni" is highlighted on /lists/execution');

    // Navigate to a different page (e.g., Product Search)
    await page.goto('http://localhost:3002/products/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to: /products/search');

    // Expand RF Operations again
    const rfSection2 = page.locator('button:has-text("OPERAZIONI RF")');
    const isExpanded2 = await page.locator('nav').locator('text=Lista Prenotazioni').isVisible();
    if (!isExpanded2) {
      await rfSection2.click();
      await page.waitForTimeout(500);
    }

    // Verify "Lista Prenotazioni" is NO LONGER highlighted
    const listaPrenotazioni2 = page.locator('a:has-text("Lista Prenotazioni")').first();
    const classes2 = await listaPrenotazioni2.getAttribute('class');
    expect(classes2).not.toContain('bg-ferretto-red');
    console.log('✅ "Lista Prenotazioni" is NO LONGER highlighted on /products/search');

    console.log('\n🎉 Test completed successfully!');
    console.log('✅ Menu highlighting correctly changes when navigating');
    console.log('✅ Only the page you are on is highlighted');
  });
});
