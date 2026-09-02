# KemKendra — Marketplace Commercial Transaction Lifecycle Reference

**Version**: 1.0 (Phase 1.16 Verified)  
**System Scope**: RFQ, Quotation Negotiation, Purchase Order Fulfillment, Shipment Tracking, and Delivery Governance.

---

## 1. Commercial Lifecycle Architecture

The KemKendra marketplace implements a state-machine driven, multi-party commercial pipeline designed for B2B chemical, intermediate, and pharmaceutical commerce:

```
[Buyer RFQ / Sourcing Broadcast]
               │
               ▼
[Supplier Quotation / Counter-Offer Negotiation] ◄───► [Bidirectional Versioning v1..vN]
               │
       (Quote Accepted)
               ▼
[Purchase Order Issued (Deep Commercial Snapshot)]
               │
               ▼
[Supplier Confirmation & Order Processing]
               │
               ▼
[Shipment Dispatched (Carrier & Tracking Metadata)]
               │
               ▼
[Delivery & Physical Receipt Confirmation]
               │
               ▼
[Order Completion & Historical Settlement]
```

---

## 2. Granular Lifecycle Stages & State Transitions

### Stage 1: RFQ & Sourcing Request Creation
- **Actors**: Authenticated Buyer (`ROLE_BUYER` or `ROLE_USER` with `ACTIVE` status).
- **Target Resolution**: Links to an active `MasterProduct` and an approved `SupplierOffering`.
- **Policy Enforcement**:
  - `BUYER_RFQ_DAILY_LIMIT`: Evaluates buyer's submissions for the platform day. Rejects excess requests with HTTP 409.
  - `MARKETPLACE_RFQ_ENABLED`: Enforced via `FeatureToggleService`.
  - `MAINTENANCE_MODE_ENABLED`: Enforced via `FeatureToggleService`.
- **State**: `PENDING`.
- **Audit Action**: `RFQ_CREATED`.
- **Notification**: `RfqSubmittedEvent` $\rightarrow$ Supplier in-app alert and async email.

### Stage 2: Quotation & Multi-Round Negotiation
- **Actors**: Authenticated Supplier and Buyer.
- **Workflow**:
  1. Supplier submits initial quotation (`v1`) with unit price, currency, MOQ, lead time, packaging details, and validity date $\rightarrow$ RFQ status transitions to `QUOTED`.
  2. Buyer submits counter-offer (`v2`) with proposed unit price, MOQ, or lead time $\rightarrow$ RFQ status transitions to `COUNTERED`.
  3. Supplier or Buyer accepts the latest quotation version (`vN`) $\rightarrow$ RFQ status transitions to `ACCEPTED`, sets `accepted_quotation_id`, and marks any parent `SourcingRequest` as `COMPLETED`.
- **Policy Enforcement**:
  - `MINIMUM_LEAD_TIME_DAYS`: Validates lead time $\ge$ platform threshold.
  - `ALLOWED_CURRENCIES`: Validates currency is in allowed ISO set (e.g. `INR,USD,EUR`).
  - Outdated version guard: Only `max(quotation_version)` can be accepted or countered.
  - Expired quote guard: Quotations where `validityDate < today` cannot be accepted.
- **Audit Actions**: `QUOTATION_SUBMITTED`, `QUOTATION_REVISED`, `COUNTER_OFFER_SUBMITTED`, `QUOTATION_ACCEPTED`, `QUOTATION_REJECTED`.
- **Notifications**: `QuotationSubmittedEvent`, `CounterOfferSubmittedEvent`, `QuotationAcceptedEvent`, `QuotationRejectedEvent`.

### Stage 3: Purchase Order Issuance & Immutable Snapshot
- **Actors**: Authenticated Buyer.
- **Preconditions**: RFQ must be in `ACCEPTED` status with a valid `accepted_quotation_id`.
- **Pessimistic Concurrency**: Acquired with `findByIdAndBuyerIdForUpdate(rfqId, buyerId)`.
- **Duplicate Prevention**: `purchaseOrderRepository.existsByRfqId(rfqId)` strictly ensures exactly one PO is issued per RFQ.
- **Commercial Snapshotting**: Deeply snapshots the following fields directly into `purchase_orders`:
  - `masterProductCode`, `productName`, `casNumber`, `chemicalCategory`
  - `purity`, `grade`, `packaging`
  - `quantity`, `unit`, `unitPrice`, `totalAmount`, `currency`
  - `agreedLeadTimeDays`, `paymentTerms`, `deliveryTerms`, `incoterms`
  - `shippingAddress`, `billingContact`, `notes`
  - *Guarantee*: Subsequent updates to supplier offerings or master catalog items do NOT modify historical PO records.
- **State**: `PLACED`.
- **Audit Action**: `PO_ISSUED`.
- **Notification**: `PurchaseOrderIssuedEvent`.

### Stage 4: Order Confirmation & Manufacturing Processing
- **Actors**: Authenticated Supplier.
- **Workflow**:
  - Supplier confirms PO $\rightarrow$ status transitions from `PLACED` $\rightarrow$ `CONFIRMED`. Sets `confirmed_at` and `confirmed_by`.
  - Supplier begins processing/batch synthesis $\rightarrow$ status transitions from `CONFIRMED` $\rightarrow$ `PROCESSING`. Sets `processing_at`.
  - Alternatively, supplier can reject with reason $\rightarrow$ status transitions to `REJECTED`. Sets `rejected_at`, `rejected_by`, `rejection_reason`.
