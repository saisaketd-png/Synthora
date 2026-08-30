package com.kemkendra.admin.governance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminRequestInfoRequest(
        @NotBlank(message = "Information request message is mandatory")
        @Size(max = 2000, message = "Message cannot exceed 2000 characters")
        String message,

        @Size(max = 4000, message = "Internal notes cannot exceed 4000 characters")
        String internalNotes
) {}
