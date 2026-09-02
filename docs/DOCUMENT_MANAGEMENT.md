# KemKendra Document & Compliance Management Architecture

## Overview
KemKendra Phase 1.18 delivers enterprise document management, statutory compliance verification, and commercial record governance. The system enforces strict tenant isolation, cryptographic file integrity (SHA-256), deterministic document revision lineages (`document_group_id`), and server-calculated dynamic expiry statuses.

---

## 1. Storage & Cryptographic Integrity

### Secure Generated Storage Keys
- Storage keys follow the deterministic format:
  `documents/{ownerType}/{ownerId}/{documentGroupId}/{UUID}_{sanitizedFilename}`
- Client-supplied file paths and storage locations are strictly ignored and discarded.
- Raw filesystem paths and cloud storage credentials are never exposed in API responses or serialized JSON.

### SHA-256 Checksum Computation
- During upload stream validation in `FileSecurityValidator`, the cryptographic SHA-256 digest is generated across the byte stream.
- Checksums are stored with the document metadata and returned to authorized clients for verification against tampering.

---

## 2. Lineage & Versioning Architecture

### Deterministic Lineage with `document_group_id`
- Rather than blindly incrementing versions by category/owner, documents belong to explicit lineages identified by `document_group_id` (UUID).
- **Initial Upload**: When a new document is uploaded without `documentGroupId`, a fresh `documentGroupId` is created and assigned `version = 1`, `is_active = true`.
- **Revision / New Version**: When uploading a revision, the client passes `documentGroupId`.
  - All existing documents in that group are marked `is_active = false` (archived for audit).
  - The new revision is inserted with `version = (highest_version + 1)`, `is_active = true`.
- **Independent Documents**: Two distinct documents of the same category (e.g. state-specific GST certificates) maintain separate `document_group_id` values with isolated `v1` lineages.

### Soft Deactivation
- Governed documents are soft-deactivated (`is_active = false`) via `PATCH /api/v1/documents/{id}/deactivate`.
- Preserves audit trails, historical compliance verification records, and transaction records.

---

## 3. Dynamic Expiry Status Engine

Document expiry is computed dynamically on the server:
- `VALID`: `expiryDate` is present and $> 30\text{ days}$ in the future.
- `EXPIRING_SOON`: `expiryDate` is present and $\le 30\text{ days}$ from today (or today).
- `EXPIRED`: `expiryDate` is strictly in the past.
- `NO_EXPIRY`: No expiration date is specified (perpetual certificate or commercial record).

---

## 4. Authorization & Cross-Tenant Security

### Server-Derived Authorization
- **Buyer Isolation**: Buyers can access documents where `ownerId == buyer.id` or attached to transaction lineages where `buyerId == buyer.id` (RFQ, Quotation, PO, Shipment).
- **Supplier Isolation**: Suppliers can access documents where `ownerId == supplier.id` or attached to transaction lineages where `supplierId == supplier.id`.
- **Catalog Media & Offerings**: Public offerings allow document viewing for marketplace transparency.
- **Admin Access**: Administrators with `ADMIN` role maintain full read/audit visibility across all tenant documents.
- **Suspended Users**: Blocked from uploading, modifying, or deactivating documents.

---

## 5. Audit Logging

Every document operation produces an immutable entry in `audit_logs`:
- `DOCUMENT_UPLOADED`: Initial document uploaded to a new group.
- `DOCUMENT_VERSION_CREATED`: New revision added to an existing lineage.
- `DOCUMENT_DEACTIVATED`: Soft deactivation of a document record.
- `DOCUMENT_DOWNLOADED`: Document retrieved by authorized party.

---

## 6. Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/documents` | Multipart file upload with category, lineage group, dates, description |
| `GET` | `/api/v1/documents?ownerType=&ownerId=&includeHistory=` | List active (or all) documents for an owner entity |
| `GET` | `/api/v1/documents/{id}` | Get document metadata by ID |
| `GET` | `/api/v1/documents/{id}/download` | Stream document content with octet-stream headers |
| `GET` | `/api/v1/documents/groups/{groupId}/versions` | Get all revisions in a document lineage group |
| `PATCH` | `/api/v1/documents/{id}/deactivate` | Soft-deactivate a document |
| `DELETE` | `/api/v1/documents/{id}` | Hard delete (restricted) |
