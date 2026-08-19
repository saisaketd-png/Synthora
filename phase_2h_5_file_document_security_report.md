# Synthora Phase 2H.5 — File Upload & Document Security Hardening Report

**Execution Date:** 2026-08-18  
**Scope:** Document Architecture Audit, Magic-Byte & File Signature Validation, MIME Spoofing Mitigation, Double Extension Defense, Filename Path Traversal Sanitization, Server-Generated Storage Keys, File Size Enforcement, IDOR/BOLA Download & Deletion Authorization, Response Header Hardening, Cache Isolation  
**Status:** COMPLETED & VERIFIED (Zero Regressions)

---

## A. Executive Summary

Phase 2H.5 comprehensively hardened file upload, storage, download, and deletion mechanisms across the Synthora B2B marketplace. Uploaded chemical and commercial documents (COAs, MSDS, TDS, Technical Specifications, Quotation Attachments, Invoices, Purchase Orders, and Delivery Confirmations) are now strictly inspected at the binary level using **Apache Tika Core** (`2.9.2`) and deterministic **magic-byte signature validation** before any file is saved to disk or referenced in the database.

Client-controlled metadata (such as file extensions and browser-supplied `Content-Type` request headers) is no longer trusted. Files with mismatched binary content, double extensions (e.g. `invoice.pdf.exe`), path traversal sequences, or active executable/script signatures (`MZ`, `\x7fELF`, `\xca\xfe\xba\xbe`, `#!`, `<html`, `<script`, `<svg`) are immediately rejected with clean `HTTP 400 Bad Request` errors.

- **Backend Regression Suite**: Grew from **368 tests to 404 passing tests** (36 new security tests in `FileSecurityTest.java`, 0 failures, 0 errors, 0 skipped).
- **Frontend Build**: Next.js production build succeeded with **0 type errors** across all 20 routes.
- **Knowledge Graph**: Rebuilt and synchronized via Graphify with **1,861 nodes, 4,883 edges, and 193 communities**.

---

## B. Complete File Architecture Inventory

| Architectural Question | Implementation Detail & Verification |
| :--- | :--- |
| **1. Physical Storage Location** | Local storage directory configured via `synthora.storage.local.root` (default `./storage/documents` in production, `./target/test-storage` in test profile). Stored outside of web server root. |
| **2. Storage Key Generation** | Server-generated random UUID + sanitized extension: `documents/<UUID>.<safe-extension>`. Never user-controlled. |
| **3. Original Filename Storage** | Sanitized base filename (up to 255 chars) stored in `documents.original_file_name`. Control chars, null bytes, traversal tokens, and Windows reserved prefixes are stripped. |
| **4. MIME Type Storage** | Canonical MIME type detected directly from content bytes (via Apache Tika and signature validator) stored in `documents.mime_type`. |
| **5. File Size Storage** | Exact byte length verified against server-side `maxFileSize` (10 MB default) and stored in `documents.file_size`. |
| **6. Document Ownership Model** | Linked through `ownerType` (`PRODUCT`, `RFQ`, `QUOTATION`, `PURCHASE_ORDER`, `SHIPMENT`), `ownerId` (UUID), and `uploadedBy` (UUID). |
| **7. Download Authorization** | Enforced server-side via `DocumentAuthorizationService` evaluating relationship between authenticated user and the linked domain entity (Buyer, Supplier, or Admin). |
| **8. Deletion Authorization** | Restricted to the original uploader (`uploadedBy == user.getId()`) who also holds active access rights to the underlying resource, or an Administrator. |
| **9. Direct Public Storage Access** | **None.** No static resource mappings expose `./storage/documents` to public HTTP endpoints. |
| **10. Endpoint Serving** | Served strictly through authenticated controller endpoint `/api/v1/documents/{id}/download`. |
| **11. Static Resource Exposure** | Verified that Spring Web MVC static resource handler does not route `/documents/**` to filesystem paths. |

---

## C. Supported File Types & MIME Matrix

| Extension | Allowed MIME Type | Magic-Byte Signature / Header Requirement | Serving Policy | Max Size |
| :--- | :--- | :--- | :--- | :--- |
| `.pdf` | `application/pdf` | `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`) | Attachment (nosniff) | 10 MB |
| `.png` | `image/png` | `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A` | Attachment (nosniff) | 10 MB |
| `.jpg`, `.jpeg` | `image/jpeg` | `0xFF 0xD8 0xFF` | Attachment (nosniff) | 10 MB |
| `.doc` | `application/msword` | `0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1` (OLECF) | Attachment (nosniff) | 10 MB |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `0x50 0x4B 0x03 0x04` (ZIP container + OpenXML) | Attachment (nosniff) | 10 MB |
| `.xls` | `application/vnd.ms-excel` | `0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1` (OLECF) | Attachment (nosniff) | 10 MB |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `0x50 0x4B 0x03 0x04` (ZIP container + OpenXML) | Attachment (nosniff) | 10 MB |
| `.csv` | `text/csv` | Valid UTF-8/ASCII text without null bytes or HTML tags | Attachment (nosniff) | 10 MB |

