# Synthora Phase 2H.1 — Security Forensic Audit Report

**Date of Audit:** 2026-08-18  
**Audit Scope:** Full-Stack Architecture (Spring Boot Backend, Next.js Frontend, PostgreSQL, Storage, Authentication & RBAC)  
**Classification:** Defensive Forensic Assessment  
**Mode:** AUDIT-ONLY (Zero Code & Schema Modifications Applied)

---

## 1. Executive Summary

A comprehensive security forensic audit of the Synthora B2B Marketplace codebase was performed. The evaluation encompassed authentication, session management, RBAC and authorization boundaries, IDOR/BOLA protections, business logic state machines, REST APIs, file upload/download pipelines, CORS/CSRF configurations, security headers, frontend route guards, error handling, database security, secrets management, rate limiting, audit logging, and dependency posture.

### Overall Posture Assessment: **MEDIUM RISK (Production-Hardening Phase)**

**Key Strengths:**
1. **Authoritative Server-Side IDOR Enforcement:** Domain services (`RfqService`, `PurchaseOrderService`, `ProductSupplierService`, `SellerProfileService`, `DocumentAuthorizationServiceImpl`) consistently resolve user and supplier identities from the authenticated Spring Security principal rather than trusting client-supplied identifiers in request bodies or parameters.
2. **Robust Password Hashing:** Passwords are hashed using `BCryptPasswordEncoder` (strength 10), and raw password hashes are never exposed in user DTOs (`UserResponse`).
3. **Immutable Administrative Audit Logging:** Phase 2G.2 successfully established an append-only `audit_logs` table (V16) and `AuditService` that intercepts and records all administrative state mutations with IP resolution and admin UUID attribution.
4. **Defensive File Storage:** Stored files are detached from original names and assigned random UUID keys (`documents/{uuid}.ext`), with directory traversal protections enforced in `LocalStorageService`.

**Key Vulnerabilities and Security Gaps Requiring Remediation:**
1. **Stateless JWT De-synchronization with User Lifecycle (HIGH):** `JwtAuthenticationFilter` validates token signatures purely offline without checking whether the user account has been suspended (`UserStatus.SUSPENDED`) or soft-deleted (`deleted_at != null`). A revoked or suspended user retains active API access until the 24-hour token expires.
2. **Client-Accessible Token Storage in `localStorage` (MEDIUM-HIGH):** Authentication tokens (`synthora_token`) are stored in browser `localStorage`, rendering them accessible to JavaScript and vulnerable to token exfiltration if an XSS vulnerability occurs.
3. **File MIME-Type Trust & Missing Magic-Byte Validation (MEDIUM-HIGH):** `DocumentService` validates file types based on the client-supplied HTTP `Content-Type` header and file extension, without inspecting the file magic bytes (file signature).
4. **Missing Production Security Headers & Overexposed Health Actuator (MEDIUM):** HTTP security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`) are absent in `SecurityConfig`. Furthermore, `management.endpoint.health.show-details: always` is configured, leaking database and infrastructure details unauthenticated.
5. **Absence of API Rate Limiting (MEDIUM):** Critical endpoints such as `/api/v1/auth/login`, `/api/v1/auth/register`, and `/api/v1/documents` lack rate limiting or brute-force throttling mechanisms.
6. **Missing Automated 401 Session Interceptor on Frontend (MEDIUM-LOW):** `authenticatedFetch` does not intercept 401 Unauthorized responses to purge expired tokens or automatically redirect users to the login screen.

---

## 2. Current Architecture Security Map

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT TIER                                       |
|  Next.js 16.3.0 App Router / React 19.2.8 / TypeScript 5 / Tailwind CSS v4        |
|  - Token Storage: localStorage ("synthora_token")                                  |
|  - Auth Client: authenticatedFetch / getAuthUser() / logout()                     |
|  - Route Guards: DashboardLayout client-side redirection                          |
+----------------------------------------+------------------------------------------+
                                         |
                       Bearer JWT / REST | HTTP (Port 8085)
                                         v
+-----------------------------------------------------------------------------------+
|                                BACKEND TIER                                       |
|  Spring Boot 3.4.1 / Spring Security 6 / Java 21                                  |
|                                                                                   |
|  [SecurityFilterChain]                                                            |
|  ├── CorsConfigurationSource (Allowed Origin: http://localhost:3000)             |
|  ├── CSRF: Disabled (Stateless Architecture)                                     |
|  ├── SessionCreationPolicy: STATELESS                                            |
|  └── JwtAuthenticationFilter (OncePerRequestFilter, JJWT 0.12.6)                  |
|                                                                                   |
|  [Controller Layer]                                                               |
|  ├── Public Endpoints (/api/v1/auth/**, /api/v1/products/** [GET], etc.)          |
|  ├── Role-Protected Endpoints (@PreAuthorize("hasRole('ADMIN')"), etc.)          |
|  └── Authenticated Ownership Endpoints (RFQ, Orders, Seller Profiles, Documents)   |
|                                                                                   |
|  [Service & Authorization Layer]                                                  |
|  ├── Identity: UserService, JwtService                                            |
|  ├── Governance: AuditService (Append-only logging)                              |
|  ├── Transactions: RfqService, PurchaseOrderService (Pessimistic Locking)        |
|  ├── Marketplace: ProductService, ProductSupplierService, SellerProfileService    |
|  └── Documents: DocumentService, DocumentAuthorizationServiceImpl                |
+----------------------------------------+------------------------------------------+
                                         |
                                         | JDBC / JPA (Flyway V1_001 to V16)
                                         v
+-----------------------------------------------------------------------------------+
|                                DATABASE & STORAGE                                 |
|  PostgreSQL 16+ / Local File Storage                                              |
|  - users (id, email, password_hash, role, status, deleted_at)                     |
|  - audit_logs (id, admin_id, action, target_type, target_id, ip_address)          |
|  - Storage: ./storage/documents/{UUID}.ext (Path traversal protected)             |
+-----------------------------------------------------------------------------------+
```

