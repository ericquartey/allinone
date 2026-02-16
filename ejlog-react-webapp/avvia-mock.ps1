Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Mock API Server - Avvio in corso...           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp"

# Verifica dipendenze
if (-not (Test-Path "node_modules\express")) {
    Write-Host "[WARN] Express non trovato, installazione..." -ForegroundColor Yellow
    npm install --save-dev express cors
}

Write-Host "[INFO] Avvio mock server sulla porta 8080..." -ForegroundColor Green
Write-Host "[INFO] Premi CTRL+C per fermare il server" -ForegroundColor Yellow
Write-Host ""

node mock-api-server.js
