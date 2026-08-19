package com.synthora.seller.verification;

import com.synthora.seller.verification.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/suppliers/{supplierId}/verification")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupplierVerificationController {

    private final SupplierVerificationService verificationService;

    public AdminSupplierVerificationController(SupplierVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @GetMapping
    public ResponseEntity<SupplierVerificationWorkspaceDto> getVerificationDetails(@PathVariable Long supplierId) {
        return ResponseEntity.ok(verificationService.getVerificationDetails(supplierId));
    }

    @PostMapping("/start-review")
    public ResponseEntity<SupplierVerificationWorkspaceDto> startReview(
            @PathVariable Long supplierId,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.startReview(supplierId, authentication));
    }

    @PostMapping("/items/{type}/verify")
    public ResponseEntity<SupplierVerificationWorkspaceDto> verifyItem(
            @PathVariable Long supplierId,
            @PathVariable VerificationType type,
            @RequestBody(required = false) VerifyItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.verifyItem(
                supplierId,
                type,
                request != null ? request.documentId() : null,
                request != null ? request.notes() : null,
                authentication
        ));
    }

    @PostMapping("/items/{type}/flag")
    public ResponseEntity<SupplierVerificationWorkspaceDto> flagItem(
            @PathVariable Long supplierId,
            @PathVariable VerificationType type,
            @RequestBody(required = false) VerifyItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.flagItem(
                supplierId,
                type,
                request != null ? request.notes() : null,
                authentication
        ));
    }

    @PostMapping("/items/{type}/reject")
    public ResponseEntity<SupplierVerificationWorkspaceDto> rejectItem(
            @PathVariable Long supplierId,
            @PathVariable VerificationType type,
            @RequestBody(required = false) RejectSupplierRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.rejectItem(
                supplierId,
                type,
                request != null ? request.reason() : null,
                authentication
        ));
    }

    @PostMapping("/request-info")
    public ResponseEntity<SupplierVerificationWorkspaceDto> requestInformation(
            @PathVariable Long supplierId,
            @RequestBody RequestInfoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.requestInformation(
                supplierId,
                request.requestedNotes(),
                authentication
        ));
    }

    @PostMapping("/finalize")
    public ResponseEntity<SupplierVerificationWorkspaceDto> finalizeVerification(
            @PathVariable Long supplierId,
            @RequestBody(required = false) FinalizeVerificationRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.finalizeVerification(
                supplierId,
                request != null ? request.overrideReason() : null,
                authentication
        ));
    }

    @PostMapping("/reject")
    public ResponseEntity<SupplierVerificationWorkspaceDto> rejectSupplier(
            @PathVariable Long supplierId,
            @RequestBody RejectSupplierRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.rejectSupplier(
                supplierId,
                request.reason(),
                authentication
        ));
    }

    @PostMapping("/suspend")
    public ResponseEntity<SupplierVerificationWorkspaceDto> suspendSupplier(
            @PathVariable Long supplierId,
            @RequestBody SuspendSupplierRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.suspendSupplier(
                supplierId,
                request.reason(),
                authentication
        ));
    }
}
