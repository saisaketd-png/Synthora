package com.kemkendra.notification.events;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Fired after a buyer successfully submits a counter offer on an RFQ.
 * Recipient: the supplier targeted by the RFQ.
 */
public record CounterOfferSubmittedEvent(
        UUID quotationId,
        UUID rfqId,
        UUID buyerId,
        Long supplierId,
        BigDecimal unitPrice,
        String currency
) {}
