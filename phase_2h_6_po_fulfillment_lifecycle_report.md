# Phase 2H.6 — Purchase Order Fulfillment Lifecycle Report

**Status**: COMPLETED & VERIFIED  
**Date**: August 18, 2026  
**Scope**: Purchase Order Fulfillment Lifecycle, Rejection Workflow, Timeline & Traceability, Events & Notifications, Regression & Security Verification.

---

## 1. Executive Summary

Phase 2H.6 successfully implements and hardens the complete Purchase Order (PO) fulfillment and rejection lifecycle in KemKendra. Prior to this phase, purchase orders concluded at `CONFIRMED` without operational fulfillment transitions.

This phase implemented the deterministic state machine:
```
                ┌───────────────┐
                │    PLACED     │
                └──┬─────────┬──┘
                   │         │ (Supplier Reject)
(Supplier Confirm) │         ▼
                   │   ┌───────────┐
                   │   │ REJECTED  │ (Terminal)
                   │   └───────────┘
                   ▼         ▲
                ┌────────────┴──┐
                │   CONFIRMED   │
                └──────┬────────┘
                       │ (Supplier Start Processing)
                       ▼
                ┌───────────────┐
                │  PROCESSING   │
                └──────┬────────┘
                       │ (Supplier Mark Shipped + Carrier Details)
                       ▼
                ┌───────────────┐
                │    SHIPPED    │
                └──────┬────────┘
                       │ (Buyer Confirm Receipt / Supplier Mark Delivered)
                       ▼
                ┌───────────────┐
                │   DELIVERED   │ (Terminal)
                └───────────────┘
```

All state transitions are strictly validated on the backend with zero client trust. Rejection is strictly limited to pre-fulfillment states (`PLACED` or `CONFIRMED`) and enforces trimmed reasons between 5 and 1000 characters. In transit (`SHIPPED`) purchase orders require explicit buyer receipt confirmation (`POST /api/v1/orders/{orderId}/receive`) to reach `DELIVERED`.

---

## 2. Complete State Transition Matrix

| Current State | Target State | Triggering Endpoint | Authorized Actor | Preconditions / Validations | Side Effects / Artifacts |
|---|---|---|---|---|---|
| `PLACED` | `CONFIRMED` | `POST /api/v1/orders/supplier/{id}/confirm` | Order's Supplier | Status == `PLACED`, supplier ownership verified | Sets `confirmedAt = now()`, emits `PurchaseOrderConfirmedEvent`, creates audit log |
| `PLACED` | `REJECTED` | `POST /api/v1/orders/supplier/{id}/reject` | Order's Supplier | Status == `PLACED`, trimmed `reason.length` $\in [5, 1000]$ | Sets `rejectedAt = now()`, `rejectionReason`, emits `PurchaseOrderRejectedEvent` (notifies Buyer), creates audit log |
| `CONFIRMED` | `REJECTED` | `POST /api/v1/orders/supplier/{id}/reject` | Order's Supplier | Status == `CONFIRMED`, trimmed `reason.length` $\in [5, 1000]$ | Sets `rejectedAt = now()`, `rejectionReason`, emits `PurchaseOrderRejectedEvent` (notifies Buyer), creates audit log |
| `CONFIRMED` | `PROCESSING` | `POST /api/v1/orders/supplier/{id}/process` | Order's Supplier | Status == `CONFIRMED`, supplier ownership verified | Sets `processingAt = now()`, emits `OrderProcessingStartedEvent` (notifies Buyer), creates audit log |
| `PROCESSING` | `SHIPPED` | `POST /api/v1/orders/supplier/{id}/ship` | Order's Supplier | Status == `PROCESSING`, valid carrier & tracking number | Creates `Shipment` record, sets `shippedAt = now()`, emits `OrderShippedEvent` (notifies Buyer), creates audit log |
| `SHIPPED` | `DELIVERED` | `POST /api/v1/orders/{id}/receive` | Order's Buyer | Status == `SHIPPED`, buyer ownership verified | Sets `deliveredAt = now()`, emits `OrderReceiptConfirmedEvent` (notifies Supplier), creates audit log |
| `SHIPPED` | `DELIVERED` | `POST /api/v1/orders/{id}/deliver` | Order's Supplier | Status == `SHIPPED`, supplier ownership verified | Sets `deliveredAt = now()`, creates audit log |
| `PROCESSING` | `REJECTED` | `POST /api/v1/orders/supplier/{id}/reject` | Order's Supplier | — | **409 Conflict**: Rejection illegal once fulfillment begins |
| `SHIPPED` | `REJECTED` | `POST /api/v1/orders/supplier/{id}/reject` | Order's Supplier | — | **409 Conflict**: Cannot reject dispatched goods |
| `DELIVERED` | *Any* | *Any* | *Any* | — | **409 Conflict**: Terminal state |
| `REJECTED` | *Any* | *Any* | *Any* | — | **409 Conflict**: Terminal state |

---

## 3. Implementation Details

