// ============================================================================
// EJLOG WMS - Picking Execution E2E Tests
// Test completi per esecuzione picking con Playwright
// ============================================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const API_URL = 'http://localhost:8080';

// Mock data
const mockList = {
  id: 1,
  code: 'L001',
  description: 'Test Picking List',
  type: 'PICKING',
  status: 'IN_PROGRESS',
  priority: 50,
};

const mockOperations = [
  {
    id: 1,
    itemCode: 'ART001',
    itemDescription: 'Articolo Test 1',
    itemUm: 'PZ',
    requestedQuantity: 10,
    availableQuantity: 10,
    processedQuantity: 0,
    isCompleted: false,
    canBeExecuted: true,
    requiresLot: true,
    requiresSerialNumber: false,
    requiresExpiryDate: true,
    udcBarcode: 'UDC001',
    locationCode: 'A-01-02',
    locationWarehouse: 'MAG1',
  },
  {
    id: 2,
    itemCode: 'ART002',
    itemDescription: 'Articolo Test 2',
    itemUm: 'KG',
    requestedQuantity: 5,
    availableQuantity: 5,
    processedQuantity: 0,
    isCompleted: false,
    canBeExecuted: true,
    requiresLot: false,
    requiresSerialNumber: true,
    requiresExpiryDate: false,
    udcBarcode: 'UDC002',
    locationCode: 'A-02-03',
    locationWarehouse: 'MAG1',
  },
];

