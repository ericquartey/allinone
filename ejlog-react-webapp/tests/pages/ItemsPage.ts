import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ItemsPage - Page Object Model for Items Management
 *
 * Handles item search, filtering, and management
 */
export class ItemsPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly filterButton: Locator;
  readonly itemsGrid: Locator;
  readonly itemCards: Locator;
  readonly itemsTable: Locator;
  readonly tableRows: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;
  readonly paginationNext: Locator;
  readonly paginationPrev: Locator;

  // Filters
  readonly categoryFilter: Locator;
  readonly statusFilter: Locator;
  readonly locationFilter: Locator;

  // Item details
  readonly itemDetail: Locator;
  readonly itemSku: Locator;
  readonly itemDescription: Locator;
  readonly itemQuantity: Locator;

  constructor(page: Page) {
    super(page, '/items');

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Articoli"), h1:has-text("Items")').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Cerca"]').first();
    this.searchButton = page.locator('button[type="submit"], button:has-text("Cerca")').first();
    this.filterButton = page.locator('button:has-text("Filtri"), button[aria-label*="Filter"]').first();
    this.itemsGrid = page.locator('.grid, .items-grid, [data-testid="items-grid"]').first();
    this.itemCards = page.locator('.item-card, [data-testid="item-card"]');
    this.itemsTable = page.locator('table, [role="table"]').first();
    this.tableRows = page.locator('tbody tr, [role="row"]');
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.emptyState = page.locator('.empty-state, [data-testid="empty-state"], p:has-text("Nessun")');
    this.paginationNext = page.locator('button[aria-label*="Next"], button:has-text("Successivo")');
    this.paginationPrev = page.locator('button[aria-label*="Previous"], button:has-text("Precedente")');

    // Filters
    this.categoryFilter = page.locator('select[name="category"], select[aria-label*="Categoria"]').first();
    this.statusFilter = page.locator('select[name="status"], select[aria-label*="Stato"]').first();
    this.locationFilter = page.locator('select[name="location"], select[aria-label*="Ubicazione"]').first();

    // Item details
    this.itemDetail = page.locator('.item-detail, [data-testid="item-detail"]').first();
    this.itemSku = page.locator('[data-testid="item-sku"], .item-sku').first();
    this.itemDescription = page.locator('[data-testid="item-description"], .item-description').first();
    this.itemQuantity = page.locator('[data-testid="item-quantity"], .item-quantity').first();
  }

  /**
   * Navigate to items page
   */
  async goto(): Promise<void> {
    await super.goto({ waitUntil: 'domcontentloaded' });
    await this.waitForItemsPageLoad();
  }

  /**
   * Wait for items page to load
   */
  async waitForItemsPageLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.waitForLoadingToFinish(15000);
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Verify page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.searchInput).toBeVisible({ timeout: 10000 });
  }

  /**
   * Search for items
   */
  async searchItems(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.fill(query);

    // Press Enter or click search button
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
   * Filter by category
   */
  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter.waitFor({ state: 'visible', timeout: 10000 });
    await this.categoryFilter.selectOption({ label: category });
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
   * Get items count (from table or grid)
   */
  async getItemsCount(): Promise<number> {
    await this.waitForLoadingToFinish(10000);

    // Check if empty state is shown
    const isEmpty = await this.emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      return 0;
    }

    // Try table first, then grid
    const tableVisible = await this.itemsTable.isVisible().catch(() => false);
    if (tableVisible) {
      return await this.tableRows.count();
    }

    const gridVisible = await this.itemsGrid.isVisible().catch(() => false);
    if (gridVisible) {
      return await this.itemCards.count();
    }

    return 0;
  }

  /**
   * Click on item by index
   */
  async clickItem(index: number): Promise<void> {
    // Check if using table or grid layout
    const tableVisible = await this.itemsTable.isVisible().catch(() => false);

    if (tableVisible) {
      const row = this.tableRows.nth(index);
      await row.waitFor({ state: 'visible', timeout: 10000 });
      await row.click();
    } else {
      const card = this.itemCards.nth(index);
      await card.waitFor({ state: 'visible', timeout: 10000 });
      await card.click();
    }

    await this.waitForNavigation();
  }

  /**
   * Get item data from table row
   */
  async getItemDataFromRow(rowIndex: number): Promise<{ sku: string; description: string; quantity: string }> {
    const row = this.tableRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 10000 });

    const cells = row.locator('td');
    const cellCount = await cells.count();

    if (cellCount < 3) {
      throw new Error('Row does not have enough cells');
    }

    return {
      sku: await cells.nth(0).textContent() || '',
      description: await cells.nth(1).textContent() || '',
      quantity: await cells.nth(2).textContent() || '',
    };
  }

  /**
   * Verify item exists
   */
  async verifyItemExists(sku: string): Promise<void> {
    const item = this.page.locator(`tr:has-text("${sku}"), .item-card:has-text("${sku}")`);
    await expect(item).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify empty state
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    await this.paginationNext.waitFor({ state: 'visible', timeout: 10000 });
    await this.paginationNext.click();
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Go to previous page
   */
  async goToPreviousPage(): Promise<void> {
    await this.paginationPrev.waitFor({ state: 'visible', timeout: 10000 });
    await this.paginationPrev.click();
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Clear search
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.searchInput.press('Enter');
    await this.waitForLoadingToFinish(10000);
  }

  /**
   * Take items page screenshot
   */
  async takeItemsScreenshot(name: string = 'items-page'): Promise<void> {
    await this.takeScreenshot(name);
  }
}
