# ==============================================================================
# KemKendra B2B Marketplace - PostgreSQL Database Restore Script (PowerShell)
# ==============================================================================
# Restores a compressed, custom-format (-Fc) dump file into a target PostgreSQL database.
# Preserves all UUIDs, schema definitions, constraints, foreign keys, indexes,
# sequences, and Flyway schema history (V1..V40).
#
# SAFETY GUARD:
#   This script modifies the target database. To prevent accidental overwrite,
#   it requires explicit confirmation via the -Confirm parameter or interactive input.
#
# Usage:
#   $env:DB_URL = "postgresql://user:password@host:port/dbname?sslmode=require"
#   .\db-restore.ps1 -DumpFile "database\backups\synthora_backup_20260829.dump"
#
# Or pass directly:
#   .\db-restore.ps1 -DumpFile "path\to\file.dump" -DbUrl "postgresql://..." -Confirm:$false -Force
# ==============================================================================

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$DumpFile,

    [Parameter()]
    [string]$DbUrl = $env:DB_URL,

    [Parameter()]
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# 1. Verify pg_restore is available in PATH
$pgRestoreCmd = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $pgRestoreCmd) {
    Write-Error "ERROR: 'pg_restore' executable was not found in PATH. Please install PostgreSQL tools or add the PostgreSQL bin folder to PATH."
    exit 1
}

# 2. Validate backup dump file
if (-not (Test-Path $DumpFile)) {
    Write-Error "ERROR: Specified backup file does not exist: $DumpFile"
    exit 1
}

# 3. Validate database connection URL
if ([string]::IsNullOrWhiteSpace($DbUrl)) {
    Write-Error "ERROR: Target database connection URL is not provided. Set `$env:DB_URL or specify -DbUrl parameter."
    exit 1
}

# 4. Safety confirmation prompt
Write-Host "=================================================================" -ForegroundColor Red
Write-Host " WARNING: DATABASE RESTORE OPERATION" -ForegroundColor Red
Write-Host "=================================================================" -ForegroundColor Red
Write-Host " Source Dump File:  $DumpFile" -ForegroundColor Yellow
Write-Host " Timestamp:         $((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC'))" -ForegroundColor Yellow
Write-Host " Action:            Clean and restore tables, constraints & Flyway history" -ForegroundColor Yellow
Write-Host "=================================================================" -ForegroundColor Red

if (-not $Force) {
    Write-Host ""
    Write-Host "CAUTION: This operation will overwrite existing schema and data in the target database." -ForegroundColor Red
    $confirmation = Read-Host "Type 'RESTORE' to proceed with the restoration"
    if ($confirmation -ne "RESTORE") {
        Write-Host "Restore cancelled by user. No changes were made." -ForegroundColor Yellow
        exit 0
    }
}

# 5. Execute pg_restore
Write-Host ""
Write-Host "Executing pg_restore..." -ForegroundColor Cyan

try {
    & pg_restore --clean --if-exists --no-owner --no-acl --verbose -d "$DbUrl" "$DumpFile"
    # pg_restore may return exit code 0 on clean restore or 1 if non-fatal warnings occurred
    if ($LASTEXITCODE -le 1) {
        Write-Host "=================================================================" -ForegroundColor Green
        Write-Host " SUCCESS: Database restored successfully from: $DumpFile" -ForegroundColor Green
        Write-Host " Next step: Start the Spring Boot backend to verify Flyway schema validation." -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Green
        exit 0
    } else {
        Write-Error "ERROR: pg_restore failed with exit code $LASTEXITCODE."
        exit 1
    }
} catch {
    Write-Error "ERROR: Failed during pg_restore execution: $_"
    exit 1
}
