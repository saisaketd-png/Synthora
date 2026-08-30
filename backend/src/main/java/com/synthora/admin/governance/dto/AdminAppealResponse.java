package com.synthora.admin.governance.dto;

import com.synthora.admin.governance.AppealStatus;
import com.synthora.identity.UserRole;
import java.time.Instant;
import java.util.UUID;

public record AdminAppealResponse(
        UUID id,
        UUID suspensionId,
        UUID userId,
        String userName,
        String userEmail,
        UserRole userRole,
        AppealStatus status,
        String submittedReason,
        String userResponse,
        String adminResponse,
        String adminInternalNotes,
        Instant requestedAt,
        Instant reviewedAt,
        UUID reviewedByAdminId,
        String reviewedByAdminName,
        Instant createdAt,
        Instant updatedAt
) {}
