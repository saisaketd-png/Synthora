package com.kemkendra.product.verification.dto;

import com.kemkendra.product.verification.OfferingEvidenceStatus;
import com.kemkendra.product.verification.OfferingVerificationType;

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
