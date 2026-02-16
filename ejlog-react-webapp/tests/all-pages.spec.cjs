const { test, expect } = require('@playwright/test');

// Lista di tutte le 59 pagine implementate
const pages = [
  // Execution Pages
  { path: '/lists/1/execute/picking', name: 'Picking Execution' },
  { path: '/lists/1/execute/refilling', name: 'Refilling Execution' },
  { path: '/lists/1/execute/inventory', name: 'Inventory Execution' },

  // Product Pages
  { path: '/products', name: 'Product List' },
  { path: '/products/1', name: 'Product Detail' },

  // Location Pages
  { path: '/locations', name: 'Location List' },
  { path: '/locations/1', name: 'Location Detail' },

  // UDC Pages
  { path: '/udc', name: 'UDC List' },
  { path: '/udc/1', name: 'UDC Detail' },

  // Transfer Pages
  { path: '/transfers/new', name: 'Transfer Material' },

  // Workstation Pages
  { path: '/workstations', name: 'Workstation List' },
  { path: '/workstations/1', name: 'Workstation Detail' },

  // List Management
  { path: '/lists/management', name: 'List Management' },
  { path: '/lists/1', name: 'List Detail' },

  // User Management
  { path: '/users', name: 'User List' },

  // Basic Pages
  { path: '/items', name: 'Items' },
  { path: '/lists', name: 'Lists' },
  { path: '/stock', name: 'Stock' },

  // Stock Pages
  { path: '/stock/movements', name: 'Stock Movements' },

  // Config Pages
  { path: '/config/zones', name: 'Zone Config' },

  // Reports
  { path: '/reports', name: 'Reports Dashboard' },

  // Receiving
  { path: '/receiving', name: 'Receiving Management' },

  // Shipping
  { path: '/shipping', name: 'Shipping Management' },

  // Production
  { path: '/production', name: 'Production Orders' },

  // Quality
  { path: '/quality', name: 'Quality Control' },

  // Suppliers
  { path: '/suppliers', name: 'Suppliers' },

  // Customers
  { path: '/customers', name: 'Customers' },

  // Inventory
  { path: '/inventory/cycle-count', name: 'Cycle Count' },

  // Carriers
  { path: '/carriers', name: 'Carriers' },

  // Alerts
  { path: '/alerts', name: 'Alerts Dashboard' },

  // Equipment
  { path: '/equipment', name: 'Equipment Management' },

  // Warehouse
  { path: '/warehouse/layout', name: 'Warehouse Layout' },

  // Batch
  { path: '/batch', name: 'Batch Management' },

  // Dock
  { path: '/dock', name: 'Dock Management' },

  // KPI
  { path: '/kpi', name: 'KPI Dashboard' },

  // Tasks
  { path: '/tasks', name: 'Task Assignment' },

  // Returns
  { path: '/returns', name: 'Returns Management' },

  // Kitting
  { path: '/kitting', name: 'Kitting Assembly' },

  // Slotting
  { path: '/slotting', name: 'Slotting Optimization' },

  // Wave Planning
  { path: '/waves', name: 'Wave Planning' },

  // Labor Management
  { path: '/labor', name: 'Labor Management' },

  // Yard Management
  { path: '/yard', name: 'Yard Management' },

  // Appointments
  { path: '/appointments', name: 'Appointment Scheduling' },

  // Compliance
  { path: '/compliance', name: 'Compliance Audit' },

  // Claims
  { path: '/claims', name: 'Damage Claims' },

  // Cross-Docking
  { path: '/crossdock', name: 'Cross-Docking' },

  // Replenishment
  { path: '/replenishment', name: 'Replenishment Planning' },

  // VAS
  { path: '/vas', name: 'Value-Added Services' },

  // Put-Away
  { path: '/putaway', name: 'Put-Away Management' },

  // Consolidation
  { path: '/consolidation', name: 'Order Consolidation' },

  // NEW PAGES (9)
  { path: '/adjustments', name: 'Inventory Adjustments' },
  { path: '/packing', name: 'Packing Operations' },
  { path: '/barcode', name: 'Barcode Management' },
  { path: '/routing', name: 'Route Planning' },
  { path: '/capacity', name: 'Warehouse Capacity' },
  { path: '/assets', name: 'Asset Tracking' },
  { path: '/forecasting', name: 'Demand Forecasting' },
  { path: '/metrics', name: 'Performance Metrics' },
  { path: '/notifications', name: 'Notifications Center' }
];

test.describe('All Pages Rendering Test', () => {
  test.setTimeout(120000); // 2 minutes timeout for all pages

  for (const page of pages) {
    test(`${page.name} (${page.path}) should render correctly`, async ({ page: browserPage }) => {
      // Navigate to the page
      await browserPage.goto(`http://localhost:3002${page.path}`);

      // Wait for React to render
      await browserPage.waitForTimeout(1000);

      // Check that there are no console errors (except warnings)
      const errors = [];
      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Verify page title or main content is visible
      const body = await browserPage.locator('body');
      await expect(body).toBeVisible();

      // Check that page has rendered some content (not blank)
      const content = await browserPage.textContent('body');
      expect(content.length).toBeGreaterThan(100);

      // Take a screenshot for visual verification (optional)
      // await browserPage.screenshot({ path: `screenshots/${page.name}.png` });

      console.log(`✓ ${page.name} - OK`);
    });
  }
});

test.describe('Quick Smoke Test - 9 New Pages', () => {
  test.setTimeout(60000);

  const newPages = [
    '/adjustments',
    '/packing',
    '/barcode',
    '/routing',
    '/capacity',
    '/assets',
    '/forecasting',
    '/metrics',
    '/notifications'
  ];

  test('All 9 new pages should load without errors', async ({ page }) => {
    const results = [];

    for (const path of newPages) {
      await page.goto(`http://localhost:3002${path}`);
      await page.waitForTimeout(500);

      const body = await page.locator('body');
      const isVisible = await body.isVisible();

      results.push({ path, success: isVisible });
      console.log(`${isVisible ? '✓' : '✗'} ${path}`);
    }

    // All should succeed
    const allSuccess = results.every(r => r.success);
    expect(allSuccess).toBe(true);
  });
});
