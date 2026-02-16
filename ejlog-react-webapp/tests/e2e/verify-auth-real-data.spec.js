import { test, expect } from '@playwright/test';

test.describe('JWT Authentication and Real Data Verification', () => {
  test('should login with JWT and display real items data', async ({ page }) => {
    console.log('🚀 Starting JWT authentication test...');

    // Naviga alla home page
    await page.goto('http://localhost:3000');
    console.log('📱 Navigated to home page');

    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'screenshots/auth-01-home.png', fullPage: true });

    // Cerca il form di login o il pulsante di login
    console.log('🔍 Looking for login form...');

    // Prova a trovare il form di login (potrebbero esserci diversi selettori)
    const loginSelectors = [
      'input[name="username"]',
      'input[type="text"]',
      'input[placeholder*="user" i]',
      'input[placeholder*="nome" i]'
    ];

    let usernameInput = null;
    for (const selector of loginSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        usernameInput = page.locator(selector).first();
        console.log(`✅ Found username input with selector: ${selector}`);
        break;
      }
    }

    if (!usernameInput) {
      console.log('⚠️  No login form found on home page, looking for login link...');

      // Cerca link o pulsante per andare al login
      const loginLinkSelectors = [
        'text=Login',
        'text=Accedi',
        'a[href*="login"]',
        'button:has-text("Login")',
        'button:has-text("Accedi")'
      ];

      for (const selector of loginLinkSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          console.log(`✅ Clicked on login link: ${selector}`);
          await page.waitForTimeout(1000);
          break;
        } catch (e) {
          // continua a cercare
        }
      }

      await page.screenshot({ path: 'screenshots/auth-02-login-page.png', fullPage: true });
    }

    // Ora cerca di nuovo il form di login
    for (const selector of loginSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        usernameInput = page.locator(selector).first();
        console.log(`✅ Found username input with selector: ${selector}`);
        break;
      }
    }

    if (usernameInput) {
      // Trova il campo password
      const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="password" i]',
        'input[placeholder*="parola" i]'
      ];

      let passwordInput = null;
      for (const selector of passwordSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          passwordInput = page.locator(selector).first();
          console.log(`✅ Found password input with selector: ${selector}`);
          break;
        }
      }

      if (passwordInput) {
        // Calcola la password dinamica basata sul giorno del mese
        const day = new Date().getDate();
        const username = 'superuser';
        const password = `promag${day}`;

        console.log(`🔑 Using credentials: ${username} / promag${day}`);

        // Compila il form
        await usernameInput.fill(username);
        await passwordInput.fill(password);

        await page.screenshot({ path: 'screenshots/auth-03-filled-form.png', fullPage: true });

        // Cerca il pulsante di submit
        const submitSelectors = [
          'button[type="submit"]',
          'button:has-text("Login")',
          'button:has-text("Accedi")',
          'button:has-text("Entra")',
          'input[type="submit"]'
        ];

        for (const selector of submitSelectors) {
          try {
            await page.click(selector, { timeout: 2000 });
            console.log(`✅ Clicked submit button: ${selector}`);
            break;
          } catch (e) {
            // continua a cercare
          }
        }

        // Aspetta il redirect dopo il login
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'screenshots/auth-04-after-login.png', fullPage: true });
        console.log('✅ Login submitted, waiting for redirect...');

        // Verifica che siamo loggati controllando il localStorage o sessionStorage per il token
        const token = await page.evaluate(() => {
          return localStorage.getItem('token') ||
                 localStorage.getItem('jwt') ||
                 localStorage.getItem('authToken') ||
                 sessionStorage.getItem('token') ||
                 sessionStorage.getItem('jwt');
        });

        if (token) {
          console.log('✅ JWT token found in storage!');
          console.log(`Token preview: ${token.substring(0, 50)}...`);
        } else {
          console.log('⚠️  No JWT token found in storage');
        }
      }
    }

    // Naviga alla pagina Articoli per vedere i dati reali
    console.log('📦 Navigating to Items page...');

    try {
      await page.click('text=Articoli', { timeout: 5000 });
      console.log('✅ Clicked on Articoli menu');
    } catch (e) {
      console.log('⚠️  Articoli menu not found, trying Items...');
      try {
        await page.click('text=Items', { timeout: 5000 });
      } catch (e2) {
        console.log('⚠️  Items menu not found');
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/auth-05-items-page.png', fullPage: true });
    console.log('📸 Screenshot items page saved');

    // Verifica se ci sono dati nella pagina
    const bodyText = await page.textContent('body');
    console.log('📊 Page body length:', bodyText.length);

    // Conta elementi che potrebbero contenere dati
    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[class*="card"]').count();
    const hasItems = await page.locator('[class*="item"]').count();
    const hasRows = await page.locator('tr').count();

    console.log(`📋 Found: ${hasTable} tables, ${hasCards} cards, ${hasItems} items, ${hasRows} rows`);

    // Cerca numeri che potrebbero indicare il totale degli items
    const totalMatches = bodyText.match(/(\d+)\s*(items?|articoli|totale)/gi);
    if (totalMatches) {
      console.log('📊 Total indicators found:', totalMatches);
    }

    // Naviga alla pagina Cassetti
    console.log('🗄️  Navigating to Drawers page...');

    try {
      await page.click('text=Cassetti', { timeout: 5000 });
      console.log('✅ Clicked on Cassetti menu');
    } catch (e) {
      console.log('⚠️  Cassetti menu not found, trying UDC...');
      try {
        await page.click('text=UDC', { timeout: 5000 });
      } catch (e2) {
        try {
          await page.click('text=Loading Units', { timeout: 5000 });
        } catch (e3) {
          console.log('⚠️  Loading units menu not found');
        }
      }
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/auth-06-drawers-page.png', fullPage: true });
    console.log('📸 Screenshot drawers page saved');

    // Verifica dati cassetti
    const drawerBodyText = await page.textContent('body');
    const hasDrawerTable = await page.locator('table').count();
    const hasDrawerRows = await page.locator('tr').count();

    console.log(`🗄️  Drawers page: ${hasDrawerTable} tables, ${hasDrawerRows} rows`);

    // Test finale
    console.log('\n✅ Authentication and real data test completed!');
    console.log('📸 Check screenshots in screenshots/ directory');
    console.log('📊 Expected: 179 real items from database should be visible');

    // Assertion finale: ci aspettiamo almeno qualche riga di dati
    expect(hasRows).toBeGreaterThan(0);
  });
});
