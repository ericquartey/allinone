// ============================================================================
// Multi-User Login Test Suite
// Testa il login con diversi utenti e verifica redirect + visualizzazione dati
// ============================================================================

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcola la password dinamica per superuser
 * Formula: promag + (31 - giorno_corrente)
 */
function getSuperuserPassword(): string {
  const today = new Date();
  const day = today.getDate();
  const dd = 31 - day;
  return `promag${dd}`;
}

/**
 * Esegue il login con username e password
 */
async function performLogin(page: Page, username: string, password: string) {
  await page.goto('http://localhost:3006/login');
  await page.waitForSelector('input[name="username"]', { timeout: 10000 });

  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);

  await page.click('button[type="submit"]');
}

/**
 * Verifica che il redirect a /dashboard sia avvenuto
 */
async function verifyDashboardRedirect(page: Page) {
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  expect(page.url()).toContain('/dashboard');
}

/**
 * Verifica i dati in localStorage
 */
async function verifyLocalStorage(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const user = await page.evaluate(() => localStorage.getItem('user'));

  expect(token).toBeTruthy();
  expect(user).toBeTruthy();

  return {
    token,
    user: JSON.parse(user!),
  };
}

/**
 * Verifica che l'header mostri i dati corretti
 */
async function verifyHeaderDisplay(
  page: Page,
  expectedUsername: string,
  expectedRoles: string[]
) {
  // Attendi che l'header sia visibile
  await page.waitForSelector('header', { timeout: 5000 });

  // Verifica username visualizzato
  const usernameElement = page.locator('header >> text=' + expectedUsername);
  await expect(usernameElement).toBeVisible();

  // Verifica ruolo visualizzato
  const hasAdminRole = expectedRoles.some(r =>
    r === 'ADMIN' || r === 'SUPERUSER' || r === 'ADMINS'
  );

  if (hasAdminRole) {
    // Verifica badge SUPER per admin/superuser
    const superBadge = page.locator('header >> text=SUPER');
    await expect(superBadge).toBeVisible();
  }
}

/**
 * Esegue logout
 */
async function performLogout(page: Page) {
  // Hover su avatar per aprire menu
  await page.hover('header button[class*="rounded-full"]');
  await page.waitForTimeout(500);

  // Click su Esci
  await page.click('text=Esci');

  // Verifica redirect a login
  await page.waitForURL('**/login', { timeout: 5000 });
}

// ============================================================================
// TEST DATA
// ============================================================================

interface TestUser {
  username: string;
  password: string;
  expectedRoles: string[];
  description: string;
  groupLevel: number;
}

