/**
 * Verification test to confirm CORS fix is working
 */
import { test, expect } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3001';

test.describe('CORS Fix Verification', () => {

  test('Verify API requests work without CORS errors', async ({ page }) => {
    console.log('\n=== CORS FIX VERIFICATION TEST ===\n');

    const errors: string[] = [];
    const apiRequests: any[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && text.includes('CORS')) {
        errors.push(text);
      }
    });

    // Capture API requests
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/EjLogHostVertimag/')) {
        const status = response.status();
        console.log(`API Response: ${url} - Status: ${status}`);

        let data = null;
        try {
          data = await response.json();
        } catch (e) {
          // Not JSON
        }

        apiRequests.push({
          url,
          status,
          data
        });
      }
    });

    // Navigate to dashboard
    await page.goto(FRONTEND_URL);
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/dashboard-after-fix.png',
      fullPage: true
    });

    // Check for CORS errors
    console.log(`\nCORS Errors Found: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('✓ No CORS errors!');
    }

    // Check API requests
    console.log(`\nAPI Requests: ${apiRequests.length}`);
    apiRequests.forEach((req, idx) => {
      console.log(`\n${idx + 1}. ${req.url}`);
      console.log(`   Status: ${req.status}`);
      if (req.data) {
        console.log(`   Data:`, JSON.stringify(req.data).substring(0, 200));
      }
    });

    // Assertions
    expect(errors.length).toBe(0);
    expect(apiRequests.length).toBeGreaterThan(0);

    // Check that we got successful responses
    const successfulRequests = apiRequests.filter(r => r.status === 200);
    console.log(`\nSuccessful API Requests: ${successfulRequests.length}`);
    expect(successfulRequests.length).toBeGreaterThan(0);

    // Check if dashboard shows real data
    const hasData = apiRequests.some(r =>
      r.data &&
      r.data.result === 'OK' &&
      r.data.recordNumber &&
      r.data.recordNumber > 0
    );

    console.log(`\nReal Data Received: ${hasData ? 'YES ✓' : 'NO ✗'}`);
    expect(hasData).toBe(true);

    // Try to find stat cards and verify they show numbers
    try {
      await page.waitForSelector('text=/Dashboard WMS/', { timeout: 5000 });

      // Wait a bit more for data to load
      await page.waitForTimeout(2000);

      // Try to find numeric values in the cards
      const pageContent = await page.content();
      console.log('\n=== Checking Dashboard Display ===');

      // Look for the Material-UI Typography elements that should contain numbers
      const numbers = await page.$$eval('h4', elements =>
        elements
          .map(el => el.textContent?.trim())
          .filter(text => text && /^\d+/.test(text))
      );

      console.log(`Numbers found in dashboard: ${numbers.join(', ')}`);

      if (numbers.length > 0) {
        console.log('✓ Dashboard is displaying numeric data!');
        const hasNonZeroNumbers = numbers.some(n => parseInt(n) > 0);
        if (hasNonZeroNumbers) {
          console.log('✓ Dashboard has non-zero values - real data confirmed!');
        }
      }
    } catch (e) {
      console.log('Could not verify dashboard content:', e);
    }

    console.log('\n=== TEST COMPLETE ===\n');
  });

  test('Check Items page displays data', async ({ page }) => {
    console.log('\n=== ITEMS PAGE VERIFICATION ===\n');

    const apiCalls: any[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/Items')) {
        const status = response.status();
        let data = null;
        try {
          data = await response.json();
        } catch (e) {}
        apiCalls.push({ url: response.url(), status, data });
      }
    });

    await page.goto(`${FRONTEND_URL}/items`);
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/items-page-after-fix.png',
      fullPage: true
    });

    console.log(`Items API calls: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      console.log(`\n${call.url}`);
      console.log(`Status: ${call.status}`);
      if (call.data) {
        console.log(`Result: ${call.data.result}`);
        console.log(`Records: ${call.data.recordNumber || 0}`);
        if (call.data.exportedItems) {
          console.log(`Sample items:`, call.data.exportedItems.slice(0, 3).map((i: any) => i.code));
        }
      }
    });

    // Verify we got data
    const hasSuccessfulCall = apiCalls.some(c =>
      c.status === 200 &&
      c.data &&
      c.data.result === 'OK'
    );

    console.log(`\nItems data loaded: ${hasSuccessfulCall ? 'YES ✓' : 'NO ✗'}`);
    expect(hasSuccessfulCall).toBe(true);
  });

  test('Check Lists page displays data', async ({ page }) => {
    console.log('\n=== LISTS PAGE VERIFICATION ===\n');

    const apiCalls: any[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/Lists')) {
        const status = response.status();
        let data = null;
        try {
          data = await response.json();
        } catch (e) {}
        apiCalls.push({ url: response.url(), status, data });
      }
    });

    await page.goto(`${FRONTEND_URL}/lists`);
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/lists-page-after-fix.png',
      fullPage: true
    });

    console.log(`Lists API calls: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      console.log(`\n${call.url}`);
      console.log(`Status: ${call.status}`);
      if (call.data) {
        console.log(`Result: ${call.data.result}`);
        console.log(`Records: ${call.data.recordNumber || 0}`);
      }
    });

    // Verify we got data
    const hasSuccessfulCall = apiCalls.some(c =>
      c.status === 200 &&
      c.data &&
      c.data.result === 'OK'
    );

    console.log(`\nLists data loaded: ${hasSuccessfulCall ? 'YES ✓' : 'NO ✗'}`);
    expect(hasSuccessfulCall).toBe(true);
  });

  test('Check Stock page displays data', async ({ page }) => {
    console.log('\n=== STOCK PAGE VERIFICATION ===\n');

    const apiCalls: any[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/Stock')) {
        const status = response.status();
        let data = null;
        try {
          data = await response.json();
        } catch (e) {}
        apiCalls.push({ url: response.url(), status, data });
      }
    });

    await page.goto(`${FRONTEND_URL}/stock`);
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/stock-page-after-fix.png',
      fullPage: true
    });

    console.log(`Stock API calls: ${apiCalls.length}`);
    apiCalls.forEach(call => {
      console.log(`\n${call.url}`);
      console.log(`Status: ${call.status}`);
      if (call.data) {
        console.log(`Result: ${call.data.result}`);
        console.log(`Records: ${call.data.recordNumber || 0}`);
      }
    });

    // Verify we got data
    const hasSuccessfulCall = apiCalls.some(c =>
      c.status === 200 &&
      c.data &&
      c.data.result === 'OK'
    );

    console.log(`\nStock data loaded: ${hasSuccessfulCall ? 'YES ✓' : 'NO ✗'}`);
    expect(hasSuccessfulCall).toBe(true);
  });
});
