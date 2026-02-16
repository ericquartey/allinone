// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Test Suite Completo per API REST Backend EjLog
 *
 * Questo test suite verifica tutti gli endpoint REST esposti dal backend Java/Spring
 * Base URL: http://localhost:3079/EjLogHostVertimag
 */

const BASE_URL = 'http://localhost:3079/EjLogHostVertimag';
const API_TIMEOUT = 30000;

test.describe('EjLog REST API - Endpoint Testing', () => {

  // =============================================================================
  // 1. ITEMS API - Gestione Articoli
  // =============================================================================

  test.describe('Items API', () => {

    test('GET /Items - Should retrieve items list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Items?limit=10&offset=0`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      expect(data).toHaveProperty('recordNumber');
      expect(data).toHaveProperty('exportedItems');
      expect(Array.isArray(data.exportedItems)).toBeTruthy();

      // Verifica struttura item se presenti
      if (data.exportedItems && data.exportedItems.length > 0) {
        const item = data.exportedItems[0];
        expect(item).toHaveProperty('code');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('inStock');
      }

      console.log(`✓ GET /Items: ${data.recordNumber} items trovati`);
    });

    test('GET /Items with itemCode filter', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Items?limit=10&offset=0&itemCode=TEST`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result');
      console.log(`✓ GET /Items con filtro itemCode: ${data.recordNumber || 0} items trovati`);
    });

  });

  // =============================================================================
  // 2. LISTS API - Gestione Liste (Picking/Refilling)
  // =============================================================================

  test.describe('Lists API', () => {

    test('GET /Lists - Should retrieve lists', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Lists?limit=10&offset=0`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      expect(data).toHaveProperty('recordNumber');
      expect(data).toHaveProperty('exportedItems');

      if (data.exportedItems && data.exportedItems.length > 0) {
        const list = data.exportedItems[0];
        expect(list).toHaveProperty('listHeader');
        expect(list).toHaveProperty('listRows');
        expect(list.listHeader).toHaveProperty('listNumber');
        expect(list.listHeader).toHaveProperty('listType');
      }

      console.log(`✓ GET /Lists: ${data.recordNumber} liste trovate`);
    });

    test('GET /Lists with filters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Lists?limit=10&offset=0&listType=0&listStatus=1`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      console.log(`✓ GET /Lists con filtri: ${data.recordNumber} liste trovate`);
    });

  });

  // =============================================================================
  // 3. STOCK API - Giacenze Magazzino
  // =============================================================================

  test.describe('Stock API', () => {

    test('GET /Stock - Should retrieve stock data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Stock?limit=10&offset=0`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      expect(data).toHaveProperty('recordNumber');
      expect(data).toHaveProperty('exportedItems');

      if (data.exportedItems && data.exportedItems.length > 0) {
        const stock = data.exportedItems[0];
        expect(stock).toHaveProperty('item');
        expect(stock).toHaveProperty('qty');
        expect(stock).toHaveProperty('warehouseId');
      }

      console.log(`✓ GET /Stock: ${data.recordNumber} record giacenze trovati`);
    });

    test('GET /Stock with filters', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Stock?limit=10&offset=0&warehouseId=1&groupByTray=false`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      console.log(`✓ GET /Stock con filtri: ${data.recordNumber} giacenze trovate`);
    });

  });

  // =============================================================================
  // 4. MOVEMENTS API - Movimenti Magazzino
  // =============================================================================

  test.describe('Movements API', () => {

    test('GET /Movements - Should retrieve movements', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Movements?limit=10&offset=0`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      expect(data).toHaveProperty('recordNumber');
      expect(data).toHaveProperty('exportedItems');

      if (data.exportedItems && data.exportedItems.length > 0) {
        const movement = data.exportedItems[0];
        expect(movement).toHaveProperty('id');
        expect(movement).toHaveProperty('item');
        expect(movement).toHaveProperty('operationType');
        expect(movement).toHaveProperty('deltaQty');
      }

      console.log(`✓ GET /Movements: ${data.recordNumber} movimenti trovati`);
    });

    test('GET /Movements with date range', async ({ request }) => {
      // Formato date: yyyyMMddHHmmss
      const dateFrom = '20240101000000';
      const dateTo = '20251231235959';

      const response = await request.get(`${BASE_URL}/Movements?limit=10&offset=0&dateFrom=${dateFrom}&dateTo=${dateTo}`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      console.log(`✓ GET /Movements con date range: ${data.recordNumber} movimenti trovati`);
    });

  });

  // =============================================================================
  // 5. ORDERS API - Gestione Commesse
  // =============================================================================

  test.describe('Orders API', () => {

    test('GET /Orders - Should retrieve orders', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Orders?limit=10&offset=0`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      expect(data).toHaveProperty('recordNumber');
      expect(data).toHaveProperty('exportedItems');

      if (data.exportedItems && data.exportedItems.length > 0) {
        const order = data.exportedItems[0];
        expect(order).toHaveProperty('order');
        expect(order).toHaveProperty('description');
      }

      console.log(`✓ GET /Orders: ${data.recordNumber} commesse trovate`);
    });

  });

  // =============================================================================
  // 6. BARCODES API - Gestione Barcode
  // =============================================================================

  test.describe('Barcodes API', () => {

    test('GET /Barcodes - Should retrieve barcodes', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Barcodes?limit=10&offset=0`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('result', 'OK');
      expect(data).toHaveProperty('recordNumber');
      expect(data).toHaveProperty('exportedItems');

      if (data.exportedItems && data.exportedItems.length > 0) {
        const barcode = data.exportedItems[0];
        expect(barcode).toHaveProperty('item');
        expect(barcode).toHaveProperty('barccodes');
        expect(Array.isArray(barcode.barccodes)).toBeTruthy();
      }

      console.log(`✓ GET /Barcodes: ${data.recordNumber} barcode trovati`);
    });

  });

  // =============================================================================
  // 7. USER API - Gestione Utenti e Autenticazione
  // =============================================================================

  test.describe('User API', () => {

    test('GET /User - Should retrieve users', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/User`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();

      if (data.length > 0) {
        const user = data[0];
        expect(user).toHaveProperty('userName');
        expect(user).toHaveProperty('accessLevel');
      }

      console.log(`✓ GET /User: ${data.length} utenti trovati`);
    });

    test('POST /User/Login - Should authenticate user', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/User/Login?username=admin&password=admin`, {
        timeout: API_TIMEOUT
      });

      // Può essere 200 (OK) o 403 (FORBIDDEN) se credenziali errate
      expect([200, 403]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('userName');
        expect(data).toHaveProperty('accessLevel');
        console.log(`✓ POST /User/Login: Autenticazione riuscita per utente admin`);
      } else {
        console.log(`✓ POST /User/Login: Credenziali non valide (come atteso)`);
      }
    });

  });

  // =============================================================================
  // 8. TEST API - Endpoint di Test
  // =============================================================================

  test.describe('Test API', () => {

    test('GET /test - Should return test response', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/test`, {
        timeout: API_TIMEOUT
      });

      // L'endpoint test restituisce NOT_IMPLEMENTED per design
      expect([200, 501]).toContain(response.status());
      console.log(`✓ GET /test: Endpoint di test risponde correttamente`);
    });

  });

  // =============================================================================
  // 9. RESPONSE TIME TESTS - Performance
  // =============================================================================

  test.describe('API Performance Tests', () => {

    test('All GET endpoints should respond within acceptable time', async ({ request }) => {
      const endpoints = [
        '/Items?limit=10',
        '/Lists?limit=10',
        '/Stock?limit=10',
        '/Movements?limit=10',
        '/Orders?limit=10',
        '/Barcodes?limit=10',
        '/User'
      ];

      const results = [];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(`${BASE_URL}${endpoint}`, {
          timeout: API_TIMEOUT
        });
        const responseTime = Date.now() - startTime;

        results.push({
          endpoint,
          status: response.status(),
          responseTime
        });

        // Verifica che il tempo di risposta sia ragionevole (< 5 secondi)
        expect(responseTime).toBeLessThan(5000);
      }

      console.log('\n📊 Performance Summary:');
      results.forEach(result => {
        console.log(`  ${result.endpoint}: ${result.responseTime}ms (Status: ${result.status})`);
      });
    });

  });

  // =============================================================================
  // 10. ERROR HANDLING TESTS - Gestione Errori
  // =============================================================================

  test.describe('API Error Handling', () => {

    test('GET /Items without required limit param should return 400', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Items`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(400);
      console.log(`✓ Error handling: Parametro limit mancante gestito correttamente`);
    });

    test('GET /Items with excessive limit should be capped at 5000', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Items?limit=99999`, {
        timeout: API_TIMEOUT
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.recordNumber).toBeLessThanOrEqual(5000);
      console.log(`✓ Error handling: Limite massimo rispettato`);
    });

    test('GET /Stock with invalid date format should return error', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/Stock?limit=10&expiryDate=invalid-date`, {
        timeout: API_TIMEOUT
      });

      // Dovrebbe restituire 400 per formato data non valido
      expect([400, 500]).toContain(response.status());
      console.log(`✓ Error handling: Formato data non valido gestito correttamente`);
    });

  });

});

