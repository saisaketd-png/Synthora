package com.kemkendra.admin.analytics.dto;

public record ShipmentAnalyticsDto(
        long totalShipments,
        long activeShipments,
        long deliveredShipments,
        long delayedShipments
) {
}
