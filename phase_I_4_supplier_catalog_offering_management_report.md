# Synthora Phase I.4 — Supplier Catalog & Offering Management Report

**Phase**: Phase I.4 — Supplier Catalog & Offering Management (Master Catalog Supplier Workflow)  
**Date**: August 19, 2026  
**Auditor**: Senior Data Architect & System Engineer  
**Status**: COMPLETE  
**Backend Integration Suite**: ✅ **11 / 11 Tests Passed (`SupplierOfferingManagementTest`, `ProductRequestSecurityTest`)**  
**Frontend Production Build**: ✅ **24 / 24 Next.js Routes Compiled (Zero Errors)**  
**Knowledge Graph Update**: ✅ **Rebuilt 2347 nodes, 6492 edges, 215 communities**

---

## 1. Current Workflow vs New Workflow

### Legacy Workflow (Phase 2H)
- Supplier clicks `+ Add Product` -> Immediately fills standalone `Product` form with supplier-owned Name, CAS, Category, Price, and Stock.
- Result: Uncontrolled duplicate chemical records across suppliers.

### New Master Catalog Workflow (Phase I.4)
- Supplier clicks `+ Add Chemical` -> Directed to search-first Master Product interface.
- Supplier enters Chemical Name, CAS (`103-90-2`), or Master Product Code (`API-MP-100428`).
- **If MasterProduct exists**: Supplier selects MasterProduct and attaches a commercial `SupplierOffering` (Read-only Name, CAS, Formula, Category, Code; Supplier-controlled Price in INR default dropdown, Stock, Purity, Grade, MOQ, Packaging, Lead Time, Availability).
- **If MasterProduct does NOT exist**: Supplier clicks `Request New Chemical`, submitting a `ProductRequest` (`PENDING_REVIEW`) for Admin approval.

---

## 2. API Endpoints Created

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/master-products` | Public / Authenticated | Search & filter active Master Products |
| `GET` | `/api/v1/master-products/{idOrCode}` | Public / Authenticated | Lookup Master Product by UUID or Code |
| `GET` | `/api/v1/master-products/cas/{casNumber}` | Public / Authenticated | Lookup Master Products by CAS Registry Number |
| `POST` | `/api/v1/supplier/offerings` | `ROLE_SUPPLIER` | Attach commercial offering to MasterProduct |
| `GET` | `/api/v1/supplier/offerings` | `ROLE_SUPPLIER` | List authenticated supplier's commercial offerings |
| `GET` | `/api/v1/supplier/offerings/{id}` | `ROLE_SUPPLIER` | Get detailed offering by ID |
| `PUT` | `/api/v1/supplier/offerings/{id}` | `ROLE_SUPPLIER` | Update authenticated supplier's commercial offering |
| `DELETE` | `/api/v1/supplier/offerings/{id}` | `ROLE_SUPPLIER` | Deactivate authenticated supplier's commercial offering |
| `POST` | `/api/v1/product-requests` | `ROLE_SUPPLIER` | Submit proposal for uncatalogued chemical compound |
| `GET` | `/api/v1/supplier/product-requests` | `ROLE_SUPPLIER` | List authenticated supplier's submitted chemical requests |
| `GET` | `/api/v1/product-requests/{id}` | `ROLE_SUPPLIER` | Get detailed chemical request by ID |

---

## 3. Database Relationships & Schema Additions

### Migration `V21__create_product_requests_table.sql`
- Created table `product_requests` (`id`, `supplier_id`, `proposed_name`, `cas_number`, `molecular_formula`, `category`, `description`, `supplier_message`, `status`, `created_at`, `updated_at`).
- Foreign Key constraint `product_requests.supplier_id -> suppliers.id`.

### Canonical Entity Graph

```
                   MASTER PRODUCT (Canonical Identity)
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     OFFERING A      OFFERING B      OFFERING C
     Supplier A      Supplier B      Supplier C

                   PRODUCT REQUEST (Uncatalogued Proposals)
                          │
                          ▼
                 STATUS: PENDING_REVIEW
```

---

## 4. Security & Immutability Guarantees

1. **Zero-Client-Trust Identity**: Supplier identity is derived strictly from server-side JWT authentication.
2. **Duplicate Offering Prevention**: Enforced via database constraint `uk_supplier_master_product_offering UNIQUE (master_product_id, supplier_id)`. Duplicate creation returns HTTP 400 with a controlled error message.
3. **Cross-Supplier BOLA/IDOR Defense**: Supplier A cannot modify or deactivate Supplier B's commercial offering.
4. **Master Product Identity Immutability**: Supplier offering update payloads cannot alter `masterProductCode`, `name`, `casNumber`, `molecularFormula`, or `category`.
5. **Product Request Approval Isolation**: `ProductRequest` creation sets status to `PENDING_REVIEW` and does not insert directly into `master_products`.

---

## 5. Integration Security Test Results

- `SupplierOfferingManagementTest.java`: **✅ 6 / 6 PASSED**
- `ProductRequestSecurityTest.java`: **✅ 5 / 5 PASSED**
- **Total Integration Tests Passed**: **✅ 11 / 11 PASSED**

---

## 6. Frontend Production Build & UX Transformation

- Created `masterCatalogApi.ts`, `MasterProductSearchStep.tsx`, `SupplierOfferingForm.tsx`, `ProductRequestForm.tsx`.
- Updated `/dashboard/supplier/products/new/page.tsx` into a multi-step search & offering creation wizard.
- Updated `/dashboard/supplier/products/page.tsx` with `+ Add Chemical` button and tabulating Master Catalog Offerings alongside legacy listings.
- `npm run build`: **✅ 24 / 24 Next.js Routes Compiled (Zero Errors)**.

---

## 7. Manual Verification Results

| Step | Action | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| 1 | Click `+ Add Chemical` | Navigates to search-first Master Catalog wizard | PASSED |
| 2 | Search by Name / CAS / Code | Displays matching Master Products | PASSED |
| 3 | Select Master Product | Displays read-only identity + commercial form | PASSED |
| 4 | Currency Dropdown | Defaults to INR; allows selecting USD, EUR, etc. | PASSED |
| 5 | Submit Offering | Offering saved to catalog | PASSED |
| 6 | Submit Duplicate Offering | Controlled error message + duplicate blocked | PASSED |
| 7 | Request Missing Chemical | Creates `ProductRequest` (`PENDING_REVIEW`) | PASSED |
| 8 | Legacy Marketplace Workflows | Existing Products, RFQs, POs 100% operational | PASSED |

---

## 8. Known Limitations & Phase I.5 Prerequisites

- **Admin Governance**: Admin review & approval interface for `ProductRequest` entries will be delivered in Phase I.6.
- **Phase I.5 Target**: Buyer Master Catalog Search, Category Discovery & Aggregate Supplier Offering Comparison.