- **Audit Actions**: `PO_CONFIRMED`, `PO_PROCESSING_STARTED`, `PO_REJECTED`.
- **Notifications**: `PurchaseOrderConfirmedEvent`, `OrderProcessingStartedEvent`, `PurchaseOrderRejectedEvent`.

### Stage 5: Shipment Dispatch & Physical Delivery
- **Actors**: Authenticated Supplier (dispatch & delivery) / Authenticated Buyer (receipt confirmation).
- **Workflow**:
  1. Supplier dispatches shipment with carrier name, tracking number, and estimated delivery date $\rightarrow$ Order transitions from `PROCESSING` $\rightarrow$ `SHIPPED`. A `Shipment` entity is created linked 1-to-1 to the PO.
  2. Physical delivery:
     - Supplier marks delivered via `/deliver` $\rightarrow$ transitions from `SHIPPED` $\rightarrow$ `DELIVERED`. Sets `delivered_at`.
     - Buyer confirms physical receipt via `/receive` $\rightarrow$ transitions from `SHIPPED` $\rightarrow$ `DELIVERED`. Sets `delivered_at`.
  3. Order completion: Either party completes the delivered order via `/complete` $\rightarrow$ transitions to `COMPLETED`. Sets `completed_at`.
- **Audit Actions**: `PO_SHIPPED`, `ORDER_RECEIPT_CONFIRMED`, `PO_DELIVERED`, `PO_COMPLETED`.
- **Notifications**: `OrderShippedEvent`, `OrderReceiptConfirmedEvent`, `OrderDeliveredEvent`, `OrderCompletedEvent`.

---

## 3. Security & Authorization Matrix

| Endpoint Route | Allowed Roles | Identity Resolution | IDOR Protection |
|---|---|---|---|
| `POST /api/v1/rfqs` | `BUYER`, `USER` | `Authentication.getName()` $\rightarrow$ `userRepository.findByEmail()` | User status must be `ACTIVE`; supplier offering verified |
| `GET /api/v1/rfqs/my` | `BUYER`, `USER` | `Authentication.getName()` | Scoped strictly to `buyerId` |
| `GET /api/v1/rfqs/{id}` | `BUYER`, `USER` | `Authentication.getName()` | `findByIdAndBuyerId` (404 if cross-buyer) |
| `GET /api/v1/rfqs/supplier/{id}` | `SUPPLIER` | `Authentication.getName()` $\rightarrow$ `supplierRepository.findByUser()` | `findByIdAndSupplierId` (404 if cross-supplier) |
| `POST /api/v1/rfqs/supplier/{id}/quotations` | `SUPPLIER` | `Authentication.getName()` $\rightarrow$ `supplierRepository.findByUser()` | Locked on `findByIdAndSupplierIdForUpdate` |
| `POST /api/v1/orders` | `BUYER`, `USER` | `Authentication.getName()` | Locked on `findByIdAndBuyerIdForUpdate` |
| `GET /api/v1/orders/{id}` | `BUYER`, `USER` | `Authentication.getName()` | `findByIdAndBuyerId` (404 if cross-buyer) |
| `GET /api/v1/orders/supplier/{id}` | `SUPPLIER` | `Authentication.getName()` $\rightarrow$ `supplierRepository.findByUser()` | `findByIdAndSupplierId` (404 if cross-supplier) |
| `POST /api/v1/orders/supplier/{id}/ship` | `SUPPLIER` | `Authentication.getName()` $\rightarrow$ `supplierRepository.findByUser()` | Order must belong to supplier and be in `PROCESSING` status |
| `POST /api/v1/orders/{id}/receive` | `BUYER`, `USER` | `Authentication.getName()` | Order must belong to buyer and be in `SHIPPED` status |
| `POST /api/v1/orders/{id}/complete` | `BUYER`, `SUPPLIER`, `USER` | `Authentication.getName()` | Order must belong to actor and be in `DELIVERED` status |

---

## 4. Platform Policy & Governance Controls

1. **`BUYER_RFQ_DAILY_LIMIT`**:
   - Default: `50` RFQs/day per buyer.
   - Configurable in the Admin Configuration Center (`/dashboard/admin/settings`).
   - Dynamically re-evaluated without redeployment.
2. **`MINIMUM_LEAD_TIME_DAYS`**:
   - Default: `1` day.
   - Validated on quote submission.
3. **`ALLOWED_CURRENCIES`**:
   - Default: `INR,USD,EUR`.
   - Validated on quote submission.
4. **`MARKETPLACE_RFQ_ENABLED` & `MARKETPLACE_ORDERS_ENABLED`**:
   - Real-time feature flags to suspend new commercial activities during maintenance or upgrades.
5. **Administrative Oversight**:
   - Platform admins can search, filter, inspect, and terminal-moderate RFQs and Orders via `/dashboard/admin/transactions/rfqs` and `/dashboard/admin/transactions/orders`.
