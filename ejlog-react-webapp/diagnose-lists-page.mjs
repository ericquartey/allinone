import { chromium } from '@playwright/test';
import fs from 'fs';

const FRONTEND_URL = 'http://localhost:3006';

async function diagnoseLists() {
  console.log('🔍 Diagnostica pagina Lists - Avvio...\n');

  const errors = {
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
    uncaughtExceptions: [],
    pageErrors: [],
    compilationErrors: []
  };

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Intercetta errori console
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    if (type === 'error') {
      console.log('❌ Console Error:', text);
      errors.consoleErrors.push({
        text,
        location,
        timestamp: new Date().toISOString()
      });
    } else if (type === 'warning') {
      console.log('⚠️  Console Warning:', text);
      errors.consoleWarnings.push({
        text,
        location,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Intercetta errori di rete
  page.on('response', response => {
    const status = response.status();
    const url = response.url();

    if (status >= 400) {
      console.log(`❌ Network Error: ${status} - ${url}`);
      errors.networkErrors.push({
        status,
        url,
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Intercetta eccezioni non gestite
  page.on('pageerror', error => {
    console.log('❌ Uncaught Exception:', error.message);
    errors.uncaughtExceptions.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Intercetta richieste fallite
  page.on('requestfailed', request => {
    console.log('❌ Request Failed:', request.url(), request.failure()?.errorText);
    errors.networkErrors.push({
      url: request.url(),
      failure: request.failure()?.errorText,
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log(`📄 Navigazione a: ${FRONTEND_URL}/lists\n`);

    // Navigazione alla pagina
    const response = await page.goto(`${FRONTEND_URL}/lists`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ Risposta HTTP: ${response.status()}\n`);

    // Attendi un po' per catturare eventuali errori asincroni
    await page.waitForTimeout(3000);

    // Screenshot della pagina
    await page.screenshot({
      path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-diagnosis-screenshot.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: lists-diagnosis-screenshot.png\n');

    // Controlla se ci sono errori React visibili
    const reactErrorBoundary = await page.locator('[data-error-boundary], .error-boundary, [role="alert"]').count();
    if (reactErrorBoundary > 0) {
      const errorText = await page.locator('[data-error-boundary], .error-boundary, [role="alert"]').first().textContent();
      errors.pageErrors.push({
        type: 'React Error Boundary',
        message: errorText,
        timestamp: new Date().toISOString()
      });
      console.log('❌ React Error Boundary trovato:', errorText);
    }

    // Controlla la presenza di elementi chiave
    console.log('🔍 Verifica elementi UI...\n');

    const checks = {
      header: await page.locator('h1, h2').count() > 0,
      table: await page.locator('table').count() > 0,
      buttons: await page.locator('button').count() > 0,
      loadingState: await page.locator('[data-loading], .loading').count() > 0
    };

    console.log('UI Elements:');
    console.log('  - Header:', checks.header ? '✅' : '❌');
    console.log('  - Table:', checks.table ? '✅' : '❌');
    console.log('  - Buttons:', checks.buttons ? '✅' : '❌');
    console.log('  - Loading:', checks.loadingState ? '⏳' : '✅');
    console.log('');

    // Estrai HTML della pagina per analisi
    const bodyHTML = await page.content();
    fs.writeFileSync(
      'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-diagnosis-html.txt',
      bodyHTML
    );
    console.log('📝 HTML salvato: lists-diagnosis-html.txt\n');

    // Conta pulsanti "Attesa" e "Termina"
    const waitingButtons = await page.locator('button:has-text("Attesa")').count();
    const completeButtons = await page.locator('button:has-text("Termina")').count();

    console.log(`🔘 Pulsanti trovati:`);
    console.log(`  - "Attesa": ${waitingButtons}`);
    console.log(`  - "Termina": ${completeButtons}\n`);

  } catch (error) {
    console.log('❌ Errore durante la navigazione:', error.message);
    errors.pageErrors.push({
      type: 'Navigation Error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Screenshot anche in caso di errore
    try {
      await page.screenshot({
        path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-error-screenshot.png',
        fullPage: true
      });
      console.log('📸 Screenshot errore salvato: lists-error-screenshot.png\n');
    } catch (screenshotError) {
      console.log('⚠️  Impossibile salvare screenshot:', screenshotError.message);
    }
  }

  // Salva report JSON
  const report = {
    timestamp: new Date().toISOString(),
    url: `${FRONTEND_URL}/lists`,
    errors,
    summary: {
      totalConsoleErrors: errors.consoleErrors.length,
      totalWarnings: errors.consoleWarnings.length,
      totalNetworkErrors: errors.networkErrors.length,
      totalUncaughtExceptions: errors.uncaughtExceptions.length,
      totalPageErrors: errors.pageErrors.length
    }
  };

  fs.writeFileSync(
    'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\lists-diagnosis-report.json',
    JSON.stringify(report, null, 2)
  );

  console.log('\n📊 RIEPILOGO ERRORI:');
  console.log('='.repeat(50));
  console.log(`Console Errors: ${report.summary.totalConsoleErrors}`);
  console.log(`Warnings: ${report.summary.totalWarnings}`);
  console.log(`Network Errors: ${report.summary.totalNetworkErrors}`);
  console.log(`Uncaught Exceptions: ${report.summary.totalUncaughtExceptions}`);
  console.log(`Page Errors: ${report.summary.totalPageErrors}`);
  console.log('='.repeat(50));

  if (report.summary.totalConsoleErrors > 0) {
    console.log('\n❌ CONSOLE ERRORS DETTAGLIATI:');
    errors.consoleErrors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.text}`);
      if (err.location) {
        console.log(`   File: ${err.location.url}`);
        console.log(`   Linea: ${err.location.lineNumber}:${err.location.columnNumber}`);
      }
    });
  }

  if (report.summary.totalUncaughtExceptions > 0) {
    console.log('\n❌ UNCAUGHT EXCEPTIONS:');
    errors.uncaughtExceptions.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.message}`);
      if (err.stack) {
        console.log(`   Stack: ${err.stack.split('\n').slice(0, 3).join('\n   ')}`);
      }
    });
  }

  if (report.summary.totalNetworkErrors > 0) {
    console.log('\n❌ NETWORK ERRORS:');
    errors.networkErrors.forEach((err, idx) => {
      console.log(`\n${idx + 1}. ${err.status || 'Failed'} - ${err.url}`);
      if (err.failure) {
        console.log(`   Reason: ${err.failure}`);
      }
    });
  }

  console.log('\n✅ Report salvato: lists-diagnosis-report.json\n');

  await browser.close();

  return report;
}

diagnoseLists().catch(console.error);
