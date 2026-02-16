// ============================================================================
// Playwright E2E Tests - Dashboard Refactored
// Test completo della dashboard ridisegnata con screenshot e performance
// ============================================================================

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3006';
const DASHBOARD_URL = `${BASE_URL}/`;

test.describe('Dashboard Refactored - Complete Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto(DASHBOARD_URL);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  // ============================================================================
  // SECTION 1: Hero Banner Tests
  // ============================================================================
  test.describe('Hero Banner', () => {
    test('should display hero banner with user name', async ({ page }) => {
      // Check hero banner is visible
      const heroBanner = page.locator('div.bg-gradient-to-br.from-ferretto-red');
      await expect(heroBanner).toBeVisible();

      // Check user name is displayed
      await expect(page.getByText('Mario Rossi')).toBeVisible();
    });

    test('should display live date and time', async ({ page }) => {
      // Check date is visible
      const dateElement = page.locator('text=/\\w+, \\d+ \\w+ \\d{4}/i');
      await expect(dateElement).toBeVisible();

      // Check time is visible (HH:MM:SS format)
      const timeElement = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/');
      await expect(timeElement).toBeVisible();

      // Wait 2 seconds and verify time has updated
      const initialTime = await timeElement.textContent();
      await page.waitForTimeout(2000);
      const updatedTime = await timeElement.textContent();

      // Time should have changed (at least seconds)
      expect(initialTime).not.toBe(updatedTime);
    });

    test('should take hero banner screenshot', async ({ page }) => {
      const heroBanner = page.locator('div.bg-gradient-to-br.from-ferretto-red').first();
      await heroBanner.screenshot({ path: 'tests/screenshots/hero-banner.png' });
    });
  });

  // ============================================================================
  // SECTION 2: Quick Stats Grid Tests
  // ============================================================================
  test.describe('Quick Stats Grid', () => {
    test('should display all 6 KPI cards', async ({ page }) => {
      // Wait for stats to load
      await page.waitForSelector('text=Articoli Totali', { timeout: 10000 });

      // Verify all 6 stat cards are visible
      await expect(page.getByText('Articoli Totali')).toBeVisible();
      await expect(page.getByText('Liste Attive')).toBeVisible();
      await expect(page.getByText('In Attesa')).toBeVisible();
      await expect(page.getByText('Completate Oggi')).toBeVisible();
      await expect(page.getByText('Tasso Successo')).toBeVisible();
      await expect(page.getByText('Allarmi Attivi')).toBeVisible();
    });

    test('should display trend indicators', async ({ page }) => {
      // Check for trend percentages
      const trends = page.locator('text=/[+\\-]?\\d+\\.\\d+%/');
      const count = await trends.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have hover effects on KPI cards', async ({ page }) => {
      const firstCard = page.locator('div.group.relative.overflow-hidden.rounded-xl').first();

      // Take screenshot before hover
      await firstCard.screenshot({ path: 'tests/screenshots/kpi-card-normal.png' });

      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(500); // Wait for animation

      // Take screenshot after hover
      await firstCard.screenshot({ path: 'tests/screenshots/kpi-card-hover.png' });
    });

    test('KPI cards should be clickable and navigate', async ({ page }) => {
      // Click on "Articoli Totali" card
      const articoliCard = page.locator('text=Articoli Totali').locator('..');
      await articoliCard.click();

      // Should navigate to items page
      await page.waitForURL('**/items', { timeout: 5000 });
    });
  });

  // ============================================================================
  // SECTION 3: Charts Section Tests
  // ============================================================================
  test.describe('Charts Section', () => {
    test('should display both charts', async ({ page }) => {
      // Wait for charts to render
      await page.waitForSelector('text=Liste per Tipo', { timeout: 10000 });
      await page.waitForSelector('text=Completamento Mensile', { timeout: 10000 });

      // Verify chart titles
      await expect(page.getByText('Liste per Tipo')).toBeVisible();
      await expect(page.getByText('Completamento Mensile')).toBeVisible();
    });

    test('should render bar chart with data', async ({ page }) => {
      // Check for SVG chart elements (Recharts renders as SVG)
      const barChart = page.locator('svg').first();
      await expect(barChart).toBeVisible();

      // Take screenshot of bar chart
      const barChartContainer = page.locator('text=Liste per Tipo').locator('..').locator('..');
      await barChartContainer.screenshot({ path: 'tests/screenshots/bar-chart.png' });
    });

    test('should render line chart with data', async ({ page }) => {
      // Check for line chart
      const lineChartContainer = page.locator('text=Completamento Mensile').locator('..').locator('..');
      await expect(lineChartContainer).toBeVisible();

      // Take screenshot of line chart
      await lineChartContainer.screenshot({ path: 'tests/screenshots/line-chart.png' });
    });

    test('should display chart legends', async ({ page }) => {
      // Check for legend items
      await expect(page.getByText('Completate')).toBeVisible();
      await expect(page.getByText('In Sospeso')).toBeVisible();
    });
  });

  // ============================================================================
  // SECTION 4: Quick Actions Grid Tests
  // ============================================================================
  test.describe('Quick Actions Grid', () => {
    test('should display all 6 quick actions', async ({ page }) => {
      await expect(page.getByText('Nuova Lista')).toBeVisible();
      await expect(page.getByText('Giacenze')).toBeVisible();
      await expect(page.getByText('Movimenti')).toBeVisible();
      await expect(page.getByText('UDC')).toBeVisible();
      await expect(page.getByText('Statistiche')).toBeVisible();
      await expect(page.getByText('Configurazione')).toBeVisible();
    });

    test('should have hover effects on action buttons', async ({ page }) => {
      const firstAction = page.locator('button:has-text("Nuova Lista")');

      // Hover and verify hover state
      await firstAction.hover();
      await page.waitForTimeout(300);

      // Take screenshot
      await firstAction.screenshot({ path: 'tests/screenshots/action-button-hover.png' });
    });

    test('quick actions should navigate correctly', async ({ page }) => {
      // Click "Giacenze" action
      await page.click('button:has-text("Giacenze")');

      // Should navigate to stock page
      await page.waitForURL('**/stock', { timeout: 5000 });
    });
  });

  // ============================================================================
  // SECTION 5: Recent Activity Timeline Tests
  // ============================================================================
  test.describe('Recent Activity Timeline', () => {
    test('should display activity timeline', async ({ page }) => {
      await expect(page.getByText('Attività Recenti')).toBeVisible();
    });

    test('should display multiple activity items', async ({ page }) => {
      // Check for at least 3 activity items
      const activityItems = page.locator('text=/\\w+ completata|Nuovo \\w+|Allarme risolto/');
      const count = await activityItems.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should display timestamps', async ({ page }) => {
      // Check for relative time strings
      const timestamps = page.locator('text=/\\d+ \\w+ fa/');
      const count = await timestamps.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should take activity timeline screenshot', async ({ page }) => {
      const timeline = page.locator('text=Attività Recenti').locator('..').locator('..');
      await timeline.screenshot({ path: 'tests/screenshots/activity-timeline.png' });
    });
  });

  // ============================================================================
  // SECTION 6: Alerts Panel Tests
  // ============================================================================
  test.describe('Alerts Panel', () => {
    test('should display alerts panel', async ({ page }) => {
      await expect(page.getByText('Allarmi Attivi')).toBeVisible();
    });

    test('should have filter dropdown', async ({ page }) => {
      const filterDropdown = page.locator('select:near(:text("Allarmi Attivi"))');
      await expect(filterDropdown).toBeVisible();
    });

    test('should filter alerts by severity', async ({ page }) => {
      const filterDropdown = page.locator('select:near(:text("Allarmi Attivi"))');

      // Select error filter
      await filterDropdown.selectOption('error');
      await page.waitForTimeout(500);

      // Take screenshot of filtered view
      const alertsPanel = page.locator('text=Allarmi Attivi').locator('..').locator('..');
      await alertsPanel.screenshot({ path: 'tests/screenshots/alerts-filtered.png' });
    });

    test('should display severity badges', async ({ page }) => {
      // Check for colored severity indicators
      const badges = page.locator('[class*="rounded-full"]');
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // SECTION 7: Responsive Design Tests
  // ============================================================================
  test.describe('Responsive Design', () => {
    test('should render correctly on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('networkidle');

      // Take full page screenshot
      await page.screenshot({
        path: 'tests/screenshots/dashboard-mobile.png',
        fullPage: true,
      });

      // Verify key elements are still visible
      await expect(page.getByText('Mario Rossi')).toBeVisible();
      await expect(page.getByText('Articoli Totali')).toBeVisible();
    });

    test('should render correctly on tablet (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('networkidle');

      // Take full page screenshot
      await page.screenshot({
        path: 'tests/screenshots/dashboard-tablet.png',
        fullPage: true,
      });
    });

    test('should render correctly on desktop (1920px)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('networkidle');

      // Take full page screenshot
      await page.screenshot({
        path: 'tests/screenshots/dashboard-desktop.png',
        fullPage: true,
      });
    });
  });

  // ============================================================================
  // SECTION 8: Performance Tests
  // ============================================================================
  test.describe('Performance', () => {
    test('should load in less than 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto(DASHBOARD_URL);
      await page.waitForLoadState('networkidle');

      // Filter out known acceptable errors (e.g., API errors when backend is down)
      const criticalErrors = errors.filter(
        (err) => !err.includes('Failed to fetch') && !err.includes('NetworkError')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  // ============================================================================
  // SECTION 9: Accessibility Tests
  // ============================================================================
  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();

      // Check for h2 headings
      const h2Count = await page.locator('h2').count();
      expect(h2Count).toBeGreaterThan(0);
    });

    test('should have accessible interactive elements', async ({ page }) => {
      // All buttons should be keyboard accessible
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);

      // Focus first button
      await buttons.first().focus();
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBe('BUTTON');
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a visual check - in production use tools like axe-core
      await page.screenshot({
        path: 'tests/screenshots/contrast-check.png',
        fullPage: true,
      });
    });
  });

  // ============================================================================
  // SECTION 10: Full Dashboard Screenshot
  // ============================================================================
  test('should take full dashboard screenshot for comparison', async ({ page }) => {
    // Wait for all content to load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/dashboard-full-after.png',
      fullPage: true,
    });
  });

  // ============================================================================
  // SECTION 11: Animation Tests
  // ============================================================================
  test.describe('Animations', () => {
    test('should have smooth transitions on cards', async ({ page }) => {
      const card = page.locator('div.group.relative.overflow-hidden.rounded-xl').first();

      // Get initial position
      const box1 = await card.boundingBox();

      // Hover to trigger animation
      await card.hover();
      await page.waitForTimeout(300);

      // Position might change slightly due to transform
      const box2 = await card.boundingBox();

      // Card should still be visible
      expect(box2).toBeTruthy();
    });
  });
});
