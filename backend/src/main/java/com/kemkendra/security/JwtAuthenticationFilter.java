package com.kemkendra.security;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Filter that validates JWT authentication tokens and enforces active account status.
 * Rejects requests from suspended, deleted, or nonexistent users even if their token signature is valid.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (request.getParameter("token") != null && !request.getParameter("token").isBlank()) {
            token = request.getParameter("token");
        }

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (jwtService.isTokenValid(token)) {
                String email = jwtService.extractEmail(token);

                if (email != null && !email.isBlank()) {
                    Optional<User> userOpt = userRepository.findByEmail(email);

                    if (userOpt.isPresent()) {
                        User user = userOpt.get();

                        // Active Account Validation (Phase 1.11 / 2H.2)
                        // 1. Account must not be soft-deleted
                        // 2. If account is suspended, only permit appeal & suspension governance endpoints (/api/v1/account/**)
                        String requestUri = request.getRequestURI();
                        boolean isAllowedSuspensionEndpoint = requestUri != null &&
                                (requestUri.startsWith("/api/v1/account/appeals") || requestUri.startsWith("/api/v1/account/suspension"));

                        if (user.getDeletedAt() == null && (user.getStatus() != UserStatus.SUSPENDED || isAllowedSuspensionEndpoint)) {
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(
                                            user.getEmail(),
                                            null,
                                            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
                                    );

                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } else {
                            log.warn("Blocked request with valid JWT for inactive/suspended user: {} (Status: {}, Deleted: {}, Path: {})",
                                    email, user.getStatus(), user.getDeletedAt() != null, requestUri);
                            SecurityContextHolder.clearContext();
                        }
                    } else {
                        log.warn("Blocked request with valid JWT for nonexistent user: {}", email);
                        SecurityContextHolder.clearContext();
                    }
                }
            } else {
                SecurityContextHolder.clearContext();
            }
        } catch (Exception ex) {
            log.debug("JWT processing failed: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}