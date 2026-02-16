import { test } from '@playwright/test';

test.describe('Apri Pagina Cassetti', () => {
  test('apri browser e mostra pagina gestione cassetti', async ({ page }) => {
    // Prova prima porta 3004, poi 3000
    let baseUrl = 'http://localhost:3004';

    try {
      await page.goto(baseUrl, { timeout: 5000 });
    } catch {
      console.log('Porta 3004 non disponibile, provo porta 3000...');
      baseUrl = 'http://localhost:3000';
      await page.goto(baseUrl);
    }

    console.log(`Aperta pagina su ${baseUrl}`);

    // Vai direttamente a Gestione Cassetti (auto-login integrato nella pagina)
    await page.goto(`${baseUrl}/drawers`);

    await page.getByRole('heading', { name: 'Gestione Cassetti' }).waitFor({ timeout: 15000 });
    await page.getByText('Ricerca Cassetti').waitFor({ timeout: 15000 });

    console.log('Pagina Gestione Cassetti caricata');
  });
});
