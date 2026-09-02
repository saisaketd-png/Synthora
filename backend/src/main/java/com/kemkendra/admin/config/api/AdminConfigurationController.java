package com.kemkendra.admin.config.api;

import com.kemkendra.admin.config.PlatformPolicyService;
import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/settings")
@PreAuthorize("hasRole('ADMIN')")
public class AdminConfigurationController {

    private final PlatformPolicyService policyService;

    public AdminConfigurationController(PlatformPolicyService policyService) {
        this.policyService = policyService;
    }

    @GetMapping
    public ResponseEntity<PlatformSettingsResponse> getAllSettings() {
        return ResponseEntity.ok(policyService.getAllSettingsGrouped());
    }

    @PutMapping("/{key}")
    public ResponseEntity<PlatformSettingDto> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody UpdatePlatformSettingRequest request,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(policyService.updateSetting(key, request, actorEmail));
    }
}
