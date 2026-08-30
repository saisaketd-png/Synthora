package com.kemkendra.security.ratelimit;

public interface RateLimiterStorage {

    /**
     * Attempts to consume 1 token/request for the given key and limit rule.
     *
     * @param key unique rate limit key (e.g. IP + Category)
     * @param maxRequests maximum permitted requests in the time window
     * @param windowSeconds time window in seconds
     * @return RateLimitResult indicating whether the request is allowed
     */
    RateLimitResult tryConsume(String key, int maxRequests, long windowSeconds);

    /**
     * Clears all stored rate limit records (used in tests/management).
     */
    void resetAll();
}
