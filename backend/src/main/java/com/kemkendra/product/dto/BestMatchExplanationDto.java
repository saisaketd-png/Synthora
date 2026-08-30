package com.kemkendra.product.dto;

import java.util.List;

public record BestMatchExplanationDto(
        boolean isBestMatch,
        int score,
        List<String> positiveFactors,
        String explanationText
) {}
