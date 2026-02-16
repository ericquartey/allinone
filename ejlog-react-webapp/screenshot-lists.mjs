import puppeteer from 'puppeteer';

async function screenshot() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:8093/lists', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'screenshots/lists-page-current.png', fullPage: true });

  console.log('✅ Screenshot saved to screenshots/lists-page-current.png');

  await browser.close();
}

screenshot().catch(console.error);
