package com.synthora.seller.verification.dto;

import com.synthora.seller.verification.EvidenceStatus;
import com.synthora.seller.verification.VerificationType;

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
