import { test, expect } from '@playwright/test';

test.describe('Diagnostic - Wizard Step 2 to 3 Transition', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('http://localhost:3001/');
    await page.evaluate(() => {
      const mockUser = { username: 'operatore1', role: 'Operatore' };
      const mockToken = 'mock-jwt-token-lists-test';

      localStorage.setItem('ejlog_auth_token', mockToken);
      localStorage.setItem('ejlog_user', JSON.stringify(mockUser));

      const authStore = {
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        }
      };
      localStorage.setItem('ejlog-auth-storage', JSON.stringify(authStore));
    });
  });

  test('Debug wizard Step 2 form filling and validation', async ({ page }) => {
    console.log('\n=== DIAGNOSTIC: Wizard Step 2 Debug ===\n');

    // Go to page
    await page.goto('http://localhost:3001/lists/management');
    await page.waitForTimeout(2000);

    // Open wizard
    console.log('1. Opening wizard...');
    await page.click('button:has-text("Crea Nuova Lista")');
    await page.waitForTimeout(800);

    // Check Step 1 loaded
    const step1Title = await page.locator('text=Step 1/3').count();
    console.log(`   Step 1 title visible: ${step1Title > 0}`);

    // Select Picking
    console.log('2. Selecting Picking...');
    await page.click('button:has-text("Picking")');
    await page.waitForTimeout(300);

    // Click Avanti
    console.log('3. Clicking Avanti (Step 1 → 2)...');
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(1000);

    // Check Step 2 loaded
    const step2Title = await page.locator('text=Step 2/3').count();
    console.log(`   Step 2 title visible: ${step2Title > 0}`);

    // Check form fields exist
    const descInput = page.locator('input[name="description"]');
    const assignedInput = page.locator('input[name="assignedTo"]');
    const prioritySelect = page.locator('select[name="priority"]');

    console.log('\n4. Checking form fields:');
    console.log(`   description input exists: ${await descInput.count() > 0}`);
    console.log(`   assignedTo input exists: ${await assignedInput.count() > 0}`);
    console.log(`   priority select exists: ${await prioritySelect.count() > 0}`);

    // Fill form
    console.log('\n5. Filling form...');

    await descInput.fill('Test Lista Picking Magazzino A');
    console.log('   description filled');
    await page.waitForTimeout(200);

    const descValue = await descInput.inputValue();
    console.log(`   description value: "${descValue}"`);

    await prioritySelect.selectOption('HIGH');
    console.log('   priority selected: HIGH');
    await page.waitForTimeout(200);

    const priorityValue = await prioritySelect.inputValue();
    console.log(`   priority value: "${priorityValue}"`);

    await assignedInput.fill('operatore1');
    console.log('   assignedTo filled');
    await page.waitForTimeout(500);

    const assignedValue = await assignedInput.inputValue();
    console.log(`   assignedTo value: "${assignedValue}"`);

    // Check for validation errors before clicking Avanti
    console.log('\n6. Checking for validation errors...');
    const errorMessages = await page.locator('.text-red-600').allTextContents();
    console.log(`   Error messages: ${errorMessages.length > 0 ? errorMessages.join(', ') : 'NONE'}`);

    // Take screenshot before clicking Avanti
    await page.screenshot({ path: 'wizard-step2-before-avanti.png' });
    console.log('   Screenshot saved: wizard-step2-before-avanti.png');

    // Click Avanti
    console.log('\n7. Clicking Avanti (Step 2 → 3)...');
    await page.click('button:has-text("Avanti")');
    await page.waitForTimeout(2000);

    // Check what step we're on now
    const step3Title = await page.locator('text=Step 3/3').count();
    const step2TitleStill = await page.locator('text=Step 2/3').count();

    console.log('\n8. After clicking Avanti:');
    console.log(`   Step 3 title visible: ${step3Title > 0}`);
    console.log(`   Still on Step 2: ${step2TitleStill > 0}`);

    // Check for toast/error messages
    const toastMessages = await page.locator('[role="status"], .toast, [class*="toast"]').allTextContents();
    if (toastMessages.length > 0) {
      console.log(`   Toast messages: ${toastMessages.join(', ')}`);
    }

    // Take screenshot after clicking Avanti
    await page.screenshot({ path: 'wizard-step2-after-avanti.png' });
    console.log('   Screenshot saved: wizard-step2-after-avanti.png');

    // Get full page text to see what's there
    const bodyText = await page.locator('body').textContent();
    console.log('\n9. Page text search:');
    console.log(`   Contains "Step 3/3": ${bodyText.includes('Step 3/3')}`);
    console.log(`   Contains "Riepilogo": ${bodyText.includes('Riepilogo')}`);
    console.log(`   Contains "Conferma": ${bodyText.includes('Conferma')}`);
    console.log(`   Contains "Compila tutti": ${bodyText.includes('Compila tutti')}`);

    console.log('\n=== END DIAGNOSTIC ===\n');
  });
});
