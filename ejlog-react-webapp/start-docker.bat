@echo off
REM EjLog WMS - Start Docker and Open Browser
REM This script builds and starts the Docker container, then opens the browser

echo ============================================
echo EjLog WMS - Docker Startup
echo ============================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker is running...
echo.

REM Stop and remove existing container (if any)
echo [INFO] Stopping existing container (if any)...
docker-compose down 2>nul
echo.

REM Build the Docker image
echo [INFO] Building Docker image...
echo This may take a few minutes on first run...
docker-compose build
if errorlevel 1 (
    echo.
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)
echo.

REM Start the container
echo [INFO] Starting container...
docker-compose up -d
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start container!
    pause
    exit /b 1
)
echo.

REM Wait for container to be healthy
echo [INFO] Waiting for application to be ready...
timeout /t 5 /nobreak >nul

REM Check if container is running
docker-compose ps | findstr "ejlog-wms" | findstr "Up" >nul
if errorlevel 1 (
    echo [ERROR] Container is not running!
    echo.
    echo Showing container logs:
    docker-compose logs
    pause
    exit /b 1
)

echo [SUCCESS] Container is running!
echo.

REM Open browser
echo [INFO] Opening browser...
start http://localhost:3000

echo.
echo ============================================
echo EjLog WMS is now running!
echo ============================================
echo.
echo Application URL: http://localhost:3000
echo.
echo To stop the application:
echo   docker-compose down
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To restart:
echo   docker-compose restart
echo.
pause
