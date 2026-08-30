# ==============================================================================
# KemKendra B2B Marketplace - PostgreSQL Backup Script (PowerShell)
# ==============================================================================
# Creates a compressed, custom-format (-Fc) logical dump of the PostgreSQL database.
# Preserves all UUIDs, schema definitions, constraints, foreign keys, indexes,
# sequences, and Flyway schema history (V1..V40).
#
# Usage:
#   $env:DB_URL = "postgresql://user:password@host:port/dbname?sslmode=require"
#   .\db-backup.ps1 -OutputDir "database\backups"
#
# Or pass as parameter:
#   .\db-backup.ps1 -DbUrl "postgresql://user:password@host:port/dbname?sslmode=require" -OutputDir "database\backups"
# ==============================================================================

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$OutputDir = "database\backups",

    [Parameter()]
    [string]$DbUrl = $env:DB_URL
)

$ErrorActionPreference = "Stop"

# 1. Verify pg_dump is available in PATH
$pgDumpCmd = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpCmd) {
    Write-Error "ERROR: 'pg_dump' executable was not found in PATH. Please install PostgreSQL tools or add the PostgreSQL bin folder to PATH."
    exit 1
}

# 2. Validate database connection URL
if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Write-Error "ERROR: Database connection URL is not provided. Set `$env:DB_URL or specify -DbUrl parameter."
    exit 1
}

# 3. Create output directory if it does not exist
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFilePath = Join-Path -Path $OutputDir -ChildPath "synthora_backup_$timestamp.dump"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Starting KemKendra Database Backup" -ForegroundColor Cyan
Write-Host " Destination: $backupFilePath" -ForegroundColor Cyan
Write-Host " Timestamp:   $((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC'))" -ForegroundColor Cyan
Write-Host " Format:      Custom Binary Archive (-Fc, compressed)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 4. Execute pg_dump
try {
    & pg_dump -Fc --no-owner --no-acl --verbose -d "$DbUrl" -f "$backupFilePath"
    if ($LASTEXITCODE -eq 0 -and (Test-Path $backupFilePath)) {
        $fileSize = (Get-Item $backupFilePath).Length / 1MB
        $formattedSize = "{0:N2} MB" -f $fileSize
        Write-Host "=================================================================" -ForegroundColor Green
        Write-Host " SUCCESS: Database backup completed successfully!" -ForegroundColor Green
        Write-Host " File: $backupFilePath (Size: $formattedSize)" -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Green
        exit 0
    } else {
        Write-Error "ERROR: pg_dump execution failed with exit code $LASTEXITCODE."
        if (Test-Path $backupFilePath) { Remove-Item $backupFilePath -Force }
        exit 1
    }
} catch {
    Write-Error "ERROR: Failed during pg_dump execution: $_"
    if (Test-Path $backupFilePath) { Remove-Item $backupFilePath -Force }
    exit 1
}
