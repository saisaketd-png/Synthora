package com.synthora.admin.transaction.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminShipmentSummary(
        UUID id,
        String carrier,
        String trackingNumber,
        LocalDate estimatedDeliveryDate,
        LocalDateTime shippedAt
) {
}
