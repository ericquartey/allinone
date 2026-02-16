@echo off
cd /d C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp
start "Mock API Server - Port 8080" /min cmd /k "node mock-api-server.js"
timeout /t 5 /nobreak >nul
netstat -ano | findstr :8080
