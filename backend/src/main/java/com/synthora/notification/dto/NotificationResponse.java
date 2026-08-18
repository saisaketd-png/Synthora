package com.synthora.notification.dto;

import com.synthora.notification.Notification;
import com.synthora.notification.NotificationEntityType;
import com.synthora.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Public DTO representing a notification for frontend consumption.
 * Does NOT expose internal recipient/user/supplier IDs.
 */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        String title,
        String message,
        NotificationEntityType entityType,
        UUID entityId,
        boolean read,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getEntityType(),
                n.getEntityId(),
                n.isRead(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }
}
