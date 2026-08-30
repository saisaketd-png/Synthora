# Synthora Render Staging Deployment & Cloud Smoke Testing Guide

---

## 1. Cloud Architecture Overview

The initial cloud staging deployment on Render utilizes a dedicated, three-tier architecture:

```
┌──────────────────────────────────────────────────────────┐
│                   Render Platform                        │
│                                                          │
│  ┌───────────────────────┐                               │
│  │ Render Frontend       │  Next.js 16.3.0               │
│  │ Web Service (Docker)  │  (Standalone SSR + Static)    │
│  └───────────┬───────────┘                               │
│              │ HTTPS / Client Rewrites                   │
│              ▼                                           │
│  ┌───────────────────────┐                               │
│  │ Render Backend        │  Spring Boot 3.4.1 (Java 21)  │
│  │ Web Service (Docker)  │  HikariCP + Flyway V40        │
│  └─────┬───────────┬─────┘                               │
│        │           │                                     │
│        │           ▼                                     │
│        │   ┌────────────────────────────────┐            │
│        │   │ Render Persistent Disk (10GB)  │            │
│        │   │ Mount: /app/storage            │            │
│        │   └────────────────────────────────┘            │
│        ▼                                                 │
│  ┌────────────────────────────────┐                      │
│  │ Render PostgreSQL              │                      │
│  │ (Managed PostgreSQL 16)        │                      │
│  └────────────────────────────────┘                      │
└──────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Single Instance Constraint**: Deploy exactly **one** instance of the backend service (`instances: 1`). Do not configure autoscaling or multiple instances, as local filesystem document storage (`/app/storage`) and in-memory rate limiting require a single instance until dedicated object storage (S3/R2) and distributed cache (Redis) are introduced.

---

## 2. Step 1: Create Render PostgreSQL Database

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **PostgreSQL**.
2. **Configuration**:
   - **Name**: `synthora-db`
   - **Database**: `synthora`
   - **User**: `synthora_user`
   - **Region**: Choose closest to your target audience (e.g., `Frankfurt (EU Central)` or `Oregon (US West)`). Keep backend and frontend in the **same region**.
   - **PostgreSQL Version**: `16`
3. Click **Create Database**.
4. **Connection Strings**:
   - **Internal Database URL**: Used by the backend running inside Render network (zero egress fees, lower latency).
   - **External Database URL**: Used only for local manual backup scripts (`scripts/backup/db-backup.ps1`).

### JDBC URL Format Requirement
Render displays connection URLs in the standard URI format:
`postgresql://synthora_user:PASSWORD@dpg-xxxx.render.com/synthora`

Spring Boot and HikariCP require the JDBC driver prefix with SSL mode:
`jdbc:postgresql://dpg-xxxx.render.com:5432/synthora?sslmode=require`

---

## 3. Step 2: Create Render Backend Web Service

1. Click **New +** → **Web Service**.
2. Connect your Synthora Git repository.
3. **Basic Settings**:
   - **Name**: `synthora-backend`
   - **Region**: Same region as PostgreSQL database.
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `infrastructure/docker/Dockerfile.backend`
   - **Docker Build Context**: `.` (Repository root)
   - **Instance Type**: `Starter` (or `Free` for initial smoke test)
4. **Health Check Path**: `/actuator/health`

### Attach Persistent Disk
1. Scroll to **Disks** section (or click **Disks** tab after creation).
2. Click **Add Disk**:
   - **Name**: `synthora-storage-disk`
   - **Mount Path**: `/app/storage`
   - **Size**: `10 GB`

### Backend Environment Variables

