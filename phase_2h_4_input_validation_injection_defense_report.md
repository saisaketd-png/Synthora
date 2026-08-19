# Synthora Phase 2H.4 — Input Validation, Sanitization & Injection Defense Report

**Execution Date:** 2026-08-18  
**Scope:** Input Boundary Inventory, Bean Validation, XSS Mitigation, SQL/JPQL Injection Defense, Search/Filter Hardening, Pagination Abuse Protection, UUID/Enum/Numeric Safety, URL & Path Traversal Validation, Chemical Notation Preservation  
**Status:** COMPLETED & VERIFIED (Zero Regressions)

---

## 1. Executive Summary

Phase 2H.4 comprehensively audited and hardened all frontend and backend input boundaries across Synthora. Building on the authentication (2H.2) and authorization (2H.3) hardening, this phase eliminated vulnerabilities related to injection attacks, pagination abuse, numeric overflow, path traversal, malformed types, and unhandled parser exceptions.

Crucially, all validations preserve **legitimate chemical marketplace nomenclature** (e.g. chemical names with hyphens, parentheses, Greek letters, CAS numbers, molecular formulas, percentages, and technical grades) without resorting to naive string stripping.

- **Total Backend Tests**: Increased from 337 to **368 passing tests** (31 new security tests in `InputValidationSecurityTest.java`, 0 failures, 0 errors).
- **Frontend Build**: Next.js production build succeeded with **0 type errors** across all 20 routes.
- **Knowledge Graph**: Graphify AST re-extraction completed with **1,814 nodes, 4,756 edges, and 192 communities**.

---

## 2. Input Boundary Inventory

The following request boundaries were audited and hardened:

| Domain / Package | Request DTO / Endpoint | Validation Annotations & Constraints |
| :--- | :--- | :--- |
| **Authentication** | `RegisterRequest` | `@NotBlank`, `@Email`, `@Size(max=255)` on name/email, `@Size(max=50)` on phone, `@Size(min=8, max=128)` on password. Ignored client role/status fields. |
| **Authentication** | `LoginRequest` | `@NotBlank`, `@Email`, `@Size(max=255)` on email, `@NotBlank`, `@Size(max=128)` on password. |
| **Seller Profile** | `UpdateSellerProfileRequest` | `@NotBlank`, `@Size(max=150)` on companyName, `@Size(max=500)` on address/certifications, `@Size(max=2000)` on aboutCompany, `@Pattern` URL validation on website. |
| **Product Management** | `CreateProductRequest` & `UpdateProductRequest` | `@NotBlank`, `@Size(max=255)` on name, `@Size(max=2000)` on description, `@DecimalMin("0.01")`, `@DecimalMax("999999999.99")` on price/moqKg, `@Min(0)`, `@Max(1000000000)` on stock, `@Min(0)`, `@Max(3650)` on leadTimeDays, `@Size` bounds on CAS/Formula/Grade/Packaging. |
| **ProductSupplier** | `ProductSupplierRequest` | `@Size(max=100)` on purity/grade, `@DecimalMin("0.0")`, `@DecimalMax("999999999.99")` on moqKg, `@Size(max=150)` on packaging, `@Min(0)`, `@Max(3650)` on leadTimeDays. |
| **RFQ Management** | `CreateRfqRequest` | `@NotNull` on productId/supplierId, `@DecimalMin("0.01")`, `@DecimalMax("999999999.99")` on quantity, `@NotBlank`, `@Size(max=20)` on unit, `@Size(max=2000)` on message. |
| **Quotation Management** | `CreateQuotationRequest` | `@NotNull`, `@Positive`, `@DecimalMax("999999999.9999")`, `@Digits` on unitPrice/MOQ, `@NotBlank`, `@Size(max=10)` on currency, `@Positive`, `@Max(3650)` on leadTimeDays, `@NotNull`, `@Future` on validityDate, `@Size(max=255)` on packagingDetails, `@Size(max=2000)` on commercialNotes. |
| **Quotation Decisions** | `AcceptQuotationRequest` & `RejectQuotationRequest` | `@Size(max=2000)` on decisionNotes and rejectionReason. |
| **Order Management** | `CreatePurchaseOrderRequest` | `@NotNull` on rfqId, `@NotBlank`, `@Size(max=1000)` on shippingAddress, `@NotBlank`, `@Size(max=255)` on billingContact, `@Size(max=2000)` on notes. |
| **Order Fulfillment** | `ShipOrderRequest` | `@NotBlank`, `@Size(max=100)` on carrier and trackingNumber, optional estimatedDeliveryDate. |
| **Document Upload** | `DocumentUploadRequest` | `@NotNull` file, ownerType, ownerId, category. Filename path traversal sanitization, MIME allowlisting. |
| **Admin Operations** | `UpdateUserStatusRequest`, `UpdateUserRoleRequest`, etc. | `@NotNull` on enum fields, `@Size(max=500)` on reason fields. |

