@echo off
:: ============================================================================
:: EjLog WMS v1.0.0 - Creazione Pacchetto Deploy
:: ============================================================================

title EjLog WMS - Creazione Pacchetto Deploy

echo.
echo ========================================================================
echo    EjLog WMS v1.0.0 - Creazione Pacchetto Deploy
echo ========================================================================
echo.

set DEPLOY_DIR=deploy\ejlog-wms-v1.0.0
set VERSION=1.0.0
set BUILD_DATE=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%

echo [1/10] Pulizia cartelle deploy esistenti...
if exist deploy rmdir /s /q deploy
mkdir deploy
mkdir %DEPLOY_DIR%
mkdir %DEPLOY_DIR%\frontend
mkdir %DEPLOY_DIR%\backend
mkdir %DEPLOY_DIR%\config
mkdir %DEPLOY_DIR%\scripts
mkdir %DEPLOY_DIR%\docs
mkdir %DEPLOY_DIR%\logs
mkdir %DEPLOY_DIR%\backups
echo OK

echo [2/10] Copia frontend build...
xcopy /E /I /Y dist %DEPLOY_DIR%\frontend\dist
echo OK

echo [3/10] Copia backend...
xcopy /E /I /Y server %DEPLOY_DIR%\backend\server
xcopy /Y package.json %DEPLOY_DIR%\backend\
xcopy /Y package-lock.json %DEPLOY_DIR%\backend\
echo OK

echo [4/10] Copia configurazione...
xcopy /Y config\*.json %DEPLOY_DIR%\config\
copy deploy\ejlog-wms-v1.0.0\config\.env.example %DEPLOY_DIR%\config\.env.example
echo OK

echo [5/10] Copia scripts installazione...
copy deploy\ejlog-wms-v1.0.0\install.bat %DEPLOY_DIR%\install.bat
copy deploy\ejlog-wms-v1.0.0\start-production.bat %DEPLOY_DIR%\start-production.bat
copy deploy\ejlog-wms-v1.0.0\stop-all.bat %DEPLOY_DIR%\stop-all.bat
echo OK

echo [6/10] Copia documentazione...
copy deploy\ejlog-wms-v1.0.0\README.md %DEPLOY_DIR%\README.md
copy deploy\ejlog-wms-v1.0.0\INSTALL.md %DEPLOY_DIR%\INSTALL.md
copy WAREHOUSE_MANAGEMENT_IMPLEMENTATION.md %DEPLOY_DIR%\docs\
copy WAREHOUSE_IMPROVEMENTS.md %DEPLOY_DIR%\docs\
echo OK

echo [7/10] Creazione file versione...
(
    echo EjLog WMS
    echo Version: %VERSION%
    echo Build Date: %BUILD_DATE%
    echo Environment: Production
    echo.
    echo Components:
    echo - Frontend: React 18 + Vite
    echo - Backend: Node.js + Express
    echo - Database: SQL Server
    echo.
    echo (c) 2025 EjLog WMS - Tutti i diritti riservati
) > %DEPLOY_DIR%\VERSION.txt
echo OK

echo [8/10] Creazione .gitignore...
(
    echo node_modules/
    echo dist/
    echo build/
    echo .env
    echo logs/*.log
    echo backups/*.bak
    echo *.zip
) > %DEPLOY_DIR%\.gitignore
echo OK

echo [9/10] Creazione archivio ZIP...
powershell -command "Compress-Archive -Path '%DEPLOY_DIR%\*' -DestinationPath 'ejlog-wms-v%VERSION%-%BUILD_DATE%.zip' -Force"
echo OK

echo [10/10] Verifica pacchetto...
if exist "ejlog-wms-v%VERSION%-%BUILD_DATE%.zip" (
    echo OK - Pacchetto creato con successo!
    for %%A in ("ejlog-wms-v%VERSION%-%BUILD_DATE%.zip") do echo Dimensione: %%~zA bytes
) else (
    echo ERRORE - Creazione archivio fallita
    pause
    exit /b 1
)

echo.
echo ========================================================================
echo    PACCHETTO DEPLOY CREATO CON SUCCESSO!
echo ========================================================================
echo.
echo File generati:
echo.
echo 1. Cartella:  %DEPLOY_DIR%\
echo 2. Archivio:  ejlog-wms-v%VERSION%-%BUILD_DATE%.zip
echo.
echo Contenuto pacchetto:
echo    - Frontend build (dist/)
echo    - Backend server (server/)
echo    - Configurazione (.env.example, *.json)
echo    - Script installazione (install.bat, start-production.bat)
echo    - Documentazione (README.md, INSTALL.md)
echo.
echo Per distribuire:
echo    1. Copia ejlog-wms-v%VERSION%-%BUILD_DATE%.zip su altro PC
echo    2. Estrai in C:\EjLog-WMS
echo    3. Esegui install.bat
echo    4. Configura .env
echo    5. Esegui start-production.bat
echo.
echo ========================================================================
echo.

pause
