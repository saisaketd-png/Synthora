package com.kemkendra.order.dto;

import com.kemkendra.order.OrderStatus;

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
        UUID masterProductId,
        String masterProductCode,
        UUID supplierOfferingId,
        String rfqReference,
        String quotationReference,
        Integer quotationVersion,
        String productName,
        BigDecimal purity,
        String grade,
        String packaging,
        BigDecimal quantity,
        String unit,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        String currency,
        Integer agreedLeadTimeDays,
        String paymentTerms,
        String deliveryTerms,
        String incoterms,
        String shippingAddress,
        String billingContact,
        String notes,
        OrderStatus status,
        LocalDateTime placedAt,
        LocalDateTime confirmedAt,
        String confirmedBy,
        LocalDateTime processingAt,
        LocalDateTime shippedAt,
        LocalDateTime deliveredAt,
        LocalDateTime completedAt,
        LocalDateTime rejectedAt,
        String rejectedBy,
        String rejectionReason,
        LocalDateTime cancelledAt,
        String cancelledBy,
        String cancellationReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

