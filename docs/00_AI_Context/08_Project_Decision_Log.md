# Synthora Project Decision Log

Version: 1.0

Status: Active

Purpose

This document records all major architectural, business and engineering decisions made during the development of Synthora.

The objective is to preserve the reasoning behind important decisions so future development remains consistent.

This document should only contain long-term decisions.

Do not record temporary implementation details.

---

# Decision Template

## Decision ID

ADR-001

### Date

YYYY-MM-DD

### Category

Architecture

### Title

Short descriptive title

### Decision

Describe exactly what was decided.

### Reason

Explain why this decision was made.

### Alternatives Considered

List important alternatives.

### Consequences

Describe how this affects the project.

### Status

Accepted

Possible values

- Proposed
- Accepted
- Deprecated
- Superseded

---

# Decisions

## ADR-001

Category

Architecture

Title

Master Product Architecture

Decision

Synthora will follow a Product-First marketplace architecture.

One Master Product can have multiple Supplier Listings.

Reason

Prevents duplicate product pages.

Improves SEO.

Creates a canonical product catalogue.

Allows supplier comparison.

Alternatives

Supplier-owned products.

Reason for rejection

Creates duplicate pages and fragmented search results.

Status

Accepted

---

## ADR-002

Category

Architecture

Title

Product Ownership

Decision

Master Products are owned by Synthora.

Supplier Listings are owned by Companies.

Reason

Scientific information should remain consistent while commercial information differs by supplier.

Status

Accepted

---

## ADR-003

Category

Business

Title

Supplier Listing Workflow

Decision

Suppliers must search for an existing Master Product before requesting a new product.

If no Master Product exists, they submit a Product Request for moderation.

Reason

Avoid duplicate products and maintain catalogue quality.

Status

Accepted

---

## ADR-004

Category

Architecture

Title

RFQ Workflow

Decision

One RFQ references one Product and one Supplier Listing.

Reason

Keeps procurement simple and traceable.

Status

Accepted

---

## ADR-005

Category

Search

Title

Product-Centric Search

Decision

Search results display Master Products.

Supplier Listings are shown inside the Master Product page.

Reason

Improves user experience and SEO while preventing duplicate search results.

Status

Accepted

---

## ADR-006

Category

Architecture

Title

Company Ownership Model

Decision

Business assets belong to Companies, not individual Users.

Reason

Supports multiple users per company and enterprise scalability.

Status

Accepted

---

## ADR-007

Category

Engineering

Title

Flexible Variant Attributes

Decision

Supplier Listing Variants use a hybrid attribute system combining fixed procurement fields with extensible technical attributes.

Reason

Supports future expansion without database redesign.

Status

Accepted

---

## ADR-008

Category

Engineering

Title

Notification Strategy

Decision

MVP notifications use In-App and Email channels.

No notification preference settings will be provided in the MVP.

Reason

Keep the user experience simple and encourage users to return to Synthora.

Status

Accepted

---

## ADR-009

Category

Business

Title

Subscription Strategy

Decision

The Free plan initially allows unlimited listings to encourage supplier adoption.

Restrictions may be introduced after marketplace growth.

Reason

Marketplace liquidity is more important than early monetization.

Status

Accepted

---

## ADR-010

Category

Engineering

Title

AI Context System

Decision

All AI-assisted development must follow the documents in docs/00_AI_Context as the primary source of truth.

Reason

Ensures consistency across all AI-generated code and documentation.

Status

Accepted