package com.synthora.account.dto;

import com.synthora.admin.governance.AppealStatus;
import java.time.Instant;
import java.util.UUID;

public record UserAppealResponse(
        UUID id,
        UUID suspensionId,
        AppealStatus status,
        String submittedReason,
        String userResponse,
        String adminResponse,
        Instant requestedAt,
        Instant reviewedAt,
        Instant createdAt,
        Instant updatedAt
) {}
