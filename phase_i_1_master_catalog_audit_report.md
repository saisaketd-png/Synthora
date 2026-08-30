# KEMKENDRA — PHASE I.1: MASTER CATALOG & PRODUCT GOVERNANCE AUDIT REPORT

**Phase**: Phase I.1 — Master Catalog & Product Governance Architecture Audit  
**Date**: August 19, 2026  
**Auditor**: Senior Enterprise Architect  
**Status**: AUDIT COMPLETE (READ-ONLY — NO CODE OR DATABASE MODIFICATIONS PERFORMED)

---

## 1. Current Product Domain Audit

### Field & Constraint Specification

| Entity / Field Name | Database Column | Data Type | Nullable | Constraints & Defaults | Domain Ownership Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | `UUID` | No | Primary Key (`GenerationType.UUID`) | System Identifier |
| `name` | `name` | `VARCHAR(255)` | No | None | Canonical Chemical Identity |
| `productCode` | `product_code` | `VARCHAR(50)` | Yes | Unique Constraint (`uk_product_code`) | Product Logical Reference |
| `description` | `description` | `VARCHAR(2000)` | Yes | None | Mixed / Canonical Description |
| `price` | `price` | `NUMERIC(18,2)` | No | None | **Supplier Commercial** |
| `stock` | `stock` | `INTEGER` | No | None | **Supplier Commercial** |
| `category` | `category` | `VARCHAR(255)` | No | `ProductCategory` Enum | Canonical Category |
| `seller` | `seller_id` | `UUID` | No | Foreign Key to `users(id)` | **Supplier Ownership** |
| `casNumber` | `cas_number` | `VARCHAR(100)` | Yes | **No Unique Constraint** | Canonical Chemical Identity |
| `molecularFormula` | `molecular_formula` | `VARCHAR(100)` | Yes | None | Canonical Chemical Identity |
| `purity` | `purity` | `NUMERIC(5,2)` | Yes | None | Commercial / Spec Specification |
| `grade` | `grade` | `VARCHAR(100)` | Yes | None | Commercial / Spec Specification |
| `packaging` | `packaging` | `VARCHAR(150)` | Yes | None | **Supplier Commercial** |
| `moqKg` | `moq_kg` | `NUMERIC(12,2)` | Yes | None | **Supplier Commercial** |
| `leadTimeDays` | `lead_time_days` | `INTEGER` | Yes | None | **Supplier Commercial** |
| `coaAvailable` | `coa_available` | `BOOLEAN` | Yes | Default: `false` | Supplier Documentation |
| `msdsAvailable` | `msds_available` | `BOOLEAN` | Yes | Default: `false` | Supplier Documentation |
| `exportReady` | `export_ready` | `BOOLEAN` | Yes | Default: `false` | **Supplier Commercial** |
| `availabilityStatus` | `availability_status` | `VARCHAR(50)` | Yes | Allowed: `AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`, `DISCONTINUED` | Supplier Commercial / Moderation |
| `createdAt` | `created_at` | `TIMESTAMP` | No | `@CreationTimestamp` | Audit Timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP` | No | `@UpdateTimestamp` | Audit Timestamp |

### Key Entity Relationships
1. **Supplier Ownership**: Every `Product` instance is hard-coded to a single `User` (`seller_id`). There is no decoupling between the chemical definition and the supplier selling it.
2. **Product Code Generation**: `productCode` is generated server-side via `@PrePersist` or `ProductCodeGenerator` (e.g. `API-100428`). It is globally unique across all products.
3. **Images & Documents**:
   - `Product` has a 1:N relationship with `ProductImage` via `@OneToMany(mappedBy = "product")`.
   - Product documents are associated polymorphically in the `documents` table via `owner_type = 'PRODUCT'` and `owner_id = product.getId().toString()`.

---

## 2. Seller Offering Audit (`ProductSupplier` entity)

- **Entity Name**: `ProductSupplier` (Table: `product_suppliers`). *Note: Entity `SellerOffering` does NOT exist in the codebase.*
- **Entity Structure**:
  - `id`: `Long` (Auto-increment PK).
  - `product`: `@ManyToOne Product product` (`product_id`).
  - `supplier`: `@ManyToOne Supplier supplier` (`supplier_id`).
  - Spec/Commercial fields: `purity` (String), `grade` (String), `moqKg` (BigDecimal), `packaging` (String), `leadTimeDays` (Integer), `coaAvailable` (Boolean), `msdsAvailable` (Boolean), `createdAt` (LocalDateTime).
- **Actual Usage & Findings**:
  - `ProductSupplier` acts as a secondary join table managed by `ProductSupplierService` and `ProductSupplierController`.
  - **Transaction Isolation**: `ProductSupplier` is **NOT** referenced by RFQs, Quotations, Counter-Offers, or Purchase Orders. All transaction entities reference `Product.id` directly.
  - **Redundancy**: Commercial attributes (price, stock, MOQ, lead time, packaging) are stored directly on `Product`. `ProductSupplier` duplicates a subset of technical/commercial attributes without decoupling product creation from individual suppliers.

---

## 3. Relationship Map

```
User (Supplier)
  │
  ├── SellerProfile (1:1 Optional Profile Metadata)
  │
  ├── Supplier (1:1 Operational Entity)
  │
  └── Product (1:N via seller_id)
        │
        ├── ProductImage (1:N via product_id)
        ├── Document (Polymorphic: owner_type='PRODUCT', owner_id=product.id)
        ├── ProductSupplier (1:N via product_id - Secondary Join Table)
        │
        └── RFQ (1:N via product_id)
              │
              ├── Quotation (1:N via rfq_id - Version History V1, V2, V3)
              │
              └── PurchaseOrder (1:1 via rfq_id & quotation_id; references product_id)
