package com.synthora.seller.verification.dto;

import java.util.UUID;

public record VerifyItemRequest(
        UUID documentId,
        String notes
) {}