---

## 3. Detailed Security Controls & Findings

### 3.1 XSS Defense
- **Audit Findings**: The Next.js frontend utilizes React's default JSX string interpolation, which automatically escapes HTML entities (`&`, `<`, `>`, `"`, `'`). Zero instances of `dangerouslySetInnerHTML` were found across the frontend.
- **Backend Storage**: Malicious HTML/script payloads (such as `<script>alert(1)</script>` or `<img src=x onerror=alert(1)>`) are safely stored as plain text literals without script execution or corruption.

### 3.2 SQL / JPQL / HQL Injection Defense
- **Audit Findings**: All repositories (`ProductRepository`, `QuotationRepository`, `PurchaseOrderRepository`, `RfqRepository`, `UserRepository`, etc.) exclusively use Spring Data JPA derived queries, parameterized `@Query` annotations with `@Param`, and the Criteria API (`Specifications`).
- **Dynamic Query Hardening**: Search keywords in `ProductService` and `SupplierSpecification` are trimmed and bound via parameterized `CriteriaBuilder.like()` expressions.

### 3.3 Search & Pagination Abuse Protection
- **Sort Field Allowlists**: Enforced strict property allowlists in `ProductService` (`ALLOWED_PRODUCT_SORT_FIELDS`) and `SupplierPublicController` (`ALLOWED_SUPPLIER_SORT_FIELDS`). Arbitrary database column names or SQL fragments injected into `sortField` are safely discarded in favor of default sort fields.
- **Bounded Pagination**: Implemented `createBoundedPageable()` and `sanitizePageable()` ensuring:
  - `page = Math.max(0, page)` (negative page numbers bounded to 0)
  - `size = Math.min(Math.max(1, size), 100)` (page sizes bounded between 1 and 100)
  - Non-numeric parameters return controlled `HTTP 400 Bad Request`.

### 3.4 UUID & Enum Type Safety
- **Type Mismatches**: Malformed UUIDs in path variables (e.g. `/api/v1/products/not-a-uuid/detail`) trigger `MethodArgumentTypeMismatchException` in `GlobalExceptionHandler`, returning a clean `HTTP 400 Bad Request` (`"Invalid parameter format: id"`).
- **Enum Deserialization**: Unrecognized enum values (e.g. `category: "HACK"`) trigger `HttpMessageNotReadableException`, returning `HTTP 400 Bad Request` without exposing Java stack traces.

### 3.5 URL Validation & SSRF Audit
- **URL Sanitization**: Supplier website URLs in `UpdateSellerProfileRequest` are validated against strict HTTP/HTTPS regex patterns, rejecting dangerous schemes (`javascript:`, `data:`, `file:`).
- **SSRF Audit**: Confirmed zero outbound HTTP client components (`RestTemplate`, `WebClient`, `HttpClient`, `URLConnection`) are driven by user-supplied URLs. **SSRF attack surface is not present in the current architecture.**

### 3.6 Path Traversal & Filename Sanitization
- **File Uploads**: `DocumentService.normalizeFileName()` decodes URL-encoded traversal sequences (`%2e%2e%2f`), extracts the base filename across `/` and `\` separators, strips control characters/null bytes, and removes `..` sequences.
- **Storage Isolation**: Physical storage keys are strictly generated as `documents/<random-uuid>.<ext>`, preventing user-controlled disk overwrite or directory escape.

### 3.7 Preservation of Legitimate Chemical Data
- Validated that technical chemical nomenclature, formulas, and grades are preserved without destruction:
  - `"4-Hydroxycarbazole (99.5% USP)"`
  - `"α,β-Unsaturated Ketone Derivative"`
  - `"CAS: 52602-39-8, Formula: C12H9NO"`
  - `"USP / Ph. Eur."`
  - `"25kg Fiber Drum"`

---

## 4. Automated Security Test Matrix (`InputValidationSecurityTest`)

| # | Test Scenario / Attack Vector | Payload / Input | Expected Result | Actual Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | XSS in Product Name | `<script>alert('xss')</script>` | Stored as text without execution | **PASS** |
| 2 | XSS in Product Description | `<img src=x onerror=alert(1)>` | Stored as text without execution | **PASS** |
| 3 | XSS in RFQ Notes | `\"><script>alert(1)</script>` | Stored as text without execution | **PASS** |
| 4 | XSS in Quotation Notes | `javascript:alert(1)` | Stored as text without execution | **PASS** |
| 5 | XSS in Rejection Reason | `<iframe src=javascript:alert(1)>` | Stored as text without execution | **PASS** |
| 6 | SQL Injection in Search | `' OR '1'='1` | Parameterized search, no SQL error | **PASS** |
| 7 | JPQL Injection in Search | `'; DROP TABLE products; --` | Parameterized search, no SQL error | **PASS** |
| 8 | Malicious Sort Field | `passwordHash; DROP TABLE users;` | Replaced with default sort field | **PASS** |
| 9 | Malicious Sort Direction | `desc; DROP TABLE users;` | Replaced with default sort direction | **PASS** |
| 10 | Negative Page Number | `page = -5` | Bounded safely to page 0 | **PASS** |
| 11 | Negative Page Size | `size = -10` | Bounded safely to size 1 | **PASS** |
| 12 | Excessively Large Page Size | `size = 999999` | Clamped safely to size 100 | **PASS** |
| 13 | Non-numeric Page Parameter | `page = abc` | HTTP 400 Bad Request | **PASS** |
| 14 | Malformed Product UUID | `/products/not-a-valid-uuid/detail` | HTTP 400 Bad Request | **PASS** |
| 15 | Malformed RFQ UUID | `/rfqs/not-a-valid-uuid` | HTTP 400 Bad Request | **PASS** |
| 16 | Malformed PO UUID | `/orders/not-a-valid-uuid` | HTTP 400 Bad Request | **PASS** |
| 17 | Malformed Document UUID | `/documents/not-a-valid-uuid` | HTTP 400 Bad Request | **PASS** |
| 18 | Invalid Enum (Product Category) | `"category": "INVALID_HACK"` | HTTP 400 Bad Request | **PASS** |
| 19 | Invalid Enum (User Status) | `"status": "SUPER_ADMIN_STATUS"` | HTTP 400 Bad Request | **PASS** |
| 20 | Negative Quantity in RFQ | `quantity = -10.00` | HTTP 400 Bad Request | **PASS** |
| 21 | Zero Quantity in RFQ | `quantity = 0.00` | HTTP 400 Bad Request | **PASS** |
| 22 | Negative Price in Product | `price = -50.00` | HTTP 400 Bad Request | **PASS** |
| 23 | Overflow Numeric Price | `price = 1000000000000.00` | HTTP 400 Bad Request | **PASS** |
| 24 | Negative Lead Time in Offering | `leadTimeDays = -5` | HTTP 400 Bad Request | **PASS** |
| 25 | Past Quotation Validity Date | `validityDate = "2020-01-01"` | HTTP 400 Bad Request | **PASS** |
| 26 | Malicious Javascript URL | `website: "javascript:alert(1)"` | HTTP 400 Bad Request | **PASS** |
| 27 | Valid HTTPS URL | `website: "https://www.example.com"` | HTTP 200 OK | **PASS** |
| 28 | Path Traversal in Filename | `../../../../etc/passwd.pdf` | Sanitized to `passwd.pdf` | **PASS** |
| 29 | Role / Status Mass Assignment | `role: "ADMIN", status: "SUSPENDED"` | Ignored, defaulted safely | **PASS** |
| 30 | Chemical Data Preservation | `4-Hydroxycarbazole (99.5% USP)` | Exact symbols preserved | **PASS** |
| 31 | Technical Greek Notation | `α,β-Unsaturated Ketone Derivative` | Exact symbols preserved | **PASS** |

