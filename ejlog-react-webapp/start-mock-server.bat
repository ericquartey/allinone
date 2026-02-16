@echo off
REM ===============================================================================
REM Mock API Server for E2E Testing
REM ===============================================================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                                                        ║
echo ║         Mock API Server - E2E Testing                 ║
echo ║         EjLog WMS REST API Emulator                   ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

cd /d %~dp0

echo [INFO] Verifico che Express sia installato...
if not exist "node_modules\express" (
    echo [WARN] Express non trovato, installo dipendenze...
    call npm install --save-dev express cors
)

echo [INFO] Avvio mock server sulla porta 8080...
echo [INFO] Premi CTRL+C per fermare il server
echo.

node mock-api-server.js

pause
