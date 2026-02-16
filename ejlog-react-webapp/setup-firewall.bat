@echo off
REM ============================================================================
REM Script di Configurazione Firewall Windows per EjLog
REM Eseguire come Amministratore
REM ============================================================================

echo.
echo ========================================
echo  Configurazione Firewall per EjLog
echo ========================================
echo.

REM Verifica privilegi amministratore
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERRORE: Esegui questo script come Amministratore!
    echo Click destro -^> Esegui come amministratore
    pause
    exit /b 1
)

echo [1/5] Configurazione porte EjLog...

REM Rimuovi regole esistenti (se presenti)
netsh advfirewall firewall delete rule name="EjLog Frontend" >nul 2>&1
netsh advfirewall firewall delete rule name="EjLog API" >nul 2>&1
netsh advfirewall firewall delete rule name="EjLog HTTPS" >nul 2>&1
netsh advfirewall firewall delete rule name="Nginx HTTP" >nul 2>&1
netsh advfirewall firewall delete rule name="Nginx HTTPS" >nul 2>&1

echo [2/5] Aggiunta regola Frontend (porta 3000)...
netsh advfirewall firewall add rule name="EjLog Frontend" dir=in action=allow protocol=TCP localport=3000

echo [3/5] Aggiunta regola API Backend (porta 3077)...
netsh advfirewall firewall add rule name="EjLog API" dir=in action=allow protocol=TCP localPORT=3077

echo [4/5] Aggiunta regola HTTPS API (porta 3079)...
netsh advfirewall firewall add rule name="EjLog HTTPS" dir=in action=allow protocol=TCP localport=3079

echo [5/5] Aggiunta regole Nginx (porte 80, 443)...
netsh advfirewall firewall add rule name="Nginx HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="Nginx HTTPS" dir=in action=allow protocol=TCP localport=443

echo.
echo ========================================
echo  Configurazione Completata!
echo ========================================
echo.
echo Regole firewall aggiunte:
netsh advfirewall firewall show rule name="EjLog Frontend" | findstr "Nome regola:"
netsh advfirewall firewall show rule name="EjLog API" | findstr "Nome regola:"
netsh advfirewall firewall show rule name="EjLog HTTPS" | findstr "Nome regola:"
netsh advfirewall firewall show rule name="Nginx HTTP" | findstr "Nome regola:"
netsh advfirewall firewall show rule name="Nginx HTTPS" | findstr "Nome regola:"
echo.
echo Porte aperte:
echo   - 3000 (Frontend Vite)
echo   - 3077 (API Backend)
echo   - 3079 (HTTPS API)
echo   - 80   (Nginx HTTP)
echo   - 443  (Nginx HTTPS)
echo.
pause

