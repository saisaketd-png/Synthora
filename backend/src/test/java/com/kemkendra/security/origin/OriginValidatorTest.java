package com.kemkendra.security.origin;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class OriginValidatorTest {

    private final OriginValidator validator = new OriginValidator("http://localhost:3000, https://kemkendra.com, https://app.kemkendra.com:8443");

    @Test
    @DisplayName("1. Authoritative configured origins are allowed")
    void authoritativeOriginsAreAllowed() {
        assertThat(validator.isAllowedOrigin("http://localhost:3000")).isTrue();
        assertThat(validator.isAllowedOrigin("https://kemkendra.com")).isTrue();
        assertThat(validator.isAllowedOrigin("https://kemkendra.com:443")).isTrue(); // Default port normalization
        assertThat(validator.isAllowedOrigin("https://app.kemkendra.com:8443")).isTrue();
    }

    @Test
    @DisplayName("2. Arbitrary and untrusted origins are strictly rejected")
    void untrustedOriginsRejected() {
        assertThat(validator.isAllowedOrigin("http://evil.com")).isFalse();
        assertThat(validator.isAllowedOrigin("https://evil-kemkendra.com")).isFalse();
        assertThat(validator.isAllowedOrigin("http://localhost:8080")).isFalse(); // Wrong port
        assertThat(validator.isAllowedOrigin("https://localhost:3000")).isFalse(); // Wrong scheme
    }

    @Test
    @DisplayName("3. Subdomain and suffix spoofing attempts are rejected")
    void originSpoofingAttemptsRejected() {
        assertThat(validator.isAllowedOrigin("http://localhost:3000.evil.com")).isFalse();
        assertThat(validator.isAllowedOrigin("https://kemkendra.com.attacker.com")).isFalse();
        assertThat(validator.isAllowedOrigin("https://notkemkendra.com")).isFalse();
    }

    @Test
    @DisplayName("4. Wildcards and null/blank origins are rejected")
    void wildcardsAndNullRejected() {
        assertThat(validator.isAllowedOrigin("*")).isFalse();
        assertThat(validator.isAllowedOrigin("")).isFalse();
        assertThat(validator.isAllowedOrigin("   ")).isFalse();
        assertThat(validator.isAllowedOrigin(null)).isFalse();
    }

    @Test
    @DisplayName("5. Cookie request validation allows valid Origin header")
    void cookieRequestValidationWithOriginHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Origin", "http://localhost:3000");

        assertThat(validator.validateCookieRequestOrigin(request)).isTrue();
    }

    @Test
    @DisplayName("6. Cookie request validation rejects untrusted Origin header")
    void cookieRequestValidationRejectsUntrustedOrigin() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Origin", "https://malicious-site.com");

        assertThat(validator.validateCookieRequestOrigin(request)).isFalse();
    }

    @Test
    @DisplayName("7. Cookie request validation respects Sec-Fetch-Site: same-origin when Origin is absent")
    void cookieRequestValidationRespectsSecFetchSite() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Sec-Fetch-Site", "same-origin");

        assertThat(validator.validateCookieRequestOrigin(request)).isTrue();
    }

    @Test
    @DisplayName("8. Cookie request validation checks Referer when Origin is absent")
    void cookieRequestValidationChecksReferer() {
        MockHttpServletRequest validRequest = new MockHttpServletRequest();
        validRequest.addHeader("Referer", "https://kemkendra.com/dashboard/orders");
        assertThat(validator.validateCookieRequestOrigin(validRequest)).isTrue();

        MockHttpServletRequest invalidRequest = new MockHttpServletRequest();
        invalidRequest.addHeader("Referer", "https://phishing.com/attack");
        assertThat(validator.validateCookieRequestOrigin(invalidRequest)).isFalse();
    }

    @Test
    @DisplayName("9. Cookie request validation fails closed when no origin signals exist")
    void cookieRequestValidationFailsClosed() {
        MockHttpServletRequest emptyRequest = new MockHttpServletRequest();
        emptyRequest.setRequestURI("/api/v1/auth/refresh");

        assertThat(validator.validateCookieRequestOrigin(emptyRequest)).isFalse();
    }
}
