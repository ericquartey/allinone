# EjLog WMS - Crea pacchetto v1.0.1 (con fix browser)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  EjLog WMS - Creazione Pacchetto v1.0.1 (con FIX Browser)" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

$sourceDir = "ejlog-wms-v1.0.0"
$outputZip = "ejlog-wms-v1.0.1-FIXED.zip"

# Verifica directory sorgente
if (-not (Test-Path $sourceDir)) {
    Write-Host "[ERRORE] Directory $sourceDir non trovata!" -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Verifica files..." -ForegroundColor Yellow

$requiredFiles = @(
    "$sourceDir\start-production-FIXED.bat",
    "$sourceDir\start-production-debug.bat",
    "$sourceDir\QUICK-FIX-BROWSER.md",
    "$sourceDir\TROUBLESHOOTING.md",
    "$sourceDir\LEGGIMI-IMPORTANTE.txt"
)

$allExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [ERRORE] $file non trovato!" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host ""
    Write-Host "[ERRORE] File mancanti! Impossibile creare il pacchetto." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Calcolo dimensione..." -ForegroundColor Yellow

$dirSize = (Get-ChildItem -Path $sourceDir -Recurse | Measure-Object -Property Length -Sum).Sum
$dirSizeMB = [math]::Round($dirSize / 1MB, 2)

Write-Host "  Dimensione: $dirSizeMB MB" -ForegroundColor Cyan
Write-Host ""

Write-Host "[3/4] Creazione ZIP..." -ForegroundColor Yellow

# Rimuovi zip esistente
if (Test-Path $outputZip) {
    Write-Host "  Rimozione pacchetto precedente..." -ForegroundColor Gray
    Remove-Item $outputZip -Force
}

# Crea ZIP
Write-Host "  Compressione in corso..." -ForegroundColor Gray
Compress-Archive -Path $sourceDir -DestinationPath $outputZip -CompressionLevel Optimal

if (Test-Path $outputZip) {
    $zipSize = (Get-Item $outputZip).Length
    $zipSizeMB = [math]::Round($zipSize / 1MB, 2)
    Write-Host "  [OK] Pacchetto creato: $zipSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "  [ERRORE] Creazione ZIP fallita!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[4/4] Calcolo MD5..." -ForegroundColor Yellow

$md5 = Get-FileHash $outputZip -Algorithm MD5
$md5Hash = $md5.Hash.ToLower()

Write-Host "  MD5: $md5Hash" -ForegroundColor Cyan
Write-Host ""

# Crea file info
$infoFile = "PACKAGE-INFO-v1.0.1.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

@"
================================================================================
    EjLog WMS v1.0.1 - PACKAGE INFO (con FIX Browser)
================================================================================

File:           $outputZip
Versione:       1.0.1
Data creazione: $timestamp
Dimensione:     $zipSizeMB MB
MD5:            $md5Hash

================================================================================
NOVITA' v1.0.1 (FIX Browser)
================================================================================

✅ FIX: Browser non carica (pagina bianca)
   - Sostituito http-server con serve
   - serve gestisce correttamente le React SPA

✅ NUOVO: start-production-FIXED.bat
   - Usa serve invece di http-server
   - Migliore gestione routing React

✅ NUOVO: start-production-debug.bat
   - Diagnostica completa all'avvio
   - Verifica prerequisiti
   - Health check backend/frontend
   - Log dettagliato

✅ NUOVE GUIDE:
   - QUICK-FIX-BROWSER.md    (soluzione rapida)
   - TROUBLESHOOTING.md      (guida completa)
   - LEGGIMI-IMPORTANTE.txt  (istruzioni immediate)

================================================================================
SCRIPT DISPONIBILI
================================================================================

CONSIGLIATI:
  ✅ start-production-FIXED.bat  <- USA QUESTO
  ✅ start-production-debug.bat  <- Per diagnostica
  ✅ start-production-v2.bat     <- Uguale al FIXED

DEPRECATI:
  ⚠️  start-production.bat        <- Vecchio (può dare errori)

================================================================================
PROCEDURA INSTALLAZIONE
================================================================================

1. Estrai $outputZip in una cartella

2. Esegui: install.bat

3. Esegui: start-production-FIXED.bat

4. Attendi 15-20 secondi

5. Se vedi pagina bianca, premi F5

6. Login: admin / admin

================================================================================
CONTENUTO PACCHETTO
================================================================================

/backend/               Backend Node.js + Express
  /server/              Server API
  /node_modules/        Dipendenze (da installare)

/frontend/              Frontend React build
  /dist/                Build production
    /assets/            JavaScript, CSS, immagini
    index.html          Entry point

/config/                Configurazione
  .env                  Database config (SQL Server)

/logs/                  Log applicazione
/backups/               Backup database
/scripts/               Script utility

install.bat             Installazione dipendenze
start-production-FIXED.bat    Avvio (CONSIGLIATO)
start-production-debug.bat    Avvio con diagnostica
start-production.bat    Avvio (deprecato)
stop-all.bat            Stop tutti i server

LEGGIMI-IMPORTANTE.txt  LEGGI PRIMA DI USARE!
QUICK-FIX-BROWSER.md    Fix pagina bianca
TROUBLESHOOTING.md      Guida problemi
LEGGIMI.txt             Istruzioni base

================================================================================
REQUISITI SISTEMA
================================================================================

✓ Windows 10 o superiore
✓ Node.js 18.x o 20.x
✓ SQL Server (database promag)
✓ Porte libere: 3000, 3077, 3079, 8080

================================================================================
SUPPORTO
================================================================================

Log errori:   logs/ejlog-wms.log
Log avvio:    start-debug.log
Guide:        TROUBLESHOOTING.md

================================================================================
"@ | Out-File -FilePath $infoFile -Encoding UTF8

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  PACCHETTO CREATO CON SUCCESSO!" -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "File creato:    $outputZip" -ForegroundColor White
Write-Host "Dimensione:     $zipSizeMB MB" -ForegroundColor White
Write-Host "MD5:            $md5Hash" -ForegroundColor White
Write-Host "Info salvate:   $infoFile" -ForegroundColor White
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "  PROSSIMI PASSI" -ForegroundColor Yellow
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Distribuisci il file:" -ForegroundColor White
Write-Host "   $outputZip" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Istruzioni per l'utente:" -ForegroundColor White
Write-Host "   - Estrai il file ZIP" -ForegroundColor Gray
Write-Host "   - Esegui: install.bat" -ForegroundColor Gray
Write-Host "   - IMPORTANTE: Usa start-production-FIXED.bat" -ForegroundColor Yellow
Write-Host "   - In caso di problemi: leggi QUICK-FIX-BROWSER.md" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host ""

# Apri cartella
Write-Host "Vuoi aprire la cartella del pacchetto? (S/N): " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    explorer.exe .
}

Write-Host ""
Write-Host "✅ Completato!" -ForegroundColor Green
Write-Host ""

