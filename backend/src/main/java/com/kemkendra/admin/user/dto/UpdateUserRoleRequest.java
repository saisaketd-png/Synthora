package com.kemkendra.admin.user.dto;

import com.kemkendra.identity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role cannot be null")
        UserRole role
) {
}
