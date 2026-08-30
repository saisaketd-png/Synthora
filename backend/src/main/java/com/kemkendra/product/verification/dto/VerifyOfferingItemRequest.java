package com.kemkendra.product.verification.dto;

import java.util.UUID;

public record VerifyOfferingItemRequest(
        UUID documentId,
        String notes
) {}
