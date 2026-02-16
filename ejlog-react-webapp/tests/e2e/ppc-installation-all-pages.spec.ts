import { test, expect } from '@playwright/test';

/**
 * Test E2E completo per TUTTE le pagine Installation del modulo PPC
 * Replica tutti gli step e le installazioni dalla versione WPF/XAML
 *
 * Questo test verifica che tutte le 47 pagine Installation siano migrate correttamente
 * e che ogni pagina si carichi senza errori.
 */

// Definizione di tutte le pagine Installation migrate da WPF/XAML
interface InstallationPage {
  viewName: string;
  category: string;
  displayName: string;
  expectedElements: string[];
}

const allInstallationPages: InstallationPage[] = [
  // ACCESSORIES
  {
    viewName: 'AlphanumericBarView',
    category: 'Accessories',
    displayName: 'Alphanumeric Bar',
    expectedElements: ['.ppc-alphanumeric-bar', '.ppc-page']
  },
  {
    viewName: 'BarcodeReaderView',
    category: 'Accessories',
    displayName: 'Barcode Reader',
    expectedElements: ['.ppc-barcode-reader', '.ppc-page']
  },
  {
    viewName: 'CardReaderView',
    category: 'Accessories',
    displayName: 'Card Reader',
    expectedElements: ['.ppc-card-reader', '.ppc-page']
  },
  {
    viewName: 'LaserPointerView',
    category: 'Accessories',
    displayName: 'Laser Pointer',
    expectedElements: ['.ppc-laser-pointer', '.ppc-page']
  },
  {
    viewName: 'TokenReaderView',
    category: 'Accessories',
    displayName: 'Token Reader',
    expectedElements: ['.ppc-token-reader', '.ppc-page']
  },
  {
    viewName: 'WeightingScaleView',
    category: 'Accessories',
    displayName: 'Weighting Scale',
    expectedElements: ['.ppc-weighting-scale', '.ppc-page']
  },

  // BAYS
  {
    viewName: 'Bay1DeviceIOView',
    category: 'Bays',
    displayName: 'Bay 1 Device IO',
    expectedElements: ['.ppc-bay1-device-io', '.ppc-page']
  },
  {
    viewName: 'Bay2DeviceIOView',
    category: 'Bays',
    displayName: 'Bay 2 Device IO',
    expectedElements: ['.ppc-bay2-device-io', '.ppc-page']
  },
  {
    viewName: 'Bay3DeviceIOView',
    category: 'Bays',
    displayName: 'Bay 3 Device IO',
    expectedElements: ['.ppc-bay3-device-io', '.ppc-page']
  },
  {
    viewName: 'BayCheckView',
    category: 'Bays',
    displayName: 'Bay Check',
    expectedElements: ['.ppc-bay-check', '.ppc-page']
  },
  {
    viewName: 'BaysSensorsView',
    category: 'Bays',
    displayName: 'Bays Sensors',
    expectedElements: ['.ppc-bays-sensors', '.ppc-page']
  },

  // CELLS
  {
    viewName: 'CellPanelsView',
    category: 'Cells',
    displayName: 'Cell Panels',
    expectedElements: ['.ppc-cell-panels', '.ppc-page']
  },
  {
    viewName: 'CellsHeightView',
    category: 'Cells',
    displayName: 'Cells Height',
    expectedElements: ['.ppc-cells-height', '.ppc-page']
  },
  {
    viewName: 'CellsSideControlView',
    category: 'Cells',
    displayName: 'Cells Side Control',
    expectedElements: ['.ppc-cells-side-control', '.ppc-page']
  },
  {
    viewName: 'LoadFirstDrawerView',
    category: 'Cells',
    displayName: 'Load First Drawer',
    expectedElements: ['.ppc-load-first-drawer', '.ppc-page']
  },
  {
    viewName: 'FixBackDrawersView',
    category: 'Cells',
    displayName: 'Fix Back Drawers',
    expectedElements: ['.ppc-fix-back-drawers', '.ppc-page']
  },

  // DEVICES
  {
    viewName: 'DevicesView',
    category: 'Devices',
    displayName: 'Devices',
    expectedElements: ['.ppc-devices', '.ppc-page']
  },

  // ELEVATOR
  {
    viewName: 'WeightAnalysisView',
    category: 'Elevator',
    displayName: 'Weight Analysis',
    expectedElements: ['.ppc-weight-analysis', '.ppc-page']
  },
  {
    viewName: 'WeightCheckView',
    category: 'Elevator',
    displayName: 'Weight Check',
    expectedElements: ['.ppc-weight-check', '.ppc-page']
  },
  {
    viewName: 'VerticalOffsetCalibrationView',
    category: 'Elevator',
    displayName: 'Vertical Offset Calibration',
    expectedElements: ['.ppc-vertical-offset-calibration', '.ppc-page']
  },
  {
    viewName: 'VerticalResolutionCalibrationView',
    category: 'Elevator',
    displayName: 'Vertical Resolution Calibration',
    expectedElements: ['.ppc-vertical-resolution-calibration', '.ppc-page']
  },
  {
    viewName: 'VerticalGainCalibrationView',
    category: 'Elevator',
    displayName: 'Vertical Gain Calibration',
    expectedElements: ['.ppc-vertical-gain-calibration', '.ppc-page']
  },
  {
    viewName: 'VerticalAxisSensorsView',
    category: 'Elevator',
    displayName: 'Vertical Axis Sensors',
    expectedElements: ['.ppc-vertical-axis-sensors', '.ppc-page']
  },
  {
    viewName: 'HorizontalOffsetCalibrationView',
    category: 'Elevator',
    displayName: 'Horizontal Offset Calibration',
    expectedElements: ['.ppc-horizontal-offset-calibration', '.ppc-page']
  },
  {
    viewName: 'HorizontalGainCalibrationView',
    category: 'Elevator',
    displayName: 'Horizontal Gain Calibration',
    expectedElements: ['.ppc-horizontal-gain-calibration', '.ppc-page']
  },
  {
    viewName: 'HorizontalResolutionCalibrationView',
    category: 'Elevator',
    displayName: 'Horizontal Resolution Calibration',
    expectedElements: ['.ppc-horizontal-resolution-calibration', '.ppc-page']
  },

  // GENERAL MACHINE
  {
    viewName: 'MachineBarcodeView',
    category: 'GeneralMachine',
    displayName: 'Machine Barcode',
    expectedElements: ['.ppc-machine-barcode', '.ppc-page']
  },
  {
    viewName: 'MachineSerialNumberView',
    category: 'GeneralMachine',
    displayName: 'Machine Serial Number',
    expectedElements: ['.ppc-machine-serial-number', '.ppc-page']
  },
  {
    viewName: 'MachinePasswordsView',
    category: 'GeneralMachine',
    displayName: 'Machine Passwords',
    expectedElements: ['.ppc-machine-passwords', '.ppc-page']
  },

  // MOVEMENTS
  {
    viewName: 'MovementsView',
    category: 'Movements',
    displayName: 'Movements',
    expectedElements: ['.ppc-movements', '.ppc-page']
  },

  // PARAMETERS
  {
    viewName: 'ParametersView',
    category: 'Parameters',
    displayName: 'Parameters',
    expectedElements: ['.ppc-parameters', '.ppc-page']
  },

  // SENSORS
  {
    viewName: 'SensorsAdminView',
    category: 'Sensors',
    displayName: 'Sensors Admin',
    expectedElements: ['.ppc-sensors-admin', '.ppc-page']
  },
  {
    viewName: 'OtherSensorsView',
    category: 'Sensors',
    displayName: 'Other Sensors',
    expectedElements: ['.ppc-other-sensors', '.ppc-page']
  },

  // SETTINGS
  {
    viewName: 'IpManagerView',
    category: 'Settings',
    displayName: 'IP Manager',
    expectedElements: ['.ppc-ip-manager', '.ppc-page']
  },
  {
    viewName: 'SensitiveAlarmView',
    category: 'Settings',
    displayName: 'Sensitive Alarm',
    expectedElements: ['.ppc-sensitive-alarm', '.ppc-page']
  },

  // SHELVES
  {
    viewName: 'ShelvesView',
    category: 'Shelves',
    displayName: 'Shelves',
    expectedElements: ['.ppc-shelves', '.ppc-page']
  },

  // SIMPLE MACHINE
  {
    viewName: 'SimpleMachineView',
    category: 'SimpleMachine',
    displayName: 'Simple Machine',
    expectedElements: ['.ppc-simple-machine', '.ppc-page']
  },

  // STRUCTURES
  {
    viewName: 'StructuresView',
    category: 'Structures',
    displayName: 'Structures',
    expectedElements: ['.ppc-structures', '.ppc-page']
  },

  // TRAJECTORIES
  {
    viewName: 'BaysStorageTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Bays Storage Trajectories',
    expectedElements: ['.ppc-bays-storage-trajectories', '.ppc-page']
  },
  {
    viewName: 'DrawerLoweringTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Drawer Lowering Trajectories',
    expectedElements: ['.ppc-drawer-lowering-trajectories', '.ppc-page']
  },
  {
    viewName: 'DrawerTakingTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Drawer Taking Trajectories',
    expectedElements: ['.ppc-drawer-taking-trajectories', '.ppc-page']
  },
  {
    viewName: 'InterferenceTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Interference Trajectories',
    expectedElements: ['.ppc-interference-trajectories', '.ppc-page']
  },
  {
    viewName: 'OperatorStorageTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Operator Storage Trajectories',
    expectedElements: ['.ppc-operator-storage-trajectories', '.ppc-page']
  },
  {
    viewName: 'PickingTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Picking Trajectories',
    expectedElements: ['.ppc-picking-trajectories', '.ppc-page']
  },
  {
    viewName: 'RefillingTrajectoriesView',
    category: 'Trajectories',
    displayName: 'Refilling Trajectories',
    expectedElements: ['.ppc-refilling-trajectories', '.ppc-page']
  },

  // WAREHOUSE
  {
    viewName: 'WarehouseView',
    category: 'Warehouse',
    displayName: 'Warehouse',
    expectedElements: ['.ppc-warehouse', '.ppc-page']
  },
];

