# Synthora B2B Marketplace — Database Backup & Disaster Recovery Guide

---

## 1. Database Architecture Overview

Synthora utilizes **PostgreSQL 15+** managed with **Flyway** database migrations and **Spring Data JPA / Hibernate**.

### Key Architectural Characteristics
- **Linear Migration History**: 41 sequential migrations (`V1_001` through `V40`).
- **Head Migration Version**: `V40__create_email_verification_tokens_table.sql`.
- **Schema Management Policy**:
  - `spring.flyway.enabled=true`: Automatically applies pending migrations on startup.
  - `spring.jpa.hibernate.ddl-auto=validate`: Strictly validates JPA entities against the live database without altering or dropping tables.
- **Data Types & Integrity**:
  - Entity primary keys use PostgreSQL `UUID` (and `BIGSERIAL` for sequence mappings).
  - Explicit foreign keys with referential constraints (e.g. `ON DELETE CASCADE` on verification tokens, password reset tokens, and shortlist items).
  - Unique constraints on critical authentication and catalog fields (`email`, `token_hash`, `product_code`).

---

## 2. Storage Separation Architecture: Relational vs. Binary Data

Synthora's production data is divided into two distinct storage layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYNTHORA DATA LAYERS                            │
├───────────────────────────────────┬────────────────────────────────────┤
│ 1. Relational Database (Postgres) │ 2. Document Binary Storage (Disk)  │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Users, Passwords & Tokens       │ • COA (Certificates of Analysis)   │
│ • RFQs, Quotations & Orders       │ • MSDS (Safety Data Sheets)        │
│ • Catalog & Supplier Offerings    │ • ISO & Regulatory Certificates    │
│ • In-App Notifications & Audit    │ • Technical Specification PDFs     │
│ • Document Metadata (storage_key) │ Stored at: /app/storage/documents  │
└───────────────────────────────────┴────────────────────────────────────┘
```

> [!WARNING]
> **CRITICAL RENDER PERSISTENT DISK REQUIREMENT**  
> `LocalStorageService` writes uploaded files to `/app/storage/documents`. In containerized environments like Render, files stored on ephemeral container disks are **destroyed on every redeployment or restart**.  
> **Requirement**: You MUST attach a **Render Persistent Disk** mounted at `/app/storage` (min 1 GB) to the backend service to preserve uploaded documents until cloud object storage (S3/R2) is adopted.

---

## 3. Render Managed Database Backup Capabilities

| Database Plan | Automated Backups | Retention | Manual Snapshots | PITR |
| :--- | :--- | :--- | :--- | :--- |
| **Free Tier** | ❌ None (Database expires after 30 days) | N/A | Manual `pg_dump` only | ❌ No |
| **Starter Tier ($7/mo)** | ✅ Automated Daily (02:00 UTC) | 7 days | Available in Dashboard & CLI | ❌ No |
| **Standard Tier ($35/mo)** | ✅ Automated Daily | 7 days | Available in Dashboard & CLI | ❌ No |
| **Pro Tier ($95/mo)** | ✅ Automated Daily | 30 days | Available in Dashboard & CLI | ✅ Point-in-Time |

> [!IMPORTANT]
> For production environments, the PostgreSQL database must be on at least the **Starter Tier ($7/mo)** to enable automated daily backups.

---

## 4. Manual `pg_dump` Backup Procedures

Automated scripts are located in [`scripts/backup/`](file:///d:/Saisaket/Synthora/scripts/backup/):
- Bash (Linux/macOS): [`scripts/backup/db-backup.sh`](file:///d:/Saisaket/Synthora/scripts/backup/db-backup.sh)
- PowerShell (Windows): [`scripts/backup/db-backup.ps1`](file:///d:/Saisaket/Synthora/scripts/backup/db-backup.ps1)

### Execution (Bash / Linux / Render CLI)
```bash
# 1. Export database connection URL
export DB_URL="postgresql://synthora_admin:<PASSWORD>@<HOST>:5432/synthora?sslmode=require"

