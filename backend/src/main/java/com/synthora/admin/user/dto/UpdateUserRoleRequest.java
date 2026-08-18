package com.synthora.admin.user.dto;

import com.synthora.identity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role cannot be null")
        UserRole role
) {
}
