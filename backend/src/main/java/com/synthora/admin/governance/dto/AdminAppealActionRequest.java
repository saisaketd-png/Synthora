package com.synthora.admin.governance.dto;

import jakarta.validation.constraints.Size;

public record AdminAppealActionRequest(
        @Size(max = 2000, message = "Reason cannot exceed 2000 characters")
        String reason,

        @Size(max = 4000, message = "Internal notes cannot exceed 4000 characters")
        String internalNotes
) {}
