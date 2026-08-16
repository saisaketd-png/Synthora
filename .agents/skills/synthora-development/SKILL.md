---
name: synthora-development
description: Project-specific architectural rules, authorization constraints, and development guidelines for the Synthora B2B marketplace.
---

# Synthora Development Rules

## 1. Architectural Integrity
- **Inspect Before Modifying**: Always inspect the active codebase, database schema, and existing endpoints before writing code or making design assumptions.
- **Reuse Existing Constructs**: Prefer existing JPA entities, Spring Data repositories, service methods, DTOs, and frontend utility functions over creating duplicate abstractions.
- **Preserve Domain Boundaries**: Never duplicate existing domain relationships unnecessarily (e.g. do not store duplicate `supplier_id` or `buyer_id` on child tables when reachable through the parent RFQ).
- **Scope Discipline**: Keep all implementation changes strictly scoped to the requested feature. Do not redesign unrelated modules or refactor working code without explicit instruction.

## 2. Authentication & Authorization
- **Identity Source of Truth**: JWT Authentication is the sole authoritative source of user identity. Extract the user principal server-side via `Authentication.getName()`.
- **Zero Client Trust**: Never trust `buyerId`, `supplierId`, or role parameters provided in the request body or path for access control.
- **Server-Side Ownership Enforcement**: Always verify that the requested resource (RFQ, Quotation, Profile) belongs to the authenticated user using repository methods (e.g. `findByIdAndBuyerId`, `findByIdAndSupplierId`).
- **IDOR Protection**: Requests for resources not owned by the authenticated caller must return `404 Not Found` (or the established application response) to prevent data discovery or cross-tenant leaks.

## 3. Database & Migrations
- **Flyway Migrations**: All persistent schema modifications require a sequential Flyway migration script in `backend/src/main/resources/db/migration/` (e.g. `V11__...sql`).
- **Minimal Schema Changes**: Do not create or edit migrations unless the database schema actually changes.
- **Data Integrity**: Never invent database columns, fake seed values, or mock commercial data.

## 4. Verification & Testing Standards
- **Backend Verification**: Backend changes must be validated by running targeted tests (e.g. `mvn test -Dtest=...`) and passing full builds (`mvn clean test`).
- **Frontend Verification**: Frontend changes must pass type checking and production build validation (`npm run build`).
- **Factual Reporting**: Never claim a test, endpoint, or browser flow was executed unless it was genuinely run and verified in the environment.

## 5. Workflow Discipline
- **Plan First**: For substantial features or architectural decisions, produce and review an implementation plan before writing code.
- **Preserve API Contracts**: Maintain existing API contracts and response structures to prevent breaking frontend or downstream consumers.
