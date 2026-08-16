# Synthora Development Roadmap

## Milestone 1: RFQ & Quotation Lifecycle (Active)

- [x] **Phase 1: Buyer RFQ Creation & Listing**
  - REST endpoints for creating RFQs and viewing "My RFQs".
  - Frontend RFQ submission and dashboard views.

- [x] **Phase 2: Supplier RFQ Inbox & Detail**
  - Supplier-filtered RFQ inbox and detail viewing.
  - Server-side supplier profile verification.

- [x] **Phase 3: Supplier Quotation Submission**
  - Multi-version quotation submissions (`quotations` table, `V10` migration).
  - Pessimistic locking for version increments and status transition to `QUOTED`.

- [x] **Phase 4: Buyer Quotation Retrieval & Revision Comparison**
  - Buyer quotation endpoint (`GET /api/v1/rfqs/{rfqId}/quotations`).
  - Frontend quotation revision history and terms comparison.

- [ ] **Phase 5: Buyer Quotation Decision Workflow (Next)**
  - Accept and reject quotation actions bound to specific quotation versions.
  - RFQ status transitions (`ACCEPTED`, `REJECTED`).
  - Frontend confirmation modals and decision controls.
