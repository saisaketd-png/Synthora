package com.synthora.notification.events;

import java.util.UUID;

public record PurchaseOrderCancelledEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId,
        String reason
) {}
