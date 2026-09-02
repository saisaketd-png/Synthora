# KemKendra — Admin Configuration & Platform Policy Center (Phase 1.15)

## 1. Overview & Purpose

The **Admin Configuration & Platform Policy Center** provides platform administrators with centralized, secure, runtime-controllable mechanisms to manage business policies, feature flags, broadcast announcements, and chemical catalog taxonomies without requiring code redeployments or server restarts.

---

## 2. Configuration Classification Standard

To protect platform secrets and ensure high security, configuration is divided into strict tiers:

| Tier | Category | Storage | Administration |
|---|---|---|---|
| **Tier 1: Environment-Only Secrets** | Database credentials, JWT secrets, SMTP passwords, filesystem storage paths, port bindings | `application.yml`, Environment Variables | **NEVER** exposed via API or database. Cannot be modified via UI. |
| **Tier 2: Platform Business Policies** | Quotation default validity, minimum lead time, accepted ISO currencies, buyer daily RFQ limits, support contacts | `platform_settings` table (typed schema, cached in memory) | Modifiable via `/api/v1/admin/settings` by `ROLE_ADMIN`. Audited via `AuditService`. |
| **Tier 3: Runtime Feature Flags** | RFQ creation, quote submissions, purchase orders, shipments, buyer/supplier registration, maintenance mode | `platform_feature_flags` table | Modifiable via `/api/v1/admin/feature-controls` with confirmation guards for high-impact toggles. |
| **Tier 4: Broadcast Announcements** | In-app & email announcements across all users, buyers, suppliers, or verified suppliers | `platform_announcements` table | Managed via `/api/v1/admin/announcements`. Dispatched via Phase 1.14 `NotificationService` and `EmailNotificationService`. |
| **Tier 5: Catalog Taxonomy** | Chemical categories, pharmacopoeia grades, packaging specifications, measurement units | `catalog_taxonomies` table | Managed via `/api/v1/admin/taxonomy` with soft deactivation (`active=false`) to preserve historical data. |

---

## 3. Database Schema (Flyway Migration V44)

- `platform_settings`:
  - `setting_key` (VARCHAR 100, PK)
  - `setting_value` (TEXT, NOT NULL)
  - `category` (VARCHAR 50)
  - `data_type` (VARCHAR 20)
  - `description` (TEXT)
  - `impact_warning` (TEXT)
  - `updated_by` (VARCHAR 150)
  - `updated_at` (TIMESTAMP)

- `platform_feature_flags`:
  - `feature_key` (VARCHAR 100, PK)
  - `name` (VARCHAR 150)
  - `description` (TEXT)
  - `impact_warning` (TEXT)
  - `enabled` (BOOLEAN)
  - `requires_confirmation` (BOOLEAN)
  - `is_dangerous` (BOOLEAN)
  - `updated_by` (VARCHAR 150)
  - `updated_at` (TIMESTAMP)

- `platform_announcements`:
  - `id` (UUID, PK)
  - `title` (VARCHAR 255)
  - `message` (TEXT)
  - `severity` (`INFO`, `WARNING`, `CRITICAL`)
  - `audience` (`ALL`, `BUYERS`, `SUPPLIERS`, `ADMINS`, `VERIFIED_SUPPLIERS`)
  - `status` (`DRAFT`, `PUBLISHED`, `DEACTIVATED`)
  - `send_in_app` (BOOLEAN)
  - `send_email` (BOOLEAN)
  - `published_at` (TIMESTAMP)
  - `created_by` (VARCHAR 150)

- `catalog_taxonomies`:
  - `id` (UUID, PK)
  - `taxonomy_type` (`CATEGORY`, `GRADE`, `PACKAGING`, `UNIT`, `CERTIFICATION`, `APPLICATION`)
  - `name` (VARCHAR 150)
  - `code` (VARCHAR 64)
  - `active` (BOOLEAN)
  - `display_order` (INT)
  - Unique constraint on `(taxonomy_type, code)`

---

## 4. Policy & Feature Guard Enforcement

Server-side services directly check policies before executing commercial and user operations:

- **`RfqService`**:
  - Checks `isMaintenanceModeActive()` and `isFeatureEnabled("MARKETPLACE_RFQ_ENABLED")` before accepting new RFQs.
  - Enforces `MINIMUM_LEAD_TIME_DAYS` and `ALLOWED_CURRENCIES` on quotation submissions.
- **`PurchaseOrderService`**:
  - Checks `MARKETPLACE_ORDERS_ENABLED` and `isMaintenanceModeActive()` before purchase order creation.
- **`UserService`**:
  - Enforces `BUYER_REGISTRATION_ENABLED` and `SUPPLIER_REGISTRATION_ENABLED` before user account creation.
- **`SupplierOfferingService`**:
  - Enforces `SUPPLIER_OFFERINGS_ENABLED` on supplier listings and `ADMIN_OFFERING_CREATION_ENABLED` on operator listings.

---

## 5. Security & Zero-Trust Architecture

- All `/api/v1/admin/**` endpoints are protected with `@PreAuthorize("hasRole('ADMIN')")`.
- The actor is resolved server-side from `Authentication.getName()`.
- Every mutation records an immutable audit log entry in `AuditService`.
- Non-admin attempts return `403 Forbidden`; unauthenticated requests return `401 Unauthorized`.
