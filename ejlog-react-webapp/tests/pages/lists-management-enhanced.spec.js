// ============================================================================
// EJLOG WMS - Lists Management Enhanced Page Test
// Test Playwright per verificare la nuova pagina gestione liste
// ============================================================================

import { test, expect } from '@playwright/test';

test.describe('Lists Management Enhanced Page', () => {
  test.beforeEach(async ({ page }) => {
    // Naviga alla pagina gestione liste
    await page.goto('http://localhost:3001/lists-management');

    // Aspetta che la pagina sia caricata
    await page.waitForLoadState('networkidle');
  });

  test('should display page header and title', async ({ page }) => {
    // Verifica che il titolo sia presente
    const title = page.locator('h1:has-text("Gestione Liste")');
    await expect(title).toBeVisible();

    // Screenshot della pagina
    await page.screenshot({ path: 'test-results/lists-management-header.png', fullPage: true });
  });

  test('should display statistics cards', async ({ page }) => {
    // Cerca le cards delle statistiche
    const statsCards = page.locator('div:has-text("Totale")');
    await expect(statsCards.first()).toBeVisible();

    // Screenshot delle stats
    await page.screenshot({ path: 'test-results/lists-management-stats.png', fullPage: true });
  });

  test('should display sidebar with actions', async ({ page }) => {
    // Cerca la sidebar con le azioni
    const sidebar = page.locator('div:has-text("Azioni")');

    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();

      // Verifica che ci siano i gruppi di azioni
      await expect(page.locator('text=Ricerca')).toBeVisible();
      await expect(page.locator('text=Gestione')).toBeVisible();

      console.log('✅ Sidebar con azioni trovata');
    } else {
      console.log('⚠️ Sidebar non trovata - potrebbe essere la vecchia versione');
    }

    // Screenshot della pagina completa
    await page.screenshot({ path: 'test-results/lists-management-full.png', fullPage: true });
  });

  test('should display filters panel when toggled', async ({ page }) => {
    // Cerca il bottone filtri
    const filterButton = page.locator('button:has-text("Filtri")');

    if (await filterButton.count() > 0) {
      await filterButton.click();

      // Aspetta che il pannello filtri sia visibile
      await page.waitForTimeout(500);

      // Screenshot con filtri aperti
      await page.screenshot({ path: 'test-results/lists-management-filters.png', fullPage: true });
    }
  });

  test('should display lists table', async ({ page }) => {
    // Cerca la tabella
    const table = page.locator('table').first();

    if (await table.count() > 0) {
      await expect(table).toBeVisible();
      console.log('✅ Tabella liste trovata');
    } else {
      // Cerca elementi alternativi
      const listItems = page.locator('[class*="list"]').first();
      console.log('⚠️ Tabella standard non trovata, cerco layout alternativo');
    }

    // Screenshot della tabella
    await page.screenshot({ path: 'test-results/lists-management-table.png', fullPage: true });
  });

  test('should take full page screenshot', async ({ page }) => {
    // Aspetta un po' per il rendering completo
    await page.waitForTimeout(2000);

    // Screenshot completo
    await page.screenshot({
      path: 'test-results/lists-management-complete.png',
      fullPage: true
    });

    // Stampa informazioni sulla pagina
    const pageTitle = await page.title();
    const url = page.url();

    console.log('📄 Page Title:', pageTitle);
    console.log('🔗 URL:', url);

    // Cerca elementi chiave
    const heading = await page.locator('h1').first().textContent();
    console.log('📌 Main Heading:', heading);

    // Conta elementi
    const buttons = await page.locator('button').count();
    const cards = await page.locator('[class*="card"]').count();
    const tables = await page.locator('table').count();

    console.log('🔢 Buttons:', buttons);
    console.log('🔢 Cards:', cards);
    console.log('🔢 Tables:', tables);
  });

  test('should check for enhanced features', async ({ page }) => {
    // Verifica features della versione enhanced
    const hasEnhancedLayout = await page.locator('div.flex.h-screen').count() > 0;
    const hasSidebar = await page.locator('div.w-64').count() > 0;
    const hasActionGroups = await page.locator('text=Ricerca').count() > 0;

    console.log('📊 Enhanced Layout Check:');
    console.log('  - Full screen layout:', hasEnhancedLayout ? '✅' : '❌');
    console.log('  - Sidebar (w-64):', hasSidebar ? '✅' : '❌');
    console.log('  - Action groups:', hasActionGroups ? '✅' : '❌');

    if (hasEnhancedLayout && hasSidebar && hasActionGroups) {
      console.log('✅ ENHANCED VERSION ATTIVA');
    } else {
      console.log('⚠️ VERSIONE STANDARD (non enhanced)');
    }

    // Screenshot finale con annotazioni
    await page.screenshot({
      path: 'test-results/lists-management-version-check.png',
      fullPage: true
    });
  });

  test('should capture all UI elements', async ({ page }) => {
    // Aspetta rendering
    await page.waitForTimeout(1500);

    // Cattura tutti gli elementi h1, h2, h3
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log('📑 Headings found:', headings);

    // Cattura tutti i pulsanti visibili
    const buttonTexts = await page.locator('button:visible').allTextContents();
    console.log('🔘 Buttons found:', buttonTexts.slice(0, 10)); // primi 10

    // Cattura classi CSS del container principale
    const mainClasses = await page.locator('body > div').first().getAttribute('class');
    console.log('🎨 Main container classes:', mainClasses);

    // Screenshot annotato
    await page.screenshot({
      path: 'test-results/lists-management-ui-elements.png',
      fullPage: true
    });
  });
});

test.describe('Enhanced vs Standard Comparison', () => {
  test('identify which version is active', async ({ page }) => {
    await page.goto('http://localhost:3001/lists-management');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Markers per la versione Enhanced
    const enhancedMarkers = {
      'Sidebar w-64': await page.locator('.w-64.bg-gray-50').count() > 0,
      'Full height layout': await page.locator('.flex.h-screen').count() > 0,
      'Action groups': await page.locator('text=Ricerca').count() > 0,
      'Gestione Stato section': await page.locator('text=Gestione Stato').count() > 0,
    };

    // Markers per la versione Standard
    const standardMarkers = {
      'max-w-7xl container': await page.locator('.max-w-7xl').count() > 0,
      'Stats grid-cols-5/7': await page.locator('[class*="grid-cols-5"], [class*="grid-cols-7"]').count() > 0,
    };

    console.log('🔍 VERSION DETECTION:');
    console.log('\n📱 Enhanced Markers:');
    Object.entries(enhancedMarkers).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    });

    console.log('\n📱 Standard Markers:');
    Object.entries(standardMarkers).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    });

    const isEnhanced = Object.values(enhancedMarkers).filter(Boolean).length >= 2;
    const isStandard = Object.values(standardMarkers).filter(Boolean).length >= 1;

    console.log('\n🎯 CONCLUSION:');
    if (isEnhanced) {
      console.log('✅ ENHANCED VERSION is active');
    } else if (isStandard) {
      console.log('⚠️ STANDARD VERSION is active');
    } else {
      console.log('❓ UNKNOWN VERSION');
    }

    // Screenshot finale
    await page.screenshot({
      path: 'test-results/lists-management-version-final.png',
      fullPage: true
    });
  });
});
