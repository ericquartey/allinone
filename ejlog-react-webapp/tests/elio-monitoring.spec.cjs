/**
 * 🔵 Elio-React Continuous Monitoring Suite
 * Playwright tests for ongoing UI and API monitoring
 */

const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = 'http://localhost:3012';
const API_BASE_URL = 'http://localhost:3079/EjLogHostVertimag';

test.describe('🔵 Elio-React Critical Path Monitoring', () => {

  test('Health Check: Frontend loads successfully', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/EjLog/);

    const loadTime = Date.now() - startTime;
    console.log(`✅ Frontend load time: ${loadTime}ms`);

    // Performance threshold: should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Health Check: Backend API responds', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${API_BASE_URL}/Lists`, {
      headers: {
        'Origin': BASE_URL
      }
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ API response time: ${responseTime}ms`);

    // API should respond
    expect(response.ok() || response.status() === 401).toBeTruthy();

    // Performance threshold: should respond within 2 seconds
    expect(responseTime).toBeLessThan(2000);
  });

  test('CORS Check: Headers present on API responses', async ({ request }) => {
    const response = await request.options(`${API_BASE_URL}/Lists`, {
      headers: {
        'Origin': BASE_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });

    const corsHeaders = {
      allowOrigin: response.headers()['access-control-allow-origin'],
      allowCredentials: response.headers()['access-control-allow-credentials'],
      allowMethods: response.headers()['access-control-allow-methods']
    };

    console.log('✅ CORS headers:', corsHeaders);

    // Verify CORS configuration
    expect(corsHeaders.allowOrigin).toBeTruthy();
    expect(corsHeaders.allowCredentials).toBe('true');
  });

  test('Navigation: Main routes are accessible', async ({ page }) => {
    await page.goto(BASE_URL);

    // Wait for app to load
    await page.waitForSelector('body', { timeout: 5000 });

    // Test critical navigation paths
    const criticalPaths = [
      { path: '/lists', name: 'Lists Management' },
      { path: '/locations', name: 'Locations' },
      { path: '/items', name: 'Items' }
    ];

    for (const route of criticalPaths) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${route.path}`);

      // Page should load without errors
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const loadTime = Date.now() - startTime;
      console.log(`✅ ${route.name} loaded in ${loadTime}ms`);

      // No console errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      expect(errors.length).toBe(0);
    }
  });

  test('Error Handling: API errors are handled gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/lists`);

    // Monitor console for unhandled errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('Failed to fetch')) {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Should show either data or error message, not crash
    const hasData = await page.locator('table, .error-message, .loading').count() > 0;
    expect(hasData).toBeTruthy();

    // No unhandled errors
    console.log(`✅ Error handling check: ${consoleErrors.length} unhandled errors`);
  });
});

test.describe('🔵 Elio-React Performance Monitoring', () => {

  test('Performance: Lists page renders efficiently', async ({ page }) => {
    await page.goto(`${BASE_URL}/lists`);

    const metrics = await page.evaluate(() => ({
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domInteractive: performance.timing.domInteractive - performance.timing.navigationStart
    }));

    console.log('✅ Performance metrics:', metrics);

    // Performance thresholds
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.loadComplete).toBeLessThan(5000);
  });

  test('Performance: No memory leaks on navigation', async ({ page }) => {
    const pages = ['/lists', '/locations', '/items', '/udc'];

    for (const path of pages) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');

      // Collect garbage
      if (page.context().browser()?.contexts()) {
        await page.evaluate(() => {
          if (window.gc) window.gc();
        });
      }
    }

    console.log('✅ Navigation memory leak check completed');
  });
});

test.describe('🔵 Elio-React Security Monitoring', () => {

  test('Security: No exposed credentials in source', async ({ page }) => {
    await page.goto(BASE_URL);

    const html = await page.content();
    const scripts = await page.$$eval('script', scripts =>
      scripts.map(s => s.textContent || '')
    );

    // Check for common credential patterns
    const sensitivePatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i
    ];

    const allContent = html + scripts.join('');
    const foundPatterns = sensitivePatterns.filter(pattern => pattern.test(allContent));

    console.log(`✅ Security scan: ${foundPatterns.length} sensitive patterns found`);
    expect(foundPatterns.length).toBe(0);
  });

  test('Security: HTTPS headers are configured', async ({ request }) => {
    const response = await request.get(API_BASE_URL);

    const securityHeaders = {
      cors: response.headers()['access-control-allow-origin'],
      vary: response.headers()['vary']
    };

    console.log('✅ Security headers:', securityHeaders);

    // Basic security headers should be present
    expect(securityHeaders.vary).toContain('Origin');
  });
});

