package com.kemkendra.seller.verification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record VerificationAuditDto(
        UUID id,
        String adminName,
        String previousStatus,
        String newStatus,
        String notes,
        LocalDateTime timestamp
) {}
