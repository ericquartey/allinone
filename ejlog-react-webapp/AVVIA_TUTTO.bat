@echo off
REM ===============================================================================
REM Avvio Sistema Completo - Frontend + Mock Backend
REM ===============================================================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║     Avvio Sistema EjLog - Frontend + Mock Backend     ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

cd /d %~dp0

echo [1/3] Verifico Frontend Vite...
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Frontend già attivo su porta 3001
) else (
    echo [WARN] Frontend non attivo, avvialo con: npm run dev
)

echo.
echo [2/3] Avvio Mock API Server sulla porta 8080...
start "Mock API Server" cmd /k "cd /d %~dp0 && node mock-api-server.js"

echo.
echo [INFO] Attendo 3 secondi per l'avvio del server...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Verifico Mock Server...
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Mock Server attivo su porta 8080
) else (
    echo [WARN] Mock Server potrebbe non essere partito
    echo [INFO] Controlla la finestra "Mock API Server"
)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                  Sistema Pronto!                       ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  Frontend:    http://localhost:3001                    ║
echo ║  Mock API:    http://localhost:8080                    ║
echo ║  Test API:    /EjLogHostVertimag/test                  ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo [INFO] Per eseguire i test Playwright:
echo        npx playwright test tests/pages/ --workers=2
echo.
echo [INFO] Per test con UI interattiva:
echo        npx playwright test --ui
echo.

pause
