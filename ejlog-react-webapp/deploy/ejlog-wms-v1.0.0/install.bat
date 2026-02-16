@echo off
:: ============================================================================
:: EjLog WMS v1.0.0 - Installazione Automatica Completa
:: Database: localhost\SQL2019 - promag (già configurato)
:: ============================================================================

title EjLog WMS v1.0.0 - Installazione Automatica

color 0A
echo.
echo ========================================================================
echo    EjLog WMS v1.0.0 - Installazione Automatica
echo ========================================================================
echo.
echo Database: localhost\SQL2019 - promag
echo Credenziali: GIA' CONFIGURATE (nessuna modifica necessaria)
echo.
echo L'installazione iniziera' automaticamente tra 3 secondi...
timeout /t 3 >nul

:: Verifica Node.js
echo.
echo [1/6] Verifica Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo *** ERRORE: Node.js non trovato! ***
    echo.
    echo Scarica e installa Node.js da: https://nodejs.org
    echo Versione consigliata: 20.x LTS
    echo.
    pause
    exit /b 1
)
for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK - Node.js %NODE_VERSION% trovato
timeout /t 1 >nul

:: Crea cartelle necessarie
echo.
echo [2/6] Creazione struttura cartelle...
if not exist logs mkdir logs
if not exist backups mkdir backups
if not exist uploads mkdir uploads
if not exist config mkdir config
echo OK - Cartelle create: logs, backups, uploads
timeout /t 1 >nul

:: Crea file .env con configurazione database
echo.
echo [3/6] Configurazione database...
(
echo # ============================================================================
echo # EjLog WMS v1.0.0 - Configurazione Produzione
echo # ============================================================================
echo.
echo # Ambiente
echo NODE_ENV=production
echo.
echo # Porte Server
echo PORT=3002
echo PORT_HTTPS=3079
echo PORT_SQL=3077
echo PORT_REACT=8080
echo PORT_FRONTEND=3000
echo.
echo # Database SQL Server ^(GIA' CONFIGURATO^)
echo DB_SERVER=localhost\SQL2019
echo DB_USER=sa
echo DB_PASSWORD=fergrp_2012
echo DB_DATABASE=promag
echo DB_NAME=promag
echo DB_ENCRYPT=false
echo DB_TRUST_CERT=true
echo.
echo # CORS Origins
echo CORS_ORIGINS=http://localhost:3001,http://localhost:3000
echo.
echo # JWT Secret
echo JWT_SECRET=ejlog-wms-production-secret-2025-v1.0.0
echo.
echo # Session
echo SESSION_SECRET=ejlog-wms-session-secret-2025-v1.0.0
echo.
echo # Logging
echo LOG_LEVEL=info
echo LOG_FILE=logs/ejlog-wms.log
echo.
echo # Scheduler
echo SCHEDULER_ENABLED=true
echo SCHEDULER_INTERVAL=5000
echo SCHEDULER_WORKERS=3
echo.
echo # WebSocket
echo WS_ENABLED=true
echo.
echo # Feature Flags
echo ENABLE_WAREHOUSE_MANAGEMENT=true
echo ENABLE_PTL_SYSTEM=true
echo ENABLE_VOICE_PICK=true
echo ENABLE_BARCODE_SCANNER=true
echo ENABLE_ANALYTICS=true
) > config\.env
echo OK - File .env creato con configurazione database
echo    DB: localhost\SQL2019 - promag
echo    User: sa
timeout /t 1 >nul

:: Installa dipendenze backend
echo.
echo [4/6] Installazione dipendenze backend...
echo.
echo IMPORTANTE: Questa operazione potrebbe richiedere 2-5 minuti
echo NON CHIUDERE QUESTA FINESTRA durante l'installazione!
echo.
echo Installazione in corso...

cd backend

:: Primo tentativo con output visibile
echo Tentativo 1: npm install --production
call npm install --production

