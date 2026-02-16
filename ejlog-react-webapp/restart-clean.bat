@echo off
echo ============================================
echo Pulizia e riavvio completo sistema EjLog
echo ============================================

REM Termina tutti i processi Node
echo Terminando processi Node...
taskkill /F /IM node.exe >nul 2>&1

REM Attendi 3 secondi
timeout /t 3 /nobreak >nul

REM Pulisci cache Vite
echo Pulizia cache Vite...
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite" >nul 2>&1

REM Attendi 2 secondi
timeout /t 2 /nobreak >nul

REM Avvia sistema
echo.
echo Avvio sistema...
npm start

pause
