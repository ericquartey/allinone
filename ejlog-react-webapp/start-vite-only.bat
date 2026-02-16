@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   Avvio Vite Frontend - Porta 3000
echo ========================================
echo.

REM Pulisci cache
if exist "node_modules\.vite" (
    echo Pulizia cache Vite...
    rmdir /s /q "node_modules\.vite"
    echo Cache pulita!
    echo.
)

REM Imposta porta
set PORT=3000

echo Avvio Vite dev server...
echo.

REM Avvia Vite
npx vite --port 3000

pause
