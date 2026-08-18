package com.synthora.notification.events;

import java.util.UUID;

/**
 * Fired after a supplier ships an order.
 * Recipient: the buyer who issued the PO.
 */
public record OrderShippedEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId,
        UUID shipmentId
) {}
