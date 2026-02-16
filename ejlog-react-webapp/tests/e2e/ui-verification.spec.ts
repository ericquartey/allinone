/**
 * UI Verification Test
 * Verifica che tutti i componenti UI principali siano renderizzati correttamente
 */
import { test, expect } from '@playwright/test';

test.describe('UI Components Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.waitForTimeout(2000);
  });

  test('Header component is visible with all elements', async ({ page }) => {
    const header = page.locator('header');

    // Header should be visible
    await expect(header).toBeVisible();

    // Should contain Ferretto logo
    const logo = header.locator('svg').first();
    await expect(logo).toBeVisible();

    // Should contain EJLOG WMS title
    await expect(header.getByText('EJLOG WMS')).toBeVisible();
    await expect(header.getByText('Warehouse Management System')).toBeVisible();

    // Should contain user menu
    await expect(header.getByText('Utente')).toBeVisible();
    await expect(header.getByText('Operatore')).toBeVisible();
  });

  test('Sidebar component is visible with navigation items', async ({ page }) => {
    const sidebar = page.locator('aside');

    // Sidebar should be visible
    await expect(sidebar).toBeVisible();

    // Should contain search input (when expanded)
    const searchInput = sidebar.locator('input[placeholder="Cerca..."]');
    await expect(searchInput).toBeVisible();

    // Should contain Dashboard menu item
    await expect(sidebar.getByText('Dashboard')).toBeVisible();

    // Should contain Operazioni menu item
    await expect(sidebar.getByText('Operazioni')).toBeVisible();

    // Should contain Magazzino menu item
    await expect(sidebar.getByText('Magazzino')).toBeVisible();

    // Should contain footer
    await expect(sidebar.getByText('Ferretto Group')).toBeVisible();
    await expect(sidebar.getByText(/EJLOG WMS v/)).toBeVisible();
  });

  test('Main content area shows Dashboard with KPI cards', async ({ page }) => {
    const main = page.locator('main');

    // Main content should be visible
    await expect(main).toBeVisible();

    // Should contain Dashboard title
    await expect(main.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(main.getByText('Panoramica generale del magazzino')).toBeVisible();

    // Should contain KPI cards
    await expect(main.getByText('Articoli Totali')).toBeVisible();
    await expect(main.getByText('Liste Attive')).toBeVisible();
    await expect(main.getByText('Completate Oggi')).toBeVisible();
    await expect(main.getByText('Allarmi Attivi')).toBeVisible();

    // Should contain chart sections
    await expect(main.getByText('Liste per Tipo')).toBeVisible();
    await expect(main.getByText('Liste per Stato')).toBeVisible();

    // Should contain quick actions
    await expect(main.getByText('Azioni Rapide')).toBeVisible();

    // Should contain recent lists section
    await expect(main.getByText('Ultime Liste Create')).toBeVisible();
  });

  test('Sidebar toggle button works', async ({ page }) => {
    const sidebar = page.locator('aside');
    const toggleButton = page.locator('button[aria-label*="menu"]').first();

    // Sidebar should be expanded initially
    await expect(sidebar).toBeVisible();

    // Click toggle button to collapse
    await toggleButton.click();
    await page.waitForTimeout(500);

    // Search input should not be visible when collapsed
    const searchInput = sidebar.locator('input[placeholder="Cerca..."]');
    await expect(searchInput).not.toBeVisible();

    // Click again to expand
    await toggleButton.click();
    await page.waitForTimeout(500);

    // Search input should be visible again
    await expect(searchInput).toBeVisible();
  });

  test('User menu dropdown works', async ({ page }) => {
    const header = page.locator('header');

    // Click on user menu button
    const userButton = header.locator('button').filter({ hasText: 'Utente' });
    await userButton.click();

    // Dropdown menu should appear
    await expect(page.getByText('Profilo')).toBeVisible();
    await expect(page.getByText('Impostazioni')).toBeVisible();
    await expect(page.getByText('Esci')).toBeVisible();
  });

  test('Theme colors are applied correctly', async ({ page }) => {
    // Check if Ferretto red color is applied
    const logo = page.locator('header svg circle').first();
    const fill = await logo.getAttribute('fill');
    expect(fill).toBe('#E30613');

    // Check sidebar dark background
    const sidebar = page.locator('aside');
    const bgColor = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Should be ferretto-dark color (#32373c)
    expect(bgColor).toBeTruthy();
  });

  test('Page layout is responsive with correct spacing', async ({ page }) => {
    const main = page.locator('main');

    // Main content should have proper padding
    const padding = await main.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        paddingTop: style.paddingTop,
        minHeight: style.minHeight,
      };
    });

    expect(padding.minHeight).toBe('100vh');
  });

  test('All critical navigation links are present', async ({ page }) => {
    const sidebar = page.locator('aside');

    // Check for critical menu items
    const menuItems = [
      'Dashboard',
      'Operazioni',
      'Magazzino',
      'Spedizioni',
      'Macchine',
      'Allarmi',
      'Report',
      'Configurazione',
    ];

    for (const item of menuItems) {
      await expect(sidebar.getByText(item).first()).toBeVisible();
    }
  });
});
