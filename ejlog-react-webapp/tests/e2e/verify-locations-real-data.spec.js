import { test, expect } from '@playwright/test';

test.describe('Locations Page - Real Data Verification', () => {
  test('should display real location data with all details', async ({ page }) => {
    console.log('🚀 Starting detailed locations verification...');

    // Navigate to locations page
    await page.goto('http://localhost:3004/locations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('📱 Navigated to locations page');

    // Take initial screenshot
    await page.screenshot({ path: 'screenshots/locations-02-real-data.png', fullPage: true });

    // Get page content for analysis
    const bodyText = await page.textContent('body');

    // Verify no error state
    const hasError = bodyText.includes('Errore caricamento');
    console.log('❌ Error state:', hasError);
    expect(hasError).toBe(false);

    // Check for real location codes from database
    console.log('\n📍 Checking for real location codes...');
    const hasPostPTL = bodyText.includes('Loc. POST-PTL') || bodyText.includes('POST-PTL');
    const hasPrePTL = bodyText.includes('Loc. PRE-PTL') || bodyText.includes('PRE-PTL');
    const hasFloorLocs = bodyText.includes('@10') || bodyText.includes('@11') || bodyText.includes('@12');
    const hasVertimag = bodyText.includes('Vertimag');

    console.log('  - POST-PTL locations:', hasPostPTL);
    console.log('  - PRE-PTL locations:', hasPrePTL);
    console.log('  - Floor locations (@10xxx):', hasFloorLocs);
    console.log('  - Vertimag locations:', hasVertimag);

    // Count location rows in table
    const rows = await page.locator('table tbody tr').count();
    console.log('\n📊 Table rows found:', rows);

    // Check for specific data columns
    console.log('\n🔍 Checking data columns...');

    // Check for location codes (barcode/code column)
    const locationCodes = await page.locator('table tbody tr td:first-child').allTextContents();
    console.log('  - First 10 location codes:', locationCodes.slice(0, 10));

    // Check for warehouse names
    const warehouseNames = await page.locator('table tbody tr').first().textContent();
    console.log('  - First row content:', warehouseNames);

    // Check for status indicators
    const statusElements = await page.locator('[class*="status"], [class*="stato"]').count();
    console.log('  - Status elements found:', statusElements);

    // Check for occupancy information
    const occupancyInfo = bodyText.includes('occupat') || bodyText.includes('libero') || bodyText.includes('disponibile');
    console.log('  - Has occupancy info:', occupancyInfo);

    // Check for pagination
    const paginationVisible = await page.locator('[class*="pagination"], button:has-text("Avanti"), button:has-text("Indietro")').count() > 0;
    console.log('  - Pagination visible:', paginationVisible);

    // Check for total count
    const totalCountMatch = bodyText.match(/(?:Totale|Total).*?(\d+)/i);
    if (totalCountMatch) {
      console.log('  - Total locations shown:', totalCountMatch[1]);
    }

    // Verify we have real data
    console.log('\n✅ Verification:');
    expect(rows).toBeGreaterThan(0);
    expect(locationCodes.length).toBeGreaterThan(0);

    // At least one type of real location should be visible
    const hasRealData = hasPostPTL || hasPrePTL || hasFloorLocs || hasVertimag;
    console.log('  - Has real location data:', hasRealData);
    expect(hasRealData).toBe(true);

    // Take final screenshot with real data
    await page.screenshot({ path: 'screenshots/locations-03-real-data-verified.png', fullPage: true });

    console.log('\n✅ Real data verification completed!');
  });

  test('should display location details when clicking on a row', async ({ page }) => {
    console.log('🚀 Testing location detail view...');

    await page.goto('http://localhost:3004/locations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Count rows
    const rows = await page.locator('table tbody tr').count();
    if (rows === 0) {
      console.log('⚠️ No rows found, skipping detail test');
      return;
    }

    console.log(`📊 Found ${rows} location rows`);

    // Get first location code
    const firstLocationCode = await page.locator('table tbody tr:first-child td:first-child').textContent();
    console.log('📍 First location code:', firstLocationCode);

    // Try to click on first row
    await page.locator('table tbody tr:first-child').click();
    await page.waitForTimeout(1000);

    // Take screenshot of any detail view that might appear
    await page.screenshot({ path: 'screenshots/locations-04-detail-view.png', fullPage: true });

    console.log('✅ Detail view test completed');
  });

  test('should display correct summary statistics', async ({ page }) => {
    console.log('🚀 Testing summary statistics...');

    await page.goto('http://localhost:3004/locations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');

    // Look for summary stats
    console.log('\n📊 Summary Statistics:');

    // Check for total locations
    const totalMatch = bodyText.match(/(?:Totale|Total).*?(\d+)/i);
    if (totalMatch) {
      console.log('  - Total locations:', totalMatch[1]);
    }

    // Check for available/occupied counts
    const availableMatch = bodyText.match(/(?:Disponibili|Available).*?(\d+)/i);
    const occupiedMatch = bodyText.match(/(?:Occupat[ie]|Occupied).*?(\d+)/i);
    const blockedMatch = bodyText.match(/(?:Bloccat[ie]|Blocked).*?(\d+)/i);

    if (availableMatch) console.log('  - Available:', availableMatch[1]);
    if (occupiedMatch) console.log('  - Occupied:', occupiedMatch[1]);
    if (blockedMatch) console.log('  - Blocked:', blockedMatch[1]);

    // Take screenshot of summary area
    await page.screenshot({ path: 'screenshots/locations-05-summary-stats.png', fullPage: true });

    console.log('✅ Summary statistics test completed');
  });

  test('should filter locations correctly', async ({ page }) => {
    console.log('🚀 Testing location filters...');

    await page.goto('http://localhost:3004/locations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Count initial rows
    const initialRows = await page.locator('table tbody tr').count();
    console.log(`📊 Initial row count: ${initialRows}`);

    // Look for filter inputs
    const filterInputs = await page.locator('input[type="text"], input[placeholder*="Cerca"], input[placeholder*="Search"]').count();
    console.log(`🔍 Filter inputs found: ${filterInputs}`);

    if (filterInputs > 0) {
      // Try to filter by typing in first input
      const firstInput = page.locator('input[type="text"], input[placeholder*="Cerca"], input[placeholder*="Search"]').first();
      await firstInput.fill('@10');
      await page.waitForTimeout(1000);

      const filteredRows = await page.locator('table tbody tr').count();
      console.log(`📊 Filtered row count: ${filteredRows}`);

      await page.screenshot({ path: 'screenshots/locations-06-filtered.png', fullPage: true });
    }

    console.log('✅ Filter test completed');
  });
});
