package com.synthora.security;

import com.synthora.identity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;


import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    // Secret key used to sign tokens
    private final SecretKey secretKey =
            Keys.hmacShaKeyFor(
                    "synthora-super-secret-key-for-jwt-signing-1234567890"
                            .getBytes()
            );

    // Token validity: 24 hours
    private static final long EXPIRATION_MS = 24 * 60 * 60 * 1000;

    public String generateToken(User user) {

        return Jwts.builder()
                .subject(user.getEmail())                  // identifies the user
                .claim("role", user.getRole().name())     // custom claim
                .issuedAt(new Date())                     // token creation time
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
    public String extractRole(String token) {

        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.get("role", String.class);
    }
    public String extractEmail(String token) {

    Claims claims = Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();

    return claims.getSubject();
}

public boolean isTokenValid(String token) {

    try {
        Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);

        return true;

    } catch (Exception ex) {
        return false;
    }
}
}   