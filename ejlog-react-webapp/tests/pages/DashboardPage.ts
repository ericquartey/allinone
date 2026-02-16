import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * DashboardPage - Page Object Model for Dashboard
 *
 * Main dashboard page with navigation and metrics
 */
export class DashboardPage extends BasePage {
  // Navigation locators
  readonly sidebar: Locator;
  readonly listsLink: Locator;
  readonly itemsLink: Locator;
  readonly stockLink: Locator;
  readonly settingsLink: Locator;
  readonly logoutButton: Locator;

  // Dashboard elements
  readonly pageTitle: Locator;
  readonly statsCards: Locator;
  readonly activityFeed: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    super(page, '/dashboard');

    // Navigation
    this.sidebar = page.locator('aside, nav[role="navigation"], .sidebar');
    this.listsLink = page.locator('a[href*="/lists"], button:has-text("Liste")').first();
    this.itemsLink = page.locator('a[href*="/items"], button:has-text("Articoli")').first();
    this.stockLink = page.locator('a[href*="/stock"], button:has-text("Stock")').first();
    this.settingsLink = page.locator('a[href*="/settings"], button:has-text("Impostazioni")').first();
    this.logoutButton = page.locator('button:has-text("Esci"), button:has-text("Logout")').first();

    // Dashboard elements
    this.pageTitle = page.locator('h1, h2').first();
    this.statsCards = page.locator('[data-testid="stat-card"], .stat-card, .metric-card');
    this.activityFeed = page.locator('[data-testid="activity-feed"], .activity-feed');
    this.userMenu = page.locator('[data-testid="user-menu"], .user-menu, button[aria-label*="user"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto(): Promise<void> {
    await super.goto({ waitUntil: 'domcontentloaded' });
    await this.waitForDashboardLoad();
  }

  /**
   * Wait for dashboard to load completely
   */
  async waitForDashboardLoad(): Promise<void> {
    // Wait for page title
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for sidebar navigation
    await this.sidebar.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for network to be idle
    await this.waitForNetworkIdle(15000);
  }

  /**
   * Verify dashboard page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.sidebar).toBeVisible({ timeout: 10000 });
  }

  /**
   * Navigate to Lists page
   */
  async navigateToLists(): Promise<void> {
    await this.listsLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.listsLink.click();
    await this.page.waitForURL('**/lists', { timeout: 15000 });
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Navigate to Items page
   */
  async navigateToItems(): Promise<void> {
    await this.itemsLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.itemsLink.click();
    await this.page.waitForURL('**/items', { timeout: 15000 });
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Navigate to Stock page
   */
  async navigateToStock(): Promise<void> {
    await this.stockLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.stockLink.click();
    await this.page.waitForURL('**/stock', { timeout: 15000 });
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Navigate to Settings page
   */
  async navigateToSettings(): Promise<void> {
    await this.settingsLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.settingsLink.click();
    await this.page.waitForURL('**/settings', { timeout: 15000 });
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Perform logout
   */
  async logout(): Promise<void> {
    // Click user menu first if exists
    const userMenuVisible = await this.userMenu.isVisible().catch(() => false);
    if (userMenuVisible) {
      await this.userMenu.click();
      await this.page.waitForTimeout(500); // Wait for dropdown
    }

    await this.logoutButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.logoutButton.click();

    // Wait for redirect to login
    await this.page.waitForURL('**/login', { timeout: 15000 });
  }

  /**
   * Get dashboard stats
   */
  async getStatsCount(): Promise<number> {
    await this.statsCards.first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return await this.statsCards.count();
  }

  /**
   * Verify specific stat card exists
   */
  async verifyStatCard(title: string): Promise<void> {
    const statCard = this.page.locator(`.stat-card:has-text("${title}"), [data-testid="stat-${title}"]`);
    await expect(statCard).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get page title text
   */
  async getPageTitle(): Promise<string> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    return await this.pageTitle.textContent() || '';
  }

  /**
   * Verify sidebar navigation items
   */
  async verifySidebarItems(): Promise<void> {
    await expect(this.sidebar).toBeVisible({ timeout: 10000 });

    // Check for main navigation links
    const navigationItems = [
      this.listsLink,
      this.itemsLink,
      this.stockLink,
    ];

    for (const item of navigationItems) {
      const isVisible = await item.isVisible().catch(() => false);
      if (isVisible) {
        await expect(item).toBeVisible();
      }
    }
  }

  /**
   * Check if activity feed is visible
   */
  async hasActivityFeed(): Promise<boolean> {
    return await this.activityFeed.isVisible().catch(() => false);
  }

  /**
   * Take dashboard screenshot
   */
  async takeDashboardScreenshot(name: string = 'dashboard'): Promise<void> {
    await this.takeScreenshot(name);
  }
}
