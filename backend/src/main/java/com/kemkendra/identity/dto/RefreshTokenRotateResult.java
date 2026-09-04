package com.kemkendra.identity.dto;

/**
 * Internal domain record holding the result of a refresh token rotation,
 * including session credentials that must NOT be serialized to external API clients.
 */
public record RefreshTokenRotateResult(
        String token,
        Long expiresIn,
        String newRawRefreshToken,
        Long refreshExpiresIn
) {
}
