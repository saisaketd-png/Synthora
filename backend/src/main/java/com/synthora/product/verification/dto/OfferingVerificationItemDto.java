package com.synthora.product.verification.dto;

import com.synthora.product.verification.OfferingEvidenceStatus;
import com.synthora.product.verification.OfferingVerificationType;

import java.util.UUID;

public record OfferingVerificationItemDto(
        String title,
        OfferingVerificationType verificationType,
        OfferingEvidenceStatus status,
        boolean mandatory,
        UUID evidenceDocumentId,
        String adminNotes,
        String rejectionReason
) {}
