const { test, expect } = require('@playwright/test');

test('Check all pages including Hub pages', async ({ page }) => {
  test.setTimeout(120000); // Set 2 minute timeout for this test

  const pagesToTest = [
    // Main pages
    { name: 'Dashboard', href: '/' },
    { name: 'Articoli', href: '/items' },
    { name: 'Liste', href: '/lists' },
    { name: 'Giacenze', href: '/stock' },

    // Hub Pages
    { name: 'Operations Hub', href: '/operations-hub' },
    { name: 'Inventory Hub', href: '/inventory-hub' },
    { name: 'Planning Hub', href: '/planning-hub' },
    { name: 'Analytics Hub', href: '/analytics-hub' },

    // Master Data
    { name: 'Products', href: '/products' },
    { name: 'Locations', href: '/locations' },
    { name: 'UDC', href: '/udc' },
    { name: 'Workstations', href: '/workstations' },
    { name: 'Suppliers', href: '/suppliers' },
    { name: 'Customers', href: '/customers' },
    { name: 'Users', href: '/users' },

    // Individual operation pages (should still work)
    { name: 'Receiving', href: '/receiving' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'Put-Away', href: '/putaway' },
    { name: 'Packing', href: '/packing' },
    { name: 'Dock', href: '/dock' },
    { name: 'Appointments', href: '/appointments' },

    // Individual inventory pages
    { name: 'Stock Movements', href: '/stock/movements' },
    { name: 'Cycle Count', href: '/inventory/cycle-count' },
    { name: 'Adjustments', href: '/adjustments' },
    { name: 'Batch', href: '/batch' },

    // Planning pages
    { name: 'Waves', href: '/waves' },
    { name: 'Replenishment', href: '/replenishment' },
    { name: 'Forecasting', href: '/forecasting' },
    { name: 'Slotting', href: '/slotting' },
    { name: 'Consolidation', href: '/consolidation' },
    { name: 'Tasks', href: '/tasks' },

    // Quality pages
    { name: 'Quality', href: '/quality' },
    { name: 'Compliance', href: '/compliance' },
    { name: 'Returns', href: '/returns' },
    { name: 'Claims', href: '/claims' },

    // Resources
    { name: 'Equipment', href: '/equipment' },
    { name: 'Assets', href: '/assets' },
    { name: 'Labor', href: '/labor' },
    { name: 'Yard', href: '/yard' },
    { name: 'Carriers', href: '/carriers' },

    // Analytics
    { name: 'KPI', href: '/kpi' },
    { name: 'Reports', href: '/reports' },
    { name: 'Metrics', href: '/metrics' },
    { name: 'Alerts', href: '/alerts' },

    // Config
    { name: 'Zones', href: '/config/zones' },
    { name: 'Warehouse Layout', href: '/warehouse/layout' },
    { name: 'Barcode', href: '/barcode' },
    { name: 'Routing', href: '/routing' },
    { name: 'Capacity', href: '/capacity' },

    // Advanced
    { name: 'Production', href: '/production' },
    { name: 'Cross-Docking', href: '/crossdock' },
    { name: 'Kitting', href: '/kitting' },
    { name: 'VAS', href: '/vas' },
    { name: 'Notifications', href: '/notifications' },
  ];

  console.log(`\n✓ Testing ${pagesToTest.length} pages\n`);

  const results = {
    success: [],
    warning: [],
    error: []
  };

  for (const pageInfo of pagesToTest) {
    try {
      await page.goto(`http://localhost:3001${pageInfo.href}`, { timeout: 8000 });

      // Wait for loading to finish - wait for either a table or multiple buttons to appear
      try {
        await Promise.race([
          page.waitForSelector('table', { timeout: 3000 }),
          page.waitForSelector('button:nth-of-type(3)', { timeout: 3000 }),
          page.waitForTimeout(1500)
        ]);
      } catch (e) {
        // If no table/buttons found, just wait a bit more
        await page.waitForTimeout(1000);
      }

      const hasH1 = await page.locator('h1').count();
      const hasButton = await page.locator('button').count();
      const bodyText = await page.textContent('body');
      const contentLength = bodyText?.length || 0;

      if (hasH1 > 0 && contentLength > 200) {
        console.log(`  ✓ ${pageInfo.name.padEnd(30)} (h1=${hasH1}, buttons=${hasButton}, ${contentLength} chars)`);
        results.success.push(pageInfo.name);
      } else if (contentLength > 50) {
        console.log(`  ⚠ ${pageInfo.name.padEnd(30)} (minimal: ${contentLength} chars)`);
        results.warning.push({ name: pageInfo.name, href: pageInfo.href, length: contentLength });
      } else {
        console.log(`  ✗ ${pageInfo.name.padEnd(30)} (empty: ${contentLength} chars)`);
        results.error.push({ name: pageInfo.name, href: pageInfo.href, length: contentLength });
      }

    } catch (error) {
      console.log(`  ✗ ${pageInfo.name.padEnd(30)} ERROR: ${error.message.substring(0, 50)}`);
      results.error.push({ name: pageInfo.name, href: pageInfo.href, error: error.message });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total: ${pagesToTest.length}`);
  console.log(`✓ Success: ${results.success.length}`);
  console.log(`⚠ Warning: ${results.warning.length}`);
  console.log(`✗ Errors: ${results.error.length}`);
  console.log(`Success Rate: ${((results.success.length / pagesToTest.length) * 100).toFixed(1)}%`);

  if (results.error.length > 0) {
    console.log(`\n--- Pages with Errors ---`);
    results.error.forEach(item => {
      console.log(`  ✗ ${item.name} (${item.href})`);
    });
  }

  // Test passes if at least 80% work
  expect(results.success.length).toBeGreaterThan(pagesToTest.length * 0.8);
});
