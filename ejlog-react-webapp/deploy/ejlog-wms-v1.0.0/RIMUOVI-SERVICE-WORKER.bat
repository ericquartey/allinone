@echo off
setlocal
title RIMUOVI SERVICE WORKER - EjLog WMS
color 0C
cd /d "%~dp0"

cls
echo.
echo ========================================================================
echo    RIMUOVI SERVICE WORKER DEFINITIVAMENTE
echo ========================================================================
echo.
echo Questo script rimuove il Service Worker dall'applicazione.
echo.
echo ATTENZIONE: Questa modifica e' PERMANENTE.
echo.
echo Il Service Worker serve per:
echo  - Funzionalita' PWA ^(Progressive Web App^)
echo  - Cache offline
echo  - Aggiornamenti automatici
echo.
echo Se il Service Worker causa problemi, e' meglio rimuoverlo.
echo.
echo ========================================================================
echo.
echo Vuoi continuare? ^(S/N^)
set /p CONFERMA="> "

if /i not "%CONFERMA%"=="S" (
    echo.
    echo Operazione annullata.
    pause
    exit /b 0
)

echo.
echo [1/3] Backup index.html...
copy "frontend\dist\index.html" "frontend\dist\index-WITH-SW-BACKUP.html" >nul
echo [OK] Backup salvato in: index-WITH-SW-BACKUP.html

echo.
echo [2/3] Rimozione Service Worker da index.html...
copy /Y "frontend\dist\index-NO-SW.html" "frontend\dist\index.html" >nul
echo [OK] Service Worker rimosso

echo.
echo [3/3] Verifica file Service Worker...
if exist "frontend\dist\sw.js" (
    echo [INFO] Trovato sw.js
    echo        Vuoi rinominarlo per disabilitarlo? ^(S/N^)
    set /p RENAME_SW="> "
    if /i "!RENAME_SW!"=="S" (
        ren "frontend\dist\sw.js" "sw.js.disabled"
        echo [OK] sw.js rinominato in sw.js.disabled
    )
)

if exist "frontend\dist\registerSW.js" (
    echo [INFO] Trovato registerSW.js
    echo        Vuoi rinominarlo per disabilitarlo? ^(S/N^)
    set /p RENAME_REG="> "
    if /i "!RENAME_REG!"=="S" (
        ren "frontend\dist\registerSW.js" "registerSW.js.disabled"
        echo [OK] registerSW.js rinominato in registerSW.js.disabled
    )
)

echo.
echo ========================================================================
echo    COMPLETATO
echo ========================================================================
echo.
echo Il Service Worker e' stato rimosso dall'index.html
echo.
echo PROSSIMI PASSI:
echo ===============
echo.
echo 1. Ferma tutti i server: stop-all.bat
echo.
echo 2. Riavvia con: start-production-FIXED.bat
echo.
echo 3. Apri browser su http://localhost:3000
echo.
echo 4. Premi CTRL+F5 per pulire la cache
echo.
echo 5. Se ancora hai problemi:
echo    - Apri Console ^(F12^)
echo    - In Application ^> Service Workers
echo    - Unregister tutti i service worker
echo    - Ricarica ^(CTRL+F5^)
echo.
echo ========================================================================
echo.
echo Per ripristinare il Service Worker:
echo    copy frontend\dist\index-WITH-SW-BACKUP.html frontend\dist\index.html
echo.
echo ========================================================================
echo.
pause
