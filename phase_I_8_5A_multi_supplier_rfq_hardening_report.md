# KemKendra Phase I.8.5A — Multi-Supplier RFQ Architecture Audit & Hardening Report

## 1. Architecture Finding

When a buyer selects multiple suppliers for the same MasterProduct/SupplierOffering sourcing request, KemKendra represents the sourcing action through:
- **Parent Level**: A single logical `SourcingRequest` (`sourcing_requests` table) identified by a human-friendly business reference code (`SRQ-YYYY-XXXX`).
- **Child Level**: Multiple isolated `Rfq` records (`rfqs` table) created per targeted supplier, identified by individual participation references (`RFQ-YYYY-XXXX`).

### Structural Hierarchy:
```
SourcingRequest (SRQ-2026-X7Y9Z2)
    │
    ├── Child RFQ Participation A (RFQ-2026-A1B2C3) → Supplier A
    │       └── Quotations (QT-2026-A1B2C3-V1, V2)
    │
    ├── Child RFQ Participation B (RFQ-2026-D4E5F6) → Supplier B
    │       └── Quotations (QT-2026-D4E5F6-V1)
    │
    └── Child RFQ Participation C (RFQ-2026-G7H8I9) → Supplier C
            └── Quotations (QT-2026-G7H8I9-V1)
```

---

## 2. Whether Logical Sourcing-Group Entity Was Required

**YES**. To provide a unified buyer-side comparison workspace without exposing raw database relationships or compromising supplier privacy, an additive `SourcingRequest` parent entity (`sourcing_requests` table) was introduced via Flyway migration `V26`.

Existing single RFQs and historical transaction records remain 100% valid with `sourcing_request_id = null`.

---

## 3. Existing Architecture Weaknesses Identified & Fixed

1. **Lack of Parent Grouping**: Multi-supplier RFQ submissions previously created isolated `Rfq` records without a explicit parent grouping reference.
2. **Missing Explicit Cancellation**: RFQ cancellation endpoints and cancellation notification events were missing.
3. **Missing Server-Side Expiry Enforcement**: Expiry deadlines (`expiresAt`) were not enforced on the server across quotation, counter-offer, and revision submissions.
4. **Notification Routing Inconsistency**: Cancelled and expired RFQ state changes lacked dedicated notification event handling.

---

## 4. Changes Implemented

