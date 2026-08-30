# KemKendra API Rate Limiting & Abuse Protection

---

## 1. Overview & Architecture

KemKendra implements multi-tiered, in-memory sliding window rate limiting and abuse defense across all HTTP API surfaces. The primary defense goals are:
- Defending against credential stuffing and brute-force login attempts.
- Preventing automated registration flooding and bot account creation.
- Preventing account enumeration and email spam via password reset and verification endpoints.
- Throttling excessive public catalog/search scraping while preserving seamless performance for legitimate buyers, suppliers, and administrators.

> [!NOTE]
> **Single-Instance In-Memory Storage**:
> Current implementation is suitable for a single application instance. Distributed Redis-backed rate limiting is deferred until horizontal scaling is required.

---

## 2. Rate Limiting Categories & Endpoint Policies

| Category | Targeted Endpoints | Default Window | Production Limit | Local Dev Limit | Security Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`LOGIN`** | `POST /api/v1/auth/login` | 60 seconds | 10 requests / IP | 10 requests / IP | Protects against credential stuffing and rapid password brute-forcing. Coupled with 15-minute account lockout on consecutive failures. |
| **`REGISTRATION`** | `POST /api/v1/auth/register`<br>`POST /api/v1/auth/register/supplier` | 60 seconds | 10 requests / IP | 10 requests / IP | Prevents automated bot account registration and database bloat. |
| **`PASSWORD_RESET`** | `POST /api/v1/auth/forgot-password`<br>`POST /api/v1/auth/reset-password` | 60 seconds | 10 requests / IP | 10 requests / IP | Prevents email bomb attacks and token guessing while preserving anti-enumeration generic responses. |
| **`EMAIL_VERIFICATION`** | `POST /api/v1/auth/verify-email`<br>`POST /api/v1/auth/resend-verification` | 60 seconds | 15 requests / IP | 15 requests / IP | Prevents verification token brute-forcing and email spam. Supplements the per-account 60-second cooldown. |
| **`PUBLIC_API`** | `GET /api/v1/products/**`<br>`GET /api/v1/categories/**`<br>`GET /api/v1/suppliers/**`<br>`GET /api/v1/master-products/**`<br>`GET /api/v1/countries` | 60 seconds | 120 requests / IP | 120 requests / IP | Mitigates aggressive scraping and DoS request flooding. |
| **`NONE`** | Authenticated marketplace operations (`/api/v1/rfqs/**`, `/api/v1/orders/**`, `/actuator/**`, etc.) | N/A | Unthrottled at filter level | Unthrottled | Avoids disrupting business-critical transactional workflows for authenticated enterprise users. |

---

## 3. Rate Limit Enforcement & Response Format

When a client exceeds the permitted request threshold for a given category:
1. The filter halts execution and does not dispatch the request to backend controllers.
2. An HTTP `429 Too Many Requests` status is returned.
3. A `Retry-After: <seconds>` HTTP response header is attached, advising the client when requests can resume.
4. A structured JSON error body is emitted matching KemKendra's standard error schema:

```json
{
  "timestamp": "2026-08-29T23:00:00.123",
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again in 48 seconds.",
  "path": "/api/v1/auth/login"
}
```

For requests within the permitted threshold:
- `X-RateLimit-Remaining: <remaining_requests>` header is included in the response.

---

## 4. Client Identity Resolution & Proxy Handling

Client IP addresses are extracted in [`RateLimitingFilter.java`](file:///d:/Saisaket/KemKendra/backend/src/main/java/com/kemkendra/security/ratelimit/RateLimitingFilter.java) via:
1. `X-Forwarded-For` header: The first entry in the comma-separated proxy chain represents the client source IP.
2. `X-Real-IP` header: Fallback reverse proxy source IP header.
3. `request.getRemoteAddr()`: Direct TCP connection remote IP.

Rate limiting keys are formed as `<CATEGORY>:<CLIENT_IP>` (e.g. `LOGIN:203.0.113.10`).

---

## 5. Memory Safety & Thread Safety

- **Atomic Sequence Allocation**: Token consumption uses atomic compute operations to eliminate concurrency race conditions under high-throughput parallel traffic.
- **Bounded Storage**: The in-memory storage tracks at most 10,000 distinct IP keys simultaneously.
- **Automatic Eviction**: Expired window records (older than 300 seconds) are automatically evicted whenever the map exceeds maximum capacity, preventing unbounded memory growth or JVM heap leaks.

---

## 6. Configuration Reference

All rate limiting thresholds are configurable through environment variables:

```yaml
kemkendra:
  rate-limit:
    enabled: ${RATE_LIMIT_ENABLED:true}
    login:
      limit: ${RATE_LIMIT_LOGIN:10}
      window-seconds: ${RATE_LIMIT_LOGIN_WINDOW:60}
    registration:
      limit: ${RATE_LIMIT_REGISTRATION:10}
      window-seconds: ${RATE_LIMIT_REGISTRATION_WINDOW:60}
    password-reset:
      limit: ${RATE_LIMIT_PASSWORD_RESET:10}
      window-seconds: ${RATE_LIMIT_PASSWORD_RESET_WINDOW:60}
    email-verification:
      limit: ${RATE_LIMIT_EMAIL_VERIFICATION:15}
      window-seconds: ${RATE_LIMIT_EMAIL_VERIFICATION_WINDOW:60}
    public-api:
      limit: ${RATE_LIMIT_PUBLIC_API:120}
      window-seconds: ${RATE_LIMIT_PUBLIC_API_WINDOW:60}
```

---

## 7. Future Distributed Scaling with Redis

When KemKendra scales horizontally across multiple backend container instances:
1. `RateLimiterStorage` interface is preserved without any controller or filter modifications.
2. A new `RedisRateLimiterStorage` component implementing `RateLimiterStorage` will use Redis sliding window sorted sets (`ZADD` / `ZREMRANGEBYSCORE` / `ZCARD`) or atomic Redis token buckets.
3. Storage implementation can be switched conditionally via `@ConditionalOnProperty(name = "kemkendra.rate-limit.storage", havingValue = "redis")`.
