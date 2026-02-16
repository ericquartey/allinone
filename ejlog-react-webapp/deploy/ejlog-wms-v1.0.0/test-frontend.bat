@echo off
echo ====================================================================
echo TEST FRONTEND SERVE
echo ====================================================================
echo.

cd /d "%~dp0"

echo Directory corrente: %CD%
echo.

echo Verifica file index.html...
if exist frontend\dist\index.html (
    echo [OK] frontend\dist\index.html trovato
) else (
    echo [ERRORE] frontend\dist\index.html NON trovato!
    pause
    exit /b 1
)
echo.

echo Verifica assets...
if exist frontend\dist\assets (
    echo [OK] frontend\dist\assets trovato
    dir frontend\dist\assets /s /b | find /c ".js" > temp.txt
    set /p jscount=<temp.txt
    del temp.txt
    echo File JS trovati: %jscount%
) else (
    echo [ERRORE] frontend\dist\assets NON trovato!
    pause
    exit /b 1
)
echo.

echo ====================================================================
echo AVVIO SERVER DI TEST
echo ====================================================================
echo.
echo Provo prima con http-server...
where http-server >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] http-server trovato
    echo.
    echo Avvio http-server sulla porta 3000...
    echo APRI IL BROWSER SU: http://localhost:3000
    echo.
    echo Premi CTRL+C per fermare
    echo.
    cd frontend\dist
    http-server -p 3000 -c-1 --cors
) else (
    echo [WARN] http-server non trovato
    echo.
    echo Provo con npx serve...
    echo.
    echo APRI IL BROWSER SU: http://localhost:3000
    echo.
    echo Premi CTRL+C per fermare
    echo.
    cd frontend\dist
    npx serve -s . -l 3000 --cors
)
