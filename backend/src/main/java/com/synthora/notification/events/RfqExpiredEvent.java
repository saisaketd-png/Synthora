package com.synthora.notification.events;

import java.util.UUID;

public record RfqExpiredEvent(
        UUID rfqId,
        UUID buyerId,
        Long supplierId
) {
}
