// ============================================================================
// EJLOG WMS - Refilling Execution Page E2E Tests
// Complete test suite for refilling operations with UDC selection
// ============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3012';
const API_BASE = 'http://localhost:3079';

test.describe('Refilling Execution Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto(`${BASE_URL}/login`);
    await page.evaluate(() => {
      localStorage.setItem(
        'auth',
        JSON.stringify({
          isAuthenticated: true,
          user: { id: 1, username: 'test', name: 'Test User' },
          token: 'mock-token',
        })
      );
    });
  });

  test('should load refilling page with list data', async ({ page }) => {
    const listId = 1;

    // Mock API responses
    await page.route(`${API_BASE}/EjLogHostVertimag/Lists*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exportedItems: [
            {
              listHeader: {
                listNumber: listId,
                listDescription: 'Test Refilling List',
                listType: 2,
                listStatus: 1,
                priority: 50,
              },
            },
          ],
        }),
      });
    });

    await page.route(`${API_BASE}/api/mission-operations*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            itemCode: 'ITEM001',
            itemDescription: 'Test Item for Refilling',
            requestedQuantity: 100,
            availableQuantity: 100,
            processedQuantity: 0,
            remainingQuantity: 100,
            isCompleted: false,
            canBeExecuted: true,
            requiresLot: true,
            requiresSerialNumber: false,
            requiresExpiryDate: true,
            locationCode: 'A-01-01',
          },
        ]),
      });
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Refilling');
    await expect(page.locator('text=Test Refilling List')).toBeVisible();
    await expect(page.locator('text=ITEM001')).toBeVisible();
  });

  test('should display progress bar and statistics', async ({ page }) => {
    const listId = 1;

    await page.route(`${API_BASE}/EjLogHostVertimag/Lists*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exportedItems: [
            {
              listHeader: {
                listNumber: listId,
                listDescription: 'Test List',
                listType: 2,
                listStatus: 1,
              },
            },
          ],
        }),
      });
    });

    await page.route(`${API_BASE}/api/mission-operations*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            itemCode: 'ITEM001',
            itemDescription: 'Item 1',
            requestedQuantity: 100,
            processedQuantity: 100,
            isCompleted: true,
            canBeExecuted: false,
          },
          {
            id: 2,
            itemCode: 'ITEM002',
            itemDescription: 'Item 2',
            requestedQuantity: 50,
            processedQuantity: 0,
            isCompleted: false,
            canBeExecuted: true,
          },
        ]),
      });
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);

    // Check progress bar
    await expect(page.locator('text=Progresso')).toBeVisible();
    await expect(page.locator('text=50%')).toBeVisible(); // 1 of 2 completed
    await expect(page.locator('text=1 / 2 completate')).toBeVisible();
    await expect(page.locator('text=1 rimanenti')).toBeVisible();
  });

  test('should validate barcode correctly', async ({ page }) => {
    const listId = 1;

    await page.route(`${API_BASE}/**`, async (route) => {
      if (route.request().url().includes('/mission-operations?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              itemCode: 'ITEM001',
              itemDescription: 'Test Item',
              itemBarcode: '1234567890',
              requestedQuantity: 100,
              processedQuantity: 0,
              isCompleted: false,
              canBeExecuted: true,
              requiresLot: false,
              requiresSerialNumber: false,
              requiresExpiryDate: false,
              locationCode: 'A-01-01',
            },
          ]),
        });
      } else if (route.request().url().includes('/mission-operations/1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            itemCode: 'ITEM001',
            itemBarcode: '1234567890',
            requestedQuantity: 100,
          }),
        });
      } else if (route.request().url().includes('/Lists')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exportedItems: [{ listHeader: { listNumber: listId, listType: 2 } }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);
    await page.waitForLoadState('networkidle');

    // Enter barcode
    const barcodeInput = page.locator('input[placeholder*="barcode"]');
    await barcodeInput.fill('1234567890');

    // Should show success message
    await expect(page.locator('text=Barcode validato')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should load available UDCs after barcode validation', async ({ page }) => {
    const listId = 1;

    await page.route(`${API_BASE}/**`, async (route) => {
      const url = route.request().url();

      if (url.includes('/loading-units') && !url.includes('/compartments')) {
        // UDC list request
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              barcode: 'UDC-001',
              currentWeight: 50,
              maxWeight: 100,
              locationCode: 'B-01-01',
              compartments: [
                {
                  id: 201,
                  barcode: 'COMP-001-1',
                  position: 1,
                  currentQuantity: 20,
                  maxQuantity: 50,
                  itemCode: null,
                  lot: null,
                },
                {
                  id: 202,
                  barcode: 'COMP-001-2',
                  position: 2,
                  currentQuantity: 30,
                  maxQuantity: 50,
                  itemCode: 'ITEM001',
                  lot: 'LOT123',
                },
              ],
            },
          ]),
        });
      } else if (url.includes('/mission-operations?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              itemCode: 'ITEM001',
              itemDescription: 'Test Item',
              itemBarcode: '1234567890',
              requestedQuantity: 100,
              processedQuantity: 0,
              isCompleted: false,
              canBeExecuted: true,
              locationCode: 'A-01-01',
            },
          ]),
        });
      } else if (url.includes('/Lists')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exportedItems: [{ listHeader: { listNumber: listId, listType: 2 } }],
          }),
        });
      } else if (url.includes('/mission-operations/1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            itemCode: 'ITEM001',
            itemBarcode: '1234567890',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);
    await page.waitForLoadState('networkidle');

    // Enter barcode to trigger UDC loading
    await page.locator('input[placeholder*="barcode"]').fill('1234567890');
    await page.waitForTimeout(1000);

    // Should display UDC selector section after barcode validation
    // First need to enter quantity
    await page.locator('input[placeholder*="quantità"]').fill('100');

    // Now UDC selector should be visible
    await expect(page.locator('text=Seleziona UDC')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=UDC-001')).toBeVisible();
  });

  test('should show UDC details when selected', async ({ page }) => {
    const listId = 1;

    await page.route(`${API_BASE}/**`, async (route) => {
      const url = route.request().url();

      if (url.includes('/loading-units')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              barcode: 'UDC-001',
              currentWeight: 50,
              maxWeight: 100,
              locationCode: 'B-01-01',
              compartments: [
                {
                  id: 201,
                  barcode: 'COMP-001-1',
                  position: 1,
                  currentQuantity: 0,
                  maxQuantity: 50,
                  itemCode: null,
                  lot: null,
                },
              ],
            },
          ]),
        });
      } else if (url.includes('/mission-operations?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              itemCode: 'ITEM001',
              itemDescription: 'Test Item',
              itemBarcode: '1234567890',
              requestedQuantity: 100,
              processedQuantity: 0,
              isCompleted: false,
              canBeExecuted: true,
            },
          ]),
        });
      } else if (url.includes('/Lists')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exportedItems: [{ listHeader: { listNumber: listId, listType: 2 } }],
          }),
        });
      } else if (url.includes('/mission-operations/1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, itemCode: 'ITEM001', itemBarcode: '1234567890' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);
    await page.waitForLoadState('networkidle');

    // Setup: validate barcode and enter quantity
    await page.locator('input[placeholder*="barcode"]').fill('1234567890');
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="quantità"]').fill('100');
    await page.waitForTimeout(500);

    // Click on UDC to expand
    await page.locator('text=UDC-001').click();

    // Should show compartment details
    await expect(page.locator('text=Scomparto 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=COMP-001-1')).toBeVisible();
  });

  test('should complete refilling operation successfully', async ({ page }) => {
    const listId = 1;
    let completionCalled = false;

    await page.route(`${API_BASE}/**`, async (route) => {
      const url = route.request().url();

      if (url.includes('/mission-operations/1/complete')) {
        completionCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Completed' }),
        });
      } else if (url.includes('/loading-units')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              barcode: 'UDC-001',
              currentWeight: 50,
              maxWeight: 100,
              compartments: [
                {
                  id: 201,
                  position: 1,
                  currentQuantity: 0,
                  maxQuantity: 50,
                  itemCode: null,
                },
              ],
            },
          ]),
        });
      } else if (url.includes('/mission-operations?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              itemCode: 'ITEM001',
              itemDescription: 'Test Item',
              itemBarcode: '1234567890',
              requestedQuantity: 100,
              processedQuantity: 0,
              isCompleted: false,
              canBeExecuted: true,
            },
          ]),
        });
      } else if (url.includes('/Lists')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exportedItems: [{ listHeader: { listNumber: listId, listType: 2 } }],
          }),
        });
      } else if (url.includes('/mission-operations/1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, itemCode: 'ITEM001', itemBarcode: '1234567890' }),
        });
      } else if (url.includes('/compartments/201')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 201,
            itemCode: null,
            lot: null,
            currentQuantity: 0,
            maxQuantity: 50,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);
    await page.waitForLoadState('networkidle');

    // Step 1: Validate barcode
    await page.locator('input[placeholder*="barcode"]').fill('1234567890');
    await page.waitForTimeout(500);

    // Step 2: Enter quantity
    await page.locator('input[placeholder*="quantità"]').fill('100');
    await page.waitForTimeout(500);

    // Step 3: Select UDC
    await page.locator('text=UDC-001').click();
    await page.waitForTimeout(500);

    // Step 4: Select compartment
    await page.locator('text=Scomparto 1').click();
    await page.waitForTimeout(500);

    // Step 5: Complete operation
    const completeButton = page.locator('button:has-text("Completa Refilling")');
    await expect(completeButton).toBeEnabled({ timeout: 5000 });
    await completeButton.click();

    // Verify completion was called
    await page.waitForTimeout(1000);
    expect(completionCalled).toBe(true);
  });

  test('should handle merge validation correctly', async ({ page }) => {
    const listId = 1;

    await page.route(`${API_BASE}/**`, async (route) => {
      const url = route.request().url();

      if (url.includes('/compartments/202')) {
        // Compartment with existing product - can merge
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 202,
            itemCode: 'ITEM001',
            lot: 'LOT123',
            currentQuantity: 30,
            maxQuantity: 50,
          }),
        });
      } else if (url.includes('/loading-units')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 101,
              barcode: 'UDC-001',
              compartments: [
                {
                  id: 202,
                  position: 1,
                  currentQuantity: 30,
                  maxQuantity: 50,
                  itemCode: 'ITEM001',
                  lot: 'LOT123',
                },
              ],
            },
          ]),
        });
      } else if (url.includes('/mission-operations?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              itemCode: 'ITEM001',
              itemBarcode: '1234567890',
              requestedQuantity: 100,
              lot: 'LOT123',
              isCompleted: false,
              canBeExecuted: true,
            },
          ]),
        });
      } else if (url.includes('/Lists')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exportedItems: [{ listHeader: { listNumber: listId, listType: 2 } }],
          }),
        });
      } else if (url.includes('/mission-operations/1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, itemCode: 'ITEM001', itemBarcode: '1234567890' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);
    await page.waitForLoadState('networkidle');

    // Setup
    await page.locator('input[placeholder*="barcode"]').fill('1234567890');
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="quantità"]').fill('10');
    await page.waitForTimeout(500);

    // Select UDC and compartment
    await page.locator('text=UDC-001').click();
    await page.waitForTimeout(500);
    await page.locator('text=Scomparto 1').click();
    await page.waitForTimeout(1000);

    // Should show merge allowed message
    await expect(page.locator('text=Merge consentito')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between operations', async ({ page }) => {
    const listId = 1;

    await page.route(`${API_BASE}/**`, async (route) => {
      if (route.request().url().includes('/mission-operations?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 1,
              itemCode: 'ITEM001',
              itemDescription: 'Item 1',
              requestedQuantity: 100,
              isCompleted: false,
              canBeExecuted: true,
            },
            {
              id: 2,
              itemCode: 'ITEM002',
              itemDescription: 'Item 2',
              requestedQuantity: 50,
              isCompleted: false,
              canBeExecuted: true,
            },
          ]),
        });
      } else if (route.request().url().includes('/Lists')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            exportedItems: [{ listHeader: { listNumber: listId, listType: 2 } }],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE_URL}/refilling/${listId}`);
    await page.waitForLoadState('networkidle');

    // Should start at first operation
    await expect(page.locator('text=ITEM001')).toBeVisible();

    // Navigate to next operation
    const nextButton = page.locator('button:has-text("Successiva")');
    await nextButton.click();

    // Should show second operation
    await expect(page.locator('text=ITEM002')).toBeVisible();

    // Navigate back
    const prevButton = page.locator('button:has-text("Precedente")');
    await expect(prevButton).toBeEnabled();
    await prevButton.click();

    // Should be back at first operation
    await expect(page.locator('text=ITEM001')).toBeVisible();
  });
});

