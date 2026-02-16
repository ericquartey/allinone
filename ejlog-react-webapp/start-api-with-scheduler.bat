@echo off
echo ========================================
echo Starting EjLog API Server with Scheduler
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Cleaning cache...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite" 2>nul
    echo Cache cleared!
) else (
    echo No cache to clear
)

echo.
echo [2/3] Starting API Server on port 3077...
echo.

node server/api-server.js

pause

