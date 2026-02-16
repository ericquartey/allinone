# EjLog WMS - E2E Testing with Playwright

Comprehensive end-to-end testing suite for EjLog React WebApp using Playwright.

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Debug mode with Playwright Inspector
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

## Overview

This test suite provides comprehensive E2E coverage for the EjLog WMS application following industry best practices:

- Page Object Model (POM) pattern for maintainability
- Reusable fixtures for authentication and common operations
- Helper functions for common test operations
- CI/CD ready configuration with HTML reports
- Cross-browser testing support (Chromium, Firefox, WebKit)

### Test Coverage

1. **Login Flow** (`01-login.spec.ts`) - Authentication and authorization
2. **Dashboard** (`02-dashboard.spec.ts`) - Main dashboard navigation
3. **Lists CRUD** (`03-lists-crud.spec.ts`) - List management operations
4. **Items Search** (`04-items-search.spec.ts`) - Item search and filtering
5. **Stock Management** (`05-stock-query.spec.ts`) - Stock queries and inventory

## Project Structure

```
tests/
├── e2e/                          # E2E test specs
│   ├── 01-login.spec.ts         # Login flow tests
│   ├── 02-dashboard.spec.ts     # Dashboard tests
│   ├── 03-lists-crud.spec.ts    # Lists CRUD tests
│   ├── 04-items-search.spec.ts  # Items search tests
│   └── 05-stock-query.spec.ts   # Stock management tests
│
├── pages/                        # Page Object Models
│   ├── BasePage.ts              # Base page class
│   ├── LoginPage.ts             # Login page POM
│   ├── DashboardPage.ts         # Dashboard page POM
│   ├── ListsPage.ts             # Lists page POM
│   ├── ItemsPage.ts             # Items page POM
│   ├── StockPage.ts             # Stock page POM
│   └── index.ts                 # POM exports
│
├── fixtures/                     # Test fixtures
│   └── authFixtures.ts          # Authentication fixtures
│
├── helpers/                      # Helper functions
│   └── testHelpers.ts           # Common test utilities
│
└── README.md                     # This file
```

## Prerequisites

- **Node.js** 18+ installed
- **Playwright browsers** installed (automatically prompted on first run)

**Note**: No separate backend server needed! The Vite dev server (`http://localhost:3004`) automatically handles the backend proxy to port 3077. Playwright will auto-start the dev server when running tests.

## Running Tests

### All Tests
```bash
npm run test:e2e                # Headless mode
npm run test:e2e:headed         # Visible browser
npm run test:e2e:ui             # Interactive UI mode
npm run test:e2e:debug          # Debug with Inspector
```

### Specific Tests
```bash
npx playwright test tests/e2e/01-login.spec.ts
npx playwright test tests/e2e/02-dashboard.spec.ts
npx playwright test --grep "should display"
```

### Browser-Specific
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Reports
```bash
npm run test:e2e:report
```

## Writing Tests

### Basic Test
```typescript
import { test, expect } from '../fixtures/authFixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage, dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyPageLoaded();
    await expect(dashboardPage.pageTitle).toBeVisible();
  });
});
```

### Using Page Objects
```typescript
import { test, expect } from '../fixtures/authFixtures';
import { LoginPage } from '../pages';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('username', 'password');
  await loginPage.verifyLoginSuccessful();
});
```

### Using Authenticated Context
```typescript
test('protected route', async ({ authenticatedPage, listsPage }) => {
  // Already logged in (dev mode bypass)
  await listsPage.goto();
  await listsPage.verifyPageLoaded();
});
```

## Page Object Model

### Creating a New Page Object

1. Create file in `tests/pages/`:
```typescript
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly pageTitle: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page, '/my-page');
    this.pageTitle = page.locator('h1');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
    await this.waitForNetworkIdle();
  }
}
```

2. Export from `tests/pages/index.ts`:
```typescript
export { MyPage } from './MyPage';
```

## Test Fixtures

Built-in fixtures:
- `loginPage` - LoginPage instance
- `dashboardPage` - DashboardPage instance
- `listsPage` - ListsPage instance
- `itemsPage` - ItemsPage instance
- `stockPage` - StockPage instance
- `authenticatedPage` - Pre-authenticated page context

## CI/CD Integration

### GitHub Actions
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Backend Not Running
```bash
# Error: Connection refused on localhost:3077
# Solution: Start backend
node server/proxy-api.js
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3004
taskkill /PID <PID> /F
```

### Browser Not Installed
```bash
npx playwright install
```

### Test Timeout
- Increase timeout: `test.setTimeout(60000)`
- Check backend is responding
- Check network latency

### Element Not Found
- Verify selector is correct
- Add explicit wait: `await element.waitFor({ state: 'visible' })`
- Scroll into view: `await element.scrollIntoViewIfNeeded()`

## Debug Tips

### Headed Mode
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Screenshots
```typescript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### Trace
```typescript
await page.context().tracing.start({ screenshots: true, snapshots: true });
// ... test actions ...
await page.context().tracing.stop({ path: 'trace.zip' });
```

View trace:
```bash
npx playwright show-trace trace.zip
```

### Console Logging
```typescript
page.on('console', msg => console.log(msg.text()));
```

## Best Practices

1. Use Page Objects - Encapsulate page logic in POM classes
2. Wait for Elements - Always wait before interacting
3. Avoid Hard Sleeps - Use `waitFor*` methods instead of `waitForTimeout`
4. Clean Test Data - Clean up after tests
5. Independent Tests - Each test should be independent
6. Descriptive Names - Use clear, descriptive test names
7. Test One Thing - Each test verifies one behavior
8. Use Fixtures - Leverage fixtures for setup/teardown
9. Handle Errors - Add proper error handling
10. Regular Maintenance - Keep selectors updated with UI changes

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Last Updated**: 2025-12-04
**Playwright Version**: 1.56.1
**Node Version**: 18+

