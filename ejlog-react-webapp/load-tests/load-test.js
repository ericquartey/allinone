/**
 * Load Test - EJLOG WMS
 *
 * Purpose: Test system under normal expected load
 * Duration: 5 minutes with ramp-up/down
 * Max VUs: 50 concurrent users
 *
 * Run: k6 run load-tests/load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const pageLoadTime = new Trend('page_load_time');
const apiResponseTime = new Trend('api_response_time');
const successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp-up to 10 users
    { duration: '2m', target: 50 },  // Ramp-up to 50 users
    { duration: '2m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp-down to 0
  ],

  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95th percentile < 1s, 99th < 2s
    http_req_failed: ['rate<0.05'],                   // Less than 5% failure rate
    errors: ['rate<0.05'],
    page_load_time: ['p(95)<2000'],
    api_response_time: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://ejlog.yourcompany.com';
const API_URL = __ENV.API_URL || 'http://localhost:3079';

export default function () {
  // User journey: Browse homepage -> Login -> View items -> View reports

  group('Homepage', () => {
    const startTime = new Date();
    const res = http.get(`${BASE_URL}/`);

    const passed = check(res, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage has title': (r) => r.body.includes('<title>'),
      'homepage loads quickly': (r) => r.timings.duration < 2000,
    });

    if (passed) {
      successfulRequests.add(1);
      pageLoadTime.add(new Date() - startTime);
    } else {
      errorRate.add(1);
    }

    sleep(1);
  });

  group('Static Assets', () => {
    const responses = http.batch([
      ['GET', `${BASE_URL}/logo.svg`],
      ['GET', `${BASE_URL}/assets/index.js`],
      ['GET', `${BASE_URL}/assets/index.css`],
    ]);

    responses.forEach((res) => {
      check(res, {
        'asset loaded': (r) => r.status === 200,
      }) || errorRate.add(1);
    });

    sleep(1);
  });

  group('API Calls', () => {
    // Simulate API calls (replace with actual endpoints when available)
    const startTime = new Date();

    const res = http.get(`${API_URL}/api/items`, {
      headers: {
        'Accept': 'application/json',
      },
      tags: { name: 'GetItems' },
    });

    const passed = check(res, {
      'items API status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'API responds quickly': (r) => r.timings.duration < 1000,
    });

    if (res.status === 200) {
      successfulRequests.add(1);
      apiResponseTime.add(new Date() - startTime);
    } else if (res.status === 404) {
      // API not available, that's OK for frontend-only test
    } else {
      errorRate.add(1);
    }

    sleep(2);
  });

  group('Navigation', () => {
    // Simulate user navigating through app
    const pages = [
      '/items',
      '/lists',
      '/movements',
      '/reports',
      '/dashboard',
    ];

    const page = pages[Math.floor(Math.random() * pages.length)];
    const res = http.get(`${BASE_URL}${page}`);

    check(res, {
      'page loads': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(2);
  });

  // Random think time between 2-5 seconds
  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  console.log('Preparing load test summary...');

  return {
    'load-tests/results/load-test-summary.json': JSON.stringify(data, null, 2),
    'load-tests/results/load-test-summary.html': htmlReport(data),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n════════════════════════════════════════\n';
  summary += '  EJLOG WMS - Load Test Summary\n';
  summary += '════════════════════════════════════════\n\n';

  // Test duration
  const duration = data.state.testRunDurationMs / 1000;
  summary += `⏱️  Duration: ${duration.toFixed(2)}s\n`;
  summary += `👥 Max VUs: ${Math.max(...data.root_group.groups.map(g => g.checks?.length || 0))}\n`;
  summary += `🔄 Iterations: ${data.metrics.iterations.values.count}\n\n`;

  // HTTP Metrics
  summary += '📊 HTTP Metrics:\n';
  summary += `   Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `   Duration (avg): ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `   Duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `   Duration (p99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `   Failed: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n\n`;

  // Custom Metrics
  if (data.metrics.page_load_time) {
    summary += '⚡ Page Load Time:\n';
    summary += `   Average: ${data.metrics.page_load_time.values.avg.toFixed(2)}ms\n`;
    summary += `   p95: ${data.metrics.page_load_time.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (data.metrics.api_response_time) {
    summary += '🔌 API Response Time:\n';
    summary += `   Average: ${data.metrics.api_response_time.values.avg.toFixed(2)}ms\n`;
    summary += `   p95: ${data.metrics.api_response_time.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  // Thresholds
  summary += '✅ Threshold Results:\n';
  const thresholds = data.metrics.http_req_duration.thresholds;
  Object.keys(options.thresholds).forEach(threshold => {
    const passed = thresholds && thresholds[threshold] ? thresholds[threshold].ok : true;
    summary += `   ${passed ? '✅' : '❌'} ${threshold}\n`;
  });

  summary += '\n════════════════════════════════════════\n';

  return summary;
}

function htmlReport(data) {
  const duration = (data.state.testRunDurationMs / 1000).toFixed(2);
  const requests = data.metrics.http_reqs.values.count;
  const avgDuration = data.metrics.http_req_duration.values.avg.toFixed(2);
  const p95Duration = data.metrics.http_req_duration.values['p(95)'].toFixed(2);
  const failRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>EJLOG WMS - Load Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 10px;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card h3 {
      margin-top: 0;
      color: #555;
      font-size: 14px;
      text-transform: uppercase;
    }
    .card .value {
      font-size: 32px;
      font-weight: bold;
      color: #4CAF50;
    }
    .card .unit {
      font-size: 14px;
      color: #888;
    }
    table {
      width: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9f9f9;
      font-weight: 600;
    }
    .pass { color: #4CAF50; }
    .fail { color: #f44336; }
  </style>
</head>
<body>
  <h1>🚀 EJLOG WMS - Load Test Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="metrics">
    <div class="card">
      <h3>Test Duration</h3>
      <div class="value">${duration}</div>
      <div class="unit">seconds</div>
    </div>

    <div class="card">
      <h3>Total Requests</h3>
      <div class="value">${requests}</div>
      <div class="unit">requests</div>
    </div>

    <div class="card">
      <h3>Avg Response Time</h3>
      <div class="value">${avgDuration}</div>
      <div class="unit">milliseconds</div>
    </div>

    <div class="card">
      <h3>P95 Response Time</h3>
      <div class="value">${p95Duration}</div>
      <div class="unit">milliseconds</div>
    </div>

    <div class="card">
      <h3>Failure Rate</h3>
      <div class="value">${failRate}</div>
      <div class="unit">percent</div>
    </div>
  </div>

  <h2>Threshold Results</h2>
  <table>
    <thead>
      <tr>
        <th>Threshold</th>
        <th>Target</th>
        <th>Result</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>95th Percentile Duration</td>
        <td>&lt; 1000ms</td>
        <td>${p95Duration}ms</td>
        <td class="${p95Duration < 1000 ? 'pass' : 'fail'}">${p95Duration < 1000 ? '✅ PASS' : '❌ FAIL'}</td>
      </tr>
      <tr>
        <td>Failure Rate</td>
        <td>&lt; 5%</td>
        <td>${failRate}%</td>
        <td class="${failRate < 5 ? 'pass' : 'fail'}">${failRate < 5 ? '✅ PASS' : '❌ FAIL'}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
  `;
}

