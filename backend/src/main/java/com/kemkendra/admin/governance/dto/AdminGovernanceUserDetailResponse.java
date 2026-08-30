package com.kemkendra.admin.governance.dto;

import com.kemkendra.admin.user.dto.AdminUserDetailResponse;
import java.util.List;

public record AdminGovernanceUserDetailResponse(
        AdminUserDetailResponse user,
        AccountSuspensionResponse currentSuspension,
        List<AccountSuspensionResponse> suspensionHistory,
        List<AdminAppealResponse> appealsHistory
) {}
