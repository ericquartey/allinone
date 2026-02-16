/**
 * Smoke Test - EJLOG WMS
 *
 * Purpose: Quick sanity check with minimal load
 * Duration: 1 minute
 * VUs: 1 virtual user
 *
 * Run: k6 run load-tests/smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  vus: 1, // 1 virtual user
  duration: '1m', // 1 minute

  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
    errors: ['rate<0.01'],             // Custom error rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://ejlog.yourcompany.com';

export default function () {
  // Test 1: Homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in <500ms': (r) => r.timings.duration < 500,
    'homepage has content': (r) => r.body.includes('EjLog WMS'),
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Health check
  res = http.get(`${BASE_URL}/health`);
  check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds healthy': (r) => r.body.includes('healthy'),
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Static assets
  res = http.get(`${BASE_URL}/logo.svg`);
  check(res, {
    'logo loads successfully': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'load-tests/results/smoke-test-summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  const indent = opts && opts.indent || '';
  let summary = '\n' + indent + '✓ Smoke Test Summary\n\n';

  summary += indent + `Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += indent + `VUs: ${data.options.vus}\n`;
  summary += indent + `Iterations: ${data.metrics.iterations.values.count}\n\n`;

  summary += indent + 'HTTP Metrics:\n';
  summary += indent + `  Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `  Duration (p95): ${data.metrics.http_req_duration.values['p(95)']}ms\n`;
  summary += indent + `  Failed: ${data.metrics.http_req_failed.values.rate * 100}%\n\n`;

  return summary;
}
