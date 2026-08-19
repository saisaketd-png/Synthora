package com.synthora.buyer.shortlist.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record BuyerShortlistResponse(
        UUID shortlistId,
        UUID buyerId,
        int totalItems,
        List<ShortlistItemDto> items,
        LocalDateTime updatedAt
) {}
