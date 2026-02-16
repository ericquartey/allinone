import { test, expect } from '@playwright/test';

/**
 * Test per verificare la scala corretta degli scomparti nei cassetti
 *
 * Problema: Gli scomparti non occupano tutta la larghezza del cassetto (1950mm)
 * ma solo metà. Il sistema di coordinate nel database usa valori normalizzati.
 */

test.describe('Drawer Compartment Scale', () => {
  test.beforeEach(async ({ page }) => {
    // Vai alla pagina di gestione cassetti
    await page.goto('http://localhost:3001/drawer-management');

    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display compartments covering full drawer width', async ({ page }) => {
    // Cerca e seleziona il cassetto 1001
    const searchInput = page.locator('input[placeholder*="Cerca cassetto"]');
    await searchInput.fill('1001');
    await page.waitForTimeout(1000);

    // Clicca sul cassetto 1001
    const drawer1001 = page.locator('button:has-text("#1001")').first();
    await drawer1001.click();
    await page.waitForTimeout(2000);

    // Prendi uno screenshot per vedere la situazione attuale
    await page.screenshot({
      path: 'screenshots/drawer-1001-compartments-before.png',
      fullPage: true
    });

    // Verifica che ci siano scomparti visibili
    const compartments = page.locator('[data-compartment-id]');
    const count = await compartments.count();
    console.log(`Found ${count} compartments in the visualization`);

    // Prendi le informazioni dal DOM
    const compartmentInfo = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-compartment-id]');
      return Array.from(elements).map(el => ({
        id: el.getAttribute('data-compartment-id'),
        width: (el as HTMLElement).style.width,
        left: (el as HTMLElement).style.left,
        clientWidth: (el as HTMLElement).clientWidth,
        offsetLeft: (el as HTMLElement).offsetLeft
      }));
    });

    console.log('Compartment visualization info:', JSON.stringify(compartmentInfo, null, 2));

    // Verifica le dimensioni del cassetto
    const drawerInfo = await page.evaluate(() => {
      const drawerContainer = document.querySelector('[data-drawer-container]');
      if (!drawerContainer) return null;
      return {
        width: (drawerContainer as HTMLElement).clientWidth,
        height: (drawerContainer as HTMLElement).clientHeight
      };
    });

    console.log('Drawer container info:', drawerInfo);

    // Log dei dati API
    await page.evaluate(() => {
      console.log('=== API Data Debug ===');
    });

    await page.waitForTimeout(1000);
  });

  test('should fetch and display UDC 1001 data correctly', async ({ page }) => {
    // Intercetta le chiamate API
    let udcData: any = null;
    let compartmentsData: any = null;

    page.on('response', async (response) => {
      const url = response.url();

      if (url.includes('/api/udc') && !url.includes('compartments')) {
        const json = await response.json();
        udcData = json;
        console.log('UDC API Response:', JSON.stringify(json, null, 2));
      }

      if (url.includes('/api/udc/') && url.includes('compartments')) {
        const json = await response.json();
        compartmentsData = json;
        console.log('Compartments API Response:', JSON.stringify(json, null, 2));
      }
    });

    // Cerca cassetto 1001
    const searchInput = page.locator('input[placeholder*="Cerca cassetto"]');
    await searchInput.fill('1001');
    await page.waitForTimeout(1000);

    // Seleziona cassetto
    const drawer1001 = page.locator('button:has-text("#1001")').first();
    await drawer1001.click();
    await page.waitForTimeout(2000);

    // Verifica dati UDC
    const udcItem = udcData?.data?.find((item: any) => item.id === 1001);
    console.log('\n=== UDC 1001 Data ===');
    console.log('Larghezza:', udcItem?.larghezza, 'mm');
    console.log('Profondità:', udcItem?.profondita, 'mm');
    console.log('Altezza:', udcItem?.altezza, 'mm');

    // Verifica dati scomparti
    console.log('\n=== Compartments Data ===');
    if (compartmentsData?.data) {
      compartmentsData.data.forEach((comp: any, index: number) => {
        console.log(`\nScomparto ${index + 1}:`);
        console.log('  ID:', comp.id);
        console.log('  Coordinate:', comp.coordinate);
        console.log('  posX (micron):', comp.posX);
        console.log('  posY (micron):', comp.posY);
        console.log('  dimX (micron):', comp.dimX);
        console.log('  dimY (micron):', comp.dimY);
        console.log('  posX (mm):', Math.round(comp.posX / 1000));
        console.log('  dimX (mm):', Math.round(comp.dimX / 1000));
        console.log('  % larghezza:', ((comp.dimX / 1000000) * 100).toFixed(1) + '%');
        console.log('  Larghezza assoluta (se UDC=1950mm):', Math.round(1950 * comp.dimX / 1000000), 'mm');
      });

      // Calcola larghezza totale
      const totalWidth = compartmentsData.data.reduce((sum: number, comp: any) => {
        return sum + Math.round(comp.dimX / 1000);
      }, 0);

      console.log('\n=== Totali ===');
      console.log('Larghezza totale scomparti (mm):', totalWidth);
      console.log('Larghezza UDC (mm):', udcItem?.larghezza);
      console.log('Differenza:', (udcItem?.larghezza || 0) - totalWidth, 'mm');
    }

    await page.screenshot({
      path: 'screenshots/drawer-1001-data-debug.png',
      fullPage: true
    });
  });
});
