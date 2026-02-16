# Start Vite Development Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EJLOG WMS - Starting Vite Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[WARN] Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "[INFO] Starting Vite development server..." -ForegroundColor Green
Write-Host "[INFO] Server will be available at: http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start Vite
npm run dev
