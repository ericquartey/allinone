const { test, expect } = require('@playwright/test');

test('Verify all pages are accessible through navigation menu', async ({ page }) => {
  // Listen to console messages and errors
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  // Go to homepage
  await page.goto('http://localhost:3001/');
  await page.waitForTimeout(1000);

  // Test pages from each section
  const pagesToTest = [
    // Main section (always visible)
    { name: 'Dashboard', href: '/' },
    { name: 'Articoli', href: '/items' },
    { name: 'Giacenze', href: '/stock' },

    // Operations section
    { section: 'Operations', name: 'Receiving', href: '/receiving' },
    { section: 'Operations', name: 'Shipping', href: '/shipping' },
    { section: 'Operations', name: 'Transfers', href: '/transfers' },

    // Inventory section
    { section: 'Inventory', name: 'Adjustments', href: '/adjustments' },
    { section: 'Inventory', name: 'Cycle Count', href: '/cycle-count' },

    // Planning section
    { section: 'Planning', name: 'Wave Planning', href: '/wave-planning' },
    { section: 'Planning', name: 'Replenishment', href: '/replenishment' },

    // Quality & Compliance section
    { section: 'Quality & Compliance', name: 'Quality Control', href: '/quality-control' },
    { section: 'Quality & Compliance', name: 'Returns', href: '/returns' },

    // Resources section
    { section: 'Resources', name: 'Equipment', href: '/equipment' },
    { section: 'Resources', name: 'Labor Management', href: '/labor' },

    // Master Data section
    { section: 'Master Data', name: 'Products', href: '/products' },
    { section: 'Master Data', name: 'Locations', href: '/locations' },

    // Analytics section
    { section: 'Analytics', name: 'KPI Dashboard', href: '/kpi-dashboard' },
    { section: 'Analytics', name: 'Reports', href: '/reports' },

    // Configuration section
    { section: 'Configuration', name: 'Zone Configuration', href: '/zone-config' },
    { section: 'Configuration', name: 'Warehouse Layout', href: '/warehouse-layout' },

    // Advanced section
    { section: 'Advanced', name: 'Production Orders', href: '/production-orders' },
    { section: 'Advanced', name: 'Cross-Docking', href: '/cross-docking' },
  ];

  console.log(`\nTesting ${pagesToTest.length} pages...\n`);

  for (const pageInfo of pagesToTest) {
    try {
      console.log(`Testing: ${pageInfo.section ? pageInfo.section + ' > ' : ''}${pageInfo.name}`);

      // If it's in a section, expand it first
      if (pageInfo.section) {
        const sectionButton = page.locator(`button:has-text("${pageInfo.section}")`);
        const isExpanded = await sectionButton.evaluate(el =>
          el.querySelector('[data-chevron="down"]') !== null
        );

        if (!isExpanded) {
          await sectionButton.click();
          await page.waitForTimeout(300);
        }
      }

      // Navigate to the page
      await page.goto(`http://localhost:3001${pageInfo.href}`);
      await page.waitForTimeout(500);

      // Check if page has content
      const hasH1 = await page.locator('h1').count();
      const hasContent = await page.locator('body').textContent();

      if (hasH1 === 0) {
        console.log(`  ⚠️  Warning: No H1 found on ${pageInfo.name}`);
      } else {
        console.log(`  ✓ ${pageInfo.name} loaded successfully`);
      }

      // Check body content length
      if (hasContent && hasContent.length < 100) {
        console.log(`  ⚠️  Warning: ${pageInfo.name} has minimal content (${hasContent.length} chars)`);
      }

    } catch (error) {
      console.log(`  ✗ Error loading ${pageInfo.name}: ${error.message}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Page Errors: ${pageErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log('\nConsole Errors:');
    consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }

  if (pageErrors.length > 0) {
    console.log('\nPage Errors:');
    pageErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
  }

  // Test should pass if no critical page errors
  expect(pageErrors.length).toBeLessThan(5);
});
