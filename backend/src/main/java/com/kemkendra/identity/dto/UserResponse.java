package com.kemkendra.identity.dto;

import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;

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
