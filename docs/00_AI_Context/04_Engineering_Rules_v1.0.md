# KemKendra Engineering Rules

Version: 1.0

Status: Active

Last Updated: August 2026

---

# 1. Purpose

This document defines the engineering principles for building KemKendra.

Every implementation should prioritize maintainability, scalability, consistency and simplicity.

Code should be written for long-term maintenance rather than short-term speed.

---

# 2. Engineering Philosophy

Engineering decisions should prioritize:

- Simplicity
- Readability
- Maintainability
- Scalability
- Performance
- Security

Avoid clever solutions when a simpler solution exists.

Readable code is preferred over complex code.

---

# 3. Development Principles

Every feature should be:

- Modular
- Independent
- Reusable
- Testable
- Documented

Avoid tightly coupled implementations.

---

# 4. Single Responsibility Principle

Each module should have one clear responsibility.

Examples

Authentication handles authentication.

Search handles searching.

RFQ handles procurement workflow.

Notifications handle notifications.

Business logic should never leak into unrelated modules.

---

# 5. Domain Driven Development

Organize the project by business domains.

Examples

Authentication

Company

Product

Listing

RFQ

Search

Notification

Subscription

Admin

Do not organize by controller, service or repository at the top level.

Business domains come first.

---

# 6. Backend Rules

Business logic belongs in the backend.

The frontend should never contain business rules.

Validation should always exist in the backend even if frontend validation exists.

Never trust client-side data.

---

# 7. Frontend Rules

Frontend responsibilities

- Display information
- Validate user input
- Manage application state
- Communicate with APIs

The frontend should remain lightweight.

Business decisions belong to backend services.

---

# 8. Database Rules

The database is the source of truth.

Avoid duplicated business data.

Normalize where practical.

Every relationship should use foreign keys.

Never bypass database constraints.

---

# 9. API Rules

REST-first architecture.

Every endpoint should:

- Validate input
- Return consistent responses
- Return meaningful errors
- Protect sensitive information

Avoid inconsistent endpoint naming.

---

# 10. Error Handling

Never expose stack traces.

Return meaningful messages.

Log technical details internally.

Every error should be actionable.

---

# 11. Logging

Log important events.

Examples

- Login
- Registration
- Company verification
- RFQ creation
- Product approval
- Listing approval

Avoid excessive logging.

Never log passwords or sensitive information.

---

# 12. Security

Always validate:

- Authentication
- Authorization
- Ownership

Users should never access resources they do not own.

Protect every sensitive endpoint.

---

# 13. File Upload Rules

Validate:

- File type
- File size
- Allowed extensions

Store files outside the database.

Never trust uploaded filenames.

Generate unique storage names.

---

# 14. Search Rules

Search must remain fast.

Support

- Product search
- CAS search
- Supplier search
- Typo tolerance

Avoid expensive database queries.

Optimize using indexes.

---

# 15. Performance

Avoid

- N+1 queries
- Duplicate API calls
- Unnecessary rendering
- Unused data loading

Optimize only after measuring.

Do not optimize prematurely.

---

# 16. Reusability

Before creating a new component, service or utility:

Check whether an existing implementation can be reused.

Avoid duplication.

---

# 17. Documentation

Every important module should include:

Purpose

Responsibilities

Dependencies

Business Rules

Future Expansion Notes

Documentation should evolve with the code.

---

# 18. Configuration

Never hardcode values that may change.

Examples

- RFQ expiry
- File size limits
- Allowed document types
- Subscription limits

Use centralized configuration.

---

# 19. Feature Development Workflow

Every new feature should follow this order:

1. Requirements

2. Engineering Specification

3. Database Changes

4. Backend Implementation

5. API

6. Frontend

7. Testing

8. Documentation

Never skip engineering specifications.

---

# 20. Backward Compatibility

New implementations should avoid breaking existing APIs or database structures whenever possible.

Plan migrations carefully.

---

# 21. Scalability

Assume the platform will grow.

Avoid designs that require major rewrites for:

- Multiple users per company
- Global expansion
- Additional product categories
- New subscription plans

---

# 22. AI Development Rules

AI-generated code must:

- Follow project architecture
- Respect existing folder structure
- Reuse existing components
- Avoid unnecessary libraries
- Never replace existing business logic without justification

Every generated implementation should match the official documentation.

---

# 23. Quality Standards

Before considering a feature complete:

✔ Business logic implemented

✔ Validation complete

✔ Error handling complete

✔ Responsive UI

✔ Documentation updated

✔ No duplicate code

✔ Code reviewed

---

# 24. Things Never To Do

Never

- Duplicate business logic

- Hardcode configuration

- Bypass validation

- Ignore documentation

- Mix unrelated responsibilities

- Break architecture rules

- Generate unnecessary abstractions

- Add libraries without clear benefit

- Implement features that contradict approved specifications

Engineering consistency is more valuable than rapid implementation.

---

# 25. Document Priority

This document defines how KemKendra must be engineered.

If implementation conflicts with these engineering rules, implementation should be revised unless an approved engineering decision explicitly overrides them.

This document is part of the official KemKendra AI Context.