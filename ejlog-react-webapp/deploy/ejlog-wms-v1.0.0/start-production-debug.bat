@echo off
setlocal enabledelayedexpansion

title EjLog WMS - Avvio con Diagnostica Completa
cd /d "%~dp0"

set LOGFILE=start-debug.log

echo ======================================================================== > %LOGFILE%
echo EjLog WMS v1.0.0 - DIAGNOSTICA AVVIO >> %LOGFILE%
echo ======================================================================== >> %LOGFILE%
echo Data/Ora: %date% %time% >> %LOGFILE%
echo Directory: %CD% >> %LOGFILE%
echo. >> %LOGFILE%

cls
echo.
echo ====================================================================
echo    EjLog WMS v1.0.0 - AVVIO CON DIAGNOSTICA COMPLETA
echo ====================================================================
echo.
echo Log salvato in: %LOGFILE%
echo.

:: ============================================
:: VERIFICA PREREQUISITI
:: ============================================

echo [STEP 1] Verifica Node.js...
echo [STEP 1] Verifica Node.js... >> %LOGFILE%
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Node.js non trovato!
    echo [ERRORE] Node.js non trovato! >> %LOGFILE%
    echo.
    echo Installa Node.js da: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js trovato: !NODE_VERSION!
echo [OK] Node.js: !NODE_VERSION! >> %LOGFILE%
echo.

:: ============================================
:: VERIFICA FILE ESSENZIALI
:: ============================================

echo [STEP 2] Verifica file essenziali...
echo [STEP 2] Verifica file essenziali... >> %LOGFILE%

set ERROR_COUNT=0

if not exist backend\node_modules (
    echo [ERRORE] backend\node_modules NON trovato
    echo [ERRORE] backend\node_modules NON trovato >> %LOGFILE%
    set /a ERROR_COUNT+=1
) else (
    echo [OK] backend\node_modules
    echo [OK] backend\node_modules >> %LOGFILE%
)

if not exist backend\server\api-server.js (
    echo [ERRORE] backend\server\api-server.js NON trovato
    echo [ERRORE] backend\server\api-server.js NON trovato >> %LOGFILE%
    set /a ERROR_COUNT+=1
) else (
    echo [OK] backend\server\api-server.js
    echo [OK] backend\server\api-server.js >> %LOGFILE%
)

if not exist frontend\dist\index.html (
    echo [ERRORE] frontend\dist\index.html NON trovato
    echo [ERRORE] frontend\dist\index.html NON trovato >> %LOGFILE%
    set /a ERROR_COUNT+=1
) else (
    echo [OK] frontend\dist\index.html
    echo [OK] frontend\dist\index.html >> %LOGFILE%
)

if not exist frontend\dist\assets (
    echo [ERRORE] frontend\dist\assets NON trovato
    echo [ERRORE] frontend\dist\assets NON trovato >> %LOGFILE%
    set /a ERROR_COUNT+=1
) else (
    echo [OK] frontend\dist\assets
    echo [OK] frontend\dist\assets >> %LOGFILE%
)

if not exist config\.env (
    echo [ERRORE] config\.env NON trovato
    echo [ERRORE] config\.env NON trovato >> %LOGFILE%
    set /a ERROR_COUNT+=1
) else (
    echo [OK] config\.env
    echo [OK] config\.env >> %LOGFILE%
)

if !ERROR_COUNT! gtr 0 (
    echo.
    echo [ERRORE] Trovati !ERROR_COUNT! problemi!
    echo [ERRORE] Esegui prima: install.bat
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Tutti i file essenziali sono presenti
echo.

:: ============================================
:: VERIFICA PORTE DISPONIBILI
:: ============================================

echo [STEP 3] Verifica porte disponibili...
echo [STEP 3] Verifica porte disponibili... >> %LOGFILE%

netstat -ano | findstr :3077 >nul
if %errorlevel% equ 0 (
    echo [WARN] Porta 3077 occupata - pulizia in corso...
    echo [WARN] Porta 3077 occupata >> %LOGFILE%
) else (
    echo [OK] Porta 3077 libera
    echo [OK] Porta 3077 libera >> %LOGFILE%
)

netstat -ano | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [WARN] Porta 3000 occupata - pulizia in corso...
    echo [WARN] Porta 3000 occupata >> %LOGFILE%
) else (
    echo [OK] Porta 3000 libera
    echo [OK] Porta 3000 libera >> %LOGFILE%
)

echo.

:: ============================================
:: PULIZIA PROCESSI
:: ============================================

echo [STEP 4] Pulizia processi precedenti...
echo [STEP 4] Pulizia processi precedenti... >> %LOGFILE%
taskkill /F /IM node.exe >>%LOGFILE% 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Pulizia completata
echo.

:: ============================================
:: VERIFICA HTTP-SERVER
:: ============================================

echo [STEP 5] Verifica server HTTP...
echo [STEP 5] Verifica server HTTP... >> %LOGFILE%

where http-server >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] http-server non trovato - installazione...
    echo [WARN] http-server non trovato - installazione... >> %LOGFILE%
    call npm install -g http-server >>%LOGFILE% 2>&1
    if %errorlevel% neq 0 (
        echo [ERRORE] Installazione http-server fallita!
        echo [INFO] Useremo npx serve come alternativa
        echo [ERRORE] Installazione http-server fallita >> %LOGFILE%
        set USE_SERVE=1
    ) else (
        echo [OK] http-server installato
        echo [OK] http-server installato >> %LOGFILE%
        set USE_SERVE=0
    )
) else (
    echo [OK] http-server disponibile
    echo [OK] http-server disponibile >> %LOGFILE%
    set USE_SERVE=0
)

