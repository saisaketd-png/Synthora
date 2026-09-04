package com.kemkendra.security.origin;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Origin validation filter specifically scoped to cookie-authenticated endpoints:
 * - POST /api/v1/auth/refresh
 * - POST /api/v1/auth/logout
 *
 * Enforces authoritative origin verification for ambient cookie requests:
 * 1. Checks Origin header against configured authoritative origins.
 * 2. If Origin is absent, checks Sec-Fetch-Site and Referer.
 * 3. Fails closed (HTTP 403 Forbidden) if the request origin is untrusted, spoofed, or absent.
 * 4. Completely ignores all normal Bearer-authenticated and public endpoints.
 */
@Component
public class CookieEndpointOriginFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(CookieEndpointOriginFilter.class);

    private final OriginValidator originValidator;

    public CookieEndpointOriginFilter(OriginValidator originValidator) {
        this.originValidator = originValidator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method) && ("/api/v1/auth/refresh".equals(path) || "/api/v1/auth/logout".equals(path))) {
            if (!originValidator.validateCookieRequestOrigin(request)) {
                log.warn("Blocked cookie-authenticated mutation with invalid/unauthorized origin: uri={}, origin={}",
                        path, request.getHeader("Origin"));
                response.sendError(HttpStatus.FORBIDDEN.value(), "Invalid or unauthorized request origin");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
