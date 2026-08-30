package com.kemkendra.account.dto;

import java.time.Instant;
import java.util.UUID;

public record UserSuspensionDetailResponse(
        boolean isSuspended,
        UUID suspensionId,
        Instant suspendedAt,
        String reason,
        UserAppealResponse activeAppeal
) {}
