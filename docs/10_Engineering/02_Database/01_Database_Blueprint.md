# KemKendra Database Blueprint

Version: 1.0

Status: Active

Last Updated: August 2026

---

# Purpose

This document defines the overall database architecture of KemKendra.

It establishes the principles, ownership boundaries, entity relationships and design philosophy before detailed table design begins.

This blueprint serves as the foundation for:

- Entity Relationship Diagram (ERD)
- PostgreSQL Schema
- Flyway Migrations
- Spring Boot JPA Entities

---

# Database Philosophy

KemKendra uses a normalized relational database.

Primary goals:

- Data Integrity
- Maintainability
- Scalability
- Performance
- Auditability

The database is the single source of truth.

Business logic belongs to the application layer.

---

# Database Engine

PostgreSQL

Reasons

- ACID Compliance
- Excellent Indexing
- JSON Support
- Full Text Search
- Mature Ecosystem
- Enterprise Ready

---

# Primary Key Strategy

Every primary entity uses:

UUID Version 7

Reasons

- Globally unique

- Better index locality

- Distributed system friendly

- Safer public identifiers

UUIDs should never be exposed directly to users.

Public reference numbers should be generated separately where required.

---

# Audit Strategy

Every major table should include:

created_at

created_by

updated_at

updated_by

deleted_at

deleted_by

version

Soft delete is preferred.

Optimistic locking should use the version column.

---

# Soft Delete Policy

Never permanently delete:

Users

Companies

Products

Listings

RFQs

Reviews

Administrative records

Historical information should remain available.

---

# Ownership Model

Users

↓

Companies

↓

Listings

↓

RFQs

↓

Reviews

Master Products remain independent and owned by KemKendra.

---

# Domain Ownership

Identity

Owns:

Users

Sessions

Authentication

---

Company

Owns:

Company

Members

Addresses

Documents

Verification

---

Product

Owns:

Master Products

Categories

Synonyms

Applications

Revisions

---

Listing

Owns:

Supplier Listings

Variants

Attributes

Images

Documents

---

RFQ

Owns:

RFQs

Messages

Quotations

Attachments

History

---

Search

Owns:

Search History

Saved Items

---

Notification

Owns:

Notifications

Email Queue

---

Subscription

Owns:

Plans

Subscriptions

Sponsored Listings

---

Review

Owns:

Reviews

Reports

---

Admin

Owns:

Audit Logs

Moderation Queue

Configuration

---

# Relationship Rules

One User

↓

Many Companies (Future)

One Company

↓

Many Listings

One Master Product

↓

Many Listings

One Listing

↓

Many Variants

One RFQ

↓

Many Messages

One RFQ

↓

Many Quotations

One Listing

↓

Many Reviews

---

# Database Principles

Avoid duplicated data.

Use foreign keys.

Normalize where practical.

Separate scientific data from commercial data.

Separate business ownership from user identity.

Avoid nullable columns when better normalization exists.

---

# Naming Standards

Tables

snake_case

Examples

master_product

supplier_listing

company_member

Columns

snake_case

Foreign Keys

<entity>_id

Examples

company_id

product_id

listing_id

Indexes

idx_<table>_<column>

Unique Constraints

uk_<table>_<column>

Foreign Keys

fk_<table>_<referenced_table>

---

# Future Readiness

The schema should support future:

Multi-company users

International expansion

Multi-language support

ERP integration

Mobile applications

Microservice extraction

Without major redesign.

---

# Engineering Workflow

Database Blueprint

↓

Database Standards

↓

Entity Relationship Diagram

↓

Table Specifications

↓

PostgreSQL Schema

↓

Indexes

↓

Flyway Migrations

↓

Spring Boot Entities

---

# Success Criteria

The database should be:

Reliable

Scalable

Normalized

Secure

Maintainable

Performant

Enterprise Ready

Every future table should comply with this blueprint.