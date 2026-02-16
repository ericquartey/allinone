// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Test Diagnostico - Verifica Dati Reali in React
 */

test.describe('Diagnostic - Real Data Verification', () => {

  test('Step 1: Verify backend is responding', async ({ request }) => {
    console.log('\n=== STEP 1: Testing Backend ===');

    const response = await request.get('http://localhost:3079/EjLogHostVertimag/Items?limit=5&offset=0');
    console.log('Backend Status:', response.status());

    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Backend Response:', JSON.stringify(data, null, 2));
    console.log('Record Number:', data.recordNumber);
    console.log('First Item:', data.exported?.[0]?.code);

    expect(data.result).toBe('OK');
    expect(data.recordNumber).toBeGreaterThan(0);
  });

  test('Step 2: Load React app and check network requests', async ({ page }) => {
    console.log('\n=== STEP 2: Loading React App ===');

    // Track all network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('localhost')) {
        console.log('REQUEST:', request.method(), request.url());
        requests.push({
          method: request.method(),
          url: request.url()
        });
      }
    });

    // Track all network responses
    page.on('response', async response => {
      if (response.url().includes('EjLogHostVertimag')) {
        console.log('RESPONSE:', response.status(), response.url());
        try {
          const text = await response.text();
          console.log('Response Body:', text.substring(0, 200));
        } catch (e) {
          console.log('Could not read response body');
        }
      }
    });

    // Track console messages
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`CONSOLE ${type.toUpperCase()}:`, msg.text());
      }
    });

    console.log('Navigating to http://localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });

    console.log('Page loaded. Title:', await page.title());

    // Wait a bit for any async data loading
    await page.waitForTimeout(3000);

    console.log('\n=== Network Requests Made ===');
    requests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
    });
  });

  test('Step 3: Check Dashboard content', async ({ page }) => {
    console.log('\n=== STEP 3: Checking Dashboard Content ===');

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: 'dashboard-screenshot.png', fullPage: true });
    console.log('Screenshot saved: dashboard-screenshot.png');

    // Check page content
    const bodyText = await page.textContent('body');
    console.log('Page contains "Loading":', bodyText.includes('Loading'));
    console.log('Page contains "Error":', bodyText.includes('Error'));
    console.log('Page contains "Dashboard":', bodyText.includes('Dashboard'));

    // Check for any visible item codes
    const hasItemCode = bodyText.match(/\d{2}-\d{3}[A-Z]/);
    console.log('Found item codes:', hasItemCode ? 'YES' : 'NO');

    if (hasItemCode) {
      console.log('Item code found:', hasItemCode[0]);
    }
  });

  test('Step 4: Navigate to Items page', async ({ page }) => {
    console.log('\n=== STEP 4: Testing Items Page ===');

    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Try to find and click Items link
    try {
      const itemsLink = page.locator('a:has-text("Items"), a:has-text("Articoli")').first();
      if (await itemsLink.isVisible({ timeout: 5000 })) {
        console.log('Clicking Items link...');
        await itemsLink.click();
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'items-page-screenshot.png', fullPage: true });
        console.log('Screenshot saved: items-page-screenshot.png');

        const bodyText = await page.textContent('body');
        const hasData = bodyText.match(/07-468B|WRLT3T622/);
        console.log('Items page has real data:', hasData ? 'YES' : 'NO');

        if (hasData) {
          console.log('✅ SUCCESS: Real data is visible!');
        } else {
          console.log('❌ PROBLEM: No real data visible on Items page');
        }
      } else {
        console.log('Items link not found');
      }
    } catch (e) {
      console.log('Error navigating to Items:', e.message);
    }
  });

  test('Step 5: Check Lists Management Page', async ({ page }) => {
    console.log('\n=== STEP 5: Checking Lists Management Page ===');

    // Mock authentication
    await page.goto('http://localhost:3001/');
    await page.evaluate(() => {
      const mockUser = { username: 'operatore1', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-lists-test';

      localStorage.setItem('ejlog_auth_token', mockToken);
      localStorage.setItem('ejlog_user', JSON.stringify(mockUser));

      const authStore = {
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        }
      };
      localStorage.setItem('ejlog-auth-storage', JSON.stringify(authStore));
    });

    // Go to lists/management page
    console.log('Navigating to http://localhost:3001/lists/management');
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(5000); // Wait longer for everything to load

    // Take screenshot
    await page.screenshot({ path: 'lists-management-diagnostic.png', fullPage: true });
    console.log('Screenshot saved: lists-management-diagnostic.png');

    // Get the full HTML body text content
    const bodyText = await page.locator('body').textContent();
    console.log('\n======= FULL PAGE TEXT (first 500 chars) =======');
    console.log(bodyText.substring(0, 500));
    console.log('================================================');

    // Get all h1, h2, h3 tags
    const headings = await page.$$eval('h1, h2, h3', elements =>
      elements.map(el => `${el.tagName}: ${el.textContent}`)
    );
    console.log('\n======= HEADINGS =======');
    console.log(headings);
    console.log('========================');

    // Get all buttons
    const buttons = await page.$$eval('button', elements =>
      elements.map(el => el.textContent?.trim()).filter(t => t)
    );
    console.log('\n======= BUTTONS =======');
    console.log(buttons);
    console.log('=======================');

    // Check for error messages
    const hasError = await page.locator('text=Errore').count();
    const hasLoading = await page.locator('text=Caricamento').count();
    const hasGestioneListe = await page.locator('text=Gestione Liste').count();
    const hasFiltri = await page.locator('text=Filtri').count();

    console.log('\n======= PAGE STATUS =======');
    console.log(`Has error message: ${hasError > 0}`);
    console.log(`Has loading message: ${hasLoading > 0}`);
    console.log(`Has "Gestione Liste": ${hasGestioneListe > 0}`);
    console.log(`Has "Filtri": ${hasFiltri > 0}`);
    console.log('===========================');

    // Check if React rendered anything
    const rootDiv = await page.$('#root');
    const rootHtml = await rootDiv?.innerHTML();
    console.log('\n======= ROOT DIV CONTENT (first 1000 chars) =======');
    console.log(rootHtml?.substring(0, 1000) || 'ROOT DIV IS EMPTY');
    console.log('==================================================');
  });
});