### 3.1 Database Migration
- Migration file: [`V17__add_po_rejection_and_lifecycle_fields.sql`](file:///d:/Saisaket/KemKendra/backend/src/main/resources/db/migration/V17__add_po_rejection_and_lifecycle_fields.sql)
- Added columns to table `purchase_orders`:
  - `rejection_reason VARCHAR(1000)`
  - `rejected_at TIMESTAMP`
  - `processing_at TIMESTAMP`
  - `shipped_at TIMESTAMP`
  - `delivered_at TIMESTAMP`

### 3.2 Backend Domain & Security Layer
- **`PurchaseOrder.java`**: Added lifecycle timestamps and rejection reason fields.
- **`OrderStatus.java`**: Added `REJECTED` enum value.
- **`RejectPurchaseOrderRequest.java`**: Request DTO enforcing `@NotBlank` and `@Size(min = 5, max = 1000)`.
- **`PurchaseOrderService.java`**:
  - `rejectSupplierOrder(...)`: Validates `PLACED` or `CONFIRMED` state, saves reason & timestamp, emits `PurchaseOrderRejectedEvent`.
  - `confirmReceiptBuyerOrder(...)`: Validates `SHIPPED` state and buyer ownership, sets `deliveredAt`, emits `OrderReceiptConfirmedEvent`.
  - `startProcessingSupplierOrder(...)`: Sets `processingAt` and updates status to `PROCESSING`.
  - `shipSupplierOrder(...)`: Sets `shippedAt` and creates `Shipment` entity.
- **`PurchaseOrderController.java`**:
  - `POST /api/v1/orders/supplier/{orderId}/reject` (Protected by `@PreAuthorize("hasRole('SUPPLIER')")` and supplier ownership).
  - `POST /api/v1/orders/{orderId}/receive` (Protected by `@PreAuthorize("hasRole('BUYER') or hasRole('USER')")` and buyer ownership).
- **`NotificationEventListener.java` & `AuditAction.java`**:
  - `PurchaseOrderRejectedEvent` $\rightarrow$ Buyer notification (`PO_REJECTED`) + audit log.
  - `OrderReceiptConfirmedEvent` $\rightarrow$ Supplier notification (`ORDER_RECEIPT_CONFIRMED`) + audit log.

### 3.3 Frontend Components & Pages
- **Fulfillment API (`fulfillment.ts`)**: Added `confirmReceiptBuyer` and `rejectSupplierOrder`.
- **Rejection Modal (`RejectOrderModal.tsx`)**: Modal with character counter, validation, and loading indicators.
- **Supplier PO Detail (`/dashboard/supplier/orders/[id]`)**:
  - Direct actions for `[Reject Order]` in `PLACED` and `CONFIRMED` states.
  - `[Confirm Purchase Order]`, `[Start Processing]`, `[Mark as Shipped]`, `[Mark as Delivered]`.
  - Rejection banner with reason and timestamp when status is `REJECTED`.
- **Buyer PO Detail (`/dashboard/orders/[id]`)**:
  - `[Confirm Receipt]` action banner displayed when status is `SHIPPED`.
  - Full Procurement Trace timeline displaying `DELIVERED`, `SHIPPED`, `PROCESSING`, `CONFIRMED`, `PLACED`, and `REJECTED` checkpoints.
  - Rejection notice with justification displayed when status is `REJECTED`.

---

## 4. Verification Results

### 4.1 Automated Security & Workflow Test Suite
- Suite: [`PurchaseOrderFulfillmentSecurityTest.java`](file:///d:/Saisaket/KemKendra/backend/src/test/java/com/kemkendra/security/PurchaseOrderFulfillmentSecurityTest.java)
- **33/33 Tests Passing** covering:
  - Complete forward lifecycle: `PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `DELIVERED`.
  - Illegal skips (e.g. `PLACED` $\rightarrow$ `SHIPPED`, `CONFIRMED` $\rightarrow$ `SHIPPED` rejected with 409).
  - Duplicate state transitions (e.g. processing twice rejected with 409).
  - Cross-supplier IDOR protection (Supplier B cannot process, ship, or reject Supplier A's order -> 404).
  - Cross-buyer IDOR protection (Buyer B cannot confirm receipt of Buyer A's order -> 404).
  - Role protection (Buyer cannot call supplier endpoints -> 403; Supplier cannot call buyer endpoints -> 403).
  - Rejection validation (blank reasons and reasons $<5$ chars rejected with 400).
  - Rejection lifecycle boundary enforcement (cannot reject `PROCESSING`, `SHIPPED`, or `DELIVERED` orders -> 409).
  - Terminal state immutability (`DELIVERED` and `REJECTED` cannot transition -> 409).
  - Buyer receipt confirmation (only allowed in `SHIPPED` status; `PLACED`/`CONFIRMED`/`PROCESSING` -> 409).
  - Notification dispatch for both rejection and receipt confirmation events.

### 4.2 Full Backend Regression
- Executed `mvn clean test`:
  - **437 Tests Run**
  - **0 Failures**
  - **0 Errors**
  - **0 Skipped**
  - **BUILD SUCCESS**

### 4.3 Frontend Production Build
- Executed `npm run build`:
  - Next.js 16 Turbopack compilation succeeded in 799ms.
  - Type checking clean (0 errors).
  - All 20 static and dynamic routes successfully generated.

### 4.4 Knowledge Graph Synchronization
- Re-indexed AST knowledge graph via `python -m graphify update .`:
  - **1,924 nodes**, **5,124 edges**, **197 communities**.
  - Synchronized output to `.planning/graphs/`.

---

## 5. Architectural Guarantees & Constraints Verified

1. **Server-Controlled State Transitions**: No generic PUT/PATCH endpoints exist that allow arbitrary status mutation.
2. **Deterministic Terminal States**: Once an order reaches `DELIVERED` or `REJECTED`, no further status modification is permitted.
3. **Tenant & Role Isolation**: All fulfillment endpoints enforce strict ownership checks before reading or modifying order state.
4. **Audit Trail Completeness**: Every stage transition logs structured audit records (`PO_CONFIRMED`, `PO_PROCESSING_STARTED`, `PO_SHIPPED`, `PO_DELIVERED`, `PO_REJECTED`).
