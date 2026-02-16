#!/usr/bin/env node

/**
 * EjLog WMS - Automated Deployment Script
 *
 * This script automates the deployment process:
 * 1. Runs pre-deployment checks (tests, lint, build)
 * 2. Creates production build
 * 3. Deploys to chosen platform (Netlify/Vercel)
 * 4. Runs post-deployment verification
 *
 * Usage:
 *   node deploy.js [options]
 *
 * Options:
 *   --platform <netlify|vercel>  Deployment platform (default: netlify)
 *   --skip-tests                 Skip running tests
 *   --skip-build                 Skip build (use existing dist/)
 *   --staging                    Deploy to staging instead of production
 *   --help                       Show help
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  platform: 'netlify',
  skipTests: false,
  skipBuild: false,
  staging: false,
  help: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--platform':
      options.platform = args[++i];
      break;
    case '--skip-tests':
      options.skipTests = true;
      break;
    case '--skip-build':
      options.skipBuild = true;
      break;
    case '--staging':
      options.staging = true;
      break;
    case '--help':
      options.help = true;
      break;
  }
}

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
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

function exec(command, description) {
  try {
    logInfo(`Running: ${description}...`);
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: __dirname
    });
    logSuccess(`Completed: ${description}`);
    return { success: true, output };
  } catch (error) {
    logError(`Failed: ${description}`);
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

function showHelp() {
  console.log(`
${colors.bright}EjLog WMS - Automated Deployment Script${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node deploy.js [options]

${colors.cyan}Options:${colors.reset}
  --platform <netlify|vercel>  Deployment platform (default: netlify)
  --skip-tests                 Skip running tests
  --skip-build                 Skip build (use existing dist/)
  --staging                    Deploy to staging instead of production
  --help                       Show this help message

${colors.cyan}Examples:${colors.reset}
  ${colors.green}# Deploy to Netlify production${colors.reset}
  node deploy.js

  ${colors.green}# Deploy to staging for testing${colors.reset}
  node deploy.js --staging

  ${colors.green}# Quick deploy (skip tests, use existing build)${colors.reset}
  node deploy.js --skip-tests --skip-build

  ${colors.green}# Deploy to Vercel${colors.reset}
  node deploy.js --platform vercel

${colors.cyan}Prerequisites:${colors.reset}
  - Node.js 18+ installed
  - npm packages installed (npm install)
  - Netlify CLI or Vercel CLI installed globally
  - Logged into chosen platform CLI

${colors.cyan}For more information:${colors.reset}
  See DEPLOY_NOW.md for detailed deployment guide
`);
}

// Main deployment function
async function deploy() {
  logSection('EJLOG WMS - AUTOMATED DEPLOYMENT');

  // Show help if requested
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  // Display configuration
  logInfo(`Platform: ${options.platform}`);
  logInfo(`Environment: ${options.staging ? 'staging' : 'production'}`);
  logInfo(`Skip tests: ${options.skipTests}`);
  logInfo(`Skip build: ${options.skipBuild}`);
  console.log('');

  // Step 1: Pre-deployment checks
  if (!options.skipTests) {
    logSection('STEP 1: PRE-DEPLOYMENT CHECKS');

    // Check if node_modules exists
    if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
      logError('node_modules not found. Running npm install...');
      const installResult = exec('npm install', 'Install dependencies');
      if (!installResult.success) {
        logError('Failed to install dependencies. Aborting deployment.');
        process.exit(1);
      }
    }

    // Run linting
    const lintResult = exec('npm run lint', 'ESLint checks');
    if (!lintResult.success) {
      logWarning('Linting failed. Review warnings and errors.');
      // Continue anyway (warnings might be acceptable)
    }

    // Run tests
    const testResult = exec('npm test -- --run', 'Unit tests');
    if (!testResult.success) {
      logError('Tests failed. Fix failing tests before deploying.');
      process.exit(1);
    }

    logSuccess('All pre-deployment checks passed!');
  } else {
    logWarning('Skipping pre-deployment checks (--skip-tests)');
  }

  // Step 2: Build production bundle
  if (!options.skipBuild) {
    logSection('STEP 2: BUILD PRODUCTION BUNDLE');

    // Check if .env.production exists
    const envProdPath = path.join(__dirname, '.env.production');
    if (!fs.existsSync(envProdPath)) {
      logWarning('.env.production not found. Using .env.example values.');
      logInfo('Create .env.production with actual production values for best results.');
    }

    const buildResult = exec('npm run build', 'Vite production build');
    if (!buildResult.success) {
      logError('Build failed. Fix build errors before deploying.');
      process.exit(1);
    }

    // Check build output
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      logError('dist/ folder not found after build. Something went wrong.');
      process.exit(1);
    }

    // Display build statistics
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const stats = fs.statSync(indexPath);
      logSuccess(`Build completed successfully (index.html: ${(stats.size / 1024).toFixed(2)} KB)`);
    }
  } else {
    logWarning('Skipping build (--skip-build)');

    // Verify dist exists
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      logError('dist/ folder not found. Cannot deploy without build.');
      logInfo('Remove --skip-build flag or run "npm run build" first.');
      process.exit(1);
    }
  }

  // Step 3: Deploy to platform
  logSection('STEP 3: DEPLOY TO PLATFORM');

  let deployCommand = '';
  let deployDescription = '';

  switch (options.platform) {
    case 'netlify':
      if (options.staging) {
        deployCommand = 'netlify deploy --dir=dist';
        deployDescription = 'Deploy to Netlify (staging)';
      } else {
        deployCommand = 'netlify deploy --prod --dir=dist';
        deployDescription = 'Deploy to Netlify (production)';
      }
      break;

    case 'vercel':
      if (options.staging) {
        deployCommand = 'vercel --prod=false';
        deployDescription = 'Deploy to Vercel (staging)';
      } else {
        deployCommand = 'vercel --prod';
        deployDescription = 'Deploy to Vercel (production)';
      }
      break;

    default:
      logError(`Unknown platform: ${options.platform}`);
      logInfo('Supported platforms: netlify, vercel');
      process.exit(1);
  }

  const deployResult = exec(deployCommand, deployDescription);
  if (!deployResult.success) {
    logError('Deployment failed. Check error messages above.');
    logInfo('Make sure you are logged into the platform CLI:');
    logInfo(`  - Netlify: netlify login`);
    logInfo(`  - Vercel: vercel login`);
    process.exit(1);
  }

  // Step 4: Post-deployment summary
  logSection('STEP 4: DEPLOYMENT COMPLETE');

  logSuccess('Deployment completed successfully! 🎉');
  console.log('');
  logInfo('Next steps:');
  console.log('  1. Open the deployment URL in your browser');
  console.log('  2. Test critical user flows (login, navigation, etc.)');
  console.log('  3. Check browser console for errors (F12)');
  console.log('  4. Test on mobile devices (responsive design)');
  console.log('  5. Monitor Sentry for errors (if configured)');
  console.log('');

  if (options.staging) {
    logWarning('This is a STAGING deployment. Remember to deploy to production when ready!');
    logInfo('Deploy to production: node deploy.js');
  }

  console.log('');
  logInfo('For deployment verification checklist, see: POST_DEPLOYMENT_VERIFICATION.md');
  console.log('');
}

// Run deployment
deploy().catch(error => {
  logError('Deployment script failed with error:');
  console.error(error);
  process.exit(1);
});
