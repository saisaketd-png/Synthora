package com.kemkendra.security.cookie;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Duration;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthCookieServiceTest {

    @Test
    @DisplayName("1. Refresh cookie has HttpOnly=true")
    void refreshCookieHasHttpOnly() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSecure(false);
        AuthCookieService service = new AuthCookieService(properties);

        ResponseCookie cookie = service.createRefreshCookie("sample-refresh-token-xyz");

        assertThat(cookie.isHttpOnly()).isTrue();
    }

    @Test
    @DisplayName("2. Production cookie has Secure=true and __Host- prefix")
    void productionCookieHasSecureAndHostPrefix() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSecure(true);
        AuthCookieService service = new AuthCookieService(properties);

        ResponseCookie cookie = service.createRefreshCookie("prod-token-12345");

        assertThat(cookie.isSecure()).isTrue();
        assertThat(cookie.getName()).isEqualTo("__Host-kk_refresh");
    }

    @Test
    @DisplayName("3. SameSite is Strict")
    void sameSiteIsStrict() {
        AuthCookieProperties properties = new AuthCookieProperties();
        AuthCookieService service = new AuthCookieService(properties);

        ResponseCookie cookie = service.createRefreshCookie("sample-token");

        assertThat(cookie.getSameSite()).isEqualTo("Strict");
    }

    @Test
    @DisplayName("4. Host-only behavior is preserved (Domain is omitted)")
    void hostOnlyPreservedDomainOmitted() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSecure(true);
        AuthCookieService service = new AuthCookieService(properties);

        ResponseCookie cookie = service.createRefreshCookie("sample-token");

        assertThat(cookie.getDomain()).isNull();
        String cookieHeader = cookie.toString();
        assertThat(cookieHeader.toLowerCase()).doesNotContain("domain=");
    }

    @Test
    @DisplayName("5. __Host- prefix requires Path=/ and Secure=true")
    void hostPrefixRequiresPathSlashAndSecure() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setCookieName("__Host-custom");
        properties.setSecure(false); // Insecure with __Host- violates RFC 6265bis
        properties.setPath("/");

        assertThatThrownBy(() -> new AuthCookieService(properties))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RFC 6265bis violation: Cookie with '__Host-' prefix requires Secure=true");

        properties.setSecure(true);
        properties.setPath("/api/v1/auth"); // Path other than / violates RFC 6265bis
        assertThatThrownBy(() -> new AuthCookieService(properties))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RFC 6265bis violation: Cookie with '__Host-' prefix requires Path=/");
    }

    @Test
    @DisplayName("6. Cookie clearing produces Max-Age=0 and empty value")
    void cookieClearingProducesMaxAgeZero() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSecure(true);
        AuthCookieService service = new AuthCookieService(properties);

        ResponseCookie clearCookie = service.clearRefreshCookie();

        assertThat(clearCookie.getMaxAge().getSeconds()).isEqualTo(0);
        assertThat(clearCookie.getValue()).isEmpty();
        assertThat(clearCookie.isHttpOnly()).isTrue();
        assertThat(clearCookie.isSecure()).isTrue();
        assertThat(clearCookie.getPath()).isEqualTo("/");
        assertThat(clearCookie.getSameSite()).isEqualTo("Strict");
    }

    @Test
    @DisplayName("7. Raw cookie value is validated against null or blank")
    void blankTokenThrowsException() {
        AuthCookieProperties properties = new AuthCookieProperties();
        AuthCookieService service = new AuthCookieService(properties);

        assertThatThrownBy(() -> service.createRefreshCookie(""))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.createRefreshCookie(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("8. Extraction of refresh cookie works for primary and alternate names")
    void extractRefreshTokenFromRequest() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSecure(true); // primary is __Host-kk_refresh
        AuthCookieService service = new AuthCookieService(properties);

        // Test primary name match
        MockHttpServletRequest request1 = new MockHttpServletRequest();
        request1.setCookies(new Cookie("__Host-kk_refresh", "valid-refresh-token-123"));
        Optional<String> extracted1 = service.extractRefreshToken(request1);
        assertThat(extracted1).isPresent().contains("valid-refresh-token-123");

        // Test alternate fallback name match (kk_refresh from dev client)
        MockHttpServletRequest request2 = new MockHttpServletRequest();
        request2.setCookies(new Cookie("kk_refresh", "dev-token-456"));
        Optional<String> extracted2 = service.extractRefreshToken(request2);
        assertThat(extracted2).isPresent().contains("dev-token-456");

        // Test missing cookie
        MockHttpServletRequest request3 = new MockHttpServletRequest();
        Optional<String> extracted3 = service.extractRefreshToken(request3);
        assertThat(extracted3).isEmpty();
    }
}
