# Load Testing - EJLOG WMS

> Performance and load testing scripts using k6

**Version**: 2.3.12.4
**Tool**: Grafana k6
**Last Updated**: 26 Novembre 2025

---

## 📋 Overview

Load testing ensures EJLOG WMS can handle expected user traffic and maintains acceptable performance under load. We use [k6](https://k6.io/) for load testing.

---

## 🚀 Quick Start

### Install k6

**Windows**:
```bash
choco install k6
```

**macOS**:
```bash
brew install k6
```

**Linux**:
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Run Tests

```bash
# Smoke test (1 minute, 1 user)
k6 run load-tests/smoke-test.js

# Load test (5 minutes, up to 50 users)
k6 run load-tests/load-test.js

# Stress test (10 minutes, up to 200 users)
k6 run load-tests/stress-test.js

# Spike test (rapid load increase)
k6 run load-tests/spike-test.js

# With custom environment
k6 run --env BASE_URL=https://ejlog.yourcompany.com load-tests/load-test.js
```

---

## 📊 Test Types

### 1. Smoke Test (`smoke-test.js`)

**Purpose**: Minimal load sanity check

**Configuration**:
- Duration: 1 minute
- VUs: 1 user
- Purpose: Verify basic functionality

**When to run**:
- After every deployment
- Before running other load tests
- As part of CI/CD pipeline

**Expected results**:
- All requests successful (0% error rate)
- Response time < 500ms (p95)

### 2. Load Test (`load-test.js`)

**Purpose**: Test under normal expected load

**Configuration**:
- Duration: 5 minutes
- VUs: 10 → 50 users (ramp-up)
- Purpose: Verify system handles normal load

**When to run**:
- Weekly performance testing
- Before major releases
- After performance optimizations

**Expected results**:
- Error rate < 5%
- Response time < 1s (p95)
- Response time < 2s (p99)

### 3. Stress Test (`stress-test.js`)

**Purpose**: Find breaking point

**Configuration**:
- Duration: 10 minutes
- VUs: 50 → 200 users (gradual increase)
- Purpose: Identify maximum capacity

**When to run**:
- Capacity planning
- Before major traffic events
- Quarterly performance review

**Expected results**:
- System remains stable up to target load
- Graceful degradation beyond capacity
- No crashes or data corruption

### 4. Spike Test (`spike-test.js`)

**Purpose**: Test sudden traffic spikes

**Configuration**:
- Duration: 5 minutes
- VUs: 10 → 200 → 10 (rapid spike)
- Purpose: Verify system handles sudden load

**When to run**:
- Before anticipated traffic spikes
- Testing auto-scaling
- Disaster recovery testing

**Expected results**:
- System recovers from spike
- No permanent degradation
- Auto-scaling triggers (if configured)

---

## 🎯 Performance Targets

### Response Time Targets

| Percentile | Target | Warning | Critical |
|------------|--------|---------|----------|
| **p50 (median)** | < 200ms | < 500ms | > 500ms |
| **p95** | < 1000ms | < 2000ms | > 2000ms |
| **p99** | < 2000ms | < 3000ms | > 3000ms |

### Error Rate Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Error Rate** | < 0.1% | < 1% | > 5% |
| **Timeout Rate** | < 0.1% | < 0.5% | > 1% |

### Throughput Targets

| Metric | Target |
|--------|--------|
| **Concurrent Users** | 50+ |
| **Requests/Second** | 100+ |
| **Peak Users** | 200+ (stress test) |

---

## 📁 Test Structure

```
load-tests/
├── smoke-test.js          # Quick sanity check
├── load-test.js           # Normal load testing
├── stress-test.js         # High load testing
├── spike-test.js          # Sudden load spike
├── scenarios/
│   ├── user-journey.js    # Complete user workflow
│   ├── api-calls.js       # API-only testing
│   └── static-assets.js   # Static file loading
├── helpers/
│   ├── auth.js            # Authentication helpers
│   ├── data.js            # Test data generators
│   └── checks.js          # Common assertions
└── results/               # Test results (gitignored)
    ├── smoke-test-summary.json
    ├── load-test-summary.json
    └── load-test-summary.html
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Base URL for the application
export BASE_URL=https://ejlog.yourcompany.com

# API URL (if different)
export API_URL=https://api.ejlog.yourcompany.com

# Authentication (if needed)
export TEST_USERNAME=test-user
export TEST_PASSWORD=test-password

# Run tests
k6 run load-tests/load-test.js
```

### k6 Cloud (Optional)

For advanced features and cloud execution:

```bash
# Login to k6 cloud
k6 login cloud

# Run test in cloud
k6 cloud load-tests/load-test.js

# Stream results to cloud
k6 run --out cloud load-tests/load-test.js
```

---

## 📊 Analyzing Results

### Command Line Output

```
scenarios: (100.00%) 1 scenario, 50 max VUs, 6m30s max duration
✓ homepage status is 200
✓ homepage loads quickly

checks.........................: 100.00% ✓ 5000 ✗ 0
data_received..................: 15 MB   50 kB/s
data_sent......................: 500 kB  1.7 kB/s
http_req_blocked...............: avg=1.2ms    p(95)=3.5ms
http_req_connecting............: avg=1.1ms    p(95)=3.2ms
http_req_duration..............: avg=250ms    p(95)=850ms
http_req_failed................: 0.00%   ✓ 0    ✗ 5000
http_req_receiving.............: avg=0.5ms    p(95)=1.2ms
http_req_sending...............: avg=0.1ms    p(95)=0.3ms
http_req_tls_handshaking.......: avg=0ms      p(95)=0ms
http_req_waiting...............: avg=249.4ms  p(95)=848ms
http_reqs......................: 5000    16.666667/s
iterations.....................: 100     0.333333/s
vus............................: 50      min=1  max=50
vus_max........................: 50      min=50 max=50
```

### JSON Results

Results are saved to `load-tests/results/` directory:

```json
{
  "metrics": {
    "http_req_duration": {
      "type": "trend",
      "values": {
        "avg": 250.5,
        "min": 120.2,
        "med": 240.1,
        "max": 1200.5,
        "p(90)": 450.2,
        "p(95)": 850.3
      }
    },
    "http_req_failed": {
      "type": "rate",
      "values": {
        "rate": 0.002,
        "passes": 4990,
        "fails": 10
      }
    }
  }
}
```

### HTML Report

Open `load-tests/results/load-test-summary.html` in browser for visual report.

---

## 🧪 Writing Custom Tests

### Basic Test Template

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('https://ejlog.yourcompany.com');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'loads quickly': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Scenario-Based Testing

```javascript
export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
};
```

### Custom Metrics

```javascript
import { Trend, Rate, Counter } from 'k6/metrics';

const pageLoadTime = new Trend('page_load_time');
const errorRate = new Rate('errors');
const apiCalls = new Counter('api_calls');

export default function () {
  const start = Date.now();
  const res = http.get('https://ejlog.yourcompany.com');
  pageLoadTime.add(Date.now() - start);

  if (res.status !== 200) {
    errorRate.add(1);
  }

  apiCalls.add(1);
}
```

---

## 🔍 Troubleshooting

### High Error Rate

**Possible causes**:
- Server overloaded
- Database connection issues
- Network problems
- Rate limiting triggered

**Solutions**:
- Reduce VU count
- Increase ramp-up time
- Check server resources
- Verify rate limits

### Slow Response Times

**Possible causes**:
- Database queries slow
- No caching configured
- Large response payloads
- Network latency

**Solutions**:
- Optimize database queries
- Enable caching
- Reduce payload size
- Use CDN for static assets

### Test Hangs/Times Out

**Possible causes**:
- Server crashed
- Network timeout
- Infinite loop in code

**Solutions**:
- Set request timeouts
- Monitor server logs
- Check application health

---

## 📋 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/load-test.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run smoke test
        run: k6 run load-tests/smoke-test.js
        env:
          BASE_URL: https://ejlog.yourcompany.com

      - name: Run load test
        run: k6 run load-tests/load-test.js
        env:
          BASE_URL: https://ejlog.yourcompany.com

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: load-tests/results/
```

---

## 📚 Best Practices

### 1. Start Small

- Always run smoke test first
- Gradually increase load
- Monitor server resources

### 2. Realistic Scenarios

- Simulate actual user behavior
- Include think time (sleep)
- Mix different user journeys

### 3. Monitor Everything

- Server CPU/memory
- Database connections
- Network bandwidth
- Application errors

### 4. Regular Testing

- Weekly smoke tests
- Monthly load tests
- Quarterly stress tests

### 5. Document Results

- Save test results
- Track performance trends
- Share with team

---

## ✅ Load Testing Checklist

- [ ] k6 installed
- [ ] Smoke test passing
- [ ] Load test targets met
- [ ] Stress test completed
- [ ] Results documented
- [ ] Performance regressions identified
- [ ] Optimizations planned
- [ ] Team notified of results
- [ ] CI/CD integration configured
- [ ] Regular testing scheduled

---

## 📖 Resources

- **k6 Documentation**: https://k6.io/docs/
- **k6 Examples**: https://k6.io/docs/examples/
- **k6 Cloud**: https://k6.io/cloud/
- **Performance Testing Guide**: https://k6.io/docs/testing-guides/

---

<div align="center">

**EJLOG WMS - Load Testing**

*Test performance, ensure reliability, scale with confidence* ⚡

**Load test early, load test often!** 🚀

</div>
