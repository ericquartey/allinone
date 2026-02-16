# Script PowerShell per avviare il Frontend Vite
# Mostra output in tempo reale e apre il browser quando pronto

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colori
$Host.UI.RawUI.BackgroundColor = "Black"
$Host.UI.RawUI.ForegroundColor = "Green"
Clear-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EjLog - Avvio Frontend Vite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Naviga alla directory del progetto
$projectPath = "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp"
Set-Location $projectPath
Write-Host "Directory: $projectPath" -ForegroundColor Yellow
Write-Host ""

# Pulisci cache Vite
$viteCachePath = Join-Path $projectPath "node_modules\.vite"
if (Test-Path $viteCachePath) {
    Write-Host "Pulizia cache Vite..." -ForegroundColor Yellow
    Remove-Item -Path $viteCachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache pulita!" -ForegroundColor Green
    Write-Host ""
}

# Imposta variabili d'ambiente
$env:PORT = "3000"
$env:NODE_ENV = "development"

Write-Host "Configurazione:" -ForegroundColor Cyan
Write-Host "  Porta: 3000" -ForegroundColor White
Write-Host "  Ambiente: development" -ForegroundColor White
Write-Host ""

Write-Host "Avvio Vite dev server..." -ForegroundColor Yellow
Write-Host "Attendere compilazione..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Avvia Vite con npx
try {
    # Esegui in background per poter aprire il browser
    $job = Start-Job -ScriptBlock {
        param($path)
        Set-Location $path
        $env:PORT = "3000"
        npx vite --port 3000 2>&1
    } -ArgumentList $projectPath

    # Aspetta che il server sia pronto
    Write-Host "Attendo che Vite sia pronto..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    # Monitora l'output
    $serverReady = $false
    $timeout = 60
    $elapsed = 0

    while (-not $serverReady -and $elapsed -lt $timeout) {
        $output = Receive-Job -Job $job 2>&1
        if ($output) {
            $output | ForEach-Object {
                Write-Host $_ -ForegroundColor White
                if ($_ -match "Local:.*http://localhost:3000" -or $_ -match "ready in") {
                    $serverReady = $true
                }
            }
        }

        if (-not $serverReady) {
            Start-Sleep -Seconds 1
            $elapsed++
        }
    }

    if ($serverReady) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SERVER PRONTO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "URL: http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Apertura browser..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        Start-Process "http://localhost:3000"

        Write-Host ""
        Write-Host "Browser aperto!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Premi Ctrl+C per fermare il server" -ForegroundColor Yellow
        Write-Host ""

        # Continua a mostrare l'output
        while ($job.State -eq "Running") {
            $output = Receive-Job -Job $job 2>&1
            if ($output) {
                $output | ForEach-Object {
                    Write-Host $_ -ForegroundColor White
                }
            }
            Start-Sleep -Milliseconds 500
        }
    } else {
        Write-Host ""
        Write-Host "ERRORE: Server non pronto dopo $timeout secondi" -ForegroundColor Red
        Write-Host ""
        Write-Host "Output del processo:" -ForegroundColor Yellow
        $output = Receive-Job -Job $job 2>&1
        $output | ForEach-Object {
            Write-Host $_ -ForegroundColor Red
        }
    }

    Stop-Job -Job $job -ErrorAction SilentlyContinue
    Remove-Job -Job $job -ErrorAction SilentlyContinue

} catch {
    Write-Host ""
    Write-Host "ERRORE durante l'avvio:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "Premi un tasto per chiudere..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
