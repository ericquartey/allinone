import { test, expect } from '@playwright/test';

test('Verifica che il frontend sia raggiungibile su porta 3000', async ({ page }) => {
  console.log('🔍 Tentativo di connessione a http://localhost:3000...');

  try {
    const response = await page.goto('http://localhost:3000', {
      timeout: 10000,
      waitUntil: 'domcontentloaded'
    });

    console.log(`✅ Risposta ricevuta - Status: ${response?.status()}`);

    if (response?.ok()) {
      console.log('✅ Frontend raggiungibile!');
      await page.screenshot({ path: 'frontend-screenshot.png', fullPage: true });
      console.log('📸 Screenshot salvato in frontend-screenshot.png');
    } else {
      console.log(`❌ Errore HTTP: ${response?.status()} ${response?.statusText()}`);
    }

    expect(response?.ok()).toBeTruthy();

  } catch (error) {
    console.error('❌ Errore durante connessione:', error.message);
    throw error;
  }
});

test('Verifica che il backend sia raggiungibile su porta 8080', async ({ request }) => {
  console.log('🔍 Tentativo di connessione a http://localhost:8080/health...');

  try {
    const response = await request.get('http://localhost:8080/health', {
      timeout: 5000
    });

    console.log(`✅ Backend risponde - Status: ${response.status()}`);

    if (response.ok()) {
      const data = await response.json();
      console.log('📡 Backend health:', JSON.stringify(data, null, 2));
    }

    expect(response.ok()).toBeTruthy();

  } catch (error) {
    console.error('❌ Backend non raggiungibile:', error.message);
    throw error;
  }
});
