# Synthora Database Standards

Version: 1.0

Status: Active

Last Updated: August 2026

---

# Purpose

This document defines the database standards used throughout Synthora.

Every table, column, relationship, index and migration must comply with these standards.

Consistency is more important than personal preference.

---

# 1. Database Engine

Database

PostgreSQL 17+

Character Set

UTF-8

Timezone

UTC

Application converts timestamps to user timezone.

---

# 2. Primary Keys

Every primary entity uses

UUID Version 7

Column Name

id

Example

id UUID PRIMARY KEY

Never expose UUIDs publicly.

Use business reference numbers where appropriate.

---

# 3. Timestamp Fields

Every major table includes

created_at

updated_at

Use

TIMESTAMP WITH TIME ZONE

Store timestamps in UTC.

---

# 4. Audit Fields

Every business table should include

created_by

updated_by

deleted_at

deleted_by

version

Audit fields may be omitted only for lookup/reference tables.

---

# 5. Soft Delete

Use soft delete for

Users

Companies

Products

Listings

RFQs

Reviews

Subscriptions

Notifications

Do not permanently delete business data.

Reference tables may use hard delete.

---

# 6. Versioning

Use optimistic locking.

Column

version

Increment automatically on update.

---

# 7. Naming Conventions

Tables

snake_case

Examples

user

company

master_product

supplier_listing

Columns

snake_case

Foreign Keys

<entity>_id

Examples

company_id

listing_id

product_id

---

# 8. Foreign Keys

Every relationship uses explicit foreign keys.

Foreign keys should be indexed.

Avoid nullable foreign keys unless required by business rules.

---

# 9. Cascade Rules

Preferred

RESTRICT

Use CASCADE only where ownership is absolute.

Examples

Listing Images

↓

Delete Listing

↓

Delete Images

Never cascade delete Companies, Products or RFQs.

---

# 10. Unique Constraints

Examples

email

company_slug

product_slug

cas_number (when available)

Reference Number

Unique constraints should have descriptive names.

---

# 11. Lookup Tables vs ENUM

Prefer lookup tables for values likely to change.

Examples

Business Type

Verification Status

Subscription Plan

Categories

Use ENUM only for stable internal values.

Examples

Gender (if ever required)

Binary system flags

Status values that will never change

---

# 12. Index Strategy

Always index

Primary Keys

Foreign Keys

Search Fields

Unique Fields

Frequently filtered columns

Composite indexes should match query patterns.

---

# 13. JSON Usage

Use JSONB only for

Flexible attributes

Configuration

Metadata

Do not store relational data inside JSON.

---

# 14. Text Fields

Short text

VARCHAR

Long descriptions

TEXT

Avoid unnecessarily large VARCHAR lengths.

---

# 15. Numeric Types

Quantity

NUMERIC

Price

NUMERIC(18,4)

Percentage

NUMERIC(5,2)

Rating

NUMERIC(2,1)

Never use floating-point types for business values.

---

# 16. Boolean Fields

Use BOOLEAN.

Avoid integer flags.

Examples

is_verified

is_active

is_deleted

---

# 17. File Storage

Database stores

Metadata only.

Files stored externally.

Store

Filename

Content Type

File Size

Storage Path

Checksum (Future)

Never store large binary files directly in PostgreSQL.

---

# 18. Slugs

Public entities should have slugs.

Examples

Company

Product

Category

Slug rules

Unique

Lowercase

Hyphen separated

SEO friendly

---

# 19. Reference Numbers

Human-readable identifiers.

Examples

RFQ-2026-000001

CMP-2026-000045

REV-2026-000182

Never expose UUIDs in the UI.

---

# 20. Search Optimization

Index

Product Name

CAS Number

Synonyms

Company Name

Slugs

Category

Search history should never slow primary search queries.

---

# 21. Full Text Search

Prepare schema for PostgreSQL Full Text Search.

Future support

Product Search

Company Search

Synonyms

Descriptions

---

# 22. Transactions

Critical workflows must execute inside transactions.

Examples

Company Verification

Listing Approval

RFQ Submission

Subscription Upgrade

Avoid long-running transactions.

---

# 23. Migrations

All schema changes use Flyway.

Never modify production tables manually.

Every schema change must have a migration.

---

# 24. Security

Never store

Plain passwords

Tokens

Secrets

Sensitive data must be encrypted where required.

---

# 25. Performance

Avoid

N+1 relationships

Unindexed joins

Large text scans

Repeated data

Normalize before optimizing.

---

# 26. Documentation

Every table should include

Purpose

Owner Domain

Relationships

Indexes

Constraints

This documentation should remain synchronized with the schema.

---

# 27. Success Criteria

The Synthora database must be

Consistent

Normalized

Auditable

Performant

Scalable

Maintainable

Enterprise Ready

Every future table must follow these standards.