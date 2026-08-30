# Product Engineering Specification

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

The Product module defines the scientific product catalogue of KemKendra.

Products are owned and managed by KemKendra.

Suppliers do not own products.

Suppliers create commercial listings for existing Master Products.

The Product module provides the canonical product database for the entire marketplace.

---

# 2. Scope

This module includes:

- Master Products
- Product Categories
- Product Synonyms
- Product Applications
- Product SEO
- Product Lifecycle
- Product Approval
- Product Revisions

This module excludes:

- Supplier Listings
- Commercial Information
- Pricing
- RFQs
- Supplier Documents

---

# 3. Responsibilities

The Product module is responsible for:

Maintaining scientific accuracy.

Preventing duplicate products.

Providing canonical product pages.

Managing SEO.

Managing scientific revisions.

Supporting supplier listings.

Supporting search.

---

# 4. Core Business Rules

One chemical = One Master Product.

Every Master Product belongs to KemKendra.

Suppliers cannot edit scientific information.

Suppliers may request new products.

Admins approve product creation.

Master Products are immutable except through authorized administrative changes.

Every Master Product has one canonical URL.

---

# 5. Product Lifecycle

Product Requested

↓

Admin Review

↓

Scientific Validation

↓

Master Product Created

↓

Published

↓

Available For Supplier Listings

↓

Scientific Updates (Revision History)

↓

Archived (If Required)

---

# 6. Database Entities

MasterProduct

Category

ProductSynonym

ProductApplication

ProductRevision

---

# 7. Relationships

Master Product

↓

Category

↓

Synonyms

↓

Applications

↓

Supplier Listings

↓

Search

↓

RFQs

↓

SEO

---

# 8. Scientific Information

Every Master Product may contain:

Product Name

CAS Number

Molecular Formula

Molecular Weight

IUPAC Name

Synonyms

Category

Description

Applications

Appearance

Storage Conditions

Scientific Notes

Hazard Information (Future)

Regulatory Information (Future)

---

# 9. Product Ownership

Owned by:

KemKendra

Editable by:

Administrators only

Suppliers may never directly edit:

CAS

Formula

Scientific Description

Categories

Synonyms

Applications

---

# 10. Supplier Interaction

Supplier searches existing Master Product.

If found

↓

Create Supplier Listing.

If not found

↓

Submit Product Request.

↓

Admin Review.

↓

Master Product Created.

↓

Supplier Listing Enabled.

---

# 11. Product Categories

Categories follow a hierarchical structure.

Example

API Intermediates

↓

Pyridine

↓

Fluorinated Pyridines

Every Product belongs to one category.

Future support for multiple categories may be added.

---

# 12. Product Synonyms

A product may have multiple synonyms.

Search should match:

Product Name

CAS Number

Synonyms

IUPAC Name

Synonyms improve discoverability but never create duplicate products.

---

# 13. Product Search

Search supports:

Product Name

CAS

Synonyms

Formula

Categories

Typo tolerance.

Autocomplete.

Product-first results.

---

# 14. SEO

Each product owns one canonical URL.

Example

/products/acetone

SEO fields include:

Title

Description

Keywords

Slug

Structured Data

Only administrators may modify SEO metadata.

---

# 15. Product Revisions

Scientific information changes require revision history.

Revision stores:

Previous Value

New Value

Changed By

Reason

Timestamp

Never overwrite important scientific information without recording a revision.

---

# 16. Validation Rules

CAS Number must be unique.

Product Name required.

Category required.

Scientific fields validated.

Slug unique.

Synonyms cannot duplicate Product Name.

---

# 17. Security Rules

Guests

Can browse products.

Registered users

Can view detailed information.

Suppliers

Can request products.

Administrators

Can create, edit, publish and archive Master Products.

Scientific information is protected.

---

# 18. Error Handling

Duplicate CAS.

Duplicate Product.

Invalid CAS format.

Category missing.

Unauthorized modification.

Scientific validation failed.

Meaningful business-friendly responses only.

---

# 19. Notifications

Product Request Submitted.

Product Approved.

Product Rejected.

Additional Information Requested.

Product Published.

---

# 20. Future Expansion

International product database.

Multi-language products.

Regulatory information.

Safety documents.

Chemical structures.

Product version comparison.

AI-assisted product enrichment.

---

# 21. Acceptance Criteria

Administrators can:

Create Master Products.

Edit scientific information.

Manage categories.

Publish products.

Archive products.

Suppliers can:

Search products.

Request new products.

Create listings after approval.

Buyers can:

Search products.

Compare suppliers.

Send RFQs.

Every Master Product maintains one canonical identity across the platform.