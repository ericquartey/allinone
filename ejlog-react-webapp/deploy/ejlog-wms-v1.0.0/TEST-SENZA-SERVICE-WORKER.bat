@echo off
setlocal
title TEST SENZA SERVICE WORKER - EjLog WMS
color 0D
cd /d "%~dp0"

cls
echo.
echo ========================================================================
echo    TEST SENZA SERVICE WORKER
echo ========================================================================
echo.
echo Questo script testa l'applicazione SENZA Service Worker.
echo.
echo Se funziona, il problema era il Service Worker.
echo.
echo ========================================================================
echo.

:: Backup index.html originale
if not exist "frontend\dist\index-ORIGINAL.html" (
    echo [1/4] Backup index.html originale...
    copy "frontend\dist\index.html" "frontend\dist\index-ORIGINAL.html" >nul
    echo [OK] Backup creato
) else (
    echo [INFO] Backup gia' esistente
)

echo.
echo [2/4] Sostituisco index.html con versione senza Service Worker...
copy /Y "frontend\dist\index-NO-SW.html" "frontend\dist\index.html" >nul
echo [OK] index.html sostituito

echo.
echo [3/4] Fermo eventuali processi...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Processi fermati

echo.
echo [4/4] Avvio server frontend...
echo.
echo Controllo se 'serve' e' disponibile...
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Uso npx serve
    start "EjLog Frontend TEST [3000]" cmd /k "cd /d "%~dp0" && color 0D && title TEST SENZA SERVICE WORKER - Porta 3000 && echo ============================================ && echo   TEST SENZA SERVICE WORKER - PORTA 3000 && echo ============================================ && echo. && echo Avvio con npx serve... && echo. && npx serve -s frontend/dist -l 3000"
) else (
    echo [INFO] Uso serve
    start "EjLog Frontend TEST [3000]" cmd /k "cd /d "%~dp0" && color 0D && title TEST SENZA SERVICE WORKER - Porta 3000 && echo ============================================ && echo   TEST SENZA SERVICE WORKER - PORTA 3000 && echo ============================================ && echo. && echo Avvio con serve... && echo. && serve -s frontend/dist -l 3000"
)

echo.
echo Attesa avvio (10 secondi)...
timeout /t 10 /nobreak >nul

echo.
echo ========================================================================
echo    APERTURA BROWSER
echo ========================================================================
echo.
echo Apro il browser tra 5 secondi...
echo.
echo IMPORTANTE:
echo ===========
echo.
echo Questa versione NON ha Service Worker.
echo.
echo Se ORA vedi la pagina di login:
echo   ^-^> Il problema ERA il Service Worker
echo   ^-^> Posso rimuoverlo definitivamente dall'index.html
echo.
echo Se ANCORA vedi pagina bianca:
echo   ^-^> Premi F12
echo   ^-^> Vai in Console
echo   ^-^> Copia TUTTI gli errori in ROSSO
echo   ^-^> Il problema e' un altro
echo.
timeout /t 5 /nobreak >nul

start http://localhost:3000

echo.
echo ========================================================================
echo    RISULTATO TEST
echo ========================================================================
echo.
echo Controlla il browser:
echo.
echo A) VEDI LA PAGINA DI LOGIN?
echo    ^-^> Il problema ERA il Service Worker
echo    ^-^> Chiudi questa finestra
echo    ^-^> Esegui: RIMUOVI-SERVICE-WORKER.bat
echo.
echo B) ANCORA PAGINA BIANCA?
echo    ^-^> Premi F12 nel browser
echo    ^-^> Vai nella tab "Console"
echo    ^-^> Copia TUTTI gli errori
echo    ^-^> Esegui: DIAGNOSI-PAGINA-BIANCA.bat
echo.
echo ========================================================================
echo.
echo Vuoi ripristinare l'index.html originale? ^(S/N^)
set /p RIPRISTINA="> "

if /i "%RIPRISTINA%"=="S" (
    echo.
    echo Ripristino index.html originale...
    copy /Y "frontend\dist\index-ORIGINAL.html" "frontend\dist\index.html" >nul
    echo [OK] Ripristinato
    echo.
    echo Riavvia il server per usare la versione originale.
)

echo.
pause
