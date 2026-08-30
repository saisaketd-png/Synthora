package com.synthora.identity.dto;

public record ForgotPasswordResponse(
        String message
) {
    public static final String DEFAULT_SUCCESS_MESSAGE = 
            "If an account exists for this email, a password reset link has been sent.";

    public static ForgotPasswordResponse ofDefault() {
        return new ForgotPasswordResponse(DEFAULT_SUCCESS_MESSAGE);
    }
}
