package com.kemkendra.product.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record BulkAddSynonymsPayload(
        @NotNull(message = "Synonyms list is required")
        List<String> synonyms
) {}
