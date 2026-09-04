package com.kemkendra.security.cookie;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Configuration properties for authentication session cookies.
 * Adheres strictly to RFC 6265bis __Host- cookie prefix specifications.
 */
@Component
@ConfigurationProperties(prefix = "kemkendra.security.cookie")
public class AuthCookieProperties {

    /**
     * Whether cookies require HTTPS. Must be true in production.
     */
    private boolean secure = false;

    /**
     * Explicit cookie name override. If null, automatically determined:
     * "__Host-kk_refresh" when secure=true, or "kk_refresh" when secure=false.
     */
    private String cookieName;

    /**
     * SameSite policy. Must be "Strict" for high-assurance session cookies.
     */
    private String sameSite = "Strict";

    /**
     * Cookie path. Must be "/" when __Host- prefix is used.
     */
    private String path = "/";

    /**
     * Refresh cookie maximum age. Aligned with 7-day refresh session lifetime (604,800 seconds).
     */
    private Duration maxAge = Duration.ofDays(7);

    public boolean isSecure() {
        return secure;
    }

    public void setSecure(boolean secure) {
        this.secure = secure;
    }

    public String getCookieName() {
        return cookieName;
    }

    public void setCookieName(String cookieName) {
        this.cookieName = cookieName;
    }

    public String getSameSite() {
        return sameSite;
    }

    public void setSameSite(String sameSite) {
        this.sameSite = sameSite;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Duration getMaxAge() {
        return maxAge;
    }

    public void setMaxAge(Duration maxAge) {
        this.maxAge = maxAge;
    }
}
