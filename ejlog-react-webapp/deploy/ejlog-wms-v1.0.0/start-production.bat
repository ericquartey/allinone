@echo off
setlocal

:: Crea file di log
set LOGFILE=start-production.log
echo ======================================================================== > %LOGFILE%
echo EjLog WMS v1.0.0 - Log Avvio >> %LOGFILE%
echo ======================================================================== >> %LOGFILE%
echo Data/Ora: %date% %time% >> %LOGFILE%
echo. >> %LOGFILE%

echo LOG: Inizio script >> %LOGFILE%
echo Creazione log in corso...

:: Cambia directory
echo LOG: Directory iniziale: %CD% >> %LOGFILE%
cd /d "%~dp0"
echo LOG: Directory dopo cd: %CD% >> %LOGFILE%

title EjLog WMS v1.0.0
cls

echo.
echo ====================================================================
echo    EjLog WMS v1.0.0 - Avvio con LOG
echo ====================================================================
echo.
echo Il log viene scritto in: %LOGFILE%
echo.

:: Verifica backend\node_modules
echo LOG: Verifica backend\node_modules... >> %LOGFILE%
if not exist backend\node_modules (
    echo LOG: ERRORE - backend\node_modules NON trovato >> %LOGFILE%
    echo ERRORE: Dipendenze non installate
    echo Esegui prima: install.bat
    echo.
    echo Dettagli nel file: %LOGFILE%
    pause
    exit /b 1
)
echo LOG: OK - backend\node_modules trovato >> %LOGFILE%

:: Verifica config\.env
echo LOG: Verifica config\.env... >> %LOGFILE%
if not exist config\.env (
    echo LOG: ERRORE - config\.env NON trovato >> %LOGFILE%
    echo ERRORE: File .env non trovato
    echo Esegui prima: install.bat
    echo.
    echo Dettagli nel file: %LOGFILE%
    pause
    exit /b 1
)
echo LOG: OK - config\.env trovato >> %LOGFILE%

:: Verifica frontend build
echo LOG: Verifica frontend\dist\index.html... >> %LOGFILE%
if not exist frontend\dist\index.html (
    echo LOG: ERRORE - frontend\dist\index.html NON trovato >> %LOGFILE%
    echo ERRORE: Frontend build non trovato
    echo.
    echo Dettagli nel file: %LOGFILE%
    pause
    exit /b 1
)
echo LOG: OK - frontend\dist\index.html trovato >> %LOGFILE%

:: Fase 1
echo LOG: [1/5] Caricamento configurazione >> %LOGFILE%
echo [1/5] Caricamento configurazione...
echo Database: localhost\SQL2019 - promag
echo.

:: Fase 2 - Pulizia
echo LOG: [2/5] Pulizia processi precedenti >> %LOGFILE%
echo [2/5] Pulizia processi precedenti...
taskkill /F /IM node.exe >>%LOGFILE% 2>&1
echo LOG: Pulizia completata >> %LOGFILE%
timeout /t 2 /nobreak >nul
echo OK - Processi puliti
echo.

:: Fase 3 - http-server (SEMPLIFICATO)
echo LOG: [3/5] Verifica http-server >> %LOGFILE%
echo [3/5] Verifica http-server...
where http-server >nul 2>&1
if %errorlevel% neq 0 (
    echo LOG: http-server non trovato, installazione... >> %LOGFILE%
    echo Installazione http-server...
    call npm install -g http-server >>%LOGFILE% 2>&1
    echo LOG: Installazione http-server completata >> %LOGFILE%
    echo OK - http-server installato
) else (
    echo LOG: http-server gia installato >> %LOGFILE%
    echo OK - http-server disponibile
)
echo.

:: Fase 4 - Backend
echo LOG: [4/5] Avvio backend server >> %LOGFILE%
echo [4/5] Avvio backend server - Porta 3077...
echo LOG: Comando backend: start "EjLog Backend" cmd /k "cd /d "%~dp0backend" && node server/api-server.js" >> %LOGFILE%
start "EjLog Backend" cmd /k "cd /d "%~dp0backend" && color 0E && echo ============================================ && echo   EjLog Backend - Porta 3077 && echo ============================================ && echo. && node server/api-server.js"
echo LOG: Attesa 5 secondi per backend... >> %LOGFILE%
echo Attesa avvio backend (5 secondi)...
timeout /t 5 /nobreak >nul
echo LOG: Backend dovrebbe essere avviato >> %LOGFILE%
echo OK - Backend avviato
echo.

:: Fase 5 - Frontend
echo LOG: [5/5] Avvio frontend >> %LOGFILE%
echo [5/5] Avvio frontend - Porta 3000...
where http-server >nul 2>&1
if %errorlevel% equ 0 (
    echo LOG: Uso http-server per frontend >> %LOGFILE%
    echo LOG: Comando frontend: start "EjLog Frontend" cmd /k "cd /d "%~dp0frontend\dist" && http-server -p 3000 -c-1" >> %LOGFILE%
    start "EjLog Frontend" cmd /k "cd /d "%~dp0frontend\dist" && color 0A && echo ============================================ && echo   EjLog Frontend - Porta 3000 && echo ============================================ && echo. && http-server -p 3000 -c-1"
    echo Uso: http-server
) else (
    echo LOG: Uso npx serve per frontend >> %LOGFILE%
    echo LOG: Comando frontend: start "EjLog Frontend" cmd /k "cd /d "%~dp0frontend\dist" && npx serve -s . -l 3000" >> %LOGFILE%
    start "EjLog Frontend" cmd /k "cd /d "%~dp0frontend\dist" && color 0A && echo ============================================ && echo   EjLog Frontend - Porta 3000 && echo ============================================ && echo. && npx serve -s . -l 3000"
    echo Uso: npx serve
)
echo LOG: Attesa 8 secondi per frontend... >> %LOGFILE%
echo Attesa avvio frontend (8 secondi)...
timeout /t 8 /nobreak >nul
echo LOG: Frontend dovrebbe essere avviato >> %LOGFILE%
echo OK - Frontend avviato
echo.

:: Completamento
echo LOG: Applicazione avviata con successo >> %LOGFILE%
echo ====================================================================
echo    APPLICAZIONE AVVIATA
echo ====================================================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:3077
echo.
echo Login:
echo   Username: admin
echo   Password: admin
echo.
echo IMPORTANTE:
echo - Sono aperte 2 finestre CMD (Backend GIALLO e Frontend VERDE)
echo - NON chiuderle!
echo - Per fermare: stop-all.bat
echo.
echo Se il browser non carica, attendi qualche secondo e riprova
echo manualmente: http://localhost:3000
echo.
echo LOG salvato in: %LOGFILE%
echo ====================================================================
echo.

:: Apri browser
echo LOG: Apertura browser >> %LOGFILE%
echo Apertura browser tra 3 secondi...
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo LOG: Browser aperto >> %LOGFILE%

echo.
echo Browser aperto.
echo.
echo NOTA: Se vedi pagina bianca, aspetta 10 secondi e ricarica (F5)
echo.
echo Puoi chiudere questa finestra.
echo I server restano attivi nelle altre 2 finestre.
echo.
echo LOG: Script completato con successo >> %LOGFILE%
echo ====================================================================
echo.
pause

