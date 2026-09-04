package com.kemkendra.config;

import com.kemkendra.security.JwtAuthenticationFilter;
import com.kemkendra.security.ratelimit.RateLimitingFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

import com.kemkendra.security.csrf.CsrfCookieFilter;
import com.kemkendra.security.csrf.CsrfCookieProperties;
import com.kemkendra.security.csrf.SpaCsrfTokenRequestHandler;
import com.kemkendra.security.origin.CookieEndpointOriginFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final String allowedOrigins;
    private final boolean swaggerUiEnabled;
    private final org.springframework.security.web.csrf.CookieCsrfTokenRepository cookieCsrfTokenRepository;
    private final SpaCsrfTokenRequestHandler spaCsrfTokenRequestHandler;
    private final CsrfCookieFilter csrfCookieFilter;
    private final CsrfCookieProperties csrfCookieProperties;
    private final CookieEndpointOriginFilter cookieEndpointOriginFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            RateLimitingFilter rateLimitingFilter,
            @Value("${kemkendra.cors.allowed-origins:http://localhost:3000}") String allowedOrigins,
            @Value("${springdoc.swagger-ui.enabled:true}") boolean swaggerUiEnabled,
            org.springframework.security.web.csrf.CookieCsrfTokenRepository cookieCsrfTokenRepository,
            SpaCsrfTokenRequestHandler spaCsrfTokenRequestHandler,
            CsrfCookieFilter csrfCookieFilter,
            CsrfCookieProperties csrfCookieProperties,
            CookieEndpointOriginFilter cookieEndpointOriginFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.allowedOrigins = allowedOrigins;
        this.swaggerUiEnabled = swaggerUiEnabled;
        this.cookieCsrfTokenRepository = cookieCsrfTokenRepository;
        this.spaCsrfTokenRequestHandler = spaCsrfTokenRequestHandler;
        this.csrfCookieFilter = csrfCookieFilter;
        this.csrfCookieProperties = csrfCookieProperties;
        this.cookieEndpointOriginFilter = cookieEndpointOriginFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication required to access this resource\"}");
        };
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Access denied\"}");
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        configuration.setAllowedOrigins(origins.isEmpty() ? List.of("http://localhost:3000") : origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        List<String> publicEndpoints = new java.util.ArrayList<>(List.of(
                "/api/v1/public/**",
                "/api/v1/auth/register",
                "/api/v1/auth/register/**",
                "/api/v1/auth/login",
                "/api/v1/auth/refresh",
                "/api/v1/auth/logout",
                "/api/v1/auth/forgot-password",
                "/api/v1/auth/reset-password",
                "/api/v1/auth/verify-email",
                "/api/v1/auth/resend-verification",
                "/actuator/health"
        ));

        if (swaggerUiEnabled) {
            publicEndpoints.add("/swagger-ui/**");
            publicEndpoints.add("/swagger-ui.html");
            publicEndpoints.add("/v3/api-docs/**");
        }

        http.cors(Customizer.withDefaults());

        if (csrfCookieProperties.isEnabled()) {
            http.csrf(csrf -> {
                csrf.csrfTokenRepository(cookieCsrfTokenRepository)
                        .csrfTokenRequestHandler(spaCsrfTokenRequestHandler)
                        .requireCsrfProtectionMatcher(request -> {
                            String path = request.getRequestURI();
                            String method = request.getMethod();
                            return "POST".equalsIgnoreCase(method) &&
                                    ("/api/v1/auth/refresh".equals(path) || "/api/v1/auth/logout".equals(path));
                        });
            });
            http.addFilterBefore(cookieEndpointOriginFilter, CsrfFilter.class);
            http.addFilterAfter(csrfCookieFilter, CsrfFilter.class);
        } else {
            http.csrf(csrf -> csrf.disable());
        }

        http
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(authenticationEntryPoint())
                        .accessDeniedHandler(accessDeniedHandler())
                )
                .headers(headers -> {
                    headers.contentTypeOptions(Customizer.withDefaults());
                    headers.frameOptions(frame -> frame.deny());
                    headers.referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                    headers.permissionsPolicy(perm -> perm.policy("camera=(), microphone=(), geolocation=(), payment=()"));
                    headers.contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"));
                })
                .authorizeHttpRequests(auth -> auth
                        // Public authentication & health & (dev-only docs)
                        .requestMatchers(publicEndpoints.toArray(new String[0])).permitAll()

                        // Public product browsing & public document list
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/public/**",
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/api/v1/master-products/**",
                                "/api/v1/categories",
                                "/api/v1/categories/**",
                                "/api/v1/countries",
                                "/api/v1/suppliers",
                                "/api/v1/suppliers/**",
                                "/api/v1/supplier/offerings/*/images",
                                "/api/v1/supplier/offerings/*/images/**",
                                "/api/v1/documents",
                                "/api/v1/documents/**"
                        ).permitAll()

                        // Buyer RFQ operations
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/rfqs/my",
                                "/api/v1/rfqs/*",
                                "/api/v1/rfqs/*/quotations"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/rfqs",
                                "/api/v1/rfqs/*/quotations/*/accept",
                                "/api/v1/rfqs/*/quotations/*/reject"
                        ).authenticated()

                        // Supplier RFQ inbox
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/rfqs/supplier",
                                "/api/v1/rfqs/supplier/*"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/rfqs/supplier/*/quotations"
                        ).authenticated()

                        // Purchase Orders
                        .requestMatchers(
                                "/api/v1/orders",
                                "/api/v1/orders/**"
                        ).authenticated()

                        // Everything else
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        rateLimitingFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}