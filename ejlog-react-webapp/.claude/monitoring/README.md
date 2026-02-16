# 🔵 Elio-React Continuous Monitoring System

Automated monitoring and testing system for the EjLog React WebApp + Java backend.

---

## 📁 Structure

```
.claude/monitoring/
├── README.md              # This file
├── health-check.cjs       # Health check script for frontend/backend
├── scheduler.cjs          # Task scheduler for continuous monitoring
└── ../context7/
    ├── monitoring-logs.json    # Health check results
    └── scheduler-logs.json     # Scheduler execution logs
```

---

## 🎯 What It Does

### Continuous Monitoring Tasks

#### Every 5 Minutes ⏱️
- **Health Check**: Backend API (http://localhost:7079)
- **Health Check**: Frontend Dev Server (http://localhost:3012)
- **CORS Headers**: Validation
- **Response Time**: Monitoring

#### Every 15 Minutes ⏱️
- **Playwright Critical Tests**: Core functionality
- **API Endpoints**: Verification
- **Navigation Paths**: Testing
- **Error Handling**: Validation

#### Every Hour ⏱️
- **Performance Benchmarks**: Load times, rendering metrics
- **Memory Usage**: Leak detection
- **Security Scan**: Basic vulnerability checks

#### Daily ⏱️
- **Full Test Suite**: Complete Playwright tests
- **Bundle Size**: Optimization check
- **Context7 Memory**: Consolidation

---

## 🚀 Quick Start

### 1. Run Health Check (One-Time)

```bash
cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp
node .claude/monitoring/health-check.cjs
```

**Output**:
```
🔵 Elio-React Health Check - 11/21/2025, 10:30:00 AM
============================================================
✅ React Dev Server: 200 (120ms)
✅ Java REST API: 200 (450ms)
============================================================
✅ All services healthy

💾 Saved to Context7: .claude/context7/monitoring-logs.json
```

### 2. Run Playwright Monitoring Tests

```bash
cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp
npx playwright test tests/elio-monitoring.spec.cjs --reporter=line
```

**Tests Included**:
- Health Check: Frontend loads successfully
- Health Check: Backend API responds
- CORS Check: Headers present on API responses
- Navigation: Main routes are accessible
- Error Handling: API errors handled gracefully
- Performance: Lists page renders efficiently
- Performance: No memory leaks on navigation
- Security: No exposed credentials in source
- Security: HTTPS headers configured

### 3. Start Continuous Monitoring (Always Active Mode)

```bash
cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp
node .claude/monitoring/scheduler.cjs
```

**Output**:
```
🔵 Elio-React Monitoring Scheduler Starting
======================================================================
Started at: 11/21/2025, 10:30:00 AM
Node.js: v18.17.0
Platform: win32
======================================================================

⏰ Scheduled: Health Check (5 min) every 300s
⏰ Scheduled: Playwright Critical Tests (15 min) every 900s
⏰ Scheduled: Performance Benchmark (1 hour) every 3600s
⏸️  Skipping disabled task: Full Test Suite (Daily)

✅ All monitoring tasks scheduled
Press Ctrl+C to stop
```

---

## 📊 Monitoring Configuration

### Schedule Configuration (`scheduler.cjs`)

```javascript
const SCHEDULE_CONFIG = {
  healthCheck5min: {
    name: 'Health Check (5 min)',
    interval: 5 * 60 * 1000, // 5 minutes
    script: 'health-check.cjs',
    enabled: true
  },
  playwrightCritical15min: {
    name: 'Playwright Critical Tests (15 min)',
    interval: 15 * 60 * 1000, // 15 minutes
    command: 'npx playwright test tests/elio-monitoring.spec.cjs --reporter=line',
    enabled: true
  },
  performanceBenchmark1hour: {
    name: 'Performance Benchmark (1 hour)',
    interval: 60 * 60 * 1000, // 1 hour
    command: 'npx playwright test tests/elio-monitoring.spec.cjs --grep "Performance" --reporter=json',
    enabled: true
  },
  fullTestSuiteDaily: {
    name: 'Full Test Suite (Daily)',
    interval: 24 * 60 * 60 * 1000, // 24 hours
    enabled: false // Enable manually if needed
  }
};
```

### Health Check Configuration

```javascript
const MONITORING_CONFIG = {
  frontend: {
    url: 'http://localhost:3012',
    name: 'React Dev Server',
    timeout: 5000
  },
  backend: {
    url: 'http://localhost:7079/EjLogHostVertimag/Lists',
    name: 'Java REST API',
    timeout: 5000
  }
};
```

---

## 📈 Context7 Integration

All monitoring results are automatically saved to Context7 memory:

### Monitoring Logs Structure

**File**: `.claude/context7/monitoring-logs.json`

```json
[
  {
    "timestamp": "2025-11-21T22:30:00.000Z",
    "checks": [
      {
        "service": "React Dev Server",
        "url": "http://localhost:3012",
        "status": "healthy",
        "httpStatus": 200,
        "responseTime": "120ms",
        "timestamp": "2025-11-21T22:30:00.000Z"
      },
      {
        "service": "Java REST API",
        "url": "http://localhost:7079/EjLogHostVertimag/Lists",
        "status": "healthy",
        "httpStatus": 200,
        "responseTime": "450ms",
        "timestamp": "2025-11-21T22:30:00.000Z",
        "corsHeaders": {
          "access-control-allow-origin": "http://localhost:3012",
          "access-control-allow-credentials": "true"
        }
      }
    ]
  }
]
```

### Scheduler Logs Structure

**File**: `.claude/context7/scheduler-logs.json`

```json
[
  {
    "task": "healthCheck5min",
    "name": "Health Check (5 min)",
    "timestamp": "2025-11-21T22:30:00.000Z",
    "duration": "580ms",
    "success": true,
    "output": "✅ All services healthy..."
  }
]
```

---

## 🛠️ Customization

### Enable/Disable Tasks

Edit `scheduler.cjs` and modify the `enabled` field:

```javascript
fullTestSuiteDaily: {
  name: 'Full Test Suite (Daily)',
  interval: 24 * 60 * 60 * 1000,
  enabled: true  // Change to true to enable
}
```

### Adjust Intervals

Modify the `interval` value (in milliseconds):

```javascript
healthCheck5min: {
  interval: 10 * 60 * 1000, // Change to 10 minutes
}
```

### Add Custom Endpoints

Edit `health-check.cjs` to add more endpoints:

```javascript
const thirdPartyAPI = await this.checkEndpoint(
  'Third Party API',
  'https://api.example.com/status',
  5000
);
this.results.checks.push(thirdPartyAPI);
```

---

## 🔍 Troubleshooting

### Health Check Fails

**Issue**: Health check reports unhealthy services

**Solution**:
1. Verify frontend dev server is running: `npm run dev`
2. Verify backend server is running on port 7079
3. Check CORS configuration in `RESTServer.java`

### Playwright Tests Fail

**Issue**: Playwright tests timeout or fail

**Solution**:
1. Install Playwright browsers: `npx playwright install`
2. Increase timeout in test file: `timeout: 10000`
3. Run tests in headed mode to see browser: `npx playwright test --headed`

### Scheduler Doesn't Run

**Issue**: Scheduler exits immediately

**Solution**:
1. Check Node.js version: `node --version` (should be v14+)
2. Verify file paths are correct
3. Check for syntax errors: `node --check scheduler.cjs`

---

## 📝 Best Practices

### When to Use

1. **Development**: Run health checks before starting work
2. **Deployment**: Run full test suite before deploying
3. **Production Monitoring**: Use scheduler for continuous monitoring
4. **CI/CD Integration**: Run tests in CI pipeline

### Performance Considerations

1. **Headless Mode**: Use `--headed` only for debugging
2. **Parallel Tests**: Playwright runs tests in parallel by default
3. **Test Isolation**: Each test runs in a fresh browser context
4. **Resource Limits**: Monitor memory usage with long-running scheduler

### Security

1. **Credentials**: Never log or expose credentials
2. **Origins**: Keep CORS origins configuration up to date
3. **HTTPS**: Use HTTPS in production
4. **Headers**: Validate security headers in production

---

## 🚀 Integration with Elio-React

This monitoring system is **fully integrated** with Elio-React agent:

1. **Context7 Memory**: All monitoring data is stored in Context7
2. **ADR Tracking**: Issues discovered are logged as ADRs
3. **Pattern Recognition**: Recurring issues trigger pattern creation
4. **Performance Metrics**: Baseline metrics tracked over time

---

## 📅 Maintenance

### Log Rotation

Monitoring logs automatically keep only:
- **Last 100 health checks** (monitoring-logs.json)
- **Last 200 scheduler runs** (scheduler-logs.json)

### Updates

When updating monitoring:
1. Stop scheduler: `Ctrl+C`
2. Update configuration files
3. Test changes: `node health-check.cjs`
4. Restart scheduler: `node scheduler.cjs`

---

## 📞 Support

**Issues**: Report to Elio-React via Context7

**Documentation**: See main Elio-React agent docs in `.claude/agents/elio-react.md`

**Context7**: Memory database in `.claude/context7/elio-memory.json`

---

**Maintained by**: Elio-React 🔵
**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Status**: Active ✅
