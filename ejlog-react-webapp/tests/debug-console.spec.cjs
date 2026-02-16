// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Debug Console Errors', () => {
  test('should capture console errors on lists-management', async ({ page }) => {
    const consoleMessages = [];
    const errors = [];

    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({type: msg.type(), text: text});
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    console.log('Navigating to http://localhost:3012/lists-management...');

    try {
      await page.goto('http://localhost:3012/lists-management', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
    } catch (e) {
      console.log('Navigation error:', e.message);
    }

    // Wait for page to try rendering
    await page.waitForTimeout(5000);

    // Print all console messages
    console.log('\n=== ALL CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => {
      console.log(`[${msg.type}] ${msg.text}`);
    });

    // Print errors
    console.log('\n=== ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No errors found');
    }

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/debug-console.png',
      fullPage: true
    });

    console.log('\n=== PAGE HTML ===');
    const html = await page.content();
    console.log(`HTML length: ${html.length}`);
    console.log('Body:', await page.locator('body').innerHTML());
  });
});
