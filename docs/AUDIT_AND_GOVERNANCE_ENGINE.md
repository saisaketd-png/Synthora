# Synthora — Admin Audit & Governance Engine Architecture (Phase 1.12)

---

## 1. Overview & Objectives

Phase 1.12 delivers a centralized, immutable, and searchable **Admin Audit & Governance Engine** for the Synthora B2B marketplace. It unifies moderation, identity, security, product catalog, offering lifecycle, supplier verification, and transaction oversight events into a high-performance administrative audit stream.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                SYNTHORA AUDIT & GOVERNANCE STACK                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                   ┌──────────────────┐
│  Authentication  │                  │  Administration  │                   │ Domain Services  │
│  & Registration  │                  │   & Governance   │                   │ (Catalog, Offers)│
└────────┬─────────┘                  └────────┬─────────┘                   └────────┬─────────┘
         │                                     │                                      │
         │ USER_CREATED                        │ USER_SUSPENDED                       │ MASTER_PRODUCT_*
         │                                     │ APPEAL_*                             │ SUPPLIER_OFFERING_*
         │                                     │ SUPPLIER_VERIFIED                    │ SUPPLIER_EVIDENCE_*
         └─────────────────────────────────────┼──────────────────────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │           AuditService           │
                              │ • Actor extraction (JWT subject) │
                              │ • IP & Metadata Sanitization     │
                              │ • JpaSpecification Multi-filter  │
                              │ • In-memory N+1 prevention       │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │    PostgreSQL: audit_logs (V16)  │
                              │ (Immutable, append-only, indexed)│
                              └────────────────┬─────────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
        ┌───────────────────────────┐                     ┌───────────────────────────┐
        │  GET /api/v1/admin/audit  │                     │  GET .../admin/audit/     │
        │  (Paginated Search Stream)│                     │         summary           │
        └─────────────┬─────────────┘                     └─────────────┬─────────────┘
                      │                                                 │
                      └────────────────────────┬────────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     /dashboard/admin/audit       │
                              │ • KPI Metric Summary Strip       │
                              │ • Action Taxonomy Badges         │
                              │ • Dynamic Multi-parameter Filter │
                              │ • Audit Event Detail Drawer      │
                              │ • Target Entity Deep-Links       │
                              └──────────────────────────────────┘
