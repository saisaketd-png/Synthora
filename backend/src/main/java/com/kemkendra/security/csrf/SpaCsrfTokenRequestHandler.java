package com.kemkendra.security.csrf;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * Spring Security 6 Single-Page Application (SPA) CSRF Request Handler.
 *
 * Spring Security 6 applies BREACH XOR masking to CsrfTokens by default.
 * In an SPA, the browser client reads the raw (unmasked) token from the XSRF-TOKEN cookie
 * and returns it in the X-XSRF-TOKEN HTTP header.
 *
 * This handler:
 * 1. Delegates token resolution to plain attribute handler when the request contains the X-XSRF-TOKEN header.
 * 2. Delegates to XOR attribute handler when relying on request parameters or deferred attributes.
 * 3. Eagerly resolves the deferred token Supplier during handle() to trigger CookieCsrfTokenRepository cookie emission.
 */
public final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler xor = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        this.xor.handle(request, response, csrfToken);
        // Eagerly resolve token supplier so that CookieCsrfTokenRepository persists the cookie
        csrfToken.get();
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String headerValue = request.getHeader(csrfToken.getHeaderName());
        return (StringUtils.hasText(headerValue))
                ? this.plain.resolveCsrfTokenValue(request, csrfToken)
                : this.xor.resolveCsrfTokenValue(request, csrfToken);
    }
}
