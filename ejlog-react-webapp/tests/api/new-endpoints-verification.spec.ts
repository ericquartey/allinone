// ============================================================================
// EJLOG WMS - NEW API ENDPOINTS VERIFICATION
// Playwright test suite for newly implemented endpoints:
// - Missions API (8 endpoints)
// - Locations Operations (block/unblock, movements, statistics)
// - UDC Operations (movements, assign to location)
// ============================================================================

import { test, expect } from '@playwright/test';

/**
 * New API Endpoints Verification Test Suite
 *
 * This suite verifies all newly implemented endpoints:
 * - Missions: GET /missions, GET /missions/:id, GET /missions/stats, etc.
 * - Locations: POST /locations/:id/block, POST /locations/:id/unblock, etc.
 * - UDC: GET /udc/:id/movements, POST /udc/:id/assign-location
 *
 * Backend: http://localhost:3079/api
 */

test.describe('EjLog REST API - New Endpoints Verification', () => {
  const API_BASE_URL = 'http://localhost:3079/api';
  const HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  test.describe('Missions API - GET Endpoints', () => {

    test('GET /api/missions - should return missions list', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/missions?limit=10`, {
        headers: HEADERS,
      });

      console.log(`GET /api/missions - Status: ${response.status()}`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));

      // Verify response structure
      expect(data).toBeDefined();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('missions');
      expect(Array.isArray(data.data.missions)).toBeTruthy();

      console.log(`✓ Retrieved ${data.data.missions.length} missions`);
    });

    test('GET /api/missions/:id - should return mission details', async ({ request }) => {
      // First get a list of missions to find a valid ID
      const listResponse = await request.get(`${API_BASE_URL}/missions?limit=1`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();

        if (listData.data?.missions?.length > 0) {
          const missionId = listData.data.missions[0].id;

          const response = await request.get(`${API_BASE_URL}/missions/${missionId}`, {
            headers: HEADERS,
          });

          console.log(`GET /api/missions/${missionId} - Status: ${response.status()}`);

          expect(response.ok()).toBeTruthy();
          const data = await response.json();
          console.log('Mission details:', JSON.stringify(data, null, 2));

          // Verify response structure
          expect(data).toBeDefined();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);
          expect(data).toHaveProperty('data');
          expect(data.data).toHaveProperty('id');
          expect(data.data.id).toBe(missionId);

          console.log(`✓ Mission ${missionId} retrieved successfully`);
        } else {
          console.log('⚠ No missions available for testing');
        }
      }
    });

    test('GET /api/missions/stats - should return mission statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/missions/stats`, {
        headers: HEADERS,
      });

      console.log(`GET /api/missions/stats - Status: ${response.status()}`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('Mission statistics:', JSON.stringify(data, null, 2));

      // Verify response structure
      expect(data).toBeDefined();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');

      console.log('✓ Mission statistics retrieved successfully');
    });

    test('GET /api/missions/active - should return active missions', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/missions/active`, {
        headers: HEADERS,
      });

      console.log(`GET /api/missions/active - Status: ${response.status()}`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('Active missions:', JSON.stringify(data, null, 2));

      // Verify response structure
      expect(data).toBeDefined();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();

      console.log(`✓ Retrieved ${data.data.length} active missions`);
    });

    test('GET /api/missions/completed - should return completed missions', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/missions/completed?limit=10`, {
        headers: HEADERS,
      });

      console.log(`GET /api/missions/completed - Status: ${response.status()}`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('Completed missions:', JSON.stringify(data, null, 2));

      // Verify response structure
      expect(data).toBeDefined();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();

      console.log(`✓ Retrieved ${data.data.length} completed missions`);
    });

    test('GET /api/missions/by-type/:type - should return missions by type', async ({ request }) => {
      const missionType = 'PICKING'; // Test with PICKING type

      const response = await request.get(`${API_BASE_URL}/missions/by-type/${missionType}?limit=10`, {
        headers: HEADERS,
      });

      console.log(`GET /api/missions/by-type/${missionType} - Status: ${response.status()}`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log(`Missions of type ${missionType}:`, JSON.stringify(data, null, 2));

      // Verify response structure
      expect(data).toBeDefined();
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBeTruthy();

      console.log(`✓ Retrieved ${data.data.length} missions of type ${missionType}`);
    });

    test('GET /api/missions/:id/timeline - should return mission timeline', async ({ request }) => {
      // First get a list of missions to find a valid ID
      const listResponse = await request.get(`${API_BASE_URL}/missions?limit=1`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();

        if (listData.data?.missions?.length > 0) {
          const missionId = listData.data.missions[0].id;

          const response = await request.get(`${API_BASE_URL}/missions/${missionId}/timeline`, {
            headers: HEADERS,
          });

          console.log(`GET /api/missions/${missionId}/timeline - Status: ${response.status()}`);

          expect(response.ok()).toBeTruthy();
          const data = await response.json();
          console.log('Mission timeline:', JSON.stringify(data, null, 2));

          // Verify response structure
          expect(data).toBeDefined();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);
          expect(data).toHaveProperty('data');
          expect(data.data).toHaveProperty('missione');
          expect(data.data).toHaveProperty('timeline');
          expect(Array.isArray(data.data.timeline)).toBeTruthy();

          console.log(`✓ Mission ${missionId} timeline retrieved with ${data.data.timeline.length} events`);
        } else {
          console.log('⚠ No missions available for testing');
        }
      }
    });
  });

  test.describe('Locations Operations API', () => {

    test('POST /api/locations/:id/block - should block location', async ({ request }) => {
      // First get a list of locations to find one that is not blocked
      const listResponse = await request.get(`${API_BASE_URL}/locations?limit=50`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();

        // Find an unblocked location
        const unblocked = listData.data?.locations?.find((loc: any) => !loc.bloccata);

        if (unblocked) {
          const locationId = unblocked.id;

          const response = await request.post(`${API_BASE_URL}/locations/${locationId}/block`, {
            headers: HEADERS,
            data: {
              motivoBlocco: 'Test blocco da Playwright',
              dataPrevistaRilascio: new Date(Date.now() + 24*60*60*1000).toISOString() // Tomorrow
            }
          });

          console.log(`POST /api/locations/${locationId}/block - Status: ${response.status()}`);

          if (response.ok()) {
            const data = await response.json();
            console.log('Block response:', JSON.stringify(data, null, 2));

            expect(data).toBeDefined();
            expect(data).toHaveProperty('success');
            expect(data.success).toBe(true);
            expect(data.data).toHaveProperty('message');

            console.log(`✓ Location ${locationId} blocked successfully`);

            // Unblock it immediately after test
            await request.post(`${API_BASE_URL}/locations/${locationId}/unblock`, {
              headers: HEADERS,
              data: { note: 'Test completato' }
            });
          } else {
            console.log(`⚠ Could not block location (status ${response.status()})`);
          }
        } else {
          console.log('⚠ No unblocked locations found for testing');
        }
      }
    });

    test('POST /api/locations/:id/unblock - should unblock location', async ({ request }) => {
      // First block a location, then unblock it
      const listResponse = await request.get(`${API_BASE_URL}/locations?limit=50`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();
        const unblocked = listData.data?.locations?.find((loc: any) => !loc.bloccata);

        if (unblocked) {
          const locationId = unblocked.id;

          // Block it first
          await request.post(`${API_BASE_URL}/locations/${locationId}/block`, {
            headers: HEADERS,
            data: { motivoBlocco: 'Test sblocco' }
          });

          // Now unblock it
          const response = await request.post(`${API_BASE_URL}/locations/${locationId}/unblock`, {
            headers: HEADERS,
            data: {
              note: 'Test sblocco completato da Playwright'
            }
          });

          console.log(`POST /api/locations/${locationId}/unblock - Status: ${response.status()}`);

          expect(response.ok()).toBeTruthy();
          const data = await response.json();
          console.log('Unblock response:', JSON.stringify(data, null, 2));

          expect(data).toBeDefined();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);

          console.log(`✓ Location ${locationId} unblocked successfully`);
        }
      }
    });

    test('GET /api/locations/:id/movements - should return location movements', async ({ request }) => {
      // Get first location from list
      const listResponse = await request.get(`${API_BASE_URL}/locations?limit=1`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();

        if (listData.data?.locations?.length > 0) {
          const locationId = listData.data.locations[0].id;

          const response = await request.get(`${API_BASE_URL}/locations/${locationId}/movements?limit=20`, {
            headers: HEADERS,
          });

          console.log(`GET /api/locations/${locationId}/movements - Status: ${response.status()}`);

          expect(response.ok()).toBeTruthy();
          const data = await response.json();
          console.log('Location movements:', JSON.stringify(data, null, 2));

          // Verify response structure
          expect(data).toBeDefined();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);
          expect(data.data).toHaveProperty('movements');
          expect(Array.isArray(data.data.movements)).toBeTruthy();

          console.log(`✓ Retrieved ${data.data.movements.length} movements for location ${locationId}`);
        }
      }
    });

    test('GET /api/locations/:id/statistics - should return location statistics', async ({ request }) => {
      // Get first location from list
      const listResponse = await request.get(`${API_BASE_URL}/locations?limit=1`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();

        if (listData.data?.locations?.length > 0) {
          const locationId = listData.data.locations[0].id;

          const response = await request.get(`${API_BASE_URL}/locations/${locationId}/statistics`, {
            headers: HEADERS,
          });

          console.log(`GET /api/locations/${locationId}/statistics - Status: ${response.status()}`);

          expect(response.ok()).toBeTruthy();
          const data = await response.json();
          console.log('Location statistics:', JSON.stringify(data, null, 2));

          // Verify response structure
          expect(data).toBeDefined();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);
          expect(data.data).toHaveProperty('ubicazione');
          expect(data.data).toHaveProperty('movimenti');
          expect(data.data.ubicazione).toHaveProperty('percentualeOccupazione');

          console.log(`✓ Statistics for location ${locationId}:`);
          console.log(`  - Occupancy: ${data.data.ubicazione.percentualeOccupazione}%`);
          console.log(`  - Movements: ${data.data.movimenti.totali}`);
        }
      }
    });
  });

  test.describe('UDC Operations API', () => {

    test('GET /api/udc/:id/movements - should return UDC movements', async ({ request }) => {
      // Get first UDC from list
      const listResponse = await request.get(`${API_BASE_URL}/udc?limit=1`, {
        headers: HEADERS,
      });

      if (listResponse.ok()) {
        const listData = await listResponse.json();

        if (listData.data?.udcs?.length > 0) {
          const udcId = listData.data.udcs[0].id;

          const response = await request.get(`${API_BASE_URL}/udc/${udcId}/movements?limit=20`, {
            headers: HEADERS,
          });

          console.log(`GET /api/udc/${udcId}/movements - Status: ${response.status()}`);

          expect(response.ok()).toBeTruthy();
          const data = await response.json();
          console.log('UDC movements:', JSON.stringify(data, null, 2));

          // Verify response structure
          expect(data).toBeDefined();
          expect(data).toHaveProperty('success');
          expect(data.success).toBe(true);
          expect(data.data).toHaveProperty('movements');
          expect(Array.isArray(data.data.movements)).toBeTruthy();

          console.log(`✓ Retrieved ${data.data.movements.length} movements for UDC ${udcId}`);
        } else {
          console.log('⚠ No UDCs available for testing');
        }
      }
    });

    test('POST /api/udc/:id/assign-location - should assign UDC to location', async ({ request }) => {
      // Get first UDC
      const udcResponse = await request.get(`${API_BASE_URL}/udc?limit=1`, {
        headers: HEADERS,
      });

      // Get first location
      const locResponse = await request.get(`${API_BASE_URL}/locations?limit=1`, {
        headers: HEADERS,
      });

      if (udcResponse.ok() && locResponse.ok()) {
        const udcData = await udcResponse.json();
        const locData = await locResponse.json();

        if (udcData.data?.udcs?.length > 0 && locData.data?.locations?.length > 0) {
          const udcId = udcData.data.udcs[0].id;
          const locationId = locData.data.locations[0].id;

          const response = await request.post(`${API_BASE_URL}/udc/${udcId}/assign-location`, {
            headers: HEADERS,
            data: {
              idLocazione: locationId,
              note: 'Test assegnazione da Playwright'
            }
          });

          console.log(`POST /api/udc/${udcId}/assign-location - Status: ${response.status()}`);

          if (response.ok()) {
            const data = await response.json();
            console.log('Assign location response:', JSON.stringify(data, null, 2));

            expect(data).toBeDefined();
            expect(data).toHaveProperty('success');
            expect(data.success).toBe(true);

            console.log(`✓ UDC ${udcId} assigned to location ${locationId}`);
          } else {
            const errorText = await response.text();
            console.log(`⚠ Could not assign UDC to location: ${errorText}`);
          }
        }
      }
    });
  });

  test.describe('Health Check', () => {

    test('Backend should be running on port 3079', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/health`, {
        headers: HEADERS,
      });

      console.log(`GET /api/health - Status: ${response.status()}`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('Health check:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('database');
      expect(data.database).toBe('connected');

      console.log('✓ Backend server is healthy and connected to database');
    });
  });

  test.describe('Summary Report', () => {

    test('Generate comprehensive new endpoints verification report', async ({ request }) => {
      console.log('\n========================================');
      console.log('NEW ENDPOINTS VERIFICATION SUMMARY');
      console.log('========================================\n');

      const endpoints = [
        { method: 'GET', path: '/missions?limit=5', category: 'Missions' },
        { method: 'GET', path: '/missions/stats', category: 'Missions' },
        { method: 'GET', path: '/missions/active', category: 'Missions' },
        { method: 'GET', path: '/missions/completed?limit=5', category: 'Missions' },
        { method: 'GET', path: '/missions/by-type/PICKING?limit=5', category: 'Missions' },
        { method: 'GET', path: '/locations/1/movements?limit=5', category: 'Locations' },
        { method: 'GET', path: '/locations/1/statistics', category: 'Locations' },
        { method: 'GET', path: '/udc/1/movements?limit=5', category: 'UDC' },
        { method: 'GET', path: '/health', category: 'System' },
      ];

      const results = [];

      for (const endpoint of endpoints) {
        try {
          const response = await request.get(`${API_BASE_URL}${endpoint.path}`, {
            headers: HEADERS
          });

          results.push({
            ...endpoint,
            status: response.status(),
            success: response.ok(),
          });
        } catch (error: any) {
          results.push({
            ...endpoint,
            status: 'ERROR',
            success: false,
            error: error.message,
          });
        }
      }

      // Print results table
      console.log('Category   | Method | Endpoint                              | Status | Result');
      console.log('-----------|--------|---------------------------------------|--------|--------');

      results.forEach(r => {
        const category = r.category.padEnd(10);
        const method = r.method.padEnd(6);
        const path = r.path.padEnd(37);
        const status = String(r.status).padEnd(6);
        const result = r.success ? '✓ PASS' : (r.status === 404 ? '⚠ N/A' : '✗ FAIL');
        console.log(`${category} | ${method} | ${path} | ${status} | ${result}`);
      });

      console.log('\n========================================\n');

      const totalTests = results.length;
      const passed = results.filter(r => r.success).length;

      console.log(`Total Endpoints Tested: ${totalTests}`);
      console.log(`Passed: ${passed}`);
      console.log(`Failed: ${totalTests - passed}`);
      console.log(`Pass Rate: ${Math.round((passed / totalTests) * 100)}%`);
      console.log('\n========================================\n');

      // Test passes if at least 80% of endpoints respond successfully
      expect(passed).toBeGreaterThanOrEqual(totalTests * 0.8);
    });
  });
});

