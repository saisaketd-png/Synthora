package com.kemkendra.product.dto;

import java.util.List;

public record BulkSynonymsResponse(
        int addedCount,
        int skippedCount,
        List<ProductSynonymResponse> addedSynonyms,
        List<ProductSynonymResponse> allSynonyms
) {}
