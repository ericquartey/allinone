@echo off
echo ====================================
echo EjLog React - Playwright E2E Tests
echo ====================================
echo.

cd /d C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp

echo [1/3] Checking Node.js and npm...
node --version
npm --version

echo.
echo [2/3] Running Playwright Health Check Test...
echo.

npx playwright test tests/quick-health-check.spec.js --project=chromium --reporter=list 2>&1

echo.
echo [3/3] Test execution completed!
echo.

echo Results are saved in: test-results/
echo.

pause
