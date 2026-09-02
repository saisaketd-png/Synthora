package com.kemkendra.notification.dto;

import com.kemkendra.notification.Notification;
import com.kemkendra.notification.NotificationCategory;
import com.kemkendra.notification.NotificationEntityType;
import com.kemkendra.notification.NotificationPriority;
import com.kemkendra.notification.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Public DTO representing a notification for frontend consumption.
 * Does NOT expose password hashes, tokens, or internal recipient secrets.
 */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        NotificationCategory category,
        NotificationPriority priority,
        String title,
        String message,
        NotificationEntityType entityType,
        UUID entityId,
        String targetRoute,
        boolean read,
        LocalDateTime readAt,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        String route = resolveSafeTargetRoute(n.getEntityType(), n.getEntityId(), n.getType());
        return new NotificationResponse(
                n.getId(),
                n.getType(),
                n.getCategory() != null ? n.getCategory() : Notification.deriveCategoryFromType(n.getType()),
                n.getPriority() != null ? n.getPriority() : Notification.derivePriorityFromType(n.getType()),
                n.getTitle(),
                n.getMessage(),
                n.getEntityType(),
                n.getEntityId(),
                route,
                n.isRead(),
                n.getReadAt(),
                n.getCreatedAt()
        );
    }

    public static String resolveSafeTargetRoute(NotificationEntityType entityType, UUID entityId, NotificationType type) {
        if (type == NotificationType.USER_SUSPENDED || type == NotificationType.USER_REINSTATED
                || type == NotificationType.APPEAL_SUBMITTED || type == NotificationType.APPEAL_REVIEW_STARTED
                || type == NotificationType.APPEAL_INFORMATION_REQUIRED || type == NotificationType.APPEAL_APPROVED
                || type == NotificationType.APPEAL_REJECTED) {
            return "/dashboard/account-review";
        }

        if (entityType == null) {
            return "/dashboard/notifications";
        }

        return switch (entityType) {
            case RFQ -> entityId != null ? "/dashboard/rfqs/" + entityId : "/dashboard/rfqs";
            case QUOTATION -> entityId != null ? "/dashboard/rfqs/" + entityId : "/dashboard/rfqs";
            case PURCHASE_ORDER -> entityId != null ? "/dashboard/orders/" + entityId : "/dashboard/orders";
            case SHIPMENT -> entityId != null ? "/dashboard/orders/" + entityId : "/dashboard/orders";
            case SUPPLIER -> "/dashboard/supplier/verification";
            case SUPPLIER_OFFERING -> entityId != null ? "/dashboard/supplier/products/" + entityId : "/dashboard/supplier/products";
            case MASTER_PRODUCT -> entityId != null ? "/products/" + entityId : "/products";
            case ACCOUNT_SUSPENSION, ACCOUNT_SUSPENSION_APPEAL -> "/dashboard/account-review";
            default -> "/dashboard/notifications";
        };
    }
}
