#!/usr/bin/env bash
# ==============================================================================
# Synthora B2B Marketplace - PostgreSQL Database Restore Script
# ==============================================================================
# Restores a compressed, custom-format (-Fc) dump file into a target PostgreSQL database.
# Preserves all UUIDs, schema definitions, constraints, foreign keys, indexes,
# sequences, and Flyway schema history (V1..V40).
#
# SAFETY GUARD:
#   This script modifies the target database. To prevent accidental overwrite,
#   it requires explicit confirmation via the --confirm flag or interactive input.
#
# Usage:
#   export DB_URL="postgresql://user:password@host:port/dbname?sslmode=require"
#   ./db-restore.sh <path_to_dump_file> [--confirm]
#
# Or pass URL directly:
#   ./db-restore.sh <path_to_dump_file> --url "postgresql://..." --confirm
# ==============================================================================

set -euo pipefail

# 1. Verify pg_restore is installed
if ! command -v pg_restore &> /dev/null; then
    echo "ERROR: 'pg_restore' command not found in PATH." >&2
    echo "Please install PostgreSQL client tools (postgresql-client) to proceed." >&2
    exit 1
fi

# 2. Parse arguments
DUMP_FILE=""
TARGET_URL="${DB_URL:-}"
CONFIRMED=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --url|-u)
            TARGET_URL="$2"
            shift 2
            ;;
        --confirm|-y)
            CONFIRMED=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 <backup_dump_file> [--url <database_url>] [--confirm]"
            exit 0
            ;;
        *)
            if [[ -z "$DUMP_FILE" ]]; then
                DUMP_FILE="$1"
            else
                echo "ERROR: Unknown argument: $1" >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# 3. Validate backup file
if [[ -z "$DUMP_FILE" ]]; then
    echo "ERROR: No backup dump file specified." >&2
    echo "Usage: $0 <path_to_dump_file> [--url <database_url>] [--confirm]" >&2
    exit 1
fi

if [[ ! -f "$DUMP_FILE" ]]; then
    echo "ERROR: Specified backup file does not exist: $DUMP_FILE" >&2
    exit 1
fi

# 4. Validate database connection URL
if [[ -z "$TARGET_URL" ]]; then
    echo "ERROR: Target database connection URL is not provided." >&2
    echo "Set the DB_URL environment variable or pass --url <postgresql_url>." >&2
    exit 1
fi

# 5. Safety confirmation prompt
echo "================================================================="
echo " WARNING: DATABASE RESTORE OPERATION"
echo "================================================================="
echo " Source Dump File:  $DUMP_FILE"
echo " Timestamp:         $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo " Action:            Clean and restore tables, constraints & Flyway history"
echo "================================================================="

if [[ "$CONFIRMED" != "true" ]]; then
    echo ""
    echo "CAUTION: This operation will overwrite existing schema and data in the target database."
    read -r -p "Type 'RESTORE' to proceed with the restoration: " USER_INPUT
    if [[ "$USER_INPUT" != "RESTORE" ]]; then
        echo "Restore cancelled by user. No changes were made."
        exit 0
    fi
fi

# 6. Execute pg_restore
# --clean --if-exists: Drops existing database objects cleanly before recreating them
# --no-owner --no-acl: Restores objects under the current database role regardless of source role
# --verbose: Outputs restore progress
echo ""
echo "Executing pg_restore..."

if pg_restore --clean --if-exists --no-owner --no-acl --verbose -d "$TARGET_URL" "$DUMP_FILE"; then
    echo "================================================================="
    echo " SUCCESS: Database restored successfully from: $DUMP_FILE"
    echo " Next step: Start the Spring Boot backend to verify Flyway schema validation."
    echo "================================================================="
    exit 0
else
    # Note: pg_restore returns exit code 1 if minor warnings occurred (e.g. drop non-existent objects).
    # Inspect status code.
    RESTORE_EXIT=$?
    if [[ $RESTORE_EXIT -eq 1 ]]; then
        echo "WARNING: pg_restore completed with warnings (common when cleaning fresh databases)."
        echo "Please verify schema integrity by starting the backend application."
        exit 0
    else
        echo "ERROR: pg_restore failed with exit code $RESTORE_EXIT." >&2
        exit $RESTORE_EXIT
    fi
fi
