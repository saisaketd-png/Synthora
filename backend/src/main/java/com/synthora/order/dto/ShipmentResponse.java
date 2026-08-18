package com.synthora.order.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record ShipmentResponse(
        UUID id,
        String carrier,
        String trackingNumber,
        LocalDate estimatedDeliveryDate,
        LocalDateTime shippedAt
) {}
