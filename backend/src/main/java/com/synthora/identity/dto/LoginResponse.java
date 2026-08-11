package com.synthora.identity.dto;

public record LoginResponse(
        String message,
        String token
) {
}