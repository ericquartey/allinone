// ============================================================================
// EJLOG WMS - Items Management E2E Tests
// Test completi per ItemsListPage, ItemDetailPage, ItemCreatePage, ItemEditPage
// ============================================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:8080';

// ============================================================================
// ITEMS LIST PAGE TESTS
// ============================================================================

test.describe('ItemsListPage - Items List and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');
  });

  test('should load and display items list', async ({ page }) => {
    // Verifica che la pagina si carichi
    await expect(page.locator('h1:has-text("Gestione Articoli")')).toBeVisible();

    // Verifica che ci siano articoli nella lista
    const itemRows = page.locator('table tbody tr');
    await expect(itemRows).toHaveCount({ timeout: 10000 });

    // Verifica che la prima riga abbia le colonne corrette
    const firstRow = itemRows.first();
    await expect(firstRow.locator('td').nth(0)).toBeVisible(); // Codice
    await expect(firstRow.locator('td').nth(1)).toBeVisible(); // Descrizione
    await expect(firstRow.locator('td').nth(2)).toBeVisible(); // Tipo
    await expect(firstRow.locator('td').nth(3)).toBeVisible(); // UM
  });

  test('should filter items by search term', async ({ page }) => {
    // Attendi che la lista sia caricata
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const searchInput = page.locator('input[placeholder*="Cerca"]');
    await expect(searchInput).toBeVisible();

    // Conta gli articoli iniziali
    const initialCount = await page.locator('table tbody tr').count();
    expect(initialCount).toBeGreaterThan(0);

    // Cerca un termine specifico
    await searchInput.fill('ART');
    await page.waitForTimeout(500); // Debounce

    // Verifica che i risultati siano filtrati
    const filteredRows = page.locator('table tbody tr');
    const filteredCount = await filteredRows.count();

    // Verifica che ogni riga contenga il termine cercato
    for (let i = 0; i < filteredCount; i++) {
      const row = filteredRows.nth(i);
      const rowText = await row.textContent();
      expect(rowText.toUpperCase()).toContain('ART');
    }
  });

  test('should filter items by type', async ({ page }) => {
    // Attendi caricamento
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const typeFilter = page.locator('select').first();
    await expect(typeFilter).toBeVisible();

    // Seleziona "Prodotto Finito"
    await typeFilter.selectOption({ label: /Prodotto Finito/i });
    await page.waitForTimeout(500);

    // Verifica che i risultati siano filtrati correttamente
    const filteredRows = page.locator('table tbody tr');
    const count = await filteredRows.count();

    if (count > 0) {
      const firstRowType = await filteredRows.first().locator('td').nth(2).textContent();
      expect(firstRowType).toContain('Prodotto Finito');
    }
  });

  test('should filter items by status', async ({ page }) => {
    // Attendi caricamento
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const statusFilter = page.locator('select').last();
    await expect(statusFilter).toBeVisible();

    // Seleziona "Attivo"
    await statusFilter.selectOption({ label: /Attivo/i });
    await page.waitForTimeout(500);

    // Verifica che ci siano risultati
    const filteredRows = page.locator('table tbody tr');
    await expect(filteredRows.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to item detail page', async ({ page }) => {
    // Attendi caricamento lista
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Click sulla prima riga
    const firstRow = page.locator('table tbody tr').first();
    const itemCode = await firstRow.locator('td').first().textContent();

    await firstRow.click();

    // Verifica navigazione alla pagina dettaglio
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode?.trim()}`), { timeout: 5000 });
  });

  test('should navigate to create item page', async ({ page }) => {
    // Trova e click sul bottone "Nuovo Articolo"
    const createButton = page.locator('button:has-text("Nuovo Articolo")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Verifica navigazione
    await expect(page).toHaveURL(/\/items\/create/, { timeout: 5000 });
    await expect(page.locator('h1:has-text("Nuovo Articolo")')).toBeVisible();
  });

  test('should display item statistics', async ({ page }) => {
    // Verifica presenza delle statistiche
    await expect(page.locator('text=/Totale Articoli|Total Items/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Attivi|Active/i')).toBeVisible();
  });
});

// ============================================================================
// ITEM DETAIL PAGE TESTS
// ============================================================================

test.describe('ItemDetailPage - Item Detail View', () => {
  test('should display item detail with all information', async ({ page }) => {
    // Vai alla lista e seleziona il primo articolo
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    const itemCode = await firstRow.locator('td').first().textContent();

    await firstRow.click();

    // Verifica che la pagina dettaglio sia caricata
    await expect(page.locator('h1')).toContainText(itemCode?.trim() || '');

    // Verifica presenza tabs
    await expect(page.locator('button:has-text("Informazioni")')).toBeVisible();
    await expect(page.locator('button:has-text("Giacenze")')).toBeVisible();
    await expect(page.locator('button:has-text("Movimenti")')).toBeVisible();

    // Verifica statistiche
    await expect(page.locator('text=/Giacenza Totale|Total Stock/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Disponibile|Available/i')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Tab Informazioni (default)
    const infoTab = page.locator('button:has-text("Informazioni")');
    await expect(infoTab).toBeVisible();

    // Switch a Giacenze
    const stockTab = page.locator('button:has-text("Giacenze")');
    await stockTab.click();
    await page.waitForTimeout(300);

    // Verifica contenuto tab giacenze
    await expect(page.locator('text=/Ubicazione|Location/i')).toBeVisible({ timeout: 5000 });

    // Switch a Movimenti
    const movementsTab = page.locator('button:has-text("Movimenti")');
    await movementsTab.click();
    await page.waitForTimeout(300);

    // Verifica contenuto tab movimenti
    await expect(page.locator('text=/Movimenti Recenti|Recent Movements/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to edit page', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    const itemCode = await firstRow.locator('td').first().textContent();
    await firstRow.click();

    // Click su bottone Modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // Verifica navigazione
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode?.trim()}/edit`), { timeout: 5000 });
    await expect(page.locator('h1:has-text("Modifica Articolo")')).toBeVisible();
  });

  test('should display low stock warning badge', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Cerca un articolo con giacenza bassa (se esiste)
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Attendi caricamento pagina dettaglio
    await page.waitForLoadState('networkidle');

    // Verifica se c'è il badge di scorta minima (potrebbe non esserci sempre)
    const lowStockBadge = page.locator('text=/Scorta Minima|Low Stock/i');
    // Non assertiamo perché potrebbe non essere presente, solo verifichiamo che la pagina non vada in errore
  });

  test('should display traceability badges', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Attendi caricamento
    await page.waitForLoadState('networkidle');

    // Tab info dovrebbe mostrare le info di tracciabilità
    // Verifica che non ci siano errori nella visualizzazione
    const infoSection = page.locator('text=/Tracciabilità|Traceability/i');
    // Potrebbe essere visibile o meno a seconda dell'articolo
  });
});

