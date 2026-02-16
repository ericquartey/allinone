@echo off
echo ========================================
echo Avvio Server e Test Playwright
echo ========================================

cd /d %~dp0

echo.
echo [1/4] Chiusura processi Node esistenti...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/4] Avvio Backend SQL (porta 3077)...
start "Backend-SQL-3077" cmd /k "set PORT=3077 && node server/api-server.js"
timeout /t 5 /nobreak

echo.
echo [3/4] Avvio Frontend Vite (porta 3000)...
start "Frontend-Vite-3000" cmd /k "set PORT=3000 && npm run dev:frontend-only"
timeout /t 10 /nobreak

echo.
echo [4/4] Esecuzione test Playwright...
node playwright-frontend-debug.js

echo.
echo ========================================
echo Test completato!
echo ========================================
pause

