package com.kemkendra.admin.user.dto;

import com.kemkendra.identity.UserStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserStatusRequest(
        @NotNull(message = "Status cannot be null")
        UserStatus status,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}
