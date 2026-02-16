import { test, expect } from '@playwright/test';

test('PPC drawer-present shows EJLOG compartments for drawer 2', async ({ page }) => {
  const url = 'http://localhost:3000/ppc/operator/drawer-present?drawer=2';
  const responses: Array<{ url: string; status: number; body: string }> = [];

  page.on('response', async (response) => {
    const resUrl = response.url();
    if (!resUrl.includes('/api/udc/') || !resUrl.includes('/compartments')) return;
    try {
      const body = await response.text();
      responses.push({ url: resUrl, status: response.status(), body });
    } catch {
      // ignore
    }
  });

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait a bit for the compartments call to resolve
  await page.waitForTimeout(1500);

  if (responses.length === 0) {
    throw new Error('Nessuna risposta /api/udc/{id}/compartments intercettata. Verifica che il backend sia attivo.');
  }

  const last = responses[responses.length - 1];
  console.log('Compartment response URL:', last.url);
  console.log('Compartment response status:', last.status);
  console.log('Compartment response body (first 800 chars):', last.body.slice(0, 800));

  const listItems = page.locator('.ppc-drawer-present__list-item');
  await expect(listItems.first()).toBeVisible({ timeout: 5000 });
});
