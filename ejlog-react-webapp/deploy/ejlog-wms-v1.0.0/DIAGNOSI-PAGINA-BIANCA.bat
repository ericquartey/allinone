@echo off
setlocal
title DIAGNOSI PAGINA BIANCA - EjLog WMS
color 0E
cd /d "%~dp0"

cls
echo.
echo ========================================================================
echo    DIAGNOSI PAGINA BIANCA - EjLog WMS
echo ========================================================================
echo.
echo Questo script ti aiutera' a identificare perche' il browser e' bianco.
echo.
echo ========================================================================
echo    PASSO 1: INFORMAZIONI DA RACCOGLIERE
echo ========================================================================
echo.
echo Dopo aver eseguito questo script, dovrai:
echo.
echo 1. Aprire il browser su http://localhost:3000
echo 2. Premere F12 per aprire gli Strumenti per Sviluppatori
echo 3. Andare nella tab "Console"
echo 4. Cercare messaggi di ERRORE in ROSSO
echo 5. Copiare tutti gli errori
echo.
pause
echo.

:: ============================================
:: VERIFICA BACKEND
:: ============================================

echo ========================================================================
echo    PASSO 2: VERIFICA BACKEND
echo ========================================================================
echo.
echo Controllo se il backend risponde...
echo.

curl -s http://localhost:3077/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend risponde correttamente su porta 3077
    echo.
    curl -s http://localhost:3077/health
    echo.
) else (
    echo [ERRORE] Backend NON risponde su porta 3077
    echo.
    echo SOLUZIONE:
    echo   1. Verifica che la finestra GIALLA sia aperta
    echo   2. Controlla errori nella finestra GIALLA
    echo   3. Verifica SQL Server sia avviato
    echo.
    pause
)

echo.
echo ========================================================================
echo    PASSO 3: VERIFICA FRONTEND
echo ========================================================================
echo.
echo Controllo se il frontend risponde...
echo.

curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend risponde su porta 3000
    echo.
) else (
    echo [ERRORE] Frontend NON risponde su porta 3000
    echo.
    echo SOLUZIONE:
    echo   1. Verifica che la finestra VERDE sia aperta
    echo   2. Controlla errori nella finestra VERDE
    echo   3. Riavvia con stop-all.bat e poi start-production-FIXED.bat
    echo.
    pause
)

echo.
echo ========================================================================
echo    PASSO 4: TEST FILE STATICI
echo ========================================================================
echo.
echo Verifica se i file JavaScript sono accessibili...
echo.

curl -s -I http://localhost:3000/assets/js/index-CSU6yTrg.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] File JavaScript principale e' accessibile
    echo.
) else (
    echo [ERRORE] File JavaScript NON accessibile
    echo.
    echo Questo significa che 'serve' non sta servendo i file correttamente.
    echo.
    echo SOLUZIONE:
    echo   1. Stop: stop-all.bat
    echo   2. Verifica: dir frontend\dist\assets\js\index-CSU6yTrg.js
    echo   3. Riavvia: start-production-FIXED.bat
    echo.
    pause
)

echo.
echo ========================================================================
echo    PASSO 5: VERIFICA SERVICE WORKER
echo ========================================================================
echo.
echo Il tuo index.html registra un Service Worker (/sw.js).
echo Se questo file NON esiste, puo' causare la pagina bianca.
echo.

if exist "frontend\dist\sw.js" (
    echo [OK] Service Worker sw.js esiste
) else (
    echo [WARN] Service Worker sw.js NON trovato
    echo.
    echo Questo potrebbe causare errori nella console.
    echo Controlla la console del browser ^(F12^).
)

echo.

if exist "frontend\dist\registerSW.js" (
    echo [OK] registerSW.js esiste
) else (
    echo [WARN] registerSW.js NON trovato
    echo.
    echo Questo potrebbe causare errori nella console.
)

echo.
echo ========================================================================
echo    PASSO 6: APRI BROWSER E CONTROLLA CONSOLE
echo ========================================================================
echo.
echo Ora apro il browser per te.
echo.
echo DEVI FARE QUESTO:
echo ===============
echo.
echo 1. Nel browser, premi F12
echo 2. Vai nella tab "Console"
echo 3. Cerca errori in ROSSO
echo.
echo ERRORI COMUNI DA CERCARE:
echo ========================
echo.
echo A) "Failed to fetch" o "Network error"
echo    CAUSA: Backend non risponde
echo    SOLUZIONE: Verifica finestra GIALLA
echo.
echo B) "Failed to load module" o "404 Not Found" per file .js
echo    CAUSA: File JavaScript non trovati
echo    SOLUZIONE: Problema con serve, usa start-production-debug.bat
echo.
echo C) "Error registering service worker"
echo    CAUSA: Service Worker mancante o errato
echo    SOLUZIONE: Disabilita Service Worker temporaneamente
echo.
echo D) "Uncaught SyntaxError"
echo    CAUSA: File JavaScript corrotto
echo    SOLUZIONE: Rigenera build
echo.
echo E) "CORS error"
echo    CAUSA: Backend su porta diversa
echo    SOLUZIONE: Verifica backend sia su 3077
echo.
pause

