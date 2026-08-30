package com.kemkendra.security.ratelimit;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class InMemoryRateLimiterStorage implements RateLimiterStorage {

    private static final int MAX_TRACKED_KEYS = 10_000;

    private static class WindowCounter {
        final Instant windowStart;
        int count;

        WindowCounter(Instant windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }

    private static record Consumption(Instant windowStart, int count) {}

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    public RateLimitResult tryConsume(String key, int maxRequests, long windowSeconds) {
        if (key == null || key.isBlank() || maxRequests <= 0 || windowSeconds <= 0) {
            return new RateLimitResult(true, maxRequests, 0);
        }

        Instant now = Instant.now();

        // Memory safety guard: prevent unbounded growth
        if (counters.size() > MAX_TRACKED_KEYS) {
            cleanupExpired(now);
        }

        final Consumption[] holder = new Consumption[1];

        counters.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStart.plusSeconds(windowSeconds).isBefore(now)) {
                WindowCounter fresh = new WindowCounter(now, 1);
                holder[0] = new Consumption(now, 1);
                return fresh;
            }
            existing.count++;
            holder[0] = new Consumption(existing.windowStart, existing.count);
            return existing;
        });

        Consumption consumption = holder[0];
        long elapsedSeconds = java.time.Duration.between(consumption.windowStart(), now).getSeconds();
        long retryAfterSeconds = Math.max(1, windowSeconds - elapsedSeconds);

        if (consumption.count() > maxRequests) {
            return new RateLimitResult(false, 0, retryAfterSeconds);
        }

        int remaining = Math.max(0, maxRequests - consumption.count());
        return new RateLimitResult(true, remaining, 0);
    }

    @Override
    public void resetAll() {
        counters.clear();
    }

    private void cleanupExpired(Instant now) {
        counters.entrySet().removeIf(entry ->
                entry.getValue().windowStart.plusSeconds(300).isBefore(now)
        );
    }
}
