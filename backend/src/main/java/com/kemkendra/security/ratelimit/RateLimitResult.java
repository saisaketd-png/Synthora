package com.kemkendra.security.ratelimit;

public record RateLimitResult(
        boolean allowed,
        int remaining,
        long retryAfterSeconds
) {}
