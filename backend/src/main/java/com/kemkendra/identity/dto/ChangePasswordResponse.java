package com.kemkendra.identity.dto;

public record ChangePasswordResponse(
        String message
) {
    public static final String DEFAULT_SUCCESS_MESSAGE = "Password updated successfully.";

    public static ChangePasswordResponse ofDefault() {
        return new ChangePasswordResponse(DEFAULT_SUCCESS_MESSAGE);
    }
}
