# Synthora Local Production End-to-End Test Checklist

---

## 1. Core Infrastructure & Services

- [x] **Backend Starts Cleanly**: Runs on `http://127.0.0.1:8085` under Spring Boot 3.4.1.
- [x] **Frontend Starts Cleanly**: Runs on `http://localhost:3000` under Next.js 16.3.0.
- [x] **Database Connects**: Local PostgreSQL connection verified via HikariCP.
- [x] **Flyway Migration Head**: Verified at version `V40` (`create email verification tokens table`).
- [x] **Actuator Healthcheck**: `GET /actuator/health` returns `{"status":"UP"}`.

---

## 2. Authentication & Identity Lifecycle

- [x] **Buyer Registration**: Requires Terms of Service and Privacy Policy acceptance.
- [x] **Supplier Registration**: Collects company metadata and contact information.
- [x] **Email Verification Guard**: Unverified users receive `400 Bad Request` ("Please verify your email address before logging in").
- [x] **Verification Token Security**: Verification tokens are SHA-256 hashed in database; raw tokens never persisted.
- [x] **Resend Cooldown**: 60-second cooldown prevents token email flooding.
- [x] **Login & JWT Issuance**: Authenticated users receive signed HMAC-SHA256 JWTs.
- [x] **Server-Authoritative Roles**: Authorities (`ROLE_USER`, `ROLE_SUPPLIER`, `ROLE_ADMIN`) loaded directly from PostgreSQL `users` table.
- [x] **Stateless Logout**: Clears client `localStorage` (`synthora_token`) and broadcasts `auth-changed` event.

---

## 3. Account Settings & Password Recovery

- [x] **Profile Self-Service**: User can view and update display name and phone number (`/api/v1/users/me`).
- [x] **Change Password**: Validates existing password via BCrypt, rejects reused password, and updates hash.
- [x] **Forgot Password**: Generates secure 15-minute token; generic response prevents email enumeration.
- [x] **Reset Password**: Validates SHA-256 token hash, enforces single-use policy, and updates password.

---

## 4. Marketplace Procurement Workflow

- [x] **Buyer RFQ Creation**: Buyer creates and publishes detailed RFQ (`/api/v1/rfqs`).
- [x] **Supplier Quotation Submission**: Supplier views eligible RFQ and submits commercial quotation (`/api/v1/rfqs/supplier/{rfqId}/quotations`).
- [x] **Buyer Quotation Evaluation**: Buyer reviews quotation terms and accepts the offer (`/accept`).
- [x] **Purchase Order Generation**: Accepted quotation generates formal Purchase Order (`/api/v1/orders`).
- [x] **Order Fulfillment & Shipment**: Supplier confirms PO, creates shipment, and updates tracking status.
- [x] **Notifications**: Platform notifications dispatched across each transaction milestone.

---

## 5. Document Security & Storage

- [x] **Local Storage**: Binary documents saved to local filesystem `/app/storage/documents`.
- [x] **Metadata Isolation**: Document metadata linked to PostgreSQL owner records.
- [x] **Access Authorization**: `DocumentAuthorizationService` restricts download access to authorized owners.

---

## 6. Security, Rate Limiting & Networking

- [x] **Rate Limiting (HTTP 429)**: Throttling active across login, registration, password recovery, verification, and public search.
- [x] **Retry-After Header**: Emitted with dynamic sliding window remaining duration.
- [x] **HTTP Security Headers**: Full CSP (`default-src 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy`.
- [x] **CORS Configuration**: Restricts origins to configured frontend URL without wildcards (`*`).
- [x] **Error Response Sanitization**: All errors use standard `ApiErrorResponse` without stack trace or SQL leakage.

---

## 7. Disaster Recovery & Packaging

- [x] **Database Backup**: Local snapshot utility tested (`scripts/backup/db-backup.ps1`).
- [x] **Backend Packaging**: `mvn clean package` produces runnable `synthora-backend-1.0.0-SNAPSHOT.jar`.
- [x] **Frontend Production Build**: `npm run build` compiles all 51 routes cleanly.
