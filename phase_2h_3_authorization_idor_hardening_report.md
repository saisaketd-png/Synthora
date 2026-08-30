# KemKendra Phase 2H.3 — Authorization, Ownership & IDOR/BOLA Hardening Report

**Execution Date:** 2026-08-18  
**Scope:** Server-Side Authorization, Tenant Isolation, RBAC Enforcement, IDOR/BOLA Mitigation, Principal Derivation, State Machine Security  
**Status:** COMPLETED & VERIFIED (Zero Regressions)

---

## 1. Executive Summary

Phase 2H.3 successfully audited, validated, and hardened KemKendra's server-side authorization architecture, object-level access controls (BOLA/IDOR mitigations), cross-tenant data isolation, and state machine transition guards. 

Following the strict **Zero Client Trust** security posture:
- **Server-Side Enforcement**: All authorization and tenancy constraints are enforced at the service and persistence layers. Client-side state, hidden UI elements, and route guards are treated purely as UX helpers.
- **Principal Derivation**: Resource ownership (Buyer ID, Supplier ID, User ID) is strictly derived from the verified JWT `SecurityContext` in database queries—never accepted from request bodies or unverified query parameters.
- **Resource Concealment**: Unauthorized access attempts on tenant-owned resources return standard `HTTP 404 (Not Found)` rather than revealing entity existence via `403 (Forbidden)`.
- **RBAC Strictness**: Admin endpoints across `/api/v1/admin/**` and administrative user operations require verified `ADMIN` role authority, returning `403 (Forbidden)` for non-admin principals.

All **337 backend automated unit and integration tests** passed with **0 failures and 0 errors**. The frontend Next.js production build completed cleanly with **0 TypeScript and 0 bundling errors**.

---

## 2. Role-Based Access Control (RBAC) Architecture

All administrative and operational endpoints enforce strict role verification:

| Endpoint Path | Required Authority | Unauthenticated Status | Non-Admin / Wrong Role Status | Verification Source |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/admin/**` | `ROLE_ADMIN` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasRole('ADMIN')")` |
| `/api/v1/users/{id}` | `ROLE_ADMIN` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasRole('ADMIN')")` |
| `/api/v1/users` | `ROLE_ADMIN` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasRole('ADMIN')")` |
| `/api/v1/products` (POST) | `ROLE_SUPPLIER`, `ROLE_ADMIN` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasAnyRole('SUPPLIER', 'ADMIN')")` |
| `/api/v1/products/{id}` (PUT/DELETE) | `ROLE_SUPPLIER`, `ROLE_ADMIN` (Owner/Admin only) | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | Service-layer `isOwner || isAdmin` check |
| `/api/v1/products/{id}/supplier-offering` | `ROLE_SUPPLIER` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasRole('SUPPLIER')")` |
| `/api/v1/sellers/me` | `ROLE_SUPPLIER`, `ROLE_ADMIN` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasAnyRole('SUPPLIER','ADMIN')")` |
| `/api/v1/orders/supplier/**` | `ROLE_SUPPLIER` | `HTTP 401 Unauthorized` | `HTTP 403 Forbidden` | `@PreAuthorize("hasRole('SUPPLIER')")` |

---

## 3. Object-Level Ownership & IDOR/BOLA Protection

### 3.1 Buyer Resource Isolation (RFQ & Purchase Orders)
- **RFQ Access**: Queries use `rfqRepository.findByIdAndBuyerId(rfqId, buyer.getId())`. If a Buyer attempts to view an RFQ belonging to another buyer, a `ResourceNotFoundException` (`HTTP 404`) is thrown, concealing existence.
- **RFQ Quotations**: Nested quotation access (`/api/v1/rfqs/{id}/quotations`) verifies parent RFQ ownership first (`findByIdAndBuyerId`), preventing horizontal tenant data leakage.
- **Quotation Decision**: Accepting/rejecting a quote (`/api/v1/rfqs/{id}/quotations/{qId}/accept`) verifies buyer ownership with pessimistic row locks (`findByIdAndBuyerIdForUpdate`), preventing cross-buyer quotation tampering.
- **Purchase Orders**: Order detail retrieval (`/api/v1/orders/{id}`) queries `purchaseOrderRepository.findByIdAndBuyerId(orderId, buyer.getId())`. Unauthorized buyers receive `HTTP 404`.

### 3.2 Supplier Resource Isolation (Products, Offerings, RFQ Responses & Fulfillment)
- **Product Catalog Management**: Products created by a supplier link `product.seller` to the authenticated user. Modifications and deletions verify that `product.getSeller().getId().equals(currentUser.getId())` (or `ROLE_ADMIN`). Non-owners receive `HTTP 403 Forbidden`.
- **ProductSupplier Offerings**: Supplier product offerings (`ProductSupplier`) are resolved via `SupplierIdentityResolver.resolveOperationalSupplier(user)`. Queries filter by `findByProductIdAndSupplierId(productId, supplier.getId())`. Non-existent or other-supplier offerings return `HTTP 404`.
- **Supplier RFQ Workflow**: Incoming RFQ review (`/api/v1/rfqs/supplier/{id}`) and Quotation submission (`/api/v1/rfqs/supplier/{id}/quotations`) use `rfqRepository.findByIdAndSupplierId(id, supplier.getId())`. Cross-supplier quotation submissions are blocked with `HTTP 404`.
- **Purchase Order Fulfillment**: Order confirmation, processing, shipping, and delivery transitions (`/api/v1/orders/supplier/{id}/*`) use `purchaseOrderRepository.findByIdAndSupplierId(orderId, supplier.getId())`.

---

## 4. Multi-Tenant Document & Notification Isolation

### 4.1 Document Access Control Matrix (`DocumentAuthorizationServiceImpl`)
Document access follows strict parent entity authorization checks:

| Document Owner Type | Read / Download Rule | Upload Rule | Delete Rule |
| :--- | :--- | :--- | :--- |
| **`PRODUCT`** | Product Owner (Seller) or Admin | Product Owner (Seller) or Admin | Original Uploader & Product Owner / Admin |
| **`RFQ`** | RFQ Buyer or Assigned Supplier or Admin | RFQ Buyer only | Original Uploader & RFQ Buyer / Admin |
| **`QUOTATION`** | RFQ Buyer or Assigned Supplier or Admin | Quoting Supplier only | Original Uploader & Quoting Supplier / Admin |
| **`PURCHASE_ORDER`** | PO Buyer or Assigned Supplier or Admin | PO Buyer or Assigned Supplier | Original Uploader & Authorized PO Actor / Admin |
| **`SHIPMENT`** | PO Buyer or Assigned Supplier or Admin | Assigned Supplier only | Original Uploader & Assigned Supplier / Admin |

### 4.2 Notification Ownership
- All notification queries (`/api/v1/notifications`, `/unread-count`) and mutations (`/{id}/read`, `/read-all`) strictly bind `user.getId()` resolved from the authenticated JWT principal.
- Attempting to mark another user's notification as read queries `notificationRepository.findByIdAndRecipientId(notificationId, recipientId)`, returning `HTTP 404` on ownership mismatch.

---

## 5. Mass Assignment & Forgery Mitigation

1. **Buyer & Supplier IDs Derived Server-Side**:
   - `CreateRfqRequest`: Contains only `productId`, `supplierId`, `quantity`, `unit`, `notes`. The `buyerId` is populated in `RfqService` from `buyer.getId()`.
   - `CreatePurchaseOrderRequest`: Contains only `rfqId`, `shippingAddress`, `billingContact`, `notes`. `buyerId`, `supplierId`, `productId`, `unitPrice`, `totalAmount`, and `currency` are derived directly from the server-side accepted RFQ and quotation snapshot.
   - `ProductSupplierRequest`: Contains only commercial terms (`purity`, `grade`, `moqKg`, `packaging`, `leadTimeDays`, `coaAvailable`, `msdsAvailable`). `supplierId` is resolved via `SupplierIdentityResolver`.
2. **Registration & Role Protection**:
   - `RegisterRequest` accepts only `email`, `password`, `name`, `phone`. It does not accept `role` or `status`. All self-registrations default strictly to `UserRole.USER` and `UserStatus.ACTIVE`.

---

## 6. State Machine Transition Integrity

1. **Purchase Order Issuance Guard**:
   - RFQ must be in `ACCEPTED` status (`rfq.getStatus() == RfqStatus.ACCEPTED`).
   - RFQ must have an accepted quotation snapshot (`rfq.getAcceptedQuotationId() != null`).
   - Duplicate PO creation is rejected via `purchaseOrderRepository.existsByRfqId(rfq.getId())` (`HTTP 409 Conflict`).
2. **Quotation Submission Guard**:
   - Suppliers cannot submit a quote to an already `ACCEPTED` or `CANCELLED` RFQ (`HTTP 409 Conflict`).
3. **Order Lifecycle Transitions**:
   - `CONFIRMED` requires prior status `PLACED`.
   - `PROCESSING` requires prior status `CONFIRMED`.
   - `SHIPPED` requires prior status `PROCESSING` and valid carrier/tracking number.
   - `DELIVERED` requires prior status `SHIPPED` and an existing shipment record.
   - Any invalid transition attempt throws an `IllegalStateException` mapped to `HTTP 409 Conflict`.

---

## 7. Automated Test Suite Matrix (`AuthorizationIdorSecurityTest`)

A dedicated security test suite ([`AuthorizationIdorSecurityTest.java`](file:///d:/Saisaket/KemKendra/backend/src/test/java/com/kemkendra/security/AuthorizationIdorSecurityTest.java)) was authored and executed:

| Test # | Test Name / Scenario | Actor | Expected Result | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `USER cannot access ADMIN endpoint` | Buyer (`USER`) | `HTTP 403 Forbidden` | **PASSED** |
| 2 | `SUPPLIER cannot access ADMIN endpoint` | Supplier (`SUPPLIER`) | `HTTP 403 Forbidden` | **PASSED** |
| 3 | `USER cannot retrieve another user's profile via admin ID endpoint` | Buyer (`USER`) | `HTTP 403 Forbidden` | **PASSED** |
| 4 | `USER cannot change role or status via admin endpoints` | Buyer (`USER`) | `HTTP 403 Forbidden` | **PASSED** |
| 5 | `Buyer A cannot access Buyer B RFQ` | Buyer A | `HTTP 404 Not Found` | **PASSED** |
| 6 | `Buyer A cannot access Buyer B Purchase Order` | Buyer A | `HTTP 404 Not Found` | **PASSED** |
| 7 | `Buyer A cannot access Buyer B private document` | Buyer A | `HTTP 403 Forbidden` | **PASSED** |
| 8 | `Buyer A cannot access or mark Buyer B notification as read` | Buyer A | `HTTP 404 Not Found` | **PASSED** |
| 9 | `Supplier A cannot update Supplier B product` | Supplier A | `HTTP 403 Forbidden` | **PASSED** |
| 10 | `Supplier A cannot delete Supplier B product` | Supplier A | `HTTP 403 Forbidden` | **PASSED** |
| 11 | `Supplier A cannot access or overwrite Supplier B offering` | Supplier A | `HTTP 404 Not Found` | **PASSED** |
| 12 | `Supplier A cannot access Supplier B RFQ` | Supplier A | `HTTP 404 Not Found` | **PASSED** |
| 13 | `Supplier A cannot submit quotation to Supplier B RFQ` | Supplier A | `HTTP 404 Not Found` | **PASSED** |
| 14 | `Supplier A cannot access Supplier B Purchase Order` | Supplier A | `HTTP 404 Not Found` | **PASSED** |
| 15 | `Supplier A cannot confirm or process Supplier B Purchase Order` | Supplier A | `HTTP 404 Not Found` | **PASSED** |
| 16 | `Supplier A cannot download Supplier B private quotation document` | Supplier A | `HTTP 403 Forbidden` | **PASSED** |
| 17 | `Buyer B cannot access quotations belonging to Buyer A's RFQ` | Buyer B | `HTTP 404 Not Found` | **PASSED** |
| 18 | `Buyer B cannot accept quotation belonging to Buyer A's RFQ` | Buyer B | `HTTP 404 Not Found` | **PASSED** |
| 19 | `Buyer cannot forge buyer identity in RFQ creation` | Buyer A | Principal Bound to JWT (`buyerId`) | **PASSED** |
| 20 | `Supplier cannot forge supplier identity in offering creation` | Supplier A | Principal Bound to JWT (`supplierId`) | **PASSED** |
| 21 | `Supplier cannot quote on already ACCEPTED RFQ` | Supplier A | `HTTP 409 Conflict` | **PASSED** |
| 22 | `Buyer cannot create PO on non-ACCEPTED RFQ` | Buyer A | `HTTP 409 Conflict` | **PASSED** |
| 23 | `Public catalog remains accessible without authentication` | Anonymous | `HTTP 200 OK` | **PASSED** |
| 24 | `Anonymous user cannot access protected RFQ endpoints` | Anonymous | `HTTP 401 Unauthorized` | **PASSED** |
| 25 | `Anonymous user cannot access protected Purchase Order endpoints` | Anonymous | `HTTP 401 Unauthorized` | **PASSED** |
| 26 | `Anonymous user cannot access protected Notification endpoints` | Anonymous | `HTTP 401 Unauthorized` | **PASSED** |
| 27 | `Buyer cannot perform supplier shipment confirmation` | Buyer A | `HTTP 403 Forbidden` | **PASSED** |
| 28 | `Supplier cannot ship an already DELIVERED order` | Supplier A | `HTTP 409 Conflict` | **PASSED** |

---

## 8. Verification & Regression Analysis

```
========================================================================
KemKendra Build & Verification Pipeline
========================================================================
[Backend Test Suite] : 337 Tests Run, 0 Failures, 0 Errors, 0 Skipped
[Backend Status]     : BUILD SUCCESS (Total time: 45.794 s)
[Frontend Next.js]   : Compiled successfully in 774ms (TypeScript: 1462ms)
[Frontend Status]    : 20/20 Routes Built Successfully, 0 Type Errors
========================================================================
```

---

## 9. Sign-off & Transition Gate

Phase 2H.3 has achieved **100% compliance** with all authorization, ownership, IDOR/BOLA, and tenancy isolation requirements.

### Hard Stop Declaration
Phase 2H.3 is complete. Awaiting explicit user instruction and approval before proceeding to **Phase 2H.4 (Input Validation, Sanitization & Injection Defense)**.
