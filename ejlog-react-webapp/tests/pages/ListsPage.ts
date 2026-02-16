import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ListsPage - Page Object Model for Lists Management
 *
 * Handles list creation, editing, searching, and operations
 */
export class ListsPage extends BasePage {
  // Page elements
  readonly pageTitle: Locator;
  readonly createListButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly listsTable: Locator;
  readonly tableRows: Locator;
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  // List actions
  readonly editButtons: Locator;
  readonly deleteButtons: Locator;
  readonly viewButtons: Locator;

  // Modal/Dialog
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly modalCloseButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // Form fields (for create/edit)
  readonly listNameInput: Locator;
  readonly listTypeSelect: Locator;
  readonly listStatusSelect: Locator;
  readonly descriptionInput: Locator;

  constructor(page: Page) {
    super(page, '/lists');

    // Page elements
    this.pageTitle = page.locator('h1:has-text("Liste"), h2:has-text("Liste")').first();
    this.createListButton = page.locator('button:has-text("Nuova"), button:has-text("Crea"), button:has-text("Aggiungi")').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Cerca"]').first();
    this.filterDropdown = page.locator('select[name="filter"], select[aria-label*="Filtra"]').first();
    this.listsTable = page.locator('table, [role="table"]').first();
    this.tableRows = page.locator('tbody tr, [role="row"]');
    this.loadingSpinner = page.locator('.loading, .spinner, [data-testid="loading"]');
    this.emptyState = page.locator('.empty-state, [data-testid="empty-state"]');

    // List actions
    this.editButtons = page.locator('button[aria-label*="Edit"], button:has-text("Modifica")');
    this.deleteButtons = page.locator('button[aria-label*="Delete"], button:has-text("Elimina")');
    this.viewButtons = page.locator('button[aria-label*="View"], button:has-text("Visualizza"), a:has-text("Dettagli")');

    // Modal/Dialog
    this.modal = page.locator('[role="dialog"], .modal, .dialog').first();
    this.modalTitle = page.locator('[role="dialog"] h2, .modal-title').first();
    this.modalCloseButton = page.locator('[role="dialog"] button[aria-label*="Close"], .modal button.close').first();
    this.saveButton = page.locator('button:has-text("Salva"), button[type="submit"]').first();
    this.cancelButton = page.locator('button:has-text("Annulla"), button:has-text("Cancel")').first();

    // Form fields
    this.listNameInput = page.locator('input[name="name"], input[label*="Nome"]').first();
    this.listTypeSelect = page.locator('select[name="type"], select[name="listType"]').first();
    this.listStatusSelect = page.locator('select[name="status"], select[name="stato"]').first();
    this.descriptionInput = page.locator('textarea[name="description"], input[name="description"]').first();
  }

  /**
   * Navigate to lists page
   */
  async goto(): Promise<void> {
    await super.goto({ waitUntil: 'domcontentloaded' });
    await this.waitForListsPageLoad();
  }

  /**
   * Wait for lists page to load
   */
  async waitForListsPageLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    await this.waitForLoadingToFinish(15000);
    await this.waitForNetworkIdle(10000);
  }

  /**
   * Verify page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    await expect(this.createListButton).toBeVisible({ timeout: 10000 });
  }

  /**
   * Search for lists
   */
  async searchLists(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Filter lists by type
   */
  async filterByType(type: string): Promise<void> {
    await this.filterDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.filterDropdown.selectOption({ label: type });
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Get number of lists in table
   */
  async getListsCount(): Promise<number> {
    await this.waitForLoadingToFinish(10000);

    // Check if empty state is shown
    const isEmpty = await this.emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      return 0;
    }

    return await this.tableRows.count();
  }

  /**
   * Create new list
   */
  async createList(listData: {
    name: string;
    type?: string;
    status?: string;
    description?: string;
  }): Promise<void> {
    // Click create button
    await this.createListButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.createListButton.click();

    // Wait for modal to open
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });

    // Fill form
    await this.listNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.listNameInput.fill(listData.name);

    if (listData.type) {
      await this.listTypeSelect.selectOption({ label: listData.type });
    }

    if (listData.status) {
      await this.listStatusSelect.selectOption({ label: listData.status });
    }

    if (listData.description) {
      await this.descriptionInput.fill(listData.description);
    }

    // Save
    await this.saveButton.click();

    // Wait for modal to close and list to be created
    await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * Edit list by row index
   */
  async editList(rowIndex: number, newData: { name?: string; description?: string }): Promise<void> {
    const editButton = this.editButtons.nth(rowIndex);
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();

    // Wait for modal
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });

    // Update fields
    if (newData.name) {
      await this.listNameInput.clear();
      await this.listNameInput.fill(newData.name);
    }

    if (newData.description) {
      await this.descriptionInput.clear();
      await this.descriptionInput.fill(newData.description);
    }

    // Save
    await this.saveButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
    await this.waitForLoadingToFinish(10000);
  }

  /**
   * Delete list by row index
   */
  async deleteList(rowIndex: number): Promise<void> {
    const deleteButton = this.deleteButtons.nth(rowIndex);
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
    await deleteButton.click();

    // Wait for confirmation dialog
    await this.page.waitForTimeout(500);

    // Confirm deletion (assuming confirmation button)
    const confirmButton = this.page.locator('button:has-text("Conferma"), button:has-text("Elimina")').last();
    await confirmButton.click();

    await this.waitForLoadingToFinish(10000);
    await this.waitForNetworkIdle(5000);
  }

  /**
   * View list details by row index
   */
  async viewListDetails(rowIndex: number): Promise<void> {
    const viewButton = this.viewButtons.nth(rowIndex);
    await viewButton.waitFor({ state: 'visible', timeout: 10000 });
    await viewButton.click();
    await this.waitForNavigation();
  }

  /**
   * Get list data from row
   */
  async getListDataFromRow(rowIndex: number): Promise<{ name: string; type: string; status: string }> {
    const row = this.tableRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 10000 });

    const cells = row.locator('td');
    const cellCount = await cells.count();

    if (cellCount < 3) {
      throw new Error('Row does not have enough cells');
    }

    return {
      name: await cells.nth(0).textContent() || '',
      type: await cells.nth(1).textContent() || '',
      status: await cells.nth(2).textContent() || '',
    };
  }

  /**
   * Verify list exists in table
   */
  async verifyListExists(listName: string): Promise<void> {
    const listRow = this.page.locator(`tr:has-text("${listName}")`);
    await expect(listRow).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify empty state is shown
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  /**
   * Close modal
   */
  async closeModal(): Promise<void> {
    await this.modalCloseButton.click();
    await this.modal.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Take lists page screenshot
   */
  async takeListsScreenshot(name: string = 'lists-page'): Promise<void> {
    await this.takeScreenshot(name);
  }
}
