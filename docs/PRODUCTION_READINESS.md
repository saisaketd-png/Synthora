# KemKendra B2B Marketplace — Production Readiness Guide

## 1. Production Architecture Overview

KemKendra is an enterprise chemical trading platform composed of:
- **Frontend**: Next.js 16 (React 19) standalone production server with SSR and client-side routing.
- **Backend**: Spring Boot 3.4 (Java 21+) REST API with stateless JWT authentication, fine-grained authorization, in-memory rate limiting, and structured request logging.
- **Database**: PostgreSQL 16 managed database with Flyway migration management (V1–V45).
- **Reverse Proxy**: Nginx ingress handling SSL termination, rate limiting, and routing `/api/` to backend and `/` to frontend.
- **Storage**: Governed file storage with Apache Tika MIME validation, path traversal defense, and Docker volume persistence (`kemkendra-prod-documents`).

---

## 2. Required Production Environment Variables

### Backend (`application-prod.yml`)
| Variable | Description | Example / Constraint |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | Active Spring profile | Must be `prod` |
| `DB_URL` | PostgreSQL JDBC connection URL | `jdbc:postgresql://postgres:5432/kemkendra` |
| `DB_USER` | PostgreSQL username | `kemkendra_admin` |
| `DB_PASSWORD` | PostgreSQL password | Cryptographically secure secret |
| `JWT_SECRET` | 256-bit HMAC-SHA256 signing secret | Minimum 32-character high entropy |
| `JWT_EXPIRATION` | JWT token lifetime in milliseconds | `86400000` (24 hours) |
| `APP_BASE_URL` | Production Frontend domain | `https://kemkendra.com` |
| `CORS_ALLOWED_ORIGINS` | Allowed browser origins for CORS | `https://kemkendra.com` |
| `STORAGE_ROOT` | Container filesystem storage path | `/app/storage` (mounted to persistent volume) |
| `MAIL_ENABLED` | Enable transactional SMTP delivery | `true` (or `false` during initial provisioning) |
| `SMTP_HOST` | Transactional email provider host | `smtp.resend.com` / `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | SMTP auth username | `resend` / `apikey` |
| `SMTP_PASSWORD` | SMTP API key or password | Secret API key |
| `MAIL_FROM` | Verified sender email address | `notifications@kemkendra.com` |
| `MAIL_FROM_NAME` | Sender display name | `KemKendra Chemical Marketplace` |
| `ADMIN_BOOTSTRAP_ENABLED` | Initial admin account creation | `false` in steady state |

### Frontend (`Next.js`)
| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Node runtime mode | `production` |
| `BACKEND_API_URL` | Internal backend API endpoint for SSR | `http://backend:8085` or internal host |
| `INTERNAL_API_URL` | Fallback internal backend API endpoint | `http://backend:8085` |
| `NEXT_PUBLIC_API_URL` | Public browser API base URL | Empty string `""` or `https://kemkendra.com` |
| `NEXT_PUBLIC_SITE_URL` | Public canonical site URL | `https://kemkendra.com` |

---

## 3. Docker Deployment & Persistent Storage

### Docker Compose
Run the production stack with persistent volumes:
```bash
docker compose up -d
```

### Volume Persistence Verification
The `docker-compose.yml` mounts:
- `kemkendra-prod-pgdata` $\to$ `/var/lib/postgresql/data` (PostgreSQL relational data)
- `kemkendra-prod-documents` $\to$ `/app/storage` (Compliance & commercial document vault)

Recreating backend or postgres containers preserves all uploaded documents and database records.

---

## 4. Render Deployment (`render.yaml`)

The workspace includes a turnkey Infrastructure-as-Code [render.yaml](file:///d:/Saisaket/Synthora/render.yaml) specification configuring:
1. `kemkendra-db`: Managed PostgreSQL 16 instance.
2. `kemkendra-backend`: Spring Boot Docker container with automated healthcheck probe at `/actuator/health`.
3. `kemkendra-frontend`: Next.js standalone container with healthcheck probe at `/`.

---

## 5. Database Backup & Recovery Procedure

### Backup
```bash
# Linux / macOS
./scripts/backup/db-backup.sh /var/backups/kemkendra

# Windows PowerShell
.\scripts\backup\db-backup.ps1 -OutputDir "database\backups"
```
Produces a compressed binary archive: `kemkendra_backup_YYYYMMDD_HHMMSS.dump`.

### Restore
```bash
# Linux / macOS
./scripts/backup/db-restore.sh /var/backups/kemkendra/kemkendra_backup_20260901_120000.dump --confirm

# Windows PowerShell
.\scripts\backup\db-restore.ps1 -DumpFile "database\backups\kemkendra_backup_20260901_120000.dump" -Force
```

---

## 6. Security Considerations & Protections

1. **Authentication**: JWT validation with user status checking on every request. Deactivated or suspended accounts are rejected with 401 Unauthorized immediately.
2. **Authorization**: Server-derived ownership (`Authentication.getName()`) prevents IDOR and parameter tampering across all RFQ, Quotation, Order, and Document endpoints.
3. **Email Isolation**: `EmailServiceImpl` isolates SMTP connection and delivery errors; email failures never roll back database transactions.
4. **Error Sanitization**: `GlobalExceptionHandler` masks internal exceptions with structured HTTP 500 error responses; no stack traces or database errors are exposed to clients.
5. **Security Headers**: HSTS, CSP, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Permissions-Policy enforced across Nginx, Spring Boot, and Next.js.

---

## 7. Deferred Items & Future Roadmap

- **P2 — Cloud Object Storage Adapter**: Local storage (`LocalStorageService`) is backed by container volumes. For multi-region horizontal scaling, an S3-compatible cloud storage adapter can be implemented.
- **P3 — Distributed Redis Rate Limiting**: In-memory rate limiting is currently per-JVM instance. For multi-node backend clusters, Redis sliding-window rate limiting can be integrated.