```

---

## 2. Database Schema: `audit_logs` (Flyway `V16`)

Synthora reuses the production-grade `audit_logs` table schema without requiring Flyway migration V43:

| Column Name | SQL Type | Nullable | Description / Constraints |
|---|---|---|---|
| `id` | `UUID` | No | Primary Key (`DEFAULT gen_random_uuid()`) |
| `admin_id` | `UUID` | No | Foreign Key references `users(id)` (`ON DELETE RESTRICT`) |
| `action` | `VARCHAR(60)` | No | Enum value representing the administrative operation |
| `target_type` | `VARCHAR(40)` | No | Enum value categorizing the target entity |
| `target_id` | `VARCHAR(100)` | No | Primary key / identifier of the target entity |
| `details` | `TEXT` | Yes | Non-sensitive summary notes and event descriptions |
| `ip_address` | `VARCHAR(45)` | Yes | Resolved IPv4 / IPv6 client address |
| `created_at` | `TIMESTAMP` | No | Server-side UTC event generation timestamp |

### Indexes:
- `idx_audit_logs_admin_created`: `(admin_id, created_at DESC)`
- `idx_audit_logs_action_created`: `(action, created_at DESC)`
- `idx_audit_logs_target_created`: `(target_type, target_id, created_at DESC)`
- `idx_audit_logs_created`: `(created_at DESC)`

---

## 3. Audit Taxonomy

### 3.1 `AuditAction` Enum
- **User & Account Governance**: `USER_CREATED`, `USER_SUSPENDED`, `USER_ACTIVATED`, `USER_REINSTATED`, `USER_ROLE_CHANGED`, `USER_DELETED`, `APPEAL_SUBMITTED`, `APPEAL_REVIEW_STARTED`, `APPEAL_INFORMATION_REQUESTED`, `APPEAL_INFORMATION_RESPONDED`, `APPEAL_APPROVED`, `APPEAL_REJECTED`.
- **Supplier Trust & KYC**: `SUPPLIER_VERIFICATION_SUBMITTED`, `SUPPLIER_REVIEW_STARTED`, `SUPPLIER_INFORMATION_REQUESTED`, `SUPPLIER_VERIFIED`, `SUPPLIER_UNVERIFIED`, `SUPPLIER_REJECTED`, `SUPPLIER_EXPORT_READY_CHANGED`, `SUPPLIER_SUSPENDED`, `SUPPLIER_ACTIVATED`, `SUPPLIER_LOGO_UPLOADED`, `SUPPLIER_EVIDENCE_UPDATED`.
- **Master Chemical Catalog**: `PRODUCT_REQUEST_APPROVED`, `PRODUCT_REQUEST_REJECTED`, `MASTER_PRODUCT_CREATED`, `MASTER_PRODUCT_UPDATED`, `MASTER_PRODUCT_ACTIVATED`, `MASTER_PRODUCT_DEACTIVATED`, `MASTER_PRODUCT_MERGED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`.
- **Supplier Commercial Offerings**: `SUPPLIER_OFFERING_CREATED`, `SUPPLIER_OFFERING_CREATED_BY_ADMIN`, `SUPPLIER_OFFERING_UPDATED`, `SUPPLIER_OFFERING_ACTIVATED`, `SUPPLIER_OFFERING_DEACTIVATED`, `SUPPLIER_OFFERING_APPROVED`, `SUPPLIER_OFFERING_REJECTED`, `SUPPLIER_OFFERING_FLAGGED`.
- **Documents & Transactions**: `DOCUMENT_DELETED`, `RFQ_STATUS_CHANGED`, `ORDER_CANCELLED`, `PO_CONFIRMED`, `PO_PROCESSING_STARTED`, `PO_SHIPPED`, `PO_DELIVERED`, `PO_REJECTED`.

### 3.2 `AuditTargetType` Enum
`USER`, `SUPPLIER`, `SELLER_PROFILE`, `PRODUCT`, `MASTER_PRODUCT`, `PRODUCT_REQUEST`, `PRODUCT_SUPPLIER`, `SUPPLIER_OFFERING`, `DOCUMENT`, `RFQ`, `PURCHASE_ORDER`, `ACCOUNT_SUSPENSION`, `ACCOUNT_SUSPENSION_APPEAL`.

---

## 4. Security & Sensitive-Data Isolation Model

1. **Authentication & Identity Derivation**:
   - `AuditService` strictly resolves the acting administrator using Spring Security's `Authentication.getName()`.
   - Client requests cannot spoof `adminId`, `actorName`, `actorEmail`, `ipAddress`, or `createdAt`.
2. **Access Control**:
   - `GET /api/v1/admin/audit` and `GET /api/v1/admin/audit/summary` are protected by `@PreAuthorize("hasRole('ADMIN')")`.
   - Unauthenticated requests receive HTTP `401 Unauthorized`.
   - Buyer (`USER`) and Supplier (`SUPPLIER`) requests receive HTTP `403 Forbidden`.
3. **Immutability Enforcement**:
   - Audit logs are strictly append-only.
   - There are NO `PUT`, `PATCH`, or `DELETE` endpoints exposed. Any attempted modification returns HTTP `405 Method Not Allowed` or `404 Not Found`.
   - `AuditLog` entity fields are marked with JPA `updatable = false`.
4. **Data Privacy & Hygiene**:
   - Audit records NEVER store plaintext passwords, password hashes, JWT tokens, reset tokens, email verification tokens, API keys, or raw binary documents.

---

## 5. API Reference

### `GET /api/v1/admin/audit`
Searches and paginates administrative audit events with multi-criteria specifications.

**Parameters**:
- `action` (optional, `AuditAction`): Filter by exact operation.
- `adminId` (optional, `UUID`): Filter by actor user UUID.
- `targetType` (optional, `AuditTargetType`): Filter by entity type.
- `targetId` (optional, `String`): Filter by entity ID.
- `from` (optional, ISO-8601 string): Beginning timestamp.
- `to` (optional, ISO-8601 string): Ending timestamp.
- `query` (optional, `String`): Free-text search matching details, target ID, or client IP.
- `page` (optional, default `0`, min `0`): Page index.
- `size` (optional, default `20`, max `100`): Items per page.

**Response**: `Page<AdminAuditLogResponse>`
```json
{
  "content": [
    {
      "id": "27e9447e-5ace-407f-bd37-b59069881d1f",
      "adminId": "8ff54eb7-f3d0-4350-8d40-002d5ce1196b",
      "adminName": "Platform Administrator",
      "adminEmail": "admin@synthora.com",
      "action": "USER_SUSPENDED",
      "targetType": "USER",
      "targetId": "7993fc08-07cd-4720-8dad-3242309a1c92",
      "details": "Account suspended due to policy infraction.",
      "ipAddress": "127.0.0.1",
      "createdAt": "2026-08-30T14:00:02"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "first": true,
  "last": true,
  "empty": false
}
```

### `GET /api/v1/admin/audit/summary`
Returns indexed KPI counts across governance pillars.

**Response**: `AuditKpiSummaryResponse`
```json
{
  "totalEvents": 450,
  "todayEvents": 32,
  "userGovernanceEvents": 120,
  "supplierGovernanceEvents": 85,
  "catalogGovernanceEvents": 245
}
```

---

## 6. Frontend Admin Dashboard (`/dashboard/admin/audit`)

- **KPI Metric Strip**: Real-time counter cards showing Total Events, Today's Actions, User Governance, Supplier Trust, and Catalog & Offerings.
- **Category Filter Tabs**: Instant categorization across All Events, User Governance, Supplier Trust, Master Catalog, Supplier Offerings, and Transactions.
- **Dynamic Filter Toolbar**: Free-text search, action dropdown, target type selector, and date presets (Today, Last 7 Days, Last 30 Days, Custom Range).
- **Audit Table**: Responsive, color-coded badges, formatted UTC timestamps, truncated details, and inspect triggers.
- **Detail Drawer / Slide-Over Modal**: Displays immutable record confirmation, raw event JSON/details, actor details, client IP, and contextual deep-links to target entities:
  - `USER` &rarr; `/dashboard/admin/account-governance/[userId]`
  - `SUPPLIER` &rarr; `/dashboard/admin/suppliers/verification/[supplierId]`
  - `MASTER_PRODUCT` &rarr; `/dashboard/admin/catalog/master-products/[id]`
  - `SUPPLIER_OFFERING` &rarr; `/dashboard/admin/catalog/offerings/[id]`
  - `ACCOUNT_SUSPENSION_APPEAL` &rarr; `/dashboard/admin/account-governance`
