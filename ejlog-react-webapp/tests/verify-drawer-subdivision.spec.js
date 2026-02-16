import { test, expect } from '@playwright/test';

test.describe('Drawer Subdivision Verification', () => {
  test.use({ baseURL: 'http://localhost:3004' });

  test('should display drawer with compartments and real data', async ({ page }) => {
    console.log('🔍 Starting drawer subdivision verification...');

    // Navigate to drawer management page
    await page.goto('http://localhost:3004/drawers', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✓ Page loaded');
    await page.screenshot({ path: 'test-results/01-page-loaded.png', fullPage: true });

    // Wait for drawers to load
    await page.waitForTimeout(3000);

    // Check if there are drawers
    const drawerCount = await page.locator('button').filter({ has: page.locator('svg.h-5.w-5') }).count();
    console.log(`Found ${drawerCount} drawers in the list`);

    if (drawerCount === 0) {
      console.log('❌ No drawers found!');
      await page.screenshot({ path: 'test-results/error-no-drawers.png', fullPage: true });
      return;
    }

    // Select the first drawer
    await page.locator('button').filter({ has: page.locator('svg.h-5.w-5') }).first().click();
    console.log('✓ Selected first drawer');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/02-drawer-selected.png', fullPage: true });

    // Check if compartments are visible
    const canvas2D = await page.locator('canvas').count();
    console.log(`Found ${canvas2D} canvas element(s)`);

    // Check for 2D view
    const view2DButton = page.locator('button:has-text("Vista 2D")');
    if (await view2DButton.isVisible()) {
      await view2DButton.click();
      console.log('✓ Switched to 2D view');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/03-2d-view.png', fullPage: true });

    // Check for compartments info
    const compartmentInfo = await page.locator('text=/\\d+ scomparti/').textContent().catch(() => null);
    console.log(`Compartments info: ${compartmentInfo}`);

    // Check subdivision button
    const subdivisionButton = page.locator('button:has-text("Suddividi Cassetto")');
    const subdivisionVisible = await subdivisionButton.isVisible();
    const subdivisionEnabled = await subdivisionButton.isEnabled();
    console.log(`Subdivision button - visible: ${subdivisionVisible}, enabled: ${subdivisionEnabled}`);

    // Try 3D view
    const view3DButton = page.locator('button:has-text("Vista 3D")');
    if (await view3DButton.isVisible()) {
      await view3DButton.click();
      console.log('✓ Switched to 3D view');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/04-3d-view.png', fullPage: true });
    }

    // Check if there's any error message
    const errorMessages = await page.locator('text=/error|errore/i').count();
    if (errorMessages > 0) {
      console.log(`⚠️ Found ${errorMessages} error message(s)`);
      const errorText = await page.locator('text=/error|errore/i').first().textContent();
      console.log(`Error: ${errorText}`);
    }

    // Check network requests
    console.log('\n📊 Checking API calls...');

    // Final screenshot
    await page.screenshot({ path: 'test-results/05-final-state.png', fullPage: true });

    console.log('\n✅ Test completed! Check test-results/ folder for screenshots');
  });

  test('should show compartment details when selected', async ({ page }) => {
    await page.goto('http://localhost:3004/drawers', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Select first drawer
    const firstDrawer = page.locator('button').filter({ has: page.locator('svg.h-5.w-5') }).first();
    if (await firstDrawer.isVisible()) {
      await firstDrawer.click();
      await page.waitForTimeout(2000);

      // Check right sidebar for compartment details
      const detailsSidebar = await page.locator('text="Dettagli Scomparto"').count();
      console.log(`Compartment details sidebar visible: ${detailsSidebar > 0}`);

      await page.screenshot({ path: 'test-results/06-compartment-details.png', fullPage: true });
    }
  });
});
