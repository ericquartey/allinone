import { test, expect } from '@playwright/test';

test.describe('Items Page Data Display Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to items page
    await page.goto('http://localhost:3001/items');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  });

  test('should display items data from backend', async ({ page }) => {
    // Wait for either loading indicator to disappear or data to appear
    await page.waitForTimeout(2000);

    // Check if there's an error message
    const errorMessage = await page.locator('text=/Errore nel caricamento/i').count();
    if (errorMessage > 0) {
      console.log('Error message found on page');
      const errorText = await page.locator('text=/Errore nel caricamento/i').textContent();
      console.log('Error:', errorText);
    }

    // Check for loading indicator
    const loadingIndicator = await page.locator('text=/Caricamento/i').count();
    if (loadingIndicator > 0) {
      console.log('Loading indicator still present');
    }

    // Check for items table or list
    const hasTable = await page.locator('table').count() > 0;
    const hasItems = await page.locator('[data-testid*="item"]').count() > 0;

    console.log('Has table:', hasTable);
    console.log('Has items:', hasItems);

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/items-page-verification.png',
      fullPage: true
    });

    // Check for specific item codes that we know exist in backend
    const pageContent = await page.content();
    const has07468B = pageContent.includes('07-468B');
    const hasWRLT = pageContent.includes('WRLT3T622-19');

    console.log('Has item 07-468B:', has07468B);
    console.log('Has item WRLT3T622-19:', hasWRLT);

    // Verify at least one of the known items is displayed
    expect(has07468B || hasWRLT).toBeTruthy();
  });

  test('should make successful API call to backend', async ({ page }) => {
    let apiCalled = false;
    let apiSuccess = false;

    // Listen for API requests
    page.on('request', request => {
      if (request.url().includes('/Items')) {
        apiCalled = true;
        console.log('API Request:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/Items')) {
        apiSuccess = response.status() === 200;
        console.log('API Response:', response.status(), response.url());
      }
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    expect(apiCalled).toBeTruthy();
    expect(apiSuccess).toBeTruthy();
  });

  test('should display backend connection indicator', async ({ page }) => {
    // Check for connection status indicator
    const hasBackendConnected = await page.locator('text=/Backend Connesso/i').count() > 0;
    const hasServerData = await page.locator('text=/Dati dal server/i').count() > 0;

    console.log('Has "Backend Connesso":', hasBackendConnected);
    console.log('Has "Dati dal server":', hasServerData);

    // At least one connection indicator should be present
    expect(hasBackendConnected || hasServerData).toBeTruthy();
  });
});
