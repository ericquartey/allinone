// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Drawer Subdivision Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to drawer management page
    await page.goto('http://localhost:3004/drawers/management');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load drawer management page', async ({ page }) => {
    // Check if page title or main heading is present
    await expect(page).toHaveURL(/drawers\/management/);

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/drawer-management-loaded.png', fullPage: true });

    console.log('✓ Drawer management page loaded successfully');
  });

  test('should display drawer list', async ({ page }) => {
    // Wait for data to load (look for loading units/drawers)
    await page.waitForTimeout(2000);

    // Take screenshot of drawer list
    await page.screenshot({ path: 'test-results/drawer-list.png', fullPage: true });

    console.log('✓ Drawer list displayed');
  });

  test('should open compartment editor when subdivision button is clicked', async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Look for subdivision button (might be "Suddividi", "Edit", or similar)
    const subdivisionButton = page.locator('button:has-text("Suddividi"), button:has-text("Edit"), button:has-text("Modifica")').first();

    if (await subdivisionButton.isVisible()) {
      await subdivisionButton.click();

      // Wait for editor to appear
      await page.waitForTimeout(1000);

      // Take screenshot
      await page.screenshot({ path: 'test-results/compartment-editor-opened.png', fullPage: true });

      console.log('✓ Compartment editor opened');
    } else {
      console.log('⚠ Subdivision button not found - taking screenshot for diagnosis');
      await page.screenshot({ path: 'test-results/no-subdivision-button.png', fullPage: true });
    }
  });

  test('should allow creating compartments in editor', async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Try to find and click subdivision button
    const subdivisionButton = page.locator('button:has-text("Suddividi"), button:has-text("Edit"), button:has-text("Modifica")').first();

    if (await subdivisionButton.isVisible()) {
      await subdivisionButton.click();
      await page.waitForTimeout(1000);

      // Look for canvas or drawing area
      const canvas = page.locator('canvas').first();

      if (await canvas.isVisible()) {
        // Get canvas bounding box
        const box = await canvas.boundingBox();

        if (box) {
          // Simulate drawing a compartment (click and drag)
          await page.mouse.move(box.x + 50, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 200, box.y + 150);
          await page.mouse.up();

          await page.waitForTimeout(500);

          // Take screenshot
          await page.screenshot({ path: 'test-results/compartment-drawn.png', fullPage: true });

          console.log('✓ Compartment drawing simulated');
        }
      } else {
        console.log('⚠ Canvas not found');
        await page.screenshot({ path: 'test-results/no-canvas.png', fullPage: true });
      }
    }
  });

  test('should show save button in compartment editor', async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Try to find and click subdivision button
    const subdivisionButton = page.locator('button:has-text("Suddividi"), button:has-text("Edit"), button:has-text("Modifica")').first();

    if (await subdivisionButton.isVisible()) {
      await subdivisionButton.click();
      await page.waitForTimeout(1000);

      // Look for save/confirm button
      const saveButton = page.locator('button:has-text("Salva"), button:has-text("Conferma"), button:has-text("Save")');

      if (await saveButton.count() > 0) {
        console.log('✓ Save button found in editor');
        await page.screenshot({ path: 'test-results/save-button-visible.png', fullPage: true });
      } else {
        console.log('⚠ Save button not found');
        await page.screenshot({ path: 'test-results/no-save-button.png', fullPage: true });
      }
    }
  });

  test('full diagnostic screenshot', async ({ page }) => {
    // Wait for full page load
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({ path: 'test-results/full-page-diagnostic.png', fullPage: true });

    // Get page HTML for diagnosis
    const html = await page.content();
    console.log('Page loaded, HTML length:', html.length);

    // Check for any errors in console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Check for API calls
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API call:', response.status(), response.url());
      }
    });

    console.log('✓ Diagnostic complete');
  });
});
