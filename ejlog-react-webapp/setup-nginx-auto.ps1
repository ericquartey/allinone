# ============================================================================
# Script Automatico: Setup Nginx + Firewall per EjLog WMS
# Eseguire come Amministratore
# ============================================================================

param(
    [switch]$SkipNginxDownload,
    [switch]$SkipFirewall,
    [string]$NginxPath = "C:\nginx"
)

# Verifica privilegi amministratore
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERRORE: Questo script richiede privilegi di amministratore!" -ForegroundColor Red
    Write-Host "Esegui PowerShell come Amministratore e riprova." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Setup EjLog WMS - Accesso Esterno" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ============================================================================
# Step 1: Configurazione Firewall
# ============================================================================

if (-not $SkipFirewall) {
    Write-Host "[1/5] Configurazione Windows Firewall..." -ForegroundColor Green

    $rules = @(
        @{Name="EjLog Frontend"; Port=3000},
        @{Name="EjLog API"; PORT=3077},
        @{Name="EjLog HTTPS"; Port=3079},
        @{Name="Nginx HTTP"; Port=80},
        @{Name="Nginx HTTPS"; Port=443}
    )

    foreach ($rule in $rules) {
        Write-Host "  - Aggiunta regola: $($rule.Name) (porta $($rule.Port))" -ForegroundColor Gray

        # Rimuovi regola esistente
        Remove-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue

        # Aggiungi nuova regola
        New-NetFirewallRule -DisplayName $rule.Name `
                            -Direction Inbound `
                            -Action Allow `
                            -Protocol TCP `
                            -LocalPort $rule.Port `
                            -ErrorAction SilentlyContinue | Out-Null
    }

    Write-Host "  ✓ Firewall configurato!" -ForegroundColor Green
} else {
    Write-Host "[1/5] Firewall: SALTATO" -ForegroundColor Yellow
}

# ============================================================================
# Step 2: Download e Installazione Nginx
# ============================================================================

Write-Host "`n[2/5] Installazione Nginx..." -ForegroundColor Green

$nginxVersion = "1.25.3"
$nginxUrl = "http://nginx.org/download/nginx-$nginxVersion.zip"
$tempZip = "$env:TEMP\nginx-$nginxVersion.zip"

if (-not $SkipNginxDownload) {
    if (Test-Path $NginxPath) {
        Write-Host "  ! Nginx già installato in $NginxPath" -ForegroundColor Yellow
        $overwrite = Read-Host "  Sovrascrivere? (s/N)"
        if ($overwrite -ne "s" -and $overwrite -ne "S") {
            Write-Host "  - Installazione Nginx saltata" -ForegroundColor Gray
            $SkipNginxDownload = $true
        } else {
            Remove-Item -Path $NginxPath -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    if (-not $SkipNginxDownload) {
        Write-Host "  - Download Nginx $nginxVersion..." -ForegroundColor Gray

        try {
            Invoke-WebRequest -Uri $nginxUrl -OutFile $tempZip -UseBasicParsing
            Write-Host "  ✓ Download completato" -ForegroundColor Green

            Write-Host "  - Estrazione in $NginxPath..." -ForegroundColor Gray
            Expand-Archive -Path $tempZip -DestinationPath "C:\" -Force
            Rename-Item -Path "C:\nginx-$nginxVersion" -NewName "nginx" -Force

            Remove-Item $tempZip -Force
            Write-Host "  ✓ Nginx installato in $NginxPath" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Errore download Nginx: $_" -ForegroundColor Red
            Write-Host "  ! Scarica manualmente da: https://nginx.org/en/download.html" -ForegroundColor Yellow
            exit 1
        }
    }
} else {
    Write-Host "  - Download Nginx: SALTATO" -ForegroundColor Yellow
}

# ============================================================================
# Step 3: Copia Configurazione Nginx
# ============================================================================

Write-Host "`n[3/5] Configurazione Nginx..." -ForegroundColor Green

$sourceConfig = "$PSScriptRoot\nginx.conf"
$targetConfig = "$NginxPath\conf\nginx.conf"

if (Test-Path $sourceConfig) {
    Write-Host "  - Backup configurazione esistente..." -ForegroundColor Gray
    if (Test-Path $targetConfig) {
        Copy-Item $targetConfig "$targetConfig.backup" -Force
    }

    Write-Host "  - Copia nuova configurazione..." -ForegroundColor Gray
    Copy-Item $sourceConfig $targetConfig -Force
    Write-Host "  ✓ Configurazione aggiornata" -ForegroundColor Green
} else {
    Write-Host "  ✗ File nginx.conf non trovato in $PSScriptRoot" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Step 4: Test Configurazione Nginx
# ============================================================================

Write-Host "`n[4/5] Test configurazione Nginx..." -ForegroundColor Green

$nginxExe = "$NginxPath\nginx.exe"

if (Test-Path $nginxExe) {
    $testResult = & $nginxExe -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Configurazione valida!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Errore nella configurazione:" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✗ nginx.exe non trovato!" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Step 5: Avvio Nginx
# ============================================================================

Write-Host "`n[5/5] Avvio Nginx..." -ForegroundColor Green

# Controlla se Nginx è già in esecuzione
$nginxProcess = Get-Process -Name nginx -ErrorAction SilentlyContinue

if ($nginxProcess) {
    Write-Host "  ! Nginx già in esecuzione (PID: $($nginxProcess.Id))" -ForegroundColor Yellow
    $restart = Read-Host "  Riavviare? (s/N)"

    if ($restart -eq "s" -or $restart -eq "S") {
        Write-Host "  - Stop Nginx..." -ForegroundColor Gray
        & $nginxExe -s quit
        Start-Sleep -Seconds 2

        Write-Host "  - Start Nginx..." -ForegroundColor Gray
        Start-Process $nginxExe -WorkingDirectory $NginxPath -WindowStyle Hidden
        Write-Host "  ✓ Nginx riavviato!" -ForegroundColor Green
    }
} else {
    Write-Host "  - Avvio Nginx..." -ForegroundColor Gray
    Start-Process $nginxExe -WorkingDirectory $NginxPath -WindowStyle Hidden
    Start-Sleep -Seconds 1

    $nginxProcess = Get-Process -Name nginx -ErrorAction SilentlyContinue
    if ($nginxProcess) {
        Write-Host "  ✓ Nginx avviato (PID: $($nginxProcess.Id))!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Errore avvio Nginx" -ForegroundColor Red
        Write-Host "  ! Controlla i log: $NginxPath\logs\error.log" -ForegroundColor Yellow
        exit 1
    }
}

# ============================================================================
# Riepilogo Finale
# ============================================================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Setup Completato con Successo!" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "Configurazione di Rete:" -ForegroundColor White
Write-Host "  IP Locale:   10.4.1.125" -ForegroundColor Gray
Write-Host "  IP Pubblico: 213.82.68.18" -ForegroundColor Gray

Write-Host "`nURL di Accesso:" -ForegroundColor White
Write-Host "  Rete Locale (HTTPS): https://10.4.1.125" -ForegroundColor Green
Write-Host "  Rete Locale (HTTP):  http://10.4.1.125:3000" -ForegroundColor Yellow
Write-Host "  Internet (HTTPS):    https://213.82.68.18" -ForegroundColor Green
Write-Host "                       (richiede port forwarding sul router)" -ForegroundColor Gray

Write-Host "`nServizi Attivi:" -ForegroundColor White
Write-Host "  Frontend Vite:  http://localhost:3000" -ForegroundColor Gray
Write-Host "  API Backend:    http://localhost:3077" -ForegroundColor Gray
Write-Host "  API HTTPS:      https://localhost:3079" -ForegroundColor Gray
Write-Host "  Nginx:          https://localhost:443" -ForegroundColor Gray

Write-Host "`nComandi Utili:" -ForegroundColor White
Write-Host "  Test config:    nginx.exe -t" -ForegroundColor Gray
Write-Host "  Reload:         nginx.exe -s reload" -ForegroundColor Gray
Write-Host "  Stop:           nginx.exe -s quit" -ForegroundColor Gray
Write-Host "  Log errori:     type C:\nginx\logs\error.log" -ForegroundColor Gray

Write-Host "`nProssimi Passi:" -ForegroundColor White
Write-Host "  1. Configura Port Forwarding sul router (http://10.4.1.203)" -ForegroundColor Yellow
Write-Host "     - Porta 443 -> 10.4.1.125:443 (HTTPS)" -ForegroundColor Yellow
Write-Host "     - Porta 80  -> 10.4.1.125:80 (HTTP redirect)" -ForegroundColor Yellow
Write-Host "  2. Testa accesso esterno: https://213.82.68.18" -ForegroundColor Yellow
Write-Host "  3. (Opzionale) Configura DNS dinamico con No-IP o Cloudflare" -ForegroundColor Yellow

Write-Host "`nDocumentazione completa: ACCESSO-ESTERNO.md`n" -ForegroundColor Cyan

