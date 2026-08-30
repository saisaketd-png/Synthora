package com.kemkendra.admin.user.dto;

import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;

import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt
) {
}
