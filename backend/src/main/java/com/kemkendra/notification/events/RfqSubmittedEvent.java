package com.kemkendra.notification.events;

import java.util.UUID;

/**
 * Fired after a buyer successfully submits an RFQ.
 * Recipient: the targeted supplier.
 */
public record RfqSubmittedEvent(
        UUID rfqId,
        UUID buyerId,
        Long supplierId
) {}
