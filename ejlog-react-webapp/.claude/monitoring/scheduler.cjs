/**
 * 🔵 Elio-React Monitoring Scheduler
 * Manages continuous monitoring tasks at different intervals
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const SCHEDULE_CONFIG = {
  healthCheck5min: {
    name: 'Health Check (5 min)',
    interval: 5 * 60 * 1000, // 5 minutes
    script: path.join(__dirname, 'health-check.cjs'),
    enabled: true
  },
  playwrightCritical15min: {
    name: 'Playwright Critical Tests (15 min)',
    interval: 15 * 60 * 1000, // 15 minutes
    command: 'npx playwright test tests/elio-monitoring.spec.cjs --reporter=line',
    cwd: path.join(__dirname, '../..'),
    enabled: true
  },
  performanceBenchmark1hour: {
    name: 'Performance Benchmark (1 hour)',
    interval: 60 * 60 * 1000, // 1 hour
    command: 'npx playwright test tests/elio-monitoring.spec.cjs --grep "Performance" --reporter=json',
    cwd: path.join(__dirname, '../..'),
    enabled: true
  },
  fullTestSuiteDaily: {
    name: 'Full Test Suite (Daily)',
    interval: 24 * 60 * 60 * 1000, // 24 hours
    command: 'npx playwright test tests/elio-monitoring.spec.cjs --reporter=html',
    cwd: path.join(__dirname, '../..'),
    enabled: false // Disabled by default, enable manually
  }
};

class MonitoringScheduler {
  constructor() {
    this.timers = new Map();
    this.running = false;
    this.context7Path = path.join(__dirname, '../context7/scheduler-logs.json');
  }

  async runTask(taskName, taskConfig) {
    console.log(`\n🔵 [${new Date().toLocaleString()}] Running: ${taskConfig.name}`);
    console.log('='.repeat(70));

    const startTime = Date.now();
    let success = false;
    let output = '';
    let error = '';

    try {
      if (taskConfig.script) {
        // Run Node.js script
        const result = await this.runScript(taskConfig.script);
        success = result.code === 0;
        output = result.output;
        error = result.error;
      } else if (taskConfig.command) {
        // Run shell command
        const result = await this.runCommand(taskConfig.command, taskConfig.cwd);
        success = result.code === 0;
        output = result.output;
        error = result.error;
      }

      const duration = Date.now() - startTime;
      console.log(`${success ? '✅' : '❌'} ${taskConfig.name} completed in ${duration}ms`);

      // Log to Context7
      await this.logToContext7({
        task: taskName,
        name: taskConfig.name,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        success,
        output: output.substring(0, 500), // Limit output size
        error: error.substring(0, 500)
      });

    } catch (err) {
      console.error(`❌ Error running ${taskConfig.name}:`, err.message);
      await this.logToContext7({
        task: taskName,
        name: taskConfig.name,
        timestamp: new Date().toISOString(),
        success: false,
        error: err.message
      });
    }

    console.log('='.repeat(70) + '\n');
  }

  runScript(scriptPath) {
    return new Promise((resolve) => {
      let output = '';
      let error = '';

      const child = spawn('node', [scriptPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        process.stderr.write(text);
      });

      child.on('close', (code) => {
        resolve({ code, output, error });
      });
    });
  }

  runCommand(command, cwd) {
    return new Promise((resolve) => {
      let output = '';
      let error = '';

      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/sh';
      const shellArgs = isWindows ? ['/c', command] : ['-c', command];

      const child = spawn(shell, shellArgs, {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        process.stderr.write(text);
      });

      child.on('close', (code) => {
        resolve({ code, output, error });
      });
    });
  }

  async logToContext7(logEntry) {
    try {
      let logs = [];
      try {
        const existingData = await fs.readFile(this.context7Path, 'utf8');
        logs = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist yet
      }

      logs.push(logEntry);

      // Keep only last 200 entries
      if (logs.length > 200) {
        logs = logs.slice(-200);
      }

      await fs.mkdir(path.dirname(this.context7Path), { recursive: true });
      await fs.writeFile(this.context7Path, JSON.stringify(logs, null, 2), 'utf8');

    } catch (error) {
      console.error(`❌ Failed to log to Context7: ${error.message}`);
    }
  }

  scheduleTask(taskName, taskConfig) {
    if (!taskConfig.enabled) {
      console.log(`⏸️  Skipping disabled task: ${taskConfig.name}`);
      return;
    }

    console.log(`⏰ Scheduled: ${taskConfig.name} every ${taskConfig.interval / 1000}s`);

    // Run immediately on start
    this.runTask(taskName, taskConfig);

    // Schedule recurring execution
    const timer = setInterval(() => {
      this.runTask(taskName, taskConfig);
    }, taskConfig.interval);

    this.timers.set(taskName, timer);
  }

  start() {
    if (this.running) {
      console.log('⚠️  Scheduler already running');
      return;
    }

    console.log('\n🔵 Elio-React Monitoring Scheduler Starting');
    console.log('='.repeat(70));
    console.log(`Started at: ${new Date().toLocaleString()}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log('='.repeat(70) + '\n');

    this.running = true;

    // Schedule all tasks
    for (const [taskName, taskConfig] of Object.entries(SCHEDULE_CONFIG)) {
      this.scheduleTask(taskName, taskConfig);
    }

    console.log('\n✅ All monitoring tasks scheduled');
    console.log('Press Ctrl+C to stop\n');
  }

  stop() {
    if (!this.running) {
      return;
    }

    console.log('\n🛑 Stopping Elio-React Monitoring Scheduler...');

    for (const [taskName, timer] of this.timers.entries()) {
      clearInterval(timer);
      console.log(`✅ Stopped: ${taskName}`);
    }

    this.timers.clear();
    this.running = false;

    console.log('✅ Scheduler stopped\n');
  }
}

// CLI Interface
if (require.main === module) {
  const scheduler = new MonitoringScheduler();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n');
    scheduler.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    scheduler.stop();
    process.exit(0);
  });

  // Start the scheduler
  scheduler.start();
}

module.exports = { MonitoringScheduler, SCHEDULE_CONFIG };
