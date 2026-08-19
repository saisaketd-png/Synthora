package com.synthora.product.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MergeMasterProductsPayload(
        @NotNull(message = "Source MasterProduct ID is required")
        UUID sourceMasterProductId,

        @NotNull(message = "Target MasterProduct ID is required")
        UUID targetMasterProductId,

        String adminNotes
) {}
