package com.synthora.security.ratelimit;

public record RateLimitResult(
        boolean allowed,
        int remaining,
        long retryAfterSeconds
) {}
