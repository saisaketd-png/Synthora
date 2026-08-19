package com.synthora.product.dto;

import java.util.UUID;

public record DuplicateCandidateResponse(
        UUID masterProductIdA,
        String codeA,
        String nameA,
        String casA,
        String formulaA,
        UUID masterProductIdB,
        String codeB,
        String nameB,
        String casB,
        String formulaB,
        String confidenceLevel, // HIGH, MEDIUM, LOW
        String reason
) {}
