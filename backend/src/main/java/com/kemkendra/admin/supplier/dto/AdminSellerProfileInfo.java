package com.kemkendra.admin.supplier.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminSellerProfileInfo(
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
