package com.synthora.admin.governance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SuspendUserRequest(
        @NotBlank(message = "Suspension reason is mandatory")
        @Size(max = 2000, message = "Suspension reason cannot exceed 2000 characters")
        String reason,

        @Size(max = 4000, message = "Internal notes cannot exceed 4000 characters")
        String internalNotes
) {}
