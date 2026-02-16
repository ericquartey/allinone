# 🔐 GitHub Repository Setup Guide - EJLOG WMS

> **Complete guide to configure GitHub repository and enable CI/CD pipeline**
> **Time Required**: 15-20 minutes
> **Difficulty**: Easy

---

## 📋 Table of Contents

- [Why GitHub Actions?](#why-github-actions)
- [Prerequisites](#prerequisites)
- [Step 1: Create GitHub Repository](#step-1-create-github-repository)
- [Step 2: Push Code to Repository](#step-2-push-code-to-repository)
- [Step 3: Configure Repository Secrets](#step-3-configure-repository-secrets)
- [Step 4: Enable GitHub Actions](#step-4-enable-github-actions)
- [Step 5: Configure Branch Protection](#step-5-configure-branch-protection)
- [Step 6: Test CI/CD Pipeline](#step-6-test-cicd-pipeline)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Why GitHub Actions?

Our CI/CD pipeline provides:
- **Automated Testing** - Run 200+ unit tests and 50+ E2E tests on every commit
- **Quality Gates** - Enforce code quality standards (ESLint, TypeScript)
- **Security Scanning** - Automated vulnerability checks with npm audit
- **Performance Monitoring** - Lighthouse CI on every deployment
- **Accessibility Testing** - Automated WCAG compliance checks
- **Automated Deployment** - Deploy to staging/production automatically
- **Multi-browser Testing** - Test on Chromium and Firefox

**Benefits**:
- Catch bugs before production
- Enforce quality standards
- Reduce manual testing time
- Faster deployment cycles
- Consistent build process

---

## ✅ Prerequisites

Before starting, ensure you have:

- [ ] GitHub account (free tier is sufficient)
- [ ] Git installed locally
- [ ] Local repository with all EJLOG WMS code
- [ ] Sentry DSN from previous step
- [ ] Admin access to create repository

---

## Step 1: Create GitHub Repository

### 1.1 Create New Repository

1. **Go to GitHub**: https://github.com
2. **Click "+" → "New repository"** (top right)
3. **Fill in repository details**:

```
Repository name:    ejlog-react-webapp
Description:        Modern Warehouse Management System - React Frontend
Visibility:         ○ Public  ● Private (recommended for internal use)

Initialize:
  [ ] Add README (we already have one)
  [ ] Add .gitignore (we already have one)
  [ ] Choose a license: MIT (optional)
```

4. **Click "Create repository"**

### 1.2 Note Repository URL

After creation, note your repository URL:
```
https://github.com/YOUR_ORG/ejlog-react-webapp.git
```

---

## Step 2: Push Code to Repository

### 2.1 Initialize Git (if not already done)

```bash
cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp

# Check if Git is already initialized
git status
```

**If NOT initialized**, run:
```bash
git init
git branch -M main
```

### 2.2 Add Remote

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_ORG/ejlog-react-webapp.git

# Verify remote
git remote -v
```

Expected output:
```
origin  https://github.com/YOUR_ORG/ejlog-react-webapp.git (fetch)
origin  https://github.com/YOUR_ORG/ejlog-react-webapp.git (push)
```

### 2.3 Prepare Files for Commit

Before committing, ensure sensitive files are in `.gitignore`:

```bash
# Verify .gitignore includes:
cat .gitignore
```

Should include:
```
# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.production
.env.staging

# Build output
dist/
build/

# Testing
coverage/
playwright-report/
test-results/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### 2.4 Commit All Files

```bash
# Add all files
git add .

# Create initial commit
git commit -m "feat: Sprint 5 complete - production ready

- Complete test suite (87% coverage)
- WCAG 2.1 AA compliance (95%+)
- Zero security vulnerabilities
- CI/CD pipeline configured
- Comprehensive documentation (17,000+ lines)
- Production deployment infrastructure

Quality Score: 95/100
Status: Production Ready ✅"

# Push to GitHub
git push -u origin main
```

### 2.5 Verify Push

Go to your GitHub repository URL and verify all files are present:
- ✅ src/ directory with components
- ✅ tests/ directory
- ✅ .github/workflows/ci-cd.yml
- ✅ package.json
- ✅ README.md
- ✅ Documentation files

---

## Step 3: Configure Repository Secrets

### 3.1 Navigate to Secrets

1. **Go to your GitHub repository**
2. **Click "Settings"** (top menu)
3. **Click "Secrets and variables" → "Actions"** (left sidebar)
4. **Click "New repository secret"**

### 3.2 Add Secrets

Add these secrets one by one:

#### Secret 1: VITE_SENTRY_DSN
```
Name:  VITE_SENTRY_DSN
Value: https://YOUR_DSN@o123456.ingest.sentry.io/7654321
```
*Replace with your actual Sentry DSN from previous step*

#### Secret 2: VITE_API_URL
```
Name:  VITE_API_URL
Value: http://localhost:3079
```
*Or your actual backend API URL*

#### Secret 3: VITE_APP_VERSION
```
Name:  VITE_APP_VERSION
Value: 2.3.12.4
```

#### Secret 4: VITE_ENABLE_SENTRY
```
Name:  VITE_ENABLE_SENTRY
Value: true
```

#### Optional: Deployment Secrets (if using automated deployment)

**For Netlify**:
```
Name:  NETLIFY_AUTH_TOKEN
Value: your-netlify-token
```

**For Vercel**:
```
Name:  VERCEL_TOKEN
Value: your-vercel-token
```

**For Docker Hub**:
```
Name:  DOCKER_USERNAME
Value: your-dockerhub-username

Name:  DOCKER_PASSWORD
Value: your-dockerhub-password
```

### 3.3 Verify Secrets

After adding all secrets, you should see:

```
┌─────────────────────────────────────────────┐
│ Repository secrets                          │
├─────────────────────────────────────────────┤
│ ✓ VITE_SENTRY_DSN          Updated 1m ago   │
│ ✓ VITE_API_URL             Updated 1m ago   │
│ ✓ VITE_APP_VERSION         Updated 1m ago   │
│ ✓ VITE_ENABLE_SENTRY       Updated 1m ago   │
└─────────────────────────────────────────────┘
```

**Important**:
- ⚠️ Secrets are encrypted and cannot be viewed after creation
- ✅ You can update them anytime
- ✅ They're available to GitHub Actions workflows

---

## Step 4: Enable GitHub Actions

### 4.1 Navigate to Actions

1. **Go to your GitHub repository**
2. **Click "Actions"** tab (top menu)

### 4.2 Enable Workflows

If you see a message about workflows:
```
┌────────────────────────────────────────────────┐
│ Workflows aren't being run on this repository │
│ Enable GitHub Actions to run workflows        │
│                                                │
│ [I understand my workflows, go ahead and      │
│  enable them]                                 │
└────────────────────────────────────────────────┘
```

**Click the green button** to enable workflows.

### 4.3 Verify Workflow File

GitHub should automatically detect `.github/workflows/ci-cd.yml`:

```
┌──────────────────────────────────────┐
│ CI/CD Pipeline                       │
├──────────────────────────────────────┤
│ This workflow will run on:           │
│ • Push to main branch               │
│ • Pull requests to main             │
│                                      │
│ Jobs:                                │
│ • quality (Code Quality Checks)     │
│ • security (Security Audit)         │
│ • test-unit (Unit Tests)            │
│ • test-e2e-chromium (E2E Chromium)  │
│ • test-e2e-firefox (E2E Firefox)    │
│ • build (Build Production)          │
│ • performance (Performance Audit)   │
│ • accessibility (A11y Tests)        │
│ • deploy-staging (Deploy Staging)   │
│ • deploy-production (Deploy Prod)   │
└──────────────────────────────────────┘
```

---

## Step 5: Configure Branch Protection

### 5.1 Navigate to Branch Settings

1. **Go to Settings → Branches** (left sidebar)
2. **Click "Add branch protection rule"**

### 5.2 Configure Protection Rule

```
Branch name pattern: main

Protection settings:
☑ Require a pull request before merging
  ☑ Require approvals: 1
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require review from Code Owners

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging

  Status checks that are required:
    ☑ quality
    ☑ security
    ☑ test-unit
    ☑ build

☑ Require conversation resolution before merging

☑ Include administrators (optional - recommended for small teams)

☐ Allow force pushes (DO NOT enable)
☐ Allow deletions (DO NOT enable)
```

### 5.3 Save Protection Rule

Click **"Create"** to save the branch protection rule.

**What this does**:
- ✅ All commits to `main` must go through pull requests
- ✅ Pull requests must pass all status checks
- ✅ At least 1 approval required before merge
- ✅ Prevents accidental force pushes
- ✅ Prevents branch deletion

---

## Step 6: Test CI/CD Pipeline

### 6.1 Create Test Branch

```bash
# Create test branch
git checkout -b test/ci-cd-verification

# Make small change
echo "# CI/CD Test" >> TEST.md
git add TEST.md
git commit -m "test: verify CI/CD pipeline"

# Push test branch
git push -u origin test/ci-cd-verification
```

### 6.2 Create Pull Request

1. **Go to GitHub repository**
2. **Click "Pull requests" tab**
3. **Click "New pull request"**
4. **Select branches**:
   - base: `main`
   - compare: `test/ci-cd-verification`
5. **Click "Create pull request"**
6. **Fill in PR template** (auto-populated)
7. **Click "Create pull request"**

### 6.3 Watch CI/CD Run

You should see status checks start automatically:

```
┌───────────────────────────────────────────┐
│ All checks have passed                    │
├───────────────────────────────────────────┤
│ ✓ quality — Code Quality Checks (2m 15s) │
│ ✓ security — Security Audit (45s)        │
│ ✓ test-unit — Unit Tests (3m 30s)        │
│ ✓ build — Build Production (2m 45s)      │
│                                           │
│ ⏳ test-e2e-chromium — Running... (4m)    │
│ ⏳ test-e2e-firefox — Running... (4m)     │
└───────────────────────────────────────────┘
```

**Wait for all checks to complete** (~15-20 minutes for full pipeline).

### 6.4 Review Results

Click on each check to see detailed logs:

**Quality Check**:
```
Run npm run lint
✓ ESLint passed (0 errors, 0 warnings)

Run npx tsc --noEmit
✓ TypeScript compilation successful (0 errors)
```

**Unit Tests**:
```
Run npm run test:coverage
Test Suites: 10 passed, 10 total
Tests:       200 passed, 200 total
Coverage:    87.5%
✓ All tests passed
```

**Build**:
```
Run npm run build
vite v5.x.x building for production...
✓ 56 KB dist/index-abc123.js
✓ Build completed successfully
```

### 6.5 Merge Pull Request

Once all checks pass:
1. **Click "Merge pull request"**
2. **Choose "Squash and merge"** (recommended)
3. **Click "Confirm squash and merge"**
4. **Delete branch** (optional but recommended)

---

## ✅ Verification

### Complete Verification Checklist

#### Repository Setup
- [ ] GitHub repository created (public or private)
- [ ] All code pushed to `main` branch
- [ ] Repository accessible at GitHub URL
- [ ] All files present in repository

#### Secrets Configuration
- [ ] VITE_SENTRY_DSN added
- [ ] VITE_API_URL added
- [ ] VITE_APP_VERSION added
- [ ] VITE_ENABLE_SENTRY added
- [ ] Deployment secrets added (if using automated deployment)

#### GitHub Actions
- [ ] GitHub Actions enabled
- [ ] Workflow file detected (.github/workflows/ci-cd.yml)
- [ ] Workflow appears in Actions tab
- [ ] Test workflow run successful

#### Branch Protection
- [ ] Branch protection rule created for `main`
- [ ] Pull request required before merge
- [ ] Status checks required (quality, security, test-unit, build)
- [ ] At least 1 approval required
- [ ] Force push disabled
- [ ] Branch deletion disabled

#### CI/CD Pipeline
- [ ] Test PR created and all checks passed
- [ ] Quality check passed (ESLint, TypeScript)
- [ ] Security check passed (npm audit)
- [ ] Unit tests passed (200+ tests)
- [ ] E2E tests passed (Chromium, Firefox)
- [ ] Build successful
- [ ] PR merged successfully

---

## 🔧 Troubleshooting

### Workflow Not Running

**Symptom**: Push to repository but no workflow appears in Actions tab

**Solutions**:
1. **Enable GitHub Actions**: Go to Actions tab → Enable workflows
2. **Check workflow file**: Ensure `.github/workflows/ci-cd.yml` exists
3. **Check YAML syntax**: Validate YAML file for syntax errors
4. **Check trigger**: Ensure workflow triggers on `push` or `pull_request`

```yaml
# .github/workflows/ci-cd.yml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### Secrets Not Available

**Symptom**: Workflow fails with "secret not found" error

**Solutions**:
1. **Add secrets**: Go to Settings → Secrets → Actions → Add secret
2. **Check secret names**: Ensure exact match (case-sensitive)
3. **Check secret usage**: Ensure secrets are referenced correctly in workflow

```yaml
# Correct usage in workflow
env:
  VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
```

### Tests Failing in CI

**Symptom**: Tests pass locally but fail in GitHub Actions

**Solutions**:
1. **Check Node version**: Ensure CI uses same Node version as local
2. **Check dependencies**: Ensure all dependencies in package.json
3. **Check environment**: Add missing environment variables to secrets
4. **Check test setup**: Ensure tests don't rely on local files

```yaml
# Specify Node version
jobs:
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v3
        with:
          node-version: '18'  # Match your local version
```

### E2E Tests Timeout

**Symptom**: E2E tests timeout in CI

**Solutions**:
1. **Increase timeout**: Add timeout to workflow
2. **Check browser installation**: Ensure browsers are installed correctly
3. **Check test configuration**: Increase Playwright timeout

```yaml
# In workflow
- name: Run E2E tests
  run: npx playwright test
  timeout-minutes: 15  # Increase timeout
```

```typescript
// In playwright.config.ts
export default defineConfig({
  timeout: 60000,  // 60 seconds per test
});
```

### Branch Protection Blocking Merges

**Symptom**: Cannot merge PR even though checks pass

**Solutions**:
1. **Check required checks**: Ensure all required checks are passing
2. **Check approvals**: Ensure required approvals are met
3. **Update branch**: Ensure branch is up to date with main
4. **Check administrators**: Temporarily enable "Include administrators"

### Deployment Not Triggering

**Symptom**: Build passes but deployment job doesn't run

**Solutions**:
1. **Check branch**: Ensure push is to `main` branch
2. **Check environment**: Verify `environment` is configured in repository settings
3. **Check secrets**: Ensure deployment secrets are configured
4. **Check condition**: Verify job condition in workflow

```yaml
deploy-staging:
  if: github.ref == 'refs/heads/main'  # Only deploy from main
  environment:
    name: staging
```

---

## 📊 Success Metrics

After completing setup, you should have:

**✅ Repository Configured**:
- GitHub repository created
- All code pushed to repository
- Repository secrets configured
- Branch protection enabled

**✅ CI/CD Pipeline Active**:
- GitHub Actions enabled
- 10-job pipeline configured
- All quality gates in place
- Automated testing on every commit

**✅ Test Run Successful**:
- Test PR created
- All checks passed:
  - ✅ Code quality (ESLint, TypeScript)
  - ✅ Security audit (npm audit)
  - ✅ Unit tests (200+ tests)
  - ✅ E2E tests (Chromium, Firefox)
  - ✅ Production build
- PR merged successfully

**✅ Protection Enabled**:
- Force push disabled
- Direct commits to main blocked
- Pull request workflow enforced
- Quality gates required

---

## 🎯 Next Steps

After GitHub repository setup is complete:

1. **Proceed to Step 3**: [Choose Deployment Method](./DEPLOY_NOW.md#step-3-choose-deployment-method)
2. **Optional**: Configure automated deployment to staging/production
3. **Review**: Complete [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## 📚 Additional Resources

### GitHub Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)

### CI/CD Best Practices
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-workflows)
- [Security Hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Workflow Status Badges](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)

### Support
- [GitHub Community Forum](https://github.community/)
- [GitHub Support](https://support.github.com/)
- [GitHub Actions Changelog](https://github.blog/changelog/label/actions/)

---

<div align="center">

## ✅ GitHub Repository Setup Complete!

**Next**: [Choose Deployment Method](./DEPLOY_NOW.md#step-3-choose-deployment-method) →

[Back to Deployment Guide](./DEPLOY_NOW.md) | [Documentation Index](../DOCUMENTATION_INDEX.md)

**EJLOG WMS** - CI/CD Pipeline Active 🚀

</div>

