# KemKendra Coding Standards

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

This document defines the coding standards for the KemKendra codebase.

All developers and AI assistants must follow these standards to ensure consistency, maintainability and readability.

Consistency is more important than personal coding preferences.

---

# 2. General Principles

Write code that is:

- Simple
- Readable
- Predictable
- Reusable
- Testable
- Maintainable

Prefer clarity over cleverness.

---

# 3. Naming Conventions

Use meaningful names.

Good

CompanyService

SupplierListingRepository

MasterProductController

Bad

Service1

Helper

Manager

TempClass

Names should clearly describe their purpose.

---

# 4. Java Standards

Classes

PascalCase

Example

MasterProductService

SupplierListingController

Methods

camelCase

Example

createListing()

approveCompany()

Variables

camelCase

Constants

UPPER_SNAKE_CASE

Packages

lowercase

Example

com.kemkendra.product

---

# 5. Spring Boot Structure

Each domain should follow:

domain/

controller/

service/

repository/

entity/

dto/

mapper/

validator/

exception/

specification/

The same structure should be used consistently across every business domain.

---

# 6. Entity Rules

Every entity should:

- Have a single responsibility
- Use UUID v7 as primary key
- Include audit fields
- Support optimistic locking where required

Never place business logic inside entity classes.

---

# 7. DTO Rules

Never expose entities directly.

Always use DTOs.

Separate DTOs for:

- Request
- Response

Never reuse one DTO for unrelated operations.

---

# 8. Repository Rules

Repositories should only perform data access.

No business logic.

Use Spring Data JPA wherever practical.

---

# 9. Service Rules

Business logic belongs here.

Services should:

- Validate business rules
- Coordinate repositories
- Publish events if needed
- Handle transactions

Services should never return entities directly to controllers.

---

# 10. Controller Rules

Controllers should:

- Receive requests
- Validate input
- Call services
- Return responses

Controllers should remain thin.

---

# 11. Validation

Validate at multiple levels.

Frontend

↓

Backend

↓

Database

Never rely on a single validation layer.

---

# 12. Exception Handling

Use centralized exception handling.

Return consistent error responses.

Never expose stack traces.

Create domain-specific exceptions where appropriate.

---

# 13. Logging

Use structured logging.

Log:

- Authentication events
- RFQ creation
- Listing approval
- Verification
- Errors

Never log passwords, tokens or sensitive information.

---

# 14. API Standards

REST endpoints should use nouns.

Good

/api/products

/api/listings

/api/rfqs

Bad

/getProducts

/doSearch

/updateSomething

Use HTTP methods correctly.

GET

POST

PUT

PATCH

DELETE

---

# 15. JSON Standards

Use camelCase.

Return consistent response structures.

Avoid deeply nested JSON.

Return only required fields.

---

# 16. Frontend Standards

Use TypeScript everywhere.

Avoid JavaScript files.

Organize by business domain.

Prefer reusable components.

Avoid duplicated UI.

---

# 17. React Standards

Prefer:

Functional Components

React Hooks

Composition

Avoid:

Large monolithic components.

Components should ideally have a single responsibility.

---

# 18. Styling Standards

Use Tailwind CSS.

Do not write unnecessary custom CSS.

Keep utility classes organized.

Extract repeated patterns into reusable UI components.

---

# 19. State Management

Keep state as local as possible.

Avoid global state unless necessary.

Server state should remain on the backend.

---

# 20. Database Standards

Never hardcode SQL.

Use migrations.

Use indexes appropriately.

Respect foreign keys.

Avoid duplicated data.

---

# 21. Testing Standards

Every important feature should include:

Unit Tests

Integration Tests

Validation Tests

Critical business workflows should be tested before release.

---

# 22. Git Standards

Branch naming

feature/rfq-workflow

feature/product-search

bugfix/listing-images

Commit messages

feat: Add supplier listing approval

fix: Resolve RFQ validation issue

refactor: Simplify search service

docs: Update API documentation

Avoid vague commit messages.

---

# 23. Documentation

Update documentation whenever:

Business rules change

Database changes

API changes

Architecture changes

Documentation is part of development.

---

# 24. AI Code Generation Rules

AI-generated code must:

Follow project architecture.

Follow folder structure.

Reuse existing components.

Avoid duplicate implementations.

Respect naming conventions.

Do not introduce unnecessary abstractions.

Always prefer consistency with the existing codebase.

---

# 25. Things Never To Do

Never

- Mix business domains

- Bypass service layer

- Expose entities directly

- Duplicate business logic

- Ignore validation

- Hardcode configuration

- Create God classes

- Add unused dependencies

- Ignore documentation

Code quality always takes priority over development speed.

---

# 26. Document Priority

This document defines the official coding standards for KemKendra.

All code generated by developers or AI assistants must comply with these standards unless an approved technical decision explicitly overrides them.

This document is part of the official KemKendra AI Context.