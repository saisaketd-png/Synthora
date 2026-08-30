package com.kemkendra.admin.transaction.dto;

import com.kemkendra.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminPurchaseOrderDetailResponse(
        UUID id,
        String poNumber,
        UUID rfqId,
        UUID quotationId,
        UUID buyerId,
        String buyerName,
        String buyerEmail,
        Long supplierId,
        String supplierName,
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
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        AdminShipmentSummary shipment
) {
}
