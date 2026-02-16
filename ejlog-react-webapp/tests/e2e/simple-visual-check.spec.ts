/**
 * Simple Visual Check
 * Cattura screenshot e mostra errori console
 */
import { test } from '@playwright/test';
import * as path from 'path';

test('Visual check with console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  // Listen for console events
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    consoleErrors.push(`PAGE ERROR: ${error.message}`);
  });

  // Navigate to the app
  await page.goto('http://localhost:3005', {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({
    path: 'screenshots/after-fix.png',
    fullPage: true
  });

  console.log('\n=== SCREENSHOT SAVED ===');
  console.log('Path: screenshots/after-fix.png');

  // Print console errors
  console.log('\n=== CONSOLE ERRORS ===');
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((err, i) => {
      console.log(`${i + 1}. ${err}`);
    });
  } else {
    console.log('No console errors!');
  }

  // Print console warnings
  console.log('\n=== CONSOLE WARNINGS ===');
  if (consoleWarnings.length > 0) {
    consoleWarnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn}`);
    });
  } else {
    console.log('No console warnings!');
  }

  // Check what's actually rendered
  const headerExists = await page.locator('header').count();
  const sidebarExists = await page.locator('aside').count();
  const mainExists = await page.locator('main').count();

  console.log('\n=== ELEMENTS COUNT ===');
  console.log(`Header elements: ${headerExists}`);
  console.log(`Sidebar elements: ${sidebarExists}`);
  console.log(`Main elements: ${mainExists}`);

  // Get header inner HTML
  if (headerExists > 0) {
    const headerHTML = await page.locator('header').first().innerHTML();
    console.log('\n=== HEADER HTML ===');
    console.log(headerHTML.substring(0, 500)); // First 500 chars
  }

  // Get sidebar inner HTML
  if (sidebarExists > 0) {
    const sidebarHTML = await page.locator('aside').first().innerHTML();
    console.log('\n=== SIDEBAR HTML ===');
    console.log(sidebarHTML.substring(0, 500)); // First 500 chars
  }
});
