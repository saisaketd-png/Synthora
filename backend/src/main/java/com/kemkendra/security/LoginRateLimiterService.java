package com.kemkendra.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding rate limiter for authentication endpoints.
 * Protects against brute-force password guessing and credential stuffing.
 * 
 * Configured with dual protection tiers:
 * 1. Per-Account Threshold: 5 failed attempts per target email (strict brute-force defense).
 * 2. Per-IP Aggregate Threshold: 30 failed attempts per IP address (defends against distributed attacks
 *    while avoiding false-positive lockouts in shared corporate NAT/VPN/office network environments).
 */
@Service
public class LoginRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimiterService.class);

    public static final int MAX_FAILED_ATTEMPTS_PER_ACCOUNT = 5;
    public static final int MAX_FAILED_ATTEMPTS_PER_IP = 30;
    public static final long LOCKOUT_DURATION_SECONDS = 900; // 15 minutes

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
        if (isBlocked(emailAttempts, email != null ? email.toLowerCase().trim() : null, MAX_FAILED_ATTEMPTS_PER_ACCOUNT)) {
            log.warn("Rate limit exceeded for account login attempt [Email: {}, IP: {}]", email, ip);
            throw new RateLimitExceededException("Too many failed login attempts for this account. Please try again in 15 minutes.");
        }

        if (isBlocked(ipAttempts, ip, MAX_FAILED_ATTEMPTS_PER_IP)) {
            log.warn("Rate limit exceeded for IP aggregate login attempts [IP: {}]", ip);
            throw new RateLimitExceededException("Too many failed login attempts from this network. Please try again in 15 minutes.");
        }
    }

    public void recordFailedAttempt(String ip, String email) {
        if (ip != null && !ip.isBlank()) {
            record(ipAttempts, ip.trim());
        }
        if (email != null && !email.isBlank()) {
            record(emailAttempts, email.toLowerCase().trim());
        }
    }

    public void recordSuccessfulLogin(String ip, String email) {
        if (ip != null && !ip.isBlank()) {
            ipAttempts.remove(ip.trim());
        }
        if (email != null && !email.isBlank()) {
            emailAttempts.remove(email.toLowerCase().trim());
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

    private boolean isBlocked(Map<String, AttemptRecord> map, String key, int threshold) {
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

        return record.count >= threshold;
    }
}
