package com.synthora.buyer.shortlist.dto;

import java.util.UUID;

public record AddShortlistItemRequest(
        UUID supplierOfferingId
) {}
