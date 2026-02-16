/**
 * Playwright E2E Tests for Common Components
 *
 * Tests all common UI components:
 * - Button (all variants, sizes, states)
 * - Input (with validation, icons, error states)
 * - BarcodeInput (CRITICAL for RF operations)
 * - Modal
 * - Badge
 * - Table
 * - Card
 * - Loading
 *
 * Test page: http://localhost:3001/test/components
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const TEST_PAGE_URL = `${BASE_URL}/test/components`;

test.describe('Common Components E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test page
    await page.goto(TEST_PAGE_URL);

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
  });

  test.describe('Button Component', () => {
    test('renders all button variants correctly', async ({ page }) => {
      // Check all button variants exist
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'];

      for (const variant of variants) {
        const button = page.locator(`[data-testid="btn-${variant}"]`);
        await expect(button).toBeVisible();
      }
    });

    test('renders all button sizes correctly', async ({ page }) => {
      const sizes = ['small', 'medium', 'large'];

      for (const size of sizes) {
        const button = page.locator(`[data-testid="btn-${size}"]`);
        await expect(button).toBeVisible();
      }
    });

    test('loading button displays loading state', async ({ page }) => {
      const loadingBtn = page.locator('[data-testid="btn-loading"]');
      await expect(loadingBtn).toBeVisible();
      await expect(loadingBtn).toBeDisabled();

      // Check for loading spinner (svg with animate-spin class)
      const spinner = loadingBtn.locator('svg.animate-spin');
      await expect(spinner).toBeVisible();
    });

    test('disabled button is not clickable', async ({ page }) => {
      const disabledBtn = page.locator('[data-testid="btn-disabled"]');
      await expect(disabledBtn).toBeVisible();
      await expect(disabledBtn).toBeDisabled();
    });

    test('button click works', async ({ page }) => {
      const primaryBtn = page.locator('[data-testid="btn-primary"]');

      // Button should be clickable
      await expect(primaryBtn).toBeEnabled();
      await primaryBtn.click();

      // Just verify no errors occurred
      await expect(primaryBtn).toBeVisible();
    });
  });

  test.describe('Input Component', () => {
    test('renders input with label and placeholder', async ({ page }) => {
      const input = page.locator('[data-testid="input-username"]');
      await expect(input).toBeVisible();
      await expect(input).toHaveAttribute('placeholder', 'Inserisci nome');

      // Check for label
      const label = page.locator('label:has-text("Nome utente")');
      await expect(label).toBeVisible();
    });

    test('shows validation error when input is invalid', async ({ page }) => {
      const input = page.locator('[data-testid="input-username"]');

      // Type less than 3 characters (validation requirement)
      await input.fill('ab');
      await input.blur();

      // Wait a bit for validation
      await page.waitForTimeout(300);

      // Check for error message
      const errorText = page.locator('text=/Minimo 3 caratteri richiesti/i');
      await expect(errorText).toBeVisible();
    });

    test('input with icon renders correctly', async ({ page }) => {
      const emailInput = page.locator('[data-testid="input-email"]');
      await expect(emailInput).toBeVisible();

      // Check for helper text
      const helperText = page.locator('text=Inserisci un indirizzo email valido');
      await expect(helperText).toBeVisible();
    });

    test('disabled input cannot be edited', async ({ page }) => {
      const disabledInput = page.locator('[data-testid="input-disabled"]');
      await expect(disabledInput).toBeVisible();
      await expect(disabledInput).toBeDisabled();
    });
  });

  test.describe('BarcodeInput Component - CRITICAL for RF Operations', () => {
    test('renders barcode input correctly', async ({ page }) => {
      const barcodeInput = page.locator('[data-testid="barcode-input"]');
      await expect(barcodeInput).toBeVisible();
      await expect(barcodeInput).toHaveAttribute(
        'placeholder',
        /Scansiona o inserisci manualmente/i
      );
    });

    test('accepts manual barcode entry with Enter key', async ({ page }) => {
      const barcodeInput = page.locator('[data-testid="barcode-input"]');

      // Focus input
      await barcodeInput.click();

      // Type barcode
      const testBarcode = '1234567890123';
      await barcodeInput.fill(testBarcode);

      // Press Enter to trigger scan
      await barcodeInput.press('Enter');

      // Wait for scan to process
      await page.waitForTimeout(500);

      // Check that barcode was logged
      const barcodeLog = page.locator('[data-testid="barcode-log"]');
      await expect(barcodeLog).toBeVisible();

      // Check that the barcode appears in the log
      const logEntry = barcodeLog.locator(`text=${testBarcode}`);
      await expect(logEntry).toBeVisible();
    });

    test('simulates fast barcode scanner input', async ({ page }) => {
      const barcodeInput = page.locator('[data-testid="barcode-input"]');

      // Focus input
      await barcodeInput.click();

      // Simulate fast typing (like scanner) with minimal delay
      const testBarcode = '9876543210987';
      await barcodeInput.type(testBarcode, { delay: 10 }); // Fast typing

      // Press Enter
      await barcodeInput.press('Enter');

      // Wait for processing
      await page.waitForTimeout(500);

      // Verify barcode was scanned
      const logEntry = page.locator(`text=${testBarcode}`).first();
      await expect(logEntry).toBeVisible();
    });

    test('displays scanning state visual feedback', async ({ page }) => {
      const barcodeInput = page.locator('[data-testid="barcode-input"]');

      // Start typing fast
      await barcodeInput.click();
      await barcodeInput.type('12345', { delay: 10 });

      // Should show scanning indicator
      // (Look for "Scansione..." text or specific styling)
      const scanningBadge = page.locator('text=Scansione...').or(page.locator('.animate-pulse'));

      // At least one indicator should be present during/after fast input
      await expect(scanningBadge.first()).toBeVisible({ timeout: 1000 });
    });

    test('clears input after successful scan', async ({ page }) => {
      const barcodeInput = page.locator('[data-testid="barcode-input"]');

      // Scan a barcode
      await barcodeInput.click();
      await barcodeInput.fill('CLEAR_TEST_123');
      await barcodeInput.press('Enter');

      // Wait for processing
      await page.waitForTimeout(500);

      // Input should be cleared
      await expect(barcodeInput).toHaveValue('');
    });

    test('handles multiple sequential scans', async ({ page }) => {
      const barcodeInput = page.locator('[data-testid="barcode-input"]');
      const barcodes = ['SCAN1', 'SCAN2', 'SCAN3'];

      for (const barcode of barcodes) {
        await barcodeInput.click();
        await barcodeInput.fill(barcode);
        await barcodeInput.press('Enter');
        await page.waitForTimeout(300);
      }

      // All barcodes should be in the log
      for (const barcode of barcodes) {
        const logEntry = page.locator(`[data-testid="barcode-log"] >> text=${barcode}`);
        await expect(logEntry).toBeVisible();
      }
    });
  });

  test.describe('Modal Component', () => {
    test('opens modal when button is clicked', async ({ page }) => {
      // Modal should not be visible initially
      const modalContent = page.locator('[data-testid="modal-content"]');
      await expect(modalContent).not.toBeVisible();

      // Click open button
      const openButton = page.locator('[data-testid="btn-open-modal"]');
      await openButton.click();

      // Wait for modal animation
      await page.waitForTimeout(300);

      // Modal should now be visible
      await expect(modalContent).toBeVisible();

      // Check modal title
      const modalTitle = page.locator('h3:has-text("Test Modal")');
      await expect(modalTitle).toBeVisible();
    });

    test('closes modal with close button', async ({ page }) => {
      // Open modal
      await page.locator('[data-testid="btn-open-modal"]').click();
      await page.waitForTimeout(300);

      const modalContent = page.locator('[data-testid="modal-content"]');
      await expect(modalContent).toBeVisible();

      // Click close button (X icon)
      const closeButton = page.locator('button svg').first(); // XMarkIcon
      await closeButton.click();

      // Wait for close animation
      await page.waitForTimeout(300);

      // Modal should be closed
      await expect(modalContent).not.toBeVisible();
    });

    test('closes modal with Cancel button', async ({ page }) => {
      // Open modal
      await page.locator('[data-testid="btn-open-modal"]').click();
      await page.waitForTimeout(300);

      // Click cancel button in footer
      const cancelButton = page.locator('button:has-text("Annulla")');
      await cancelButton.click();

      await page.waitForTimeout(300);

      // Modal should be closed
      const modalContent = page.locator('[data-testid="modal-content"]');
      await expect(modalContent).not.toBeVisible();
    });
  });

  test.describe('Badge Component', () => {
    test('renders all badge colors', async ({ page }) => {
      const colors = ['gray', 'red', 'green', 'blue', 'yellow'];

      for (const color of colors) {
        const badge = page.locator(`[data-testid="badge-${color}"]`);
        await expect(badge).toBeVisible();
        await expect(badge).toHaveText(new RegExp(color, 'i'));
      }
    });
  });

  test.describe('Table Component', () => {
    test('renders table with data', async ({ page }) => {
      const table = page.locator('[data-testid="test-table"] table');
      await expect(table).toBeVisible();

      // Check table has rows
      const rows = page.locator('[data-testid="test-table"] tbody tr');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('table search functionality works', async ({ page }) => {
      // Find search input in table
      const searchInput = page.locator('[data-testid="test-table"] input[placeholder*="Cerca"]');
      await expect(searchInput).toBeVisible();

      // Type search query
      await searchInput.fill('ART001');
      await page.waitForTimeout(300);

      // Should show only matching rows
      const rows = page.locator('[data-testid="test-table"] tbody tr');
      const rowCount = await rows.count();

      // Should have at least one row with ART001
      const matchingRow = page.locator('tbody td:has-text("ART001")');
      await expect(matchingRow).toBeVisible();
    });

    test('table displays correct row count', async ({ page }) => {
      const totalText = page.locator('[data-testid="test-table"] >> text=/Totale:.*record/');
      await expect(totalText).toBeVisible();
    });
  });

  test.describe('Card Component', () => {
    test('renders hoverable card with hover effect', async ({ page }) => {
      const hoverCard = page.locator('[data-testid="card-hover"]');
      await expect(hoverCard).toBeVisible();

      // Check card has title
      await expect(hoverCard.locator('h3:has-text("Hoverable Card")')).toBeVisible();
    });

    test('renders cards with different padding', async ({ page }) => {
      const smallCard = page.locator('[data-testid="card-small"]');
      const largeCard = page.locator('[data-testid="card-large"]');

      await expect(smallCard).toBeVisible();
      await expect(largeCard).toBeVisible();
    });
  });

  test.describe('Loading Component', () => {
    test('renders loading spinner', async ({ page }) => {
      const loading = page.locator('[data-testid="loading-spinner"]');
      await expect(loading).toBeVisible();

      // Should have animation class
      const spinner = page.locator('[data-testid="loading-spinner"] .animate-spin');
      await expect(spinner).toBeVisible();
    });
  });

  test.describe('Component Integration', () => {
    test('page loads all components without errors', async ({ page }) => {
      // Check page title
      const title = page.locator('h1:has-text("Component Test Page")');
      await expect(title).toBeVisible();

      // Check all sections are present
      const sections = [
        'Buttons',
        'Input',
        'BarcodeInput',
        'Modal',
        'Badges',
        'Table',
        'Loading',
      ];

      for (const section of sections) {
        const heading = page.locator(`h2:has-text("${section}")`);
        await expect(heading).toBeVisible();
      }
    });

    test('no console errors during page load', async ({ page }) => {
      const errors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Reload page to capture all console messages
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check for errors (allow some common non-critical errors)
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('404') && // Ignore 404s
          !error.includes('favicon') && // Ignore favicon errors
          !error.includes('ECONNREFUSED') // Ignore backend connection errors for frontend tests
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Accessibility', () => {
    test('all interactive elements are keyboard accessible', async ({ page }) => {
      // Tab through page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // At least one element should have focus
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focusedElement.evaluate((el) => el.tagName);

      // Focused element should be interactive (button or input)
      expect(['BUTTON', 'INPUT', 'A']).toContain(tagName);
    });

    test('inputs have proper labels', async ({ page }) => {
      // Check username input
      const usernameLabel = page.locator('label:has-text("Nome utente")');
      await expect(usernameLabel).toBeVisible();

      // Check barcode input
      const barcodeLabel = page.locator('label:has-text("Scansiona Barcode")');
      await expect(barcodeLabel).toBeVisible();
    });
  });
});
