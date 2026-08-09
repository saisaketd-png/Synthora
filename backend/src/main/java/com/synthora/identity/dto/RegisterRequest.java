package com.synthora.identity.dto;

public record RegisterRequest(
        String name,
        String email,
        String phone,
        String password
) {
}