```

### Foreign Key Inventory
- `products.seller_id` → `users.id` (FK)
- `product_images.product_id` → `products.id` (FK)
- `product_suppliers.product_id` → `products.id` (FK)
- `product_suppliers.supplier_id` → `suppliers.id` (FK)
- `rfqs.product_id` → `products.id` (Logical UUID reference)
- `rfqs.buyer_id` → `users.id` (Logical UUID reference)
- `rfqs.supplier_id` → `suppliers.id` (Logical Long reference)
- `quotations.rfq_id` → `rfqs.id` (FK)
- `purchase_orders.product_id` → `products.id` (Logical UUID reference)
- `purchase_orders.rfq_id` → `rfqs.id` (Unique FK/Logical reference)
- `purchase_orders.quotation_id` → `quotations.id` (Logical reference)

---

## 4. Frontend Product Creation Audit

1. **Route & Form**: Supplier navigates to `/dashboard/supplier/products/new`, rendering `ProductForm`.
2. **Submission Payload**: Submits `POST /api/v1/products` with `CreateProductRequest` containing name, description, price, stock, category, CAS number, molecular formula, purity, grade, MOQ, packaging, lead time, COA/MSDS flags, export readiness, and availability status.
3. **Backend Execution Flow (`ProductService.createProduct`)**:
   - Resolves authenticated user (`seller`) via JWT principal.
   - Instantiates a new `Product` entity.
   - Generates unique `productCode` via `ProductCodeGenerator` (e.g. `API-100428`).
   - Maps all chemical identity AND commercial pricing/inventory fields directly to the single `Product` record.
   - Persists `Product` to `products` table in a single database transaction.
4. **Post-Creation Media**: Media files (images, COA, MSDS) are uploaded in subsequent HTTP requests via `POST /api/v1/products/{id}/images` and `POST /api/v1/documents`.

---

## 5. Current Duplicate Product Risk Analysis

> [!WARNING]
> **HIGH RISK OF CATALOG DUPLICATION**:
> Under the current architecture, two separate suppliers can create duplicate chemical records:
> - **Supplier A**: Creates "Paracetamol", CAS `103-90-2` -> Saved as `Product` UUID `A1` with `productCode = API-100428`.
> - **Supplier B**: Creates "Paracetamol", CAS `103-90-2` -> Saved as `Product` UUID `B2` with `productCode = API-883912`.
>
> **Code Baseline Cause**:
> 1. `products` table has **NO unique constraint** on `cas_number`, `name`, or `(cas_number, name)`.
> 2. `Product.seller_id` forces every product to be owned by a single supplier upon creation.
> 3. The search catalog displays duplicate chemical cards for every supplier that adds the compound.

---

## 6. Product → Offering Architecture Gap

| Field Name | Current Location | Recommended Target Location | Architectural Rationale |
| :--- | :--- | :--- | :--- |
| `id` (UUID) | `Product` | `MasterProduct` | Immutable canonical identity primary key |
| `name` | `Product` | `MasterProduct` | Canonical chemical name (e.g. Paracetamol) |
| `casNumber` | `Product` | `MasterProduct` | International CAS Registry identifier |
| `molecularFormula` | `Product` | `MasterProduct` | Standardized chemical formula (e.g. C8H9NO2) |
| `category` | `Product` | `MasterProduct` | Industry categorization (API, Excipient, Intermediate) |
| `description` | `Product` | `MasterProduct` | Canonical technical chemical description |
| `price` | `Product` | `SupplierOffering` | Supplier-specific unit price |
| `stock` | `Product` | `SupplierOffering` | Supplier-specific inventory stock count |
| `purity` | `Product` | `SupplierOffering` | Supplier-specific batch purity specification (e.g. 99.8%) |
| `grade` | `Product` | `SupplierOffering` | Supplier-specific grade (USP, EP, IP, Tech Grade) |
| `moqKg` | `Product` | `SupplierOffering` | Supplier-specific Minimum Order Quantity |
| `packaging` | `Product` | `SupplierOffering` | Supplier packaging options (Drum, HDPE, Bag) |
| `leadTimeDays` | `Product` | `SupplierOffering` | Supplier dispatch lead time |
| `coaAvailable` | `Product` | `SupplierOffering` | Supplier-specific COA availability |
| `msdsAvailable` | `Product` | `MasterProduct` & `SupplierOffering` | Universal MSDS on Master Product; batch COA on Offering |
| `exportReady` | `Product` | `SupplierOffering` | Supplier export readiness flag |
| `availabilityStatus` | `Product` | `SupplierOffering` | Offering-level status (`AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`) |
| `seller_id` | `Product` | `SupplierOffering` | **Crucial Decoupling**: Move supplier link to Offering |

---

## 7. Existing Transaction Dependencies

The following core transaction entities store `product_id` (UUID) referencing `products.id`:
- **`rfqs`**: Stores `product_id` (UUID) and `supplier_id` (Long).
- **`purchase_orders`**: Stores `product_id` (UUID), `product_name` (String), `rfq_id` (UUID), `quotation_id` (UUID).
- **`documents`**: Stores `owner_id = product.getId().toString()`.
- **`product_images`**: Stores `product_id` (UUID).
- **`notifications`**: Stores `entity_id` pointing to `rfq_id` or `order_id`.
- **`audit_logs`**: Stores `target_id = product.getId().toString()`.

> [!IMPORTANT]
> If `Product` table were dropped or destructively renamed, all historical RFQs, Quotations, POs, Audit Logs, and Document associations would break.

---

## 8. Migration Analysis & Strategies

### Strategy A: Destructive Schema Refactoring (NOT RECOMMENDED)
- Rename `products` to `master_products`, drop `seller_id` and commercial columns, create `supplier_offerings`.
- **Risk**: High risk of breaking existing RFQs, POs, historical quotation records, and active database constraints. Requires extensive database downtime.

### Strategy B: Non-Destructive Dual-Write / Evolution Migration (RECOMMENDED)
1. **Schema Addition**: Introduce `master_products` table and `supplier_offerings` table via Flyway migration `V20`.
2. **Backfill Migration**: Execute an automated migration script grouping existing `products` by `cas_number` / `name` into `master_products`, and mapping existing `products` rows into `supplier_offerings`.
3. **Compatibility Layer**: Retain existing `products` table or map it as a database VIEW joining `master_products` and `supplier_offerings`.
4. **Transaction Integrity**: Existing RFQs and POs retain their historical immutable product references without data corruption.

---

## 9. Admin Governance Gap Analysis

Current `AdminProductService` capabilities:
- **Search & Moderation**: Admin can search products, modify metadata, set availability status (`AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`, `DISCONTINUED`), and deactivate listings.
- **Admin Gaps**:
  - Cannot create canonical `MasterProduct` records.
  - Cannot merge duplicate supplier-created products under a single canonical Master Product.
  - Cannot review/approve proposed supplier compounds before catalog publishing.
  - Cannot manage formal chemical taxonomies/categories.

---

## 10. SEO & Canonicalization Impact

- **Current Behavior**: `/products/{productCode}` points to a supplier-specific Product record.
- **Target Master Catalog Behavior**:
  - **Canonical URL**: `https://kemkendra.com/products/{masterProductCode}` or `https://kemkendra.com/products/cas/{casNumber}` represents the canonical chemical compound.
  - **Structured Data**: Injects `Product` Schema.org JSON-LD with an `offers` array containing all verified `Offer` / `Organization` listings.
  - **Search Consolidation**: Search engines index 1 authoritative page per chemical compound instead of N duplicate pages across suppliers, dramatically improving search ranking and domain authority.

