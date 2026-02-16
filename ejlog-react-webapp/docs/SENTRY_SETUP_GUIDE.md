# 🔍 Sentry Setup Guide - EJLOG WMS

> **Complete step-by-step guide to configure Sentry error tracking**
> **Time Required**: 15-20 minutes
> **Difficulty**: Easy

---

## 📋 Table of Contents

- [Why Sentry?](#why-sentry)
- [Prerequisites](#prerequisites)
- [Step 1: Create Sentry Account](#step-1-create-sentry-account)
- [Step 2: Create Project](#step-2-create-project)
- [Step 3: Install Dependencies](#step-3-install-dependencies)
- [Step 4: Configure Environment](#step-4-configure-environment)
- [Step 5: Initialize Sentry](#step-5-initialize-sentry)
- [Step 6: Test Integration](#step-6-test-integration)
- [Step 7: Configure Alerts](#step-7-configure-alerts)
- [Step 8: Create Dashboard](#step-8-create-dashboard)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Why Sentry?

Sentry provides:
- **Real-time error tracking** - Immediate notification of production errors
- **Performance monitoring** - Track slow transactions and API calls
- **Release tracking** - Compare error rates between versions
- **User context** - See which users are affected
- **Source maps** - Debug minified production code
- **Breadcrumbs** - Understand user actions leading to errors

**Benefits for EJLOG WMS**:
- Catch production errors before users report them
- Reduce MTTR (Mean Time To Resolution)
- Track performance regressions
- Monitor deployment health
- Improve user experience

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] Email address for Sentry account
- [ ] Admin access to your application
- [ ] Node.js and npm installed
- [ ] Git repository access
- [ ] Production URL (or staging for testing)

---

## Step 1: Create Sentry Account

### 1.1 Sign Up

1. **Visit Sentry**: Go to https://sentry.io
2. **Click "Get Started"** or "Sign Up"
3. **Choose sign-up method**:
   - GitHub account (recommended - easier CI/CD integration)
   - Google account
   - Email/password

4. **Verify email** (if using email/password)

### 1.2 Create Organization

After sign-up, you'll be prompted to create an organization:

1. **Organization name**: `Your-Company-Name` (e.g., "Fergrp WMS")
2. **Plan**: Select "Developer" (free tier - perfect for getting started)
   - Includes: 5,000 errors/month, 10,000 performance units
   - Sufficient for small to medium deployments

**Screenshot reference**:
```
┌─────────────────────────────────────┐
│  Create Your Organization           │
├─────────────────────────────────────┤
│  Organization Name: [Fergrp WMS   ] │
│  Plan: ○ Developer (Free)          │
│        ○ Team ($26/month)           │
│        ○ Business (Custom)          │
│                                     │
│  [Continue] ────────────────────►   │
└─────────────────────────────────────┘
```

---

## Step 2: Create Project

### 2.1 Initialize Project

1. **Click "Create Project"** in the Sentry dashboard
2. **Select Platform**: Choose **"React"**
   - This optimizes Sentry for React-specific features
   - Source map support
   - Component stack traces

### 2.2 Configure Project

Fill in project details:

```
Platform:       React
Language:       JavaScript
Project Name:   ejlog-wms-production
Team:           #engineering (or create new team)
Alert Frequency: Default
```

**Project Naming Convention**:
- Production: `ejlog-wms-production`
- Staging: `ejlog-wms-staging`
- Development: `ejlog-wms-dev` (optional)

### 2.3 Get DSN

After project creation, you'll see the **DSN (Data Source Name)**:

```
https://1234567890abcdef1234567890abcdef@o123456.ingest.sentry.io/7654321
```

**IMPORTANT**:
- ⚠️ Keep this DSN secure (treat it like a password)
- ✅ It's safe to include in client-side code (it's public-facing)
- ❌ Don't commit it directly to Git (use environment variables)

**Copy this DSN** - you'll need it in Step 4.

---

## Step 3: Install Dependencies

### 3.1 Install Sentry SDK

Navigate to your project directory and install:

```bash
cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp

# Install Sentry React SDK
npm install --save @sentry/react
```

**Package installed**: `@sentry/react` (already in package.json, so just ensure it's installed)

### 3.2 Verify Installation

```bash
npm list @sentry/react
```

Expected output:
```
ejlog-react-webapp@2.3.12.4
└── @sentry/react@7.x.x
```

---

## Step 4: Configure Environment

### 4.1 Create Environment File

Create `.env.production` file in project root:

```bash
# .env.production
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=https://YOUR_DSN_HERE@o123456.ingest.sentry.io/7654321
VITE_APP_VERSION=2.3.12.4
VITE_ENVIRONMENT=production
```

**Replace `YOUR_DSN_HERE`** with your actual DSN from Step 2.3.

### 4.2 Create Staging Environment (Optional)

For staging environment, create `.env.staging`:

```bash
# .env.staging
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=https://YOUR_STAGING_DSN@o123456.ingest.sentry.io/7654322
VITE_APP_VERSION=2.3.12.4
VITE_ENVIRONMENT=staging
```

### 4.3 Update .gitignore

Ensure environment files are ignored:

```bash
# .gitignore
.env.production
.env.staging
.env.local
```

**Note**: `.env.production` template can be committed, but with placeholder values.

---

## Step 5: Initialize Sentry

### 5.1 Create Sentry Configuration

Create `src/utils/sentry.ts`:

```typescript
// src/utils/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENABLE_SENTRY = import.meta.env.VITE_ENABLE_SENTRY === 'true';
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '2.3.12.4';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';

export const initSentry = () => {
  if (!ENABLE_SENTRY || !SENTRY_DSN) {
    console.log('[Sentry] Disabled or DSN not configured');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `ejlog-wms@${APP_VERSION}`,

    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        // Trace navigation transitions
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],

    // Sample rate for error tracking (100% = all errors)
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Sample rate for performance monitoring
    // 0.1 = 10% of transactions (reduces costs)
    // 1.0 = 100% for staging/dev
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Filter out common noise
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      // Canceled requests
      'AbortError',
    ],

    // Add context to errors
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (ENVIRONMENT === 'development' && event.level !== 'error') {
        return null;
      }

      // Add custom context
      event.tags = {
        ...event.tags,
        version: APP_VERSION,
      };

      return event;
    },
  });

  console.log('[Sentry] Initialized successfully');
  console.log(`[Sentry] Environment: ${ENVIRONMENT}`);
  console.log(`[Sentry] Release: ejlog-wms@${APP_VERSION}`);
};

// Export Sentry for manual error capturing
export { Sentry };
```

### 5.2 Initialize in Main Entry

Update `src/main.tsx`:

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize Sentry BEFORE React renders
import { initSentry } from './utils/sentry';
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 5.3 Add Error Boundary

Update `src/App.tsx` to use Sentry Error Boundary:

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { AppRoutes } from './routes';
import { ErrorFallback } from './components/error/ErrorFallback';

const App: React.FC = () => {
  return (
    <Sentry.ErrorBoundary
      fallback={ErrorFallback}
      showDialog={false}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
};

export default App;
```

---

## Step 6: Test Integration

### 6.1 Build with Sentry

```bash
# Build production bundle
npm run build
```

Expected output:
```
vite v5.x.x building for production...
[Sentry] Initialized successfully
[Sentry] Environment: production
[Sentry] Release: ejlog-wms@2.3.12.4
✓ built in 12.34s
```

### 6.2 Start Production Preview

```bash
# Preview production build
npm run preview
```

Visit: http://localhost:4173

### 6.3 Test Error Capture

Open browser console and trigger test error:

```javascript
// In browser console
throw new Error('Sentry test error - please ignore');
```

### 6.4 Verify in Sentry Dashboard

1. **Go to Sentry dashboard**: https://sentry.io
2. **Select your project**: ejlog-wms-production
3. **Check "Issues" tab**: You should see the test error within 30 seconds

**What to look for**:
```
┌────────────────────────────────────────────┐
│ Issues                                     │
├────────────────────────────────────────────┤
│ ⚠️ Error: Sentry test error - please ignore│
│    First seen: Just now                    │
│    Last seen: Just now                     │
│    Events: 1                               │
│    Users: 1                                │
│    Environment: production                 │
│    Release: ejlog-wms@2.3.12.4            │
└────────────────────────────────────────────┘
```

✅ **If you see this error, Sentry is working!**

### 6.5 Resolve Test Error

In Sentry dashboard:
1. Click on the test error
2. Click "Resolve" button
3. Add note: "Test error - integration verified ✅"

---

## Step 7: Configure Alerts

### 7.1 Create Alert Rule

1. **Go to Alerts** in left sidebar
2. **Click "Create Alert Rule"**
3. **Choose conditions**:

```
Alert Name:       Production Error Spike
Environment:      production
Conditions:
  - When: Event count
  - Is: greater than
  - Value: 10
  - In: 5 minutes
Actions:
  - Send email to: your-email@company.com
  - Send Slack notification (optional)
```

### 7.2 Create Performance Alert

```
Alert Name:       Slow API Response
Environment:      production
Conditions:
  - When: Transaction duration (p95)
  - Is: greater than
  - Value: 2000ms
  - In: 10 minutes
Actions:
  - Send email to: team@company.com
```

### 7.3 Set Up Team Notifications

1. **Go to Settings → Teams**
2. **Add team members**
3. **Configure notification preferences**:
   - Email: Immediate for critical errors
   - Slack: Daily summary
   - Weekly report: Enabled

---

## Step 8: Create Dashboard

### 8.1 Create Custom Dashboard

1. **Go to Dashboards** in left sidebar
2. **Click "Create Dashboard"**
3. **Name it**: "EJLOG WMS Production Health"

### 8.2 Add Widgets

Add these widgets to monitor application health:

**1. Error Rate**
```
Widget Type: Time Series
Metric: count()
Grouping: None
Y-Axis: Error count
```

**2. Response Time (p95)**
```
Widget Type: Time Series
Metric: p95(transaction.duration)
Grouping: transaction
Y-Axis: Duration (ms)
```

**3. User Count**
```
Widget Type: Big Number
Metric: count_unique(user)
Time Range: 24h
```

**4. Browser Distribution**
```
Widget Type: Table
Columns: browser.name, count()
Sort by: count() desc
```

**5. Top Errors**
```
Widget Type: Table
Columns: error.type, count()
Sort by: count() desc
Limit: 10
```

### 8.3 Share Dashboard

1. **Click "Share Dashboard"**
2. **Copy link**
3. **Share with team**
4. **Optional**: Pin to Slack channel

---

## ✅ Verification

### Complete Verification Checklist

Run through this checklist to ensure Sentry is properly configured:

#### Installation
- [ ] `@sentry/react` installed and in package.json
- [ ] `.env.production` created with DSN
- [ ] `.env` files added to `.gitignore`

#### Configuration
- [ ] `src/utils/sentry.ts` created
- [ ] Sentry initialized in `src/main.tsx`
- [ ] Error boundary added to `src/App.tsx`
- [ ] Environment variables set correctly

#### Testing
- [ ] Production build completes successfully
- [ ] Sentry initialization logged in console
- [ ] Test error captured in Sentry dashboard
- [ ] Error details show correct environment and release
- [ ] Source maps working (can see original TypeScript code)

#### Alerts
- [ ] Alert rule created for error spikes
- [ ] Alert rule created for performance issues
- [ ] Email notifications configured
- [ ] Team members added and notified

#### Dashboard
- [ ] Custom dashboard created
- [ ] 5+ widgets added (errors, performance, users, etc.)
- [ ] Dashboard shared with team
- [ ] Dashboard accessible via bookmark/Slack

#### Production Ready
- [ ] Sentry tested in staging environment
- [ ] Sample rates configured appropriately
- [ ] Ignore patterns set for common noise
- [ ] Release tracking configured
- [ ] Team trained on Sentry workflow

---

## 🔧 Troubleshooting

### Sentry Not Capturing Errors

**Symptom**: Test errors not appearing in dashboard

**Solutions**:
1. **Check DSN**: Ensure DSN is correct in `.env.production`
2. **Check environment variable**: Log `import.meta.env.VITE_SENTRY_DSN` in console
3. **Check initialization**: Look for `[Sentry] Initialized successfully` in console
4. **Check network**: Look for requests to `sentry.io` in Network tab
5. **Check sample rate**: Ensure `tracesSampleRate` is not 0

```typescript
// Debug helper
console.log('Sentry DSN:', import.meta.env.VITE_SENTRY_DSN);
console.log('Sentry Enabled:', import.meta.env.VITE_ENABLE_SENTRY);
```

### Source Maps Not Working

**Symptom**: Errors show minified code, not original TypeScript

**Solution**: Configure source map upload (Advanced - optional for now)

```bash
# Install Sentry Vite plugin
npm install --save-dev @sentry/vite-plugin

# Update vite.config.ts
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps
  },
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'ejlog-wms-production',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

### Too Many Events

**Symptom**: Hitting Sentry quota limits

**Solution**: Adjust sample rates

```typescript
// In src/utils/sentry.ts
Sentry.init({
  // Reduce performance monitoring sample rate
  tracesSampleRate: 0.05, // 5% instead of 10%

  // Add more ignore patterns
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

### Environment Not Detected

**Symptom**: All events show as "production" or "development"

**Solution**: Ensure environment variable is set correctly

```bash
# .env.production
VITE_ENVIRONMENT=production

# .env.staging
VITE_ENVIRONMENT=staging
```

### Sentry Initialization Error

**Symptom**: Console shows Sentry error on startup

**Solution**: Check for conflicting versions or missing dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Success Metrics

After completing setup, you should have:

**✅ Sentry Fully Configured**:
- Account created
- Project configured for React
- DSN stored securely
- SDK installed and initialized

**✅ Error Tracking Active**:
- Test error captured successfully
- Error details include stack trace, breadcrumbs, environment
- Errors resolved workflow understood

**✅ Alerts Configured**:
- Error spike alerts created
- Performance alerts created
- Team notifications configured

**✅ Dashboard Created**:
- Custom dashboard with 5+ widgets
- Team members have access
- Dashboard bookmarked for quick access

**✅ Production Ready**:
- Tested in staging environment
- Sample rates optimized for production
- Team trained on workflow
- Integration verified end-to-end

---

## 🎯 Next Steps

After Sentry setup is complete:

1. **Proceed to Step 2**: [Configure GitHub Repository Secrets](./DEPLOY_NOW.md#step-2-setup-github-repository)
2. **Read**: [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide
3. **Review**: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 📚 Additional Resources

### Official Documentation
- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Vite Integration](https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/vite/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Source Maps Guide](https://docs.sentry.io/platforms/javascript/sourcemaps/)

### Sentry Best Practices
- [Error Tracking Best Practices](https://docs.sentry.io/product/issues/issue-details/)
- [Alert Best Practices](https://docs.sentry.io/product/alerts/best-practices/)
- [Performance Monitoring Guide](https://docs.sentry.io/product/performance/)

### Support
- [Sentry Community Forum](https://forum.sentry.io/)
- [Sentry Discord](https://discord.gg/sentry)
- [Sentry Status Page](https://status.sentry.io/)

---

<div align="center">

## ✅ Sentry Setup Complete!

**Next**: [GitHub Repository Configuration](./DEPLOY_NOW.md#step-2-setup-github-repository) →

[Back to Deployment Guide](./DEPLOY_NOW.md) | [Documentation Index](../DOCUMENTATION_INDEX.md)

**EJLOG WMS** - Production Deployment in Progress 🚀

</div>
