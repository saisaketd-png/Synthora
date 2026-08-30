package com.kemkendra.admin.analytics.dto;

public record ActionCenterCounterDto(
        String id,
        String category,
        String severity,
        String title,
        String description,
        long count,
        String actionUrl
) {
}
