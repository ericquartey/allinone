@echo off
REM ============================================================================
REM EjLog WMS - Avvio completo con Adapter integrato
REM ============================================================================

echo.
echo ========================================================================
echo    EJLOG WMS - AVVIO COMPLETO CON ADAPTER
echo ========================================================================
echo.
echo Questo script avvia:
echo   1. Adapter .NET (porta 9000)
echo   2. Backend SQL Server (porta 3077)
echo   3. Backend React (porta 8080)
echo   4. Adapter Proxy Node.js (porta 10000)
echo   5. Frontend Vite (porta 3000)
echo.
echo ========================================================================
echo.

REM Verifica se l'adapter .NET esiste
set ADAPTER_PATH=C:\F_WMS\adt source\Ferretto.VW.EjLog.Adapter.WebApi\bin\Debug\netcoreapp3.1\Ferretto.VW.EjLog.Adapter.WebApi.exe

if not exist "%ADAPTER_PATH%" (
    echo [ERRORE] Adapter .NET non trovato in:
    echo %ADAPTER_PATH%
    echo.
    echo Per favore, compila il progetto adapter prima di avviare questo script.
    pause
    exit /b 1
)

REM Avvia l'adapter .NET in una nuova finestra
echo [1/5] Avvio Adapter .NET su porta 9000...
start "EjLog Adapter .NET" "%ADAPTER_PATH%"
timeout /t 3 /nobreak > nul

REM Avvia tutti i server Node.js con npm
echo [2/5] Avvio tutti i server Node.js...
echo.
npm run start:full

echo.
echo ========================================================================
echo    AVVIO COMPLETATO
echo ========================================================================
echo.
pause

