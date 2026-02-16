import { test, expect } from '@playwright/test';

test.describe('PPC Drawer Present - EJLOG compartments', () => {
  test('mostra scomparti reali EJLOG per cassetto in baia', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
    const drawerCode = process.env.PPC_DRAWER_CODE || '002';

    await page.goto(`${baseUrl}/ppc/operator/drawer-present?drawer=${drawerCode}`);
    await page.waitForSelector('.ppc-drawer-present');

    // Attendi che il conteggio scomparti sia > 0 oppure che compaia un errore
    const countLocator = page.locator('.ppc-drawer-present__compartments-count');
    const emptyLocator = page.locator('.ppc-drawer-present__compartments-empty');

    await page.waitForTimeout(1500);

    const countText = await countLocator.textContent();
    const emptyText = await emptyLocator.textContent();

    if (emptyText && emptyText.trim().length > 0) {
      throw new Error(`Nessuno scomparto trovato per UDC ${drawerCode}: ${emptyText}`);
    }

    const match = (countText || '').match(/(\d+)/);
    const count = match ? Number(match[1]) : 0;
    expect(count).toBeGreaterThan(0);
  });
});
