@echo off
REM ============================================================================
REM Avvio AUTOMATICO Server HTTPS con JWT per EjLog (da Eclipse)
REM Versione NON-INTERATTIVA per ProcessBuilder
REM ============================================================================

cd /d "%~dp0"

REM Verifica Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Node.js non trovato! >> https-server.log
    exit /b 1
)

REM Verifica certificati SSL
if not exist "server\certs\server.key" (
    echo [INFO] Generazione certificati SSL... >> https-server.log
    call npm run generate:certs >> https-server.log 2>&1
)

REM Verifica porta 3079
netstat -ano | findstr ":3079" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARN] Porta 3079 in uso, terminazione processo... >> https-server.log
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3079"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM Avvia server HTTPS
echo [INFO] Avvio server HTTPS su porta 3079... >> https-server.log
start /B "EjLog-HTTPS" cmd /c "npm run dev:api:https >> https-server.log 2>&1"

REM Attendi avvio
timeout /t 5 /nobreak >nul

REM Verifica avvio
curl -k https://localhost:3079/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Server HTTPS avviato con successo >> https-server.log
    exit /b 0
) else (
    echo [WARN] Server avviato ma non risponde ancora >> https-server.log
    exit /b 0
)

