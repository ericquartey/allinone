@echo off
REM ============================================================================
REM Script per riavviare i server con le modifiche AI Assistant
REM ============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║           RIAVVIO SERVER CON FIX AI ASSISTANT                             ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

echo [1/4] Termino tutti i processi Node.js...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo ⚠️  Nessun processo Node trovato o errore durante la terminazione
) else (
    echo ✅ Processi Node terminati
)

echo.
echo [2/4] Attendo 3 secondi...
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Pulisco cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite" 2>nul
    echo ✅ Cache Vite pulita
) else (
    echo ℹ️  Cache Vite già pulita
)

echo.
echo [4/4] Avvio npm start...
echo.
npm start

pause
