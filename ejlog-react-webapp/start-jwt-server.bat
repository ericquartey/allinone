@echo off
REM ============================================================================
REM Avvio Server HTTPS con JWT per EjLog
REM Autore: EjLog Development Team
REM Versione: 1.0.0
REM Data: 2025-12-10
REM ============================================================================

echo.
echo ========================================================================
echo   EjLog WMS - Avvio Server HTTPS + JWT
echo ========================================================================
echo.

REM Vai alla directory del progetto React
cd /d "%~dp0"

echo [INFO] Directory corrente: %CD%
echo.

REM Verifica se Node.js è installato
echo [CHECK] Verifica installazione Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Node.js non trovato!
    echo.
    echo Per favore installare Node.js v18 o superiore da:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Mostra versione Node.js
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js trovato: %NODE_VERSION%
echo.

REM Verifica se npm è installato
echo [CHECK] Verifica installazione npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] npm non trovato!
    echo.
    pause
    exit /b 1
)

REM Mostra versione npm
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm trovato: v%NPM_VERSION%
echo.

REM Verifica se node_modules esiste
if not exist "node_modules\" (
    echo [WARN] Cartella node_modules non trovata!
    echo [INFO] Installazione dipendenze in corso...
    echo.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRORE] Installazione dipendenze fallita!
        pause
        exit /b 1
    )
    echo [OK] Dipendenze installate con successo
    echo.
)

REM Verifica certificati SSL
echo [CHECK] Verifica certificati SSL...
if not exist "server\certs\server.key" (
    echo [WARN] Certificati SSL non trovati
    echo [INFO] Generazione certificati SSL in corso...
    echo.
    call npm run generate:certs
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRORE] Generazione certificati fallita!
        pause
        exit /b 1
    )
    echo [OK] Certificati SSL generati con successo
    echo.
) else (
    echo [OK] Certificati SSL trovati
    echo.
)

REM Verifica se la porta 3079 è già in uso
echo [CHECK] Verifica porta 3079...
netstat -ano | findstr ":3079" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARN] Porta 3079 già in uso!
    echo [INFO] Tentativo di terminazione processo esistente...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3079"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
    echo [OK] Porta liberata
    echo.
) else (
    echo [OK] Porta 3079 disponibile
    echo.
)

REM Avvia server HTTPS
echo ========================================================================
echo   Avvio Server HTTPS + JWT sulla porta 3079...
echo ========================================================================
echo.
echo [INFO] Il server verrà avviato in una nuova finestra
echo [INFO] NON chiudere la finestra del server!
echo.
echo Premere un tasto per avviare il server...
pause >nul

REM Avvia in una nuova finestra per vedere i log
start "EjLog HTTPS Server - Porta 3079" cmd /k "npm run dev:api:https"

REM Attendi 5 secondi per l'avvio
echo [INFO] Attesa avvio server (5 secondi)...
timeout /t 5 /nobreak >nul

REM Verifica se il server è attivo
echo [CHECK] Verifica stato server...
curl -k https://localhost:3079/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================================
    echo   SERVER AVVIATO CON SUCCESSO!
    echo ========================================================================
    echo.
    echo   Server HTTPS:      https://localhost:3079
    echo   API Documentation: https://localhost:3079/api-docs
    echo   Health Check:      https://localhost:3079/health
    echo.
    echo   Credenziali test:
    echo   - Username: superuser
    echo   - Password: promag{giorno-corrente}
    echo.
    echo ========================================================================
    echo.
) else (
    echo.
    echo [WARN] Server avviato ma non risponde ancora
    echo [INFO] Attendi qualche secondo e verifica la finestra del server
    echo.
)

echo [INFO] Per arrestare il server, chiudere la finestra "EjLog HTTPS Server"
echo.
pause
exit /b 0

