// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Lists Management Implementation Verification', () => {
  test('should display PICK1742 list with complete UI', async ({ page }) => {
    console.log('='.repeat(70));
    console.log('TESTING LISTS MANAGEMENT - VERIFICA IMPLEMENTAZIONE COMPLETA');
    console.log('='.repeat(70));

    // Navigate to lists management page
    console.log('\n1. Navigating to http://localhost:3005/lists/management...');
    await page.goto('http://localhost:3005/lists/management');
    await page.waitForLoadState('domcontentloaded');

    // Wait for API call to complete
    console.log('2. Waiting for API data to load...');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/lists-implementation-verification.png',
      fullPage: true
    });

    // Check for PICK1742 in page content
    const pageContent = await page.content();
    const hasPICK1742 = pageContent.includes('PICK1742');

    console.log('\n=== VERIFICATION RESULTS ===');
    console.log('✓ Page Content Includes PICK1742:', hasPICK1742);

    // Check for UI components
    const checks = {
      hasTitle: await page.locator('text=Gestione Liste').count() > 0,
      hasSidebar: await page.locator('[class*="sidebar"]').count() > 0,
      hasTable: await page.locator('table').count() > 0,
      hasButtons: await page.locator('button').count() > 0,
      hasFilters: await page.locator('input').count() > 0
    };

    console.log('\n=== UI COMPONENTS CHECK ===');
    console.log('✓ Title "Gestione Liste":', checks.hasTitle);
    console.log('✓ Sidebar:', checks.hasSidebar);
    console.log('✓ Table:', checks.hasTable);
    console.log('✓ Buttons:', checks.hasButtons);
    console.log('✓ Filter Inputs:', checks.hasFilters);

    // Count buttons
    const buttonCount = await page.locator('button').count();
    console.log('\n✓ Total Buttons Found:', buttonCount);

    // Get all button texts
    console.log('\n=== BUTTON TEXTS (First 20) ===');
    const allButtons = page.locator('button');
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      try {
        const buttonText = await allButtons.nth(i).textContent();
        console.log(`  ${i + 1}. "${buttonText?.trim()}"`);
      } catch (e) {
        console.log(`  ${i + 1}. [Error reading button]`);
      }
    }

    // Check for specific text patterns
    console.log('\n=== CRITICAL CHECKS ===');
    const criticalTexts = [
      { text: 'PICK1742', found: pageContent.includes('PICK1742') },
      { text: 'Aggiorna', found: pageContent.includes('Aggiorna') },
      { text: 'Pulisci', found: pageContent.includes('Pulisci') },
      { text: 'Inserisci', found: pageContent.includes('Inserisci') },
      { text: 'Modifica', found: pageContent.includes('Modifica') },
      { text: 'Prenota', found: pageContent.includes('Prenota') },
      { text: 'Esegui', found: pageContent.includes('Esegui') },
      { text: 'Attesa', found: pageContent.includes('Attesa') },
      { text: 'Termina', found: pageContent.includes('Termina') }
    ];

    criticalTexts.forEach(item => {
      console.log(`  ${item.found ? '✓' : '✗'} ${item.text}`);
    });

    // Check if table has rows
    const tableRows = await page.locator('table tbody tr').count();
    console.log('\n✓ Table Rows Found:', tableRows);

    // Look for status badges
    const badges = await page.locator('[class*="badge"], [class*="bg-"]').count();
    console.log('✓ Status Badges Found:', badges);

    // Final summary
    console.log('\n' + '='.repeat(70));
    if (hasPICK1742) {
      console.log('✅ SUCCESS: PICK1742 is visible in the page!');
    } else {
      console.log('❌ WARNING: PICK1742 not found in page content');
    }

    if (checks.hasTitle && checks.hasTable && checks.hasButtons) {
      console.log('✅ SUCCESS: All major UI components are present!');
    } else {
      console.log('❌ WARNING: Some UI components are missing');
    }
    console.log('='.repeat(70));

    // Assertions
    expect(hasPICK1742).toBe(true);
    expect(checks.hasTitle).toBe(true);
    expect(checks.hasTable).toBe(true);
  });
});
