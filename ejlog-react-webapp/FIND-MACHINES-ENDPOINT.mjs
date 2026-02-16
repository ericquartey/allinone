// FIND MACHINES ENDPOINT - Test vari endpoint possibili per machines/locations
import { chromium } from '@playwright/test';

(async () => {
  console.log('\n🔍 FIND MACHINES ENDPOINT - Testing various possible endpoints\n');

  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();

  const baseUrl = 'http://localhost:3077';
  const possiblePaths = [
    '/EjLogHostVertimag/machines',
    '/EjLogHostVertimag/api/machines',
    '/EjLogHostVertimag/locations',
    '/EjLogHostVertimag/api/locations',
    '/EjLogHostVertimag/warehouse/machines',
    '/EjLogHostVertimag/storage/machines',
    '/machines',
    '/api/machines',
    '/locations',
    '/api/locations',
    '/EjLogHostVertimag/Machine',
    '/EjLogHostVertimag/api/Machine',
    '/EjLogHostVertimag/Machines',
    '/EjLogHostVertimag/api/Machines',
  ];

  console.log(`Testing ${possiblePaths.length} possible endpoint paths...\n`);

  const results = [];

  for (const path of possiblePaths) {
    try {
      const url = `${baseUrl}${path}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
      const status = response.status();
      const contentType = response.headers()['content-type'] || '';

      let result = {
        path,
        status,
        contentType,
        isJson: contentType.includes('application/json'),
        bodyPreview: ''
      };

      if (status === 200) {
        const body = await response.text();
        result.bodyPreview = body.substring(0, 200);

        if (contentType.includes('application/json')) {
          try {
            const json = JSON.parse(body);
            result.isArray = Array.isArray(json);
            result.count = Array.isArray(json) ? json.length : 'object';
          } catch (e) {
            result.parseError = 'Invalid JSON';
          }
        }
      }

      results.push(result);

      const statusIcon = status === 200 ? '✅' : status === 404 ? '❌' : '⚠️';
      console.log(`${statusIcon} ${status} ${path}`);

      if (status === 200) {
        console.log(`   📦 Content-Type: ${contentType}`);
        if (result.isArray) {
          console.log(`   📊 Array with ${result.count} elements`);
        } else if (result.count === 'object') {
          console.log(`   📄 JSON object`);
        }
        if (result.bodyPreview && !contentType.includes('application/json')) {
          console.log(`   👁️  Preview: ${result.bodyPreview.replace(/\n/g, ' ')}`);
        }
        console.log('');
      }

    } catch (error) {
      console.log(`💥 ERROR ${path}: ${error.message}`);
      results.push({ path, error: error.message });
    }
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 SUMMARY OF RESULTS:');
  console.log('═══════════════════════════════════════════════════\n');

  const successfulEndpoints = results.filter(r => r.status === 200);
  const jsonEndpoints = results.filter(r => r.status === 200 && r.isJson);
  const arrayEndpoints = results.filter(r => r.status === 200 && r.isArray);

  console.log(`✅ Successful (200): ${successfulEndpoints.length}`);
  console.log(`📦 JSON responses: ${jsonEndpoints.length}`);
  console.log(`📊 Array responses: ${arrayEndpoints.length}`);
  console.log('');

  if (arrayEndpoints.length > 0) {
    console.log('🎯 FOUND ARRAY ENDPOINTS (most likely machines/locations):');
    arrayEndpoints.forEach(r => {
      console.log(`   ✅ ${r.path} → ${r.count} elements`);
    });
    console.log('');
  }

  if (jsonEndpoints.length > 0 && arrayEndpoints.length === 0) {
    console.log('📄 FOUND JSON OBJECT ENDPOINTS:');
    jsonEndpoints.forEach(r => {
      console.log(`   ✅ ${r.path} → JSON object`);
    });
    console.log('');
  }

  if (successfulEndpoints.length === 0) {
    console.log('❌ NO WORKING ENDPOINTS FOUND!');
    console.log('   Machines/locations endpoint might not exist in backend');
    console.log('');
  }

  await browser.close();
  console.log('✅ Test completato\n');
})();