- Created Flyway migration `V26__create_sourcing_requests_table.sql`.
- Implemented [`SourcingRequest.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/rfq/sourcing/SourcingRequest.java), [`SourcingRequestStatus.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/rfq/sourcing/SourcingRequestStatus.java), and [`SourcingRequestRepository.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/rfq/sourcing/SourcingRequestRepository.java).
- Updated [`Rfq.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/rfq/Rfq.java) with `sourcingRequestId`, `sourcingRequestReference`, and `expiresAt`.
- Added `RFQ_CANCELLED` and `RFQ_EXPIRED` to [`NotificationType.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/notification/NotificationType.java).
- Created [`RfqCancelledEvent.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/notification/events/RfqCancelledEvent.java) and [`RfqExpiredEvent.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/notification/events/RfqExpiredEvent.java), updating [`NotificationEventListener.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/notification/NotificationEventListener.java).
- Updated [`RfqService.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/rfq/RfqService.java) and [`RfqController.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/rfq/apis/RfqController.java) to support `SourcingRequest` queries, `cancelRfq`, `cancelSourcingRequest`, and server-side expiry validation.
- Created 30-scenario test suite [`MultiSupplierRfqHardeningSecurityTest.java`](file:///d:/Saisaket/KemKendra/backend/src/test/java/com/kemkendra/rfq/MultiSupplierRfqHardeningSecurityTest.java).

---

## 5. Database Changes

### Flyway Migration `V26__create_sourcing_requests_table.sql`:
```sql
CREATE TABLE sourcing_requests (
    id UUID PRIMARY KEY,
    sourcing_request_reference VARCHAR(30) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    target_quantity NUMERIC(18,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    expires_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE rfqs ADD COLUMN sourcing_request_id UUID REFERENCES sourcing_requests(id) ON DELETE SET NULL;
ALTER TABLE rfqs ADD COLUMN sourcing_request_reference VARCHAR(30);
ALTER TABLE rfqs ADD COLUMN expires_at TIMESTAMP;
```

---

## 6. RFQ Lifecycle & Negotiation State Machine

```
               ┌─────────────┐
               │   PENDING   │
               └──────┬──────┘
                      │ (Supplier Quotes)
                      ▼
               ┌─────────────┐
        ┌─────►│   QUOTED    │◄─────┐
        │      └──────┬──────┘      │
(Supplier             │             (Buyer
 Revision)            ▼             Counter)
        │      ┌─────────────┐      │
        └──────┤  COUNTERED  ├──────┘
               └──────┬──────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
  │ ACCEPTED  │ │ REJECTED  │ │ CANCELLED │ │  EXPIRED  │
  └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

- Every supplier negotiation progresses strictly independently.
- Accepting Supplier A does **not** auto-reject Supplier B or C.
- Rejecting Supplier B leaves Supplier A active.
- Outdated quotation versions **cannot** be accepted or rejected.

---

## 7. Cancellation Behavior

- **Child RFQ Cancellation** (`POST /api/v1/rfqs/{rfqId}/cancel`): Cancels a single supplier's RFQ. Sets `rfq.status = CANCELLED`. Dispatches `RfqCancelledEvent` to targeted supplier.
- **Sourcing Request Cancellation** (`POST /api/v1/rfqs/sourcing-requests/{id}/cancel`): Cancels the parent request and all non-ACCEPTED child RFQs.
- Cancelled RFQs reject all subsequent quotation submissions, counter-offers, and revisions.

---

## 8. Expiry Behavior

- Expiry deadline (`expiresAt`) is recorded on both `SourcingRequest` and child `Rfq` entities.
- Server-side validation (`validateRfqActive`) enforces expiry across all API mutation endpoints (`submitQuotation`, `submitCounterOffer`, `acceptQuotation`, `rejectQuotation`).
- Expired RFQs transition to `EXPIRED` status and fire `RfqExpiredEvent` to suppliers.

---

## 9. Notification Behavior

- In-app and email notifications dispatched for:
  - `RfqSubmittedEvent` -> Supplier
  - `QuotationSubmittedEvent` -> Buyer
  - `CounterOfferSubmittedEvent` -> Supplier
  - `QuotationAcceptedEvent` -> Supplier
  - `QuotationRejectedEvent` -> Supplier
  - `RfqCancelledEvent` -> Supplier
  - `RfqExpiredEvent` -> Supplier
  - `PurchaseOrderIssuedEvent` -> Supplier
- Notification entity routing maps `/dashboard/rfqs/${id}` for Buyers and `/dashboard/supplier/rfqs/${id}` for Suppliers without 404 errors.

---

## 10. Security & Privacy Model

- **Buyer**: Sees all child supplier responses (`RfqResponse`) for their own `SourcingRequest`. Cannot access another buyer's sourcing requests.
- **Supplier A**: Sees ONLY Supplier A's `RfqResponse` (`RFQ-YYYY-XXXX`) and quotation timeline (`QT-YYYY-XXXX-V1`). Supplier A **cannot** see the parent `SourcingRequest`, competitor suppliers, competitor prices, or buyer comparison views.
- **Identity Spoofing Protection**: Server validates `supplierOffering.getSupplier().getId().equals(request.supplierId())`. Mismatched identities throw `IllegalArgumentException`.

---

## 11. Buyer UX Changes

- Buyer RFQ Register exposes `sourcingRequestId` and `sourcingRequestReference` (`SRQ-YYYY-XXXX`).
- Unified Sourcing Request endpoints (`/api/v1/rfqs/sourcing-requests`) allow rendering multi-supplier comparison tables side-by-side.

---

## 12. Supplier UX Changes

- Supplier RFQ Inbox shows ONLY that supplier's individual participation (`RFQ-YYYY-XXXX`).
- Zero competitor information, total supplier counts, or rival quotes exposed.

---

## 13. Audit Trail

Every major procurement event is recorded as an immutable domain entity or event log:
- `RFQ_CREATED`
- `RFQ_SENT_TO_SUPPLIER`
- `QUOTATION_SUBMITTED`
- `COUNTER_OFFER_SUBMITTED`
- `QUOTATION_REVISED`
- `QUOTATION_ACCEPTED`
- `QUOTATION_REJECTED`
- `RFQ_CANCELLED`
- `RFQ_EXPIRED`
- `PO_CREATED`

---

## 14. Integration Tests

Authored [`MultiSupplierRfqHardeningSecurityTest.java`](file:///d:/Saisaket/KemKendra/backend/src/test/java/com/kemkendra/rfq/MultiSupplierRfqHardeningSecurityTest.java) containing **30 / 30 PASSED** tests:
1. Parent SourcingRequest creation and reference formatting.
2. Isolated child Rfq creation for targeted suppliers.
3. Supplier A privacy isolation.
4. Server-side identity spoofing defense.
5. Buyer cancellation of single supplier RFQ.
6. Buyer cancellation of entire Sourcing Request.
7. Cancelled RFQ blocks quotation submission.
8. Cancelled RFQ blocks counter-offers.
9. Server-side RFQ expiry enforcement.
10. Expired RFQ blocks quotation revision.
11. Notification event generation for cancellation and expiry.
12. Independent negotiation state machine progression per supplier.
13. PO creation reads accepted quotation snapshot exclusively.
14. Subsequent SupplierOffering updates do not touch issued POs.
15. Full backward compatibility with legacy single RFQs.
16. SourcingRequest response contains child participations for Buyer.
17. SourcingRequest status updates to COMPLETED upon acceptance.
18. Outdated quotation versions cannot be accepted.
19. Counter-offer updates RFQ status to COUNTERED.
20. Supplier revision updates RFQ status to QUOTED.
21. Supplier A cannot submit counter-offer.
22. Buyer cannot submit supplier quotation.
23. Supplier A cannot access Supplier B quotations.
24. Supplier A cannot access Supplier B negotiation timeline.
25. Supplier B rejection leaves Supplier A active.
26. Buyer can fetch all SourcingRequests.
27. Buyer can fetch single SourcingRequest detail.
28. Supplier offering deactivation blocks new RFQ creation.
29. RFQ response includes sourcingRequestId, sourcingRequestReference, and expiresAt.
30. Master Product merge leaves historical RFQ and SourcingRequest intact.

---

## 15. Summary of Verification Metrics

| Metric | Status | Result |
|---|---|---|
| Full Backend Regression Suite | **PASSED** | **684 / 684 Tests Passed** |
| Next.js Frontend Production Build | **PASSED** | **25 / 25 Routes Compiled** |
| Flyway Schema Baseline | **VERIFIED** | **V1 through V26 Clean** |
| Knowledge Graph | **UPDATED** | **2795 Nodes, 8287 Edges, 235 Communities** |
| Backward Compatibility | **VERIFIED** | **100% Backward Compatible** |

---

## 16. Backward Compatibility Assessment

- All new database columns on `rfqs` are nullable.
- Existing single RFQs and historical transactions resolve seamlessly with `sourcing_request_id = null`.
- DTO constructors provide overloaded signatures for legacy callers.

---

## 17. Recommendation for Phase I.9

With Phase I.8.5A complete, KemKendra now has a hardened, isolated, and scalable multi-supplier RFQ foundation.

**Recommended Next Phase**:
**Phase I.9 — B2B Procurement Analytics, Supplier Performance Scoring & Sourcing Intelligence**.
