# Admin Analytics & Platform Overview Documentation

## 1. Purpose & Scope

The Admin Analytics and Platform Operations subsystem provides platform administrators with real-time operational telemetry, transactional throughput metrics, conversion funnel efficiency, and active governance queues across the Synthora B2B chemical marketplace.

All calculations execute against live PostgreSQL domain records using database-level aggregation queries (`COUNT`, `SUM`, `AVG`, `GROUP BY`). No mock data, placeholder metrics, or client-side assumptions are used.

---

## 2. Architecture & Endpoints

### Endpoint Specification

- **URI**: `GET /api/v1/admin/analytics/overview`
- **Controller**: `com.synthora.admin.analytics.api.AdminAnalyticsController`
- **Service**: `com.synthora.admin.analytics.AdminAnalyticsService`
- **Repository**: `com.synthora.admin.analytics.AdminAnalyticsRepository`
- **Authorization**: `@PreAuthorize("hasRole('ADMIN')")`
  - `ROLE_ADMIN`: **200 OK**
  - `ROLE_USER` / Buyer: **403 Forbidden**
  - `ROLE_SUPPLIER` / Seller: **403 Forbidden**
  - Unauthenticated: **401 Unauthorized**

### Request Query Parameters

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `period` | String | Optional | `30d` | Time interval presets: `7d`, `30d`, `90d`, `12m`, `custom` |
| `from` | ISO Date (`YYYY-MM-DD`) | Optional | null | Start date when `period=custom` |
| `to` | ISO Date (`YYYY-MM-DD`) | Optional | null | End date when `period=custom` |

---

## 3. Metrics Implemented & Domain Definitions

### 1. User Metrics (`users`)
- `totalUsers`: Count of non-deleted user records (`deleted_at IS NULL`).
- `totalBuyers`: Count of users with `role = 'USER'`.
- `totalSuppliers`: Count of users with `role = 'SUPPLIER'`.
- `activeUsers`: Count of users with `status = 'ACTIVE'`.
- `suspendedUsers`: Count of users with `status = 'SUSPENDED'`.
- `pendingUsers`: Count of users with `status = 'PENDING'`.
- `unverifiedEmailUsers`: Count of users with `email_verified_at IS NULL`.
- `periodRegistrations`: User registrations within the selected time window.
- `previousPeriodRegistrations`: User registrations in the preceding equivalent window.
- `registrationsGrowthPercentage`: Percentage change between current and previous period. If prior period is 0, returns `null` (baseline) to prevent division by zero or `Infinity`.

### 2. Supplier Metrics (`suppliers`)
- `totalSuppliers`: Total registered supplier entities.
- `pendingVerification`: Suppliers with `verification_status = 'PENDING'`.
- `underReview`: Suppliers with `verification_status = 'UNDER_REVIEW'`.
- `informationRequired`: Suppliers with `verification_status = 'INFORMATION_REQUIRED'`.
- `verifiedSuppliers`: Suppliers with `verification_status = 'VERIFIED'`.
- `rejectedSuppliers`: Suppliers with `verification_status = 'REJECTED'`.
- `suspendedSuppliers`: Suppliers with `verification_status = 'SUSPENDED'`.
- `draftSuppliers`: Suppliers with `verification_status = 'DRAFT'`.
- `periodRegistrations`: Suppliers registered within the period.

### 3. Marketplace Metrics (`marketplace`)
- `totalRfqs`: Total RFQ records in the system.
- `openRfqs`: RFQs in actionable states (`PENDING`, `CONTACTED`, `QUOTED`, `COUNTERED`).
- `acceptedRfqs`: RFQs with `status = 'ACCEPTED'`.
- `rejectedRfqs`: RFQs with `status = 'REJECTED'`.
- `closedRfqs`: RFQs with `status = 'CLOSED'`.
- `cancelledRfqs`: RFQs with `status = 'CANCELLED'`.
- `periodRfqs`: RFQs created in the selected window.
- `totalQuotations`: Total quotes submitted.
- `periodQuotations`: Quotes submitted in the selected window.
- `acceptedQuotations`: Distinct accepted quotation references linked to accepted RFQs.
- `rejectedQuotations`: Rejected quotes/RFQs.

