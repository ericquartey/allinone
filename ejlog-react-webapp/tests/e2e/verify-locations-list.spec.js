import { test, expect } from '@playwright/test';

test.describe('Locations List Verification', () => {
  test('should display real location data in locations page', async ({ page }) => {
    console.log('🚀 Starting locations list verification...');

    // Navigate to locations page
    await page.goto('http://localhost:3004/locations');
    console.log('📱 Navigated to locations page');

    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/locations-01-page-load.png', fullPage: true });

    // Get page content
    const bodyText = await page.textContent('body');
    console.log('📄 Page loaded, checking content...');

    // Check for known real locations
    const hasLocPostPTL = bodyText.includes('Loc. POST-PTL') || bodyText.includes('POST-PTL');
    const hasLocPrePTL = bodyText.includes('Loc. PRE-PTL') || bodyText.includes('PRE-PTL');
    const hasVertimag = bodyText.includes('Vertimag') || bodyText.includes('vertimag');
    const hasFloorLoc = bodyText.includes('@10002') || bodyText.includes('@10003');

    console.log('📍 Location "Loc. POST-PTL" found:', hasLocPostPTL);
    console.log('📍 Location "Loc. PRE-PTL" found:', hasLocPrePTL);
    console.log('📍 Location "Vertimag" found:', hasVertimag);
    console.log('📍 Floor locations (@10xxx) found:', hasFloorLoc);

    // Check page structure
    const tables = await page.locator('table').count();
    const rows = await page.locator('tr').count();
    const cards = await page.locator('[class*="card"]').count();
    const locationItems = await page.locator('[class*="location"], [data-location], tr').count();

    console.log(`📊 Page elements: ${tables} tables, ${rows} rows, ${cards} cards, ${locationItems} location items`);

    // Check for pagination elements
    const paginationButtons = await page.locator('button:has-text("Next"), button:has-text("Previous"), button:has-text("Successivo"), button:has-text("Precedente")').count();
    const pageInfo = bodyText.includes('283') || bodyText.includes('Total') || bodyText.includes('Totale');

    console.log(`📄 Pagination: ${paginationButtons} buttons, total count visible: ${pageInfo}`);

    // Look for empty state or loading messages
    const hasEmptyMessage = bodyText.includes('No data') || bodyText.includes('Nessun dato') || bodyText.includes('Empty');
    const hasLoadingMessage = bodyText.includes('Loading') || bodyText.includes('Caricamento');

    console.log('⚠️  Empty state:', hasEmptyMessage);
    console.log('⏳ Loading state:', hasLoadingMessage);

    // Screenshot after initial load
    await page.screenshot({ path: 'screenshots/locations-02-final.png', fullPage: true });

    console.log('\n✅ Locations list verification completed!');
    console.log('📸 Check screenshots in screenshots/ directory');
    console.log('📊 Expected: 283 real locations should be visible');

    // Assertion: should have at least some location data visible
    expect(hasLocPostPTL || hasLocPrePTL || hasVertimag || hasFloorLoc || rows > 5).toBe(true);
  });
});
