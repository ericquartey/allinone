const { test, expect } = require('@playwright/test');

test('Verify all pages load successfully', async ({ page }) => {
  const pagesToTest = [
    // Main section
    { name: 'Dashboard', href: '/' },
    { name: 'Articoli', href: '/items' },
    { name: 'Liste', href: '/lists' },
    { name: 'Giacenze', href: '/stock' },
    { name: 'Impostazioni', href: '/settings' },

    // Operations
    { name: 'Receiving', href: '/receiving' },
    { name: 'Shipping', href: '/shipping' },
    { name: 'Transfers', href: '/transfers' },
    { name: 'Transfer Material', href: '/transfer-material' },
    { name: 'Put-Away', href: '/putaway' },
    { name: 'Packing', href: '/packing' },
    { name: 'Dock Management', href: '/dock' },
    { name: 'Appointments', href: '/appointments' },

    // Inventory
    { name: 'Stock Movements', href: '/stock-movements' },
    { name: 'Cycle Count', href: '/cycle-count' },
    { name: 'Adjustments', href: '/adjustments' },
    { name: 'Batch Management', href: '/batch-management' },
    { name: 'Lot Tracking', href: '/lot-tracking' },
    { name: 'Serial Tracking', href: '/serial-tracking' },

    // Planning
    { name: 'Wave Planning', href: '/wave-planning' },
    { name: 'Replenishment', href: '/replenishment' },
    { name: 'Demand Forecasting', href: '/demand-forecasting' },
    { name: 'Slotting Optimization', href: '/slotting' },
    { name: 'Order Consolidation', href: '/order-consolidation' },
    { name: 'Task Management', href: '/tasks' },

    // Quality & Compliance
    { name: 'Quality Control', href: '/quality-control' },
    { name: 'Compliance Audit', href: '/compliance-audit' },
    { name: 'Returns', href: '/returns' },
    { name: 'Damage Claims', href: '/damage-claims' },

    // Resources
    { name: 'Equipment', href: '/equipment' },
    { name: 'Asset Tracking', href: '/assets' },
    { name: 'Labor Management', href: '/labor' },
    { name: 'Yard Management', href: '/yard' },
    { name: 'Carriers', href: '/carriers' },

    // Master Data
    { name: 'Products', href: '/products' },
    { name: 'Locations', href: '/locations' },
    { name: 'UDC Management', href: '/udc' },
    { name: 'Workstations', href: '/workstations' },
    { name: 'Suppliers', href: '/suppliers' },
    { name: 'Customers', href: '/customers' },

    // Analytics
    { name: 'KPI Dashboard', href: '/kpi-dashboard' },
    { name: 'Reports', href: '/reports' },
    { name: 'Performance Metrics', href: '/performance-metrics' },
    { name: 'Alerts & Notifications', href: '/alerts' },

    // Configuration
    { name: 'Zone Configuration', href: '/zone-config' },
    { name: 'Warehouse Layout', href: '/warehouse-layout' },
    { name: 'Barcode Config', href: '/barcode-config' },
    { name: 'Routing Rules', href: '/routing-rules' },
    { name: 'Capacity Planning', href: '/capacity-planning' },

    // Advanced
    { name: 'Production Orders', href: '/production-orders' },
    { name: 'Cross-Docking', href: '/cross-docking' },
    { name: 'Kitting Assembly', href: '/kitting' },
    { name: 'Value-Added Services', href: '/vas' },
  ];

  console.log(`\n✓ Testing ${pagesToTest.length} pages\n`);

  let successCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  for (const pageInfo of pagesToTest) {
    try {
      await page.goto(`http://localhost:3001${pageInfo.href}`, { timeout: 5000 });
      await page.waitForTimeout(300);

      const hasH1 = await page.locator('h1').count();
      const hasButton = await page.locator('button').count();
      const bodyText = await page.textContent('body');
      const contentLength = bodyText?.length || 0;

      if (hasH1 > 0 && contentLength > 200) {
        console.log(`  ✓ ${pageInfo.name.padEnd(30)} (h1=${hasH1}, buttons=${hasButton}, ${contentLength} chars)`);
        successCount++;
      } else if (contentLength > 50) {
        console.log(`  ⚠ ${pageInfo.name.padEnd(30)} (minimal content: ${contentLength} chars)`);
        warningCount++;
      } else {
        console.log(`  ✗ ${pageInfo.name.padEnd(30)} (very low content: ${contentLength} chars)`);
        errorCount++;
      }

    } catch (error) {
      console.log(`  ✗ ${pageInfo.name.padEnd(30)} ERROR: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total Pages: ${pagesToTest.length}`);
  console.log(`✓ Success: ${successCount}`);
  console.log(`⚠ Warning: ${warningCount}`);
  console.log(`✗ Errors: ${errorCount}`);
  console.log(`Success Rate: ${((successCount / pagesToTest.length) * 100).toFixed(1)}%`);

  // Test passes if at least 80% of pages load successfully
  expect(successCount).toBeGreaterThan(pagesToTest.length * 0.8);
});