| Variable Name | Value / Description | Required |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | **Yes** |
| `DB_URL` | `jdbc:postgresql://<INTERNAL_HOST>:5432/synthora?sslmode=require` | **Yes** |
| `DB_USER` | `synthora_user` (from Render PostgreSQL) | **Yes** |
| `DB_PASSWORD` | `<RENDER_POSTGRES_PASSWORD>` | **Yes** |
| `JWT_SECRET` | 64+ char random hex/base64 string (e.g. generated via `openssl rand -hex 64`) | **Yes** |
| `JWT_EXPIRATION` | `86400000` (24 hours in ms) | **Yes** |
| `APP_BASE_URL` | `https://synthora-frontend.onrender.com` (Frontend URL) | **Yes** |
| `CORS_ALLOWED_ORIGINS` | `https://synthora-frontend.onrender.com` | **Yes** |
| `MAIL_ENABLED` | `false` | **Yes** |
| `STORAGE_ROOT` | `/app/storage` | **Yes** |
| `RATE_LIMIT_ENABLED` | `true` | Optional (default: `true`) |
| `JAVA_TOOL_OPTIONS` | `-Xms96m -Xmx256m -XX:+ExitOnOutOfMemoryError` | Built into Dockerfile |

---

## 4. Step 3: Create Render Frontend Web Service

1. Click **New +** → **Web Service**.
2. Connect your Synthora Git repository.
3. **Basic Settings**:
   - **Name**: `synthora-frontend`
   - **Region**: Same region as backend and database.
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `infrastructure/docker/Dockerfile.frontend`
   - **Docker Build Context**: `.` (Repository root)
   - **Instance Type**: `Starter` (or `Free`)

### Frontend Environment Variables

| Variable Name | Value / Description | Required |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://synthora-backend.onrender.com` | **Yes** |
| `BACKEND_API_URL` | `https://synthora-backend.onrender.com` (or internal URL if applicable) | **Yes** |
| `NODE_ENV` | `production` | **Yes** |
| `PORT` | `3000` | Optional |

---

## 5. Cloud Smoke Test Execution Plan

Once deployment builds succeed and services report **Live**, execute the following test suite directly in the browser and via curl against your real Render URLs (`https://synthora-frontend.onrender.com` and `https://synthora-backend.onrender.com`).

### 5.1 Infrastructure & Health Verification

```bash
# 1. Verify Backend Health & HTTP Security Headers
curl -i https://synthora-backend.onrender.com/actuator/health
```
- [ ] Returns HTTP `200 OK` with `{"status":"UP"}`.
- [ ] Returns header `X-Content-Type-Options: nosniff`.
- [ ] Returns header `X-Frame-Options: DENY`.
- [ ] Returns header `Content-Security-Policy: default-src 'self' ...`.
- [ ] Returns header `Referrer-Policy: strict-origin-when-cross-origin`.