### 4. Purchase Order Metrics (`orders`)
- `totalOrders`: Total purchase orders generated.
- `periodOrders`: Purchase orders created in the selected window.
- `placedOrders`: Orders in `PLACED` status.
- `confirmedOrders`: Orders in `CONFIRMED` status.
- `processingOrders`: Orders in `PROCESSING` status.
- `shippedOrders`: Orders in `SHIPPED` status.
- `deliveredOrders`: Orders in `DELIVERED` status.
- `completedOrders`: Orders in `COMPLETED` status.
- `cancelledOrders`: Orders in `CANCELLED` status.
- `rejectedOrders`: Orders in `REJECTED` status.

### 5. Commercial Metrics & GMV (`commercial`)
- **Gross Merchandise Value (GMV)**: Defined strictly as the sum of `total_amount` across all purchase orders excluding `CANCELLED` and `REJECTED` orders.
- `totalGmv`: Cumulative GMV since platform launch.
- `periodGmv`: GMV generated within the selected time window.
- `previousPeriodGmv`: GMV generated in the prior equivalent window.
- `gmvGrowthPercentage`: Percentage change in GMV vs prior period.
- `averageOrderValue`: Mean purchase order amount for non-cancelled orders.
- `rfqToQuotationConversionRate`: `(Total Quotations / Total RFQs) * 100`.
- `quotationToOrderConversionRate`: `(Total Orders / Total Quotations) * 100`.
- `rfqToOrderConversionRate`: `(Total Orders / Total RFQs) * 100`.

### 6. Shipment & Logistics Metrics (`shipments`)
- `totalShipments`: Total shipment tracking records.
- `activeShipments`: Shipments whose linked purchase order is in `SHIPPED`, `PROCESSING`, `PLACED`, or `CONFIRMED`.
- `deliveredShipments`: Shipments whose linked purchase order is in `DELIVERED` or `COMPLETED`.
- `delayedShipments`: Active shipments where `estimated_delivery_date < CURRENT_DATE`.

---

## 4. Marketplace Funnel Pipeline

The 5-stage conversion pipeline tracks platform transaction drop-off:

```
[ Stage 1: RFQs Created ] ────────── (100% baseline)
           │
           ▼  Quote Submission Rate
[ Stage 2: Quotations Submitted ] ─── (% of RFQs)
           │
           ▼  Quotation Acceptance Rate
[ Stage 3: Quotations Accepted ] ──── (% of Quotes)
           │
           ▼  PO Placement Rate
[ Stage 4: Orders Placed ] ────────── (% of Accepted Quotes)
           │
           ▼  Fulfillment Rate
[ Stage 5: Orders Completed ] ─────── (% of Placed Orders)
```

Overall Funnel Efficiency is computed as `(Completed Orders / RFQs Created) * 100`. Zero denominators are handled cleanly without returning `NaN` or `Infinity`.

---

## 5. Performance & Data Privacy

1. **Database Aggregation**: All calculations execute via native SQL aggregations on indexed columns (`created_at`, `status`, `role`, `verification_status`). No in-memory JVM streaming or full table loads.
2. **Data Privacy**: Analytics responses are strictly aggregate. No passwords, password hashes, JWT tokens, reset tokens, email verification tokens, or secret keys are exposed.
3. **Activity Logging**: Recent activity entries display only public business titles, event types, sanitized actor labels, and deep navigation links.

---

## 6. Known Limitations

- **Platform Revenue / Commission**: The current data model tracks buyer-supplier gross transaction value (GMV). Platform fee/commission accounting is not modeled in the core schema and is therefore omitted until monetization billing tables are introduced.
- **Shipment Real-time GPS Location**: Logistics tracking relies on supplier-provided tracking numbers and carrier metadata. Real-time carrier webhook streaming is scheduled for future logistics enhancements.

---

## 7. Future Admin Roadmap

The following phases are scheduled for subsequent production milestones:

### Phase 1.9: Professional Supplier Verification Center
- Multi-step compliance document verification workflows.
- Evidence inspection modals, due diligence audit logs, and verified tier issuance.

### Phase 1.10: Admin Catalog + Supplier Offering Management
- Master Product synonym curation and global classification management.
- Ability for Admins to create and manage Supplier Offerings on behalf of authorized suppliers.

### Phase 1.11: User Suspension, Reinstatement & Appeals
- Formal account suspension lifecycle:
  `ACTIVE` → `SUSPENDED` → `APPEAL_SUBMITTED` → `ADMIN_REVIEW` → `APPROVED (ACTIVE)` / `DENIED (SUSPENDED)`.
- Self-service appeal submission for restricted buyers and suppliers.

### Phase 1.12: Admin Audit & Governance Engine
- Immutable append-only audit trail capturing all administrative mutations and security interventions.
