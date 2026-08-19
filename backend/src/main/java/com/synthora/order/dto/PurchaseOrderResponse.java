package com.synthora.order.dto;

import com.synthora.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id,
        String poNumber,
        UUID rfqId,
        UUID quotationId,
        UUID buyerId,
        Long supplierId,
        UUID productId,
        String productName,
        BigDecimal quantity,
        String unit,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        String currency,
        Integer agreedLeadTimeDays,
        String shippingAddress,
        String billingContact,
        String notes,
        OrderStatus status,
        LocalDateTime placedAt,
        LocalDateTime confirmedAt,
        LocalDateTime processingAt,
        LocalDateTime shippedAt,
        LocalDateTime deliveredAt,
        LocalDateTime rejectedAt,
        String rejectionReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

