package com.synthora.admin.supplier.api;

import com.synthora.admin.supplier.AdminSupplierService;
import com.synthora.admin.supplier.dto.*;
import com.synthora.identity.UserStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing administrative supplier moderation endpoints.
 * Strictly restricted to administrators via {@code @PreAuthorize("hasRole('ADMIN')")}.
 */
@RestController
@RequestMapping("/api/v1/admin/suppliers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupplierController {

    private final AdminSupplierService adminSupplierService;

    public AdminSupplierController(AdminSupplierService adminSupplierService) {
        this.adminSupplierService = adminSupplierService;
    }

    @GetMapping
    public ResponseEntity<Page<AdminSupplierResponse>> getSuppliers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) Boolean exportReady,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {

        String effectiveQuery = (query != null && !query.trim().isEmpty()) ? query : q;
        Page<AdminSupplierResponse> suppliers = adminSupplierService.getSuppliers(
                page,
                size,
                effectiveQuery,
                country,
                verified,
                exportReady,
                status,
                includeDeleted
        );
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminSupplierDetailResponse> getSupplierDetail(@PathVariable Long id) {
        return ResponseEntity.ok(adminSupplierService.getSupplierDetail(id));
    }

    @PutMapping("/{id}/verification")
    public ResponseEntity<AdminSupplierResponse> updateVerification(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierVerificationRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminSupplierService.updateVerification(id, request, authentication, servletRequest));
    }

    @PutMapping("/{id}/export-ready")
    public ResponseEntity<AdminSupplierResponse> updateExportReady(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierExportReadyRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminSupplierService.updateExportReady(id, request, authentication, servletRequest));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AdminSupplierResponse> updateSupplierStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierStatusRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {

        return ResponseEntity.ok(adminSupplierService.updateSupplierStatus(id, request, authentication, servletRequest));
    }

    @PostMapping("/{id}/verification/start-review")
    public ResponseEntity<AdminSupplierResponse> startReview(
            @PathVariable Long id,
            @RequestBody(required = false) com.synthora.seller.dto.SupplierVerificationPayload payload,
            Authentication authentication) {
        String notes = payload != null ? payload.notes() : "Review started by Admin";
        return ResponseEntity.ok(adminSupplierService.transitionSupplierVerification(id, com.synthora.seller.SupplierVerificationStatus.UNDER_REVIEW, notes, authentication));
    }

    @PostMapping("/{id}/verification/request-info")
    public ResponseEntity<AdminSupplierResponse> requestVerificationInfo(
            @PathVariable Long id,
            @RequestBody com.synthora.seller.dto.SupplierVerificationPayload payload,
            Authentication authentication) {
        String notes = payload != null ? payload.notes() : "Information required";
        return ResponseEntity.ok(adminSupplierService.transitionSupplierVerification(id, com.synthora.seller.SupplierVerificationStatus.INFORMATION_REQUIRED, notes, authentication));
    }

    @PostMapping("/{id}/verification/verify")
    public ResponseEntity<AdminSupplierResponse> verifySupplier(
            @PathVariable Long id,
            @RequestBody(required = false) com.synthora.seller.dto.SupplierVerificationPayload payload,
            Authentication authentication) {
        String notes = payload != null ? payload.notes() : "Supplier verified by Admin";
        return ResponseEntity.ok(adminSupplierService.transitionSupplierVerification(id, com.synthora.seller.SupplierVerificationStatus.VERIFIED, notes, authentication));
    }

    @PostMapping("/{id}/verification/reject")
    public ResponseEntity<AdminSupplierResponse> rejectSupplier(
            @PathVariable Long id,
            @RequestBody com.synthora.seller.dto.SupplierVerificationPayload payload,
            Authentication authentication) {
        String notes = payload != null ? payload.notes() : "Supplier verification rejected";
        return ResponseEntity.ok(adminSupplierService.transitionSupplierVerification(id, com.synthora.seller.SupplierVerificationStatus.REJECTED, notes, authentication));
    }

    @PostMapping("/{id}/verification/suspend")
    public ResponseEntity<AdminSupplierResponse> suspendSupplier(
            @PathVariable Long id,
            @RequestBody com.synthora.seller.dto.SupplierVerificationPayload payload,
            Authentication authentication) {
        String notes = payload != null ? payload.notes() : "Supplier verification suspended";
        return ResponseEntity.ok(adminSupplierService.transitionSupplierVerification(id, com.synthora.seller.SupplierVerificationStatus.SUSPENDED, notes, authentication));
    }
}
