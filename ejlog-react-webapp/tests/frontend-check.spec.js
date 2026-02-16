import { test, expect } from '@playwright/test';

test('frontend should be accessible', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/EjLog/i);
  console.log('✓ Frontend is running on http://localhost:3000');
});
