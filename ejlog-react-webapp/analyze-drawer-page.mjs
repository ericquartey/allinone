/**
 * ============================================================================
 * ANALISI PAGINA DRAWERS - Playwright Inspector
 * ============================================================================
 *
 * Questo script analizza la pagina /drawers per capire perché non mostra
 * i dati UDC reali dal backend.
 *
 * Analizza:
 * - Rotte disponibili (/drawers, /drawers/management, /drawer-management)
 * - Chiamate API effettuate
 * - Errori nella console
 * - Stato del caricamento dati
 * - Configurazione proxy Vite
 *
 * Usage:
 *   node analyze-drawer-page.mjs
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Configurazione
const FRONTEND_URL = 'http://localhost:3005';
const BACKEND_URL = 'http://localhost:3077';
const ROUTES_TO_TEST = [
  '/drawers',                    // Rotta non esistente (dovrebbe redirect)
  '/drawer-management',          // Rotta pubblica (DrawerManagementPublic)
  '/drawers/management',         // Rotta protetta (DrawerManagement)
];

// Report dettagliato
const report = {
  timestamp: new Date().toISOString(),
  frontend: FRONTEND_URL,
  backend: BACKEND_URL,
  routes: [],
  summary: {
    backendStatus: 'unknown',
    apiCalls: [],
    errors: [],
    recommendations: []
  }
};

async function checkBackend() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📡 VERIFICA BACKEND');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response = await fetch(`${BACKEND_URL}/EjLogHostVertimag/api/loading-units`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend ATTIVO su porta 3077');
      console.log(`   Endpoint: /EjLogHostVertimag/api/loading-units`);
      console.log(`   Status: ${response.status}`);
      console.log(`   UDC trovate: ${data.length || 0}`);
      report.summary.backendStatus = 'active';
      return true;
    } else {
      console.log(`⚠️  Backend risponde ma con errore ${response.status}`);
      report.summary.backendStatus = 'error';
      return false;
    }
  } catch (error) {
    console.log('❌ Backend NON RAGGIUNGIBILE su porta 3077');
    console.log(`   Errore: ${error.message}`);
    console.log('   IMPORTANTE: Il backend deve essere avviato prima di usare la pagina drawers');
    report.summary.backendStatus = 'offline';
    report.summary.recommendations.push('Avviare il backend Java su porta 3077');
    return false;
  }
}

async function analyzeRoute(page, route) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📄 ANALISI ROTTA: ${route}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const routeData = {
    path: route,
    exists: false,
    finalUrl: '',
    apiCalls: [],
    consoleErrors: [],
    consoleWarnings: [],
    consoleLogs: [],
    networkErrors: [],
    screenshot: '',
    loadingState: 'unknown',
    dataSource: 'unknown'
  };

  // Intercetta console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      routeData.consoleErrors.push(text);
      console.log(`   ❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      routeData.consoleWarnings.push(text);
      console.log(`   ⚠️  Console Warning: ${text}`);
    } else if (text.includes('[API]') || text.includes('[PROXY]')) {
      routeData.consoleLogs.push(text);
      console.log(`   📝 ${text}`);
    }
  });

  // Intercetta chiamate API
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/EjLogHostVertimag/')) {
      const apiCall = {
        method: request.method(),
        url: url,
        headers: request.headers()
      };
      routeData.apiCalls.push(apiCall);
      console.log(`   📤 API Request: ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/EjLogHostVertimag/')) {
      const status = response.status();
      const statusText = response.statusText();
      console.log(`   📥 API Response: ${status} ${statusText} - ${url}`);

      // Trova la chiamata corrispondente e aggiungi la risposta
      const call = routeData.apiCalls.find(c => c.url === url);
      if (call) {
        call.status = status;
        call.statusText = statusText;

        try {
          const contentType = response.headers()['content-type'];
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            call.responseData = data;
            console.log(`      Dati ricevuti: ${JSON.stringify(data).substring(0, 200)}...`);
          }
        } catch (e) {
          console.log(`      Impossibile parsare risposta JSON`);
        }
      }
    }
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/EjLogHostVertimag/')) {
      const error = request.failure().errorText;
      routeData.networkErrors.push({ url, error });
      console.log(`   ❌ Network Error: ${error} - ${url}`);
    }
  });

  try {
    // Naviga alla pagina
    console.log(`\n🌐 Navigazione a: ${FRONTEND_URL}${route}`);
    const response = await page.goto(`${FRONTEND_URL}${route}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    routeData.exists = true;
    routeData.finalUrl = page.url();

    console.log(`   Status HTTP: ${response.status()}`);
    console.log(`   URL Finale: ${routeData.finalUrl}`);

    // Aspetta un po' per permettere alle chiamate API di completarsi
    await page.waitForTimeout(3000);

    // Verifica se ci sono drawer caricati
    const drawerCount = await page.locator('[class*="drawer"]').count();
    const udcCount = await page.locator('text=/UDC|cassetto/i').count();

    console.log(`\n📊 ELEMENTI TROVATI NELLA PAGINA:`);
    console.log(`   Elementi drawer: ${drawerCount}`);
    console.log(`   Riferimenti a UDC/cassetto: ${udcCount}`);

    // Verifica messaggi di errore/caricamento
    const loadingIndicator = await page.locator('text=/caricamento|loading/i').count();
    const errorMessage = await page.locator('text=/errore|error/i').count();
    const emptyMessage = await page.locator('text=/nessun|vuoto|empty/i').count();

    console.log(`   Indicatori caricamento: ${loadingIndicator}`);
    console.log(`   Messaggi errore: ${errorMessage}`);
    console.log(`   Messaggi vuoto: ${emptyMessage}`);

    if (loadingIndicator > 0) {
      routeData.loadingState = 'loading';
    } else if (errorMessage > 0) {
      routeData.loadingState = 'error';
    } else if (emptyMessage > 0) {
      routeData.loadingState = 'empty';
    } else if (drawerCount > 0 || udcCount > 0) {
      routeData.loadingState = 'loaded';
    }

    // Analizza sorgente dati
    if (routeData.apiCalls.length > 0) {
      const hasBackendCalls = routeData.apiCalls.some(call =>
        call.url.includes(BACKEND_URL) ||
        call.url.includes('/EjLogHostVertimag/') ||
        call.url.includes('/api/loading-units')
      );

      const hasSuccessfulCalls = routeData.apiCalls.some(call =>
        call.status >= 200 && call.status < 300
      );

      if (hasBackendCalls && hasSuccessfulCalls) {
        routeData.dataSource = 'backend-real';
      } else if (hasBackendCalls) {
        routeData.dataSource = 'backend-error';
      } else {
        routeData.dataSource = 'unknown-api';
      }
    } else {
      routeData.dataSource = 'no-api-calls';
    }

    // Screenshot
    const screenshotPath = `drawer-analysis-${route.replace(/\//g, '-')}.png`;
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    routeData.screenshot = screenshotPath;
    console.log(`\n📸 Screenshot salvato: ${screenshotPath}`);

  } catch (error) {
    console.log(`   ❌ Errore durante navigazione: ${error.message}`);
    routeData.exists = false;
    routeData.error = error.message;
  }

  report.routes.push(routeData);
  return routeData;
}

async function generateReport() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 GENERAZIONE REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Raccogli tutte le chiamate API
  const allApiCalls = report.routes.flatMap(r => r.apiCalls);
  report.summary.apiCalls = allApiCalls;

  // Raccogli tutti gli errori
  const allErrors = report.routes.flatMap(r => [
    ...r.consoleErrors,
    ...r.networkErrors.map(e => e.error)
  ]);
  report.summary.errors = allErrors;

  // Genera raccomandazioni
  const recommendations = [];

  // Backend check
  if (report.summary.backendStatus === 'offline') {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Backend non attivo',
      solution: 'Avviare il backend Java su porta 3077',
      command: 'java -jar ejlog-backend.jar'
    });
  }

  // API calls check
  const hasBackendCalls = allApiCalls.some(call =>
    call.url.includes('/loading-units') ||
    call.url.includes('/compartments')
  );

  if (!hasBackendCalls) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Nessuna chiamata API a loading-units rilevata',
      solution: 'Verificare che il componente useDrawers() stia chiamando drawersApi.getAllLoadingUnits()',
      file: 'src/hooks/useDrawers.ts'
    });
  }

  // Error responses check
  const errorCalls = allApiCalls.filter(call => call.status >= 400);
  if (errorCalls.length > 0) {
    errorCalls.forEach(call => {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `API Error: ${call.status} ${call.method} ${call.url}`,
        solution: 'Verificare configurazione proxy Vite e endpoint backend',
        file: 'vite.config.js'
      });
    });
  }

  // Route check
  const nonExistingRoutes = report.routes.filter(r => !r.exists);
  if (nonExistingRoutes.length > 0) {
    recommendations.push({
      priority: 'LOW',
      issue: `Rotte non esistenti: ${nonExistingRoutes.map(r => r.path).join(', ')}`,
      solution: 'Usare le rotte corrette: /drawer-management (public) o /drawers/management (protected)',
      file: 'src/App.jsx'
    });
  }

  report.summary.recommendations = recommendations;

  // Salva report JSON
  const reportPath = 'drawer-analysis-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report JSON salvato: ${reportPath}`);

  // Stampa summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nBackend Status: ${report.summary.backendStatus}`);
  console.log(`Total API Calls: ${allApiCalls.length}`);
  console.log(`Total Errors: ${allErrors.length}`);
  console.log(`\nROUTE ANALYSIS:`);

  report.routes.forEach(route => {
    console.log(`\n  ${route.path}:`);
    console.log(`    - Exists: ${route.exists}`);
    console.log(`    - Final URL: ${route.finalUrl}`);
    console.log(`    - Loading State: ${route.loadingState}`);
    console.log(`    - Data Source: ${route.dataSource}`);
    console.log(`    - API Calls: ${route.apiCalls.length}`);
    console.log(`    - Errors: ${route.consoleErrors.length}`);
    console.log(`    - Screenshot: ${route.screenshot}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (recommendations.length === 0) {
    console.log('\n✅ Tutto sembra funzionare correttamente!');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Soluzione: ${rec.solution}`);
      if (rec.file) console.log(`   File: ${rec.file}`);
      if (rec.command) console.log(`   Comando: ${rec.command}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 ANALISI PAGINA DRAWERS - START');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Timestamp: ${report.timestamp}`);

  // Verifica backend
  await checkBackend();

  // Lancia browser
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Analizza ogni rotta
  for (const route of ROUTES_TO_TEST) {
    await analyzeRoute(page, route);
    await page.waitForTimeout(1000);
  }

  await browser.close();

  // Genera report finale
  await generateReport();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ANALISI COMPLETATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(error => {
  console.error('❌ Errore durante analisi:', error);
  process.exit(1);
});