start http://localhost:3000

echo.
echo ========================================================================
echo    PASSO 7: COPIA GLI ERRORI DALLA CONSOLE
echo ========================================================================
echo.
echo Ora dovresti avere il browser aperto con la Console ^(F12^).
echo.
echo 1. Se vedi ERRORI in ROSSO nella console:
echo    - Copia TUTTO il testo degli errori
echo    - Incollalo qui o salvalo in un file
echo.
echo 2. Se NON vedi ERRORI:
echo    - Vai nella tab "Network" ^(Rete^)
echo    - Ricarica la pagina ^(F5^)
echo    - Cerca file in ROSSO ^(errore 404 o 500^)
echo    - Copia i nomi dei file che danno errore
echo.
echo 3. Se vedi la pagina di LOGIN:
echo    - Il problema e' risolto!
echo.
echo ========================================================================
echo    SOLUZIONI RAPIDE
echo ========================================================================
echo.
echo SOLUZIONE 1: Disabilita Service Worker temporaneamente
echo ========================================================
echo.
echo Se nella console vedi errori relativi a Service Worker:
echo.
echo 1. Apri la Console ^(F12^)
echo 2. Vai in Application ^> Service Workers
echo 3. Click su "Unregister" per tutti i service worker
echo 4. Ricarica la pagina ^(F5^)
echo.
echo.
echo SOLUZIONE 2: Usa versione senza Service Worker
echo ================================================
echo.
echo Posso creare una versione dell'index.html SENZA Service Worker.
echo.
pause
echo.
echo SOLUZIONE 3: Verifica percorsi base
echo ====================================
echo.
echo serve deve essere avviato con flag -s ^(single page mode^)
echo.
echo Verifica nella finestra VERDE che il comando sia:
echo   npx serve -s frontend/dist -l 3000
echo.
echo Se vedi solo:
echo   http-server
echo.
echo Allora stai usando lo script SBAGLIATO!
echo Usa: start-production-FIXED.bat
echo.
echo ========================================================================
echo.
echo Ora dimmi: cosa vedi nella console del browser? ^(F12 ^> Console^)
echo.
echo Premi un tasto quando hai controllato la console...
pause >nul
echo.
echo ========================================================================
echo    PROSSIMI PASSI
echo ========================================================================
echo.
echo A seconda degli errori che vedi:
echo.
echo 1. Se vedi "Failed to fetch /api/..."
echo    ^-^> Backend non risponde
echo    ^-^> Controlla finestra GIALLA
echo    ^-^> Verifica SQL Server
echo.
echo 2. Se vedi "404" per file .js
echo    ^-^> Problema con serve
echo    ^-^> Usa: start-production-debug.bat
echo.
echo 3. Se vedi errori Service Worker
echo    ^-^> Disattiva Service Worker dalla console
echo    ^-^> Oppure chiedi una versione senza SW
echo.
echo 4. Se NON vedi errori ma pagina bianca
echo    ^-^> Controlla tab "Network"
echo    ^-^> Cerca file falliti
echo.
echo ========================================================================
echo.
echo Salvero' un file di log con le informazioni raccolte.
echo.

set LOGFILE=diagnosi-pagina-bianca.log

echo ======================================================================== > %LOGFILE%
echo DIAGNOSI PAGINA BIANCA - EjLog WMS >> %LOGFILE%
echo ======================================================================== >> %LOGFILE%
echo Data/Ora: %date% %time% >> %LOGFILE%
echo. >> %LOGFILE%

echo [1] Test Backend: >> %LOGFILE%
curl -s http://localhost:3077/health >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

echo [2] Test Frontend HTTP: >> %LOGFILE%
curl -s -I http://localhost:3000 >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

echo [3] Test JavaScript principale: >> %LOGFILE%
curl -s -I http://localhost:3000/assets/js/index-CSU6yTrg.js >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

echo [4] Verifica file: >> %LOGFILE%
dir frontend\dist\sw.js >> %LOGFILE% 2>&1
dir frontend\dist\registerSW.js >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

echo [5] Porte in uso: >> %LOGFILE%
netstat -ano | findstr ":3000 :3077" >> %LOGFILE% 2>&1
echo. >> %LOGFILE%

echo.
echo [OK] Log salvato in: %LOGFILE%
echo.
echo Puoi inviare questo file per supporto.
echo.
echo ========================================================================
echo.
pause

