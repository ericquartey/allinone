// ============================================================================
// EJLOG WMS - API Integration Diagnostic Test
// Test per verificare integrazione frontend React con backend Java su porta 3077
// ============================================================================

import { test, expect } from '@playwright/test';

/**
 * Test diagnostico completo per API integration
 * Verifica se le chiamate API dal frontend React raggiungono correttamente
 * il backend Java su http://localhost:3077
 */

test.describe('API Integration Diagnostic', () => {
  const FRONTEND_URL = 'http://localhost:3001';
  const BACKEND_URL = 'http://localhost:3077';

  // Struttura per raccogliere diagnostica
  interface ApiRequest {
    url: string;
    method: string;
    status: number;
    headers: Record<string, string>;
    body?: any;
    error?: string;
  }

  let apiRequests: ApiRequest[] = [];
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset diagnostica
    apiRequests = [];
    consoleErrors = [];

    // Intercetta errori console
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Intercetta TUTTE le richieste API
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api') || url.includes('/EjLogHostVertimag')) {
        console.log(`[REQUEST] ${request.method()} ${url}`);
      }
    });

    // Intercetta TUTTE le risposte API
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api') || url.includes('/EjLogHostVertimag')) {
        const request = response.request();
        const headers: Record<string, string> = {};

        // Raccogli headers
        response.headers();
        Object.entries(response.headers()).forEach(([key, value]) => {
          headers[key] = value;
        });

        let body: any = null;
        try {
          const contentType = headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            body = await response.json();
          }
        } catch (e) {
          // Body non JSON o errore parsing
        }

        const apiRequest: ApiRequest = {
          url,
          method: request.method(),
          status: response.status(),
          headers,
          body,
        };

        apiRequests.push(apiRequest);

        console.log(`[RESPONSE] ${response.status()} ${url}`);
        if (response.status() >= 400) {
          console.error(`[ERROR] ${response.status()} ${url}`);
        }
      }
    });

    // Intercetta errori di rete
    page.on('requestfailed', (request) => {
      const url = request.url();
      if (url.includes('/api') || url.includes('/EjLogHostVertimag')) {
        const failure = request.failure();
        const error = `Network error: ${failure?.errorText || 'Unknown'}`;
        console.error(`[REQUEST FAILED] ${url} - ${error}`);
        apiRequests.push({
          url,
          method: request.method(),
          status: 0,
          headers: {},
          error,
        });
      }
    });
  });

  test('1. Verifica connessione backend diretta', async ({ request }) => {
    console.log('\n========================================');
    console.log('TEST 1: Verifica Backend Diretto');
    console.log('========================================\n');

    // Test diretto al backend senza frontend
    try {
      const response = await request.get(`${BACKEND_URL}/EjLogHostVertimag/Stock`, {
        params: {
          limit: 1,
          skip: 0,
        },
        timeout: 10000,
      });

      console.log(`Backend status: ${response.status()}`);
      console.log(`Backend OK: ${response.ok()}`);

      if (response.ok()) {
        const data = await response.json();
        console.log('Backend response keys:', Object.keys(data));
        console.log('Has data:', data.exported?.length > 0);
        console.log('✅ Backend raggiungibile e funzionante su porta 3077');
      } else {
        console.error('❌ Backend risponde ma con errore:', response.status());
      }
    } catch (error: any) {
      console.error('❌ Backend NON raggiungibile:', error.message);
      console.error('Verifica che il backend Java sia avviato su porta 3077');
    }
  });

  test('2. Verifica homepage caricamento', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 2: Homepage Load');
    console.log('========================================\n');

    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    console.log('Richieste API effettuate:', apiRequests.length);
    console.log('Errori console:', consoleErrors.length);

    if (apiRequests.length > 0) {
      console.log('\n--- API Requests ---');
      apiRequests.forEach((req) => {
        console.log(`${req.method} ${req.url} → ${req.status}`);
        if (req.error) {
          console.error(`  Error: ${req.error}`);
        }
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\n--- Console Errors ---');
      consoleErrors.forEach((err) => {
        console.error(err);
      });
    }
  });

  test('3. Verifica pagina Products/Stock', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 3: Products/Stock Page');
    console.log('========================================\n');

    await page.goto(`${FRONTEND_URL}/items`);

    // Aspetta che la pagina si carichi
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('\n--- API Calls Analysis ---');
    console.log(`Total API calls: ${apiRequests.length}`);

    // Filtra richieste Stock
    const stockRequests = apiRequests.filter((req) =>
      req.url.includes('Stock') || req.url.includes('items')
    );

    console.log(`Stock-related requests: ${stockRequests.length}`);

    if (stockRequests.length > 0) {
      console.log('\n--- Stock API Requests ---');
      stockRequests.forEach((req) => {
        console.log(`${req.method} ${req.url}`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Error: ${req.error || 'none'}`);

        if (req.body) {
          console.log(`  Response data count: ${req.body.exported?.length || req.body.data?.length || 0}`);
        }
      });
    } else {
      console.warn('⚠️  NESSUNA richiesta Stock intercettata!');
      console.log('URL attese:');
      console.log('  - /api/Stock');
      console.log('  - /api/EjLogHostVertimag/Stock');
      console.log('  - /api/items');
    }

    // Verifica CORS errors
    const corsErrors = consoleErrors.filter((err) =>
      err.toLowerCase().includes('cors') ||
      err.toLowerCase().includes('access-control-allow-origin')
    );

    if (corsErrors.length > 0) {
      console.error('\n❌ CORS ERRORS DETECTED:');
      corsErrors.forEach((err) => console.error(`  ${err}`));
    }

    // Verifica 404/500 errors
    const httpErrors = apiRequests.filter((req) => req.status >= 400);
    if (httpErrors.length > 0) {
      console.error('\n❌ HTTP ERRORS DETECTED:');
      httpErrors.forEach((req) => {
        console.error(`  ${req.status} ${req.method} ${req.url}`);
      });
    }

    // Screenshot per debug
    await page.screenshot({
      path: 'test-results/products-page.png',
      fullPage: true,
    });
    console.log('\nScreenshot salvato: test-results/products-page.png');
  });

  test('4. Verifica pagina Machines (Cassetto)', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 4: Machines Page');
    console.log('========================================\n');

    await page.goto(`${FRONTEND_URL}/machines`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log(`Total API calls: ${apiRequests.length}`);

    const machinesRequests = apiRequests.filter((req) =>
      req.url.includes('machine') ||
      req.url.includes('cassetto') ||
      req.url.includes('device')
    );

    console.log(`Machines-related requests: ${machinesRequests.length}`);

    if (machinesRequests.length > 0) {
      console.log('\n--- Machines API Requests ---');
      machinesRequests.forEach((req) => {
        console.log(`${req.method} ${req.url} → ${req.status}`);
      });
    }

    await page.screenshot({
      path: 'test-results/machines-page.png',
      fullPage: true,
    });
    console.log('\nScreenshot salvato: test-results/machines-page.png');
  });

  test('5. Verifica pagina Dashboard', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 5: Dashboard Page');
    console.log('========================================\n');

    await page.goto(`${FRONTEND_URL}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log(`Total API calls: ${apiRequests.length}`);

    if (apiRequests.length > 0) {
      console.log('\n--- Dashboard API Requests ---');
      apiRequests.forEach((req) => {
        console.log(`${req.method} ${req.url} → ${req.status}`);
      });
    }

    await page.screenshot({
      path: 'test-results/dashboard-page.png',
      fullPage: true,
    });
    console.log('\nScreenshot salvato: test-results/dashboard-page.png');
  });

  test('6. Test diretto proxy Vite', async ({ request }) => {
    console.log('\n========================================');
    console.log('TEST 6: Test Proxy Vite');
    console.log('========================================\n');

    // Test chiamata attraverso proxy Vite
    try {
      const response = await request.get(`${FRONTEND_URL}/api/Stock`, {
        params: {
          limit: 1,
          skip: 0,
        },
        timeout: 10000,
      });

      console.log(`Proxy status: ${response.status()}`);

      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Proxy funzionante');
        console.log('Response keys:', Object.keys(data));
      } else {
        console.error('❌ Proxy risponde ma con errore:', response.status());
      }
    } catch (error: any) {
      console.error('❌ Errore proxy:', error.message);
    }

    // Test chiamata con /api/EjLogHostVertimag/Stock
    try {
      const response = await request.get(`${FRONTEND_URL}/api/EjLogHostVertimag/Stock`, {
        params: {
          limit: 1,
          skip: 0,
        },
        timeout: 10000,
      });

      console.log(`Proxy EjLogHostVertimag status: ${response.status()}`);

      if (response.ok()) {
        console.log('✅ Proxy EjLogHostVertimag funzionante');
      } else {
        console.error('❌ Proxy EjLogHostVertimag errore:', response.status());
      }
    } catch (error: any) {
      console.error('❌ Errore proxy EjLogHostVertimag:', error.message);
    }
  });

  test('7. Diagnosi completa e report', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 7: DIAGNOSI COMPLETA');
    console.log('========================================\n');

    // Naviga a pagina prodotti
    await page.goto(`${FRONTEND_URL}/items`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    console.log('\n=== REPORT DIAGNOSTICO ===\n');

    // 1. Riassunto richieste API
    console.log('1. API REQUESTS SUMMARY:');
    console.log(`   Total requests: ${apiRequests.length}`);
    console.log(`   Successful (2xx): ${apiRequests.filter(r => r.status >= 200 && r.status < 300).length}`);
    console.log(`   Client errors (4xx): ${apiRequests.filter(r => r.status >= 400 && r.status < 500).length}`);
    console.log(`   Server errors (5xx): ${apiRequests.filter(r => r.status >= 500).length}`);
    console.log(`   Network errors: ${apiRequests.filter(r => r.status === 0).length}`);

    // 2. URL chiamate
    console.log('\n2. API ENDPOINTS CALLED:');
    const uniqueUrls = [...new Set(apiRequests.map(r => r.url))];
    uniqueUrls.forEach((url) => {
      const requests = apiRequests.filter(r => r.url === url);
      const statuses = requests.map(r => r.status).join(', ');
      console.log(`   ${url} → [${statuses}]`);
    });

    // 3. Errori CORS
    console.log('\n3. CORS ISSUES:');
    const corsErrors = consoleErrors.filter((err) =>
      err.toLowerCase().includes('cors') ||
      err.toLowerCase().includes('access-control')
    );
    if (corsErrors.length > 0) {
      console.error('   ❌ CORS errors detected:');
      corsErrors.forEach((err) => console.error(`      ${err}`));
    } else {
      console.log('   ✅ No CORS errors');
    }

    // 4. URL corretto
    console.log('\n4. URL VERIFICATION:');
    const backendCalls = apiRequests.filter(r => r.url.includes('localhost:3077'));
    const proxyCalls = apiRequests.filter(r => r.url.includes('localhost:3001') && r.url.includes('/api'));

    console.log(`   Direct backend calls (3077): ${backendCalls.length}`);
    console.log(`   Proxy calls (3001/api): ${proxyCalls.length}`);

    if (backendCalls.length === 0 && proxyCalls.length === 0) {
      console.warn('   ⚠️  PROBLEMA: Nessuna chiamata API intercettata!');
      console.warn('   Il frontend potrebbe non fare richieste o usare URL diversa');
    }

    // 5. Response Data
    console.log('\n5. RESPONSE DATA:');
    const dataResponses = apiRequests.filter(r => r.body && r.status === 200);
    if (dataResponses.length > 0) {
      console.log(`   ✅ ${dataResponses.length} successful data responses`);
      dataResponses.forEach((req) => {
        const itemsCount = req.body?.exported?.length || req.body?.data?.length || 0;
        console.log(`      ${req.url} → ${itemsCount} items`);
      });
    } else {
      console.error('   ❌ No successful data responses');
    }

    // 6. Console Errors
    console.log('\n6. BROWSER CONSOLE ERRORS:');
    if (consoleErrors.length > 0) {
      console.error(`   ❌ ${consoleErrors.length} console errors:`);
      consoleErrors.slice(0, 5).forEach((err) => {
        console.error(`      ${err.substring(0, 100)}...`);
      });
    } else {
      console.log('   ✅ No console errors');
    }

    // 7. Conclusione
    console.log('\n=== CONCLUSIONE ===\n');

    const hasApiCalls = apiRequests.length > 0;
    const hasSuccessfulCalls = apiRequests.some(r => r.status === 200);
    const hasCorsErrors = corsErrors.length > 0;
    const hasHttpErrors = apiRequests.some(r => r.status >= 400);

    if (!hasApiCalls) {
      console.error('❌ PROBLEMA: Frontend non fa chiamate API');
      console.log('   → Verifica src/services/*.ts');
      console.log('   → Controlla se le pagine chiamano le API services');
    } else if (hasCorsErrors) {
      console.error('❌ PROBLEMA: Errori CORS');
      console.log('   → Verifica configurazione proxy in vite.config.js');
      console.log('   → Controlla che backend accetti richieste da origin http://localhost:3001');
    } else if (hasHttpErrors) {
      console.error('❌ PROBLEMA: Errori HTTP (404/500)');
      console.log('   → Verifica che URL API siano corretti');
      console.log('   → Controlla log backend per errori lato server');
    } else if (hasSuccessfulCalls) {
      console.log('✅ API INTEGRATION FUNZIONANTE!');
      console.log('   Frontend e backend comunicano correttamente');
    } else {
      console.warn('⚠️  Stato incerto - analizza i log sopra');
    }

    console.log('\n========================================\n');
  });
});

