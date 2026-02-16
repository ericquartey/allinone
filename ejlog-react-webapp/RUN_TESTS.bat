@echo off
REM ============================================================================
REM EjLog WMS - Playwright E2E Tests Runner (Windows)
REM ============================================================================
REM
REM This script runs Playwright E2E tests for EjLog React WebApp
REM
REM Prerequisites:
REM   - Node.js 18+ installed
REM   - npm dependencies installed
REM
REM Note: No separate backend server needed!
REM       Vite dev server (port 3004) handles backend proxy automatically
REM
REM Usage:
REM   RUN_TESTS.bat              - Run all tests (headless)
REM   RUN_TESTS.bat headed       - Run with visible browser
REM   RUN_TESTS.bat debug        - Run in debug mode
REM   RUN_TESTS.bat ui           - Run with Playwright UI
REM   RUN_TESTS.bat report       - Show last test report
REM
REM ============================================================================

echo.
echo ========================================
echo EjLog WMS - Playwright E2E Tests
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm packages are installed
if not exist "node_modules\" (
    echo WARNING: node_modules not found
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if Playwright browsers are installed
if not exist "node_modules\@playwright\test\" (
    echo WARNING: Playwright not found
    echo Installing Playwright...
    call npm install @playwright/test
    call npx playwright install
)

REM Parse command line argument
set MODE=%1

if "%MODE%"=="" (
    echo Running tests in HEADLESS mode...
    echo.
    call npm run test:e2e
    goto :end
)

if /i "%MODE%"=="headed" (
    echo Running tests in HEADED mode (visible browser)...
    echo.
    call npm run test:e2e:headed
    goto :end
)

if /i "%MODE%"=="debug" (
    echo Running tests in DEBUG mode (Playwright Inspector)...
    echo.
    call npm run test:e2e:debug
    goto :end
)

if /i "%MODE%"=="ui" (
    echo Running tests with UI mode (interactive)...
    echo.
    call npm run test:e2e:ui
    goto :end
)

if /i "%MODE%"=="report" (
    echo Opening last test report...
    echo.
    call npm run test:e2e:report
    goto :end
)

REM Unknown argument
echo ERROR: Unknown argument "%MODE%"
echo.
echo Usage:
echo   RUN_TESTS.bat              - Run all tests (headless)
echo   RUN_TESTS.bat headed       - Run with visible browser
echo   RUN_TESTS.bat debug        - Run in debug mode
echo   RUN_TESTS.bat ui           - Run with Playwright UI
echo   RUN_TESTS.bat report       - Show last test report
echo.
pause
exit /b 1

:end
echo.
echo ========================================
echo Test execution completed!
echo ========================================
echo.

REM Open report if tests completed successfully in headless mode
if "%MODE%"=="" (
    if %ERRORLEVEL% EQU 0 (
        echo Tests passed! Opening report...
        call npm run test:e2e:report
    ) else (
        echo Some tests failed. Opening report...
        call npm run test:e2e:report
    )
)

pause