---

## 5. Regression & Build Status

```
========================================================================
Synthora Build & Verification Pipeline
========================================================================
[Previous Backend Test Count] : 337 tests
[New Security Tests Added]    : 31 tests (InputValidationSecurityTest)
[Total Backend Tests Run]     : 368 tests (0 Failures, 0 Errors, 0 Skipped)
[Backend Build Status]        : BUILD SUCCESS (Total time: 50.184 s)
[Frontend Next.js Build]      : 20/20 routes built successfully, 0 Type Errors
[Knowledge Graph AST Update]  : 1,814 nodes, 4,756 edges, 192 communities
========================================================================
```

---

## 6. List of Modified & Added Files

### Backend Source Files Modified:
- [`com/synthora/common/GlobalExceptionHandler.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/common/GlobalExceptionHandler.java): Added handlers for `MethodArgumentTypeMismatchException`, `HttpMessageNotReadableException`, `ConstraintViolationException`, `HandlerMethodValidationException`, `MissingServletRequestParameterException`, `MaxUploadSizeExceededException`, and `PropertyReferenceException`.
- [`com/synthora/product/ProductService.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/ProductService.java): Added bounded pageable creation (`createBoundedPageable`) and allowlisted product sort fields.
- [`com/synthora/product/apis/SupplierPublicController.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/apis/SupplierPublicController.java): Added bounded pageable sanitization (`sanitizePageable`) and allowlisted supplier sort fields.
- [`com/synthora/document/DocumentService.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/document/DocumentService.java): Enhanced `normalizeFileName()` to strip Windows path separators, encoded traversals, control characters, and null bytes.
- [`com/synthora/identity/dto/RegisterRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/identity/dto/RegisterRequest.java): Added `@Size` string length bounds.
- [`com/synthora/product/dto/CreateProductRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/dto/CreateProductRequest.java): Added `@Size`, `@DecimalMax`, and `@Max` bounds.
- [`com/synthora/product/dto/UpdateProductRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/dto/UpdateProductRequest.java): Added `@Size`, `@DecimalMax`, and `@Max` bounds.
- [`com/synthora/product/dto/ProductSupplierRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/product/dto/ProductSupplierRequest.java): Added `@Size`, `@DecimalMin`, `@DecimalMax`, and `@Max` bounds.
- [`com/synthora/rfq/dto/CreateRfqRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/rfq/dto/CreateRfqRequest.java): Added `@Size` and `@DecimalMax` bounds.
- [`com/synthora/rfq/dto/CreateQuotationRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/rfq/dto/CreateQuotationRequest.java): Added `@Size`, `@DecimalMax`, `@Max`, and `@Digits` constraints.
- [`com/synthora/rfq/dto/AcceptQuotationRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/rfq/dto/AcceptQuotationRequest.java): Added `@Size(max=2000)` constraint.
- [`com/synthora/rfq/dto/RejectQuotationRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/rfq/dto/RejectQuotationRequest.java): Added `@Size(max=2000)` constraint.
- [`com/synthora/order/dto/ShipOrderRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/order/dto/ShipOrderRequest.java): Added `@Size(max=100)` constraints.
- [`com/synthora/seller/dto/UpdateSellerProfileRequest.java`](file:///d:/Saisaket/Synthora/backend/src/main/java/com/synthora/seller/dto/UpdateSellerProfileRequest.java): Added `@Pattern` URL format validation and `@Size` bounds.
- [`resources/application.yml`](file:///d:/Saisaket/Synthora/backend/src/main/resources/application.yml): Configured `server.max-http-request-header-size: 16KB`.

### New Test Suites Created:
- [`com/synthora/security/InputValidationSecurityTest.java`](file:///d:/Saisaket/Synthora/backend/src/test/java/com/synthora/security/InputValidationSecurityTest.java): 31 automated security test cases.

---

## 7. Remaining Security Risks

As planned for subsequent hardening phases:
1. **File Content / Magic Byte Security**: Dedicated inspection of binary file signatures (e.g. Apache Tika magic byte validation) is scheduled for the file security hardening phase.
2. **Distributed Rate Limiting**: Current in-memory sliding-window rate limiting protects the login endpoint on single instances; distributed Redis-backed rate limiting will be evaluated for multi-node deployments.
3. **External Pen-Testing**: Dynamic application security testing (DAST) in a staging environment prior to GA production deployment.

---

## 8. Hard Stop Declaration

Phase 2H.4 is complete. All validation, injection defense, and error sanitization requirements are verified. Awaiting explicit user approval before proceeding to **Phase 2H.5 / Next Security Phase**.