*Note: Executable binaries (`.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.jar`, `.class`, `.dll`, `.msi`, `.scr`, `.com`) and vector graphics with active script capabilities (`.svg`, `.html`, `.htm`) are strictly rejected.*

---

## D. Magic-Byte Validation

`FileSecurityValidator` extracts up to 2048 header bytes and performs:
1. **Executable & Script Signature Check**: Rejects DOS/PE headers (`MZ`), Linux ELF (`\x7fELF`), Java bytecode (`\xca\xfe\xba\xbe`), and Shell script shebangs (`#!`).
2. **Embedded HTML/Script Inspection**: Rejects files containing `<html`, `<script`, `<?php`, `<!doctype html`, `<svg`, or `javascript:` in their content stream.
3. **Format-Specific Magic Bytes**: Validates that raw bytes conform to the required byte sequence for the declared file extension.
4. **Apache Tika Integration**: Utilizes Apache Tika Core to detect the canonical MIME type directly from the byte stream.

---

## E. MIME & Extension Spoofing Defense

The server rejects uploads where the file extension and MIME type do not align with the underlying binary structure:
- Executable or HTML file renamed to `report.pdf` $\rightarrow$ Rejected (`400 Bad Request`).
- Plain text file renamed to `image.jpg` $\rightarrow$ Rejected (`400 Bad Request`).
- JavaScript file renamed to `data.csv` $\rightarrow$ Rejected (`400 Bad Request`).
- Valid PDF with spoofed `Content-Type: text/plain` $\rightarrow$ Validated and saved as canonical `application/pdf`.

---

## F. Filename & Path Traversal Security

