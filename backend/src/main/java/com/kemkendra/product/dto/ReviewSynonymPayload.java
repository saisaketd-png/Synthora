package com.kemkendra.product.dto;

import com.kemkendra.product.SynonymStatus;
import jakarta.validation.constraints.NotNull;

public record ReviewSynonymPayload(
        @NotNull(message = "Status cannot be null")
        SynonymStatus status
) {}