# 2. Run backup script
./scripts/backup/db-backup.sh database/backups
```

### Execution (PowerShell / Windows)
```powershell
$env:DB_URL = "postgresql://synthora_admin:<PASSWORD>@<HOST>:5432/synthora?sslmode=require"
.\scripts\backup\db-backup.ps1 -OutputDir "database\backups"
```

### Manual Command Equivalent
```bash
pg_dump -Fc --no-owner --no-acl -d "$DB_URL" -f "synthora_backup_$(date +%Y%m%d_%H%M%S).dump"
```
- `-Fc`: Custom compressed binary format preserving metadata, constraints, and dependencies.
- `--no-owner --no-acl`: Ensures seamless portability across different database roles and hosting providers.

---

## 5. Pre-Deployment Backup Procedure

Before applying new Flyway migrations or deploying backend updates:
1. **Trigger Manual Snapshot**:
   ```bash
   ./scripts/backup/db-backup.sh pre_deploy_backups/
   ```
2. **Verify Backup Integrity**:
   ```bash
   pg_restore --list pre_deploy_backups/synthora_backup_*.dump | head -n 25
   ```
3. **Proceed with Deployment**: If a migration fails during deployment, restore immediately from the pre-deployment dump.

---

## 6. Complete Database Restore Procedure

Restore scripts are provided in [`scripts/backup/`](file:///d:/Saisaket/Synthora/scripts/backup/):
- Bash: [`scripts/backup/db-restore.sh`](file:///d:/Saisaket/Synthora/scripts/backup/db-restore.sh)
- PowerShell: [`scripts/backup/db-restore.ps1`](file:///d:/Saisaket/Synthora/scripts/backup/db-restore.ps1)

### Step-by-Step Restoration
1. **Set Target Database URL**:
   ```bash
   export DB_URL="postgresql://synthora_admin:<PASSWORD>@<TARGET_HOST>:5432/synthora?sslmode=require"
   ```
2. **Execute Restore**:
   ```bash
   ./scripts/backup/db-restore.sh database/backups/synthora_backup_20260829_220000.dump --confirm
   ```
3. **Start Spring Boot Backend**:
   - Flyway scans `flyway_schema_history`.
   - If the backup was taken at version `V40`, all 41 migrations are recognized as resolved.
   - If the backup was from `V38`, Flyway automatically applies `V39` and `V40` sequentially upon startup.
   - Hibernate verifies entity mapping via `ddl-auto=validate`.

---

## 7. Disaster Recovery Scenarios & Playbooks

### Scenario A: Relational Database Corruption or Accidental Deletion
1. **Declare Maintenance Window**: Enable frontend maintenance banner.
2. **Provision Target PostgreSQL Instance** on Render or backup infrastructure.
3. **Execute `db-restore.sh`** with the most recent verified dump.
4. **Update Render Environment Variable** `DB_URL` with new credentials.
5. **Restart Backend Service**.
6. **Verify Health**: Check `/actuator/health` and perform smoke tests.
7. **Disable Maintenance Window**.

### Scenario B: Document Storage Loss (Disk Reset)
If `/app/storage` is wiped while PostgreSQL remains intact:
1. Document records remain in the `documents` table, but file downloads will return 404.
2. Users can re-upload compliance documents via the dashboard.
3. *Prevention*: Ensure Render Persistent Disk is attached at `/app/storage`.

### Scenario C: Catastrophic Total Loss (Database + Filesystem)
1. Restore database from latest `pg_dump` snapshot.
2. Re-create `/app/storage/documents` directory structure.
3. Restart backend service; Flyway validates schema.
4. System is restored to state of the last database backup.

---

## 8. Recovery Objective Targets

> [!NOTE]
> The following metrics represent operational targets based on current architecture and manual tooling.

- **Recovery Point Objective (RPO) Target**: **&le; 24 Hours** (Data loss is limited to changes made since the last daily backup).
- **Recovery Time Objective (RTO) Target**: **&le; 30–60 Minutes** (Time required to provision a target instance, execute `pg_restore`, update connection environment variables, and verify backend startup).

---

## 9. Verification & Post-Restore Checklist

- [ ] `flyway_schema_history` contains all 41 migrations up to `V40` with `success = true`.
- [ ] Backend starts up cleanly with `ddl-auto=validate` (0 schema mismatch errors).
- [ ] User authentication works for existing accounts.
- [ ] Catalog offerings and Master Product listings resolve correctly.
- [ ] RFQ creation and quotation submission function normally.
- [ ] Notification event listeners dispatch without database constraint violations.
- [ ] Document upload and download paths function against `/app/storage/documents`.
