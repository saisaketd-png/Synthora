# Synthora Architecture Rules

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

This document defines the permanent software architecture rules of Synthora.

These rules are considered the foundation of the platform.

Any implementation that violates these rules must be rejected unless the architecture documentation is officially updated.

---

# 2. Architecture Philosophy

Synthora is designed using a modular domain-driven architecture.

Business domains remain independent while communicating through well-defined interfaces.

Every module should have a single responsibility.

Avoid tightly coupled modules.

---

# 3. Core Business Architecture

The marketplace follows a Product-First architecture.

Master Product

↓

Supplier Listings

↓

RFQ

↓

Quotation

↓

Business Conversation

Products belong to Synthora.

Supplier Listings belong to Companies.

Companies conduct business.

Users act on behalf of companies.

---

# 4. Marketplace Principles

There is only ONE Master Product for every chemical.

Many suppliers may create listings for the same Master Product.

Duplicate Master Products are not allowed.

Supplier Listings are never treated as Master Products.

---

# 5. Company Architecture

A Company is the commercial entity.

Users are identities.

Companies own:

- Listings
- Documents
- Subscription
- Reviews

Users never own business assets.

---

# 6. User Architecture

Platform Users

- Guest
- Buyer
- Supplier
- Administrator

Company Roles

- Owner (MVP)

Future

- Sales Manager
- Procurement Manager
- Employee
- Viewer

Platform Roles and Company Roles are independent.

---

# 7. Product Architecture

Master Product contains:

- Scientific Information
- CAS
- Formula
- Synonyms
- Applications
- Categories

Supplier Listing contains:

- Commercial Information
- Technical Specifications
- Variants
- Images
- Documents

Scientific data never belongs to suppliers.

---

# 8. Listing Architecture

One Company

↓

One Supplier Listing

↓

Many Variants

Each variant represents a sellable configuration.

Variants contain attribute values.

The architecture must support adding future attributes without redesigning the database.

---

# 9. RFQ Architecture

One RFQ references:

- One Buyer
- One Supplier Listing
- One Master Product

An RFQ is a procurement conversation.

Supplier quotations belong to RFQs.

Negotiation happens inside the RFQ thread.

Payments happen outside Synthora during the MVP.

---

# 10. Search Architecture

Search is Product-Centric.

Supported searches:

- Product Name
- CAS Number
- Synonyms
- Supplier
- Category

Search should support:

- Typo tolerance
- Autocomplete
- Intelligent ranking

Master Products appear as search results.

Supplier Listings appear inside Master Products.

---

# 11. Notification Architecture

Notifications exist only to bring users back into Synthora.

Supported channels:

- In-App
- Email

Communication should continue inside the platform.

---

# 12. Subscription Architecture

Subscriptions belong to Companies.

Not Users.

Sponsored Listings are independent advertising products.

Subscriptions and advertisements are separate business models.

---

# 13. Review Architecture

Reviews belong to Supplier Listings.

Not Master Products.

Not Companies.

Review scores should represent the supplier's offering.

---

# 14. SEO Architecture

Synthora owns every Master Product page.

Each Master Product has one canonical URL.

Supplier profile pages are independent.

Duplicate SEO pages are not allowed.

Never generate multiple product pages for identical chemicals.

---

# 15. Data Ownership

Synthora owns:

- Master Products
- Categories
- Scientific Information
- SEO

Suppliers own:

- Listings
- Variants
- Documents
- Commercial Data

Buyers own:

- RFQs
- Saved Items
- Reviews

---

# 16. Scalability Principles

Always design for:

- Global expansion
- Additional industries
- Multiple languages
- Multiple users per company
- Future mobile applications

Do not over-engineer the MVP.

Future capability should not increase current complexity unnecessarily.

---

# 17. Integration Philosophy

The MVP intentionally excludes:

- Payment Processing
- Logistics
- ERP Integration
- CRM Integration

Architecture should allow these integrations later.

Do not build placeholder implementations.

---

# 18. Database Philosophy

Use normalized relational design.

Avoid duplicated business data.

Use foreign keys.

Prefer reference tables over duplicated values.

Never denormalize without measurable benefit.

---

# 19. API Philosophy

REST-first architecture.

Business logic belongs in the backend.

Frontend should remain presentation-focused.

Never expose internal implementation details.

---

# 20. Security Philosophy

Authentication uses JWT.

Authorization follows least-privilege principles.

Passwords are never stored in plain text.

Sensitive files require authentication.

Phone numbers and protected contact details are hidden from guests.

---

# 21. Performance Philosophy

Prioritize:

- Search performance
- Product discovery
- RFQ workflow
- Dashboard responsiveness

Avoid unnecessary database queries.

Design for scalability.

---

# 22. Future Features

Future enhancements include:

- AI-assisted search
- AI recommendations
- Multi-language support
- Mobile applications
- ERP integration
- International marketplace
- Team collaboration
- Advanced analytics

Current implementation should remain compatible with future expansion.

---

# 23. Architectural Decisions That Must Never Change

Never change:

• One Master Product → Many Supplier Listings

• Company owns business assets

• Product-centric search

• RFQ-based procurement

• Synthora-owned product pages

• Supplier-owned profile pages

• Scientific data owned by Synthora

• Commercial data owned by Suppliers

These are permanent architectural principles.

---

# 24. Document Priority

If implementation conflicts with this document, implementation must be corrected unless the architecture has been officially revised.

This document is authoritative for all engineering decisions.
