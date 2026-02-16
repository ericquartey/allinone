# Script PowerShell per avviare i Backend con dati reali
# Backend SQL (3077) + Backend React (8080)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EjLog - Avvio Backend Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp"
Set-Location $projectPath

Write-Host "Directory: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Verifica esistenza script backend
$backendScript = Join-Path $projectPath "server\api-server.js"
if (-not (Test-Path $backendScript)) {
    Write-Host "ERRORE: File $backendScript non trovato!" -ForegroundColor Red
    Read-Host "Premi un tasto per uscire"
    exit 1
}

Write-Host "Avvio Backend Servers..." -ForegroundColor Yellow
Write-Host ""

# Avvia Backend SQL su porta 3077 in una nuova finestra
Write-Host "1. Backend SQL (porta 3077) - Dati reali da database" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectPath'; `$env:PORT='3077'; Write-Host '=== Backend SQL - Porta 3077 ===' -ForegroundColor Cyan; node server\api-server.js"
)

Start-Sleep -Seconds 2

# Avvia Backend React su porta 8080 in una nuova finestra
Write-Host "2. Backend React (porta 8080)" -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$projectPath'; `$env:PORT='8080'; Write-Host '=== Backend React - Porta 8080 ===' -ForegroundColor Green; node server\api-server.js"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Backend servers avviati!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend SQL:   http://localhost:3077" -ForegroundColor Cyan
Write-Host "Backend React: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Attendere qualche secondo per l'inizializzazione..." -ForegroundColor Yellow
Write-Host ""

# Attendi inizializzazione
Write-Host "Attendo 10 secondi per l'avvio dei server..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verifica porte in ascolto
Write-Host ""
Write-Host "Verifica porte in ascolto:" -ForegroundColor Cyan
$ports = @(3077, 8080)
foreach ($port in $ports) {
    $listening = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host "  Porta $port : OK" -ForegroundColor Green
    } else {
        Write-Host "  Porta $port : NON IN ASCOLTO" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Controlla le finestre PowerShell aperte per eventuali errori." -ForegroundColor Yellow
Write-Host ""
Write-Host "Premi un tasto per chiudere..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

