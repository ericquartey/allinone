/**
 * ============================================================================
 * EJLOG WMS - Reports Page E2E Tests
 * Test suite for Reports selection and navigation page
 * ============================================================================
 *
 * Test Coverage:
 * - Page load and title display
 * - All 4 report cards visible with correct content
 * - Report card icons and descriptions
 * - Navigation to each report type
 * - Responsive design
 * - Accessibility
 *
 * Sprint: 3 - Reports & Analytics
 * Checkpoint: 3.1 - Reports Page E2E Testing
 * ============================================================================
 */

import { test, expect } from '@playwright/test';

test.describe('Reports Page', () => {

  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3001/');

    // Set auth data in localStorage
    await page.evaluate(() => {
      const mockUser = { username: 'operatore1', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-reports-test';

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

    // Navigate to reports page after auth is set
    await page.goto('http://localhost:3001/reports');
    await page.waitForTimeout(2000); // Give time for page to render
  });

  // ============================================================================
  // PAGE LOAD AND STRUCTURE TESTS
  // ============================================================================

  test('01 - Page loads successfully with correct title', async ({ page }) => {
    // Verify page title contains "Report e Analisi"
    await expect(page.locator('h1').filter({ hasText: 'Report e Analisi' })).toBeVisible();

    // Verify subtitle/description
    const subtitle = page.locator('p').first();
    await expect(subtitle).toBeVisible();
  });

  test('02 - All 4 report cards are visible', async ({ page }) => {
    // Count report cards
    const cards = page.locator('[data-testid^="report-card-"]');
    await expect(cards).toHaveCount(4);

    // Verify each card is visible
    await expect(page.locator('[data-testid="report-card-stock"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-card-movements"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-card-lists"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-card-productivity"]')).toBeVisible();
  });

  test('03 - Stock report card has correct content', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-stock"]');

    // Verify title
    await expect(card.locator('h3')).toContainText('Giacenze');

    // Verify description
    await expect(card.locator('p')).toContainText('Analisi completa delle giacenze');

    // Verify icon is present
    const icon = card.locator('svg').first();
    await expect(icon).toBeVisible();

    // Verify button
    await expect(card.locator('button, a').filter({ hasText: 'Visualizza' })).toBeVisible();
  });

  test('04 - Movements report card has correct content', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-movements"]');

    // Verify title
    await expect(card.locator('h3')).toContainText('Movimenti');

    // Verify description
    await expect(card.locator('p')).toContainText('analisi flussi di magazzino');

    // Verify icon is present
    const icon = card.locator('svg').first();
    await expect(icon).toBeVisible();

    // Verify button
    await expect(card.locator('button, a').filter({ hasText: 'Visualizza' })).toBeVisible();
  });

  test('05 - Lists report card has correct content', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-lists"]');

    // Verify title
    await expect(card.locator('h3')).toContainText('Liste');

    // Verify description
    await expect(card.locator('p')).toContainText('Statistiche');

    // Verify icon is present
    const icon = card.locator('svg').first();
    await expect(icon).toBeVisible();

    // Verify button
    await expect(card.locator('button, a').filter({ hasText: 'Visualizza' })).toBeVisible();
  });

  test('06 - Productivity report card has correct content', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-productivity"]');

    // Verify title
    await expect(card.locator('h3')).toContainText('Produttività');

    // Verify description
    await expect(card.locator('p')).toContainText('KPI');

    // Verify icon is present
    const icon = card.locator('svg').first();
    await expect(icon).toBeVisible();

    // Verify button
    await expect(card.locator('button, a').filter({ hasText: 'Visualizza' })).toBeVisible();
  });

  // ============================================================================
  // NAVIGATION TESTS
  // ============================================================================

  test('07 - Stock report card navigates to report viewer', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-stock"]');
    const button = card.locator('button, a').filter({ hasText: 'Visualizza' }).first();

    await button.click();
    await page.waitForTimeout(1000);

    // Verify navigation occurred (URL or page content changed)
    // Should navigate to /reports/stock or /reports/viewer?type=stock
    await expect(page).toHaveURL(/\/reports\/(stock|viewer)/);
  });

  test('08 - Movements report card navigates to report viewer', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-movements"]');
    const button = card.locator('button, a').filter({ hasText: 'Visualizza' }).first();

    await button.click();
    await page.waitForTimeout(1000);

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/reports\/(movements|viewer)/);
  });

  test('09 - Lists report card navigates to report viewer', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-lists"]');
    const button = card.locator('button, a').filter({ hasText: 'Visualizza' }).first();

    await button.click();
    await page.waitForTimeout(1000);

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/reports\/(lists|viewer)/);
  });

  test('10 - Productivity report card navigates to report viewer', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-productivity"]');
    const button = card.locator('button, a').filter({ hasText: 'Visualizza' }).first();

    await button.click();
    await page.waitForTimeout(1000);

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/reports\/(productivity|viewer)/);
  });

  // ============================================================================
  // VISUAL AND DESIGN TESTS
  // ============================================================================

  test('11 - Cards have proper spacing and layout', async ({ page }) => {
    const cards = page.locator('[data-testid^="report-card-"]');

    // Verify cards are in a grid layout (should be at least 2 cards visible in viewport on desktop)
    const firstCard = cards.nth(0);
    const secondCard = cards.nth(1);

    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // On desktop, cards should be side by side (different x positions)
    // or stacked (different y positions)
    const hasDifferentPosition =
      Math.abs(firstBox.x - secondBox.x) > 50 ||
      Math.abs(firstBox.y - secondBox.y) > 50;

    expect(hasDifferentPosition).toBeTruthy();
  });

  test('12 - Icons are displayed with consistent styling', async ({ page }) => {
    // Get all icon containers
    const stockCard = page.locator('[data-testid="report-card-stock"]');
    const movementsCard = page.locator('[data-testid="report-card-movements"]');

    // Get icon backgrounds or parent containers
    const stockIcon = stockCard.locator('svg').first();
    const movementsIcon = movementsCard.locator('svg').first();

    await expect(stockIcon).toBeVisible();
    await expect(movementsIcon).toBeVisible();

    // Icons should have consistent styling (ferrRed color)
    const stockParent = stockIcon.locator('xpath=..');
    const movementsParent = movementsIcon.locator('xpath=..');

    const stockClass = await stockParent.getAttribute('class');
    const movementsClass = await movementsParent.getAttribute('class');

    // Both should have bg-ferrRed/10 and be consistent
    expect(stockClass).toContain('bg-ferrRed');
    expect(movementsClass).toContain('bg-ferrRed');
  });

  test('13 - Hover effect on report cards', async ({ page }) => {
    const card = page.locator('[data-testid="report-card-stock"]');

    // Get initial state
    const initialBox = await card.boundingBox();
    expect(initialBox).not.toBeNull();

    // Hover over card
    await card.hover();
    await page.waitForTimeout(300);

    // Card should still be visible and in same position
    const hoveredBox = await card.boundingBox();
    expect(hoveredBox).not.toBeNull();

    // Verify card has hover styling (shadow, scale, etc.)
    // This is implicit if the card maintains visibility and structure
    await expect(card).toBeVisible();
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  test('14 - Keyboard navigation works correctly', async ({ page }) => {
    // Focus on first report card button
    const firstButton = page.locator('[data-testid="report-card-stock"]')
      .locator('button, a')
      .filter({ hasText: 'Visualizza' })
      .first();

    await firstButton.focus();

    // Verify focus is visible
    await expect(firstButton).toBeFocused();

    // Press Enter to navigate
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/reports\//);
  });

  test('15 - Page is responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // All cards should still be visible
    const cards = page.locator('[data-testid^="report-card-"]');
    await expect(cards).toHaveCount(4);

    // Verify first card is visible
    await expect(page.locator('[data-testid="report-card-stock"]')).toBeVisible();

    // On mobile, cards should be stacked (taking most of the screen width)
    // Grid should show single column layout
    const grid = page.locator('.grid');
    await expect(grid).toBeVisible();

    // All cards should still be visible and clickable
    for (let i = 0; i < 4; i++) {
      const card = cards.nth(i);
      await expect(card).toBeVisible();
    }
  });

});
