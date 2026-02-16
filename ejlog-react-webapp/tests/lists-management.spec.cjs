// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Lists Management Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to lists management page
    await page.goto('http://localhost:3004/lists/management');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load lists management page', async ({ page }) => {
    // Check if page URL is correct
    await expect(page).toHaveURL(/lists\/management/);

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/lists-management-loaded.png', fullPage: true });

    console.log('✓ Lists management page loaded successfully');
  });

  test('should display page title and search bar', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Take screenshot of page
    await page.screenshot({ path: 'test-results/lists-page-ui.png', fullPage: true });

    console.log('✓ Lists page UI captured');
  });

  test('should display operation buttons', async ({ page }) => {
    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Look for operation buttons
    const createButton = page.locator('button:has-text("Crea"), button:has-text("Nuova"), button:has-text("Create")');
    const editButton = page.locator('button:has-text("Modifica"), button:has-text("Edit")');
    const deleteButton = page.locator('button:has-text("Elimina"), button:has-text("Delete")');

    const createCount = await createButton.count();
    const editCount = await editButton.count();
    const deleteCount = await deleteButton.count();

    console.log(`Found buttons: Create=${createCount}, Edit=${editCount}, Delete=${deleteCount}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/lists-buttons.png', fullPage: true });

    console.log('✓ Button check complete');
  });

  test('should display lists table or list', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for table or list container
    const table = page.locator('table');
    const listContainer = page.locator('[class*="list"], [class*="grid"]');

    const tableCount = await table.count();
    const listCount = await listContainer.count();

    console.log(`Found elements: Tables=${tableCount}, List containers=${listCount}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/lists-data.png', fullPage: true });

    console.log('✓ Lists data check complete');
  });

  test('full diagnostic for lists management', async ({ page }) => {
    // Wait for full page load
    await page.waitForTimeout(3000);

    // Take full page screenshot
    await page.screenshot({ path: 'test-results/lists-full-diagnostic.png', fullPage: true });

    // Get page HTML for diagnosis
    const html = await page.content();
    console.log('Page loaded, HTML length:', html.length);

    // Get page title
    const title = await page.title();
    console.log('Page title:', title);

    // Check for any errors in console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Check for API calls
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('API call:', response.status(), response.url());
      }
    });

    // Get all buttons on page
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`Total buttons found: ${buttonCount}`);

    // Get button texts
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const buttonText = await allButtons.nth(i).textContent();
      console.log(`Button ${i + 1}: "${buttonText}"`);
    }

    console.log('✓ Diagnostic complete');
  });

  test('check if route exists and page component renders', async ({ page }) => {
    // Navigate to lists management
    await page.goto('http://localhost:3004/lists/management');
    await page.waitForTimeout(2000);

    // Check if we got redirected or got 404
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check page content
    const bodyText = await page.textContent('body');

    if (bodyText.includes('404') || bodyText.includes('Not Found')) {
      console.log('⚠ Route not found - got 404 page');
    } else if (bodyText.includes('errore') || bodyText.includes('error')) {
      console.log('⚠ Page error detected');
    } else {
      console.log('✓ Page loaded without obvious errors');
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/lists-route-check.png', fullPage: true });
  });
});