const TEST_USERS: TestUser[] = [
  {
    username: 'superuser',
    password: getSuperuserPassword(),
    expectedRoles: ['SUPERUSER', 'ADMIN'],
    description: 'Superuser con password dinamica (groupLevel: 0)',
    groupLevel: 0,
  },
  {
    username: 'admin',
    password: 'promag',
    expectedRoles: ['ADMIN', 'ADMINS'],
    description: 'Administrator con privilegi elevati (groupLevel: 1)',
    groupLevel: 1,
  },
  {
    username: 'user',
    password: 'promag',
    expectedRoles: ['OPERATOR', 'USERS'],
    description: 'Operatore standard (groupLevel: 2)',
    groupLevel: 2,
  },
  {
    username: 'basicuser',
    password: 'promag',
    expectedRoles: ['GUEST'],
    description: 'Utente base con privilegi limitati (groupLevel: 1000)',
    groupLevel: 1000,
  },
];

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Multi-User Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Pulisci localStorage prima di ogni test (with error handling for security restrictions)
    await page.goto('http://localhost:3006/login');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch (e) {
        console.log('Storage clear skipped due to security restrictions');
      }
    });
  });

  for (const testUser of TEST_USERS) {
    test(`Login con ${testUser.username} - ${testUser.description}`, async ({ page }) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing: ${testUser.username}`);
      console.log(`Password: ${testUser.password}`);
      console.log(`Expected roles: ${testUser.expectedRoles.join(', ')}`);
      console.log(`${'='.repeat(60)}\n`);

      // 1. Esegui login
      await performLogin(page, testUser.username, testUser.password);

      // 2. Verifica redirect a /dashboard
      await verifyDashboardRedirect(page);

      // 3. Verifica localStorage
      const { token, user } = await verifyLocalStorage(page);

      console.log('Token salvato:', token?.substring(0, 30) + '...');
      console.log('User data:', JSON.stringify(user, null, 2));

      // Verifica struttura user
      expect(user.userName).toBe(testUser.username);
      expect(user.username).toBe(testUser.username);
      expect(user.roles).toBeDefined();
      expect(Array.isArray(user.roles)).toBeTruthy();

      // Verifica che almeno uno dei ruoli attesi sia presente
      const hasExpectedRole = testUser.expectedRoles.some(role =>
        user.roles.includes(role)
      );
      expect(hasExpectedRole).toBeTruthy();

      // 4. Verifica visualizzazione in header
      await verifyHeaderDisplay(page, testUser.username, user.roles);

      // 5. Screenshot per verifica visiva
      await page.screenshot({
        path: `test-results/login-${testUser.username}.png`,
        fullPage: true,
      });

      // 6. Logout
      await performLogout(page);

      console.log(`✅ Test completato per ${testUser.username}\n`);
    });
  }

  test('Login fallito con credenziali errate', async ({ page }) => {
    await performLogin(page, 'invalid-user', 'wrong-password');

    // Verifica che NON ci sia redirect
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');

    // Verifica messaggio di errore
    const errorMessage = page.locator('.bg-red-50');
    await expect(errorMessage).toBeVisible();
  });

  test('Persistenza sessione dopo refresh', async ({ page }) => {
    // Login come admin
    await performLogin(page, 'admin', 'promag');
    await verifyDashboardRedirect(page);

    // Refresh pagina
    await page.reload();

    // Verifica che sia ancora loggato
    await page.waitForURL('**/dashboard', { timeout: 5000 });

    const { user } = await verifyLocalStorage(page);
    expect(user.userName).toBe('admin');

    // Verifica header ancora visibile
    await verifyHeaderDisplay(page, 'admin', ['ADMIN']);
  });

  test('Verifica superuser password dinamica', async ({ page }) => {
    const today = new Date();
    const day = today.getDate();
    const expectedSuffix = 31 - day;
    const expectedPassword = `promag${expectedSuffix}`;

    console.log(`\nTest Superuser Password Dinamica:`);
    console.log(`Data odierna: ${today.toLocaleDateString()}`);
    console.log(`Giorno: ${day}`);
    console.log(`Suffisso atteso: ${expectedSuffix}`);
    console.log(`Password attesa: ${expectedPassword}\n`);

    expect(getSuperuserPassword()).toBe(expectedPassword);

    // Verifica che la password funzioni
    await performLogin(page, 'superuser', expectedPassword);
    await verifyDashboardRedirect(page);
  });
});

// ============================================================================
// SUMMARY TEST - Testa tutti gli utenti in sequenza
// ============================================================================

test.describe('Login Multi-Utente Sequenziale', () => {
  test('Testa login/logout per tutti gli utenti in sequenza', async ({ page }) => {
    const results: Array<{ username: string; success: boolean; error?: string }> = [];

    for (const testUser of TEST_USERS) {
      try {
        console.log(`\n▶ Testing ${testUser.username}...`);

        // Vai a login page
        await page.goto('http://localhost:3006/login');
        await page.evaluate(() => {
          try {
            localStorage.clear();
          } catch (e) {
            console.log('Storage clear skipped due to security restrictions');
          }
        });

        // Login
        await performLogin(page, testUser.username, testUser.password);

        // Verifica redirect
        await verifyDashboardRedirect(page);

        // Verifica localStorage
        const { user } = await verifyLocalStorage(page);
        expect(user.userName).toBe(testUser.username);

        // Logout
        await performLogout(page);

        results.push({ username: testUser.username, success: true });
        console.log(`✅ ${testUser.username} - SUCCESS`);
      } catch (error) {
        results.push({
          username: testUser.username,
          success: false,
          error: String(error),
        });
        console.log(`❌ ${testUser.username} - FAILED: ${error}`);
      }
    }

    // Stampa summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Total tests: ${results.length}`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('');

    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.username}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('='.repeat(60) + '\n');

    // Verifica che tutti i test siano passati
    expect(failCount).toBe(0);
  });
});
