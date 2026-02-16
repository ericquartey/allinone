import { test, expect } from '@playwright/test';

test.describe('PPC Drawer Present', () => {
  test('mostra scomparti e vista 3D quando disponibili', async ({ page }) => {
    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
    const drawer = process.env.PPC_DRAWER_CODE || '1001';

    await page.goto(`${baseUrl}/ppc/operator/drawer-present?drawer=${drawer}`);
    await page.waitForSelector('.ppc-drawer-present');

    const compartmentsTitle = page.locator('.ppc-drawer-present__compartments-title');
    await expect(compartmentsTitle).toBeVisible();

    const countLocator = page.locator('.ppc-drawer-present__compartments-count');
    const emptyLocator = page.locator('.ppc-drawer-present__compartments-empty');

    const countText = (await countLocator.textContent()) || '';
    const countMatch = countText.match(/(\d+)/);
    const count = countMatch ? Number(countMatch[1]) : 0;

    // Attiva vista 3D
    await page.click('.ppc-drawer-present__view-toggle button:has-text("3D")');

    if (count > 0) {
      const canvas = page.locator('.ppc-drawer-present__visualization canvas').first();
      await expect(canvas).toBeVisible();
    } else {
      await expect(emptyLocator).toBeVisible();
    }
  });
});
