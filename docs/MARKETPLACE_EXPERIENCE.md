# KemKendra Marketplace Experience & Commercial Lifecycle

## 1. Overview & Architecture

KemKendra provides an end-to-end governed chemical trading workflow connecting Enterprise Chemical Buyers with Verified Manufacturers and Suppliers.

The complete commercial lifecycle is governed by strict server-side state machines, immutable audit trails, turn-based negotiation indicators, dynamic policy enforcement, and counterparty notifications.

```
[RFQ INQUIRY] ──► [QUOTATION PROPOSAL] ──► [COUNTER-OFFER / REVISION] ──► [QUOTATION ACCEPTANCE]
      │                     │                            │                         │
      ▼                     ▼                            ▼                         ▼
[BUYER / SUPPLIER]   [SUPPLIER OFFER]             [TURN-BASED UX]            [PO GENERATION]
                                                                                   │
                                                                                   ▼
[ORDER COMPLETION] ◄── [RECEIPT CONFIRMED] ◄── [CONSIGNMENT DISPATCH] ◄── [PO CONFIRMATION]
```

---

## 2. Commercial Lifecycle Milestones

### Milestone 1: Sourcing Inquiry (RFQ)
- **Buyer**: Creates direct inquiry from master chemical catalog (`/rfq` or modal) with required volume, grade, delivery location, and technical notes.
- **Policies**: Enforces `BUYER_RFQ_DAILY_LIMIT` and `MAINTENANCE_MODE_ENABLED`. If the daily quota is reached, a contextual banner explains quota reset timing and support options.

### Milestone 2: Quotation & Pricing Proposal
- **Supplier**: Receives inquiry in Supplier Console (`/dashboard/supplier/rfqs/[id]`).
- **Turn UX**: Displays `Action Required: Initial Proposal Pending`.
- **Submission**: Supplier submits formal proposal $v_1$ with unit pricing, minimum order quantity (MOQ), and dispatch lead time.

### Milestone 3: Negotiation & Counter-Offers
- **Turn Ownership**:
  - Buyer sees: `Your Turn to Respond (Quotation Proposed)` with delta pricing analysis vs initial expectations.
  - Supplier sees: `Awaiting Buyer Decision (Proposal Under Review)`.
- **Counter-Offer**: If buyer proposes modified pricing/terms, the state transitions to `COUNTERED`.
  - Supplier sees: `Action Required: Buyer Counter-Offer Received (Your Turn to Respond)`.
  - Supplier can Accept, Decline, or Submit Revised Quotation $v_2$.

### Milestone 4: Quotation Acceptance & Finalization
- Either party locks commercial terms by accepting the latest proposal.
- Both parties see `Quotation Accepted & Finalized (Ready for Purchase Order)`.

### Milestone 5: Purchase Order (PO) Issuance
- **Buyer**: Enters shipping warehouse address and billing/procurement contact.
- Generates immutable purchase order record linked to the agreed quotation.

### Milestone 6: PO Confirmation
- **Supplier**: Reviews PO details and confirms batch capacity via `POST /api/v1/orders/supplier/{id}/confirm`.
- Moves status to `CONFIRMED`.

### Milestone 7: Batch Manufacturing & Processing
- **Supplier**: Triggers batch synthesis and quality analysis via `POST /api/v1/orders/supplier/{id}/process`.
- Moves status to `PROCESSING`.

### Milestone 8: Consignment Dispatch (Shipment)
- **Supplier**: Inputs freight carrier and tracking number via `POST /api/v1/orders/supplier/{id}/ship`.
- Moves status to `SHIPPED` and generates shipment record.

### Milestone 9: Physical Delivery & Consignment Receipt
- **Supplier**: Can mark consignment delivered via `POST /api/v1/orders/supplier/{id}/deliver`.
- **Buyer**: Can confirm physical consignment arrival at destination warehouse via `POST /api/v1/orders/{id}/receive`.
- Status transitions to `DELIVERED`.

### Milestone 10: Final Order Completion & Archival Settlement
- Either Buyer or Supplier clicks `Complete Order` on the order workspace.
- **Confirmation Modal**: Explains commercial closure, lock of settlement ledger, and permanent archiving in platform audit vault.
- **Backend Execution**: `POST /api/v1/orders/{id}/complete` updates status to `COMPLETED`, records `PO_COMPLETED` in audit logs, and dispatches `PURCHASE_ORDER_COMPLETED` notification and email to the counterparty.

---

## 3. Unified Transaction Timeline

The `<TransactionTimeline />` component presents all 10 milestones with real-time status indicators (`COMPLETED`, `CURRENT`, `PENDING`, `CANCELLED`), timestamps, actor labels (`Buyer`, `Supplier`, `Logistics`, `Platform`), and mobile-responsive layouts.
