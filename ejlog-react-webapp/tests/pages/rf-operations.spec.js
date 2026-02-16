import { test, expect } from '@playwright/test';

test.describe('RF Operations Page E2E Tests - Checkpoint 2.1', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3001/');
    await page.evaluate(() => {
      const mockUser = { username: 'operatore1', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-rf-test';

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
  });

  test('01 - RF Operations page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Check page title
    await expect(page.locator('h1:has-text("Operazioni RF")')).toBeVisible();

    // Check subtitle/description
    await expect(page.locator('text=Seleziona un\'operazione')).toBeVisible();
  });

  test('02 - Six operation cards are displayed', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Check all 6 operation cards using data-testid
    await expect(page.locator('[data-testid="rf-card-picking"]')).toBeVisible();
    await expect(page.locator('[data-testid="rf-card-refilling"]')).toBeVisible();
    await expect(page.locator('[data-testid="rf-card-inventario"]')).toBeVisible();
    await expect(page.locator('[data-testid="rf-card-ricezione"]')).toBeVisible();
    await expect(page.locator('[data-testid="rf-card-stoccaggio"]')).toBeVisible();
    await expect(page.locator('[data-testid="rf-card-trasferimento"]')).toBeVisible();
  });

  test('03 - Operation cards have icons and descriptions', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Check that cards have icons (SVG elements)
    const cards = await page.locator('[data-testid^="rf-card-"]').count();
    expect(cards).toBe(6);

    // Check first card has description text
    const firstCard = page.locator('[data-testid="rf-card-picking"]');
    await expect(firstCard.locator('text=Preleva articoli')).toBeVisible();
  });

  test('04 - Click Picking card opens picking workflow', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Click Picking card
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Verify workflow modal/page opened
    await expect(page.locator('text=Scansiona Lista')).toBeVisible();
    await expect(page.locator('input[placeholder*="barcode"]').first()).toBeVisible();
  });

  test('05 - Click Refilling card opens refilling workflow', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Click Refilling card
    await page.click('[data-testid="rf-card-refilling"]');
    await page.waitForTimeout(1000);

    // Verify workflow opened
    await expect(page.locator('text=Scansiona Lista')).toBeVisible();
  });

  test('06 - Click Inventario card opens inventory workflow', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Click Inventario card
    await page.click('[data-testid="rf-card-inventario"]');
    await page.waitForTimeout(1000);

    // Verify workflow opened
    await expect(page.locator('text=Scansiona Locazione')).toBeVisible();
  });

  test('07 - Picking workflow - scan list barcode', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Start Picking
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Scan list barcode
    const barcodeInput = page.locator('input[placeholder*="barcode"]').first();
    await barcodeInput.fill('LIST001');
    await barcodeInput.press('Enter');
    await page.waitForTimeout(1500);

    // Verify list loaded
    await expect(page.locator('text=Lista: LIST001')).toBeVisible();
  });

  test('08 - Picking workflow - scan item barcode', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Start Picking and scan list
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    const listInput = page.locator('input[placeholder*="barcode"]').first();
    await listInput.fill('LIST001');
    await listInput.press('Enter');
    await page.waitForTimeout(1500);

    // Scan item
    const itemInput = page.locator('input[placeholder*="articolo"]').first();
    await itemInput.fill('ART001');
    await itemInput.press('Enter');
    await page.waitForTimeout(1500);

    // Verify item found
    await expect(page.locator('text=Articolo: ART001')).toBeVisible();
  });

  test('09 - Picking workflow - confirm quantity', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Complete picking workflow up to quantity
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Scan list
    await page.locator('input[placeholder*="barcode"]').first().fill('LIST001');
    await page.locator('input[placeholder*="barcode"]').first().press('Enter');
    await page.waitForTimeout(1500);

    // Scan item
    await page.locator('input[placeholder*="articolo"]').first().fill('ART001');
    await page.locator('input[placeholder*="articolo"]').first().press('Enter');
    await page.waitForTimeout(1500);

    // Enter quantity
    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('10');
    await page.click('button:has-text("Conferma")');
    await page.waitForTimeout(1000);

    // Verify success message
    await expect(page.locator('text=Picking completato')).toBeVisible();
  });

  test('10 - Workflow can be cancelled', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Start Picking
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Click cancel/back button
    await page.click('button:has-text("Annulla")');
    await page.waitForTimeout(500);

    // Verify back to main menu
    await expect(page.locator('h1:has-text("Operazioni RF")')).toBeVisible();
    await expect(page.locator('[data-testid="rf-card-picking"]')).toBeVisible();
  });

  test('11 - Invalid barcode shows error', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Start Picking
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Scan invalid list barcode
    const barcodeInput = page.locator('input[placeholder*="barcode"]').first();
    await barcodeInput.fill('INVALID999');
    await barcodeInput.press('Enter');
    await page.waitForTimeout(1500);

    // Verify error message (check for red background error box)
    await expect(page.locator('.bg-red-100').first()).toBeVisible();
  });

  test('12 - Progress indicator shows current step', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Start Picking
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Check progress indicator - look for "Step 1 / 3" pattern
    await expect(page.locator('text=/Step 1.*3/')).toBeVisible();
  });

  test('13 - Large font size for RF readability', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Start Picking
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    // Check that input has large font (at least 18px or 1.125rem)
    const input = page.locator('input[placeholder*="barcode"]').first();
    const fontSize = await input.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font should be at least 18px for RF terminals
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(18);
  });

  test('14 - Keyboard navigation works', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Focus on first card button
    const firstCardButton = page.locator('[data-testid="rf-card-picking"]');
    await firstCardButton.focus();

    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Should open workflow
    await expect(page.locator('input[placeholder*="barcode"]').first()).toBeVisible();
  });

  test('15 - Success feedback is visual and clear', async ({ page }) => {
    await page.goto('http://localhost:3001/rf-operations');
    await page.waitForTimeout(2000);

    // Complete a simple workflow
    await page.click('[data-testid="rf-card-picking"]');
    await page.waitForTimeout(1000);

    await page.locator('input[placeholder*="barcode"]').first().fill('LIST001');
    await page.locator('input[placeholder*="barcode"]').first().press('Enter');
    await page.waitForTimeout(1500);

    await page.locator('input[placeholder*="articolo"]').first().fill('ART001');
    await page.locator('input[placeholder*="articolo"]').first().press('Enter');
    await page.waitForTimeout(1500);

    await page.locator('input[type="number"]').first().fill('10');
    await page.click('button:has-text("Conferma")');
    await page.waitForTimeout(1000);

    // Check for green success indicator or checkmark
    await expect(page.locator('svg.text-green-500, .bg-green-500').first()).toBeVisible();
  });
});
