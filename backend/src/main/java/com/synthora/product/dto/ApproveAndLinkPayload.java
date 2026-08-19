package com.synthora.product.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ApproveAndLinkPayload(
        @NotNull(message = "Target Master Product ID is required")
        UUID existingMasterProductId,

        String adminNotes
) {}
