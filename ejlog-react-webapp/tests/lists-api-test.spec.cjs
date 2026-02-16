// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Lists API Integration', () => {
  test('should fetch lists from API and display data', async ({ page }) => {
    // Navigate to lists management page
    await page.goto('http://localhost:3004/lists/management');
    await page.waitForLoadState('domcontentloaded');

    // Wait for API call to complete
    await page.waitForTimeout(3000);

    // Intercept network requests
    const requests = [];
    const responses = [];

    page.on('request', request => {
      if (request.url().includes('Lists')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
        console.log('API Request:', request.method(), request.url());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('Lists')) {
        const status = response.status();
        let body = null;
        try {
          body = await response.json();
        } catch (e) {
          body = await response.text();
        }
        responses.push({
          url: response.url(),
          status: status,
          body: body
        });
        console.log('API Response:', status, response.url());
        console.log('Response body:', JSON.stringify(body, null, 2));
      }
    });

    // Reload to capture requests
    await page.reload();
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/lists-with-api-data.png', fullPage: true });

    // Check if PICK1742 appears in the page
    const pageContent = await page.content();
    const hasPICK1742 = pageContent.includes('PICK1742');

    console.log('Page contains PICK1742:', hasPICK1742);
    console.log('Total API requests:', requests.length);
    console.log('Total API responses:', responses.length);

    // Log all requests and responses
    requests.forEach((req, i) => {
      console.log(`Request ${i + 1}:`, req.method, req.url);
    });

    responses.forEach((res, i) => {
      console.log(`Response ${i + 1}:`, res.status, res.url);
    });
  });
});
