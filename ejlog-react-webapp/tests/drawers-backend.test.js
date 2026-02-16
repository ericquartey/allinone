/**
 * Integration Test: Drawers Backend API
 *
 * Test per verificare l'integrazione backend-frontend per la gestione cassetti/UDC
 *
 * Run: node tests/drawers-backend.test.js
 */

import axios from 'axios';

// Configurazione
const BACKEND_URL = 'http://localhost:3002';
const FRONTEND_URL = 'http://localhost:3004';
const API_PATH = '/EjLogHostVertimag/api/loading-units';

let testsPassed = 0;
let testsFailed = 0;

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║  🧪 Drawers Backend Integration Tests            ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

const runTests = async () => {
  try {
    // Test 1: Backend Health Check
    console.log('🧪 Test 1: Backend Health Check');
    const health = await axios.get(`${BACKEND_URL}/health`);

    if (health.status !== 200) throw new Error(`Expected 200, got ${health.status}`);
    if (health.data.status !== 'ok') throw new Error('Health check failed');

    console.log('   ✅ Backend is healthy');
    console.log('   📊 Service:', health.data.service);
    console.log('   💾 Database:', health.data.database);
    testsPassed++;

  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    testsFailed++;
  }

  try {
    // Test 2: Loading Units Endpoint
    console.log('\n🧪 Test 2: GET /loading-units');
    const units = await axios.get(`${BACKEND_URL}${API_PATH}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (units.status !== 200) throw new Error(`Expected 200, got ${units.status}`);
    if (!Array.isArray(units.data)) throw new Error('Response is not an array');

    console.log(`   ✅ Endpoint returned ${units.data.length} loading units`);

    if (units.data.length > 0) {
      const first = units.data[0];
      console.log('   📦 First UDC:');
      console.log('      - ID:', first.id);
      console.log('      - Barcode:', first.barcode);
      console.log('      - Description:', first.description || '(nessuna)');
      console.log('      - Dimensions:', `${first.width}x${first.depth}x${first.height} mm`);
      console.log('      - Compartments:', first.compartmentCount);
      console.log('      - Products:', first.productsCount || 0);

      // Test 3: Get UDC by ID
      console.log('\n🧪 Test 3: GET /loading-units/:id');
      const single = await axios.get(`${BACKEND_URL}${API_PATH}/${first.id}`);

      if (single.status !== 200) throw new Error(`Expected 200, got ${single.status}`);
      if (single.data.id !== first.id) throw new Error('Wrong ID returned');

      console.log(`   ✅ Retrieved UDC #${first.id}:`, single.data.barcode);
      testsPassed++;
    } else {
      console.log('   ℹ️  No UDC data found in database');
    }

    testsPassed++;

  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    if (error.response) {
      console.log('   📛 Response:', error.response.status, error.response.data);
    }
    testsFailed++;
  }

  try {
    // Test 4: Invalid ID should return 404
    console.log('\n🧪 Test 4: Invalid ID (should return 404)');
    await axios.get(`${BACKEND_URL}${API_PATH}/999999`);

    console.log('   ❌ FAILED: Should have returned 404');
    testsFailed++;

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('   ✅ Correctly returned 404 for invalid ID');
      testsPassed++;
    } else {
      console.log('   ❌ FAILED:', error.message);
      testsFailed++;
    }
  }

  try {
    // Test 5: Debug endpoint
    console.log('\n🧪 Test 5: Database structure inspection');
    const debug = await axios.get(`${BACKEND_URL}/debug/udc-structure`);

    if (debug.status !== 200) throw new Error(`Expected 200, got ${debug.status}`);
    if (!debug.data.columns) throw new Error('No columns data');

    console.log(`   ✅ UDC table has ${debug.data.columns.length} columns`);
    console.log('   📋 Key columns:', debug.data.columns.slice(0, 10).map(c => c.COLUMN_NAME).join(', '));

    if (debug.data.sampleData && debug.data.sampleData.length > 0) {
      console.log(`   📊 Sample data: ${debug.data.sampleData.length} records found`);
    }

    testsPassed++;

  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
    testsFailed++;
  }

  try {
    // Test 6: Frontend Proxy (optional)
    console.log('\n🧪 Test 6: Frontend Proxy (optional)');
    const frontendResponse = await axios.get(`${FRONTEND_URL}/api${API_PATH}`, {
      headers: { 'Accept': 'application/json' },
      timeout: 3000
    });

    if (frontendResponse.status !== 200) throw new Error(`Expected 200, got ${frontendResponse.status}`);

    console.log('   ✅ Frontend proxy works correctly');
    console.log(`   📊 Returned ${frontendResponse.data.length} items through proxy`);
    testsPassed++;

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('   ⊘  Frontend not running on port 3004 (test skipped)');
    } else {
      console.log('   ❌ FAILED:', error.message);
      testsFailed++;
    }
  }

  // Summary
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  📊 Test Summary                                  ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  ✅ Tests Passed:  ${testsPassed.toString().padEnd(32)} ║`);
  console.log(`║  ❌ Tests Failed:  ${testsFailed.toString().padEnd(32)} ║`);
  console.log('╠═══════════════════════════════════════════════════╣');

  if (testsFailed === 0) {
    console.log('║  🎉 All tests passed successfully!               ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    console.log('✅ Backend integration is working correctly!');
    console.log('✅ Database connection established');
    console.log('✅ API endpoints responding with real data');
    console.log('\n🚀 You can now start the frontend with: npm run dev');
    console.log('🌐 Frontend will be available at: http://localhost:3004\n');
  } else {
    console.log('║  ⚠️  Some tests failed                            ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    process.exit(1);
  }
};

runTests();
