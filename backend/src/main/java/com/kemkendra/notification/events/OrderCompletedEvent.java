package com.kemkendra.notification.events;

import java.util.UUID;

public record OrderCompletedEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId,
        UUID completedByUserId
) {
    public OrderCompletedEvent(UUID purchaseOrderId, UUID buyerId, Long supplierId) {
        this(purchaseOrderId, buyerId, supplierId, null);
    }
}
