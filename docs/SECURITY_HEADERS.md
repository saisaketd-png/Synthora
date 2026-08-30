# KemKendra HTTP Security Headers & Content Security Policy (CSP)

---

## 1. Overview

This document details the HTTP security headers and Content Security Policy (CSP) implemented across the KemKendra B2B chemical marketplace frontend (Next.js 16), backend REST API (Spring Boot 3.4), and reverse proxy (Nginx).

Security headers protect against common web vulnerabilities, including:
- **Cross-Site Scripting (XSS)** via restrictive Content Security Policy (CSP).
- **Clickjacking & UI Redressing** via `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
- **MIME Confusion & Sniffing Attacks** via `X-Content-Type-Options: nosniff`.
- **Referrer Data Leakage** via `Referrer-Policy: strict-origin-when-cross-origin`.
- **Unauthorized Device Access** via strict `Permissions-Policy`.
- **Man-in-the-Middle (MitM) Attacks & Protocol Downgrade** via `Strict-Transport-Security` (HSTS) in production.

---

## 2. Header Implementation Matrix

| Header Name | Layer Enforced | Production Value | Localhost (`dev`) Value | Security Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **`Content-Security-Policy`** | Next.js (`next.config.ts`) & Spring Boot (`SecurityConfig.java`) | Restrictive whitelist (see Section 3) | Same (with localhost port allowances) | Restricts resource loading to trusted origin domains. |
| **`X-Content-Type-Options`** | Next.js, Spring Boot, Nginx | `nosniff` | `nosniff` | Prevents browser from executing non-executable MIME types. |
| **`X-Frame-Options`** | Next.js, Spring Boot, Nginx | `DENY` | `DENY` | Prevents rendering inside `<iframe>` / `<frame>` to block clickjacking. |
| **`Referrer-Policy`** | Next.js, Spring Boot, Nginx | `strict-origin-when-cross-origin` | `strict-origin-when-cross-origin` | Sends full URL on same-origin; sends only origin over HTTPS cross-origin; sends nothing over HTTP. |
| **`Permissions-Policy`** | Next.js, Spring Boot, Nginx | `camera=(), microphone=(), geolocation=(), payment=()` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables browser hardware and sensor capabilities not required by KemKendra. |
| **`Strict-Transport-Security`** | Next.js (Production), Nginx (TLS) | `max-age=31536000; includeSubDomains` | **Omitted** | Enforces HTTPS wire encryption for 1 year (31,536,000s) across all subdomains. |

---

## 3. Content Security Policy (CSP) Directives

### Frontend (Next.js Application)
Enforced in [`frontend/next.config.ts`](file:///d:/Saisaket/KemKendra/frontend/next.config.ts):

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' http://localhost:* http://127.0.0.1:* https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  manifest-src 'self';
  worker-src 'self' blob:;
```

#### Directive Justification:
- `default-src 'self'`: Fallback restriction ensuring all unspecified resource categories default to same-origin.
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'`: Required by Next.js client component hydration, Turbopack, and JSON-LD schema generation.
- `style-src 'self' 'unsafe-inline'`: Required by Next.js font CSS loading and Tailwind inline CSS variables.
- `img-src 'self' data: blob: https:`: Permits catalog product photos, company logos, SVG icons (`data:`), and uploaded document preview thumbnails (`blob:`).
- `font-src 'self' data:`: Permits self-hosted Google Fonts (`Inter`, `Playfair Display`, `JetBrains Mono`) served via Next.js `_next/static/media/`.
- `connect-src 'self' http://localhost:* http://127.0.0.1:* https:`: Permits AJAX/fetch requests to Next.js API rewrites (`/api/*`), local Spring Boot backend (`8085`), and production backend domains.
- `object-src 'none'`: Prevents legacy Flash, Java, or ActiveX plugin execution.
- `base-uri 'self'`: Blocks `<base href="...">` DOM injection attacks.
- `form-action 'self'`: Guarantees HTML `<form>` submissions only route to same-origin URLs.
- `frame-ancestors 'none'`: Modern standard equivalent to `X-Frame-Options: DENY`.
- `manifest-src 'self'` & `worker-src 'self' blob:`: Permits web app manifest and background worker threads.

### Backend API (Spring Boot)
Enforced in [`backend/src/main/java/com/kemkendra/config/SecurityConfig.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/config/SecurityConfig.java):

```http
Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';
```
Since Spring Boot endpoints serve structured JSON (`application/json`), this policy prevents malicious execution or framing of API responses.

---

## 4. Localhost vs. Production Environment Separation

1. **HSTS (`Strict-Transport-Security`)**:
   - **Localhost Development**: Omitted completely (`process.env.NODE_ENV !== 'production'`). Prevents browser from forcing HTTPS on `http://localhost:3000` or `http://localhost:8085`.
   - **Production**: Automatically added when `NODE_ENV=production` (`next build` / `next start`).
2. **API Connection (`connect-src`)**:
   - Includes `http://localhost:*` and `http://127.0.0.1:*` to enable developer workflows and test suites.

---

## 5. Verification & Testing

### Automated Backend Test Suite
```powershell
cd backend
mvn test -Dtest=HttpSecurityHeadersTest
```

### Manual HTTP Header Inspection
Using `curl` or browser developer tools:

```bash
# Frontend Next.js Header Check
curl -I http://localhost:3000/

# Backend Spring Boot Header Check
curl -I http://localhost:8085/api/v1/public/countries
```
Expected response headers:
```http
HTTP/1.1 200 OK
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Content-Security-Policy: default-src 'self'; ...
```
