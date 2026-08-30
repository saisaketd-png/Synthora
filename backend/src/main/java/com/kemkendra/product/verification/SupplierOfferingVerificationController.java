package com.kemkendra.product.verification;

import com.kemkendra.product.verification.dto.SupplierOfferingGovernanceWorkspaceDto;
import com.kemkendra.product.verification.dto.SupplierOfferingResponseRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/supplier/offerings/{offeringId}/verification")
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierOfferingVerificationController {

    private final SupplierOfferingVerificationService verificationService;

    public SupplierOfferingVerificationController(SupplierOfferingVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @GetMapping
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> getOfferingVerificationDetails(
            @PathVariable UUID offeringId) {
        return ResponseEntity.ok(verificationService.getOfferingVerificationDetails(offeringId));
    }

    @PostMapping("/respond")
    public ResponseEntity<SupplierOfferingGovernanceWorkspaceDto> submitResponse(
            @PathVariable UUID offeringId,
            @RequestBody SupplierOfferingResponseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.submitSupplierOfferingResponse(
                offeringId,
                authentication,
                request.responseNotes()
        ));
    }
}
