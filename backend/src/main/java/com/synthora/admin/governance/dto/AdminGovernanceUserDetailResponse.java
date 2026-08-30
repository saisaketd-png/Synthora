package com.synthora.admin.governance.dto;

import com.synthora.admin.user.dto.AdminUserDetailResponse;
import java.util.List;

public record AdminGovernanceUserDetailResponse(
        AdminUserDetailResponse user,
        AccountSuspensionResponse currentSuspension,
        List<AccountSuspensionResponse> suspensionHistory,
        List<AdminAppealResponse> appealsHistory
) {}
