package com.kemkendra.admin.audit.dto;

import com.kemkendra.admin.audit.AuditAction;
import com.kemkendra.admin.audit.AuditTargetType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Enriched administrative audit log record for UI inspection.
 * Decoupled and enriched with resolved actor name and email without N+1 overhead.
 */
public record AdminAuditLogResponse(
        UUID id,
        UUID adminId,
        String adminName,
        String adminEmail,
        AuditAction action,
        AuditTargetType targetType,
        String targetId,
        String details,
        String ipAddress,
        LocalDateTime createdAt
) {
}
