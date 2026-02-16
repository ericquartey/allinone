# EjLog Server Starter with Scheduler Integration
# PowerShell Script - Run with: .\START-SERVER.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EjLog API Server with Scheduler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/4] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/4] Cleaning up old processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  Stopping $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  Processes stopped!" -ForegroundColor Green
} else {
    Write-Host "  No Node.js processes running" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/4] Cleaning cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Vite cache cleared!" -ForegroundColor Green
} else {
    Write-Host "  No cache to clear" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/4] Starting API Server on port 3077..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Server starting..." -ForegroundColor Cyan
Write-Host "  Press CTRL+C to stop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start server
try {
    node server/api-server.js
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to start server!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

