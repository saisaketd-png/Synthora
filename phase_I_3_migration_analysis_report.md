# KemKendra Phase I.3 — Master Catalog Backfill & Non-Destructive Data Migration Analysis Report

**Phase**: Phase I.3 — Master Catalog Backfill & Non-Destructive Data Migration Analysis  
**Date**: August 19, 2026  
**Auditor**: Senior Data Architect & System Engineer  
**Status**: COMPLETE (READ-ONLY MIGRATION ANALYSIS — ZERO DATABASE MUTATIONS EXECUTED)

---

## 1. Database Inventory

| Table Name | Entity Class | Current Record Role | Foreign Key References | Migration Action |
| :--- | :--- | :--- | :--- | :--- |
| `products` | `Product` | Legacy Supplier-Owned Products | `seller_id` -> `users(id)` | Retain intact; map to `master_products` + `supplier_offerings` |
| `suppliers` | `Supplier` | Verified Operational Suppliers | `user_id` -> `users(id)` | Target for `supplier_offerings.supplier_id` |
| `product_suppliers` | `ProductSupplier` | Legacy Auxiliary Join Table | `product_id`, `supplier_id` | Retain intact as legacy compatibility mapping |
| `master_products` | `MasterProduct` | Canonical Chemical Identity | None | Target destination for canonical chemical records |
| `supplier_offerings` | `SupplierOffering` | Commercial Offering | `master_product_id`, `supplier_id` | Target destination for supplier commercial offers |
| `product_images` | `ProductImage` | Product Sample Images | `product_id` -> `products(id)` | Retain intact; link to `Product` during Phase I.3 |
| `documents` | `Document` | COA/MSDS/TDS Compliance Files | `owner_type`, `owner_id` | Retain intact; link to `Product` during Phase I.3 |
| `rfqs` | `Rfq` | Buyer Sourcing RFQs | `product_id`, `supplier_id` | Retain immutable `product_id` references |
| `purchase_orders` | `PurchaseOrder` | Order Fulfillment Records | `product_id`, `rfq_id`, `quotation_id` | Retain immutable `product_id` references |

---

## 2. Product Inventory & Identity Classification

### Detailed Data Classification Matrix

| Legacy Product ID | Product Code | Name | CAS Number | Category | Supplier | Classification | Action Plan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `P-101` | `API-100428` | Paracetamol USP | `103-90-2` | `API` | Supplier A | `SAFE_AUTO_MIGRATE` | Maps to `MasterProduct` (CAS `103-90-2`) + `SupplierOffering` A |
| `P-102` | `API-883912` | Paracetamol EP | `103-90-2` | `API` | Supplier B | `SAFE_AUTO_MIGRATE` | Maps to SAME `MasterProduct` (CAS `103-90-2`) + `SupplierOffering` B |
| `P-103` | `API-593021` | Ibuprofen Tech | `15687-27-1` | `API` | Supplier A | `SAFE_CREATE_NEW_MASTER` | Creates new `MasterProduct` (CAS `15687-27-1`) + `SupplierOffering` A |
| `P-104` | `API-402910` | Metformin Conflict | `657-24-9` | `API` | Supplier B | `CONFLICTING_TECHNICAL_DATA` | Flagged for Admin review (Conflicting formula/purity specs) |
| `P-105` | `EXC-302911` | Custom Solubilizer | *None* | `EXCIPIENT` | Supplier A | `MISSING_CAS_REVIEW` | Flagged for Admin review (Missing CAS number) |

---

## 3. Matching Hierarchy & Identity Rules

1. **LEVEL 1 (Exact Normalized CAS + Compatible Category)**:
   - Matches products with identical CAS number and same `ProductCategory` enum.
   - Action: Merge under 1 `MasterProduct`; create N separate `SupplierOffering` rows.
2. **LEVEL 2 (Exact CAS with Compatible Technical Identity)**:
   - Matches products with identical CAS number across overlapping categories where chemical identity is verified.
3. **LEVEL 3 (Normalized Name + Compatible Technical Identity)**:
   - Matches products where CAS is missing or formatted differently, but normalized name matches existing canonical entry.
4. **LEVEL 4 (No Reliable Match / Technical Conflict)**:
   - Flagged as `POSSIBLE_DUPLICATE_REVIEW`, `CONFLICTING_TECHNICAL_DATA`, or `MISSING_CAS_REVIEW`.

---

## 4. Product Duplicate Scenario & Resolution

### Duplicate Scenario Case Study
- **Product A**: "Paracetamol USP Grade", CAS `103-90-2`, Formula `C8H9NO2`, Supplier A (`API-100428`).
- **Product B**: "Paracetamol EP Grade", CAS `103-90-2`, Formula `C8H9NO2`, Supplier B (`API-883912`).

### Target Master Catalog Representation
```
MasterProduct
  ├── id: UUID_MP_PARACETAMOL
  ├── masterProductCode: "API-MP-100428"
  ├── name: "Paracetamol"
  ├── casNumber: "103-90-2"
  ├── molecularFormula: "C8H9NO2"
  └── category: API
        │
        ├── SupplierOffering A (Supplier A, Price ₹120.00, Purity 99.80%, Grade USP)
        └── SupplierOffering B (Supplier B, Price ₹125.00, Purity 99.50%, Grade EP)
```

---

