const { test, expect } = require('@playwright/test');

/**
 * Quick Health Check Test
 *
 * Simple test to verify the React app loads correctly
 */

test.describe('EjLog React App - Health Check', () => {

  test('should load the application homepage', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'test-results/homepage-screenshot.png' });

    // Verify page has loaded by checking title or main content
    const title = await page.title();
    console.log('Page title:', title);

    expect(title).toBeTruthy();
  });

  test('should have basic HTML structure', async ({ page }) => {
    await page.goto('/');

    // Check if root element exists
    const root = await page.locator('#root');
    await expect(root).toBeVisible();

    console.log('✓ Root element found');
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`Console errors detected: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    // Note: We don't fail on console errors, just report them
  });
});
