package com.synthora.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding rate limiter for authentication endpoints.
 * Protects against brute-force password guessing and credential stuffing.
 * For distributed multi-instance production environments, this can be backed by Redis.
 */
@Service
public class LoginRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimiterService.class);

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

    private final Map<String, AttemptRecord> ipAttempts = new ConcurrentHashMap<>();
    private final Map<String, AttemptRecord> emailAttempts = new ConcurrentHashMap<>();

    private static class AttemptRecord {
        int count;
        Instant firstAttempt;
        Instant lastAttempt;

        AttemptRecord() {
            this.count = 1;
            this.firstAttempt = Instant.now();
            this.lastAttempt = Instant.now();
        }
    }

    public void checkRateLimit(String ip, String email) {
        if (isBlocked(ipAttempts, ip) || isBlocked(emailAttempts, email != null ? email.toLowerCase() : null)) {
            log.warn("Rate limit exceeded for login attempt [IP: {}]", ip);
            throw new RateLimitExceededException("Too many failed login attempts. Please try again later.");
        }
    }

    public void recordFailedAttempt(String ip, String email) {
        record(ipAttempts, ip);
        if (email != null && !email.isBlank()) {
            record(emailAttempts, email.toLowerCase());
        }
    }

    public void recordSuccessfulLogin(String ip, String email) {
        if (ip != null) {
            ipAttempts.remove(ip);
        }
        if (email != null) {
            emailAttempts.remove(email.toLowerCase());
        }
    }

    public void resetAll() {
        ipAttempts.clear();
        emailAttempts.clear();
    }

    private void record(Map<String, AttemptRecord> map, String key) {
        if (key == null || key.isBlank()) {
            return;
        }

        map.compute(key, (k, existing) -> {
            Instant now = Instant.now();
            if (existing == null) {
                return new AttemptRecord();
            }

            // If the window has expired since first attempt, reset
            if (existing.firstAttempt.plusSeconds(LOCKOUT_DURATION_SECONDS).isBefore(now)) {
                return new AttemptRecord();
            }

            existing.count++;
            existing.lastAttempt = now;
            return existing;
        });
    }

    private boolean isBlocked(Map<String, AttemptRecord> map, String key) {
        if (key == null || key.isBlank()) {
            return false;
        }

        AttemptRecord record = map.get(key);
        if (record == null) {
            return false;
        }

        Instant now = Instant.now();
        // Check if lockout window has expired
        if (record.firstAttempt.plusSeconds(LOCKOUT_DURATION_SECONDS).isBefore(now)) {
            map.remove(key);
            return false;
        }

        return record.count >= MAX_FAILED_ATTEMPTS;
    }
}
