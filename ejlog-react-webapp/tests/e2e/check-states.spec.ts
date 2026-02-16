import { test, expect } from '@playwright/test';

test('Check Lists Page - Verify Real States', async ({ page }) => {
  console.log('🌐 Navigating to http://localhost:8090/lists...');

  await page.goto('http://localhost:8090/lists', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Get table content
  const tableText = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      return cells.map(cell => cell.textContent?.trim()).join(' | ');
    });
  });

  console.log('📋 Table rows:');
  tableText.forEach((row, idx) => {
    console.log(`  Row ${idx + 1}: ${row}`);
  });

  // Check status bar counts
  const statusCounts = await page.evaluate(() => {
    const waitingCount = document.querySelector('[data-testid="waiting-count"]')?.textContent;
    const inExecutionCount = document.querySelector('[data-testid="in-execution-count"]')?.textContent;
    const terminatedCount = document.querySelector('[data-testid="terminated-count"]')?.textContent;

    return {
      waiting: waitingCount || 'not found',
      inExecution: inExecutionCount || 'not found',
      terminated: terminatedCount || 'not found',
      fullText: document.body.innerText
    };
  });

  console.log('📊 Status counts from page:');
  console.log(`  In Attesa: ${statusCounts.waiting}`);
  console.log(`  In Esecuzione: ${statusCounts.inExecution}`);
  console.log(`  Terminate: ${statusCounts.terminated}`);

  // Take screenshot
  await page.screenshot({
    path: 'C:\\F_WMS\\dev\\workspacesEjlog\\EjLog\\documentazioni\\ejlog-react-webapp\\tests\\screenshots\\lists-states-check.png',
    fullPage: true
  });

  console.log('📸 Screenshot saved');
});
