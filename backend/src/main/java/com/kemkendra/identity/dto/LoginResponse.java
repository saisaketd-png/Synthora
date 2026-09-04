package com.kemkendra.identity.dto;

/**
 * Public response DTO returned to client applications upon successful login.
 *
 * CRITICAL SECURITY INVARIANT:
 * This DTO must NEVER expose the refresh token or any session credentials.
 * The refresh token is transmitted exclusively via an HttpOnly, SameSite=Strict cookie.
 */
public record LoginResponse(
        String message,
        String token,
        Long expiresIn
) {
    public LoginResponse(String message, String token) {
        this(message, token, null);
    }
}