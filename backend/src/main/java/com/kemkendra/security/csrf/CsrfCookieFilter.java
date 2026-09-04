package com.kemkendra.security.csrf;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that materializes the Spring Security 6 deferred CSRF token into an XSRF-TOKEN cookie.
 *
 * In Spring Security 6, CSRF tokens are loaded lazily by default. Calling csrfToken.getToken()
 * forces the CookieCsrfTokenRepository to execute saveToken(), committing the cookie onto
 * the HttpServletResponse so that client SPAs can inspect it.
 */
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // Eagerly resolve token to write the XSRF-TOKEN cookie to response
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}
