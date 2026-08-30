package com.kemkendra.notification.dto;

import com.kemkendra.notification.Notification;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.notification.NotificationType;

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
