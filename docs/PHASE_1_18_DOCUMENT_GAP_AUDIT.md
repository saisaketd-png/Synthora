# Phase 1.18 — Architectural Gap Audit: Documents, Compliance & Commercial Records

**Date**: 2026-09-01  
**Project**: KemKendra B2B Marketplace Platform  
**Target Milestone**: Phase 1.18 — Documents, Compliance & Commercial Records  

---

## Executive Summary
This architectural gap audit evaluates the existing KemKendra document storage, metadata, authorization, compliance verification, and commercial record attachment capabilities against the requirements of **Phase 1.18**. 

KemKendra already possesses a strong baseline file storage and validation infrastructure (from initial foundation and Phase 1.14/1.15/1.17 migrations `V14`, `V29`, and `V30`), including magic-byte file signature validation (`FileSecurityValidator`), local file storage abstraction (`StorageService` / `LocalStorageService`), strict IDOR protection (`DocumentAuthorizationService`), and event-driven notifications (`NotificationEventListener`).

However, key features for enterprise compliance and commercial records—such as formal document versioning (`version`, `is_active`), SHA-256 content hashing (`checksum`), server-side expiry status awareness (`VALID`, `EXPIRING_SOON`, `EXPIRED`), comprehensive commercial categories, centralized supplier document workspaces, and explicit document governance audit actions—require extension and refinement.

---

## Gap Audit Classification (Sections A – L)

### A. Already Implemented
1. **Core Document Entity & Table**:
   - `documents` table (`V14`, `V29`) with columns: `id`, `owner_type`, `owner_id`, `category`, `original_file_name`, `storage_key`, `mime_type`, `file_size`, `uploaded_by`, `document_number`, `issuing_authority`, `issue_date`, `expiry_date`, `verification_status`, `created_at`, `updated_at`.
2. **Physical Storage Abstraction**:
   - `StorageService` interface with `LocalStorageService` implementation, writing sanitized files to configured local storage directory with generated UUID keys.
3. **Deep Binary & Magic-Byte Validation**:
   - `FileSecurityValidator` enforcing Apache Tika inspection, explicit header byte checks (PDF `%PDF-`, PNG, JPEG, Office Compound/OpenXML, CSV), extension allowlists, dangerous extension blocking, double-extension mitigations, and Windows reserved filename protection.
4. **Ownership-Based Authorization Engine**:
   - `DocumentAuthorizationService` / `DocumentAuthorizationServiceImpl` resolving entity access and upload authorization for `PRODUCT`, `MASTER_PRODUCT`, `SUPPLIER_OFFERING`, `SUPPLIER`, `RFQ`, `QUOTATION`, `PURCHASE_ORDER`, and `SHIPMENT`.
5. **Secure Stream Download & Deletion**:
   - `DocumentController` with `/api/v1/documents/{id}/download` and `/api/v1/documents/{id}` DELETE endpoints enforcing authenticated user identity via `Authentication.getName()` and setting `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-cache, no-store`.
6. **Initial Supplier Verification Evidence**:
   - `supplier_verification_evidences` (`V29`) and `supplier_offering_verification_evidences` (`V30`) linking checklist requirements to `documents(id)`.

---

### B. Partially Implemented
1. **Document Categories**:
   - `DocumentCategory` includes technical and some compliance/commercial types (`COA`, `MSDS`, `TECHNICAL_SPECIFICATION`, `CERTIFICATION`, `QUOTATION_ATTACHMENT`, `PURCHASE_ORDER`, `INVOICE`, `PACKING_LIST`, `DELIVERY_CONFIRMATION`, `SHIPPING_DOCUMENT`, `COMPANY_REGISTRATION`, `GST_CERTIFICATE`, `TAX_CERTIFICATE`, `BUSINESS_LICENSE`, `GMP_CERTIFICATE`, `CGMP_CERTIFICATE`, `ISO_CERTIFICATE`, `EXPORT_CERTIFICATE`, `MANUFACTURING_LICENSE`).
   - *Needs standardization and aliases* for Phase 1.18 explicit enum names (`BUSINESS_REGISTRATION`, `TAX_REGISTRATION`, `COMPANY_LICENSE`, `QUALITY_CERTIFICATE`, `SAFETY_CERTIFICATE`, `CERTIFICATE_OF_ANALYSIS`, `OTHER_COMPLIANCE`, `RFQ_ATTACHMENT`, `INVOICE_REFERENCE`, `DELIVERY_DOCUMENT`, `RECEIPT_DOCUMENT`).
2. **Document DTO & Metadata**:
   - `DocumentResponse` returns core fields but lacks `version`, `checksum`, `description`, `isActive`, and server-computed `expiryStatus`.
