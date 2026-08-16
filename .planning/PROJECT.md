# Synthora B2B Marketplace

## Project Overview
Synthora is an enterprise B2B chemicals and pharmaceutical procurement marketplace connecting verified buyers and suppliers.

## Technology Stack
- **Backend**: Java 21, Spring Boot 3.4.1, Spring Data JPA, Hibernate ORM, Flyway
- **Database**: PostgreSQL 18.3 (`marketplace` / `synthora` schema)
- **Security**: Spring Security 6, Stateless JWT Authentication, Method Security (`@PreAuthorize`)
- **Frontend**: Next.js 16.3 (Turbopack, App Router), React 19, TypeScript, Tailwind CSS
- **Workflow Tools**: GSD (Get Shit Done), Knowledge Graph (Graphify), Antigravity Custom Skills

## Architecture Summary
- **Buyer Workflow**: Product catalog search &rarr; RFQ creation &rarr; Supplier assignment &rarr; Quotation review & revision comparison &rarr; Order decision.
- **Supplier Workflow**: Inbox &rarr; RFQ detail inspection &rarr; Quotation submission (with automatic version tracking) &rarr; Status transition to `QUOTED`.
- **Identity & Roles**: `UserRole.USER` / `UserRole.BUYER`, `UserRole.SUPPLIER`, `UserRole.ADMIN`.
