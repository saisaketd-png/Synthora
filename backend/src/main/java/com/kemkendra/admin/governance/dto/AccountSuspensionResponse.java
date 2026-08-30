package com.kemkendra.admin.governance.dto;

import com.kemkendra.identity.UserRole;
import java.time.Instant;
import java.util.UUID;

public record AccountSuspensionResponse(
        UUID id,
        UUID userId,
        String userName,
        String userEmail,
        UserRole userRole,
        UUID suspendedByAdminId,
        String suspendedByAdminName,
        String reason,
        String internalNotes,
        Instant suspendedAt,
        Instant reinstatedAt,
        UUID reinstatedByAdminId,
        String reinstatedByAdminName,
        String reinstatementNotes,
        boolean active
) {}
