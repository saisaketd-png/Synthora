package com.kemkendra.security.origin;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Reusable Origin validation infrastructure for cross-origin defense-in-depth.
 *
 * Enforces strict authoritative origin matching:
 * 1. Matches against configured authoritative origins ('kemkendra.cors.allowed-origins').
 * 2. Never trusts wildcards ('*') or arbitrary Origin headers.
 * 3. Never trusts Host headers as the authoritative origin (prevents Host Header Poisoning).
 * 4. Documented Policy on Absent Origin:
 *    - In standard browser architectures, Origin is sent on cross-origin requests and CORS preflights.
 *    - For protected cookie-authenticated mutations, absent Origin fails closed unless
 *      'Sec-Fetch-Site' proves a trusted same-origin context.
 *    - Safe GET/HEAD/OPTIONS requests without Origin are handled according to standard CORS rules.
 */
@Component
public class OriginValidator {

    private static final Logger log = LoggerFactory.getLogger(OriginValidator.class);

    private final Set<String> normalizedAllowedOrigins;

    public OriginValidator(
            @Value("${kemkendra.cors.allowed-origins:http://localhost:3000}") String allowedOriginsConfig
    ) {
        this.normalizedAllowedOrigins = parseAndNormalizeOrigins(allowedOriginsConfig);
        log.info("Initialized OriginValidator with {} authoritative origins: {}",
                normalizedAllowedOrigins.size(), normalizedAllowedOrigins);
    }

    private static Set<String> parseAndNormalizeOrigins(String config) {
        if (!StringUtils.hasText(config)) {
            return Collections.emptySet();
        }

        return Arrays.stream(config.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(OriginValidator::normalizeOrigin)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toUnmodifiableSet());
    }

    /**
     * Canonicalizes an origin string into scheme://host:port format.
     */
    public static Optional<String> normalizeOrigin(String rawOrigin) {
        if (!StringUtils.hasText(rawOrigin)) {
            return Optional.empty();
        }

        try {
            URI uri = URI.create(rawOrigin.trim());
            String scheme = uri.getScheme();
            String host = uri.getHost();

            if (scheme == null || host == null) {
                return Optional.empty();
            }

            scheme = scheme.toLowerCase(Locale.ROOT);
            host = host.toLowerCase(Locale.ROOT);

            int port = uri.getPort();
            if (port == -1) {
                if ("http".equals(scheme)) {
                    port = 80;
                } else if ("https".equals(scheme)) {
                    port = 443;
                }
            }

            return Optional.of(scheme + "://" + host + ":" + port);
        } catch (Exception e) {
            log.warn("Failed to parse origin string '{}': {}", rawOrigin, e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Validates whether a raw Origin header strictly matches one of the authoritative allowed origins.
     * Never trusts wildcard patterns or subdomains.
     *
     * @param rawOrigin HTTP Origin header value
     * @return true if origin is authorized, false otherwise
     */
    public boolean isAllowedOrigin(String rawOrigin) {
        if (!StringUtils.hasText(rawOrigin)) {
            return false;
        }

        Optional<String> normalized = normalizeOrigin(rawOrigin);
        return normalized.isPresent() && normalizedAllowedOrigins.contains(normalized.get());
    }

    /**
     * Validates incoming request origin for protected cookie-authenticated requests.
     *
     * Policy:
     * - If Origin header is present, it must strictly match an allowed authoritative origin.
     * - If Origin header is absent (e.g. some same-origin browser navigations):
     *   - Inspects 'Sec-Fetch-Site': if explicitly 'same-origin' or 'none', allowed.
     *   - Otherwise, checks Referer origin against allowed origins.
     *   - If neither can verify an authorized origin, fails closed.
     *
     * @param request HTTP request
     * @return true if verified, false if origin must be rejected
     */
    public boolean validateCookieRequestOrigin(HttpServletRequest request) {
        String originHeader = request.getHeader("Origin");

        if (StringUtils.hasText(originHeader)) {
            boolean allowed = isAllowedOrigin(originHeader);
            if (!allowed) {
                log.warn("Blocked request with unauthorized Origin header: {}", originHeader);
            }
            return allowed;
        }

        // Handle absent Origin
        String secFetchSite = request.getHeader("Sec-Fetch-Site");
        if ("same-origin".equalsIgnoreCase(secFetchSite) || "none".equalsIgnoreCase(secFetchSite)) {
            return true;
        }

        String refererHeader = request.getHeader("Referer");
        if (StringUtils.hasText(refererHeader)) {
            try {
                URI refererUri = URI.create(refererHeader);
                String refererOrigin = refererUri.getScheme() + "://" + refererUri.getHost()
                        + (refererUri.getPort() != -1 ? ":" + refererUri.getPort() : "");
                boolean allowed = isAllowedOrigin(refererOrigin);
                if (!allowed) {
                    log.warn("Blocked request with unauthorized Referer origin: {}", refererOrigin);
                }
                return allowed;
            } catch (Exception e) {
                log.warn("Malformed Referer header in cookie-authenticated request: {}", refererHeader);
                return false; // Fail closed
            }
        }

        // Fail closed for state-changing cookie requests with no Origin, no Sec-Fetch-Site, and no Referer
        log.warn("Failing closed for request without Origin, Referer, or Sec-Fetch-Site: uri={}", request.getRequestURI());
        return false;
    }

    public Set<String> getNormalizedAllowedOrigins() {
        return normalizedAllowedOrigins;
    }
}
