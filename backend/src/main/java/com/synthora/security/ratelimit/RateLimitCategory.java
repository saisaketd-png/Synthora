package com.synthora.security.ratelimit;

public enum RateLimitCategory {
    LOGIN,
    REGISTRATION,
    PASSWORD_RESET,
    EMAIL_VERIFICATION,
    PUBLIC_API,
    NONE
}