---

## 3. Authentication Security Audit

### 3.1 Registration Flow (`UserService.register`)
- **Location:** [`backend/src/main/java/com/synthora/identity/service/UserService.java:34-57`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/identity/service/UserService.java#L34-L57)
- **Input Validation:** Enforces `@NotBlank` and `@Email` on email, `@Size(min = 8)` on password ([`RegisterRequest.java:18-20`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/identity/dto/RegisterRequest.java#L18-L20)).
- **Password Hashing:** Hashes passwords via `BCryptPasswordEncoder` (default 10 rounds). Plaintext passwords are never persisted.
- **Account Defaults:** Newly registered accounts are assigned `UserRole.USER` and `UserStatus.ACTIVE` by default.
- **Enumeration Risk:** Returns `"Email already registered"` with HTTP 400 when an email already exists. While typical in B2B systems, it allows unauthenticated email enumeration.
- **Missing Controls:** No email verification/activation loop (e.g. email confirmation token) and no password complexity checks (uppercase, lowercase, digits, symbols).

### 3.2 Login Flow (`UserService.login`)
- **Location:** [`backend/src/main/java/com/synthora/identity/service/UserService.java:59-77`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/identity/service/UserService.java#L59-L77)
- **Credential Verification:** Uses `passwordEncoder.matches(request.password(), user.getPasswordHash())`.
- **Lifecycle Checks:** Correctly verifies `user.getDeletedAt() == null` and `user.getStatus() != UserStatus.SUSPENDED` prior to issuing a JWT.
- **Failure Message:** Throws generic `"Invalid email or password"` for both missing email and invalid password, preventing timing/response discrepancy during login verification.

### 3.3 JWT Generation & Signing (`JwtService`)
- **Location:** [`backend/src/main/java/com/synthora/security/JwtService.java:27-36`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/security/JwtService.java#L27-L36)
- **Algorithm:** `SignatureAlgorithm.HS256` using HMAC-SHA key generated from `jwtSecret.getBytes()`.
- **Token Claims:**
  - `sub`: `user.getEmail()`
  - `role`: `user.getRole().name()`
  - `iat`: Issued at timestamp
  - `exp`: Expiration timestamp (default: 86,400,000 ms = 24 hours)
- **Missing Standard Claims:** Does not emit `iss` (issuer), `aud` (audience), `jti` (unique token ID), or `uid` (user UUID).
- **Subject Design Flaw:** Storing `email` as `sub` rather than `user.getId().toString()` couples JWT identity to mutable email addresses.

---

## 4. JWT & Session Security Audit

### 4.1 Token Storage & Client Exposure
- **Storage Location:** `localStorage` (`synthora_token`).
- **XSS Exposure:** HIGH. Because `localStorage` is accessible to browser JavaScript, any client-side cross-site scripting flaw would allow complete session theft.
- **Recommendation:** In Phase 2H.2, evaluate transition to `HttpOnly`, `Secure`, `SameSite=Lax/Strict` session cookies with CSRF defense.

### 4.2 Token Validation Filter (`JwtAuthenticationFilter`)
- **Location:** [`backend/src/main/java/com/synthora/security/JwtAuthenticationFilter.java:27-57`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/security/JwtAuthenticationFilter.java#L27-L57)
- **Validation Logic:** Parses the token using JJWT `Jwts.parser().verifyWith(key).build().parseSignedClaims(token)`.
- **CRITICAL FLAW — Disconnected User State:** Once a JWT is signed, `JwtAuthenticationFilter` creates a Spring Security `UsernamePasswordAuthenticationToken` using only the claims (`sub` and `role`). It does **not** check whether the user has been deactivated (`deletedAt != null`) or suspended (`UserStatus.SUSPENDED`) in the database.
- **Impact:** An administrator can suspend or delete a malicious or compromised user in `AdminUserController`, but that user remains fully authorized to invoke APIs until their 24-hour JWT expires.

### 4.3 Invalidation & Logout
- **Logout:** Handled purely on the frontend via `localStorage.removeItem("synthora_token")`.
- **Server-Side Revocation:** No token revocation, denylist, or version tracking (`tokenVersion` / `iat` invalidation) exists on the backend.

---

## 5. Authorization & RBAC Audit

### 5.1 Role Hierarchy & Granted Authorities
- Roles: `USER`, `SUPPLIER`, `ADMIN` ([`UserRole.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/identity/UserRole.java)).
- In `JwtAuthenticationFilter.java:50`, the authority is mapped to `ROLE_` + `role` (e.g. `ROLE_USER`, `ROLE_SUPPLIER`, `ROLE_ADMIN`).

### 5.2 Endpoint Authorization Breakdown

| Endpoint Pattern | Spring Security / Method Auth | Authoritative Layer | Assessment |
|---|---|---|---|
| `/api/v1/auth/**` | `permitAll()` | Controller/Service | Public |
| `/api/v1/products/**` (GET) | `permitAll()` | Public specification | Public catalog |
| `/api/v1/products` (POST/PUT/DELETE) | `@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")` | ProductService (ownership check) | SECURE |
| `/api/v1/products/{id}/supplier-offering` | `@PreAuthorize("hasRole('SUPPLIER')")` | ProductSupplierService (identity resolver) | SECURE |
| `/api/v1/sellers/me` | `@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")` | SellerProfileService (identity resolver) | SECURE |
| `/api/v1/rfqs/my/**` | `.authenticated()` | RfqService (`findByIdAndBuyerId`) | SECURE |
| `/api/v1/rfqs/supplier/**` | `@PreAuthorize("hasRole('SUPPLIER')")` | RfqService (`findByIdAndSupplierId`) | SECURE |
| `/api/v1/orders/my/**` | `@PreAuthorize("hasRole('BUYER') or hasRole('USER')")` | PurchaseOrderService (`findByIdAndBuyerId`) | SECURE* |
| `/api/v1/orders/supplier/**` | `@PreAuthorize("hasRole('SUPPLIER')")` | PurchaseOrderService (`findByIdAndSupplierId`) | SECURE |
| `/api/v1/admin/**` | `@PreAuthorize("hasRole('ADMIN')")` | AdminServices + AuditService | SECURE |
| `/api/v1/documents/**` | `.authenticated()` | `DocumentAuthorizationServiceImpl` | SECURE |
| `/api/v1/notifications/**` | `.authenticated()` | NotificationService (`userId` scoping) | SECURE |

*\*Note on `hasRole('BUYER')`: `PurchaseOrderController` specifies `@PreAuthorize("hasRole('BUYER') or hasRole('USER')")`. Because `BUYER` is not an enum in `UserRole`, `hasRole('USER')` correctly satisfies the check.*

---

## 6. IDOR / BOLA Forensic Audit

Each resource endpoint was audited against unauthorized cross-tenant object access:

1. **RFQ IDOR Resistance:**
   - Buyer endpoints (`/api/v1/rfqs/my`, `/api/v1/rfqs/{rfqId}`) query `rfqRepository.findByIdAndBuyerId(rfqId, buyer.getId())`.
   - Supplier endpoints (`/api/v1/rfqs/supplier/{rfqId}`) query `rfqRepository.findByIdAndSupplierId(rfqId, supplier.getId())`.
   - Cross-tenant requests return `404 Not Found`, preventing object existence probing.
2. **Quotation IDOR Resistance:**
   - `getBuyerQuotations` and `acceptQuotation`/`rejectQuotation` query the parent RFQ by `rfqId` and `buyer.getId()`, verifying quotation ownership through the RFQ relationship.
3. **Purchase Order IDOR Resistance:**
   - `getBuyerOrder` uses `purchaseOrderRepository.findByIdAndBuyerId(orderId, buyer.getId())`.
   - `getSupplierOrder` and all supplier PO mutation endpoints (`confirm`, `process`, `ship`, `deliver`) query `purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())`.
   - `getShipment` explicitly asserts `isBuyer || isSupplier`.
4. **Product & Offering IDOR Resistance:**
   - `ProductSupplierService` derives the supplier ID exclusively via `SupplierIdentityResolver.resolveOperationalSupplier(user)`. It does not accept `supplierId` from path or body.
5. **Document IDOR Resistance:**
   - `DocumentAuthorizationServiceImpl` resolves ownership across all document owner types (`PRODUCT`, `RFQ`, `QUOTATION`, `PURCHASE_ORDER`, `SHIPMENT`) and verifies caller association before download or deletion.

**Verdict:** ZERO confirmed IDOR/BOLA vulnerabilities found in active domain services.

---

## 7. Business Logic Security

### 7.1 RFQ State Transitions
- States: `PENDING`, `CONTACTED`, `QUOTED`, `ACCEPTED`, `REJECTED`, `CLOSED`, `CANCELLED` ([`RfqStatus.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/rfq/RfqStatus.java)).
- `submitQuotation` validates that RFQ is not in terminal states (`ACCEPTED`, `REJECTED`, `CLOSED`, `CANCELLED`).
- `acceptQuotation` and `rejectQuotation` require `status == QUOTED` and strictly enforce acceptance of only the latest quotation version (`maxVersion`).

### 7.2 Purchase Order State Transitions
- States: `PLACED`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` ([`OrderStatus.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/order/OrderStatus.java)).
- Order creation requires `rfq.getStatus() == RfqStatus.ACCEPTED` and prevents duplicate PO issuance via `existsByRfqId(rfq.getId())`.
- Total amount is calculated server-side from `rfq.getQuantity().multiply(quotation.getUnitPrice())` — client cannot tamper with pricing.
- State transitions are strictly progressive: `confirm` requires `PLACED`, `process` requires `CONFIRMED`, `ship` requires `PROCESSING`, `deliver` requires `SHIPPED`.
- Cancellation is restricted to administrators via `AdminTransactionController.cancelOrder`.

---

## 8. File Upload & Storage Security Audit

### 8.1 Inspection of `DocumentService` & `LocalStorageService`
- **Location:** [`backend/src/main/java/com/synthora/document/DocumentService.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/document/DocumentService.java)
- **Max File Size:** Configured to 10 MB (`synthora.documents.max-file-size: 10485760`).
- **Filename Sanitization:** `normalizeFileName()` strips path components, control characters, and truncates length to 255 chars.
- **Physical Key Generation:** `"documents/" + UUID.randomUUID().toString() + extension`.
- **Path Traversal Defense:** `LocalStorageService.resolveSafePath(key)` enforces `targetPath.startsWith(this.rootLocation)`.

### 8.2 Security Weaknesses in Upload Pipeline
1. **No Magic-Byte / File-Signature Inspection:** Validation in `DocumentService.validateFile()` inspects only `file.getContentType()` and filename extension. An attacker can upload an executable file disguised with `Content-Type: application/pdf`.
2. **Local Storage Location:** Files are stored in `./storage/documents` on the local file system. While non-executable, this directory is inside the application root in local environments.

---

## 9. CORS, CSRF, and HTTP Security

### 9.1 CORS Configuration
- **Location:** [`backend/src/main/java/com/synthora/config/SecurityConfig.java:37-61`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/config/SecurityConfig.java#L37-L61)
- Allowed Origins: `List.of("http://localhost:3000")`.
- Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`.
- Allowed Headers: `*`.
- Allow Credentials: `true`.
- **Finding:** Allowed origin is hardcoded to `http://localhost:3000` rather than dynamically injected via environment variables (`${CORS_ALLOWED_ORIGINS}`).

### 9.2 CSRF Configuration
- CSRF is disabled (`csrf.disable()`). Because current authentication relies strictly on the `Authorization: Bearer <JWT>` header in `localStorage` (which browsers do not attach automatically across origins), CSRF is not directly exploitable in the current design. However, when migrating to cookie-based authentication in Phase 2H.2, CSRF defenses (e.g. SameSite cookies + CSRF tokens) will be required.

---

## 10. Security Response Headers

### Current Header Posture: **DEFICIENT**
Inspection of `SecurityConfig.java` reveals that Spring Security standard response headers have not been explicitly configured or customized.

| Header | Status | Recommended Value |
|---|---|---|
| `Content-Security-Policy` | **MISSING** | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; ...` |
| `Strict-Transport-Security` | **MISSING** | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | **MISSING (Default)** | `nosniff` |
| `X-Frame-Options` | **MISSING (Default)** | `DENY` |
| `Referrer-Policy` | **MISSING** | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | **MISSING** | `camera=(), microphone=(), geolocation=()` |

---

## 11. Frontend Security Audit

### 11.1 Client-Side Token Handling
- Token is retrieved from `localStorage` in `getAuthUser()` and decoded using `atob()`.
- Client-side checks expiration: `decoded.exp * 1000 < Date.now()`.
- **Gap:** `authenticatedFetch.ts` does not intercept HTTP 401/403 responses. If a session is revoked or expired on the backend, the frontend UI continues to render protected dashboard wrappers until a full reload or manual sign-out occurs.

### 11.2 XSS & Content Rendering
- No instances of `dangerouslySetInnerHTML` exist in the frontend codebase.
- React JSX auto-escaping protects against typical DOM-based HTML injection from product descriptions or company names.

### 11.3 Public Environment Variables
- `NEXT_PUBLIC_API_URL` is used for backend routing. No sensitive API keys or credentials are exposed in `NEXT_PUBLIC_` variables.

---

## 12. Error Handling & Information Leakage

### 12.1 Backend Exception Handler (`GlobalExceptionHandler`)
- **Location:** [`backend/src/main/java/com/synthora/common/GlobalExceptionHandler.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/common/GlobalExceptionHandler.java)
- Handled Exceptions:
  - `ResourceNotFoundException` -> HTTP 404 `{"error": "..."}`
  - `IllegalArgumentException` -> HTTP 400 `{"error": "..."}`
  - `MethodArgumentNotValidException` -> HTTP 400 `{field: message}`
  - `AccessDeniedException` -> HTTP 403 `{"error": "..."}`
  - `IllegalStateException` -> HTTP 409 `{"error": "..."}`
- **Security Gap:** Missing a global fallback `@ExceptionHandler(Exception.class)` for uncaught runtime exceptions (e.g. `NullPointerException`, `DataIntegrityViolationException`). Uncaught exceptions will return Spring Boot default error attributes which may leak internal package structure or SQL error details.

### 12.2 Actuator Information Exposure
- In [`application.yml:48`](file:///d:/Saisaket/Synthora/backend/src/main/resources/application.yml#L48):
  ```yaml
  management:
    endpoint:
      health:
        show-details: always
  ```
- In `SecurityConfig.java:89-90`, `/actuator/health` and `/actuator/info` are `permitAll()`.
- **Finding:** Setting `show-details: always` on a publicly accessible health endpoint exposes database connectivity, disk space, and internal components to unauthenticated attackers.

---

## 13. Database Security

- **Engine:** PostgreSQL with Flyway migration management (Baseline V1_001 to V16).
- **Injection Risks:** Spring Data JPA repositories and `Specification` criteria builders use parameterized queries exclusively. Zero raw string SQL concatenation detected.
- **Foreign Key Integrity:** Enforced across relational tables (e.g. `audit_logs` references `users(id) ON DELETE RESTRICT`).
- **Soft Delete:** `users` table contains `deleted_at` and `deleted_by`. Authentication properly rejects deleted users, but select repository search queries should ensure `deleted_at IS NULL` is filtered consistently.

---

## 14. Secrets & Environment Configuration

- **Dev Profile (`application-dev.yml`):**
  - Database password configured with development default.
  - JWT secret configured with development fallback: `${JWT_SECRET:SynthoraDevSecretKeyForJwtSigning2026!}`.
- **Production Profile (`application-prod.yml`):**
  - Properly parameterizes `${DB_URL}`, `${DB_USER}`, `${DB_PASSWORD}`, and `${JWT_SECRET}`.
  - No production credentials hardcoded.

---

## 15. Password Security Posture

- **Hasher:** `BCryptPasswordEncoder` (Work factor 10).
- **Policy:** Minimum 8 characters (`@Size(min = 8)`).
- **Gaps:**
  - No upper/lower/digit/special complexity rules.
  - No verification against common/compromised password lists.
  - No password reset or password change endpoints exist in the current backend.

---

## 16. Rate Limiting & Abuse Protection

- **Current Posture:** **ABSENT**.
- Neither Spring Security filters nor controllers implement rate limiting or request throttling.
- **Risk Areas:**
  1. `/api/v1/auth/login` (Credential stuffing / Brute force)
  2. `/api/v1/auth/register` (Account creation spam)
  3. `/api/v1/documents` (Storage exhaustion DoS)
  4. `/api/v1/rfqs` (Inquiry flooding)

---

## 17. Audit Logging Forensic Review

- **Table:** `audit_logs` (Flyway `V16__create_audit_logs_table.sql`).
- **Service:** [`com.synthora.admin.audit.AuditService`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/admin/audit/AuditService.java).
- **Coverage:** Intercepts administrative mutations:
  - User status/role updates & soft deletes
  - Supplier verification & export-readiness toggles
  - Product availability changes & deactivations
  - RFQ status changes & PO cancellations
- **Recorded Attributes:** `admin_id` (UUID), `action`, `target_type`, `target_id`, `details`, `ip_address` (via `X-Forwarded-For` / remote addr), and `created_at`.
- **Integrity:** Append-only table without update/delete endpoints. Non-admin users cannot trigger audit recording.
- **Limitation:** *"Audit logs are written by the backend, but standalone audit-log read API is currently deferred."*

---

## 18. Dependency Security Audit

### Backend (`pom.xml`)
- Spring Boot: `3.4.1` (Current, actively maintained)
- JJWT: `0.12.6` (Latest stable release)
- SpringDoc OpenAPI: `2.8.3`
- PostgreSQL JDBC: Managed by Spring Boot starter
- Flyway: `10.x` / Managed by Spring Boot starter

### Frontend (`package.json`)
- Next.js: `16.3.0`
- React: `19.2.8`
- TypeScript: `5.x`
- Tailwind CSS: `v4`

**Finding:** Dependencies are modern and free of obvious legacy CVE exposures.

---

## 19. Public vs. Private Route Classification

```
PUBLIC ROUTES (Unauthenticated / Public Search Engines):
├── / (Landing Page & Catalog Spotlight)
├── /products (Public Chemical Catalog)
├── /products/[id] (Public Product Specification)
├── /categories (Category Index)
├── /suppliers (Public Verified Supplier Directory)
├── /suppliers/[id] (Public Supplier Profile)
├── /resources (Procurement Documentation)
├── /industries (Industry Verticals)
├── /login (Authentication Portal)
└── /rfq (Public RFQ Inquiry Launcher -> Redirects to Login if unauthenticated)

PRIVATE ROUTES (Authenticated / Role-Restricted / Non-Indexable):
├── /dashboard (Buyer Overview)
├── /dashboard/rfqs (Buyer RFQ Management)
├── /dashboard/rfqs/[id] (Buyer RFQ Detail & Quotation Comparison)
├── /dashboard/orders (Buyer Purchase Orders)
├── /dashboard/orders/[id] (Buyer Purchase Order Tracking)
├── /dashboard/notifications (User Alerts)
├── /dashboard/supplier (Supplier Overview)
├── /dashboard/supplier/profile (Supplier Company Profile)
├── /dashboard/supplier/products (Supplier Catalog Inventory)
├── /dashboard/supplier/rfqs (Supplier RFQ Inbox & Quotation Submission)
├── /dashboard/supplier/orders (Supplier Order Fulfillment & Shipment)
├── /dashboard/admin (Governance Portal)
├── /dashboard/admin/users (User Administration & Status Moderation)
├── /dashboard/admin/suppliers (Supplier Verification & Export Audit)
├── /dashboard/admin/products (Catalog Governance & Availability)
└── /dashboard/admin/transactions/** (Transaction & PO Oversight)
```

---

## 20. Risk Register

| ID | Severity | Area | Finding | Evidence | Impact | Recommended Fix |
|---|---|---|---|---|---|---|
| **SEC-01** | **HIGH** | Authentication | JWT filter does not verify account status (active/suspended/deleted) against database | [`JwtAuthenticationFilter.java:41-55`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/security/JwtAuthenticationFilter.java#L41-L55) | Suspended or deleted users retain API access until token expiration (24h) | Query DB or implement token revocation check in filter |
| **SEC-02** | **MEDIUM-HIGH** | Session | Auth token stored in browser `localStorage` | [`auth.ts:49`](file:///d:/Saisaket/Synthora/frontend/src/features/auth/api/auth.ts#L49) | Vulnerable to token exfiltration if XSS occurs | Migrate to `HttpOnly`, `Secure`, `SameSite` cookies (Phase 2H.2) |
| **SEC-03** | **MEDIUM-HIGH** | File Upload | Document upload lacks magic-byte validation | [`DocumentService.java:210-222`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/document/DocumentService.java#L210-L222) | Malicious files disguised with spoofed MIME headers could be uploaded | Implement Apache Tika / magic byte inspection (Phase 2H.4) |
| **SEC-04** | **MEDIUM** | API Security | Actuator health details exposed publicly (`show-details: always`) | [`application.yml:48`](file:///d:/Saisaket/Synthora/backend/src/main/resources/application.yml#L48) | Leaks database connection and internal subsystem status | Change to `when-authorized` or `never` for public users |
| **SEC-05** | **MEDIUM** | Security Headers | Standard HTTP security headers missing from Spring Security chain | [`SecurityConfig.java:64-158`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/config/SecurityConfig.java#L64-L158) | Missing clickjacking (X-Frame-Options), MIME-sniffing, and CSP protections | Configure explicit headers block in `SecurityFilterChain` |
| **SEC-06** | **MEDIUM** | Abuse Protection | No rate limiting on authentication or document upload endpoints | Entire API surface | Vulnerable to brute-force credential stuffing and storage exhaustion | Introduce Bucket4j / rate-limiting filter on auth & upload |
| **SEC-07** | **MEDIUM-LOW** | Error Handling | Missing global fallback exception handler in backend | [`GlobalExceptionHandler.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/common/GlobalExceptionHandler.java) | Unhandled runtime errors may leak stack traces or internal exception classes | Add generic `@ExceptionHandler(Exception.class)` |
| **SEC-08** | **MEDIUM-LOW** | Frontend Auth | `authenticatedFetch` does not handle HTTP 401 responses | [`authenticatedFetch.ts:4-28`](file:///d:/Saisaket/Synthora/frontend/src/features/auth/api/authenticatedFetch.ts#L4-L28) | Stale UI remains active when token expires or is rejected | Automatically clear storage and redirect on 401 |
| **SEC-09** | **LOW** | CORS | CORS allowed origin hardcoded to `localhost:3000` | [`SecurityConfig.java:42`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/config/SecurityConfig.java#L42) | Hinders multi-environment deployment flexibility | Make CORS allowed origins configurable via properties |
| **SEC-10** | **INFORMATIONAL** | JWT Claims | JWT subject uses mutable `email` instead of immutable `user.id` | [`JwtService.java:30`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/security/JwtService.java#L30) | Email updates break or desynchronize JWT identity | Use user UUID as `sub` and include `email` as a claim |

---

## 21. Immediate Fixes Required Before Staging

Before deploying Synthora to any public staging environment, the following baseline hardening steps must be executed:
1. **Sanitize Actuator Health Details:** Change `management.endpoint.health.show-details` to `never` or restrict access to administrators.
2. **Add Missing Security Headers:** Add `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and basic CSP to `SecurityConfig`.
3. **Add Global Fallback Error Handler:** Ensure all unhandled backend exceptions return sanitized HTTP 500 JSON without stack traces.
4. **Environment-Based JWT Secret & CORS:** Ensure `JWT_SECRET` has no development fallback in production and CORS origins are driven by environment variables.

---

## 22. Required Phase 2H Implementation Roadmap

```
  +-------------------------------------------------------------------------+
  | Phase 2H.1: Security Forensic Audit (COMPLETED - REPORT ONLY)           |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.2: Authentication & Session Hardening                          |
  | - Verify user status/deactivation in JwtAuthenticationFilter            |
  | - Standardize JWT claims (UUID subject, jti, iat, exp)                  |
  | - Frontend 401 auto-logout interceptor                                  |
  | - Security response headers & Actuator sanitization                     |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.3: Authorization / RBAC / Rate Limiting Hardening              |
  | - Password complexity validation and password change endpoint           |
  | - Login & Registration rate limiting (Bucket4j / Filter)                |
  | - Soft-delete query consistency across repositories                     |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.4: Secure File Upload & Download Pipeline                      |
  | - Magic-byte / file signature validation (Apache Tika)                  |
  | - Upload rate limiting and strict MIME type enforcement                 |
  | - Storage quota safeguards per tenant                                   |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.5: PO Fulfillment Lifecycle Hardening                          |
  | - Buyer cancellation / dispute handling state workflows                 |
  | - Order status transition invariants and email notification triggers    |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.6: Buyer Registration & Supplier Onboarding Workflows          |
  | - Formalized onboarding requirements, company verification gating       |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.7: Supplier & Product Management Refinements                   |
  | - Seller profile enhancement & offering inventory controls             |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.8: Catalog UX, Search & Product Architecture                   |
  | - Enterprise chemical search, CAS number indexing, faceted filters      |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.9: Dashboard, Navbar, Typography & UX Redesign                 |
  | - Premium UI overhaul, glassmorphic accents, responsive navigation      |
  +-------------------------------------------------------------------------+
                                      │
                                      ▼
  +-------------------------------------------------------------------------+
  | Phase 2H.10: Final Security & Functional Verification                   |
  | - Full end-to-end regression testing, penetration test verification     |
  +-------------------------------------------------------------------------+
```

---

## 23. Final Security Posture Summary

Synthora demonstrates strong foundational security engineering:
- **Zero Client Trust** is maintained across all transactional domains (RFQ, Quotation, PO, Seller Offering).
- **IDOR / BOLA** defenses are structurally sound through server-side ownership scoping.
- **Administrative Governance** is auditable, role-restricted, and immutable.

Addressing the findings identified in this audit—specifically active account validation in the JWT filter, magic-byte upload validation, rate limiting, security headers, and session storage hardening—will elevate Synthora to full enterprise-grade commercial readiness.

---
*Report completed under Phase 2H.1. No modifications were made to application code or database schema during this phase.*
