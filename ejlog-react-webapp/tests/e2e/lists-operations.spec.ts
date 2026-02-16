/**
 * E2E Test - Lists Operations: Execute, Suspend, Terminate
 *
 * Questo test verifica il flusso completo di gestione stati lista in React,
 * confrontandolo con il comportamento originale dell'applicazione Swing.
 *
 * Backend: ItemListsApiController.java (porta 3077)
 * Frontend: React app (porta 3008)
 *
 * Stati Lista:
 * - 0 = IN_EXECUTION
 * - 1 = WAITING
 * - 2 = TERMINATED
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// SETUP & CONFIGURATION
// ============================================================================

const FRONTEND_URL = 'http://localhost:3008';
const BACKEND_URL = 'http://localhost:3077';

/**
 * Helper: Wait for list to appear in table with specific status
 */
async function waitForListStatus(page: Page, listId: number, expectedStatus: number, timeout = 5000) {
  const statusLabels = {
    0: 'IN ESECUZIONE',
    1: 'IN ATTESA',
    2: 'TERMINATA',
  };

  await page.waitForSelector(
    `tr[data-list-id="${listId}"] [data-list-status="${expectedStatus}"]`,
    { timeout, state: 'visible' }
  );

  const statusText = await page.locator(`tr[data-list-id="${listId}"] .badge`).last().textContent();
  console.log(`✅ Lista #${listId} - Stato: ${statusText} (${statusLabels[expectedStatus]})`);
}

/**
 * Helper: Wait for toast notification
 */
async function waitForToast(page: Page, expectedText: string, timeout = 3000) {
  const toast = page.locator('[data-toast]', { hasText: expectedText });
  await toast.waitFor({ timeout, state: 'visible' });
  console.log(`✅ Toast: "${expectedText}"`);
}

/**
 * Helper: Create test list via API
 */
async function createTestList(page: Page): Promise<{ id: number; listNumber: string }> {
  // Call backend API to create test list
  const response = await page.request.post(`${BACKEND_URL}/api/item-lists`, {
    params: {
      tipoLista: 1, // PICKING
      numLista: `TEST_${Date.now()}`,
      descrizione: 'Test list for E2E operations',
      areaId: 1,
      priorita: 5,
    },
  });

  expect(response.status()).toBe(200);
  const data = await response.json();

  console.log(`✅ Created test list: #${data.id} - ${data.listNumber}`);
  return {
    id: data.id,
    listNumber: data.listNumber,
  };
}

/**
 * Helper: Delete test list via API
 */
async function deleteTestList(page: Page, listId: number) {
  const response = await page.request.delete(`${BACKEND_URL}/api/item-lists/${listId}`);
  if (response.status() === 204) {
    console.log(`✅ Deleted test list: #${listId}`);
  }
}

// ============================================================================
// TEST SUITE: Lists Operations
// ============================================================================

