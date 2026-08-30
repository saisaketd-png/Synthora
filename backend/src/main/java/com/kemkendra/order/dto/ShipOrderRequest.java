package com.kemkendra.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ShipOrderRequest(
        @NotBlank(message = "Carrier is required")
        @Size(max = 100, message = "Carrier must not exceed 100 characters")
        String carrier,
        
        @NotBlank(message = "Tracking number is required")
        @Size(max = 100, message = "Tracking number must not exceed 100 characters")
        String trackingNumber,
        
        LocalDate estimatedDeliveryDate
) {}
