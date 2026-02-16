import { test, expect } from '@playwright/test';

test.describe('Dashboard Advanced - Diagnostic Test', () => {
  test('should capture all console logs and network requests', async ({ page }) => {
    console.log('\n=== DIAGNOSTIC: Capturing all logs and network activity ===');

    const consoleMessages = [];
    const networkRequests = [];
    const networkResponses = [];

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      console.log(`[CONSOLE ${msg.type()}] ${text}`);
    });

    // Capture network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
      console.log(`[REQUEST] ${request.method()} ${request.url()}`);
    });

    // Capture network responses
    page.on('response', response => {
      networkResponses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
    });

    // Navigate to dashboard-advanced
    console.log('\n--- Navigating to /dashboard-advanced ---');
    await page.goto('http://localhost:3001/dashboard-advanced');

    // Wait for navigation to settle
    await page.waitForTimeout(5000);

    // Check current URL
    const currentUrl = page.url();
    console.log(`\n--- Final URL: ${currentUrl} ---`);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/dashboard-diagnostic-final.png',
      fullPage: true
    });

    // Print summary
    console.log('\n=== CONSOLE LOGS SUMMARY ===');
    consoleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
    });

    console.log('\n=== API REQUESTS (401 errors) ===');
    const api401 = networkResponses.filter(r => r.status === 401 && r.url.includes('/api'));
    api401.forEach(r => {
      console.log(`- ${r.url} -> ${r.status}`);
    });

    console.log('\n=== REDIRECT EVIDENCE ===');
    const redirects = networkResponses.filter(r => r.status >= 300 && r.status < 400);
    redirects.forEach(r => {
      console.log(`- ${r.url} -> ${r.status} ${r.statusText}`);
    });

    console.log('\n=== DIAGNOSTIC COMPLETE ===');
  });
});