test.describe('Lists Operations - Execute, Suspend, Terminate', () => {
  let testList: { id: number; listNumber: string } | null = null;

  // Setup: Create test list before each test
  test.beforeEach(async ({ page }) => {
    console.log('\n=== TEST SETUP ===');

    // Navigate to lists page
    await page.goto(`${FRONTEND_URL}/lists`);
    await page.waitForLoadState('networkidle');

    // Create test list via API
    testList = await createTestList(page);

    // Refresh page to show new list
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  // Cleanup: Delete test list after each test
  test.afterEach(async ({ page }) => {
    console.log('\n=== TEST CLEANUP ===');
    if (testList) {
      await deleteTestList(page, testList.id);
      testList = null;
    }
  });

  // ==========================================================================
  // TEST 1: Execute List (WAITING → IN_EXECUTION)
  // ==========================================================================
  test('should execute a WAITING list and change status to IN_EXECUTION', async ({ page }) => {
    console.log('\n=== TEST 1: Execute List ===');

    if (!testList) throw new Error('Test list not created');

    // Step 1: Find and select test list in table
    const listRow = page.locator(`tr[data-list-id="${testList.id}"]`);
    await expect(listRow).toBeVisible();
    await listRow.click();
    console.log(`✅ Selected list #${testList.id}`);

    // Step 2: Verify initial status is WAITING
    await waitForListStatus(page, testList.id, 1); // 1 = WAITING

    // Step 3: Click "Esegui" button in sidebar
    const executeButton = page.locator('button', { hasText: 'Esegui' });
    await expect(executeButton).toBeEnabled();
    await executeButton.click();
    console.log('✅ Clicked "Esegui" button');

    // Step 4: Wait for success toast
    await waitForToast(page, 'in esecuzione');

    // Step 5: Wait for status update to IN_EXECUTION
    await page.waitForTimeout(500); // Allow time for UI update
    await page.reload(); // Refresh to get latest state
    await waitForListStatus(page, testList.id, 0); // 0 = IN_EXECUTION

    // Step 6: Verify API call was successful (check network logs)
    console.log('✅ TEST 1 PASSED: Lista eseguita con successo');
  });

  // ==========================================================================
  // TEST 2: Suspend List (IN_EXECUTION → WAITING)
  // ==========================================================================
  test('should suspend an IN_EXECUTION list and change status to WAITING', async ({ page }) => {
    console.log('\n=== TEST 2: Suspend List ===');

    if (!testList) throw new Error('Test list not created');

    // Precondition: Execute list first to get IN_EXECUTION state
    const executeResponse = await page.request.post(
      `${BACKEND_URL}/api/item-lists/${testList.id}/execute`
    );
    expect(executeResponse.status()).toBe(200);
    console.log('✅ Precondition: List executed via API');

    // Reload page to show updated status
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 1: Select test list
    const listRow = page.locator(`tr[data-list-id="${testList.id}"]`);
    await listRow.click();
    console.log(`✅ Selected list #${testList.id}`);

    // Step 2: Verify current status is IN_EXECUTION
    await waitForListStatus(page, testList.id, 0); // 0 = IN_EXECUTION

    // Step 3: Click "Attesa" button in sidebar
    const waitingButton = page.locator('button', { hasText: 'Attesa' });
    await expect(waitingButton).toBeEnabled();
    await waitingButton.click();
    console.log('✅ Clicked "Attesa" button');

    // Step 4: Wait for success toast
    await waitForToast(page, 'messa in attesa');

    // Step 5: Wait for status update to WAITING
    await page.waitForTimeout(500); // Allow time for UI update
    await page.reload(); // Refresh to get latest state
    await waitForListStatus(page, testList.id, 1); // 1 = WAITING

    console.log('✅ TEST 2 PASSED: Lista messa in attesa con successo');
  });

  // ==========================================================================
  // TEST 3: Terminate List (ANY → TERMINATED)
  // ==========================================================================
  test('should terminate a list and change status to TERMINATED', async ({ page }) => {
    console.log('\n=== TEST 3: Terminate List ===');

    if (!testList) throw new Error('Test list not created');

    // Step 1: Select test list
    const listRow = page.locator(`tr[data-list-id="${testList.id}"]`);
    await listRow.click();
    console.log(`✅ Selected list #${testList.id}`);

    // Step 2: Click "Termina" button in sidebar
    const terminateButton = page.locator('button', { hasText: 'Termina' });
    await expect(terminateButton).toBeEnabled();
    await terminateButton.click();
    console.log('✅ Clicked "Termina" button');

    // Step 3: Confirm termination dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Confermi la terminazione');
      await dialog.accept();
      console.log('✅ Confirmed termination dialog');
    });

    // Step 4: Wait for success toast
    await waitForToast(page, 'terminata con successo');

    // Step 5: Wait for status update to TERMINATED
    await page.waitForTimeout(500); // Allow time for UI update
    await page.reload(); // Refresh to get latest state
    await waitForListStatus(page, testList.id, 2); // 2 = TERMINATED

    console.log('✅ TEST 3 PASSED: Lista terminata con successo');
  });

  // ==========================================================================
  // TEST 4: Table Quick Actions - Attesa Button
  // ==========================================================================
  test('should suspend list using quick action button in table', async ({ page }) => {
    console.log('\n=== TEST 4: Table Quick Action - Attesa ===');

    if (!testList) throw new Error('Test list not created');

    // Precondition: Execute list first
    const executeResponse = await page.request.post(
      `${BACKEND_URL}/api/item-lists/${testList.id}/execute`
    );
    expect(executeResponse.status()).toBe(200);
    console.log('✅ Precondition: List executed via API');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Step 1: Verify list is IN_EXECUTION
    await waitForListStatus(page, testList.id, 0); // 0 = IN_EXECUTION

    // Step 2: Click "Attesa" quick action button in table row
    const quickActionButton = page.locator(
      `tr[data-list-id="${testList.id}"] button:has-text("Attesa")`
    );
    await expect(quickActionButton).toBeVisible();
    await expect(quickActionButton).toBeEnabled();
    await quickActionButton.click();
    console.log('✅ Clicked "Attesa" quick action button');

    // Step 3: Wait for success toast
    await waitForToast(page, 'messa in attesa');

    // Step 4: Verify status changed to WAITING
    await page.waitForTimeout(500);
    await page.reload();
    await waitForListStatus(page, testList.id, 1); // 1 = WAITING

    console.log('✅ TEST 4 PASSED: Quick action funziona correttamente');
  });

  // ==========================================================================
  // TEST 5: Full Workflow - Execute → Suspend → Terminate
  // ==========================================================================
  test('should complete full workflow: Execute → Suspend → Terminate', async ({ page }) => {
    console.log('\n=== TEST 5: Full Workflow ===');

    if (!testList) throw new Error('Test list not created');

    const listRow = page.locator(`tr[data-list-id="${testList.id}"]`);

    // ====== PHASE 1: Execute ======
    console.log('\n--- Phase 1: Execute ---');
    await listRow.click();
    await waitForListStatus(page, testList.id, 1); // Initial: WAITING

    const executeButton = page.locator('button', { hasText: 'Esegui' });
    await executeButton.click();
    await waitForToast(page, 'in esecuzione');

    await page.waitForTimeout(500);
    await page.reload();
    await waitForListStatus(page, testList.id, 0); // Now: IN_EXECUTION
    console.log('✅ Phase 1 complete: WAITING → IN_EXECUTION');

    // ====== PHASE 2: Suspend ======
    console.log('\n--- Phase 2: Suspend ---');
    await listRow.click();

    const waitingButton = page.locator('button', { hasText: 'Attesa' });
    await waitingButton.click();
    await waitForToast(page, 'messa in attesa');

    await page.waitForTimeout(500);
    await page.reload();
    await waitForListStatus(page, testList.id, 1); // Now: WAITING
    console.log('✅ Phase 2 complete: IN_EXECUTION → WAITING');

    // ====== PHASE 3: Terminate ======
    console.log('\n--- Phase 3: Terminate ---');
    await listRow.click();

    const terminateButton = page.locator('button', { hasText: 'Termina' });
    await terminateButton.click();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await waitForToast(page, 'terminata con successo');

    await page.waitForTimeout(500);
    await page.reload();
    await waitForListStatus(page, testList.id, 2); // Now: TERMINATED
    console.log('✅ Phase 3 complete: WAITING → TERMINATED');

    console.log('\n✅ TEST 5 PASSED: Full workflow completato con successo');
  });

  // ==========================================================================
  // TEST 6: Error Handling - 404 Should Not Occur
  // ==========================================================================
  test('should NOT get 404 errors when changing list states', async ({ page }) => {
    console.log('\n=== TEST 6: Error Handling - No 404 ===');

    if (!testList) throw new Error('Test list not created');

    // Listen for failed network requests
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();
      console.error(`❌ Request failed: ${url} - ${failure?.errorText}`);
      failedRequests.push(url);
    });

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();

      // Log any 404 responses
      if (status === 404) {
        console.error(`❌ 404 NOT FOUND: ${url}`);
        failedRequests.push(url);
      }
    });

    // Execute full workflow
    const listRow = page.locator(`tr[data-list-id="${testList.id}"]`);

    // Execute
    await listRow.click();
    await page.locator('button', { hasText: 'Esegui' }).click();
    await page.waitForTimeout(1000);

    // Suspend
    await page.reload();
    await listRow.click();
    await page.locator('button', { hasText: 'Attesa' }).click();
    await page.waitForTimeout(1000);

    // Terminate
    await page.reload();
    await listRow.click();
    page.on('dialog', async (dialog) => await dialog.accept());
    await page.locator('button', { hasText: 'Termina' }).click();
    await page.waitForTimeout(1000);

    // Verify no 404 errors occurred
    const has404Errors = failedRequests.some((url) => url.includes('item-lists'));
    expect(has404Errors).toBe(false);

    if (failedRequests.length === 0) {
      console.log('✅ TEST 6 PASSED: Nessun errore 404 rilevato');
    } else {
      console.warn('⚠️  Alcuni request hanno fallito (non 404):', failedRequests);
    }
  });
});

