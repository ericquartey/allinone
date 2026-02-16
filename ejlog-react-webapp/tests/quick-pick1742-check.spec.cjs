// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Quick test to verify PICK1742 is displayed in the table
 */

const BASE_URL = 'http://localhost:3012';
const API_BASE_URL = 'http://localhost:3077/EjLogHostVertimag';

test.describe('Quick PICK1742 Display Check', () => {

  test('Verify PICK1742 appears in table', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60s
    console.log('\n=== Quick Check: PICK1742 in Table ===');

    // Intercept API calls
    page.on('response', async response => {
      if (response.url().includes('/Lists')) {
        console.log('[API Response]', response.status(), response.url());
        if (response.ok()) {
          try {
            const data = await response.json();
            console.log('[listsService] Response from backend:', data);
            console.log('- recordNumber:', data.recordNumber);
            console.log('- exported length:', data.exported?.length);

            if (data.exported && data.exported.length > 0) {
              console.log('- First list number:', data.exported[0].listHeader?.listNumber);
            }
          } catch (e) {
            console.error('Error parsing response:', e.message);
          }
        }
      }
    });

    // Navigate to lists page
    await page.goto(`${BASE_URL}/lists`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/quick-pick1742-check.png',
      fullPage: true
    });
    console.log('Screenshot saved: test-results/quick-pick1742-check.png');

    // Count visible lists in table
    const tableRows = await page.locator('table tbody tr');
    const rowCount = await tableRows.count();
    console.log(`\n- Liste visualizzate: ${rowCount}`);

    // Get table content
    const tableContent = await page.locator('table tbody').textContent();
    console.log('Contenuto tabella:', tableContent?.substring(0, 200));

    // Check if PICK1742 is present
    const hasPICK1742 = tableContent?.includes('PICK1742');

    if (hasPICK1742) {
      console.log('✅ PICK1742 TROVATA nella tabella!');
    } else {
      console.log('❌ PICK1742 NON TROVATA');

      // Debug: check entire page
      const pageText = await page.textContent('body');
      const inPage = pageText?.includes('PICK1742');
      console.log('- PICK1742 presente nella pagina:', inPage);

      // Check for "Nessuna lista trovata"
      const noDataMessage = await page.locator('text=/Nessuna lista/i').count();
      if (noDataMessage > 0) {
        console.log('- Messaggio "Nessuna lista trovata" presente');
      }
    }

    // Verify PICK1742 is in table
    expect(hasPICK1742).toBeTruthy();
  });

  test('Verify backend returns PICK1742', async ({ request }) => {
    console.log('\n=== Verify Backend API ===');

    const response = await request.get(`${API_BASE_URL}/Lists`, {
      params: {
        limit: 10,
        offset: 0
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('Backend response:', JSON.stringify(data, null, 2));

    expect(data.result).toBe('OK');
    expect(data.exported).toBeTruthy();
    expect(Array.isArray(data.exported)).toBeTruthy();

    const pick1742 = data.exported.find(list =>
      list.listHeader?.listNumber === 'PICK1742'
    );

    expect(pick1742).toBeTruthy();
    console.log('✅ Backend returns PICK1742');
  });

});

