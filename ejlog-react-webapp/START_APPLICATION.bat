@echo off
REM ==================================================
REM  EJLOG WMS - START APPLICATION (Development Mode)
REM ==================================================

echo.
echo ============================================
echo   EJLOG WMS - Starting Application
echo ============================================
echo.

cd /d C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp

echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed
echo.

echo [INFO] Checking if dependencies are installed...
if not exist "node_modules" (
    echo [WARN] node_modules not found. Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo [SUCCESS] Dependencies are ready
echo.

echo [INFO] Killing any existing processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ============================================
echo   Starting Vite Development Server
echo ============================================
echo.
echo   Application will be available at:
echo   http://localhost:3001
echo.
echo   Press Ctrl+C to stop the server
echo ============================================
echo.

REM Wait 3 seconds then open browser
start /B cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3001"

REM Start the development server (this will keep the window open)
npm run dev

pause
