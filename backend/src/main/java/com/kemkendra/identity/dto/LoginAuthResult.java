package com.kemkendra.identity.dto;

/**
 * Internal domain record holding the result of user credential authentication,
 * including session credentials that must NOT be serialized to external API clients.
 */
public record LoginAuthResult(
        String message,
        String token,
        Long expiresIn,
        String rawRefreshToken,
        Long refreshExpiresIn
) {
}
