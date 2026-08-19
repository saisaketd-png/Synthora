package com.synthora.notification.events;

import java.util.UUID;

public record RfqCancelledEvent(
        UUID rfqId,
        UUID buyerId,
        Long supplierId,
        String reason
) {
}
