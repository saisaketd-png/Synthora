package com.kemkendra.identity.dto;

/**
 * Public response DTO returned upon successful access token refresh.
 *
 * CRITICAL SECURITY INVARIANT:
 * This DTO must NEVER expose the refresh token.
 * The rotated refresh token is transmitted exclusively via an HttpOnly, SameSite=Strict cookie.
 */
public record RefreshTokenResponse(
        String token,
        Long expiresIn
) {
    public RefreshTokenResponse(String token) {
        this(token, 900L);
    }
}
