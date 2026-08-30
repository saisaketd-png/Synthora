package com.kemkendra.governance.dto;

import com.kemkendra.governance.GovernanceAction;
import java.time.LocalDateTime;
import java.util.UUID;

public record GovernanceAuditLogResponse(
        UUID id,
        UUID actorId,
        String actorName,
        String actorEmail,
        GovernanceAction action,
        String entityType,
        String entityId,
        String previousState,
        String newState,
        String reason,
        LocalDateTime timestamp
) {}
