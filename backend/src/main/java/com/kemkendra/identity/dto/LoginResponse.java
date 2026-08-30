package com.kemkendra.identity.dto;

public record LoginResponse(
        String message,
        String token
) {
}