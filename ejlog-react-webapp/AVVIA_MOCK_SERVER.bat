@echo off
REM ===============================================================================
REM Mock API Server - Avvio in Finestra Separata
REM ===============================================================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║         Mock API Server - Avvio in corso...           ║
echo ╚════════════════════════════════════════════════════════╝
echo.

cd /d %~dp0

REM Verifica dipendenze
if not exist "node_modules\express" (
    echo [WARN] Express non trovato, installazione...
    call npm install --save-dev express cors
)

echo [INFO] Avvio mock server in finestra separata sulla porta 8080...
echo [INFO] Il server rimarrà attivo in una nuova finestra
echo.

REM Avvia in una nuova finestra che rimane aperta
start "Mock API Server - Porta 8080" cmd /k "cd /d %~dp0 && node mock-api-server.js"

echo.
echo [OK] Finestra Mock Server aperta!
echo [INFO] Attendi 3 secondi per la verifica...
timeout /t 3 /nobreak >nul

echo.
echo [INFO] Verifica porta 8080...
netstat -ano | findstr :8080 >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Mock Server attivo e in ascolto su porta 8080
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║              Mock Server ATTIVO                        ║
    echo ╠════════════════════════════════════════════════════════╣
    echo ║  URL: http://localhost:8080                            ║
    echo ║  Test: http://localhost:8080/EjLogHostVertimag/test    ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo [INFO] Ora puoi eseguire i test Playwright:
    echo        npx playwright test tests/pages/ --workers=2
) else (
    echo [WARN] Mock Server potrebbe non essere ancora pronto
    echo [INFO] Controlla la finestra "Mock API Server - Porta 8080"
)

echo.
pause