test.describe('Picking Execution Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls
    await page.route('**/api/mission-operations*', async (route) => {
      if (route.request().url().includes('itemListId')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(mockOperations),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify(mockOperations[0]),
        });
      }
    });

    await page.route('**/EjLogHostVertimag/Lists*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: 'OK',
          exportedItems: [
            {
              listHeader: {
                listNumber: mockList.code,
                listDescription: mockList.description,
                listType: 1,
                listStatus: 1,
                priority: mockList.priority,
              },
              listRows: mockOperations.map((op, index) => ({
                rowNumber: String(index + 1),
                item: op.itemCode,
                lineDescription: op.itemDescription,
                requestedQty: op.requestedQuantity,
                processedQty: op.processedQuantity,
              })),
            },
          ],
        }),
      });
    });

    // Navigate to picking execution page
    await page.goto(`${BASE_URL}/operations/picking/1`);
  });

  test('should load picking execution page with list info', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Esecuzione Picking');

    // Check list info
    await expect(page.locator('text=Lista L001')).toBeVisible();
    await expect(page.locator('text=Test Picking List')).toBeVisible();

    // Check progress bar
    await expect(page.locator('[role="progressbar"], .bg-blue-600')).toBeVisible();

    // Check operation count
    await expect(page.locator('text=Operazione 1 di 2')).toBeVisible();
  });

  test('should display current operation details', async ({ page }) => {
    // Check article info
    await expect(page.locator('text=ART001')).toBeVisible();
    await expect(page.locator('text=Articolo Test 1')).toBeVisible();

    // Check location
    await expect(page.locator('text=A-01-02')).toBeVisible();
    await expect(page.locator('text=MAG1')).toBeVisible();

    // Check UDC barcode
    await expect(page.locator('text=UDC001')).toBeVisible();

    // Check quantities
    await expect(page.locator('text=10').first()).toBeVisible(); // Requested
    await expect(page.locator('text=PZ')).toBeVisible(); // Unit
  });

  test('should validate barcode before allowing confirmation', async ({ page }) => {
    // Confirm button should be disabled initially
    const confirmButton = page.locator('button:has-text("Conferma Operazione")');
    await expect(confirmButton).toBeDisabled();

    // Check barcode validation section
    await expect(page.locator('text=Validazione Barcode UDC')).toBeVisible();
    await expect(page.locator('text=UDC Atteso')).toBeVisible();
  });

  test('should handle barcode scanning', async ({ page }) => {
    // Mock barcode scanner by simulating keyboard input
    await page.keyboard.type('UDC001');
    await page.keyboard.press('Enter');

    // Wait for validation
    await page.waitForTimeout(500);

    // Check success message
    await expect(page.locator('text=Barcode UDC validato correttamente')).toBeVisible();

    // Confirm button should now be enabled
    const confirmButton = page.locator('button:has-text("Conferma Operazione")');
    await expect(confirmButton).toBeEnabled();
  });

  test('should show error for invalid barcode', async ({ page }) => {
    // Simulate wrong barcode
    await page.keyboard.type('WRONG_BARCODE');
    await page.keyboard.press('Enter');

    // Wait for validation
    await page.waitForTimeout(500);

    // Check error message
    await expect(page.locator('text=Barcode non valido')).toBeVisible();

    // Confirm button should still be disabled
    const confirmButton = page.locator('button:has-text("Conferma Operazione")');
    await expect(confirmButton).toBeDisabled();
  });

  test('should allow skipping barcode validation', async ({ page }) => {
    // Click skip button
    await page.locator('button:has-text("Salta validazione barcode")').click();

    // Check success message
    await expect(page.locator('text=Validazione barcode saltata')).toBeVisible();

    // Confirm button should now be enabled
    const confirmButton = page.locator('button:has-text("Conferma Operazione")');
    await expect(confirmButton).toBeEnabled();
  });

  test('should open validation modal with required fields', async ({ page }) => {
    // Skip barcode validation
    await page.locator('button:has-text("Salta validazione barcode")').click();

    // Click confirm button
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Modal should be visible
    await expect(page.locator('text=Conferma Operazione').nth(1)).toBeVisible();

    // Check required fields for this operation
    await expect(page.locator('label:has-text("Lotto")')).toBeVisible();
    await expect(page.locator('label:has-text("Data Scadenza")')).toBeVisible();

    // Quantity should be pre-filled
    const quantityInput = page.locator('input[type="number"]').first();
    await expect(quantityInput).toHaveValue('10');
  });

  test('should validate lot if required', async ({ page }) => {
    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Try to submit without lot
    await page.locator('button[type="submit"]:has-text("Conferma Operazione")').click();

    // Check error message
    await expect(page.locator('text=Lotto obbligatorio')).toBeVisible();
  });

  test('should validate quantity within available range', async ({ page }) => {
    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Enter quantity > available
    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill('15');

    // Try to submit
    await page.locator('button[type="submit"]:has-text("Conferma Operazione")').click();

    // Check error message
    await expect(page.locator('text=non può superare')).toBeVisible();
  });

  test('should complete operation successfully', async ({ page }) => {
    // Mock complete operation API
    await page.route('**/api/mission-operations/*/complete', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          message: 'Operazione completata',
          operationId: 1,
        }),
      });
    });

    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Fill required fields
    await page.locator('input[placeholder*="lotto"]').fill('LOT001');
    await page.locator('input[type="date"]').fill('2025-12-31');

    // Submit
    await page.locator('button[type="submit"]:has-text("Conferma Operazione")').click();

    // Check success message
    await expect(page.locator('text=Operazione completata con successo')).toBeVisible();
  });

  test('should navigate between operations', async ({ page }) => {
    // Check we're on operation 1
    await expect(page.locator('text=Operazione 1 di 2')).toBeVisible();
    await expect(page.locator('text=ART001')).toBeVisible();

    // Click next button
    await page.locator('button:has-text("Successiva")').click();

    // Check we're on operation 2
    await expect(page.locator('text=Operazione 2 di 2')).toBeVisible();
    await expect(page.locator('text=ART002')).toBeVisible();

    // Click previous button
    await page.locator('button:has-text("Precedente")').click();

    // Back to operation 1
    await expect(page.locator('text=Operazione 1 di 2')).toBeVisible();
    await expect(page.locator('text=ART001')).toBeVisible();
  });

  test('should show all operations in sidebar', async ({ page }) => {
    // Check operations list in sidebar
    await expect(page.locator('text=2 rimanenti')).toBeVisible();

    // Check both operations are listed
    await expect(page.locator('text=ART001').nth(1)).toBeVisible();
    await expect(page.locator('text=ART002')).toBeVisible();
  });

  test('should allow clicking operation in sidebar to jump to it', async ({ page }) => {
    // Click on second operation in sidebar
    await page.locator('text=ART002').click();

    // Should jump to operation 2
    await expect(page.locator('text=Operazione 2 di 2')).toBeVisible();
    await expect(page.locator('text=Articolo Test 2')).toBeVisible();
  });

  test('should handle auto-advance toggle', async ({ page }) => {
    // Check auto-advance is enabled by default
    const autoAdvanceCheckbox = page.locator('input[type="checkbox"]');
    await expect(autoAdvanceCheckbox).toBeChecked();

    // Toggle off
    await autoAdvanceCheckbox.click();
    await expect(autoAdvanceCheckbox).not.toBeChecked();

    // Toggle back on
    await autoAdvanceCheckbox.click();
    await expect(autoAdvanceCheckbox).toBeChecked();
  });

  test('should show progress percentage', async ({ page }) => {
    // Initial progress should be 0%
    await expect(page.locator('text=0%')).toBeVisible();

    // Progress bar should exist
    const progressBar = page.locator('.bg-blue-600').first();
    await expect(progressBar).toBeVisible();
  });

  test('should handle back navigation', async ({ page }) => {
    // Click back button
    await page.locator('button:has-text("Torna alla lista"), button >> svg').first().click();

    // Should redirect to list detail
    await expect(page).toHaveURL(/\/lists\/1/);
  });

  test('should display error state when list not found', async ({ page }) => {
    // Mock 404 error
    await page.route('**/EjLogHostVertimag/Lists*', async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({ message: 'Lista non trovata' }),
      });
    });

    await page.reload();

    // Check error message
    await expect(page.locator('text=Lista non trovata')).toBeVisible();
    await expect(page.locator('button:has-text("Torna alla lista")')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Mock API error
    await page.route('**/api/mission-operations/*/complete', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({
          message: 'Errore interno del server',
        }),
      });
    });

    // Fill and submit
    await page.locator('input[placeholder*="lotto"]').fill('LOT001');
    await page.locator('input[type="date"]').fill('2025-12-31');
    await page.locator('button[type="submit"]:has-text("Conferma Operazione")').click();

    // Check error toast
    await expect(page.locator('text=Errore completamento operazione')).toBeVisible();

    // Modal should stay open
    await expect(page.locator('text=Conferma Operazione').nth(1)).toBeVisible();
  });

  test('should show wasted quantity field', async ({ page }) => {
    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Check wasted quantity field exists
    await expect(page.locator('label:has-text("Quantità Scartata")')).toBeVisible();
  });

  test('should show notes field', async ({ page }) => {
    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Check notes field exists
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should show summary in validation modal', async ({ page }) => {
    // Skip barcode and open modal
    await page.locator('button:has-text("Salta validazione barcode")').click();
    await page.locator('button:has-text("Conferma Operazione")').click();

    // Fill fields
    await page.locator('input[placeholder*="lotto"]').fill('LOT999');
    await page.locator('input[type="date"]').fill('2025-06-30');

    // Check summary section
    await expect(page.locator('text=Riepilogo')).toBeVisible();
    await expect(page.locator('text=10 PZ')).toBeVisible();
    await expect(page.locator('text=LOT999')).toBeVisible();
  });
});

test.describe('Picking Execution - Mobile View', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto(`${BASE_URL}/operations/picking/1`);

    // Page should load
    await expect(page.locator('h1')).toContainText('Esecuzione Picking');

    // Check main elements are visible
    await expect(page.locator('text=ART001')).toBeVisible();
    await expect(page.locator('text=A-01-02')).toBeVisible();
  });
});
