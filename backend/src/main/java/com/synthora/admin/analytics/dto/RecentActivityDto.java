package com.synthora.admin.analytics.dto;

import java.time.LocalDateTime;

public record RecentActivityDto(
        String id,
        String eventType,
        String title,
        String description,
        String entityType,
        String entityId,
        String actorName,
        String actorRole,
        LocalDateTime timestamp,
        String link
) {
}
