#!/usr/bin/env node

/**
 * EjLog WMS - Post-Deployment Verification Script
 *
 * This script verifies that a deployment was successful by:
 * 1. Checking HTTP response codes
 * 2. Verifying critical assets load
 * 3. Testing health endpoints
 * 4. Checking for common issues
 *
 * Usage:
 *   node verify-deployment.js <url>
 *
 * Example:
 *   node verify-deployment.js https://your-app.netlify.app
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
}

// Fetch URL and return response
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'EjLog-Deployment-Verifier/1.0',
      },
      timeout: 10000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Main verification function
async function verifyDeployment(baseUrl) {
  logSection('EJLOG WMS - POST-DEPLOYMENT VERIFICATION');

  logInfo(`Target URL: ${baseUrl}`);
  console.log('');

  let passed = 0;
  let failed = 0;
  let warnings = 0;

  // Test 1: Check main page loads
  logSection('TEST 1: Main Page Availability');
  try {
    const response = await fetchUrl(baseUrl);
    if (response.statusCode === 200) {
      logSuccess(`Main page loads successfully (HTTP ${response.statusCode})`);
      passed++;

      // Check if HTML contains expected elements
      if (response.body.includes('<div id="root">')) {
        logSuccess('Root div element found in HTML');
        passed++;
      } else {
        logWarning('Root div element not found - React may not mount correctly');
        warnings++;
      }

      // Check for common meta tags
      if (response.body.includes('<meta') && response.body.includes('viewport')) {
        logSuccess('Viewport meta tag present (mobile-friendly)');
        passed++;
      } else {
        logWarning('Viewport meta tag missing');
        warnings++;
      }

    } else {
      logError(`Main page returned HTTP ${response.statusCode}`);
      failed++;
    }
  } catch (error) {
    logError(`Failed to load main page: ${error.message}`);
    failed++;
  }

  // Test 2: Check HTTPS and security headers
  logSection('TEST 2: Security Configuration');
  try {
    const response = await fetchUrl(baseUrl);

    // Check if using HTTPS
    if (baseUrl.startsWith('https://')) {
      logSuccess('Using HTTPS (secure connection)');
      passed++;
    } else {
      logWarning('Not using HTTPS - recommended for production');
      warnings++;
    }

    // Check security headers
    const headers = response.headers;

    if (headers['x-frame-options']) {
      logSuccess(`X-Frame-Options header present: ${headers['x-frame-options']}`);
      passed++;
    } else {
      logWarning('X-Frame-Options header missing (clickjacking protection)');
      warnings++;
    }

    if (headers['x-content-type-options']) {
      logSuccess('X-Content-Type-Options header present');
      passed++;
    } else {
      logWarning('X-Content-Type-Options header missing');
      warnings++;
    }

  } catch (error) {
    logError(`Security check failed: ${error.message}`);
    failed++;
  }

  // Test 3: Check for common static assets
  logSection('TEST 3: Static Assets');

  const assetTests = [
    { path: '/assets/', description: 'Assets directory accessible' },
    { path: '/favicon.ico', description: 'Favicon present' },
  ];

  for (const test of assetTests) {
    try {
      const url = baseUrl + test.path;
      const response = await fetchUrl(url);

      if (response.statusCode === 200 || response.statusCode === 301 || response.statusCode === 302) {
        logSuccess(`${test.description} (HTTP ${response.statusCode})`);
        passed++;
      } else if (response.statusCode === 404) {
        logWarning(`${test.description} - not found (HTTP 404)`);
        warnings++;
      } else {
        logWarning(`${test.description} - unexpected status (HTTP ${response.statusCode})`);
        warnings++;
      }
    } catch (error) {
      logWarning(`${test.description} - check failed: ${error.message}`);
      warnings++;
    }
  }

  // Test 4: Check SPA routing
  logSection('TEST 4: Single Page Application Routing');
  try {
    // Test a route that should fallback to index.html
    const testRoute = baseUrl + '/non-existent-route-test-12345';
    const response = await fetchUrl(testRoute);

    if (response.statusCode === 200 && response.body.includes('<div id="root">')) {
      logSuccess('SPA routing configured correctly (fallback to index.html)');
      passed++;
    } else {
      logError('SPA routing not working - routes may return 404');
      logInfo('Configure your hosting platform to redirect all routes to index.html');
      failed++;
    }
  } catch (error) {
    logWarning(`SPA routing test failed: ${error.message}`);
    warnings++;
  }

  // Test 5: Performance check
  logSection('TEST 5: Performance Check');
  try {
    const startTime = Date.now();
    await fetchUrl(baseUrl);
    const loadTime = Date.now() - startTime;

    if (loadTime < 1000) {
      logSuccess(`Fast load time: ${loadTime}ms (excellent)`);
      passed++;
    } else if (loadTime < 3000) {
      logSuccess(`Good load time: ${loadTime}ms`);
      passed++;
    } else if (loadTime < 5000) {
      logWarning(`Slow load time: ${loadTime}ms (consider optimization)`);
      warnings++;
    } else {
      logError(`Very slow load time: ${loadTime}ms (needs optimization)`);
      failed++;
    }
  } catch (error) {
    logWarning(`Performance check failed: ${error.message}`);
    warnings++;
  }

  // Summary
  logSection('VERIFICATION SUMMARY');

  console.log('');
  log(`✅ Passed:   ${passed}`, 'green');
  log(`⚠️  Warnings: ${warnings}`, 'yellow');
  log(`❌ Failed:   ${failed}`, 'red');
  console.log('');

  const total = passed + warnings + failed;
  const score = Math.round((passed / total) * 100);

  if (failed === 0 && warnings === 0) {
    log(`🎉 PERFECT! All checks passed (${score}%)`, 'green');
  } else if (failed === 0) {
    log(`✅ GOOD! No critical failures (${score}%)`, 'green');
    logInfo('Review warnings above for potential improvements');
  } else {
    log(`❌ ISSUES DETECTED! (${score}%)`, 'red');
    logError('Critical failures detected. Review errors above.');
    process.exit(1);
  }

  console.log('');
  logInfo('Manual verification checklist:');
  console.log('  □ Open the URL in a web browser');
  console.log('  □ Test user login flow');
  console.log('  □ Navigate between pages');
  console.log('  □ Check browser console for errors (F12)');
  console.log('  □ Test on mobile device or responsive mode');
  console.log('  □ Verify data loads correctly from API');
  console.log('  □ Test export functionality (PDF, Excel, CSV)');
  console.log('');

  logInfo('For complete verification guide, see: POST_DEPLOYMENT_VERIFICATION.md');
  console.log('');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
${colors.bright}EjLog WMS - Post-Deployment Verification${colors.reset}

${colors.blue}Usage:${colors.reset}
  node verify-deployment.js <url>

${colors.blue}Example:${colors.reset}
  node verify-deployment.js https://your-app.netlify.app

${colors.blue}Description:${colors.reset}
  Verifies that your deployment is working correctly by:
  - Checking HTTP response codes
  - Verifying security headers
  - Testing static assets
  - Checking SPA routing configuration
  - Measuring load performance

${colors.blue}Exit Codes:${colors.reset}
  0 - All checks passed or only warnings
  1 - Critical failures detected
`);
  process.exit(0);
}

const targetUrl = args[0];

// Validate URL
try {
  new URL(targetUrl);
  verifyDeployment(targetUrl).catch(error => {
    logError('Verification failed with error:');
    console.error(error);
    process.exit(1);
  });
} catch (error) {
  logError('Invalid URL provided');
  logInfo('Usage: node verify-deployment.js <url>');
  logInfo('Example: node verify-deployment.js https://your-app.netlify.app');
  process.exit(1);
}
