# Fix Playwright Test Ports
Write-Host "🔧 Fixing Playwright test ports..." -ForegroundColor Cyan
Write-Host ""

$testsDir = "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\tests"
$backupDir = "C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\tests_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 1. Backup
Write-Host "[1/4] Creating backup..." -ForegroundColor Yellow
Copy-Item -Path $testsDir -Destination $backupDir -Recurse
Write-Host "  ✅ Backup created: $backupDir" -ForegroundColor Green
Write-Host ""

# 2. Get all test files
$testFiles = Get-ChildItem -Path $testsDir -Filter "*.spec.*" -File
Write-Host "[2/4] Found $($testFiles.Count) test files" -ForegroundColor Yellow
Write-Host ""

# 3. Fix ports
Write-Host "[3/4] Fixing ports..." -ForegroundColor Yellow
$fixed = 0

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $original = $content

    # Backend port fix
    $content = $content -replace 'localhost:3079/EjLogHostVertimag', 'localhost:8080/EjLogHostVertimag'

    # Frontend port fixes
    $content = $content -replace 'localhost:3007\b', 'localhost:3001'
    $content = $content -replace 'localhost:3011\b', 'localhost:3001'
    $content = $content -replace 'localhost:3012\b', 'localhost:3001'
    $content = $content -replace 'localhost:5173\b', 'localhost:3001'

    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $fixed++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "  Fixed $fixed files" -ForegroundColor Green
Write-Host ""

# 4. Verify
Write-Host "[4/4] Verifying..." -ForegroundColor Yellow
$errors = @()
foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'localhost:(3079|3007|3011|3012|5173)') {
        $errors += $file.Name
    }
}

if ($errors.Count -eq 0) {
    Write-Host "  ✅ All ports corrected!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Errors in:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "     - $_" -ForegroundColor Red }
}

Write-Host ""
Write-Host "✅ DONE!" -ForegroundColor Green
Write-Host "Backup: $backupDir" -ForegroundColor Gray

