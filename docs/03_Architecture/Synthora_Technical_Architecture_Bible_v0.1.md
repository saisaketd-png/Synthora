# Synthora Technical Architecture Bible (Version 0.1)

## 1. Technology Stack (MVP)

Frontend - Next.js - TypeScript - Tailwind CSS - shadcn/ui - TanStack
Query

Backend - Spring Boot - Java - Spring Security - JWT Authentication

Database - PostgreSQL - Prisma (schema-first planning; JPA
implementation if preferred)

Storage - S3-compatible object storage (future) - Local storage during
development

Deployment - Frontend: Vercel - Backend: Railway/Render (MVP) -
Database: Neon PostgreSQL

------------------------------------------------------------------------

## 2. Core Architecture

Marketplace ├── Public ├── Authenticated Buyer ├── Supplier Workspace
└── Admin Workspace

Public marketplace remains the same after login. Authentication unlocks
additional capabilities.

------------------------------------------------------------------------

## 3. Core Entities

Users Companies Master Products Supplier Listings Categories RFQs RFQ
Replies Notifications Saved Products Saved Suppliers Subscriptions
Verification Requests Documents Product Images

------------------------------------------------------------------------

## 4. Product Model

One Master Product ↓ Many Supplier Listings ↓ Many RFQs

Master products are curated by Synthora. Suppliers attach listings to
existing products or request creation of new master products.

------------------------------------------------------------------------

## 5. Supplier Onboarding

Register ↓ Become Supplier ↓ Create Company ↓ Verification Submission ↓
Admin Approval ↓ Create Listings

Drafts are supported before publishing.

------------------------------------------------------------------------

## 6. Authentication

Roles - USER - SUPPLIER - ADMIN

Guests can browse. Registered users unlock RFQs and saved items.
Supplier role unlocks Supplier Workspace.

------------------------------------------------------------------------

## 7. Permissions

Guest - Browse - Search - View products - View suppliers

Buyer - RFQs - Saved items - Notifications - View supplier contact
details

Supplier - Company management - Product listings - RFQs - Verification -
Subscription

Admin - Moderation - Categories - Verification - Reports - CMS

------------------------------------------------------------------------

## 8. Search Strategy

MVP - PostgreSQL Full Text Search

Supports - Product Name - CAS Number - Synonyms - Supplier - Category -
City - State

Ranking 1. Sponsored 2. Exact Match 3. CAS Match 4. Product Match 5.
Verified Supplier 6. Related Products

------------------------------------------------------------------------

## 9. File Storage

Company Logo Company Banner Product Images Chemical Structure COA MSDS
TDS Brochure Verification Documents

Verification documents remain private.

------------------------------------------------------------------------

## 10. API Modules

Authentication Users Companies Products Supplier Listings Categories
RFQs Notifications Saved Items Verification Subscriptions Admin

------------------------------------------------------------------------

## 11. Performance

-   Server-side rendering for SEO pages
-   Pagination on listings
-   Lazy image loading
-   Optimized metadata
-   CDN for assets (future)

------------------------------------------------------------------------

## 12. Security

-   JWT
-   Password hashing
-   Role-based access
-   Input validation
-   Rate limiting
-   Audit logging (future)

------------------------------------------------------------------------

## 13. Scaling Strategy

0--100 users - Single backend - Single PostgreSQL database

100--1,000 users - CDN - Background jobs - Optimized indexing

1,000--10,000+ users - Search engine - Object storage - Horizontal
backend scaling
