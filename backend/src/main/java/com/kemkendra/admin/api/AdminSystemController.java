package com.kemkendra.admin.api;

import com.kemkendra.admin.AdminSystemDataResetService;
import com.kemkendra.admin.dto.TestDataResetReportResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/system")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemController {

    private final AdminSystemDataResetService dataResetService;

    public AdminSystemController(AdminSystemDataResetService dataResetService) {
        this.dataResetService = dataResetService;
    }

    @PostMapping("/test-data-reset")
    public ResponseEntity<TestDataResetReportResponse> resetTestData(Authentication authentication) {
        return ResponseEntity.ok(dataResetService.executeTestDataReset(authentication));
    }
}