## 5. Master Product Canonical Data Selection

When multiple legacy products map to a single `MasterProduct`:
- **Name**: Shortest normalized chemical title (e.g. "Paracetamol" instead of "Paracetamol USP Grade 500mg").
- **CAS Number**: Normalized CAS format (`XXX-XX-X`).
- **Molecular Formula**: Validated chemical formula (`C8H9NO2`).
- **Category**: Primary `ProductCategory` enum.
- **Description**: Consolidated technical description.

---

## 6. Supplier Offering Field Mapping

| Legacy `Product` Field | Target `SupplierOffering` Field | Data Type | Validation & Transformation |
| :--- | :--- | :--- | :--- |
| `seller_id` (User) | `supplier_id` (Supplier) | `BIGINT` | Resolves operational `Supplier.id` from `seller_id` |
| `price` | `price` | `NUMERIC(18,2)` | Direct mapping |
| Default `INR` | `currency` | `VARCHAR(10)` | Validated against `SUPPORTED_CURRENCIES` (Default: `INR`) |
| `stock` | `stock` | `INTEGER` | Direct mapping |
| `purity` | `purity` | `NUMERIC(5,2)` | Direct mapping |
| `grade` | `grade` | `VARCHAR(100)` | Direct mapping |
| `moqKg` | `moqKg` | `NUMERIC(12,2)` | Direct mapping |
| `packaging` | `packaging` | `VARCHAR(150)` | Direct mapping |
| `leadTimeDays` | `leadTimeDays` | `INTEGER` | Direct mapping |
| `coaAvailable` | `coaAvailable` | `BOOLEAN` | Direct mapping |
| `msdsAvailable` | `msdsAvailable` | `BOOLEAN` | Direct mapping |
| `exportReady` | `exportReady` | `BOOLEAN` | Direct mapping |
| `availabilityStatus` | `availabilityStatus` | `VARCHAR(50)` | Direct mapping |

---

## 7. ProductSupplier Legacy Compatibility

- **Status**: `product_suppliers` table and `ProductSupplier` entity are **retained intact**.
- **Mapping Strategy**: Existing records in `product_suppliers` continue serving administrative query endpoints until Phase I.6.

---

## 8. Product Images & Compliance Documents Analysis

- **`product_images`**: Sample images remain associated with `Product` and `SupplierOffering`. Generic chemical structure diagrams may eventually migrate to `MasterProduct` in Phase I.7.
- **`documents`**:
  - `MSDS/SDS`: Universal safety documentation (candidate for `MasterProduct`).
  - `COA` & `TDS`: Batch-specific and supplier-specific documentation (candidate for `SupplierOffering`).
  - *No documents or images will be modified during Phase I.3.*

---

## 9. Historical Transaction Safety

- **RFQs & POs**: All existing RFQs (`rfqs.product_id`) and Purchase Orders (`purchase_orders.product_id`) reference immutable legacy `Product.id` UUIDs.
- **Migration Guarantee**: Legacy `products` records are **NEVER deleted or updated**. All transaction linkages remain 100% valid.

---

## 10. SEO Safety & URL Preservation

- Existing route `/products/{productCode}` (e.g. `/products/API-100428`) remains functional.
- Target Phase I.7 route `/products/{masterProductCode}` will provide canonical redirection without breaking existing legacy links.

---

## 11. Idempotency & Tracking Table Design

### Proposed Migration Tracking Table: `product_master_migrations`

```sql
CREATE TABLE product_master_migrations (
    id UUID PRIMARY KEY,
    legacy_product_id UUID NOT NULL UNIQUE REFERENCES products(id),
    master_product_id UUID REFERENCES master_products(id),
    supplier_offering_id UUID REFERENCES supplier_offerings(id),
    migration_status VARCHAR(50) NOT NULL, -- MIGRATED, FLAGGED, SKIPPED
    classification VARCHAR(50) NOT NULL, -- SAFE_AUTO_MIGRATE, CONFLICTING_TECHNICAL_DATA, etc.
    confidence_score NUMERIC(5,2) NOT NULL,
    notes TEXT,
    migrated_at TIMESTAMP NOT NULL
);
```

---

## 12. Rollback & Idempotency Guarantees

1. **Additive Only**: The migration writes to `master_products`, `supplier_offerings`, and `product_master_migrations`. No legacy rows are deleted.
2. **Rollback**: To revert, simply delete rows from `product_master_migrations`, `supplier_offerings`, and `master_products` created during the migration batch.

---

## 13. Metrics & Phase I.4 Readiness Summary

```text
TOTAL PRODUCTS EVALUATED:          5
SAFE AUTO MIGRATE:                 2
SAFE NEW MASTER:                   1
DUPLICATE REVIEW:                  0
TECHNICAL CONFLICT:                1
MISSING CAS:                       1
INVALID:                           0

TOTAL MASTER PRODUCTS EXPECTED:     2
TOTAL SUPPLIER OFFERINGS EXPECTED: 3

PRODUCTS REQUIRING MANUAL REVIEW:  2

TOP MIGRATION RISKS:
1. Conflicting technical attributes across identical CAS entries.
2. Products lacking international CAS numbers.

RECOMMENDED MIGRATION STRATEGY:
Non-destructive dual-write backfill with migration tracking table.

PHASE I.4 READY: YES
```
