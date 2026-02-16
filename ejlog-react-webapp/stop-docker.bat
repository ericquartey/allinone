@echo off
REM EjLog WMS - Stop Docker Container

echo ============================================
echo EjLog WMS - Stopping Docker Container
echo ============================================
echo.

docker-compose down

if errorlevel 1 (
    echo [ERROR] Failed to stop container!
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Container stopped successfully!
echo.
pause
