package com.kemkendra.identity.dto;

public record VerifyEmailResponse(
        String message,
        String token,
        String role,
        String verificationStatus
) {
    public VerifyEmailResponse(String message) {
        this(message, null, null, null);
    }
}
