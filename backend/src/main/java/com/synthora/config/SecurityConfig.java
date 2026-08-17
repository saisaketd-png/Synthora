package com.synthora.config;

import com.synthora.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of("http://localhost:3000")
        );

        configuration.setAllowedMethods(
                List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")
        );

        configuration.setAllowedHeaders(
                List.of("*")
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // -----------------------------
                        // Public authentication
                        // -----------------------------
                        .requestMatchers(
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()

                        // -----------------------------
                        // Public product browsing
                        // -----------------------------
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/products",
                                "/api/v1/products/**",
                                "/api/v1/categories",
                                "/api/v1/categories/**",
                                "/api/v1/countries",
                                "/api/v1/suppliers",
                                "/api/v1/suppliers/**"
                        ).permitAll()

                        // -----------------------------
                        // Buyer RFQ operations
                        // -----------------------------
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

                        // -----------------------------
                        // Supplier RFQ inbox
                        // -----------------------------
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/rfqs/supplier",
                                "/api/v1/rfqs/supplier/*"
                        ).authenticated()

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/v1/rfqs/supplier/*/quotations"
                        ).authenticated()

                        // -----------------------------
                        // Purchase Orders
                        // -----------------------------
                        .requestMatchers(
                                "/api/v1/orders",
                                "/api/v1/orders/**"
                        ).authenticated()

                        // -----------------------------
                        // Everything else
                        // -----------------------------
                        .anyRequest().authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}