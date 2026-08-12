package com.synthora.seller.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record SellerProfileResponse(
        UUID id,
        String companyName,
        String gstNumber,
        String address,
        String city,
        String state,
        String country,
        String website,
        String certifications,
        String aboutCompany,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}