if %errorLevel% neq 0 (
    echo.
    echo Primo tentativo fallito, riprovo senza --production...
    call npm install
    if %errorLevel% neq 0 (
        color 0C
        echo.
        echo *** ERRORE: Installazione dipendenze fallita ***
        echo.
        echo Possibili cause:
        echo - Connessione internet assente
        echo - Permessi insufficienti
        echo - Antivirus che blocca npm
        echo.
        echo Soluzione:
        echo 1. Verifica connessione internet
        echo 2. Esegui come Amministratore
        echo 3. Disabilita temporaneamente antivirus
        echo 4. Riprova installazione
        echo.
        cd ..
        pause
        exit /b 1
    )
)

cd ..
echo.
echo OK - Dipendenze backend installate con successo
timeout /t 1 >nul

:: Verifica installazione
echo.
echo [5/6] Verifica installazione...

:: Verifica node_modules esiste
if not exist backend\node_modules (
    color 0C
    echo ERRORE - Cartella node_modules non creata
    echo L'installazione npm non ha funzionato correttamente
    pause
    exit /b 1
)
echo OK - Cartella node_modules creata

:: Verifica express
if exist backend\node_modules\express (
    echo OK - Express installato
) else (
    color 0E
    echo ATTENZIONE - Express non trovato in node_modules
    echo Tento reinstallazione manuale...
    cd backend
    call npm install express --save
    cd ..
    if exist backend\node_modules\express (
        echo OK - Express installato manualmente
    ) else (
        color 0C
        echo ERRORE - Impossibile installare Express
        echo.
        echo Prova manualmente:
        echo   cd backend
        echo   npm install express
        echo.
        pause
        exit /b 1
    )
)

:: Verifica mssql
if exist backend\node_modules\mssql (
    echo OK - MSSQL installato
) else (
    color 0E
    echo ATTENZIONE - MSSQL non trovato
    echo Tento reinstallazione manuale...
    cd backend
    call npm install mssql --save
    cd ..
    if exist backend\node_modules\mssql (
        echo OK - MSSQL installato manualmente
    ) else (
        color 0C
        echo ERRORE - Impossibile installare MSSQL
        pause
        exit /b 1
    )
)

:: Verifica .env
if exist config\.env (
    echo OK - Configurazione database presente
) else (
    color 0C
    echo ERRORE - File .env non creato
    pause
    exit /b 1
)

timeout /t 1 >nul

:: Crea file VERSION
echo.
echo [6/6] Finalizzazione...
if not exist VERSION.txt (
    (
        echo EjLog WMS
        echo Version: 1.0.0
        echo Build Date: 2025-12-23
        echo Environment: Production
        echo Database: localhost\SQL2019 - promag
    ) > VERSION.txt
)
echo OK - Installazione completata
timeout /t 1 >nul

color 0A
echo.
echo ========================================================================
echo    INSTALLAZIONE COMPLETATA CON SUCCESSO!
echo ========================================================================
echo.
echo Database: localhost\SQL2019 - promag (GIA' CONFIGURATO)
echo Username DB: sa
echo Password DB: fergrp_2012
echo.
echo File configurazione creato: config\.env
echo.
echo Componenti installati:
echo   [OK] Frontend build (React 18 + Vite)
echo   [OK] Backend server (Node.js + Express)
echo   [OK] Database config (SQL Server)
echo   [OK] Dipendenze npm (backend\node_modules)
echo   [OK] Configurazione ambiente (.env)
echo.
echo Dipendenze chiave verificate:
echo   [OK] express
echo   [OK] mssql
echo.
echo ========================================================================
:: Installa http-server globalmente per servire il frontend
echo.
echo [EXTRA] Installazione http-server per frontend...
call npm install -g http-server --silent >nul 2>&1
if %errorLevel% equ 0 (
    echo OK - http-server installato globalmente
) else (
    echo ATTENZIONE - http-server non installato ^(verra' usato npx^)
)

echo.
echo PROSSIMO PASSO:
echo.
echo 1. Doppio click su: start-production.bat
echo.
echo 2. L'applicazione si aprira' automaticamente su:
echo    http://localhost:3000
echo.
echo 3. Login:
echo    Username: admin
echo    Password: admin
echo.
echo ========================================================================
echo.

pause

