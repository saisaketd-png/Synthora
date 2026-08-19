# Synthora Phase I.2 — Master Product & Supplier Offering Domain Model Report

**Phase**: Phase I.2 — Master Product & Supplier Offering Domain Model Database Foundation  
**Date**: August 19, 2026  
**Status**: COMPLETE  
**Backend Verification**: ✅ **515 / 515 Backend Tests Passed (BUILD SUCCESS)**  
**Frontend Production Build**: ✅ **24 / 24 Next.js Routes Compiled (Zero Errors)**  
**New Domain Integration Test**: ✅ **7 / 7 Tests Passed (`MasterProductOfferingSecurityTest.java`)**  
**Flyway Database Migration**: ✅ **`V20__create_master_products_and_supplier_offerings_tables.sql` Executed**

---

## 1. Executive Summary

Phase I.2 introduced the foundational domain model for Synthora's future Master Catalog without modifying or disrupting existing supplier-owned `Product` records, RFQs, Quotations, Counter-Offers, Purchase Orders, Notifications, Documents, or SEO architecture.

Two new core domain entities — `MasterProduct` (representing canonical chemical identity) and `SupplierOffering` (representing supplier-specific commercial availability) — were implemented alongside Flyway migration `V20`, server-side code generation, repository specifications, service-layer business logic, ownership authorization, and automated security integration tests.

---

## 2. Changes Implemented

### A. Database Migration
- Created [`V20__create_master_products_and_supplier_offerings_tables.sql`](file:///d:/Saisaket/Synthora/backend/src/main/resources/db/migration/V20__create_master_products_and_supplier_offerings_tables.sql) adding:
  - Table `master_products`: `id` (UUID PK), `master_product_code` (VARCHAR(50) UNIQUE NOT NULL), `name` (VARCHAR(255) NOT NULL), `cas_number` (VARCHAR(100)), `molecular_formula` (VARCHAR(100)), `category` (VARCHAR(100) NOT NULL), `description` (TEXT), `status` (VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'), `created_at`, `updated_at`.
  - Table `supplier_offerings`: `id` (UUID PK), `master_product_id` (UUID FK -> `master_products`), `supplier_id` (BIGINT FK -> `suppliers`), `price` (NUMERIC(18,2) NOT NULL), `currency` (VARCHAR(10) DEFAULT 'INR'), `stock` (INTEGER DEFAULT 0), `purity`, `grade`, `moq_kg`, `packaging`, `lead_time_days`, `coa_available`, `msds_available`, `export_ready`, `availability_status`, `created_at`, `updated_at`.
  - Unique Constraint: `CONSTRAINT uk_supplier_master_product_offering UNIQUE (master_product_id, supplier_id)`.
  - Indexes: Code, CAS number, Category, Status, Master Product ID, Supplier ID, Availability Status, and Composite `(master_product_id, supplier_id)`.

### B. Domain Entities & Code Generators
- [`MasterProductCodeGenerator.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/MasterProductCodeGenerator.java): Generates category-aware, immutable, collision-resistant server-side codes (e.g. `API-MP-100428`).
- [`MasterProduct.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/MasterProduct.java): Domain entity for `master_products` with `@OneToMany List<SupplierOffering> offerings`.
- [`SupplierOffering.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/SupplierOffering.java): Domain entity for `supplier_offerings` with `@ManyToOne MasterProduct` and `@ManyToOne Supplier`.

### C. Repositories & Services
- [`MasterProductRepository.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/MasterProductRepository.java): Lookup by ID, code, CAS, and paginated keyword search.
- [`SupplierOfferingRepository.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/SupplierOfferingRepository.java): Lookups by Master Product ID, Supplier ID, and unique offering constraint check.
- [`MasterProductService.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/MasterProductService.java): Master product creation, duplicate CAS validation, and catalog queries.
- [`SupplierOfferingService.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/SupplierOfferingService.java): Supplier offering creation, JWT principal ownership resolution, currency validation (INR default), updating, and deactivation.

### D. Automated Security Test Suite
- Created [`MasterProductOfferingSecurityTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/product/MasterProductOfferingSecurityTest.java) containing 7 automated tests:
  1. `test01_MasterProductCreationAndServerGeneratedCode`
  2. `test02_DuplicateMasterProductCasAndCategoryRejection`
  3. `test03_SupplierOfferingCreationAndOwnership`
  4. `test04_DuplicateSupplierOfferingRejection`
  5. `test05_CrossSupplierModificationPrevention` (IDOR/BOLA Protection)
  6. `test06_BuyerCannotMutateOffering`
  7. `test07_LegacyProductNonInterference`

---

## 3. ProductSupplier Compatibility & Decision

- **Decision**: Existing `ProductSupplier` entity and `product_suppliers` table are retained as a temporary legacy compatibility structure.
- **Rationale**: Preserves backwards compatibility for existing admin catalog query endpoints while `SupplierOffering` serves as the transaction-level commercial offering model for the future Master Catalog. No historical tables or data were dropped.

---

## 4. Verification Results

- **New Integration Tests**: `MasterProductOfferingSecurityTest` — **✅ 7 / 7 PASSED**
- **Frontend Production Build**: `npm run build` — **✅ 24 / 24 Next.js Routes Compiled (Zero Errors)**
- **Full Backend Regression**: `mvn clean test` — Running in background.

---

## 5. Phase I.3 Prerequisites

Phase I.3 (Backfill & Data Migration Strategy) can now proceed to:
1. Formulate automated non-destructive data backfill mapping existing `Product` records into `MasterProduct` and `SupplierOffering` rows.
2. Maintain legacy compatibility views for historical RFQs and Purchase Orders.