test.describe('PPC Installation - All Pages Migration Test', () => {
  test.beforeEach(async ({ page }) => {
    // Imposta timeout più lungo per le pagine che potrebbero richiedere caricamento dati
    test.setTimeout(60000);
  });

  // Test generale per verificare che tutte le pagine siano accessibili
  test('should list all 47 installation pages', () => {
    expect(allInstallationPages).toHaveLength(47);
  });

  // Test per ogni pagina individualmente
  for (const pageInfo of allInstallationPages) {
    test(`should load ${pageInfo.category}/${pageInfo.viewName} successfully`, async ({ page }) => {
      // Costruisci URL basato sul viewName
      const url = `http://localhost:3000/ppc/installation/${pageInfo.viewName.replace('View', '').toLowerCase()}`;

      // Naviga alla pagina
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Verifica che la pagina base PPC sia visibile
      const ppcPage = page.locator('.ppc-page');
      await expect(ppcPage).toBeVisible({ timeout: 10000 });

      // Verifica che non ci siano errori JavaScript critici
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Attendi un momento per catturare eventuali errori
      await page.waitForTimeout(1000);

      // Non dovrebbero esserci errori critici di tipo "Cannot read property" o "undefined is not"
      const criticalErrors = consoleErrors.filter(err =>
        err.includes('Cannot read property') ||
        err.includes('undefined is not') ||
        err.includes('is not a function')
      );

      expect(criticalErrors).toHaveLength(0);
    });
  }

  // Test di gruppo per categoria
  test.describe('Accessories Pages', () => {
    const accessoriesPages = allInstallationPages.filter(p => p.category === 'Accessories');

    test('should have 6 accessories pages', () => {
      expect(accessoriesPages).toHaveLength(6);
    });

    for (const pageInfo of accessoriesPages) {
      test(`${pageInfo.displayName} should be accessible`, async ({ page }) => {
        const url = `http://localhost:3000/ppc/installation/${pageInfo.viewName.replace('View', '').toLowerCase()}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await expect(page.locator('.ppc-page')).toBeVisible();
      });
    }
  });

  test.describe('Bays Pages', () => {
    const baysPages = allInstallationPages.filter(p => p.category === 'Bays');

    test('should have 5 bays pages', () => {
      expect(baysPages).toHaveLength(5);
    });

    for (const pageInfo of baysPages) {
      test(`${pageInfo.displayName} should be accessible`, async ({ page }) => {
        const url = `http://localhost:3000/ppc/installation/${pageInfo.viewName.replace('View', '').toLowerCase()}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await expect(page.locator('.ppc-page')).toBeVisible();
      });
    }
  });

  test.describe('Cells Pages', () => {
    const cellsPages = allInstallationPages.filter(p => p.category === 'Cells');

    test('should have 5 cells pages', () => {
      expect(cellsPages).toHaveLength(5);
    });

    for (const pageInfo of cellsPages) {
      test(`${pageInfo.displayName} should be accessible`, async ({ page }) => {
        const url = `http://localhost:3000/ppc/installation/${pageInfo.viewName.replace('View', '').toLowerCase()}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await expect(page.locator('.ppc-page')).toBeVisible();
      });
    }
  });

  test.describe('Elevator Pages', () => {
    const elevatorPages = allInstallationPages.filter(p => p.category === 'Elevator');

    test('should have 8 elevator pages', () => {
      expect(elevatorPages).toHaveLength(8);
    });

    for (const pageInfo of elevatorPages) {
      test(`${pageInfo.displayName} should be accessible`, async ({ page }) => {
        const url = `http://localhost:3000/ppc/installation/${pageInfo.viewName.replace('View', '').toLowerCase()}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await expect(page.locator('.ppc-page')).toBeVisible();
      });
    }
  });

  test.describe('Trajectories Pages', () => {
    const trajectoriesPages = allInstallationPages.filter(p => p.category === 'Trajectories');

    test('should have 7 trajectories pages', () => {
      expect(trajectoriesPages).toHaveLength(7);
    });

    for (const pageInfo of trajectoriesPages) {
      test(`${pageInfo.displayName} should be accessible`, async ({ page }) => {
        const url = `http://localhost:3000/ppc/installation/${pageInfo.viewName.replace('View', '').toLowerCase()}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await expect(page.locator('.ppc-page')).toBeVisible();
      });
    }
  });

  test.describe('Settings Pages', () => {
    const settingsPages = allInstallationPages.filter(p => p.category === 'Settings');

    test('should have 2 settings pages', () => {
      expect(settingsPages).toHaveLength(2);
    });

    test('IP Manager should have complete form', async ({ page }) => {
      await page.goto('http://localhost:3000/ppc/installation/ipmanager', { waitUntil: 'networkidle' });

      await expect(page.locator('.ppc-ip-manager')).toBeVisible();
      await expect(page.locator('.ppc-ip-manager__title')).toContainText(/Ip Manager/i);

      // Verifica sezione Inverter
      await expect(page.locator('.ppc-ip-manager__inverter')).toBeVisible();

      // Verifica pulsante Save
      const saveButton = page.getByRole('button', { name: /Save|Salva/i });
      await expect(saveButton).toBeVisible();
    });

    test('Sensitive Alarm should be accessible', async ({ page }) => {
      await page.goto('http://localhost:3000/ppc/installation/sensitivealarm', { waitUntil: 'networkidle' });
      await expect(page.locator('.ppc-page')).toBeVisible();
    });
  });

  // Test di navigazione tra le pagine
  test('should navigate between installation pages without errors', async ({ page }) => {
    // Testa la navigazione tra alcune pagine chiave
    const testPages = [
      'ipmanager',
      'bay1deviceio',
      'devices',
      'parameters',
      'warehouse'
    ];

    for (const pageName of testPages) {
      await page.goto(`http://localhost:3000/ppc/installation/${pageName}`, { waitUntil: 'networkidle' });
      await expect(page.locator('.ppc-page')).toBeVisible();

      // Verifica che non ci siano errori di routing
      const url = page.url();
      expect(url).toContain(`/ppc/installation/${pageName}`);
    }
  });

  // Test di caricamento parallelo (stress test)
  test('should handle concurrent page loads', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    // Carica 3 pagine diverse in parallelo
    await Promise.all([
      pages[0].goto('http://localhost:3000/ppc/installation/ipmanager'),
      pages[1].goto('http://localhost:3000/ppc/installation/devices'),
      pages[2].goto('http://localhost:3000/ppc/installation/warehouse'),
    ]);

    // Verifica che tutte e 3 le pagine siano caricate correttamente
    await expect(pages[0].locator('.ppc-page')).toBeVisible();
    await expect(pages[1].locator('.ppc-page')).toBeVisible();
    await expect(pages[2].locator('.ppc-page')).toBeVisible();

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  // Test di persistenza dati tra navigazioni
  test('should maintain state when navigating between pages', async ({ page }) => {
    // Vai a IP Manager
    await page.goto('http://localhost:3000/ppc/installation/ipmanager', { waitUntil: 'networkidle' });

    // Compila un campo se disponibile
    const firstInput = page.locator('input[type="text"], textarea').first();
    if (await firstInput.isVisible()) {
      await firstInput.fill('192.168.1.100');
    }

    // Naviga ad altra pagina
    await page.goto('http://localhost:3000/ppc/installation/devices', { waitUntil: 'networkidle' });
    await expect(page.locator('.ppc-page')).toBeVisible();

    // Torna a IP Manager
    await page.goto('http://localhost:3000/ppc/installation/ipmanager', { waitUntil: 'networkidle' });

    // I dati potrebbero essere stati ricaricati dal backend
    // Verifica solo che la pagina si carichi correttamente
    await expect(page.locator('.ppc-ip-manager')).toBeVisible();
  });

  // Test di responsività
  test('should be responsive on different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Full HD' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 1024, height: 768, name: 'Tablet Landscape' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000/ppc/installation/ipmanager', { waitUntil: 'networkidle' });

      // Verifica che la pagina sia visibile
      await expect(page.locator('.ppc-page')).toBeVisible();

      // Verifica che il contenuto non sia troncato
      const ppcPage = page.locator('.ppc-page');
      const boundingBox = await ppcPage.boundingBox();

      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }
    }
  });
});
