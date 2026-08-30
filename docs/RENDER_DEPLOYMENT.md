# Synthora Production Deployment Runbook (Render)

---

## 1. Overview & Architecture on Render

Synthora is architected for single-instance container deployment on [Render](https://render.com) consisting of three managed components:
1. **Managed PostgreSQL Database**: Backing relational database with Flyway schema migration validation (through `V40`).
2. **Spring Boot Backend Web Service**: Dockerized Java 21 runtime exposing REST endpoints on port `8085` with attached Persistent Disk at `/app/storage`.
3. **Next.js Frontend Web Service**: Dockerized Node.js 20 standalone runtime serving the marketplace frontend on port `3000`.

```mermaid
graph LR
    User[End User Browser] -->|HTTPS| Frontend[Render Frontend Web Service :3000]
    User -->|HTTPS API Requests| Backend[Render Backend Web Service :8085]
    Backend -->|Internal JDBC| DB[(Render Managed PostgreSQL)]
    Backend -->|Mount /app/storage| Disk[(Render Persistent Disk)]
```

---

## 2. Step 1: Create Render PostgreSQL Database

1. In the Render Dashboard, click **New +** → **PostgreSQL**.
2. **Name**: `synthora-db`
3. **Database**: `synthora`
4. **User**: `synthora_admin`
5. **Region**: Choose the closest region (e.g. `Frankfurt (EU Central)` or `Oregon (US West)`).
6. **Plan**: Free or Starter.
7. Click **Create Database**.
8. Note the **Internal Database URL** (e.g. `postgres://synthora_admin:PASSWORD@dpg-xxxx-a:5432/synthora`).

---

## 3. Step 2: Create Backend Web Service

1. Click **New +** → **Web Service** → Connect your GitHub repository.
2. **Name**: `synthora-backend`
3. **Region**: *Same region as PostgreSQL database*.
4. **Environment**: `Docker`
5. **Dockerfile Path**: `infrastructure/docker/Dockerfile.backend`
6. **Docker Build Context Directory**: `.` (root of the repo)
7. **Health Check Path**: `/actuator/health`

### Environment Variables:
| Variable | Value | Notes |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.yml`. |
| `DB_URL` | `jdbc:postgresql://dpg-xxxx-a:5432/synthora?sslmode=require` | Use Render Internal DB Host/Port. |
| `DB_USER` | `synthora_admin` | Database username. |
| `DB_PASSWORD` | `YOUR_POSTGRES_PASSWORD` | Database password. |
| `JWT_SECRET` | `YOUR_32_CHAR_CRYPTOGRAPHIC_SECRET` | Minimum 256-bit entropy. |
| `JWT_EXPIRATION` | `86400000` | 24 Hours. |
| `APP_BASE_URL` | `https://synthora-frontend.onrender.com` | (Update to custom domain when attached). |
| `CORS_ALLOWED_ORIGINS` | `https://synthora-frontend.onrender.com` | (Update to custom domain when attached). |
| `MAIL_ENABLED` | `false` | (Set to `true` when SMTP is configured). |
| `ADMIN_BOOTSTRAP_ENABLED` | `false` | (Set `true` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` on initial boot if required). |

### Attach Persistent Disk:
1. Navigate to **Disks** under the `synthora-backend` service settings.
2. Click **Add Disk**.
3. **Name**: `synthora-storage`
4. **Mount Path**: `/app/storage`
5. **Size**: `10 GB` (or desired volume).

---

## 4. Step 3: Create Frontend Web Service

1. Click **New +** → **Web Service** → Connect your GitHub repository.
2. **Name**: `synthora-frontend`
3. **Region**: *Same region as backend*.
4. **Environment**: `Docker`
5. **Dockerfile Path**: `infrastructure/docker/Dockerfile.frontend`
6. **Docker Build Context Directory**: `.` (root of the repo)

### Environment Variables:
| Variable | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production Next.js runtime. |
| `NEXT_PUBLIC_API_URL` | `https://synthora-backend.onrender.com` | Public backend URL. |
| `NEXT_PUBLIC_SITE_URL` | `https://synthora-frontend.onrender.com` | Public frontend URL. |
| `BACKEND_API_URL` | `https://synthora-backend.onrender.com` | Server-side API endpoint. |

---

## 5. Post-Deployment Smoke Test & Verification

1. **Health Check**:
   ```bash
   curl -I https://synthora-backend.onrender.com/actuator/health
   # Expected: HTTP/2 200 OK
   ```
2. **Security Headers & CSP**:
   ```bash
   curl -I https://synthora-frontend.onrender.com/
   # Expected: Content-Security-Policy, X-Frame-Options: DENY, Strict-Transport-Security
   ```
3. **Registration & Login**:
   - Register a new buyer at `https://synthora-frontend.onrender.com/register`.
   - Access user dashboard and update profile.
4. **Rate Limiting**:
   - Rapidly send 12 POST requests to `/api/v1/auth/login` to confirm HTTP 429 response with `Retry-After`.

---

## 6. Rollback & Disaster Recovery Procedures

### Application Rollback:
- In Render Dashboard → Select Service → **Deploy History** → Click **Rollback** on previous successful build.

### Database Recovery:
- To restore from a pg_dump backup:
  ```powershell
  # Using Synthora restore utility:
  $env:PGPASSWORD="YOUR_POSTGRES_PASSWORD"
  ./scripts/backup/db-restore.ps1 -BackupFile database/backups/synthora_backup_TIMESTAMP.dump -DbHost dpg-xxxx-a.render.com -DbUser synthora_admin -DbName synthora -DbPort 5432 -SslMode require -Confirm
  ```
