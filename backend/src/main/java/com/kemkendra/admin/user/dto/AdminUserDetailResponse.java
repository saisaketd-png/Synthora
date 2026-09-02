package com.kemkendra.admin.user.dto;

import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;

import java.time.Instant;
import java.util.UUID;

public record AdminUserDetailResponse(
        UUID id,
        String name,
        String email,
        String phone,
        UserRole role,
        UserStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant deletedAt,
        UUID deletedBy,
        boolean termsAccepted,
        String termsVersion,
        Instant termsAcceptedAt,
        boolean privacyAccepted,
        String privacyVersion,
        Instant privacyAcceptedAt,
        boolean emailVerified,
        Instant emailVerifiedAt,
        Long supplierId,
        String supplierName,
        String supplierVerificationStatus,
        boolean suspended,
        String suspensionReason,
        Instant suspensionDate,
        UUID openAppealId,
        String openAppealStatus,
        long rfqCount,
        long orderCount
) {
}
