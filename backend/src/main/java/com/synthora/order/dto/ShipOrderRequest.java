package com.synthora.order.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record ShipOrderRequest(
        @NotBlank(message = "Carrier is required")
        String carrier,
        
        @NotBlank(message = "Tracking number is required")
        String trackingNumber,
        
        LocalDate estimatedDeliveryDate
) {}
