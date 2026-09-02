package com.kemkendra.notification.preference.dto;

import com.kemkendra.notification.NotificationCategory;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class NotificationPreferenceDtos {

    public record NotificationPreferenceItemDto(
            NotificationCategory category,
            boolean inAppEnabled,
            boolean emailEnabled,
            boolean mandatory
    ) {}

    public record NotificationPreferencesResponse(
            List<NotificationPreferenceItemDto> preferences
    ) {}

    public record UpdateNotificationPreferenceRequest(
            @NotNull(message = "Notification category is required")
            NotificationCategory category,
            Boolean inAppEnabled,
            Boolean emailEnabled
    ) {}

    public record BulkUpdateNotificationPreferencesRequest(
            @NotNull(message = "Preferences list is required")
            List<UpdateNotificationPreferenceRequest> preferences
    ) {}
}
