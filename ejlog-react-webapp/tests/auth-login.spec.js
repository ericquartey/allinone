import { test, expect } from '@playwright/test';

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/');
  });

  test('should display login form', async ({ page }) => {
    // Check if we're on the login page
    await expect(page).toHaveURL(/.*login.*/i);

    // Verify login form elements are present
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    console.log('✓ Login form is displayed correctly');
  });

  test('should login with superuser credentials', async ({ page }) => {
    // Wait for login form to be ready
    await page.waitForLoadState('networkidle');

    // Find login form inputs
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Accedi")').first();

    // Fill in superuser credentials
    await usernameInput.fill('superuser');
    await passwordInput.fill('promag31');

    console.log('✓ Filled credentials: superuser / promag31');

    // Click login button
    await loginButton.click();

    // Wait for navigation or response
    await page.waitForTimeout(2000);

    // Check if we're redirected to dashboard or home
    const currentUrl = page.url();
    console.log('✓ Current URL after login:', currentUrl);

    // Verify we're no longer on login page
    const isStillOnLogin = currentUrl.includes('login');
    expect(isStillOnLogin).toBeFalsy();

    console.log('✓ Successfully logged in and redirected');
  });

  test('should test API endpoint directly', async ({ request }) => {
    // Test the login endpoint directly
    const response = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        username: 'superuser',
        password: 'promag31'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const responseData = await response.json();

    console.log('✓ API Response:', JSON.stringify(responseData, null, 2));

    expect(responseData.success).toBeTruthy();
    expect(responseData.user.username).toBe('superuser');
    expect(responseData.user.groupLevel).toBe(0);
    expect(responseData.token).toBeDefined();
    expect(responseData.isSuperuser).toBeTruthy();

    console.log('✓ API endpoint working correctly');
    console.log('✓ Token received:', responseData.token.substring(0, 50) + '...');
  });

  test('should reject invalid credentials', async ({ request }) => {
    const response = await request.post('http://localhost:8080/api/auth/login', {
      data: {
        username: 'invaliduser',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);

    const responseData = await response.json();
    expect(responseData.success).toBeFalsy();

    console.log('✓ Invalid credentials correctly rejected');
  });
});
