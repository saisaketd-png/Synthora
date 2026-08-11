# 1. SupplierListing

## Purpose

Represents a Company's commercial listing for a Master Product.

The Supplier Listing acts as the commercial container for all variants offered by the supplier.

Commercial specifications are stored in Listing Variants.

---

## Columns

| Column | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID v7 | Yes | Primary Key |
| reference_number | VARCHAR(30) | Yes | Public Identifier |
| company_id | UUID | Yes | FK |
| master_product_id | UUID | Yes | FK |
| listing_title | VARCHAR(255) | Yes | |
| slug | VARCHAR(255) | Yes | Company Product URL |
| short_description | TEXT | No | |
| listing_status_id | UUID | Yes | Lookup FK |
| approval_status_id | UUID | Yes | Lookup FK |
| visibility_status_id | UUID | Yes | Lookup FK |
| is_featured | BOOLEAN | Yes | Default FALSE |
| is_active | BOOLEAN | Yes | Default TRUE |
| created_at | TIMESTAMPTZ | Yes | |
| created_by | UUID | No | |
| updated_at | TIMESTAMPTZ | Yes | |
| updated_by | UUID | No | |
| deleted_at | TIMESTAMPTZ | No | |
| deleted_by | UUID | No | |
| version | INTEGER | Yes | Optimistic Lock |

---

## Constraints

Primary Key

id

Unique

reference_number

company_id + master_product_id

slug

---

## Indexes

company_id

master_product_id

listing_status_id

approval_status_id

visibility_status_id

slug

deleted_at

---

## Business Rules

One Company may have only one active Listing for a Master Product.

Multiple Companies may create Listings for the same Master Product.

Only verified Companies may publish Listings.

Supplier Listings never store scientific information.

Commercial specifications belong to Listing Variants.

Listing approval is required before publication.

---

## Validation

Company required.

Master Product required.

Listing Title required.

Unique Company + Master Product.

Slug must be unique.

---

## Security

Only Company Owners and authorized Company Members may manage Listings.

Administrators may approve, reject or suspend Listings.

---

# 2. ListingVariant

## Purpose

Represents one commercial variant of a Supplier Listing.

Each Variant represents a specific Grade, Purity, Packaging or Commercial Specification.

RFQs always reference a Listing Variant.

---

## Columns

| Column | Type | Required | Notes |
|---------|------|----------|------|
| id | UUID v7 | Yes | Primary Key |
| reference_number | VARCHAR(30) | Yes | Public Identifier |
| supplier_listing_id | UUID | Yes | FK |
| variant_name | VARCHAR(255) | Yes | |
| purity | VARCHAR(100) | No | Example: 99.5% |
| grade | VARCHAR(100) | No | Pharma, Industrial, Technical |
| packaging_size | NUMERIC(18,4) | No | |
| packaging_unit | VARCHAR(30) | No | Kg, Drum, Bottle |
| minimum_order_quantity | NUMERIC(18,4) | No | |
| moq_unit | VARCHAR(30) | No | |
| lead_time_days | INTEGER | No | |
| supply_capacity | VARCHAR(255) | No | |
| country_of_origin | VARCHAR(100) | No | |
| hsn_code | VARCHAR(50) | No | Future |
| notes | TEXT | No | |
| is_default | BOOLEAN | Yes | Default FALSE |
| created_at | TIMESTAMPTZ | Yes | |
| updated_at | TIMESTAMPTZ | Yes | |
| version | INTEGER | Yes | Optimistic Lock |

---

## Constraints

Primary Key

id

Unique

reference_number

---

## Indexes

supplier_listing_id

purity

grade

is_default

---

## Business Rules

One Listing may contain multiple Variants.

Exactly one Variant must be marked as the default.

Different Variants may have different Grades.

Different Variants may have different Purity Levels.

Different Variants may have different Packaging.

Different Variants may have different MOQ.

Different Variants may have different Lead Times.

RFQs reference Listing Variants rather than Supplier Listings.

---

# 3. AttributeDefinition

## Purpose

Defines reusable Variant Attributes.

Examples

Purity

Grade

Color

Packaging

Particle Size

Moisture

---

## Columns

| Column | Type | Required |
|---------|------|----------|
| id | UUID v7 | Yes |
| attribute_name | VARCHAR(150) | Yes |
| data_type | VARCHAR(50) | Yes |
| unit | VARCHAR(50) | No |
| is_active | BOOLEAN | Yes |
| created_at | TIMESTAMPTZ | Yes |

---

## Business Rules

Attributes are managed only by Administrators.

Attributes are reusable across all Listings.

---

# 4. VariantAttributeValue

## Purpose

Stores dynamic attribute values for Listing Variants.

---

## Columns

| Column | Type | Required |
|---------|------|----------|
| id | UUID v7 | Yes |
| listing_variant_id | UUID | Yes |
| attribute_definition_id | UUID | Yes |
| attribute_value | TEXT | Yes |
| created_at | TIMESTAMPTZ | Yes |

---

## Business Rules

Unlimited attributes supported.

Supports future extensibility.

---

# 5. ListingImage

## Purpose

Stores supplier-owned Listing and Variant images.

---

## Columns

| Column | Type | Required |
|---------|------|----------|
| id | UUID v7 | Yes |
| supplier_listing_id | UUID | Yes |
| listing_variant_id | UUID | No |
| image_category_id | UUID | Yes |
| file_name | VARCHAR(255) | Yes |
| storage_path | TEXT | Yes |
| display_order | INTEGER | Yes |
| alt_text | VARCHAR(255) | No |
| is_primary | BOOLEAN | Yes |
| uploaded_at | TIMESTAMPTZ | Yes |

---

## Business Rules

Images belong to Supplier Listings.

Variant-specific images are optional.

Master Products never own images.

Only one primary image per Listing.

Display order supported.

---

# 6. ListingDocument

## Purpose

Stores supplier-owned commercial and technical documents.

Examples

COA

MSDS

Technical Data Sheet

Product Specification

Certificate

Brochure

---

## Columns

| Column | Type | Required |
|---------|------|----------|
| id | UUID v7 | Yes |
| supplier_listing_id | UUID | Yes |
| listing_variant_id | UUID | No |
| document_type_id | UUID | Yes |
| file_name | VARCHAR(255) | Yes |
| storage_path | TEXT | Yes |
| mime_type | VARCHAR(100) | Yes |
| file_size | BIGINT | Yes |
| document_version | INTEGER | Yes |
| effective_date | DATE | No |
| expiry_date | DATE | No |
| uploaded_at | TIMESTAMPTZ | Yes |

---

## Business Rules

Files are stored externally.

Database stores only metadata.

Documents belong to Supplier Listings.

Variant-specific documents are supported.

Document history is preserved through versioning.

Documents are never overwritten.

---

# Lookup Tables Used

AvailabilityStatus

ApprovalStatus

VisibilityStatus

ImageCategory

DocumentType

AttributeDataType

---

# Future Tables

ListingStatusHistory

Stores the complete moderation history of every Listing.

ListingAnalytics

Stores Listing views, RFQ count, engagement metrics and future analytics.