3. **Document Associations**:
   - `DocumentOwnerType` enum has `PRODUCT`, `MASTER_PRODUCT`, `SUPPLIER_OFFERING`, `SUPPLIER`, `RFQ`, `QUOTATION`, `PURCHASE_ORDER`, `SHIPMENT`, but lacks explicit `USER` type support in the enum and authorization layer.

---

### C. Missing
1. **Document Versioning**:
   - Automatic version incrementation (e.g. `version = 1, 2, 3...`) when uploading subsequent revisions of the same category for an entity.
   - Historical version tracking (`is_active` flag, retrieval of prior versions without overwriting immutable commercial records).
2. **SHA-256 Checksum Calculation**:
   - Computing cryptographic SHA-256 digest during stream validation and persisting on `Document.checksum`.
3. **Supplier Document Central Workspace**:
   - Dedicated `/dashboard/supplier/documents` view grouping compliance, verification, offering, and transaction documents.
4. **Reusable Frontend Document Suite**:
   - Standardized `DocumentCard`, `DocumentList`, `DocumentUpload`, `DocumentVersionHistory`, and `DocumentStatusBadge` components in `frontend/src/shared/components/documents/`.
5. **Document Governance Audit Actions**:
   - `DOCUMENT_UPLOADED`, `DOCUMENT_UPDATED`, `DOCUMENT_VERSION_CREATED`, `DOCUMENT_DOWNLOADED`, `DOCUMENT_DEACTIVATED` in `AuditAction`.

---

### D. Security Gaps
1. **Client-Supplied Metadata Sanitization**:
   - Any client-submitted descriptions or metadata must be sanitized against XSS before persistence.
2. **Actor Identity Integrity**:
   - Ensure all audit events derive the actor strictly from `Authentication.getName()`, never accepting user IDs from request bodies or parameters.
3. **IDOR & Document Enumeration**:
   - Document UUID retrieval must continue to check authorization against the associated entity rather than assuming possession of UUID grants access.
4. **Account State Enforcement**:
   - Suspended users must be barred from uploading or modifying documents.

---

### E. Storage Gaps
1. **Checksum Verification**:
   - Storage service does not currently compute or record SHA-256 file hashes to guarantee content immutability over time.
2. **Storage Rollback on DB Error**:
   - Ensure transaction rollback cleanly removes any written storage artifacts if database persistence fails.

---

### F. Metadata Gaps
1. **Missing Version & Description Fields**:
   - `version` (INT), `description` (TEXT), `checksum` (VARCHAR(64)), and `is_active` (BOOLEAN) are not currently persisted in `documents`.
2. **Server-Side Expiry Status**:
   - Computed status (`VALID`, `EXPIRING_SOON`, `EXPIRED`, `NO_EXPIRY`) should be returned dynamically based on `expiry_date` relative to current server date.

---

### G. Versioning Gaps
1. **No Historical Version Model**:
   - When a supplier uploads a renewed ISO certificate or updated COA, the system should increment `version` and preserve the prior document version as historical rather than hard-deleting it.
2. **Commercial Record Immutability**:
   - Finalized PO and Quotation attachments must remain locked to their historical versions and never be overwritten.

---

### H. Transaction-Document Gaps
1. **Commercial Document Association Validation**:
   - RFQ, Quotation, Purchase Order, and Shipment detail views must have dedicated "Documents" sections displaying commercial records with version badges and download links.

---

### I. Supplier Compliance Gaps
1. **Compliance Expiry Awareness**:
   - Supplier dashboard must display real-time expiry awareness badges (`VALID`, `EXPIRING_SOON` for <= 30 days, `EXPIRED` for past dates) without automated renewal workflows.
2. **Public vs Private Compliance Visibility**:
   - Internal supplier verification notes and admin-only records must remain private, while public compliance certifications (e.g. COA, ISO) can be viewed by permitted buyers.

---

### J. Admin Visibility Gaps
1. **Admin Supplier Dossier Document View**:
   - Admin view `/dashboard/admin/suppliers/verification/[supplierId]` must display the complete compliance document history, versioning, expiry badges, and secure download controls.

---

### K. Notification Gaps
1. **Document Expiry Awareness Notification**:
   - Notifications triggered when compliance documents approach expiry or when critical transaction documents are uploaded by counterparty.

---

### L. Database Changes Required
- **Schema Migration V45**:
  - `V45__create_document_management.sql` is required to add:
    - `ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;`
    - `ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);`
    - `ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;`
    - `ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;`
    - `CREATE INDEX IF NOT EXISTS idx_documents_owner_active ON documents(owner_type, owner_id, is_active);`
    - `CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);`

---

## Conclusion & Next Steps
With schema migration `V45` and backend/frontend enhancements, KemKendra will provide comprehensive document management, versioning, expiry awareness, and audit logging while reusing existing battle-tested storage, security, and notification infrastructure.
