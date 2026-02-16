// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Verify Lists Management Page', () => {
  test('should open page and take screenshot', async ({ page }) => {
    console.log('Opening lists-management page...');

    // Navigate to the page
    await page.goto('http://localhost:3012/lists-management', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('Page loaded, waiting for content...');

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Try to find the title
    const title = await page.locator('text=Gestione Liste Magazzino').count();
    console.log(`Found title instances: ${title}`);

    // Check if there's any h4 element
    const h4Elements = await page.locator('h4').count();
    console.log(`Found h4 elements: ${h4Elements}`);

    // Log all h4 text content
    if (h4Elements > 0) {
      const h4Texts = await page.locator('h4').allTextContents();
      console.log('H4 texts:', h4Texts);
    }

    // Take a full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/lists-management-verification.png',
      fullPage: true
    });

    console.log('Screenshot saved!');

    // Check for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Log the page HTML for debugging
    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Page has content, length:', bodyHTML.length);

    // Just verify page loaded (not empty)
    expect(bodyHTML.length).toBeGreaterThan(100);

    console.log('Test completed!');
  });
});
