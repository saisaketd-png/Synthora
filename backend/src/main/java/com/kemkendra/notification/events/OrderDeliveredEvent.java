package com.kemkendra.notification.events;

import java.util.UUID;

/**
 * Fired after a supplier marks an order as delivered.
 * Recipient: the buyer who issued the PO.
 */
public record OrderDeliveredEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId
) {}
