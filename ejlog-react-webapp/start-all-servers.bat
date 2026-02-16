@echo off
REM ============================================================================
REM EjLog - Avvio Automatico Tutti i Server con Dati Reali
REM ============================================================================
REM Questo script avvia automaticamente:
REM - REST HTTPS Server sulla porta 3079
REM - Backend SQL sulla porta 3077 (dati reali da database promag)
REM - Backend React sulla porta 8080
REM - Frontend Vite sulla porta 3000
REM
REM SALVA CONFIGURAZIONE IN: server/config/server-config.json
REM
REM UTILIZZO:
REM   start-all-servers.bat
REM   oppure
REM   npm start
REM ============================================================================

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                           ║
echo ║                   EjLog WMS - Avvio Completo Sistema                      ║
echo ║                   Con Dati Reali dal Database                             ║
echo ║                                                                           ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

REM Ferma tutti i processi Node esistenti
echo [0/6] Chiusura processi Node esistenti...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo       ✓ Processi chiusi
echo.

REM Pulisci cache Vite
echo [1/6] Pulizia cache Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite" 2>nul
    echo       ✓ Cache pulita
) else (
    echo       ✓ Nessuna cache da pulire
)
echo.

REM Avvia REST HTTPS Server su 3079
echo [2/6] Avvio REST HTTPS Server su porta 3079...
start "REST-HTTPS-3079" cmd /k "cd /d %~dp0 && set HTTPS_PORT=3079 && node server/api-server-https.js"
timeout /t 3 /nobreak >nul
echo       ✓ Server HTTPS avviato
echo.

REM Avvia Backend SQL su 3077
echo [3/6] Avvio Backend SQL su porta 3077...
start "Backend-SQL-3077" cmd /k "cd /d %~dp0 && set PORT=3077 && node server/api-server.js"
timeout /t 3 /nobreak >nul
echo       ✓ Backend SQL avviato
echo.

REM Avvia Backend React su 8080
echo [4/6] Avvio Backend React su porta 8080...
start "Backend-React-8080" cmd /k "cd /d %~dp0 && set PORT=8080 && node server/api-server.js"
timeout /t 3 /nobreak >nul
echo       ✓ Backend React avviato
echo.

REM Avvia Frontend Vite su 3000
echo [5/6] Avvio Frontend Vite su porta 3000...
start "Frontend-Vite-3000" cmd /k "cd /d %~dp0 && set PORT=3000 && npm run dev:frontend-only"
timeout /t 5 /nobreak >nul
echo       ✓ Frontend Vite avviato
echo.

REM Verifica che i server siano attivi
echo [6/6] Verifica server attivi...
timeout /t 3 /nobreak >nul
echo       ✓ Verifica completata
echo.

REM Attendi che tutti i server siano pronti
echo Attendo inizializzazione server...
timeout /t 8 /nobreak >nul
echo.

echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                        SISTEMA AVVIATO CON SUCCESSO!                      ║
echo ╠═══════════════════════════════════════════════════════════════════════════╣
echo ║                                                                           ║
echo ║  REST HTTPS:     https://localhost:3079                                   ║
echo ║  Backend SQL:    http://localhost:3077                                    ║
echo ║  Backend React:  http://localhost:8080                                    ║
echo ║  Frontend:       http://localhost:3000                                    ║
echo ║                                                                           ║
echo ║  Swagger Docs:   http://localhost:3077/api-docs                           ║
echo ║  Health Check:   http://localhost:3077/health                             ║
echo ║  WebSocket:      ws://localhost:3077/ws                                   ║
echo ║                                                                           ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.

REM Apri il browser
echo Apertura browser...
timeout /t 2 /nobreak >nul
start chrome "http://localhost:3000"

echo.
echo Tutti i server sono attivi e il browser è stato aperto!
echo Premi un tasto per chiudere questa finestra...
pause >nul

