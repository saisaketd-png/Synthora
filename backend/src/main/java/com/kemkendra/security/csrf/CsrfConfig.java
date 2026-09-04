package com.kemkendra.security.csrf;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

/**
 * Spring Security configuration for Single-Page Application (SPA) CSRF infrastructure.
 * Configures the cookie-based token repository with HttpOnly=false so the frontend
 * can read the token and transmit it via the X-XSRF-TOKEN header.
 */
@Configuration
public class CsrfConfig {

    private final CsrfCookieProperties properties;

    public CsrfConfig(CsrfCookieProperties properties) {
        this.properties = properties;
    }

    @Bean
    public CookieCsrfTokenRepository cookieCsrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookieName(properties.getCookieName());
        repository.setHeaderName(properties.getHeaderName());
        repository.setParameterName(properties.getParameterName());
        repository.setCookiePath(properties.getPath());
        repository.setCookieCustomizer(builder -> builder
                .sameSite(properties.getSameSite())
                .secure(properties.isSecure())
                .path(properties.getPath())
        );
        return repository;
    }

    @Bean
    public SpaCsrfTokenRequestHandler spaCsrfTokenRequestHandler() {
        return new SpaCsrfTokenRequestHandler();
    }

    @Bean
    public CsrfCookieFilter csrfCookieFilter() {
        return new CsrfCookieFilter();
    }
}
