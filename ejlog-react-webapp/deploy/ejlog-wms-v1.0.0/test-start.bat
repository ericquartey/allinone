@echo off
echo ====================================================================
echo TEST DIAGNOSTICO - start-production.bat
echo ====================================================================
echo.
echo 1. Verifico directory corrente...
echo    Directory: %CD%
echo.

echo 2. Cambio alla directory dello script...
cd /d "%~dp0"
echo    Nuova directory: %CD%
echo.

echo 3. Verifico file necessari...
if exist backend\node_modules (
    echo    [OK] backend\node_modules trovato
) else (
    echo    [ERRORE] backend\node_modules NON trovato
)

if exist config\.env (
    echo    [OK] config\.env trovato
) else (
    echo    [ERRORE] config\.env NON trovato
)

if exist frontend\dist\index.html (
    echo    [OK] frontend\dist\index.html trovato
) else (
    echo    [ERRORE] frontend\dist\index.html NON trovato
)

echo.
echo 4. Verifico Node.js...
node --version
if %errorlevel% equ 0 (
    echo    [OK] Node.js installato
) else (
    echo    [ERRORE] Node.js NON installato
)

echo.
echo 5. Verifico npm...
npm --version
if %errorlevel% equ 0 (
    echo    [OK] npm installato
) else (
    echo    [ERRORE] npm NON installato
)

echo.
echo ====================================================================
echo DIAGNOSTICA COMPLETATA
echo ====================================================================
echo.
echo Se tutti i test sono OK, prova a eseguire start-production.bat
echo Se ci sono errori, esegui prima install.bat
echo.
pause
