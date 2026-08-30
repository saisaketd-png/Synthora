package com.kemkendra.identity.dto;

import java.util.UUID;

public record SupplierRegisterResponse(
        String message,
        UUID userId,
        String email,
        Long supplierId
) {
}
