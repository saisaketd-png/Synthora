package com.kemkendra.security.cookie;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Optional;

/**
 * Centralized service for generating, rotating, extracting, and invalidating
 * host-only, HttpOnly authentication refresh session cookies.
 *
 * Adheres strictly to RFC 6265bis specifications:
 * - When using "__Host-" prefix: Secure=true, Path=/, Domain is omitted.
 * - SameSite is set to Strict to provide CSRF defense-in-depth.
 * - Raw token values are strictly redacted from all log outputs.
 */
@Service
public class AuthCookieService {

    private static final Logger log = LoggerFactory.getLogger(AuthCookieService.class);

    public static final String PROD_COOKIE_NAME = "__Host-kk_refresh";
    public static final String DEV_COOKIE_NAME = "kk_refresh";

    private final AuthCookieProperties properties;

    public AuthCookieService(AuthCookieProperties properties) {
        this.properties = properties;
        validateConfiguration();
    }

    private void validateConfiguration() {
        String effectiveName = getEffectiveCookieName();
        if (effectiveName.startsWith("__Host-")) {
            if (!properties.isSecure()) {
                throw new IllegalStateException("RFC 6265bis violation: Cookie with '__Host-' prefix requires Secure=true");
            }
            if (!"/".equals(properties.getPath())) {
                throw new IllegalStateException("RFC 6265bis violation: Cookie with '__Host-' prefix requires Path=/");
            }
        }
    }

    /**
     * Determines the effective cookie name based on configuration and security mode.
     */
    public String getEffectiveCookieName() {
        if (StringUtils.hasText(properties.getCookieName())) {
            return properties.getCookieName();
        }
        return properties.isSecure() ? PROD_COOKIE_NAME : DEV_COOKIE_NAME;
    }

    /**
     * Issues a new HttpOnly, SameSite=Strict refresh cookie.
     * Domain is intentionally omitted to enforce host-only browser semantics.
     *
     * @param refreshToken raw refresh token string
     * @param maxAge       custom duration, or null to use configured default
     * @return RFC 6265 compliant ResponseCookie
     */
    public ResponseCookie createRefreshCookie(String refreshToken, Duration maxAge) {
        if (!StringUtils.hasText(refreshToken)) {
            throw new IllegalArgumentException("Refresh token must not be null or blank");
        }

        String cookieName = getEffectiveCookieName();
        long maxAgeSeconds = (maxAge != null ? maxAge : properties.getMaxAge()).getSeconds();

        ResponseCookie cookie = ResponseCookie.from(cookieName, refreshToken)
                .httpOnly(true)
                .secure(properties.isSecure())
                .path(properties.getPath())
                .sameSite(properties.getSameSite())
                .maxAge(maxAgeSeconds)
                .build();

        log.debug("Created refresh session cookie [name={}, secure={}, path={}, sameSite={}, maxAge={}s] (raw value redacted)",
                cookieName, properties.isSecure(), properties.getPath(), properties.getSameSite(), maxAgeSeconds);

        return cookie;
    }

    /**
     * Overload to issue a refresh cookie using the default configured Max-Age.
     */
    public ResponseCookie createRefreshCookie(String refreshToken) {
        return createRefreshCookie(refreshToken, properties.getMaxAge());
    }

    /**
     * Generates an immediate expiration (Max-Age=0) cookie to clear the active refresh session.
     * Clears both the effective cookie name and fallback names for defensive cleanup.
     *
     * @return RFC 6265 compliant ResponseCookie with empty value and Max-Age=0
     */
    public ResponseCookie clearRefreshCookie() {
        return clearCookie(getEffectiveCookieName());
    }

    /**
     * Clears a specific cookie name with Max-Age=0.
     */
    public ResponseCookie clearCookie(String cookieName) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(properties.isSecure())
                .path(properties.getPath())
                .sameSite(properties.getSameSite())
                .maxAge(0)
                .build();

        log.debug("Cleared session cookie [name={}, secure={}, path={}] (Max-Age=0)",
                cookieName, properties.isSecure(), properties.getPath());

        return cookie;
    }

    /**
     * Extracts the refresh token from request cookies.
     * Inspects primary effective cookie name first, then known alternate names
     * to ensure seamless developer ergonomics across dev and prod environments.
     *
     * @param request HTTP servlet request
     * @return Optional containing the refresh token, or empty if cookie absent
     */
    public Optional<String> extractRefreshToken(HttpServletRequest request) {
        if (request == null || request.getCookies() == null) {
            return Optional.empty();
        }

        String targetName = getEffectiveCookieName();
        for (Cookie cookie : request.getCookies()) {
            if (targetName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                log.debug("Found refresh cookie [name={}] in request (value redacted)", cookie.getName());
                return Optional.of(cookie.getValue());
            }
        }

        // Check alternate standard name if effective name was not found
        String alternateName = PROD_COOKIE_NAME.equals(targetName) ? DEV_COOKIE_NAME : PROD_COOKIE_NAME;
        for (Cookie cookie : request.getCookies()) {
            if (alternateName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                log.debug("Found alternate refresh cookie [name={}] in request (value redacted)", cookie.getName());
                return Optional.of(cookie.getValue());
            }
        }

        return Optional.empty();
    }
}
