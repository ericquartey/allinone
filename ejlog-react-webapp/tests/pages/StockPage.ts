import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * StockPage - Page Object Model for Stock Management
 *
 * Handles stock查询, filtering, and inventory operations
 */
export class StockPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly stockTable: Locator;
  readonly tableRows: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly refreshButton: Locator;
  readonly exportButton: Locator;

  // Filters
  readonly locationFilter: Locator;
  readonly statusFilter: Locator;
  readonly categoryFilter: Locator;
  readonly dateRangeFilter: Locator;

  // Stock information
  readonly totalStockValue: Locator;
  readonly totalItems: Locator;
  readonly lowStockAlert: Locator;

  // Actions
  readonly viewDetailsButtons: Locator;
  readonly adjustStockButtons: Locator;

  constructor(page: Page) {
    super(page, '/stock');

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Stock"), h1:has-text("Giacenze")').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Cerca"]').first();
    this.searchButton = page.locator('button[type="submit"], button:has-text("Cerca")').first();
    this.stockTable = page.locator('table, [role="table"]').first();
    this.tableRows = page.locator('tbody tr, [role="row"]');
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.emptyState = page.locator('.empty-state, [data-testid="empty-state"]');
    this.refreshButton = page.locator('button[aria-label*="Refresh"], button:has-text("Aggiorna")').first();
    this.exportButton = page.locator('button:has-text("Esporta"), button:has-text("Export")').first();

    // Filters
    this.locationFilter = page.locator('select[name="location"], select[aria-label*="Ubicazione"]').first();
    this.statusFilter = page.locator('select[name="status"], select[aria-label*="Stato"]').first();
    this.categoryFilter = page.locator('select[name="category"], select[aria-label*="Categoria"]').first();
    this.dateRangeFilter = page.locator('input[type="date"], input[name="dateRange"]').first();

    // Stock information
    this.totalStockValue = page.locator('[data-testid="total-stock-value"], .total-value').first();
    this.totalItems = page.locator('[data-testid="total-items"], .total-items').first();
    this.lowStockAlert = page.locator('.alert, [data-testid="low-stock-alert"]').first();

    // Actions
    this.viewDetailsButtons = page.locator('button[aria-label*="View"], button:has-text("Dettagli")');
    this.adjustStockButtons = page.locator('button:has-text("Aggiusta"), button:has-text("Adjust")');
  }

  /**
   * Navigate to stock page
   */
  async goto(): Promise<void> {
    await super.goto({ waitUntil: 'domcontentloaded' });
    await this.waitForStockPageLoad();
  }

  /**
   * Wait for stock page to load
   */
  async waitForStockPageLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.waitForLoadingToFinish(15000);
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Verify page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  /**
   * Search stock
   */
  async searchStock(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.fill(query);

    const searchButtonVisible = await this.searchButton.isVisible().catch(() => false);
    if (searchButtonVisible) {
      await this.searchButton.click();
    } else {
      await this.searchInput.press('Enter');
    }

    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Filter by location
   */
  async filterByLocation(location: string): Promise<void> {
    await this.locationFilter.waitFor({ state: 'visible', timeout: 10000 });
    await this.locationFilter.selectOption({ label: location });
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Filter by status
   */
  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.waitFor({ state: 'visible', timeout: 10000 });
    await this.statusFilter.selectOption({ label: status });
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Get stock records count
   */
  async getStockRecordsCount(): Promise<number> {
    await this.waitForLoadingToFinish(10000);

    const isEmpty = await this.emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      return 0;
    }

    return await this.tableRows.count();
  }

  /**
   * Get stock data from row
   */
  async getStockDataFromRow(rowIndex: number): Promise<{
    item: string;
    location: string;
    quantity: string;
    status: string;
  }> {
    const row = this.tableRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 10000 });

    const cells = row.locator('td');
    const cellCount = await cells.count();

    if (cellCount < 4) {
      throw new Error('Row does not have enough cells');
    }

    return {
      item: await cells.nth(0).textContent() || '',
      location: await cells.nth(1).textContent() || '',
      quantity: await cells.nth(2).textContent() || '',
      status: await cells.nth(3).textContent() || '',
    };
  }

  /**
   * View stock details by row index
   */
  async viewStockDetails(rowIndex: number): Promise<void> {
    const viewButton = this.viewDetailsButtons.nth(rowIndex);
    await viewButton.waitFor({ state: 'visible', timeout: 10000 });
    await viewButton.click();
    await this.waitForNavigation();
  }

  /**
   * Refresh stock data
   */
  async refreshStock(): Promise<void> {
    const refreshButtonVisible = await this.refreshButton.isVisible().catch(() => false);
    if (refreshButtonVisible) {
      await this.refreshButton.click();
      await this.waitForLoadingToFinish(10000);
      await this.waitForNetworkIdle(5000);
    }
  }

  /**
   * Export stock data
   */
  async exportStock(): Promise<void> {
    const exportButtonVisible = await this.exportButton.isVisible().catch(() => false);
    if (exportButtonVisible) {
      await this.exportButton.click();
      await this.page.waitForTimeout(2000); // Wait for download
    }
  }

  /**
   * Get total stock value
   */
  async getTotalStockValue(): Promise<string> {
    const totalValueVisible = await this.totalStockValue.isVisible().catch(() => false);
    if (totalValueVisible) {
      return await this.totalStockValue.textContent() || '';
    }
    return '';
  }

  /**
   * Get total items count
   */
  async getTotalItemsCount(): Promise<string> {
    const totalItemsVisible = await this.totalItems.isVisible().catch(() => false);
    if (totalItemsVisible) {
      return await this.totalItems.textContent() || '';
    }
    return '';
  }

  /**
   * Check if low stock alert is visible
   */
  async hasLowStockAlert(): Promise<boolean> {
    return await this.lowStockAlert.isVisible().catch(() => false);
  }

  /**
   * Verify stock item exists
   */
  async verifyStockItemExists(itemName: string): Promise<void> {
    const stockRow = this.page.locator(`tr:has-text("${itemName}")`);
    await expect(stockRow).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify empty state
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  /**
   * Clear all filters
   */
  async clearFilters(): Promise<void> {
    await this.searchInput.clear();
    await this.waitForLoadingToFinish(5000);
  }

  /**
   * Take stock page screenshot
   */
  async takeStockScreenshot(name: string = 'stock-page'): Promise<void> {
    await this.takeScreenshot(name);
  }
}
