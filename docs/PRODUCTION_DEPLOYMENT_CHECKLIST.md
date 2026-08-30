# Synthora Production Deployment Checklist

---

## 1. Pre-Deployment Checklist (Local Verification)

- [x] **Backend Regression Suite**: 1,383 / 1,383 tests passing (`mvn test`).
- [x] **Frontend Production Build**: 51 / 51 routes building cleanly (`npm run build`).
- [x] **Flyway Migrations**: All 41 migrations validated through `V40`.
- [x] **Production Secrets Fail-Fast**: Verified that missing `JWT_SECRET`, `DB_URL`, `DB_USER`, or `DB_PASSWORD` stops production startup.
- [x] **Docker Exclusion**: Verified `.dockerignore` excludes `.env`, `logs/`, and `database/backups/`.
- [x] **HTTP Security Headers**: Verified CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- [x] **Rate Limiting**: Bounded sliding window counter active on auth/public endpoints.

---

## 2. Deployment Execution Checklist (Render)

### A. Database Service
- [ ] Create Render Managed PostgreSQL instance `synthora-db`.
- [ ] Record internal connection string, user, database name, and password.

### B. Backend Web Service (`synthora-backend`)
- [ ] Connect repo and set Dockerfile path to `infrastructure/docker/Dockerfile.backend`.
- [ ] Configure `SPRING_PROFILES_ACTIVE=prod`.
- [ ] Inject required secrets: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`.
- [ ] Configure `APP_BASE_URL` and `CORS_ALLOWED_ORIGINS` to the frontend URL.
- [ ] Attach Render Persistent Disk at `/app/storage` (10 GB).
- [ ] Verify startup logs: Flyway applies `V1`–`V40` and Spring Boot reports `Started SynthoraApplication in ... seconds`.

### C. Frontend Web Service (`synthora-frontend`)
- [ ] Connect repo and set Dockerfile path to `infrastructure/docker/Dockerfile.frontend`.
- [ ] Configure `NEXT_PUBLIC_API_URL` and `BACKEND_API_URL` to backend service URL.
- [ ] Verify frontend build finishes and starts on port `3000`.

---

## 3. Post-Deployment Verification (Smoke Testing)

- [ ] Check `/actuator/health` returns `{"status":"UP"}`.
- [ ] Verify frontend loads home page, product catalog, and supplier listings.
- [ ] Test new buyer registration and terms/privacy acceptance.
- [ ] Test login and token generation.
- [ ] Test admin route protection (confirm 403 for non-admins).
- [ ] Test rate limiting (10 rapid logins triggers 429).
- [ ] Create initial database backup snapshot via `./scripts/backup/db-backup.ps1`.

---

## 4. Future Post-Launch Milestones (Manual)

- [ ] **Custom Domain**: Attach `synthora.com` and `api.synthora.com`, configure DNS CNAME records, and update `APP_BASE_URL` / `CORS_ALLOWED_ORIGINS`.
- [ ] **Transactional Email (SMTP)**: Verify domain SPF/DKIM/DMARC in Resend/SendGrid, configure SMTP credentials in Render backend, and set `MAIL_ENABLED=true`.
- [ ] **Object Storage**: Migrate `/app/storage/documents` to AWS S3 or Cloudflare R2 when multi-instance horizontal scaling is required.
