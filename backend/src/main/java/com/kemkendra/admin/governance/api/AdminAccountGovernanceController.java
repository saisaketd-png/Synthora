package com.kemkendra.admin.governance.api;

import com.kemkendra.admin.governance.AccountGovernanceService;
import com.kemkendra.admin.governance.AppealStatus;
import com.kemkendra.admin.governance.dto.*;
import com.kemkendra.identity.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/account-governance")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountGovernanceController {

    private final AccountGovernanceService governanceService;

    public AdminAccountGovernanceController(AccountGovernanceService governanceService) {
        this.governanceService = governanceService;
    }

    @GetMapping("/suspensions")
    public ResponseEntity<Page<AccountSuspensionResponse>> getSuspensions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Boolean activeOnly,
            @RequestParam(required = false) UserRole role) {

        return ResponseEntity.ok(governanceService.getSuspensions(page, size, query, activeOnly, role));
    }

    @GetMapping("/suspensions/{id}")
    public ResponseEntity<AccountSuspensionResponse> getSuspensionDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(governanceService.getSuspensionDetail(id));
    }

    @GetMapping("/users/{userId}/detail")
    public ResponseEntity<AdminGovernanceUserDetailResponse> getUserGovernanceDetail(@PathVariable UUID userId) {
        return ResponseEntity.ok(governanceService.getUserGovernanceDetail(userId));
    }

    @PostMapping("/users/{userId}/suspend")
    public ResponseEntity<AccountSuspensionResponse> suspendUser(
            @PathVariable UUID userId,
            @Valid @RequestBody SuspendUserRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(governanceService.suspendUser(userId, request, authentication, servletRequest));
    }

    @PostMapping("/users/{userId}/reinstate")
    public ResponseEntity<AccountSuspensionResponse> reinstateUser(
            @PathVariable UUID userId,
            @RequestBody(required = false) ReinstateUserRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(governanceService.reinstateUser(userId, request, authentication, servletRequest));
    }

    @GetMapping("/appeals")
    public ResponseEntity<Page<AdminAppealResponse>> getAppeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) AppealStatus status,
            @RequestParam(required = false) String query) {

        return ResponseEntity.ok(governanceService.getAppeals(page, size, status, query));
    }

    @GetMapping("/appeals/{appealId}")
    public ResponseEntity<AdminAppealResponse> getAppealDetail(@PathVariable UUID appealId) {
        return ResponseEntity.ok(governanceService.getAppealDetail(appealId));
    }

    @PostMapping("/appeals/{appealId}/review")
    public ResponseEntity<AdminAppealResponse> startReview(
            @PathVariable UUID appealId,
            @RequestBody(required = false) AdminAppealActionRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(governanceService.startReview(appealId, request, authentication, servletRequest));
    }

    @PostMapping("/appeals/{appealId}/request-information")
    public ResponseEntity<AdminAppealResponse> requestInformation(
            @PathVariable UUID appealId,
            @Valid @RequestBody AdminRequestInfoRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(governanceService.requestInformation(appealId, request, authentication, servletRequest));
    }

    @PostMapping("/appeals/{appealId}/approve")
    public ResponseEntity<AdminAppealResponse> approveAppeal(
            @PathVariable UUID appealId,
            @RequestBody(required = false) AdminAppealActionRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(governanceService.approveAppeal(appealId, request, authentication, servletRequest));
    }

    @PostMapping("/appeals/{appealId}/reject")
    public ResponseEntity<AdminAppealResponse> rejectAppeal(
            @PathVariable UUID appealId,
            @RequestBody(required = false) AdminAppealActionRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(governanceService.rejectAppeal(appealId, request, authentication, servletRequest));
    }
}
