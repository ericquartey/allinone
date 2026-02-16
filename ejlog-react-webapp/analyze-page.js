const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Avvio analisi pagina con Playwright...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Raccogli tutti gli errori
  const errors = [];
  const warnings = [];
  const networkErrors = [];

  // Console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push({ type: 'Console Error', message: text });
      console.log('❌ Console Error:', text);
    } else if (type === 'warning') {
      warnings.push({ type: 'Console Warning', message: text });
      console.log('⚠️  Console Warning:', text);
    } else if (type === 'log') {
      console.log('📝 Console Log:', text);
    }
  });

  // Page errors
  page.on('pageerror', error => {
    errors.push({ type: 'Page Error', message: error.message, stack: error.stack });
    console.log('❌ Page Error:', error.message);
  });

  // Network errors
  page.on('response', response => {
    if (!response.ok()) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`❌ Network Error: ${response.status()} ${response.statusText()} - ${response.url()}`);
    }
  });

  // Request failures
  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      error: request.failure().errorText
    });
    console.log(`❌ Request Failed: ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('📍 Navigando a http://localhost:3001...\n');

    // Naviga alla pagina
    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Pagina caricata!\n');

    // Aspetta qualche secondo per vedere se ci sono errori runtime
    await page.waitForTimeout(3000);

    // Cattura screenshot
    await page.screenshot({
      path: 'screenshot-homepage.png',
      fullPage: true
    });
    console.log('📸 Screenshot salvato: screenshot-homepage.png\n');

    // Estrai informazioni dalla pagina
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasReact: !!window.React || !!document.querySelector('[data-reactroot]') || !!document.querySelector('#root'),
        bodyText: document.body.innerText.substring(0, 500),
        scripts: Array.from(document.scripts).map(s => s.src).filter(s => s),
        stylesheets: Array.from(document.styleSheets).map(s => s.href).filter(s => s)
      };
    });

    console.log('📄 Informazioni Pagina:');
    console.log('   Titolo:', pageInfo.title);
    console.log('   URL:', pageInfo.url);
    console.log('   React Detected:', pageInfo.hasReact ? '✅' : '❌');
    console.log('   Scripts:', pageInfo.scripts.length);
    console.log('   Stylesheets:', pageInfo.stylesheets.length);
    console.log('\n📝 Contenuto (prime 500 char):');
    console.log(pageInfo.bodyText);
    console.log('\n');

    // Verifica root React
    const rootElement = await page.$('#root');
    if (rootElement) {
      console.log('✅ Elemento #root trovato');
      const innerHTML = await rootElement.innerHTML();
      console.log('   Lunghezza HTML:', innerHTML.length, 'caratteri');
      if (innerHTML.length < 100) {
        console.log('⚠️  WARNING: #root sembra vuoto o quasi vuoto!');
        console.log('   HTML:', innerHTML.substring(0, 200));
      }
    } else {
      console.log('❌ Elemento #root NON trovato!');
    }

    // Aspetta altri 3 secondi per catturare eventuali errori asincroni
    await page.waitForTimeout(3000);

  } catch (error) {
    errors.push({ type: 'Navigation Error', message: error.message, stack: error.stack });
    console.log('❌ Errore durante navigazione:', error.message);
  }

  // Report finale
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORT FINALE ANALISI');
  console.log('='.repeat(80) + '\n');

  console.log(`❌ Errori Totali: ${errors.length}`);
  if (errors.length > 0) {
    console.log('\n--- DETTAGLIO ERRORI ---');
    errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.type}:`);
      console.log(`   ${err.message}`);
      if (err.stack) {
        console.log(`   Stack: ${err.stack.substring(0, 300)}...`);
      }
    });
  }

  console.log(`\n⚠️  Warning Totali: ${warnings.length}`);
  if (warnings.length > 0) {
    console.log('\n--- DETTAGLIO WARNING ---');
    warnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn.message}`);
    });
  }

  console.log(`\n🌐 Network Errors: ${networkErrors.length}`);
  if (networkErrors.length > 0) {
    console.log('\n--- DETTAGLIO NETWORK ERRORS ---');
    networkErrors.forEach((netErr, i) => {
      console.log(`${i + 1}. ${netErr.url}`);
      console.log(`   Status: ${netErr.status || 'Failed'} - ${netErr.statusText || netErr.error}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  if (errors.length === 0 && networkErrors.length === 0) {
    console.log('✅ NESSUN ERRORE RILEVATO - Applicazione funzionante correttamente!');
  } else {
    console.log('⚠️  ERRORI RILEVATI - Vedere dettagli sopra');
  }

  console.log('='.repeat(80) + '\n');

  // Mantieni browser aperto per 10 secondi per ispezione manuale
  console.log('🔍 Browser rimarrà aperto per 10 secondi per ispezione manuale...');
  await page.waitForTimeout(10000);

  await browser.close();

  console.log('\n✅ Analisi completata!');

  // Exit con codice errore se ci sono problemi critici
  process.exit(errors.length > 0 ? 1 : 0);
})();
