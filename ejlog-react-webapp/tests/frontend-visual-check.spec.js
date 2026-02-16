// ============================================================================
// EJLOG WMS - Frontend Visual Check (Simple Test)
// Direct browser test without webServer config
// ============================================================================

const { test, expect } = require('@playwright/test');

test.describe('Frontend Visual Check', () => {
  test('should open frontend and take screenshot', async ({ page }) => {
    console.log('🌐 Opening http://localhost:3002 in browser...');

    // Set viewport size for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });

    try {
      // Navigate to frontend
      const response = await page.goto('http://localhost:3002', {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log('✅ Response status:', response.status());
      console.log('📍 Current URL:', page.url());

      // Get page title
      const title = await page.title();
      console.log('📄 Page title:', title);

      // Check if React root exists
      const rootExists = await page.locator('#root').count() > 0;
      console.log('⚛️  React root exists:', rootExists);

      // Take screenshot
      await page.screenshot({
        path: 'frontend-visual-check.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved: frontend-visual-check.png');

      // Get visible text
      const bodyText = await page.locator('body').textContent();
      console.log('📝 Body content length:', bodyText?.length || 0);
      console.log('📄 First 300 chars:', bodyText?.substring(0, 300));

      // Check for login page elements
      const loginInputs = await page.locator('input[type="text"], input[type="password"]').count();
      console.log('🔐 Login inputs found:', loginInputs);

      // Check for buttons
      const buttons = await page.locator('button').count();
      console.log('🔘 Buttons found:', buttons);

      // Wait 5 seconds for visual inspection
      console.log('⏱️  Waiting 5 seconds for visual inspection...');
      await page.waitForTimeout(5000);

      // Assertions
      expect(response.status()).toBe(200);
      expect(rootExists).toBe(true);
      expect(title).toBeTruthy();

      console.log('✅ All checks passed!');
    } catch (error) {
      console.error('❌ Error:', error.message);

      // Take error screenshot
      await page.screenshot({
        path: 'frontend-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot saved: frontend-error.png');

      throw error;
    }
  });
});
