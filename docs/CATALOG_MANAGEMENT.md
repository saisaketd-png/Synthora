# KemKendra — Master Catalog & Supplier Offering Management (Phase 1.10)

## Overview

KemKendra implements a two-tier chemical catalog architecture designed for B2B industrial transactions:

1. **Master Catalog (`MasterProduct`)**:
   - Represents canonical chemical identities and universal specifications (Canonical Name, CAS Registry Number, Molecular Formula, Category, Synonyms, Canonical Images, Technical Compliance Sheets).
   - Fully governed and moderated by platform administrators.

2. **Supplier Commercial Offerings (`SupplierOffering`)**:
   - Represents commercial parameters (Pricing, Currency, Available Stock, MOQ, Packaging, Assay Purity, Grade, Lead Time, Certification Flags).
   - Owned by the Supplier company.
   - Can be created either directly by authorized supplier users or on their behalf by platform operators (KemKendra Admins).

---

## Provenance Model: Owner vs Operator

A critical design requirement is strict distinction between **Business Ownership** and **Administrative Operation**:

| Aspect | Supplier-Created Offering | Admin-Created on Behalf of Supplier |
|---|---|---|
| **Commercial Owner** | `Supplier` (Resolved from JWT) | `Supplier` (Selected by Admin) |
| **Creation Provenance** | `created_by_role = 'SUPPLIER'` | `created_by_role = 'ADMIN'` |
| **Audit Identity** | Supplier User Principal | `created_by_admin_id`, `created_by_admin_name` |
| **Visibility on Supplier Portal** | Visible & Managed | Visible & Managed with "Listed by KemKendra Admin" badge |
| **Visibility on Admin Portal** | Displayed as "🏢 Created by Supplier" | Displayed as "🛡️ Created by KemKendra Admin (Admin Name)" |
| **Buyer Marketplace Sourcing** | Quoting, RFQ, and orders bind to Supplier | Quoting, RFQ, and orders bind to Supplier |

---

## API Endpoints

### Admin Master Catalog & Offering Management

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/catalog/master-products` | `ADMIN` | Search and paginate master products with filters |
| `POST` | `/api/v1/admin/catalog/master-products` | `ADMIN` | Create new canonical master product |
| `GET` | `/api/v1/admin/catalog/master-products/{id}` | `ADMIN` | Get master product detail with connected offerings & audit |
| `PUT` | `/api/v1/admin/catalog/master-products/{id}` | `ADMIN` | Update master product specifications |
| `PUT` | `/api/v1/admin/catalog/master-products/{id}/status` | `ADMIN` | Activate (`ACTIVE`) or deactivate (`INACTIVE`) master product |
| `GET` | `/api/v1/admin/catalog/offerings` | `ADMIN` | Search supplier commercial offerings with provenance & status filters |
| `POST` | `/api/v1/admin/catalog/offerings` | `ADMIN` | **Create commercial offering on behalf of supplier** |
| `PUT` | `/api/v1/admin/catalog/offerings/{id}` | `ADMIN` | Update commercial offering parameters |
| `PUT` | `/api/v1/admin/catalog/offerings/{id}/status` | `ADMIN` | Activate or deactivate commercial offering |
| `POST` | `/api/v1/admin/catalog/offerings/{id}/approve` | `ADMIN` | Approve offering for marketplace publication |
| `POST` | `/api/v1/admin/catalog/offerings/{id}/reject` | `ADMIN` | Reject offering with reason notes |
| `POST` | `/api/v1/admin/catalog/offerings/{id}/flag` | `ADMIN` | Flag offering for specification compliance review |
| `POST` | `/api/v1/admin/catalog/offerings/{id}/suspend` | `ADMIN` | Suspend commercial offering |

### Supplier Portal Offerings

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/supplier/offerings` | `SUPPLIER` | List all offerings owned by the authenticated supplier (including admin-created) |
| `GET` | `/api/v1/supplier/offerings/{id}` | `SUPPLIER` | Get specific offering owned by supplier (IDOR-protected) |
| `POST` | `/api/v1/supplier/offerings` | `SUPPLIER` | Supplier lists new commercial offering under authenticated profile |
| `PUT` | `/api/v1/supplier/offerings/{id}` | `SUPPLIER` | Supplier updates commercial terms |
| `POST` | `/api/v1/supplier/offerings/{id}/deactivate` | `SUPPLIER` | Supplier deactivates listing |

---

## Database Migration (Flyway V41)

Migration `V41__add_offering_creation_provenance.sql` adds provenance tracking to `supplier_offerings`:

```sql
ALTER TABLE supplier_offerings
    ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50) DEFAULT 'SUPPLIER',
    ADD COLUMN IF NOT EXISTS created_by_admin_id UUID,
    ADD COLUMN IF NOT EXISTS created_by_admin_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_supplier_offerings_created_by_role ON supplier_offerings(created_by_role);
```

---

## Automated Security & Validation Test Suite

Class: `com.kemkendra.product.AdminCatalogAndOfferingSecurityTest` (15/15 tests passing):

1. `adminCanCreateMasterProduct` — Verifies HTTP 201 Created and master product attribute persistence.
2. `adminCanEditMasterProduct` — Verifies administrative specification updates.
3. `adminCanActivateDeactivateMasterProduct` — Verifies status toggling (`ACTIVE` <-> `INACTIVE`).
4. `adminCanCreateSupplierOfferingOnBehalfOfSupplier` — Validates supplier ownership assignment and `created_by_role = 'ADMIN'`.
5. `adminCanEditSupplierOffering` — Verifies admin commercial parameter modifications.
6. `adminCanDeactivateSupplierOffering` — Verifies hiding/deactivating commercial offerings.
7. `supplierCanViewOwnOfferingIncludingAdminCreated` — Confirms supplier can inspect admin-created listings.
8. `supplierCannotViewAnotherSuppliersOffering` — Verifies IDOR isolation (HTTP 403 Forbidden).
9. `supplierCannotCreateOfferingForAnotherSupplier` — Confirms supplier cannot spoof supplier ID.
10. `buyerReceivesForbiddenForAdminCatalogManagement` — Confirms `ROLE_USER` cannot access admin catalog APIs (HTTP 403).
11. `supplierCannotModifyAdminCatalogMasterProducts` — Confirms supplier cannot modify master catalog without admin privileges.
12. `adminCreatedOfferingRemainsOwnedBySelectedSupplier` — Verifies supplier foreign key relationship.
13. `duplicateOfferingProtectionPerSupplierAndProduct` — Verifies HTTP 409 Conflict when attempting duplicate offering.
14. `invalidSupplierOrProductIdsRejectedSafely` — Confirms HTTP 404 for non-existent entities.
15. `provenanceIsCorrectlyPreservedAndReturned` — Validates JSON response contains `createdByRole`, `createdByAdminId`, `createdByAdminName`.

---

## Verification Summary

- **Backend Test Suite**: 1,419 / 1,419 tests passing (`BUILD SUCCESS`).
- **Frontend Production Build**: 51 / 51 routes compiled successfully (0 TypeScript/ESLint errors).
