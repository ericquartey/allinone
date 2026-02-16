/**
 * 🔵 Elio-React Health Check Monitor
 * Continuous health monitoring for frontend and backend services
 */

// Using native fetch available in Node.js 18+
const fs = require('fs').promises;
const path = require('path');

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
  },
  context7Path: path.join(__dirname, '../context7/monitoring-logs.json')
};

class HealthCheckMonitor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      checks: []
    };
  }

  async checkEndpoint(name, url, timeout) {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Origin': 'http://localhost:3012'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const result = {
        service: name,
        url: url,
        status: 'healthy',
        httpStatus: response.status,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
        }
      };

      console.log(`✅ ${name}: ${response.status} (${responseTime}ms)`);
      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result = {
        service: name,
        url: url,
        status: 'unhealthy',
        error: error.message,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };

      console.log(`❌ ${name}: ${error.message}`);
      return result;
    }
  }

  async runHealthChecks() {
    console.log('\n🔵 Elio-React Health Check - ' + new Date().toLocaleString());
    console.log('='.repeat(60));

    // Check frontend
    const frontendResult = await this.checkEndpoint(
      MONITORING_CONFIG.frontend.name,
      MONITORING_CONFIG.frontend.url,
      MONITORING_CONFIG.frontend.timeout
    );
    this.results.checks.push(frontendResult);

    // Check backend
    const backendResult = await this.checkEndpoint(
      MONITORING_CONFIG.backend.name,
      MONITORING_CONFIG.backend.url,
      MONITORING_CONFIG.backend.timeout
    );
    this.results.checks.push(backendResult);

    // Summary
    const allHealthy = this.results.checks.every(check => check.status === 'healthy');
    console.log('='.repeat(60));
    console.log(allHealthy ? '✅ All services healthy' : '⚠️  Some services unhealthy');
    console.log('');

    return this.results;
  }

  async saveToContext7() {
    try {
      // Read existing logs
      let logs = [];
      try {
        const existingData = await fs.readFile(MONITORING_CONFIG.context7Path, 'utf8');
        logs = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }

      // Add new result
      logs.push(this.results);

      // Keep only last 100 checks
      if (logs.length > 100) {
        logs = logs.slice(-100);
      }

      // Save to Context7
      await fs.mkdir(path.dirname(MONITORING_CONFIG.context7Path), { recursive: true });
      await fs.writeFile(
        MONITORING_CONFIG.context7Path,
        JSON.stringify(logs, null, 2),
        'utf8'
      );

      console.log(`💾 Saved to Context7: ${MONITORING_CONFIG.context7Path}`);
    } catch (error) {
      console.error(`❌ Failed to save to Context7: ${error.message}`);
    }
  }
}

// Run health check
async function main() {
  const monitor = new HealthCheckMonitor();
  await monitor.runHealthChecks();
  await monitor.saveToContext7();
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HealthCheckMonitor };
