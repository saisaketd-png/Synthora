package com.kemkendra.seller.verification.dto;

import com.kemkendra.seller.verification.EvidenceStatus;
import com.kemkendra.seller.verification.VerificationType;

import java.util.UUID;

public record VerificationChecklistItemDto(
        String title,
        VerificationType verificationType,
        EvidenceStatus status,
        boolean mandatory,
        UUID evidenceDocumentId,
        String adminNotes,
        String rejectionReason
) {}