```bash
# 2. Verify Frontend HTTP Security Headers & HTTPS
curl -i https://synthora-frontend.onrender.com/
```
- [ ] Returns HTTP `200 OK`.
- [ ] Returns `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- [ ] Returns `Content-Security-Policy`.

---

### 5.2 Authentication & Compliance Verification

- [ ] **Buyer Registration**: Register new user at `/auth/register`.
  - Check that omitting Terms or Privacy Policy throws validation error.
  - Submitting valid form creates account with `role: USER` and status `ACTIVE`.
- [ ] **Unverified Email Guard**: Attempt to log in with newly registered account.
  - Form displays: *"Please verify your email address before logging in."* (HTTP 400).
- [ ] **Verify User Account (Direct DB update in Render PSQL Console)**:
  ```sql
  UPDATE users SET email_verified_at = NOW() WHERE email = 'test.buyer@example.com';
  ```
- [ ] **Login**: Log in at `/auth/login`.
  - Receives valid JWT in response.
  - Redirects to `/dashboard/buyer`.
- [ ] **Protected Route**: Reload `/dashboard/buyer`. Page loads without authentication failure.
- [ ] **Logout**: Click Logout. `synthora_token` cleared from client storage; user redirected to `/auth/login`.

---

### 5.3 Profile Settings & Change Password

- [ ] **Profile Retrieval**: Navigate to `/settings/profile`. Current name and email display accurately.
- [ ] **Profile Update**: Update name and phone number. Notification confirms update.
- [ ] **Change Password Validation**: Attempt to change password with incorrect current password → Rejected with descriptive error.
- [ ] **Change Password Success**: Change password with valid credentials → Old password fails; new password succeeds.

---

### 5.4 B2B Marketplace Transaction Flow

- [ ] **Catalog Browsing**: Navigate to `/products` and `/categories`. Master products and supplier offerings render correctly.
- [ ] **Create RFQ**: Buyer submits Request for Quotation (`/rfqs`). RFQ status displays as `PENDING`.
- [ ] **Supplier Login**: Log in as verified supplier.
- [ ] **Submit Quotation**: Supplier opens RFQ in `/dashboard/supplier/rfqs` and submits quotation with unit price, MOQ, and validity date. RFQ status updates to `QUOTED`.
- [ ] **Buyer Accept Quotation**: Buyer opens RFQ in `/dashboard/rfqs` and clicks **Accept**. Status transitions to `ACCEPTED`.
- [ ] **Issue Purchase Order**: Buyer clicks **Create Purchase Order** (`/orders`). Order created with status `PLACED`.
- [ ] **Supplier Confirm & Ship**: Supplier views PO in `/dashboard/supplier/orders`, updates status, and enters tracking number.

---

### 5.5 Document Vault & Persistent Disk Validation

- [ ] **Upload Document**: Upload a COA certificate PDF at `/document-vault` or on product/RFQ detail.
- [ ] **Download Document**: Click download link. Verify file downloads and opens without corruption.
- [ ] **Disaster Recovery / Persistence Test**:
  1. In Render Dashboard, click **Manual Deploy** → **Deploy latest commit** (or restart backend).
  2. Wait for backend to come back `Live`.
  3. Re-download the uploaded document.
  4. **Outcome**: File is served successfully from persistent disk `/app/storage`.

---

### 5.6 Rate Limiting Cloud Verification

```bash
# Execute rapid failed login attempts to trigger rate limiter
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://synthora-backend.onrender.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"throttletest@example.com","password":"wrongpassword"}'
done
```
- [ ] Requests 1–10 return `400 Bad Request`.
- [ ] Request 11+ returns `429 Too Many Requests` with `Retry-After` header.

---

## 6. Rollback & Troubleshooting

### Rollback Procedure
If a breaking issue occurs during deployment:
1. Navigate to the service in Render Dashboard.
2. Under **Events**, locate the previous successful build.
3. Click **Rollback** to instantly restore the previous container image.

### Common Issues & Solutions

| Symptom | Probable Cause | Action |
| :--- | :--- | :--- |
| **Backend crash on startup** | Database connection timeout or wrong password | Check `DB_URL` uses internal host `dpg-xxxx:5432` with `?sslmode=require`. |
| **Flyway checksum mismatch** | Schema modified out-of-order | Never edit applied migration files; Flyway operates in strict forward-only mode. |
| **Frontend displays CORS errors** | `CORS_ALLOWED_ORIGINS` mismatch | Ensure `CORS_ALLOWED_ORIGINS` exactly matches `https://synthora-frontend.onrender.com` (no trailing slash). |
| **Uploaded files disappear on redeploy** | Persistent Disk not mounted to `/app/storage` | Verify Render Disk settings under Backend → Disks tab. |
| **Out of Memory (OOM) error** | Memory limit exceeded | Verify `JAVA_TOOL_OPTIONS="-Xms96m -Xmx256m -XX:+ExitOnOutOfMemoryError"` is active. |

---

## 7. Cloud Smoke Test Sign-Off Checklist

- [ ] All 6 test suites executed on live Render deployment.
- [ ] Log stream inspected; zero secret or credential leakage confirmed.
- [ ] Manual database backup verified (`scripts/backup/db-backup.ps1`).
