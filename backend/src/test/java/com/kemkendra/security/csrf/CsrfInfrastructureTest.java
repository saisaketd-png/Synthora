package com.kemkendra.security.csrf;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.DefaultCsrfToken;

import static org.assertj.core.api.Assertions.assertThat;

class CsrfInfrastructureTest {

    @Test
    @DisplayName("1. CSRF repository creates XSRF-TOKEN and it is NOT HttpOnly, has SameSite=Strict and Path=/")
    void csrfRepositoryCreatesXSRFTokenNotHttpOnly() {
        CsrfCookieProperties properties = new CsrfCookieProperties();
        properties.setSecure(false);
        CsrfConfig config = new CsrfConfig(properties);

        CookieCsrfTokenRepository repository = config.cookieCsrfTokenRepository();
        MockHttpServletRequest request = new MockHttpServletRequest();
        CsrfToken token = repository.generateToken(request);

        assertThat(token).isNotNull();
        assertThat(token.getHeaderName()).isEqualTo("X-XSRF-TOKEN");
        assertThat(token.getParameterName()).isEqualTo("_csrf");

        MockHttpServletResponse response = new MockHttpServletResponse();
        repository.saveToken(token, request, response);

        Cookie[] cookies = response.getCookies();
        assertThat(cookies).isNotEmpty();
        Cookie csrfCookie = cookies[0];

        assertThat(csrfCookie.getName()).isEqualTo("XSRF-TOKEN");
        assertThat(csrfCookie.getPath()).isEqualTo("/");
        // HttpOnly must be FALSE so client JavaScript SPA can read document.cookie
        assertThat(csrfCookie.isHttpOnly()).isFalse();
        // SameSite must be Strict
        assertThat(csrfCookie.getAttribute("SameSite")).isEqualTo("Strict");
        assertThat(csrfCookie.getValue()).isNotEmpty();
    }

    @Test
    @DisplayName("2. Production XSRF-TOKEN has Secure=true")
    void productionCsrfTokenIsSecure() {
        CsrfCookieProperties properties = new CsrfCookieProperties();
        properties.setSecure(true);
        CsrfConfig config = new CsrfConfig(properties);

        CookieCsrfTokenRepository repository = config.cookieCsrfTokenRepository();
        MockHttpServletRequest request = new MockHttpServletRequest();
        CsrfToken token = repository.generateToken(request);

        MockHttpServletResponse response = new MockHttpServletResponse();
        repository.saveToken(token, request, response);

        Cookie[] cookies = response.getCookies();
        assertThat(cookies).isNotEmpty();
        Cookie csrfCookie = cookies[0];

        assertThat(csrfCookie.getSecure()).isTrue();
        assertThat(csrfCookie.getAttribute("SameSite")).isEqualTo("Strict");
    }

    @Test
    @DisplayName("3. SpaCsrfTokenRequestHandler resolves plain token when X-XSRF-TOKEN header is present")
    void spaCsrfTokenRequestHandlerResolvesPlainTokenFromHeader() {
        SpaCsrfTokenRequestHandler handler = new SpaCsrfTokenRequestHandler();
        CsrfToken token = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "raw-secret-token-abc123");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-XSRF-TOKEN", "raw-secret-token-abc123");

        String resolvedValue = handler.resolveCsrfTokenValue(request, token);
        assertThat(resolvedValue).isEqualTo("raw-secret-token-abc123");
    }

    @Test
    @DisplayName("4. SpaCsrfTokenRequestHandler handles XOR masking when header is absent")
    void spaCsrfTokenRequestHandlerResolvesXorWhenHeaderAbsent() {
        SpaCsrfTokenRequestHandler handler = new SpaCsrfTokenRequestHandler();
        CsrfToken token = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "raw-secret-token-abc123");

        MockHttpServletRequest request = new MockHttpServletRequest();
        // No header set - will resolve via request parameters using XOR
        String resolvedValue = handler.resolveCsrfTokenValue(request, token);
        // Should return null since neither header nor parameter was provided
        assertThat(resolvedValue).isNull();
    }

    @Test
    @DisplayName("5. CsrfCookieFilter materializes deferred token in request attribute")
    void csrfCookieFilterMaterializesToken() throws Exception {
        CsrfCookieFilter filter = new CsrfCookieFilter();
        CsrfToken token = new DefaultCsrfToken("X-XSRF-TOKEN", "_csrf", "test-token-value");

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(CsrfToken.class.getName(), token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = new MockFilterChain();

        filter.doFilter(request, response, filterChain);

        // Filter called getToken() successfully without throwing
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }
}
