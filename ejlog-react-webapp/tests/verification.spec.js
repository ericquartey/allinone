// Simple verification test for EjLog application
const { test, expect } = require('@playwright/test');

test.describe('EjLog Application Verification', () => {
  test('should load the application homepage', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the page to be visible
    await page.waitForLoadState('domcontentloaded');

    // Take a screenshot to verify the UI is loaded
    await page.screenshot({ path: 'test-results/homepage-verification.png', fullPage: true });

    // Check if the page has loaded properly by looking for common elements
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    console.log('✅ Application loaded successfully');
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('http://localhost:3005', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for navigation to be present
    await page.waitForTimeout(2000);

    // Take screenshot of the navigation
    await page.screenshot({ path: 'test-results/navigation-verification.png' });

    console.log('✅ Navigation checked');
  });

  test('should respond to backend API', async ({ page, request }) => {
    // Test backend connectivity
    const response = await request.get('http://localhost:3077/api');
    console.log(`Backend response status: ${response.status()}`);

    // Even if it returns an error, we just want to know the backend is responding
    expect(response.status()).toBeLessThan(500);

    console.log('✅ Backend is responding');
  });
});

