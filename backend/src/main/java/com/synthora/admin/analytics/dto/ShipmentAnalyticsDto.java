package com.synthora.admin.analytics.dto;

public record ShipmentAnalyticsDto(
        long totalShipments,
        long activeShipments,
        long deliveredShipments,
        long delayedShipments
) {
}
