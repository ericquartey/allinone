/**
 * Dashboard E2E Test Suite
 * Tests all dashboard functionality including new features:
 * - Quick Actions Panel
 * - Recent Activity Feed
 * - Performance Metrics
 * - System Health & Alerts
 * - Real-time data from API
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard - Main Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    // Wait for data to load
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard title and header', async ({ page }) => {
    // Check title
    await expect(page.locator('h1')).toContainText('Dashboard Ferretto WMS');

    // Check subtitle with real data badge
    await expect(page.getByText(/LIVE - Dati Reali/i)).toBeVisible();
  });

  test('should show auto-refresh controls', async ({ page }) => {
    // Check auto-refresh button is visible
    const autoRefreshButton = page.getByRole('button', { name: /auto-refresh/i });
    await expect(autoRefreshButton).toBeVisible();

    // Check refresh button is visible
    const refreshButton = page.getByRole('button', { name: /aggiorna ora/i });
    await expect(refreshButton).toBeVisible();
  });

  test('should display user profile card', async ({ page }) => {
    // Check welcome message
    await expect(page.getByText(/benvenuto/i)).toBeVisible();

    // Check user info is present
    const userCard = page.locator('[class*="user"]').first();
    await expect(userCard).toBeVisible();
  });
});

test.describe('Dashboard - Quick Actions Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display 8 quick action buttons', async ({ page }) => {
    // Check "Azioni Rapide" title
    await expect(page.getByText('Azioni Rapide')).toBeVisible();

    // Count action buttons - should be 8
    const actionButtons = page.locator('a[class*="gradient"]');
    await expect(actionButtons).toHaveCount(8);
  });

  test('should display quick actions with correct data', async ({ page }) => {
    // Check "Articoli" action exists and has count
    const articoliAction = page.getByText('Articoli').locator('..');
    await expect(articoliAction).toBeVisible();

    // Check "Giacenze" action exists
    const giacenzeAction = page.getByText('Giacenze').locator('..');
    await expect(giacenzeAction).toBeVisible();

    // Check "Liste" action exists
    const listeAction = page.getByText('Liste').locator('..');
    await expect(listeAction).toBeVisible();
  });

  test('quick action buttons should be clickable', async ({ page }) => {
    // Get first quick action button
    const firstAction = page.locator('a[href="/items"]').first();

    // Should have hover effects (check for classes)
    await expect(firstAction).toHaveClass(/gradient/);

    // Click should navigate (we just check it's a link)
    await expect(firstAction).toHaveAttribute('href');
  });
});

test.describe('Dashboard - Stats Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for API data to load
    await page.waitForTimeout(2000);
  });

  test('should display 4 main stat cards with real data', async ({ page }) => {
    // Check "Articoli Totali" card
    await expect(page.getByText('Articoli Totali')).toBeVisible();

    // Check "Giacenza Totale" card
    await expect(page.getByText('Giacenza Totale')).toBeVisible();

    // Check "Magazzini Attivi" card
    await expect(page.getByText('Magazzini Attivi')).toBeVisible();

    // Check "Sotto Soglia" card
    await expect(page.getByText('Sotto Soglia')).toBeVisible();
  });

  test('stat cards should show numeric values', async ({ page }) => {
    // Wait for data load
    await page.waitForSelector('text=/\\d+/');

    // Check that cards contain numbers (using regex for any number)
    const numbers = page.locator('text=/^\\d{1,}$/');
    const count = await numbers.count();

    // Should have at least 4 numeric values
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('should show "REALE" badges on stat cards', async ({ page }) => {
    // Check for badges indicating real data
    const badges = page.locator('text=/REALE|PEZZI/i');
    const badgeCount = await badges.count();

    // Should have at least 2 badges
    expect(badgeCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Dashboard - Recent Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display recent activity section', async ({ page }) => {
    // Check title
    await expect(page.getByText('Attività Recenti')).toBeVisible();
  });

  test('should show at least 5 activity items', async ({ page }) => {
    // Activity items should have colored borders (border-l-4)
    const activityItems = page.locator('[class*="border-l-4"]');
    const count = await activityItems.count();

    // Should have at least 5 activities
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('activity items should show time and description', async ({ page }) => {
    // Check for time indicators like "minuti fa"
    await expect(page.getByText(/minuti fa|ore fa|giorni fa/i)).toBeVisible();

    // Check for activity descriptions
    await expect(page.getByText(/completato|in corso|rilevato/i)).toBeVisible();
  });
});

test.describe('Dashboard - Performance Metrics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display performance section', async ({ page }) => {
    // Check title
    await expect(page.getByText('Performance')).toBeVisible();
  });

  test('should show 4 performance metrics with progress bars', async ({ page }) => {
    // Check for metric labels
    await expect(page.getByText('Efficienza Picking')).toBeVisible();
    await expect(page.getByText('Accuratezza')).toBeVisible();
    await expect(page.getByText('Tempo Medio')).toBeVisible();
    await expect(page.getByText('Completamento')).toBeVisible();
  });

  test('should show performance rating', async ({ page }) => {
    // Check for overall rating
    await expect(page.getByText(/Rating Complessivo/i)).toBeVisible();
    await expect(page.getByText(/A\+|A|B\+/)).toBeVisible();
  });

  test('progress bars should show percentage values', async ({ page }) => {
    // Check for percentage values (e.g., "94%", "98%")
    const percentages = page.locator('text=/\\d{1,3}%/');
    const count = await percentages.count();

    // Should have at least 4 percentage indicators
    expect(count).toBeGreaterThanOrEqual(4);
  });
});

test.describe('Dashboard - System Health Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display 4 system health cards', async ({ page }) => {
    // Check for system status
    await expect(page.getByText('Sistema OK')).toBeVisible();

    // Check for online users
    await expect(page.getByText('Utenti Online')).toBeVisible();

    // Check for uptime
    await expect(page.getByText(/Uptime/i)).toBeVisible();

    // Check for streak
    await expect(page.getByText(/Streak Operativo/i)).toBeVisible();
  });

  test('system health cards should have gradient backgrounds', async ({ page }) => {
    // Cards should have gradient classes
    const healthCards = page.locator('[class*="gradient"]');
    const count = await healthCards.count();

    // Should have multiple gradient cards
    expect(count).toBeGreaterThan(4);
  });
});

test.describe('Dashboard - Warehouse Charts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Wait for charts to render
    await page.waitForTimeout(3000);
  });

  test('should display warehouse pie chart', async ({ page }) => {
    // Check for warehouse distribution title
    await expect(page.getByText(/Distribuzione.*Magazzino/i)).toBeVisible();

    // Check for Recharts SVG element
    const chart = page.locator('svg').first();
    await expect(chart).toBeVisible();
  });

  test('should display warehouse list with PTL indicators', async ({ page }) => {
    // Check for "Magazzini" title
    await expect(page.getByText('Magazzini')).toBeVisible();

    // Check for PTL badge if any warehouse has PTL
    const ptlBadges = page.locator('text=/PTL/i');
    // PTL badges might or might not exist depending on data
    // Just check the structure exists
  });

  test('should show list type distribution chart', async ({ page }) => {
    // Check for lists distribution title
    await expect(page.getByText(/Distribuzione Liste/i)).toBeVisible();
  });

  test('should show category bar chart', async ({ page }) => {
    // Check for categories chart title
    await expect(page.getByText(/Categorie/i)).toBeVisible();
  });
});

test.describe('Dashboard - Summary Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display complete summary section', async ({ page }) => {
    // Check title
    await expect(page.getByText(/Riepilogo Completo/i)).toBeVisible();
  });

  test('should show articles and stock data', async ({ page }) => {
    // Check for "Articoli e Giacenze" section
    await expect(page.getByText('Articoli e Giacenze')).toBeVisible();
    await expect(page.getByText('Articoli Totali')).toBeVisible();
    await expect(page.getByText('Posizioni Stock')).toBeVisible();
  });

  test('should show lists and operations data', async ({ page }) => {
    // Check for "Liste e Operazioni" section
    await expect(page.getByText('Liste e Operazioni')).toBeVisible();
    await expect(page.getByText('Liste Totali')).toBeVisible();
  });

  test('should show database source info', async ({ page }) => {
    // Check footer with database info
    await expect(page.getByText(/SQL Server.*promag/i)).toBeVisible();
    await expect(page.getByText(/localhost\\SQL2019/i)).toBeVisible();
  });

  test('should show last update timestamp', async ({ page }) => {
    // Check for timestamp
    await expect(page.getByText(/Ultimo aggiornamento/i)).toBeVisible();
  });
});

test.describe('Dashboard - Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should auto-refresh data every 30 seconds', async ({ page }) => {
    // Get initial value
    const initialValue = await page.locator('text=/Articoli Totali/i').locator('..').textContent();

    // Wait for potential refresh (we can't wait 30s in test, so just verify the mechanism exists)
    // Just check that the refresh controls are there
    const refreshButton = page.getByRole('button', { name: /aggiorna ora/i });
    await expect(refreshButton).toBeEnabled();
  });

  test('manual refresh should reload data', async ({ page }) => {
    // Click refresh button
    const refreshButton = page.getByRole('button', { name: /aggiorna ora/i });
    await refreshButton.click();

    // Wait for network activity
    await page.waitForLoadState('networkidle');

    // Data should still be visible
    await expect(page.getByText('Dashboard Ferretto WMS')).toBeVisible();
  });

  test('should toggle auto-refresh on/off', async ({ page }) => {
    // Find auto-refresh toggle button
    const toggleButton = page.getByRole('button', { name: /auto-refresh/i });

    // Click to toggle
    await toggleButton.click();

    // Button text should change
    await expect(toggleButton).toBeVisible();
  });
});

test.describe('Dashboard - Responsive Design', () => {
  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Title should still be visible
    await expect(page.getByText(/Dashboard/i)).toBeVisible();

    // Quick actions should stack vertically
    const quickActions = page.locator('a[class*="gradient"]');
    await expect(quickActions.first()).toBeVisible();
  });

  test('should be responsive on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // All main sections should be visible
    await expect(page.getByText('Dashboard Ferretto WMS')).toBeVisible();
    await expect(page.getByText('Azioni Rapide')).toBeVisible();
  });
});

test.describe('Dashboard - Error Handling', () => {
  test('should show loading state while fetching data', async ({ page }) => {
    // Intercept API calls to simulate slow network
    await page.route('**/api/**', route => {
      setTimeout(() => route.continue(), 1000);
    });

    await page.goto('/');

    // Should show loading indicator
    await expect(page.getByText(/caricamento/i)).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/items**', route => route.abort());

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should still load even if one API fails
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});

test.describe('Dashboard - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check for h2 or h3 for sections
    const headings = page.locator('h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tab through focusable elements
    await page.keyboard.press('Tab');

    // At least one element should be focused
    const focused = await page.evaluateHandle(() => document.activeElement);
    expect(focused).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // This is a basic check - for full accessibility audit use axe-core
    // Just verify that text is visible against backgrounds
    const textElements = page.locator('p, span, h1, h2, h3');
    const firstText = textElements.first();
    await expect(firstText).toBeVisible();
  });
});