- **Path Traversal Stripping**: Removes Unix `/` and Windows `\` separators, single-encoded traversals (`%2e%2e%2f`), and double-encoded traversals (`%252e%252e%252f`).
- **Null-Byte Injection**: Strips null bytes (`\x00`) and control characters (`[\p{Cntrl}]`).
- **Windows Reserved Devices**: Filenames matching `CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9` are safely prefixed with `safe_`.
- **Length Bounds**: User-facing original filename is clamped to a maximum of 255 characters.

---

## G. Storage Isolation

- **Server-Generated Physical Identifiers**: Physical files are stored at `documents/<UUID>.<extension>` under `LocalStorageService`.
- **Zero Client Overwrite**: The client has no ability to choose or influence the target filesystem path. Directory escape attempts outside `synthora.storage.local.root` throw immediate security exceptions.

---

## H. File Size Limits

- **Multipart File Limit**: `synthora.documents.max-file-size: 10485760` (10 MB).
- **Spring Servlet Limits**: `spring.servlet.multipart.max-file-size: 50MB` / `max-request-size: 50MB`.
- **Validation**: Rejects empty files (`0 bytes`) and files exceeding 10 MB with clean `HTTP 400 Bad Request` messages.

---

## I. Download & Delete Authorization (IDOR / BOLA Hardening)

- **Ownership-Enforced Access**: Every document access request (`GET /api/v1/documents/{id}/download`, `GET /api/v1/documents/{id}`, `DELETE /api/v1/documents/{id}`) passes through `DocumentAuthorizationService`.
  - **Buyer A** cannot access **Buyer B's** RFQ or PO documents.
  - **Supplier B** cannot access **Supplier A's** private product or quotation documents.
  - **Unrelated Suppliers** cannot access RFQs unless specifically assigned.
  - **Deletion** requires the user to be the original creator (`uploadedBy == user.getId()`) with active authorization on the parent entity.
  - **Administrator** retains oversight access across all platform documents.
- **Unauthenticated Access**: Direct unauthenticated requests return `HTTP 401 Unauthorized`.

---

## J. Document Response Headers & Cache Security

The download endpoint `/api/v1/documents/{id}/download` attaches the following hardened headers:
- `Content-Disposition: attachment; filename="<sanitized-filename>"`
- `Content-Type: <validated-mime-type>`
- `Cache-Control: private, no-cache, no-store, must-revalidate`
- `Pragma: no-cache`
- `X-Content-Type-Options: nosniff`

---

## K. Archive & Command Execution Security

- **No Archive Extraction**: Synthora does not decompress, unpack, or execute ZIP/TAR/RAR archive files on the server.
- **No Command Execution**: Audited backend codebase confirms zero usage of `Runtime.getRuntime().exec()`, `ProcessBuilder`, or native shell invocations. Uploaded documents are treated strictly as inert binary blobs.

---

## L. Security Test Matrix (`FileSecurityTest.java`)

| # | Test Scenario / Security Vector | Input / Attack Vector | Expected Result | Actual Result |
| :---: | :--- | :--- | :--- | :---: |
| 1 | Valid PDF Upload | `%PDF-1.7` stream + `coa.pdf` | HTTP 201 Created | **PASS** |
| 2 | Valid PNG Image Upload | `\x89PNG` stream + `chart.png` | HTTP 201 Created | **PASS** |
| 3 | Valid JPEG Image Upload | `\xFF\xD8\xFF` stream + `purity.jpg` | HTTP 201 Created | **PASS** |
| 4 | Valid DOCX Document Upload | `PK\x03\x04` stream + `contract.docx` | HTTP 201 Created | **PASS** |
| 5 | HTML Disguised as PDF | `<html><script>` in `fake.pdf` | HTTP 400 Bad Request | **PASS** |
| 6 | JavaScript Disguised as PDF | `var x=10; exploit()` in `script.pdf` | HTTP 400 Bad Request | **PASS** |
| 7 | Windows PE Binary Disguised as PDF | `MZ\x90...` in `malware.pdf` | HTTP 400 Bad Request | **PASS** |
| 8 | Linux ELF Binary Disguised as PDF | `\x7fELF...` in `rootkit.pdf` | HTTP 400 Bad Request | **PASS** |
| 9 | Text Disguised as JPG | Plain text in `photo.jpg` | HTTP 400 Bad Request | **PASS** |
| 10 | SVG Active Script Rejection | `<svg onload=alert(1)>` | HTTP 400 Bad Request | **PASS** |
| 11 | Double Extension with Executable | `invoice.pdf.exe` | HTTP 400 Bad Request | **PASS** |
| 12 | Double Extension with Script | `coa.pdf.bat` | HTTP 400 Bad Request | **PASS** |
| 13 | Unix Path Traversal in Filename | `../../../../etc/passwd.pdf` | Sanitized to `passwd.pdf` | **PASS** |
| 14 | Windows Path Traversal in Filename | `..\..\windows\system32\cmd.pdf` | Sanitized to `cmd.pdf` | **PASS** |
| 15 | Double-Encoded URL Traversal | `%252e%252e%252fsecret.pdf` | Sanitized to `secret.pdf` | **PASS** |
| 16 | Windows Reserved Name in Filename | `CON.pdf` | Sanitized to `safe_CON.pdf` | **PASS** |
| 17 | Empty File Upload | 0-byte file | HTTP 400 Bad Request | **PASS** |
| 18 | Owner Download Authorization | Buyer A downloads own RFQ doc | HTTP 200 OK + Headers | **PASS** |
| 19 | Buyer B $\rightarrow$ Buyer A RFQ Doc (IDOR) | Buyer B downloads Buyer A doc | HTTP 403 Forbidden | **PASS** |
| 20 | Supplier B $\rightarrow$ Supplier A RFQ Doc | Supplier B downloads RFQ doc | HTTP 403 Forbidden | **PASS** |
| 21 | Assigned Supplier Access | Supplier A downloads assigned doc | HTTP 200 OK | **PASS** |
| 22 | Unauthenticated Download Attempt | No JWT Bearer token | HTTP 401 Unauthorized | **PASS** |
| 23 | Unauthorized Document Deletion | Supplier A deletes Buyer A doc | HTTP 403 Forbidden | **PASS** |
| 24 | Storage Key Server Generation | Client uploads `custom_name.pdf` | Stored as `documents/<UUID>.pdf` | **PASS** |
| 25 | Missing Physical Storage File | Physical file deleted on disk | HTTP 404 Controlled Error | **PASS** |
| 26 | Complete Deletion Purge | Owner deletes document | DB and disk file removed | **PASS** |
| 27 | Valid XLSX Spreadsheet Upload | `PK\x03\x04` stream + `data.xlsx` | HTTP 201 Created | **PASS** |
| 28 | Valid CSV Upload | ASCII text stream + `report.csv` | HTTP 201 Created | **PASS** |
| 29 | CSV Null-Byte Injection | Text stream with `\x00` | HTTP 400 Bad Request | **PASS** |
| 30 | Valid OLECF DOC Upload | `\xD0\xCF\x11\xE0...` in `doc.doc` | HTTP 201 Created | **PASS** |
| 31 | Nonexistent Document Download | Random UUID download request | HTTP 404 Not Found | **PASS** |
| 32 | Control Characters in Filename | `test\r\n\tfile.pdf` | Sanitized to `testfile.pdf` | **PASS** |
| 33 | Extremely Long Filename (>255) | 300-char filename | Clamped to $\le 255$ chars | **PASS** |
| 34 | Null-Byte in Filename | `report\0.pdf` | Sanitized to `report.pdf` | **PASS** |
| 35 | Download Deleted Document | Download request after delete | HTTP 404 Not Found | **PASS** |
| 36 | Administrator Download Access | Admin downloads any document | HTTP 200 OK | **PASS** |

---

## M. Build & Regression Results

```
========================================================================
Synthora Build & Verification Pipeline
========================================================================
[Previous Backend Test Count] : 368 tests
[New Security Tests Added]    : 36 tests (FileSecurityTest.java)
[Total Backend Tests Run]     : 404 tests (0 Failures, 0 Errors, 0 Skipped)
[Backend Build Status]        : BUILD SUCCESS (Total time: 01:01 min)
[Frontend Next.js Build]      : 20/20 routes built successfully, 0 Type Errors
[Knowledge Graph AST Update]  : 1,861 nodes, 4,883 edges, 193 communities
========================================================================
```

---

## N. Dependency Changes

| Dependency | Version | Scope | Purpose |
| :--- | :--- | :--- | :--- |
| `org.apache.tika:tika-core` | `2.9.2` | Compile / Runtime | Lightweight, enterprise-grade server-side MIME type detection and magic-byte inspection (~744 kB, zero heavy parser transitive dependencies). |

---

## O. Modified & Added Files

### Backend Source Files Added/Modified:
- [`backend/pom.xml`](file:///d:/Saisaket/Synthora/backend/pom.xml): Added `org.apache.tika:tika-core:2.9.2`.
- [`com/synthora/document/FileSecurityValidator.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/document/FileSecurityValidator.java): **[NEW]** Enterprise file validator with magic-byte validation, MIME allowlisting, double-extension defense, traversal sanitization, and executable/script blocking.
- [`com/synthora/document/DocumentService.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/document/DocumentService.java): Integrated `FileSecurityValidator`, enforced safe storage keys, and returned controlled 404s when physical storage files are missing.
- [`com/synthora/document/DocumentController.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/document/DocumentController.java): Attached secure headers (`Cache-Control: private, no-cache, no-store`, `Pragma: no-cache`, `X-Content-Type-Options: nosniff`, `Content-Disposition: attachment`).

