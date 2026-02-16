// @ts-check
const { test } = require('@playwright/test');

test('Debug Sidebar visibility', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Listen for page errors
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3013');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check if Sidebar component is in the DOM
  const sidebar = await page.locator('aside').count();
  console.log(`\n🔍 Sidebar <aside> elements found: ${sidebar}`);

  if (sidebar > 0) {
    // Get sidebar attributes
    const sidebarElement = page.locator('aside').first();
    const classes = await sidebarElement.getAttribute('class');
    const style = await sidebarElement.getAttribute('style');

    console.log(`\n📋 Sidebar classes: ${classes}`);
    console.log(`📋 Sidebar inline style: ${style}`);

    // Check computed styles
    const computed = await sidebarElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        transform: styles.transform,
        zIndex: styles.zIndex,
        position: styles.position,
        left: styles.left,
        width: styles.width,
        backgroundColor: styles.backgroundColor,
      };
    });

    console.log('\n🎨 Computed styles:', JSON.stringify(computed, null, 2));

    // Check if sidebar has any children
    const menuItems = await page.locator('aside nav a').count();
    console.log(`\n📝 Menu items found: ${menuItems}`);
  }

  // Check if MainLayout is rendering
  const mainLayout = await page.locator('div.min-h-screen').count();
  console.log(`\n🏗️ MainLayout divs found: ${mainLayout}`);

  // Check Header
  const header = await page.locator('header').count();
  console.log(`📌 Header elements found: ${header}`);

  // Take screenshot for visual verification
  await page.screenshot({
    path: 'test-results/debug-sidebar.png',
    fullPage: true
  });

  console.log('\n📸 Screenshot saved to test-results/debug-sidebar.png');
});