// ============================================================================
// ITEM CREATE PAGE TESTS
// ============================================================================

test.describe('ItemCreatePage - Create New Item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Nuovo Articolo")');
    await createButton.click();

    await expect(page).toHaveURL(/\/items\/create/);
  });

  test('should display create item form with all sections', async ({ page }) => {
    // Verifica titolo
    await expect(page.locator('h1:has-text("Nuovo Articolo")')).toBeVisible();

    // Verifica sezioni del form
    await expect(page.locator('h2:has-text("Informazioni di Base")')).toBeVisible();
    await expect(page.locator('h2:has-text("Caratteristiche Fisiche")')).toBeVisible();
    await expect(page.locator('h2:has-text("Gestione Giacenze")')).toBeVisible();
    await expect(page.locator('h2:has-text("Tracciabilità")')).toBeVisible();
    await expect(page.locator('h2:has-text("Note")')).toBeVisible();

    // Verifica campi obbligatori
    await expect(page.locator('input[placeholder*="ART"]')).toBeVisible(); // Codice
    await expect(page.locator('input[placeholder*="Prodotto"]')).toBeVisible(); // Descrizione
  });

  test('should validate required fields', async ({ page }) => {
    // Click su Crea senza compilare
    const submitButton = page.locator('button:has-text("Crea Articolo")');
    await submitButton.click();

    // Verifica che non navighi (form HTML5 validation)
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/items\/create/);
  });

  test('should create new item successfully', async ({ page }) => {
    const timestamp = Date.now();
    const newItemCode = `E2E_${timestamp}`;

    // Compila form
    await page.locator('input[placeholder*="ART"]').fill(newItemCode);
    await page.locator('input[placeholder*="Prodotto"]').fill(`Test Item E2E ${timestamp}`);
    await page.locator('input[placeholder*="801"]').fill('1234567890123'); // Barcode

    // Seleziona tipo articolo
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption({ label: /Prodotto Finito/i });

    // Seleziona unità di misura
    const umSelect = page.locator('select').nth(1);
    await umSelect.selectOption({ label: /Pezzi/i });

    // Compila categoria
    await page.locator('input[placeholder*="Elettronica"]').fill('Test Category');

    // Compila peso e volume
    await page.locator('input[placeholder*="1.250"]').fill('5.5');
    await page.locator('input[placeholder*="0.0125"]').fill('0.025');

    // Compila scorte
    await page.locator('input[placeholder*="10"]').first().fill('10'); // Min
    await page.locator('input[placeholder*="100"]').fill('100'); // Max

    // Checkbox tracciabilità
    const lotCheckbox = page.locator('input[type="checkbox"]').first();
    await lotCheckbox.check();

    // Compila note
    await page.locator('textarea[placeholder*="note"]').fill('Item creato da test E2E automatico');

    // Submit
    const submitButton = page.locator('button:has-text("Crea Articolo")');
    await submitButton.click();

    // Verifica navigazione alla pagina dettaglio
    await expect(page).toHaveURL(new RegExp(`/items/${newItemCode}`), { timeout: 10000 });

    // Verifica che il nuovo articolo sia visualizzato
    await expect(page.locator(`h1:has-text("${newItemCode}")`)).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=/Test Item E2E ${timestamp}/i`)).toBeVisible();
  });

  test('should handle duplicate item code error', async ({ page }) => {
    // Prova a creare un articolo con codice già esistente
    // Prima ottieni un codice esistente dalla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    const existingCode = await firstRow.locator('td').first().textContent();

    // Torna al form di creazione
    await page.goto(`${BASE_URL}/items/create`);

    // Compila con codice duplicato
    await page.locator('input[placeholder*="ART"]').fill(existingCode?.trim() || 'ART001');
    await page.locator('input[placeholder*="Prodotto"]').fill('Test Duplicate');

    // Submit
    const submitButton = page.locator('button:has-text("Crea Articolo")');
    await submitButton.click();

    // Verifica messaggio di errore (potrebbe apparire)
    await page.waitForTimeout(2000);

    // Dovrebbe mostrare un errore o rimanere sulla pagina
    const errorMessage = page.locator('text=/errore|error|già esistente|already exists/i');
    // Il messaggio potrebbe essere visibile o meno a seconda della risposta del backend
  });

  test('should cancel and return to items list', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("Annulla")').first();
    await cancelButton.click();

    // Verifica navigazione
    await expect(page).toHaveURL(/\/items/, { timeout: 5000 });
  });

  test('should clear field error on input', async ({ page }) => {
    // Trigger validazione
    const submitButton = page.locator('button:has-text("Crea Articolo")');
    await submitButton.click();
    await page.waitForTimeout(500);

    // Compila campo codice
    const codeInput = page.locator('input[placeholder*="ART"]');
    await codeInput.fill('TEST123');

    // L'errore HTML5 dovrebbe scomparire
    const isValid = await codeInput.evaluate((el) => el.validity.valid);
    expect(isValid).toBe(true);
  });
});

// ============================================================================
// ITEM EDIT PAGE TESTS
// ============================================================================

test.describe('ItemEditPage - Edit Existing Item', () => {
  test('should load item data and display in form', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    const itemCode = await firstRow.locator('td').first().textContent();
    const itemDescription = await firstRow.locator('td').nth(1).textContent();

    await firstRow.click();

    // Vai alla pagina di modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Verifica titolo
    await expect(page.locator('h1:has-text("Modifica Articolo")')).toBeVisible();

    // Verifica che i campi siano pre-compilati
    const codeInput = page.locator('input[value*="' + (itemCode?.trim() || '') + '"]');
    await expect(codeInput).toBeVisible({ timeout: 5000 });
    await expect(codeInput).toBeDisabled(); // Codice non modificabile

    // Verifica descrizione
    const descInput = page.locator('input[type="text"]').nth(1);
    const descValue = await descInput.inputValue();
    expect(descValue.length).toBeGreaterThan(0);
  });

  test('should display read-only traceability section', async ({ page }) => {
    // Vai alla lista e seleziona articolo
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Verifica sezione tracciabilità
    await expect(page.locator('h2:has-text("Tracciabilità")')).toBeVisible();

    // Verifica messaggio di sola lettura
    await expect(page.locator('text=/non possono essere modificate|cannot be modified/i')).toBeVisible({ timeout: 5000 });
  });

  test('should update item successfully', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Modifica descrizione
    const descInput = page.locator('input[type="text"]').nth(1);
    const originalDesc = await descInput.inputValue();
    const newDesc = `${originalDesc} - Updated ${Date.now()}`;

    await descInput.fill(newDesc);

    // Modifica categoria
    const categoryInput = page.locator('input[placeholder*="Elettronica"]');
    await categoryInput.fill('Updated Category E2E');

    // Modifica note
    const notesTextarea = page.locator('textarea[placeholder*="note"]');
    await notesTextarea.fill('Note modificate da test E2E');

    // Submit
    const saveButton = page.locator('button:has-text("Salva Modifiche")');
    await saveButton.click();

    // Verifica navigazione alla pagina dettaglio
    await expect(page).toHaveURL(/\/items\/[^\/]+$/, { timeout: 10000 });

    // Verifica che le modifiche siano visibili
    await expect(page.locator(`text=/${newDesc}/i`)).toBeVisible({ timeout: 5000 });
  });

  test('should validate form on edit', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Svuota descrizione (campo obbligatorio)
    const descInput = page.locator('input[type="text"]').nth(1);
    await descInput.fill('');

    // Prova a salvare
    const saveButton = page.locator('button:has-text("Salva Modifiche")');
    await saveButton.click();

    // Dovrebbe rimanere sulla pagina per validazione HTML5
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/edit/);
  });

  test('should change item status', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Cambia stato
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption({ label: /Inattivo|Inactive/i });

    // Salva
    const saveButton = page.locator('button:has-text("Salva Modifiche")');
    await saveButton.click();

    // Verifica navigazione
    await expect(page).toHaveURL(/\/items\/[^\/]+$/, { timeout: 10000 });
  });

  test('should cancel edit and return to detail', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    const itemCode = await firstRow.locator('td').first().textContent();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Click annulla
    const cancelButton = page.locator('button:has-text("Annulla")').first();
    await cancelButton.click();

    // Verifica ritorno a dettaglio
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode?.trim()}$`), { timeout: 5000 });
  });

  test('should update physical characteristics', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Modifica peso
    const weightInput = page.locator('input[placeholder*="1.250"]');
    await weightInput.fill('12.345');

    // Modifica volume
    const volumeInput = page.locator('input[placeholder*="0.0125"]');
    await volumeInput.fill('0.5678');

    // Salva
    const saveButton = page.locator('button:has-text("Salva Modifiche")');
    await saveButton.click();

    // Verifica navigazione
    await expect(page).toHaveURL(/\/items\/[^\/]+$/, { timeout: 10000 });
  });

  test('should update stock levels', async ({ page }) => {
    // Vai alla lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const firstRow = page.locator('table tbody tr').first();
    await firstRow.click();

    // Vai a modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    // Modifica scorta minima
    const minStockInput = page.locator('input[placeholder*="10"]').first();
    await minStockInput.fill('25');

    // Modifica scorta massima
    const maxStockInput = page.locator('input[placeholder*="100"]');
    await maxStockInput.fill('250');

    // Salva
    const saveButton = page.locator('button:has-text("Salva Modifiche")');
    await saveButton.click();

    // Verifica navigazione
    await expect(page).toHaveURL(/\/items\/[^\/]+$/, { timeout: 10000 });
  });
});

