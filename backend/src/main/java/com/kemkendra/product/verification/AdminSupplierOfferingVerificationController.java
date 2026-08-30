package com.kemkendra.product.verification;

import com.kemkendra.product.verification.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/offerings/{offeringId}/verification")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupplierOfferingVerificationController {

    private final SupplierOfferingVerificationService verificationService;

    public AdminSupplierOfferingVerificationController(SupplierOfferingVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @GetMapping
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> getOfferingVerificationDetails(@PathVariable UUID offeringId) {
        return ResponseEntity.ok(verificationService.getOfferingVerificationDetails(offeringId));
    }

    @PostMapping("/start-review")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> startOfferingReview(
            @PathVariable UUID offeringId,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.startOfferingReview(offeringId, authentication));
    }

    @PostMapping("/items/{type}/verify")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> verifyOfferingItem(
            @PathVariable UUID offeringId,
            @PathVariable OfferingVerificationType type,
            @RequestBody(required = false) VerifyOfferingItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.verifyOfferingItem(
                offeringId,
                type,
                request != null ? request.documentId() : null,
                request != null ? request.notes() : null,
                authentication
        ));
    }

    @PostMapping("/items/{type}/flag")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> flagOfferingItem(
            @PathVariable UUID offeringId,
            @PathVariable OfferingVerificationType type,
            @RequestBody(required = false) VerifyOfferingItemRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.flagOfferingItem(
                offeringId,
                type,
                request != null ? request.notes() : null,
                authentication
        ));
    }

    @PostMapping("/items/{type}/reject")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> rejectOfferingItem(
            @PathVariable UUID offeringId,
            @PathVariable OfferingVerificationType type,
            @RequestBody(required = false) RejectOfferingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.rejectOfferingItem(
                offeringId,
                type,
                request != null ? request.reason() : null,
                authentication
        ));
    }

    @PostMapping("/request-info")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> requestOfferingInformation(
            @PathVariable UUID offeringId,
            @RequestBody RequestOfferingInfoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.requestOfferingInformation(
                offeringId,
                request.requestedNotes(),
                authentication
        ));
    }

    @PostMapping("/approve")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> approveOffering(
            @PathVariable UUID offeringId,
            @RequestBody(required = false) FinalizeOfferingVerificationRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.approveOffering(
                offeringId,
                request != null ? request.overrideReason() : null,
                authentication
        ));
    }

    @PostMapping("/reject")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> rejectOffering(
            @PathVariable UUID offeringId,
            @RequestBody RejectOfferingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.rejectOffering(
                offeringId,
                request.reason(),
                authentication
        ));
    }

    @PostMapping("/suspend")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> suspendOffering(
            @PathVariable UUID offeringId,
            @RequestBody SuspendOfferingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.suspendOffering(
                offeringId,
                request.reason(),
                authentication
        ));
    }

    @PostMapping("/deactivate")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> deactivateOffering(
            @PathVariable UUID offeringId,
            @RequestBody SuspendOfferingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.deactivateOffering(
                offeringId,
                request.reason(),
                authentication
        ));
    }
}
