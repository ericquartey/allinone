import { test, expect } from '@playwright/test';

test('Debug Lists Page - Find why data not showing', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log('🖥️ BROWSER:', msg.text());
  });

  console.log('🌐 Going to http://localhost:8090/lists...');
  await page.goto('http://localhost:8090/lists', { waitUntil: 'networkidle' });

  // Wait for network request to complete
  await page.waitForTimeout(3000);

  // Check API response
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch('/api/lists?limit=100');
    const data = await response.json();
    return { status: response.status, data };
  });

  console.log('📊 API Response:', JSON.stringify(apiResponse, null, 2));

  // Check if lists state has data
  const reactState = await page.evaluate(() => {
    // Check if there are any table rows
    const rows = document.querySelectorAll('table tbody tr');
    return {
      tableRowCount: rows.length,
      tableHTML: document.querySelector('table')?.outerHTML.substring(0, 500),
      bodyText: document.body.innerText.substring(0, 1000)
    };
  });

  console.log('📋 React State:', JSON.stringify(reactState, null, 2));

  // Take screenshot
  await page.screenshot({
    path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\tests\\screenshots\\lists-final-debug.png',
    fullPage: true
  });

  console.log('📸 Screenshot saved');
  console.log('✅ Test completed');
});
