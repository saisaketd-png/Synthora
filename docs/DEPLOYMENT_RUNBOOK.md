# Synthora Operational Deployment Runbook & Infrastructure Guide

## 1. Overview
This runbook documents production deployment, PostgreSQL database backup/restoration, Flyway migration safety, non-destructive application rollback, and monitoring.

---

## 2. Environment Configuration Strategy

| Environment | Spring Profile | Database Engine | Migration Strategy | Test Data Reset |
|---|---|---|---|---|
| Development | `dev` | H2 / PostgreSQL | Flyway enabled | Enabled (`test-data-reset.enabled=true`) |
| Test / CI | `test` | H2 / PostgreSQL | Flyway enabled | Enabled |
| Production | `prod` | PostgreSQL 16 | Flyway validate & migrate | **DISABLED (`test-data-reset.enabled=false`)** |

---

## 3. Database Backup & Restoration Procedure

### A. Database Backup Script
```bash
#!/usr/bin/env bash
# Database Backup Script
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="/backups/synthora_db_${TIMESTAMP}.sql.gz"

pg_dump -h localhost -U synthora_admin -d synthora | gzip > "${BACKUP_FILE}"
echo "Backup successfully created: ${BACKUP_FILE}"
```

### B. Database Restoration Procedure
1. Stop backend application:
   `docker-compose stop backend`
2. Restore database dump:
   `gunzip -c /backups/synthora_db_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U synthora_admin -d synthora`
3. Restart backend application:
   `docker-compose start backend`
4. Flyway automatically validates existing schema migrations on startup.

---

## 4. Application Rollback Procedure

> [!IMPORTANT]
> Never perform a destructive SQL rollback of already-applied database migrations. Application rollbacks should deploy the previous immutable Docker container version while preserving transactional database tables.

1. Identify current container tag:
   `docker ps --filter "name=synthora-backend"`
2. Redeploy previous image version:
   `docker-compose pull backend && docker-compose up -d backend`
3. Verify application health:
   `curl -f http://localhost:8085/actuator/health`

---

## 5. Deployment Smoke Test Checklist

- [ ] `GET /actuator/health` returns `UP`
- [ ] `GET /sitemap.xml` renders active canonical MasterProducts
- [ ] Public Chemical Catalog `/products` loads eligible verified offerings
- [ ] Buyer login & RFQ creation pipeline operates cleanly
- [ ] Supplier product inventory & quotation submission operates cleanly
- [ ] Admin Operations Control Center `/dashboard/admin/operations` loads real-time KPIs
