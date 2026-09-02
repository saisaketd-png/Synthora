package com.kemkendra.admin.config.api;

import com.kemkendra.admin.config.FeatureToggleService;
import com.kemkendra.admin.config.dto.AdminConfigDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/feature-controls")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFeatureControlController {

    private final FeatureToggleService featureToggleService;

    public AdminFeatureControlController(FeatureToggleService featureToggleService) {
        this.featureToggleService = featureToggleService;
    }

    @GetMapping
    public ResponseEntity<FeatureFlagsResponse> getAllFeatures() {
        return ResponseEntity.ok(featureToggleService.getAllFeatures());
    }

    @PutMapping("/{key}")
    public ResponseEntity<PlatformFeatureFlagDto> updateFeatureFlag(
            @PathVariable String key,
            @Valid @RequestBody UpdateFeatureFlagRequest request,
            Authentication authentication) {
        String actorEmail = authentication.getName();
        return ResponseEntity.ok(featureToggleService.updateFeatureFlag(key, request, actorEmail));
    }
}