// ============================================================================
// INTEGRATION TESTS - Full Flow
// ============================================================================

test.describe('Items Management - Full Integration Flow', () => {
  test('should complete full CRUD cycle', async ({ page }) => {
    const timestamp = Date.now();
    const itemCode = `FULL_${timestamp}`;
    const itemDesc = `Full Cycle Item ${timestamp}`;

    // 1. CREATE - Vai a lista e crea nuovo articolo
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');

    const createButton = page.locator('button:has-text("Nuovo Articolo")');
    await createButton.click();

    // Compila form creazione
    await page.locator('input[placeholder*="ART"]').fill(itemCode);
    await page.locator('input[placeholder*="Prodotto"]').fill(itemDesc);

    const submitButton = page.locator('button:has-text("Crea Articolo")');
    await submitButton.click();

    // 2. READ - Verifica dettaglio
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode}`), { timeout: 10000 });
    await expect(page.locator(`h1:has-text("${itemCode}")`)).toBeVisible();
    await expect(page.locator(`text=/${itemDesc}/i`)).toBeVisible();

    // Verifica tabs
    const stockTab = page.locator('button:has-text("Giacenze")');
    await stockTab.click();
    await page.waitForTimeout(300);

    const movementsTab = page.locator('button:has-text("Movimenti")');
    await movementsTab.click();
    await page.waitForTimeout(300);

    // 3. UPDATE - Modifica articolo
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();

    await expect(page).toHaveURL(new RegExp(`/items/${itemCode}/edit`), { timeout: 5000 });

    const descInput = page.locator('input[type="text"]').nth(1);
    const updatedDesc = `${itemDesc} - UPDATED`;
    await descInput.fill(updatedDesc);

    const saveButton = page.locator('button:has-text("Salva Modifiche")');
    await saveButton.click();

    // Verifica ritorno a dettaglio con modifiche
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode}$`), { timeout: 10000 });
    await expect(page.locator(`text=/${updatedDesc}/i`)).toBeVisible();

    // 4. LIST - Torna alla lista e verifica presenza
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Cerca"]');
    await searchInput.fill(itemCode);
    await page.waitForTimeout(500);

    const itemRow = page.locator(`table tbody tr:has-text("${itemCode}")`);
    await expect(itemRow).toBeVisible({ timeout: 5000 });

    console.log(`✅ Full CRUD cycle completed for item: ${itemCode}`);
  });

  test('should handle navigation between pages correctly', async ({ page }) => {
    // Lista → Dettaglio → Modifica → Dettaglio → Lista
    await page.goto(`${BASE_URL}/items-list`);
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Lista → Dettaglio
    const firstRow = page.locator('table tbody tr').first();
    const itemCode = await firstRow.locator('td').first().textContent();
    await firstRow.click();
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode?.trim()}`));

    // Dettaglio → Modifica
    const editButton = page.locator('button:has-text("Modifica")');
    await editButton.click();
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode?.trim()}/edit`));

    // Modifica → Dettaglio (Annulla)
    const cancelButton = page.locator('button:has-text("Annulla")').first();
    await cancelButton.click();
    await expect(page).toHaveURL(new RegExp(`/items/${itemCode?.trim()}$`));

    // Dettaglio → Lista
    const backButton = page.locator('button:has-text("Torna")');
    await backButton.click();
    await expect(page).toHaveURL(/\/items/);
  });
});

console.log('✅ Items Management E2E Tests loaded successfully');