echo.

:: ============================================
:: AVVIO BACKEND
:: ============================================

echo [STEP 6] Avvio backend (porta 3077)...
echo [STEP 6] Avvio backend... >> %LOGFILE%
echo Comando: cd backend ^&^& node server/api-server.js
echo Comando: cd backend ^&^& node server/api-server.js >> %LOGFILE%

start "EjLog Backend [3077]" cmd /k "cd /d "%~dp0backend" && color 0E && echo ============================================ && echo   EJLOG BACKEND - PORTA 3077 && echo ============================================ && echo. && echo Avvio server... && echo. && node server/api-server.js || (echo. && echo ERRORE: Impossibile avviare il backend! && echo Verifica il file di log per i dettagli. && pause)"

echo Attesa 8 secondi per avvio backend...
timeout /t 8 /nobreak >nul

:: Verifica se backend è avviato
curl -s http://localhost:3077/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend avviato e funzionante
    echo [OK] Backend health check OK >> %LOGFILE%
) else (
    echo [WARN] Backend non risponde al health check
    echo [WARN] Backend non risponde al health check >> %LOGFILE%
    echo [INFO] Procedi comunque con l'avvio del frontend...
)

echo.

:: ============================================
:: AVVIO FRONTEND
:: ============================================

echo [STEP 7] Avvio frontend (porta 3000)...
echo [STEP 7] Avvio frontend... >> %LOGFILE%

if !USE_SERVE! equ 1 (
    echo [INFO] Uso: npx serve
    echo Comando: npx serve -s frontend/dist -l 3000 --cors
    echo Comando: npx serve >> %LOGFILE%
    start "EjLog Frontend [3000]" cmd /k "cd /d "%~dp0frontend\dist" && color 0A && echo ============================================ && echo   EJLOG FRONTEND - PORTA 3000 && echo ============================================ && echo. && echo Avvio frontend con npx serve... && echo. && npx serve -s . -l 3000 --cors || (echo. && echo ERRORE: Impossibile avviare il frontend! && pause)"
) else (
    echo [INFO] Uso: http-server
    echo Comando: http-server -p 3000 -c-1 --cors
    echo Comando: http-server >> %LOGFILE%
    start "EjLog Frontend [3000]" cmd /k "cd /d "%~dp0frontend\dist" && color 0A && echo ============================================ && echo   EJLOG FRONTEND - PORTA 3000 && echo ============================================ && echo. && echo Avvio frontend con http-server... && echo. && http-server -p 3000 -c-1 --cors || (echo. && echo ERRORE: Impossibile avviare il frontend! && pause)"
)

echo Attesa 10 secondi per avvio frontend...
timeout /t 10 /nobreak >nul

:: Verifica frontend
curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend avviato e funzionante
    echo [OK] Frontend HTTP check OK >> %LOGFILE%
) else (
    echo [WARN] Frontend non risponde
    echo [WARN] Frontend non risponde >> %LOGFILE%
)

echo.

:: ============================================
:: RIEPILOGO FINALE
:: ============================================

echo ====================================================================
echo    RIEPILOGO AVVIO
echo ====================================================================
echo.
echo Backend:   http://localhost:3077
echo           http://localhost:3077/api-docs  (Swagger)
echo           http://localhost:3077/health    (Health Check)
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
echo Sono state aperte 2 finestre CMD:
echo.
echo  [GIALLO] Backend  - Porta 3077  (NON chiudere!)
echo  [VERDE]  Frontend - Porta 3000  (NON chiudere!)
echo.
echo Per fermare tutto: esegui stop-all.bat
echo.
echo ====================================================================
echo    DIAGNOSTICA
echo ====================================================================
echo.
echo Se il browser mostra:
echo.
echo 1. PAGINA BIANCA
echo    - Attendi 10-15 secondi
echo    - Premi F5 per ricaricare
echo    - Controlla la console del browser (F12)
echo.
echo 2. "Cannot GET /"
echo    - Il frontend non è avviato correttamente
echo    - Controlla la finestra VERDE del frontend
echo    - Riavvia con questo script
echo.
echo 3. "ERRORE: Backend non risponde"
echo    - Verifica SQL Server avviato
echo    - Verifica database "promag" esiste
echo    - Controlla la finestra GIALLA del backend
echo.
echo 4. ERRORI NELLA CONSOLE DEL BROWSER
echo    - Apri F12 nel browser
echo    - Vai su "Console"
echo    - Copia gli errori
echo    - Verifica che backend sia su porta 3077
echo.
echo Log completo salvato in: %LOGFILE%
echo.
echo ====================================================================

:: Apri browser dopo 5 secondi
echo.
echo Apertura browser tra 5 secondi...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo [INFO] Browser aperto su http://localhost:3000
echo.
echo Se vedi pagina bianca:
echo   1. Attendi 10 secondi
echo   2. Premi F5
echo   3. Apri Console (F12)
echo   4. Controlla errori
echo.
echo ====================================================================
echo.
echo Puoi chiudere questa finestra.
echo I server restano attivi nelle altre 2 finestre.
echo.
echo [DEBUG] Apri le finestre Backend e Frontend per vedere i log
echo [DEBUG] Se ci sono errori, saranno visibili li
echo.
pause

