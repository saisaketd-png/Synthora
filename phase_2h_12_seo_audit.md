# KemKendra SEO, Indexing & Search Engine Discoverability Audit

**Phase**: 2H.12 — Final SEO, Indexing & Search Engine Discoverability Audit  
**Date**: August 19, 2026  
**Auditor**: Senior SEO Architect & Web Engineer  
**Status**: AUDIT COMPLETE — REFACTORING PLAN READY

---

## 1. Executive Summary

This audit evaluates KemKendra's technical SEO foundation, crawlability, canonicalization, robots directives, dynamic XML sitemaps, OpenGraph metadata, Schema.org JSON-LD structured data, and internal linking structure across public procurement pages (`/products`, `/products/[id]`, `/categories`, `/suppliers`, `/suppliers/[id]`, `/industries`, `/resources`) vs private application routes (`/dashboard/*`, `/admin/*`, `/login`, `/register`).

---

## 2. Complete SEO Audit Matrix & Indexing Blueprint

| Surface / Route | Current State | Target Robots Directive | Target Canonical URL | Target Metadata & Structured Data | Assessment / Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage (`/`)** | Metadata present | `index, follow` | `NEXT_PUBLIC_SITE_URL` | `WebSite`, `Organization` JSON-LD | **LOW RISK** |
| **Chemical Catalog (`/products`)** | Filter query parameters create duplicate URL variants | `index, follow` (clean catalog); `noindex, follow` (when filter params present) | `${SITE_URL}/products` | `title: "Chemical Product Catalog | KemKendra"`, `description`, OG tags | **MEDIUM RISK** — Search parameters need conditional `noindex` |
| **Product Detail (`/products/[id]`)** | Resolves product code & UUID | `index, follow` | `${SITE_URL}/products/${productCode}` | Dynamic Title (`{Name} \| CAS {CAS} \| KemKendra`), `Product` & `BreadcrumbList` JSON-LD | **HIGH RISK** — UUID URLs must emit canonical logical product code URL |
| **Categories (`/categories`)** | Metadata present | `index, follow` | `${SITE_URL}/categories` | `title`, `description`, `CategoryGrid` | **LOW RISK** |
| **Suppliers Directory (`/suppliers`)** | Missing explicit canonical | `index, follow` | `${SITE_URL}/suppliers` | `title`, `description`, OG tags | **MEDIUM RISK** |
| **Supplier Detail (`/suppliers/[id]`)** | Missing `generateMetadata` & JSON-LD | `index, follow` | `${SITE_URL}/suppliers/${id}` | Dynamic Title (`{SupplierName} \| Verified Chemical Manufacturer`), `Organization` JSON-LD | **HIGH RISK** — Lacks dynamic metadata & JSON-LD |
| **Industries (`/industries`)** | Missing metadata export | `index, follow` | `${SITE_URL}/industries` | `title`, `description`, OG tags | **MEDIUM RISK** |
| **Resources (`/resources`)** | Missing metadata export | `index, follow` | `${SITE_URL}/resources` | `title`, `description`, OG tags | **MEDIUM RISK** |
| **Private Dashboards (`/dashboard/*`)** | Client-side auth protection | `noindex, nofollow` | None (Private) | Disallowed in `robots.ts` & explicit `noindex` metadata | **HIGH RISK** — Must explicitly declare `noindex` metadata |
| **Admin Area (`/admin/*`)** | Client-side auth protection | `noindex, nofollow` | None (Private) | Disallowed in `robots.ts` & explicit `noindex` metadata | **HIGH RISK** — Must explicitly declare `noindex` metadata |
| **Auth Pages (`/login`, `/register`)** | Client component | `noindex, follow` | None (Private) | Disallowed in `robots.ts` & `noindex` metadata | **MEDIUM RISK** |

---

## 3. Key Vulnerabilities & Refactoring Tasks

1. **Environment-Aware Canonical URLs**: Eliminate hardcoded `https://kemkendra.com` fallback or `localhost:3000` references in metadata. Use `process.env.NEXT_PUBLIC_SITE_URL` with fallback to `https://kemkendra.com`.
2. **Product Canonicalization**: Ensure canonical URL for any product page (whether requested by UUID or lowercase product code) always points to `${SITE_URL}/products/${productCode}`.
3. **Private Page Safeguards**: Add explicit `robots: { index: false, follow: false }` metadata to `/dashboard`, `/admin`, `/login`, `/register`.
4. **Structured Data Enhancements**: Enhance `Product`, `BreadcrumbList`, and `Organization` JSON-LD on product detail pages and supplier profile pages.
5. **Dynamic Sitemap Coverage**: Include dynamic active products and public supplier pages in `sitemap.ts`.
6. **Search Console Readiness**: Verify `/robots.txt` and `/sitemap.xml` yield valid production outputs.
