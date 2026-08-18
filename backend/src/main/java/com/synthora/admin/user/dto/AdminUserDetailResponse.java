package com.synthora.admin.user.dto;

import com.synthora.identity.UserRole;
import com.synthora.identity.UserStatus;

import java.time.Instant;
import java.util.UUID;

public record AdminUserDetailResponse(
        UUID id,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt,
        UUID deletedBy
) {
}
