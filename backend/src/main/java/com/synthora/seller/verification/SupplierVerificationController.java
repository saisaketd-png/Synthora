package com.synthora.seller.verification;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.product.Supplier;
import com.synthora.product.SupplierRepository;
import com.synthora.seller.verification.dto.SupplierResponseRequest;
import com.synthora.seller.verification.dto.SupplierVerificationWorkspaceDto;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/supplier/verification")
@PreAuthorize("hasRole('SUPPLIER')")
public class SupplierVerificationController {

    private final SupplierVerificationService verificationService;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    public SupplierVerificationController(
            SupplierVerificationService verificationService,
            SupplierRepository supplierRepository,
            UserRepository userRepository) {
        this.verificationService = verificationService;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<SupplierVerificationWorkspaceDto> getMyVerificationDetails(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Supplier supplier = supplierRepository.findByUser(user)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier profile not found"));

        return ResponseEntity.ok(verificationService.getVerificationDetails(supplier.getId()));
    }

    @PostMapping("/respond")
    public ResponseEntity<SupplierVerificationWorkspaceDto> submitResponse(
            @RequestBody SupplierResponseRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(verificationService.submitSupplierResponse(
                authentication,
                request.responseNotes()
        ));
    }
}
