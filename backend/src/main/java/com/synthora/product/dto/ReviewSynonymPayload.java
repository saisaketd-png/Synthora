package com.synthora.product.dto;

import com.synthora.product.SynonymStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewSynonymPayload(
        @NotNull(message = "Status cannot be null")
        SynonymStatus status
) {}
