@echo off
chcp 65001 >nul
cls

echo ============================================================================
echo    EJLOG WMS - AI Assistant Setup
echo ============================================================================
echo.
echo Questo script ti aiuterà a configurare l'AI Assistant.
echo.
echo REQUISITI:
echo   1. Account Anthropic Claude (https://console.anthropic.com/)
echo   2. API Key Claude (gratuita per testing, poi a consumo)
echo.
echo ============================================================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ⚠️  File .env non trovato!
    echo.
    echo Copio .env.example in .env...
    copy .env.example .env >nul
    echo ✅ File .env creato!
    echo.
)

echo 📋 STEP 1: Ottieni la tua API Key
echo.
echo    1. Vai su: https://console.anthropic.com/
echo    2. Login o Registrati
echo    3. Menu → API Keys
echo    4. Click "Create Key"
echo    5. Dai un nome (es: "EjLog WMS Production")
echo    6. COPIA la key (formato: sk-ant-api03-...)
echo.
echo 🌐 Vuoi aprire il sito Anthropic Console ora?
choice /C SN /M "Apri browser (S=Sì, N=No)"
if errorlevel 2 goto step2
if errorlevel 1 (
    start https://console.anthropic.com/settings/keys
    echo.
    echo ✅ Browser aperto! Ottieni la tua API key e torna qui.
    echo.
)

:step2
echo.
echo ============================================================================
echo 📋 STEP 2: Inserisci la tua API Key
echo ============================================================================
echo.
set /p APIKEY="Incolla qui la tua API Key Claude: "

if "%APIKEY%"=="" (
    echo.
    echo ❌ Errore: API Key non inserita!
    echo.
    pause
    exit /b 1
)

REM Validate API key format
echo %APIKEY% | findstr /R "^sk-ant-api03-" >nul
if errorlevel 1 (
    echo.
    echo ⚠️  WARNING: L'API key non sembra nel formato corretto.
    echo    Formato atteso: sk-ant-api03-...
    echo.
    echo Vuoi continuare comunque?
    choice /C SN /M "(S=Sì, N=No)"
    if errorlevel 2 (
        echo.
        echo Setup annullato.
        pause
        exit /b 1
    )
)

echo.
echo 💾 Salvataggio API key nel file .env...

REM Update .env file
powershell -Command "(Get-Content .env) -replace '^ANTHROPIC_API_KEY=.*', 'ANTHROPIC_API_KEY=%APIKEY%' | Set-Content .env"

echo ✅ API Key salvata!
echo.

echo ============================================================================
echo 📋 STEP 3: Configurazione AI
echo ============================================================================
echo.
echo Vuoi abilitare l'AI Assistant?
choice /C SN /M "(S=Sì, N=No)"
if errorlevel 2 (
    powershell -Command "(Get-Content .env) -replace '^AI_ENABLED=.*', 'AI_ENABLED=false' | Set-Content .env"
    echo.
    echo ℹ️  AI Assistant disabilitato. Puoi abilitarlo in seguito modificando .env
) else (
    powershell -Command "(Get-Content .env) -replace '^AI_ENABLED=.*', 'AI_ENABLED=true' | Set-Content .env"
    echo.
    echo ✅ AI Assistant abilitato!
)

echo.
echo ============================================================================
echo 📋 STEP 4: Test Configurazione
echo ============================================================================
echo.
echo Vuoi testare la connessione all'API Claude ora?
choice /C SN /M "(S=Sì, N=No)"
if errorlevel 2 goto step5

echo.
echo 🧪 Testing API connection...
echo.

REM Test API call
curl -s -X POST https://api.anthropic.com/v1/messages ^
    -H "x-api-key: %APIKEY%" ^
    -H "anthropic-version: 2023-06-01" ^
    -H "content-type: application/json" ^
    -d "{\"model\":\"claude-3-5-sonnet-20241022\",\"max_tokens\":50,\"messages\":[{\"role\":\"user\",\"content\":\"Say 'API OK'\"}]}" > test-response.tmp 2>&1

if errorlevel 1 (
    echo.
    echo ❌ Test fallito! Verifica:
    echo    1. API key corretta
    echo    2. Connessione internet
    echo    3. Firewall/proxy non blocca api.anthropic.com
    echo.
    type test-response.tmp
    del test-response.tmp
) else (
    findstr /C:"API OK" test-response.tmp >nul
    if errorlevel 1 (
        echo ⚠️  Risposta ricevuta ma non quella attesa.
        echo    Contenuto risposta:
        type test-response.tmp
    ) else (
        echo ✅ Test SUPERATO! API funzionante!
    )
    del test-response.tmp
)

:step5
echo.
echo ============================================================================
echo 🎉 SETUP COMPLETATO!
echo ============================================================================
echo.
echo Configurazione salvata in: .env
echo.
echo 📝 PROSSIMI PASSI:
echo.
echo    1. Verifica il file .env:
echo       notepad .env
echo.
echo    2. Riavvia il server:
echo       npm start
echo.
echo    3. Verifica console log:
echo       [AI Engine] ✅ Claude client initialized
echo.
echo    4. Testa nel frontend:
echo       http://localhost:3000 → Settings → Abilita AI Assistant
echo.
echo 📚 DOCUMENTAZIONE:
echo    - AI_CONFIGURATION_GUIDE.md  → Guida completa
echo    - AI_QUICK_START.md          → Quick start
echo    - .env.example                → Template configurazione
echo.
echo ============================================================================
echo.
pause