---

## 11. Recommended Target Architecture

```
                 ┌─────────────────────────┐
                 │     MasterProduct       │
                 │ ─────────────────────── │
                 │ id (UUID)               │
                 │ masterProductCode       │
                 │ name                    │
                 │ casNumber               │
                 │ molecularFormula        │
                 │ category                │
                 │ description             │
                 └────────────┬────────────┘
                              │ 1
                              │
                              │ N
                 ┌────────────▼────────────┐
                 │    SupplierOffering     │
                 │ ─────────────────────── │
                 │ id (UUID)               │
                 │ masterProduct (FK)      │
                 │ supplier (FK)           │
                 │ price                   │
                 │ stock                   │
                 │ purity                  │
                 │ grade                   │
                 │ moqKg                   │
                 │ leadTimeDays            │
                 │ packaging               │
                 │ availabilityStatus      │
                 └────────────┬────────────┘
                              │
                              │ Referenced By
                              ▼
                 ┌─────────────────────────┐
                 │  RFQ / Quotation / PO   │
                 │ ─────────────────────── │
                 │ masterProductId (FK)    │
                 │ supplierOfferingId (FK) │
                 │ historicalSnapshotData  │
                 └─────────────────────────┘
```

---

## 12. Proposed Phase I Implementation Roadmap

- **Phase I.1**: Architecture & Codebase Audit (COMPLETE — Read-Only).
- **Phase I.2**: Master Product & Supplier Offering Domain Model Design (`MasterProduct`, `SupplierOffering` entities & Flyway `V20`).
- **Phase I.3**: Non-Destructive Data Backfill & Compatibility Layer.
- **Phase I.4**: Supplier Offering Management API & Frontend Workflow.
- **Phase I.5**: Catalog Search & Master Product Grouping Redesign.
- **Phase I.6**: Admin Master Catalog Governance & Duplicate Merging Portal.
- **Phase I.7**: SEO, Dynamic Sitemap & Schema.org `AggregateOffer` Refactoring.
- **Phase I.8**: End-to-End Regression & Integration Verification.
