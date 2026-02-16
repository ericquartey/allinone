@echo off
REM EjLog WMS - Start Development Server

echo ============================================
echo EjLog WMS - Starting Development Server
echo ============================================
echo.

cd /d C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp

echo [INFO] Starting Vite development server...
echo [INFO] Opening browser at http://localhost:3001
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start dev server
start http://localhost:3001
npm run dev
