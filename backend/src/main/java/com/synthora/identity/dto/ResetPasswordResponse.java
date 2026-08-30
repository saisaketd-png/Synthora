package com.synthora.identity.dto;

public record ResetPasswordResponse(
        String message
) {
    public static final String DEFAULT_SUCCESS_MESSAGE = 
            "Password has been successfully reset. You can now log in with your new password.";

    public static ResetPasswordResponse ofDefault() {
        return new ResetPasswordResponse(DEFAULT_SUCCESS_MESSAGE);
    }
}
