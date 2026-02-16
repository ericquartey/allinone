/**
 * EJLOG WMS - Test CRUD Liste - Fix Definitivo
 *
 * Test completo per verificare il cambio stato delle liste:
 * - WAITING (Attesa)
 * - IN_EXECUTION (Esecuzione)
 * - TERMINATED (Terminata)
 *
 * Backend: http://localhost:3077/EjLogHostVertimag
 * Frontend: http://localhost:3004
 *
 * Verifica che il proxy Vite funzioni correttamente:
 * Frontend /api/Lists/* → Backend /EjLogHostVertimag/Lists/*
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const FRONTEND_URL = 'http://localhost:3004';
const BACKEND_URL = 'http://localhost:3077';
const LISTS_PAGE = '/lists-management';

test.describe('CRUD Liste - Fix Cambio Stato', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to Lists Management page
    await page.goto(`${FRONTEND_URL}${LISTS_PAGE}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial state
    await page.screenshot({
      path: 'playwright-report/lists-initial-state.png',
      fullPage: true
    });
  });

  test('Verifica caricamento pagina e presenza liste', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Gestione Liste');

    // Check that lists table exists
    const table = page.locator('table.table');
    await expect(table).toBeVisible();

    // Count lists (should have at least 1)
    const rows = page.locator('table.table tbody tr');
    const count = await rows.count();

    console.log(`Trovate ${count} liste nella tabella`);

    // Should have at least one list
    expect(count).toBeGreaterThan(0);

    // Screenshot
    await page.screenshot({
      path: 'playwright-report/lists-loaded.png',
      fullPage: true
    });
  });

  test('Test cambio stato ATTESA (WAITING) - Fix 404 Error', async ({ page, request }) => {
    console.log('\n=== TEST CAMBIO STATO ATTESA ===\n');

    // Wait for lists to load
    await page.waitForSelector('table.table tbody tr', { timeout: 10000 });

    // Find first list in table
    const firstRow = page.locator('table.table tbody tr').first();
    await expect(firstRow).toBeVisible();

    // Get list number from first row (column 2 = NumLista)
    const listNumber = await firstRow.locator('td').nth(1).textContent();
    console.log(`Lista selezionata: ${listNumber}`);

    // Click on row to select it
    await firstRow.click();
    await page.waitForTimeout(500);

    // Screenshot before action
    await page.screenshot({
      path: 'playwright-report/before-waiting-action.png',
      fullPage: true
    });

    // Setup API request listener to capture PUT request
    const apiRequestPromise = page.waitForRequest(
      request => {
        const isListsAPI = request.url().includes('/Lists/');
        const isPUT = request.method() === 'PUT';
        console.log(`Request: ${request.method()} ${request.url()} - Match: ${isListsAPI && isPUT}`);
        return isListsAPI && isPUT;
      },
      { timeout: 10000 }
    );

    const apiResponsePromise = page.waitForResponse(
      response => {
        const isListsAPI = response.url().includes('/Lists/');
        const isPUT = response.request().method() === 'PUT';
        console.log(`Response: ${response.status()} ${response.url()}`);
        return isListsAPI && isPUT;
      },
      { timeout: 10000 }
    );

    // Click "Attesa" button in actions column or sidebar
    // First try in-table button
    const waitingButton = firstRow.locator('button:has-text("Attesa")');
    const waitingButtonVisible = await waitingButton.isVisible().catch(() => false);

    if (waitingButtonVisible) {
      console.log('Clicking in-table "Attesa" button...');
      await waitingButton.click();
    } else {
      // Fallback to sidebar button
      console.log('Clicking sidebar "Attesa" button...');
      const sidebarWaitingButton = page.locator('button:has-text("Attesa")').first();
      await sidebarWaitingButton.click();
    }

    // Wait for API call
    const apiRequest = await apiRequestPromise;
    const apiResponse = await apiResponsePromise;

    console.log('\n=== API REQUEST ===');
    console.log('URL:', apiRequest.url());
    console.log('Method:', apiRequest.method());
    console.log('Headers:', await apiRequest.allHeaders());

    // Get request body
    const requestBody = apiRequest.postDataJSON();
    console.log('Body:', JSON.stringify(requestBody, null, 2));

    console.log('\n=== API RESPONSE ===');
    console.log('Status:', apiResponse.status(), apiResponse.statusText());
    console.log('Headers:', await apiResponse.allHeaders());

    const responseBody = await apiResponse.json();
    console.log('Body:', JSON.stringify(responseBody, null, 2));

    // CRITICAL VERIFICATION: Status should be 200, NOT 404
    expect(apiResponse.status()).toBe(200);

    // Verify request went to correct endpoint
    expect(apiRequest.url()).toContain('/EjLogHostVertimag/Lists/');
    expect(apiRequest.url()).toContain(listNumber!);

    // Verify request payload
    expect(requestBody).toHaveProperty('listStatus', 1);

    // Verify response is successful
    expect(responseBody).toHaveProperty('status', 'OK');
    expect(responseBody).toHaveProperty('message', 'List updated successfully');

    // Wait for UI to update
    await page.waitForTimeout(2000);

    // Screenshot after action
    await page.screenshot({
      path: 'playwright-report/after-waiting-action.png',
      fullPage: true
    });

    // Verify success toast
    const toast = page.locator('div[role="status"]').filter({ hasText: /messa in attesa/i });
    await expect(toast).toBeVisible({ timeout: 5000 });

    console.log('\n=== TEST PASSED: 200 OK (NOT 404) ===\n');
  });

  test('Test cambio stato ESECUZIONE (IN_EXECUTION)', async ({ page }) => {
    console.log('\n=== TEST CAMBIO STATO ESECUZIONE ===\n');

    // Wait for lists to load
    await page.waitForSelector('table.table tbody tr', { timeout: 10000 });

    // Find a WAITING list
    const rows = page.locator('table.table tbody tr');
    const count = await rows.count();

    let selectedRow = null;
    let listNumber = null;

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const statusBadge = row.locator('.badge').filter({ hasText: /attesa|waiting/i });
      const isWaiting = await statusBadge.count() > 0;

      if (isWaiting) {
        selectedRow = row;
        listNumber = await row.locator('td').nth(1).textContent();
        break;
      }
    }

    if (!selectedRow) {
      console.log('SKIP: No WAITING list found');
      test.skip();
      return;
    }

    console.log(`Lista selezionata: ${listNumber}`);

    // Click to select
    await selectedRow.click();
    await page.waitForTimeout(500);

    // Setup API listener
    const apiResponsePromise = page.waitForResponse(
      response => response.url().includes('/execute'),
      { timeout: 10000 }
    );

    // Click "Esegui" button
    const executeButton = page.locator('button:has-text("Esegui")').first();
    await executeButton.click();

    // Wait for API response
    const apiResponse = await apiResponsePromise;

    console.log('Execute API Response:', apiResponse.status());

    // Verify success
    expect(apiResponse.status()).toBe(200);

    // Screenshot
    await page.screenshot({
      path: 'playwright-report/after-execute-action.png',
      fullPage: true
    });
  });

  test('Test cambio stato TERMINATA (TERMINATED)', async ({ page }) => {
    console.log('\n=== TEST CAMBIO STATO TERMINATA ===\n');

    // Wait for lists to load
    await page.waitForSelector('table.table tbody tr', { timeout: 10000 });

    // Find first non-terminated list
    const firstRow = page.locator('table.table tbody tr').first();
    const listNumber = await firstRow.locator('td').nth(1).textContent();

    console.log(`Lista selezionata: ${listNumber}`);

    // Click to select
    await firstRow.click();
    await page.waitForTimeout(500);

    // Setup API listener
    const apiResponsePromise = page.waitForResponse(
      response => response.url().includes('/terminate'),
      { timeout: 15000 }
    );

    // Click "Termina" button (might be in table or sidebar)
    const terminateButton = firstRow.locator('button:has-text("Termina")');
    const terminateButtonVisible = await terminateButton.isVisible().catch(() => false);

    if (terminateButtonVisible) {
      await terminateButton.click();
    } else {
      const sidebarTerminateButton = page.locator('button:has-text("Termina")').first();
      await sidebarTerminateButton.click();
    }

    // Handle confirmation dialog
    page.on('dialog', dialog => {
      console.log('Confirmation dialog:', dialog.message());
      dialog.accept();
    });

    // Wait for API response
    const apiResponse = await apiResponsePromise;

    console.log('Terminate API Response:', apiResponse.status());

    // Verify success
    expect(apiResponse.status()).toBe(200);

    // Screenshot
    await page.screenshot({
      path: 'playwright-report/after-terminate-action.png',
      fullPage: true
    });
  });

  test('Verifica proxy Vite: /api/Lists/* → /EjLogHostVertimag/Lists/*', async ({ page }) => {
    console.log('\n=== TEST PROXY VITE ===\n');

    // Monitor all network requests
    const requests: any[] = [];

    page.on('request', request => {
      if (request.url().includes('/Lists/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType()
        });
      }
    });

    // Trigger a PUT request
    await page.waitForSelector('table.table tbody tr');
    const firstRow = page.locator('table.table tbody tr').first();
    await firstRow.click();

    const waitingButton = firstRow.locator('button:has-text("Attesa")');
    const waitingButtonVisible = await waitingButton.isVisible().catch(() => false);

    if (waitingButtonVisible) {
      await waitingButton.click();
      await page.waitForTimeout(2000);
    }

    console.log('\n=== CAPTURED REQUESTS ===');
    requests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
    });

    // Verify that requests go through proxy
    const putRequests = requests.filter(r => r.method === 'PUT');

    if (putRequests.length > 0) {
      const putRequest = putRequests[0];
      console.log('\nPUT Request URL:', putRequest.url);

      // URL should include backend context path
      expect(putRequest.url).toContain('/EjLogHostVertimag/Lists/');
    }
  });
});

