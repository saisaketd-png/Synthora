package com.synthora.identity.dto;

import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status
) {
}