### Test Files Added/Modified:
- [`com/synthora/security/FileSecurityTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/security/FileSecurityTest.java): **[NEW]** 36 comprehensive file security tests.
- [`com/synthora/document/DocumentApiTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/document/DocumentApiTest.java): Updated mock files with valid PDF byte signatures.
- [`com/synthora/document/ProductDocumentSecurityTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/document/ProductDocumentSecurityTest.java): Updated mock files with valid PDF byte signatures.
- [`com/synthora/document/RfqQuotationDocumentSecurityTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/document/RfqQuotationDocumentSecurityTest.java): Updated mock files with valid PDF byte signatures.
- [`com/synthora/document/PurchaseOrderShipmentDocumentSecurityTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/document/PurchaseOrderShipmentDocumentSecurityTest.java): Updated mock files with valid PDF byte signatures.
- [`com/synthora/notification/NotificationEmailIntegrationTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/notification/NotificationEmailIntegrationTest.java): Updated mock files with valid PDF byte signatures.
- [`com/synthora/notification/NotificationEventIntegrationTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/notification/NotificationEventIntegrationTest.java): Updated mock files with valid PDF byte signatures.

---

## P. Remaining Security Risks

1. **Antivirus / Malware ClamAV Scanning**: Magic-byte validation verifies file integrity and detects binary/script spoofing. For enterprise production deployments, an asynchronous ClamAV or cloud antivirus scanner sidecar should inspect stored files.
2. **Cloud Object Storage (S3 / GCS) Integration**: Transitioning from local filesystem storage to AWS S3 or Google Cloud Storage will require pre-signed download URLs with strict expiration TTLs.
3. **External Pen-Testing & DAST**: Dynamic application security testing in staging environments prior to production rollout.

---

## Q. Hard Stop Declaration

Phase 2H.5 is complete. All file upload, magic-byte validation, and document security requirements are verified and passing with zero regressions. Awaiting explicit user approval before proceeding to **Phase 2H.6 / Next Security Phase**.
