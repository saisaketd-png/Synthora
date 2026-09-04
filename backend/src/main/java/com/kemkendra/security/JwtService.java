package com.kemkendra.security;

import com.kemkendra.identity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String ISSUER = "kemkendra";
    private static final int MIN_SECRET_LENGTH = 32;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:900000}")
    private long jwtExpiration;

    public long getJwtExpiration() {
        return jwtExpiration;
    }

    @PostConstruct
    public void validateConfiguration() {
        if (jwtSecret == null || jwtSecret.trim().length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("JWT signing secret must be configured with at least " +
                    MIN_SECRET_LENGTH + " characters (256 bits).");
        }
    }

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .issuer(ISSUER)
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("iat_ms", now.getTime())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSecretKey())
                .compact();
    }

    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    public String extractEmail(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getSubject();
    }

    public String extractJti(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getId();
    }

    public Instant extractIssuedAtInstant(String token) {
        Claims claims = extractAllClaims(token);
        Long iatMs = claims.get("iat_ms", Long.class);
        if (iatMs != null) {
            return Instant.ofEpochMilli(iatMs);
        }
        Date issuedAt = claims.getIssuedAt();
        return issuedAt != null ? issuedAt.toInstant() : Instant.EPOCH;
    }

    public boolean isTokenValid(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        try {
            Claims claims = extractAllClaims(token);
            Date expiration = claims.getExpiration();
            return expiration != null && expiration.after(new Date());
        } catch (Exception ex) {
            log.debug("JWT signature or claims validation failed: {}", ex.getMessage());
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .requireIssuer(ISSUER)
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}