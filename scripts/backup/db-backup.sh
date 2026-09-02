#!/usr/bin/env bash
# ==============================================================================
# KemKendra B2B Marketplace - PostgreSQL Backup Script
# ==============================================================================
# Creates a compressed, custom-format (-Fc) logical dump of the PostgreSQL database.
# Preserves all UUIDs, schema definitions, constraints, foreign keys, indexes,
# sequences, and Flyway schema history (V1..V40).
#
# Usage:
#   export DB_URL="postgresql://user:password@host:port/dbname?sslmode=require"
#   ./db-backup.sh [output_dir]
#
# Or pass as argument:
#   ./db-backup.sh [output_dir] --url "postgresql://user:password@host:port/dbname?sslmode=require"
# ==============================================================================

set -euo pipefail

# 1. Verify pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    echo "ERROR: 'pg_dump' command not found in PATH." >&2
    echo "Please install PostgreSQL client tools (postgresql-client) to proceed." >&2
    exit 1
fi

# 2. Parse arguments
OUTPUT_DIR="database/backups"
TARGET_URL="${DB_URL:-}"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --url|-u)
            TARGET_URL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [output_directory] [--url <database_url>]"
            echo "Environment variable DB_URL can also be used."
            exit 0
            ;;
        *)
            OUTPUT_DIR="$1"
            shift
            ;;
    esac
done

# 3. Validate database connection URL
if [[ -z "$TARGET_URL" ]]; then
    echo "ERROR: Database connection URL is not provided." >&2
    echo "Set the DB_URL environment variable or pass --url <postgresql_url>." >&2
    exit 1
fi

# 4. Prepare output directory and filename
mkdir -p "$OUTPUT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUTPUT_DIR}/kemkendra_backup_${TIMESTAMP}.dump"

echo "================================================================="
echo " Starting KemKendra Database Backup"
echo " Destination: ${BACKUP_FILE}"
echo " Timestamp:   $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo " Format:      Custom Binary Archive (-Fc, compressed)"
echo "================================================================="

# 5. Execute pg_dump
# -Fc: Custom compressed format (optimal for pg_restore and selective schema restore)
# --no-owner --no-acl: Ensures portable restore across different database users and cloud providers
# --verbose: Outputs progress to stderr
if pg_dump -Fc --no-owner --no-acl --verbose -d "$TARGET_URL" -f "$BACKUP_FILE"; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "================================================================="
    echo " SUCCESS: Database backup completed successfully!"
    echo " File: ${BACKUP_FILE} (Size: ${FILE_SIZE})"
    echo "================================================================="
    exit 0
else
    echo "ERROR: pg_dump execution failed." >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi
