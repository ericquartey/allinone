@echo off
echo ========================================
echo Restarting Backend on port 3077
echo ========================================

REM Kill any existing node processes
taskkill /F /IM node.exe 2>nul

REM Wait 2 seconds
timeout /t 2 /nobreak >nul

REM Start backend
cd /d "%~dp0"
set PORT=3077
start "Backend 3077" /MIN node server/api-server.js

echo Backend restarted!
timeout /t 3 /nobreak