// ============================================================================
// TEST SUITE: API Validation
// ============================================================================

test.describe('Lists API Validation', () => {
  // ==========================================================================
  // TEST 7: Verify REST API Endpoints Exist
  // ==========================================================================
  test('should verify REST API endpoints are accessible', async ({ request }) => {
    console.log('\n=== TEST 7: API Endpoints Validation ===');

    // Create test list
    const createResponse = await request.post(`${BACKEND_URL}/api/item-lists`, {
      params: {
        tipoLista: 1,
        numLista: `API_TEST_${Date.now()}`,
        descrizione: 'API validation test',
        areaId: 1,
      },
    });
    expect(createResponse.status()).toBe(200);
    const list = await createResponse.json();
    const listId = list.id;
    console.log(`✅ Created test list #${listId}`);

    // Test Execute endpoint
    const executeResponse = await request.post(
      `${BACKEND_URL}/api/item-lists/${listId}/execute`
    );
    expect(executeResponse.status()).toBe(200);
    console.log('✅ Execute endpoint: 200 OK');

    // Test Suspend endpoint
    const suspendResponse = await request.post(
      `${BACKEND_URL}/api/item-lists/${listId}/suspend`
    );
    expect(suspendResponse.status()).toBe(200);
    console.log('✅ Suspend endpoint: 200 OK');

    // Test Terminate endpoint
    const terminateResponse = await request.post(
      `${BACKEND_URL}/api/item-lists/${listId}/terminate`
    );
    expect(terminateResponse.status()).toBe(200);
    console.log('✅ Terminate endpoint: 200 OK');

    // Cleanup
    await request.delete(`${BACKEND_URL}/api/item-lists/${listId}`);
    console.log('✅ Cleanup: Test list deleted');

    console.log('\n✅ TEST 7 PASSED: All REST API endpoints are accessible');
  });
});