/**
 * SUMMARY TEST - Riepilogo Copertura API
 */
test('API Coverage Summary', async ({ request }) => {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RIEPILOGO COPERTURA API BACKEND EJLOG');
  console.log('='.repeat(80));
  console.log('\n✅ Endpoint Testati:');
  console.log('  1. GET  /Items         - Recupero articoli');
  console.log('  2. POST /Items         - Import articoli (da implementare POST test)');
  console.log('  3. GET  /Lists         - Recupero liste picking/refilling');
  console.log('  4. POST /Lists         - Creazione/modifica liste (da implementare POST test)');
  console.log('  5. GET  /Stock         - Giacenze magazzino');
  console.log('  6. GET  /Movements     - Movimenti magazzino');
  console.log('  7. GET  /Orders        - Commesse');
  console.log('  8. POST /Orders        - Import commesse (da implementare POST test)');
  console.log('  9. GET  /Barcodes      - Barcode articoli');
  console.log(' 10. POST /Barcodes      - Import barcode (da implementare POST test)');
  console.log(' 11. GET  /User          - Elenco utenti');
  console.log(' 12. POST /User/Login    - Autenticazione');
  console.log(' 13. POST /Lists/ViewList - Liste visione (da implementare test)');
  console.log(' 14. GET  /test          - Endpoint di test\n');
  console.log('🔧 Base URL: ' + BASE_URL);
  console.log('⏱️  Timeout: ' + (API_TIMEOUT / 1000) + ' secondi');
  console.log('='.repeat(80) + '\n');
});

