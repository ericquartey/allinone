@echo off
setlocal

title EjLog WMS v1.0.0 - Avvio Production FIXED
cd /d "%~dp0"

set LOGFILE=start-fixed.log
echo ======================================================================== > %LOGFILE%
echo EjLog WMS v1.0.0 - Log Avvio FIXED >> %LOGFILE%
echo ======================================================================== >> %LOGFILE%
echo Data/Ora: %date% %time% >> %LOGFILE%
echo Directory: %CD% >> %LOGFILE%
echo. >> %LOGFILE%

cls
echo.
echo ====================================================================
echo    EjLog WMS v1.0.0 - AVVIO PRODUCTION (VERSIONE CORRETTA)
echo ====================================================================
echo.
echo IMPORTANTE: Questa versione usa 'serve' invece di 'http-server'
echo            perche' serve gestisce meglio le React SPA
echo.
echo Log: %LOGFILE%
echo.

:: ============================================
:: VERIFICA PREREQUISITI
:: ============================================

echo [1/6] Verifica prerequisiti...
echo [1/6] Verifica prerequisiti... >> %LOGFILE%

if not exist backend\node_modules (
    echo [ERRORE] backend\node_modules non trovato
    echo [ERRORE] Esegui prima: install.bat
    pause
    exit /b 1
)

if not exist config\.env (
    echo [ERRORE] config\.env non trovato
    echo [ERRORE] Esegui prima: install.bat
    pause
    exit /b 1
)

if not exist frontend\dist\index.html (
    echo [ERRORE] frontend\dist\index.html non trovato
    pause
    exit /b 1
)

echo [OK] Prerequisiti verificati
echo.

:: ============================================
:: PULIZIA PROCESSI
:: ============================================

echo [2/6] Pulizia processi precedenti...
echo [2/6] Pulizia processi... >> %LOGFILE%
taskkill /F /IM node.exe >>%LOGFILE% 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Pulizia completata
echo.

:: ============================================
:: AVVIO BACKEND
:: ============================================

echo [3/6] Avvio Backend (porta 3077)...
echo [3/6] Avvio Backend >> %LOGFILE%

start "EjLog Backend [3077]" cmd /k "cd /d "%~dp0backend" && color 0E && title EjLog Backend - Porta 3077 && echo ============================================ && echo   EJLOG BACKEND - PORTA 3077 && echo ============================================ && echo. && echo Avvio in corso... && echo. && node server/api-server.js"

echo Attesa avvio backend (8 secondi)...
timeout /t 8 /nobreak >nul
echo [OK] Backend dovrebbe essere avviato
echo      Verifica finestra GIALLA per conferma
echo.

:: ============================================
:: VERIFICA SERVE DISPONIBILE
:: ============================================

echo [4/6] Verifica 'serve' disponibile...
echo [4/6] Verifica serve >> %LOGFILE%

where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] 'serve' non trovato globalmente
    echo [INFO] Uso 'npx serve' (piu' lento la prima volta)
    echo [INFO] Installazione globale consigliata: npm install -g serve
    set USE_NPX=1
) else (
    echo [OK] 'serve' disponibile
    set USE_NPX=0
)
echo.

:: ============================================
:: AVVIO FRONTEND CON SERVE
:: ============================================

echo [5/6] Avvio Frontend (porta 3000)...
echo [5/6] Avvio Frontend >> %LOGFILE%

if %USE_NPX% equ 1 (
    echo [INFO] Comando: npx serve -s frontend/dist -l 3000
    echo Comando: npx serve >> %LOGFILE%
    start "EjLog Frontend [3000]" cmd /k "cd /d "%~dp0" && color 0A && title EjLog Frontend - Porta 3000 && echo ============================================ && echo   EJLOG FRONTEND - PORTA 3000 && echo ============================================ && echo. && echo Avvio con npx serve (puo' richiedere tempo)... && echo. && npx serve -s frontend/dist -l 3000"
) else (
    echo [INFO] Comando: serve -s frontend/dist -l 3000
    echo Comando: serve >> %LOGFILE%
    start "EjLog Frontend [3000]" cmd /k "cd /d "%~dp0" && color 0A && title EjLog Frontend - Porta 3000 && echo ============================================ && echo   EJLOG FRONTEND - PORTA 3000 && echo ============================================ && echo. && echo Avvio con serve... && echo. && serve -s frontend/dist -l 3000"
)

