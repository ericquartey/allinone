/**
 * Visual Diagnostic Test
 * Cattura screenshot e analizza stato UI corrente
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Visual Diagnostic - UI Complete Check', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3005', {
      waitUntil: 'networkidle',
      timeout: 10000
    });
  });

  test('Capture full page screenshot and analyze', async ({ page }) => {
    // Wait for potential loading
    await page.waitForTimeout(2000);

    // Capture full page screenshot
    const screenshotPath = path.join(__dirname, '../../screenshots/before-fix-fullpage.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);

    // Check if main elements are visible
    const checks = {
      header: await page.locator('header').isVisible().catch(() => false),
      sidebar: await page.locator('aside, nav[role="navigation"]').isVisible().catch(() => false),
      mainContent: await page.locator('main').isVisible().catch(() => false),
      logo: await page.locator('img[alt*="Ferretto"], img[alt*="logo"]').isVisible().catch(() => false),
    };

    console.log('Visibility Checks:', JSON.stringify(checks, null, 2));

    // Get computed styles of body
    const bodyStyles = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        margin: styles.margin,
        padding: styles.padding,
      };
    });

    console.log('Body Styles:', JSON.stringify(bodyStyles, null, 2));

    // Check if CSS is loaded
    const cssLoaded = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => ({
        href: (link as HTMLLinkElement).href,
        loaded: (link as HTMLLinkElement).sheet !== null
      }));
    });

    console.log('CSS Files:', JSON.stringify(cssLoaded, null, 2));

    // Check console errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    // Get all elements count
    const elementsCount = await page.evaluate(() => {
      return {
        total: document.querySelectorAll('*').length,
        divs: document.querySelectorAll('div').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        headers: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      };
    });

    console.log('Elements Count:', JSON.stringify(elementsCount, null, 2));
  });

  test('Check header component visibility and styling', async ({ page }) => {
    const header = page.locator('header').first();

    if (await header.isVisible()) {
      await header.screenshot({
        path: path.join(__dirname, '../../screenshots/before-fix-header.png')
      });

      const headerStyles = await header.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          backgroundColor: styles.backgroundColor,
          height: styles.height,
          padding: styles.padding,
        };
      });

      console.log('Header Styles:', JSON.stringify(headerStyles, null, 2));
    } else {
      console.log('Header NOT visible!');
    }
  });

  test('Check sidebar component visibility and styling', async ({ page }) => {
    const sidebar = page.locator('aside, nav[role="navigation"]').first();

    if (await sidebar.isVisible()) {
      await sidebar.screenshot({
        path: path.join(__dirname, '../../screenshots/before-fix-sidebar.png')
      });

      const sidebarStyles = await sidebar.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          width: styles.width,
          backgroundColor: styles.backgroundColor,
          position: styles.position,
        };
      });

      console.log('Sidebar Styles:', JSON.stringify(sidebarStyles, null, 2));
    } else {
      console.log('Sidebar NOT visible!');
    }
  });

  test('Check main content area visibility', async ({ page }) => {
    const main = page.locator('main').first();

    if (await main.isVisible()) {
      await main.screenshot({
        path: path.join(__dirname, '../../screenshots/before-fix-main.png')
      });

      const mainStyles = await main.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          display: styles.display,
          minHeight: styles.minHeight,
          padding: styles.padding,
          backgroundColor: styles.backgroundColor,
        };
      });

      console.log('Main Content Styles:', JSON.stringify(mainStyles, null, 2));
    } else {
      console.log('Main content NOT visible!');
    }
  });

  test('Extract HTML structure for analysis', async ({ page }) => {
    const htmlStructure = await page.evaluate(() => {
      const getStructure = (element: Element, depth: number = 0): any => {
        if (depth > 3) return null; // Limit depth

        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || undefined,
          classes: element.className ? element.className.split(' ').filter(Boolean) : [],
          children: Array.from(element.children).slice(0, 5).map(child => getStructure(child, depth + 1)).filter(Boolean)
        };
      };

      return getStructure(document.body);
    });

    console.log('HTML Structure:', JSON.stringify(htmlStructure, null, 2));

    // Save to file
    const structurePath = path.join(__dirname, '../../screenshots/html-structure.json');
    fs.writeFileSync(structurePath, JSON.stringify(htmlStructure, null, 2));
  });
});
