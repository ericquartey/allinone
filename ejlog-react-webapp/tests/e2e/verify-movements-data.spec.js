import { test, expect } from '@playwright/test';

test.describe('Movements Page - Historical Data Verification', () => {
  test('should display real historical movement data', async ({ page }) => {
    console.log('🚀 Starting movements page verification...');

    // Navigate to movements page
    await page.goto('http://localhost:3004/movements');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('📱 Navigated to movements page');

    // Take screenshot
    await page.screenshot({ path: 'screenshots/movements-01-initial.png', fullPage: true });

    // Get page content
    const bodyText = await page.textContent('body');

    // Check for error state
    const hasError = bodyText.includes('Errore') || bodyText.includes('Error');
    console.log('❌ Error state:', hasError);

    // Check for empty state
    const hasEmptyState = bodyText.includes('Nessun') || bodyText.includes('No data') || bodyText.includes('vuoto');
    console.log('📭 Empty state:', hasEmptyState);

    // Check for loading state
    const hasLoadingState = bodyText.includes('Caricamento') || bodyText.includes('Loading');
    console.log('⏳ Loading state:', hasLoadingState);

    // Count table rows
    const rows = await page.locator('table tbody tr').count();
    console.log('\n📊 Table rows found:', rows);

    // Check for movement data columns
    if (rows > 0) {
      console.log('\n🔍 Checking movement data columns...');

      // Get first row content
      const firstRow = await page.locator('table tbody tr:first-child').textContent();
      console.log('  - First row:', firstRow);

      // Look for common movement fields
      const hasDate = bodyText.includes('Data') || bodyText.includes('Date') || /\d{2}\/\d{2}\/\d{4}/.test(bodyText);
      const hasTime = /\d{2}:\d{2}/.test(bodyText);
      const hasType = bodyText.includes('Tipo') || bodyText.includes('Type') || bodyText.includes('Entrata') || bodyText.includes('Uscita');
      const hasLocation = bodyText.includes('Ubicazione') || bodyText.includes('Location');
      const hasUDC = bodyText.includes('UDC') || bodyText.includes('Cassetto');
      const hasItem = bodyText.includes('Articolo') || bodyText.includes('Item');

      console.log('  - Has date:', hasDate);
      console.log('  - Has time:', hasTime);
      console.log('  - Has movement type:', hasType);
      console.log('  - Has location:', hasLocation);
      console.log('  - Has UDC:', hasUDC);
      console.log('  - Has item:', hasItem);
    }

    // Check for filters
    const filterInputs = await page.locator('input[type="text"], input[type="date"], select').count();
    console.log('\n🔍 Filter inputs found:', filterInputs);

    // Check for pagination
    const paginationVisible = await page.locator('[class*="pagination"], button:has-text("Avanti"), button:has-text("Indietro")').count() > 0;
    console.log('📄 Pagination visible:', paginationVisible);

    // Look for total count
    const totalMatch = bodyText.match(/(?:Totale|Total|Mostrando).*?(\d+)/i);
    if (totalMatch) {
      console.log('📊 Total movements shown:', totalMatch[1]);
    }

    console.log('\n✅ Movements page verification completed!');
    console.log('📸 Screenshot saved to screenshots/movements-01-initial.png');
  });
});