echo Attesa avvio frontend (12 secondi)...
timeout /t 12 /nobreak >nul
echo [OK] Frontend dovrebbe essere avviato
echo      Verifica finestra VERDE per conferma
echo.

:: ============================================
:: VERIFICA CONNETTIVITA
:: ============================================

echo [6/6] Verifica connettivita...
echo [6/6] Verifica connettivita >> %LOGFILE%

:: Test backend
curl -s http://localhost:3077/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend risponde su porta 3077
    echo [OK] Backend health check OK >> %LOGFILE%
) else (
    echo [WARN] Backend non risponde (verifica finestra GIALLA)
    echo [WARN] Backend non risponde >> %LOGFILE%
)

:: Test frontend
curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend risponde su porta 3000
    echo [OK] Frontend HTTP check OK >> %LOGFILE%
) else (
    echo [WARN] Frontend non risponde (verifica finestra VERDE)
    echo [WARN] Frontend non risponde >> %LOGFILE%
)

echo.

:: ============================================
:: RIEPILOGO
:: ============================================

echo ====================================================================
echo    APPLICAZIONE AVVIATA
echo ====================================================================
echo.
echo Backend:   http://localhost:3077
echo            http://localhost:3077/api-docs  (Swagger UI)
echo            http://localhost:3077/health    (Health Check)
echo.
echo Frontend:  http://localhost:3000
echo.
echo Login:
echo   Username: admin
echo   Password: admin
echo.
echo ====================================================================
echo    FINESTRE APERTE
echo ====================================================================
echo.
echo Dovresti vedere 2 finestre CMD:
echo.
echo  [GIALLA] Backend  - Porta 3077  <- NON CHIUDERE!
echo  [VERDE]  Frontend - Porta 3000  <- NON CHIUDERE!
echo.
echo Per fermare tutto: stop-all.bat
echo.
echo ====================================================================
echo    ISTRUZIONI
echo ====================================================================
echo.
echo 1. Il browser si aprira automaticamente tra 5 secondi
echo 2. Se vedi pagina BIANCA:
echo    - Attendi 10-15 secondi
echo    - Premi F5 per ricaricare
echo 3. Se ancora BIANCA:
echo    - Premi F12 (apri Console)
echo    - Cerca errori in rosso
echo    - Verifica finestre GIALLA e VERDE per errori
echo.
echo 4. Se vedi "Cannot GET /":
echo    - Chiudi tutto con stop-all.bat
echo    - Riavvia con questo script
echo.
echo ====================================================================
echo.

:: ============================================
:: APERTURA BROWSER
:: ============================================

echo Apertura browser tra 5 secondi...
timeout /t 5 /nobreak >nul

start http://localhost:3000

echo.
echo [INFO] Browser aperto su http://localhost:3000
echo.
echo Se vedi pagina bianca:
echo   1. Attendi 15 secondi
echo   2. Premi F5
echo   3. Apri Console (F12) e controlla errori
echo.
echo Se vedi errori:
echo   - Controlla finestra GIALLA (backend)
echo   - Controlla finestra VERDE (frontend)
echo   - Leggi TROUBLESHOOTING.md
echo.
echo ====================================================================
echo.
echo Puoi chiudere questa finestra.
echo I server restano attivi nelle altre 2 finestre (GIALLA e VERDE).
echo.
echo Log completo salvato in: %LOGFILE%
echo.
pause

