@echo off
echo ========================================
echo Starting Backend API Server on port 3077
echo ========================================
cd /d "%~dp0"
set PORT=3077
node server/api-server.js
pause

