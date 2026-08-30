# KemKendra Antigravity Master Prompt

Version: 1.0

Status: Active

Last Updated: August 2026

---

# Purpose

You are assisting in the development of KemKendra.

KemKendra is an enterprise-grade B2B marketplace for the chemical and pharmaceutical industry.

You are not building a demo.

You are not building a startup landing page.

You are building production-quality enterprise software.

Every output must respect the official KemKendra documentation.

---

# Project Identity

Project Name

KemKendra

Industry

Chemical & Pharmaceutical B2B Marketplace

Primary Market

India (MVP)

Future Market

Global

Primary Users

• Procurement Managers

• Purchasing Teams

• Manufacturers

• Exporters

• Traders

• Distributors

This platform is designed for business professionals.

Never design for casual consumers.

---

# Core Business Architecture

Always remember

One Master Product

↓

Multiple Supplier Listings

↓

Buyer chooses Supplier

↓

RFQ

↓

Quotation

↓

Business Conversation

↓

Offline Deal

Never violate this architecture.

---

# Data Ownership

KemKendra owns

• Master Products

• Categories

• Scientific Information

• SEO

Suppliers own

• Listings

• Commercial Information

• Images

• Documents

• Variants

Buyers own

• RFQs

• Saved Items

• Reviews

Never mix ownership.

---

# Design Philosophy

Every screen should feel

Enterprise

Professional

Modern

Premium

Minimal

Trustworthy

Industrial

Scientific

Avoid

Consumer UI

Gaming UI

Flashy gradients

Heavy glassmorphism

Playful animations

Bright decorative colors

The interface should inspire confidence.

---

# UX Philosophy

Always optimize for

Fast procurement

Fast product discovery

Low friction

Professional workflows

Consistency

Never optimize for entertainment.

---

# Search Rules

Search is Product First.

Support

• Product Name

• CAS

• Synonyms

• Supplier

• Category

Autocomplete

Keep suggestions clean.

Do not overload with information.

Support typo tolerance.

Master Products appear in search.

Supplier Listings appear inside Master Products.

---

# RFQ Rules

One RFQ

↓

One Supplier

↓

One Product

RFQs are professional procurement requests.

Business conversations remain inside KemKendra.

Payments remain outside KemKendra during MVP.

---

# Supplier Rules

Supplier registers company.

↓

Company verified.

↓

Supplier searches Master Product.

↓

If product exists

↓

Create Listing.

↓

If product does not exist

↓

Submit Product Request.

↓

Admin reviews.

↓

Master Product created.

↓

Supplier Listing created.

Never allow suppliers to create Master Products directly.

---

# Engineering Principles

Always

Reuse components.

Keep modules independent.

Write scalable code.

Write maintainable code.

Write readable code.

Keep business logic inside backend.

Avoid duplication.

Respect documentation.

---

# Backend Principles

Spring Boot

Java

PostgreSQL

JWT

REST

Business logic belongs inside services.

Controllers remain thin.

Repositories access data only.

Never bypass the service layer.

---

# Frontend Principles

Next.js

TypeScript

Tailwind CSS

Responsive

Accessible

Reusable components

Avoid duplicated UI.

Avoid unnecessary state.

Never place business logic in frontend.

---

# Database Principles

Use PostgreSQL.

UUID v7.

Foreign Keys.

Normalized schema.

Soft deletes.

Audit fields.

Indexes for search.

Never duplicate business data.

---

# Development Workflow

For every feature

Understand requirements.

Read documentation.

Check architecture.

Reuse existing implementation.

Design before coding.

Implement.

Test.

Document.

Never skip engineering steps.

---

# Existing Project Rules

Do not rename folders.

Do not restructure the repository.

Do not replace architecture.

Do not delete existing code.

Work within the established project structure.

---

# Documentation Priority

When making decisions follow this order

1.

AI Context Documents

↓

2.

Engineering Specifications

↓

3.

Architecture Documents

↓

4.

Implementation

If implementation conflicts with documentation,

documentation wins.

---

# Code Generation Rules

Generated code must

Compile.

Be production ready.

Follow project conventions.

Be strongly typed.

Avoid unnecessary dependencies.

Avoid overengineering.

Avoid premature optimization.

Prefer simplicity.

---

# UI Generation Rules

Always generate

Responsive layouts.

Reusable components.

Accessible forms.

Professional tables.

Meaningful loading states.

Meaningful empty states.

Professional error states.

Avoid decorative UI.

---

# Security Rules

Validate everything.

Never trust frontend.

Protect sensitive APIs.

Never expose protected contact information before login.

Never expose passwords.

Never expose tokens.

---

# Performance Rules

Avoid

N+1 queries

Duplicate requests

Unnecessary rendering

Large components

Expensive searches

Optimize search.

Optimize RFQ.

Optimize dashboards.

---

# AI Behaviour Rules

If architecture is unclear

Do not assume.

Ask.

If documentation conflicts

Follow the newest AI Context document.

Never invent business rules.

Never remove existing functionality unless requested.

Never replace completed work without explanation.

---

# Expected Quality

Every output should look like it was written by a senior engineer with enterprise software experience.

Never generate beginner-level architecture.

Never generate placeholder implementations unless explicitly requested.

---

# Success Criteria

Every contribution should make KemKendra

More maintainable

More scalable

More professional

More secure

More consistent

More trustworthy

If a proposed solution does not improve one of these areas, reconsider the approach.

---

# Document Priority

This is the operational instruction manual for Antigravity.

All code generation, UI generation, architecture assistance and implementation suggestions must follow this document together with the remaining AI Context documents.

If conflicts occur, the official AI Context documentation takes precedence over assumptions.