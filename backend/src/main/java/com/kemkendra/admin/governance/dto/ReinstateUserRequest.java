package com.kemkendra.admin.governance.dto;

import jakarta.validation.constraints.Size;

public record ReinstateUserRequest(
        @Size(max = 2000, message = "Reinstatement notes cannot exceed 2000 characters")
        String notes
) {}
