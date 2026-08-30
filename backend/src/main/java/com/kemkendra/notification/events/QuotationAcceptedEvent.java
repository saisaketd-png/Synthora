package com.kemkendra.notification.events;

import java.util.UUID;

/**
 * Fired after a buyer accepts a supplier's quotation.
 * Recipient: the supplier whose quotation was accepted.
 */
public record QuotationAcceptedEvent(
        UUID quotationId,
        UUID rfqId,
        UUID buyerId,
        Long supplierId
) {}
