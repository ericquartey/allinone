# Script per correggere le porte nei test Playwright
# Corregge: 3079→8080 (backend) e 3007/3011/3012→3001 (frontend)

Write-Host "🔧 FIX PORTE TEST PLAYWRIGHT - EJLOG WMS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$testsDir = "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\tests"
$backupDir = "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\tests_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 1. Backup
Write-Host "[1/5] Creazione backup..." -ForegroundColor Yellow
Copy-Item -Path $testsDir -Destination $backupDir -Recurse
Write-Host "  ✅ Backup creato in: $backupDir" -ForegroundColor Green
Write-Host ""

# 2. Conta file da modificare
$testFiles = Get-ChildItem -Path $testsDir -Filter "*.spec.*" -File
Write-Host "[2/5] File test trovati: $($testFiles.Count)" -ForegroundColor Yellow
Write-Host ""

# 3. Fix porte
Write-Host "[3/5] Correzione porte in corso..." -ForegroundColor Yellow

$stats = @{
    FilesProcessed = 0
    Port3079Fixed = 0
    Port3007Fixed = 0
    Port3011Fixed = 0
    Port3012Fixed = 0
    Port5173Fixed = 0
}

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content

    # Fix backend port
    $content = $content -replace 'localhost:3079/EjLogHostVertimag', 'localhost:8080/EjLogHostVertimag'
    if ($content -ne $originalContent) { $stats.Port3079Fixed++ }

    # Fix frontend ports
    $content = $content -replace 'localhost:3007\b', 'localhost:3001'
    if ($content -ne $originalContent) { $stats.Port3007Fixed++ }

    $content = $content -replace 'localhost:3011\b', 'localhost:3001'
    if ($content -ne $originalContent) { $stats.Port3011Fixed++ }

    $content = $content -replace 'localhost:3012\b', 'localhost:3001'
    if ($content -ne $originalContent) { $stats.Port3012Fixed++ }

    $content = $content -replace 'localhost:5173\b', 'localhost:3001'
    if ($content -ne $originalContent) { $stats.Port5173Fixed++ }

    # Salva solo se modificato
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $stats.FilesProcessed++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[4/5] Statistiche modifiche:" -ForegroundColor Yellow
Write-Host "  - File modificati: $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "  - Port 3079→8080 (backend): $($stats.Port3079Fixed) occorrenze" -ForegroundColor White
Write-Host "  - Port 3007→3001 (frontend): $($stats.Port3007Fixed) occorrenze" -ForegroundColor White
Write-Host "  - Port 3011→3001 (frontend): $($stats.Port3011Fixed) occorrenze" -ForegroundColor White
Write-Host "  - Port 3012→3001 (frontend): $($stats.Port3012Fixed) occorrenze" -ForegroundColor White
Write-Host "  - Port 5173→3001 (frontend): $($stats.Port5173Fixed) occorrenze" -ForegroundColor White
Write-Host ""

# 5. Verifica
Write-Host "[5/5] Verifica modifiche..." -ForegroundColor Yellow
$wrongPorts = @()
foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'localhost:(3079|3007|3011|3012|5173)') {
        $wrongPorts += $file.Name
    }
}

if ($wrongPorts.Count -eq 0) {
    Write-Host "  ✅ Tutte le porte corrette!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Attenzione! Porte errate rimaste in:" -ForegroundColor Red
    foreach ($file in $wrongPorts) {
        Write-Host "     - $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ FIX COMPLETATO!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verifica: npx playwright test --reporter=list" -ForegroundColor White
Write-Host "  2. Se OK, elimina backup: Remove-Item '$backupDir' -Recurse" -ForegroundColor White
Write-Host "  3. Se problemi, ripristina: Copy-Item '$backupDir\*' -Destination '$testsDir' -Recurse -Force" -ForegroundColor White
Write-Host ""



