package com.kemkendra.security.ratelimit;

public enum RateLimitCategory {
    LOGIN,
    REFRESH,
    REGISTRATION,
    PASSWORD_RESET,
    EMAIL_VERIFICATION,
    PUBLIC_API,
    NONE
}
